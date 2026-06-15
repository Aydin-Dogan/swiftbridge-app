/**
 * AdminCompliance.jsx — Compliance dashboard voor DNB-toezicht
 *
 * Tabs:
 * 1. Stats — kerncijfers
 * 2. Gebruikers — user management
 * 3. Audit logs — paginated met filter
 * 4. Sanctie matches — Wwft Art. 33
 * 5. GDPR acties — AVG Art. 15/17
 * 6. Transactie monitoring — geanonimiseerd
 * 7. Banners — app-wide announcement banners beheren
 *
 * Toegang: gebruiker moet ingelogd zijn EN in ADMIN_EMAILS staan
 * (backend check in src/middleware/admin.js).
 */
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, parseError } from '../services/api';
import { useTaal } from '../i18n';
import {
  Users, Clock, CheckCircle, Euro, Calendar, Shield, Clipboard, Lock,
  AlertTriangle, IdCard, Banknote, Bell, Zap, Refresh,
} from '../components/icons/Icons';

// Lazy load heavy admin sub-components — alleen ophalen wanneer tab geopend wordt.
// Houdt de initial AdminCompliance bundle ~1MB+ kleiner (UserManagement 664 LOC + BannerBeheer 412 LOC).
const UserManagement = lazy(() => import('../components/admin/UserManagement'));
const BannerBeheer = lazy(() => import('../components/admin/BannerBeheer'));
const KYCReviewQueue = lazy(() => import('../components/admin/KYCReviewQueue'));

