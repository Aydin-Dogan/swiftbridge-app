/**
 * AdminCompliance.jsx — Compliance dashboard voor DNB-toezicht
 *
 * 5 tabs:
 *   1. Stats — kerncijfers
 *   2. Audit logs — paginated met filter
 *   3. Sanctie matches — Wwft Art. 33
 *   4. GDPR acties — AVG Art. 15/17
 *   5. Transactie monitoring — geanonimiseerd
 *
 * Toegang: gebruiker moet ingelogd zijn EN in ADMIN_EMAILS staan
 * (backend check in src/middleware/admin.js).
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, parseError } from '../services/api';
import { useTaal } from '../i18n';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function fmtDatum(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function shortId(id) {
  if (!id) return '—';
  return String(id).slice(0, 8) + '…';
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icoon, label, waarde, sub, kleur = 'text-white' }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 shadow-lg">
      <div className="text-3xl mb-2">{icoon}</div>
      <div className={`text-2xl font-extrabold ${kleur}`}>{waarde}</div>
      <div className="text-xs text-white/70 mt-1">{label}</div>
      {sub && <div className="text-xs text-white/50 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── ChainStatus ───────────────────────────────────────────────────────────────
function ChainStatus({ resultaat }) {
  if (!resultaat) return null;
  const ok = resultaat.geldig;
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 backdrop-blur-lg ${
      ok ? 'bg-green-500/10 border-green-300/30 text-green-100'
         : 'bg-red-500/10 border-red-300/40 text-red-100'
    }`}>
      <span className="text-2xl">{ok ? '🔒' : '⚠️'}</span>
      <div>
        <div className="font-bold text-sm">
          {ok ? 'Audit log hash-chain intact' : 'Audit log AANGETAST!'}
        </div>
        <div className="text-xs mt-0.5 opacity-80">
          {ok
            ? `${resultaat.totaal} entries geverifieerd — chain is consistent ✅`
            : `Gebroken bij log ID ${resultaat.gebroken?.id} (${resultaat.gebroken?.actie})`}
        </div>
      </div>
    </div>
  );
}

// ── Tab 1: Stats ──────────────────────────────────────────────────────────────
function StatsTab({ stats, chain }) {
  if (!stats) {
    return <div className="text-center text-white/60 py-12">Laden…</div>;
  }
  return (
    <div className="space-y-6">
      <ChainStatus resultaat={chain} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icoon="👥" label="Gebruikers totaal" waarde={stats.gebruikers} />
        <StatCard icoon="⏳" label="KYC in behandeling" waarde={stats.kycInBehandeling} kleur="text-amber-300" />
        <StatCard icoon="✅" label="KYC goedgekeurd" waarde={stats.kycGoedgekeurd} kleur="text-green-300" />
        <StatCard icoon="💶" label="Totaal volume" waarde={fmtEur(stats.totaalVolumeEur)} kleur="text-purple-300" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icoon="📅"
          label="Laatste 7 dagen"
          waarde={fmtEur(stats.transacties7d?.totaalEur)}
          sub={`${stats.transacties7d?.aantal || 0} transacties`}
          kleur="text-blue-300"
        />
        <StatCard
          icoon="🗓️"
          label="Laatste 30 dagen"
          waarde={fmtEur(stats.transacties30d?.totaalEur)}
          sub={`${stats.transacties30d?.aantal || 0} transacties`}
          kleur="text-blue-200"
        />
        <StatCard
          icoon="🛂"
          label="Sanctie hits"
          waarde={stats.sanctieHits}
          sub="Wwft Art. 33"
          kleur={stats.sanctieHits > 0 ? 'text-red-300' : 'text-white'}
        />
        <StatCard
          icoon="📜"
          label="GDPR acties"
          waarde={stats.gdprActies}
          sub="AVG Art. 15/17"
          kleur="text-cyan-300"
        />
      </div>

      <div className="text-xs text-white/40 text-right">
        Bijgewerkt: {fmtDatum(stats.genereerdOp)}
      </div>
    </div>
  );
}

// ── Tab 2: Audit logs ─────────────────────────────────────────────────────────
const ACTIE_OPTIES = [
  { id: '',                  label: 'Alle acties' },
  { id: 'kyc_ingediend',     label: 'KYC ingediend' },
  { id: 'kyc_goedgekeurd',   label: 'KYC goedgekeurd' },
  { id: 'kyc_afgewezen',     label: 'KYC afgewezen' },
  { id: 'kyc_geblokkeerd',   label: 'KYC geblokkeerd' },
  { id: 'sanctie_screening', label: 'Sanctie screening' },
  { id: 'gdpr_export',       label: 'GDPR export' },
  { id: 'gdpr_anonimiseer',  label: 'GDPR anonimiseer' },
  { id: 'profiel_bijgewerkt', label: 'Profiel bijgewerkt' },
  { id: 'login',             label: 'Login' },
];

function AuditTab() {
  const { t } = useTaal();
  const [logs, setLogs]     = useState([]);
  const [totaal, setTotaal] = useState(0);
  const [actie, setActie]   = useState('');
  const [offset, setOffset] = useState(0);
  const [laden, setLaden]   = useState(false);
  const [fout, setFout]     = useState('');
  const limit = 50;

  const laden_ = useCallback(async () => {
    setLaden(true); setFout('');
    try {
      const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (actie) qs.set('actie', actie);
      const data = await apiFetch(`/admin/audit-logs?${qs.toString()}`);
      setLogs(data.logs || []);
      setTotaal(data.totaal || 0);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [actie, offset, t]);

  useEffect(() => { laden_(); }, [laden_]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={actie}
          onChange={(e) => { setActie(e.target.value); setOffset(0); }}
          className="bg-white/10 border border-white/20 backdrop-blur-lg rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {ACTIE_OPTIES.map((o) => (
            <option key={o.id} value={o.id} className="text-gray-900">{o.label}</option>
          ))}
        </select>
        <div className="text-xs text-white/60">
          {totaal} resultaten · pagina {Math.floor(offset / limit) + 1} / {Math.max(1, Math.ceil(totaal / limit))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0 || laden}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white disabled:opacity-40 hover:bg-white/20 transition"
        >
          ← Vorige
        </button>
        <button
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= totaal || laden}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white disabled:opacity-40 hover:bg-white/20 transition"
        >
          Volgende →
        </button>
      </div>

      {fout && (
        <div className="bg-red-500/10 border border-red-300/30 text-red-100 rounded-2xl p-3 text-sm">{fout}</div>
      )}

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/10">
              <tr className="text-left text-white/80">
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Actie</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">IP</th>
                <th className="px-4 py-3 font-semibold">Tijdstip</th>
                <th className="px-4 py-3 font-semibold">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {laden ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-white/60">Laden…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-white/60">Geen logs gevonden</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-mono text-xs text-white/70">{log.id}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-white/10 text-white text-xs font-semibold px-2 py-1 rounded-full border border-white/20">
                      {log.actie}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/70">{log.userId ? shortId(log.userId) : '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/50">{log.ipAdres || '—'}</td>
                  <td className="px-4 py-3 text-xs text-white/70">{fmtDatum(log.aangemaaktOp)}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-white/40" title={log.logHash}>
                    {log.logHash ? log.logHash.slice(0, 12) + '…' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Sanctie matches ────────────────────────────────────────────────────
function SanctieTab() {
  const { t } = useTaal();
  const [matches, setMatches] = useState([]);
  const [laden, setLaden]     = useState(true);
  const [fout, setFout]       = useState('');

  useEffect(() => {
    (async () => {
      setLaden(true); setFout('');
      try {
        const data = await apiFetch('/admin/sanctie-matches');
        setMatches(data.matches || []);
      } catch (e) {
        setFout(parseError(e, t));
      } finally {
        setLaden(false);
      }
    })();
  }, [t]);

  if (laden) return <div className="text-center text-white/60 py-12">Laden…</div>;
  if (fout)   return <div className="bg-red-500/10 border border-red-300/30 text-red-100 rounded-2xl p-3 text-sm">{fout}</div>;
  if (matches.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center text-white/70">
        <div className="text-4xl mb-3">🛂</div>
        <p className="font-semibold">Geen sanctie hits</p>
        <p className="text-xs text-white/50 mt-2">Wwft Art. 33 — alle screenings hebben geen match opgeleverd.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-red-500/10 border border-red-300/30 rounded-2xl p-4 text-red-100 text-sm">
        <strong>⚠️ {matches.length} sanctie-hit{matches.length !== 1 ? 's' : ''}</strong> — Wwft Art. 33 vereist directe melding bij DNB/FIU-NL.
      </div>
      {matches.map((m) => (
        <div key={m.id} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-white">{m.gecheckteNaam || m.userNaam || '—'}</div>
              <div className="text-xs text-white/60">{m.userEmail || shortId(m.userId)}</div>
              <div className="text-xs text-white/50 mt-1">Context: {m.context || '—'} · {m.source || 'EU list'}</div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-red-500/20 border border-red-300/30 text-red-200 text-xs font-bold px-3 py-1 rounded-full">
                Score {m.score != null ? Math.round(m.score * 100) + '%' : '—'}
              </div>
              <div className="text-xs text-white/40 mt-2">{fmtDatum(m.aangemaaktOp)}</div>
            </div>
          </div>
          {m.besteMatch && (
            <div className="bg-black/20 rounded-xl p-3 text-xs text-white/80">
              <span className="text-white/50">Beste match: </span>
              <span className="font-mono">{m.besteMatch}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab 4: GDPR acties ────────────────────────────────────────────────────────
function GdprTab() {
  const { t } = useTaal();
  const [acties, setActies] = useState([]);
  const [laden, setLaden]   = useState(true);
  const [fout, setFout]     = useState('');

  useEffect(() => {
    (async () => {
      setLaden(true); setFout('');
      try {
        const data = await apiFetch('/admin/gdpr-actions');
        setActies(data.acties || []);
      } catch (e) {
        setFout(parseError(e, t));
      } finally {
        setLaden(false);
      }
    })();
  }, [t]);

  if (laden) return <div className="text-center text-white/60 py-12">Laden…</div>;
  if (fout)   return <div className="bg-red-500/10 border border-red-300/30 text-red-100 rounded-2xl p-3 text-sm">{fout}</div>;
  if (acties.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center text-white/70">
        <div className="text-4xl mb-3">📜</div>
        <p className="font-semibold">Geen GDPR acties gelogd</p>
        <p className="text-xs text-white/50 mt-2">AVG Art. 15 (inzage) en Art. 17 (vergetelheid) worden hier zichtbaar als gebruikers ze uitvoeren.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/10">
            <tr className="text-left text-white/80">
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Gebruiker</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">IP</th>
              <th className="px-4 py-3 font-semibold">Tijdstip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {acties.map((a) => (
              <tr key={a.id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${
                    a.type === 'gdpr_anonimiseer'
                      ? 'bg-red-500/20 border-red-300/30 text-red-200'
                      : 'bg-blue-500/20 border-blue-300/30 text-blue-200'
                  }`}>
                    {a.type === 'gdpr_anonimiseer' ? 'Art. 17 — Vergetelheid' : 'Art. 15 — Inzage'}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/80">{a.userNaam || '—'}</td>
                <td className="px-4 py-3 text-white/70 text-xs">{a.userEmail || shortId(a.userId)}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/50">{a.ipAdres || '—'}</td>
                <td className="px-4 py-3 text-xs text-white/70">{fmtDatum(a.aangemaaktOp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 5: Transactie monitoring ──────────────────────────────────────────────
function TransactieTab() {
  const { t } = useTaal();
  const [tx, setTx]         = useState([]);
  const [status, setStatus] = useState('');
  const [laden, setLaden]   = useState(true);
  const [fout, setFout]     = useState('');

  const laad = useCallback(async () => {
    setLaden(true); setFout('');
    try {
      const qs = new URLSearchParams({ limit: '200' });
      if (status) qs.set('status', status);
      const data = await apiFetch(`/admin/transacties?${qs.toString()}`);
      setTx(data.transacties || []);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [status, t]);

  useEffect(() => { laad(); }, [laad]);

  const suspiciousCount = tx.filter((t) => t.suspicious).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white/10 border border-white/20 backdrop-blur-lg rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="" className="text-gray-900">Alle statussen</option>
          <option value="voltooid" className="text-gray-900">Voltooid</option>
          <option value="in_behandeling" className="text-gray-900">In behandeling</option>
          <option value="mislukt" className="text-gray-900">Mislukt</option>
          <option value="geannuleerd" className="text-gray-900">Geannuleerd</option>
        </select>
        <div className="text-xs text-white/60">
          {tx.length} transacties · {suspiciousCount > 0 && <span className="text-amber-300 font-semibold">{suspiciousCount} verdacht (≥€2000)</span>}
        </div>
      </div>

      {fout && <div className="bg-red-500/10 border border-red-300/30 text-red-100 rounded-2xl p-3 text-sm">{fout}</div>}

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/10">
              <tr className="text-left text-white/80">
                <th className="px-4 py-3 font-semibold">Ref</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold text-right">EUR</th>
                <th className="px-4 py-3 font-semibold text-right">Fee</th>
                <th className="px-4 py-3 font-semibold text-right">TRY</th>
                <th className="px-4 py-3 font-semibold">Bank</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Aangemaakt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {laden ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-white/60">Laden…</td></tr>
              ) : tx.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-white/60">Geen transacties</td></tr>
              ) : tx.map((t) => (
                <tr key={t.id} className={`hover:bg-white/5 transition ${t.suspicious ? 'bg-amber-500/5' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-white/70">{t.referentieNr || shortId(t.id)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{t.userIdMasked}</td>
                  <td className="px-4 py-3 text-right text-white font-semibold">
                    {fmtEur(t.eurBedrag)}
                    {t.suspicious && <span className="ml-1 text-amber-300" title="Suspicious: ≥€2000">⚠️</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-white/70">{fmtEur(t.feeEur)}</td>
                  <td className="px-4 py-3 text-right text-white/70">
                    {new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(t.tryBedrag)} {t.valuta || 'TRY'}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/70">{t.ontvangerBank}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-white/10 text-white text-xs font-semibold px-2 py-1 rounded-full border border-white/20">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60">{fmtDatum(t.aangemaaktOp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-white/40">
        Geen PII (IBAN/ontvanger-namen) zichtbaar — alleen geanonimiseerde monitoring data.
      </div>
    </div>
  );
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────
export default function AdminCompliance() {
  const { t } = useTaal();
  const navigate = useNavigate();
  const [tab, setTab]       = useState('stats');
  const [stats, setStats]   = useState(null);
  const [chain, setChain]   = useState(null);
  const [fout, setFout]     = useState('');
  const [laden, setLaden]   = useState(true);

  const laadStats = useCallback(async () => {
    setLaden(true); setFout('');
    try {
      const [statsData, chainData] = await Promise.all([
        apiFetch('/admin/stats'),
        apiFetch('/admin/audit-logs/verify-chain'),
      ]);
      setStats(statsData);
      setChain(chainData);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [t]);

  useEffect(() => { laadStats(); }, [laadStats]);

  const tabs = [
    { id: 'stats',      label: 'Overzicht',         icoon: '📊' },
    { id: 'audit',      label: 'Audit logs',         icoon: '📋' },
    { id: 'sanctie',    label: 'Sanctie matches',    icoon: '🛂' },
    { id: 'gdpr',       label: 'GDPR acties',        icoon: '📜' },
    { id: 'tx',         label: 'Transacties',        icoon: '💸' },
  ];

  if (fout && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md text-center text-white">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-xl font-bold mb-2">Geen admin toegang</h2>
          <p className="text-white/70 text-sm mb-6">{fout}</p>
          <button
            onClick={() => navigate('/app')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition"
          >
            ← Terug naar app
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app')} className="text-2xl">⚡</button>
            <div>
              <div className="font-extrabold text-white leading-none">SwiftBridge Compliance</div>
              <div className="text-xs text-amber-300 font-semibold">DNB toezicht · Wwft · AVG</div>
            </div>
          </div>
          <button
            onClick={laadStats}
            disabled={laden}
            className="text-white/70 hover:text-white text-xl disabled:opacity-40 transition"
            title="Vernieuwen"
          >
            🔄
          </button>
        </div>

        {/* Tab strip */}
        <div className="max-w-7xl mx-auto px-4 pb-1 flex gap-1 overflow-x-auto">
          {tabs.map((tt) => (
            <button
              key={tt.id}
              onClick={() => setTab(tt.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition rounded-t-xl ${
                tab === tt.id
                  ? 'text-white bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tt.icoon}</span>
              <span>{tt.label}</span>
              {tab === tt.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'stats'   && <StatsTab stats={stats} chain={chain} />}
        {tab === 'audit'   && <AuditTab />}
        {tab === 'sanctie' && <SanctieTab />}
        {tab === 'gdpr'    && <GdprTab />}
        {tab === 'tx'      && <TransactieTab />}
      </main>
    </div>
  );
}