// Lichtgewicht fallback voor lazy admin tabs
function AdminLazyFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-brand-500"></div>
    </div>
  );
}

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
function StatCard({ icoon: Icoon, label, waarde, sub, kleur = 'text-ink-1' }) {
  return (
    <div className="bg-surface border border-border rounded-md p-5 shadow-soft">
      {Icoon && <Icoon className="w-7 h-7 mb-2 text-gray-500" />}
      <div className={`font-display text-2xl font-medium tabular-nums ${kleur}`}>{waarde}</div>
      <div className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-ink-3 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── ChainStatus ───────────────────────────────────────────────────────────────
function ChainStatus({ resultaat }) {
  if (!resultaat) return null;
  const ok = resultaat.geldig;
  return (
    <div className={`rounded-md border p-4 flex items-center gap-3 ${
      ok ? 'bg-success-50 border-success-100 text-success-700'
         : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {ok ? <Lock className="w-6 h-6 flex-shrink-0" /> : <AlertTriangle className="w-6 h-6 flex-shrink-0" />}
      <div>
        <div className="font-semibold text-sm">
          {ok ? 'Audit log hash-chain intact' : 'Audit log AANGETAST!'}
        </div>
        <div className="text-xs mt-0.5 opacity-80">
          {ok
            ? `${resultaat.totaal} entries geverifieerd — chain is consistent`
            : `Gebroken bij log ID ${resultaat.gebroken?.id} (${resultaat.gebroken?.actie})`}
        </div>
      </div>
    </div>
  );
}

// ── Tab 1: Stats ──────────────────────────────────────────────────────────────
function StatsTab({ stats, chain }) {
  if (!stats) {
    return <div className="text-center text-ink-2 py-12">Laden…</div>;
  }
  return (
    <div className="space-y-6">
      <ChainStatus resultaat={chain} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icoon={Users} label="Gebruikers totaal" waarde={stats.gebruikers} />
        <StatCard icoon={Clock} label="KYC in behandeling" waarde={stats.kycInBehandeling} kleur="text-accent-600" />
        <StatCard icoon={CheckCircle} label="KYC goedgekeurd" waarde={stats.kycGoedgekeurd} kleur="text-success-700" />
        <StatCard icoon={Euro} label="Totaal volume" waarde={fmtEur(stats.totaalVolumeEur)} kleur="text-ink-1" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icoon={Calendar}
          label="Laatste 7 dagen"
          waarde={fmtEur(stats.transacties7d?.totaalEur)}
          sub={`${stats.transacties7d?.aantal || 0} transacties`}
          kleur="text-brand-700"
        />
        <StatCard
          icoon={Calendar}
          label="Laatste 30 dagen"
          waarde={fmtEur(stats.transacties30d?.totaalEur)}
          sub={`${stats.transacties30d?.aantal || 0} transacties`}
          kleur="text-brand-600"
        />
        <StatCard
          icoon={Shield}
          label="Sanctie hits"
          waarde={stats.sanctieHits}
          sub="Wwft Art. 33"
          kleur={stats.sanctieHits > 0 ? 'text-red-700' : 'text-ink-1'}
        />
        <StatCard
          icoon={Clipboard}
          label="GDPR acties"
          waarde={stats.gdprActies}
          sub="AVG Art. 15/17"
          kleur="text-brand-600"
        />
      </div>

      <div className="text-xs text-gray-500 text-right">
        Bijgewerkt: {fmtDatum(stats.genereerdOp)}
      </div>
    </div>
  );
}

// ── Tab 2: Audit logs ─────────────────────────────────────────────────────────
const ACTIE_OPTIES = [
  { id: '', label: 'Alle acties' },
  { id: 'kyc_ingediend', label: 'KYC ingediend' },
  { id: 'kyc_goedgekeurd', label: 'KYC goedgekeurd' },
  { id: 'kyc_afgewezen', label: 'KYC afgewezen' },
  { id: 'kyc_geblokkeerd', label: 'KYC geblokkeerd' },
  { id: 'sanctie_screening', label: 'Sanctie screening' },
  { id: 'gdpr_export', label: 'GDPR export' },
  { id: 'gdpr_anonimiseer', label: 'GDPR anonimiseer' },
  { id: 'profiel_bijgewerkt', label: 'Profiel bijgewerkt' },
  { id: 'login', label: 'Login' },
];

function AuditTab() {
  const { t } = useTaal();
  const [logs, setLogs] = useState([]);
  const [totaal, setTotaal] = useState(0);
  const [actie, setActie] = useState('');
  const [offset, setOffset] = useState(0);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');
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
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
        >
          {ACTIE_OPTIES.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <div className="text-xs text-ink-2 tabular-nums">
          {totaal} resultaten · pagina {Math.floor(offset / limit) + 1} / {Math.max(1, Math.ceil(totaal / limit))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0 || laden}
          className="px-3 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 disabled:opacity-40 hover:bg-surface-3 transition"
        >
          ← Vorige
        </button>
        <button
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= totaal || laden}
          className="px-3 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 disabled:opacity-40 hover:bg-surface-3 transition"
        >
          Volgende →
        </button>
      </div>

      {fout && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{fout}</div>
      )}

      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-3 border-b border-border">
              <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Actie</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Tijdstip</th>
                <th className="px-4 py-3">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {laden ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-2">Laden…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-2">Geen logs gevonden</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-3 transition">
                  <td className="px-4 py-3 font-mono text-xs text-ink-2 tabular-nums">{log.id}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-surface-3 text-ink-2 text-xs font-semibold px-2 py-1 rounded-full border border-border">
                      {log.actie}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-2">{log.userId ? shortId(log.userId) : '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.ipAdres || '—'}</td>
                  <td className="px-4 py-3 text-xs text-ink-2">{fmtDatum(log.aangemaaktOp)}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-gray-500" title={log.logHash}>
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
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');

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

  if (laden) return <div className="text-center text-ink-2 py-12">Laden…</div>;
  if (fout) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{fout}</div>;
  if (matches.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-md p-8 text-center text-ink-2">
        <Shield className="w-10 h-10 mx-auto mb-3 text-gray-500" />
        <p className="font-semibold">Geen sanctie hits</p>
        <p className="text-xs text-gray-500 mt-2">Wwft Art. 33 — alle screenings hebben geen match opgeleverd.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 text-sm">
        <strong>{matches.length} sanctie-hit{matches.length !== 1 ? 's' : ''}</strong> — Wwft Art. 33 vereist directe melding bij DNB/FIU-NL.
      </div>
      {matches.map((m) => (
        <div key={m.id} className="bg-surface border border-border rounded-md p-5 space-y-3 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display font-medium text-ink-1">{m.gecheckteNaam || m.userNaam || '—'}</div>
              <div className="text-xs text-ink-2">{m.userEmail || shortId(m.userId)}</div>
              <div className="text-xs text-gray-500 mt-1">Context: {m.context || '—'} · {m.source || 'EU list'}</div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-red-100 border border-red-200 text-red-700 text-xs font-bold px-3 py-1 rounded-full tabular-nums">
                Score {m.score != null ? Math.round(m.score * 100) + '%' : '—'}
              </div>
              <div className="text-xs text-gray-500 mt-2">{fmtDatum(m.aangemaaktOp)}</div>
            </div>
          </div>
          {m.besteMatch && (
            <div className="bg-surface-3 rounded-md p-3 text-xs text-ink-2">
              <span className="text-gray-500">Beste match: </span>
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
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');

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

  if (laden) return <div className="text-center text-ink-2 py-12">Laden…</div>;
  if (fout) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{fout}</div>;
  if (acties.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-md p-8 text-center text-ink-2">
        <Clipboard className="w-10 h-10 mx-auto mb-3 text-gray-500" />
        <p className="font-semibold">Geen GDPR acties gelogd</p>
        <p className="text-xs text-gray-500 mt-2">AVG Art. 15 (inzage) en Art. 17 (vergetelheid) worden hier zichtbaar als gebruikers ze uitvoeren.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-3 border-b border-border">
            <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Gebruiker</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Tijdstip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {acties.map((a) => (
              <tr key={a.id} className="hover:bg-surface-3 transition">
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${
                    a.type === 'gdpr_anonimiseer'
                      ? 'bg-red-100 border-red-200 text-red-700'
                      : 'bg-brand-50 border-brand-100 text-brand-700'
                  }`}>
                    {a.type === 'gdpr_anonimiseer' ? 'Art. 17 — Vergetelheid' : 'Art. 15 — Inzage'}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-2">{a.userNaam || '—'}</td>
                <td className="px-4 py-3 text-ink-2 text-xs">{a.userEmail || shortId(a.userId)}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.ipAdres || '—'}</td>
                <td className="px-4 py-3 text-xs text-ink-2">{fmtDatum(a.aangemaaktOp)}</td>
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
  const [tx, setTx] = useState([]);
  const [status, setStatus] = useState('');
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');

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
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
        >
          <option value="">Alle statussen</option>
          <option value="voltooid">Voltooid</option>
          <option value="in_behandeling">In behandeling</option>
          <option value="mislukt">Mislukt</option>
          <option value="geannuleerd">Geannuleerd</option>
        </select>
        <div className="text-xs text-ink-2 tabular-nums">
          {tx.length} transacties · {suspiciousCount > 0 && <span className="text-accent-600 font-semibold">{suspiciousCount} verdacht (≥€2000)</span>}
        </div>
      </div>

      {fout && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{fout}</div>}

      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-3 border-b border-border">
              <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 text-right">EUR</th>
                <th className="px-4 py-3 text-right">Fee</th>
                <th className="px-4 py-3 text-right">TRY</th>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aangemaakt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {laden ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-ink-2">Laden…</td></tr>
              ) : tx.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-ink-2">Geen transacties</td></tr>
              ) : tx.map((t) => (
                <tr key={t.id} className={`hover:bg-surface-3 transition ${t.suspicious ? 'bg-accent-400/10' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-ink-2">{t.referentieNr || shortId(t.id)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.userIdMasked}</td>
                  <td className="px-4 py-3 text-right text-ink-1 font-semibold tabular-nums">
                    {fmtEur(t.eurBedrag)}
                    {t.suspicious && <span className="ml-1 text-accent-600 inline-block align-text-bottom" title="Suspicious: ≥€2000"><AlertTriangle className="w-4 h-4" /></span>}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-2 tabular-nums">{fmtEur(t.feeEur)}</td>
                  <td className="px-4 py-3 text-right text-ink-2 tabular-nums">
                    {new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(t.tryBedrag)} {t.valuta || 'TRY'}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">{t.ontvangerBank}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-surface-3 text-ink-2 text-xs font-semibold px-2 py-1 rounded-full border border-border">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">{fmtDatum(t.aangemaaktOp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Geen PII (IBAN/ontvanger-namen) zichtbaar — alleen geanonimiseerde monitoring data.
      </div>
    </div>
  );
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────
export default function AdminCompliance() {
  const { t } = useTaal();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [chain, setChain] = useState(null);
  const [fout, setFout] = useState('');
  const [laden, setLaden] = useState(true);

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
    { id: 'stats', label: 'Overzicht', icoon: null },
    { id: 'users', label: 'Gebruikers', icoon: Users },
    { id: 'kycreview', label: 'KYC Review', icoon: IdCard },
    { id: 'audit', label: 'Audit logs', icoon: Clipboard },
    { id: 'sanctie', label: 'Sanctie matches', icoon: Shield },
    { id: 'gdpr', label: 'GDPR acties', icoon: Lock },
    { id: 'tx', label: 'Transacties', icoon: Banknote },
    { id: 'banners', label: 'Banners', icoon: Bell },
  ];

  if (fout && !stats) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
        <div className="bg-surface border border-border rounded-md p-8 max-w-md text-center shadow-soft">
          <Lock className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <h2 className="font-display text-xl font-medium text-ink-1 mb-2">Geen admin toegang</h2>
          <p className="text-ink-2 text-sm mb-6">{fout}</p>
          <button
            onClick={() => navigate('/app')}
            className="btn-inst"
          >
            ← Terug naar app
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app')} className="text-brand-600"><Zap className="w-7 h-7" /></button>
            <div>
              <div className="font-display font-medium text-ink-1 leading-none">SwiftBridge Compliance</div>
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-accent-600">DNB toezicht · Wwft · AVG</div>
            </div>
          </div>
          <button
            onClick={laadStats}
            disabled={laden}
            className="text-gray-500 hover:text-brand-600 disabled:opacity-40 transition"
            title="Vernieuwen"
          >
            <Refresh className="w-5 h-5" />
          </button>
        </div>

        {/* Tab strip */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto -mb-px">
          {tabs.map((tt) => (
            <button
              key={tt.id}
              onClick={() => setTab(tt.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] whitespace-nowrap transition border-b-2 ${
                tab === tt.id
                  ? 'text-brand-700 border-brand-500'
                  : 'text-gray-500 border-transparent hover:text-ink-1'
              }`}
            >
              {tt.icoon && <tt.icoon className="w-4 h-4" />}
              <span>{tt.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={<AdminLazyFallback />}>
          {tab === 'stats' && <StatsTab stats={stats} chain={chain} />}
          {tab === 'users' && <UserManagement />}
          {tab === 'kycreview' && <KYCReviewQueue />}
          {tab === 'audit' && <AuditTab />}
          {tab === 'sanctie' && <SanctieTab />}
          {tab === 'gdpr' && <GdprTab />}
          {tab === 'tx' && <TransactieTab />}
          {tab === 'banners' && <BannerBeheer />}
        </Suspense>
      </main>
    </div>
  );
}
