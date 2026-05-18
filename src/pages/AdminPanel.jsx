/**
 * AdminPanel.jsx — Beveiligd admin dashboard
 * Toegang via: /admin?secret=JOUW_ADMIN_SECRET
 * KYC aanvragen goedkeuren / afwijzen / blokkeren
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { parseError } from '../services/api';
import { useTaal } from '../i18n';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function tijdGeleden(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'zojuist';
  if (m < 60) return `${m} min geleden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} uur geleden`;
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  const map = {
    in_behandeling: { kleur: 'bg-amber-100 text-amber-700 border-amber-200',  label: '⏳ In behandeling' },
    goedgekeurd:    { kleur: 'bg-green-100 text-green-700 border-green-200',   label: '✅ Goedgekeurd'    },
    afgewezen:      { kleur: 'bg-red-100 text-red-700 border-red-200',         label: '❌ Afgewezen'      },
    geblokkeerd:    { kleur: 'bg-gray-200 text-gray-700 border-gray-300',      label: '🔒 Geblokkeerd'    },
    niet_ingediend: { kleur: 'bg-blue-100 text-blue-700 border-blue-200',      label: '📋 Niet ingediend' },
  };
  const s = map[status] || map.niet_ingediend;
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${s.kleur}`}>
      {s.label}
    </span>
  );
}

// ── KYC kaart ─────────────────────────────────────────────────────────────────
function KYCKaart({ aanvraag, secret, onRefresh }) {
  const { t } = useTaal();
  const [laden, setLaden] = useState(false);
  const [bezig, setBezig] = useState(null);

  async function beoordeel(beslissing) {
    if (!confirm(`Weet je zeker dat je deze aanvraag wilt ${beslissing}?`)) return;
    setLaden(true);
    setBezig(beslissing);
    try {
      const res = await fetch(`${API}/kyc/${aanvraag.id}/beoordeel`, {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({ beslissing }),
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.error || 'Fout'), { errorCode: data.errorCode, data });
      onRefresh();
    } catch (e) {
      alert('Fout: ' + parseError(e, t));
    } finally {
      setLaden(false);
      setBezig(null);
    }
  }

  return (
    <div className={`bg-white rounded-2xl border-2 p-5 space-y-4 ${
      aanvraag.status === 'in_behandeling' ? 'border-amber-300 shadow-amber-100 shadow-lg' : 'border-gray-100'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
            {aanvraag.naam?.[0] || '?'}
          </div>
          <div>
            <div className="font-bold text-gray-800">{aanvraag.naam}</div>
            <div className="text-sm text-gray-500">{aanvraag.email}</div>
            {aanvraag.telefoon && <div className="text-xs text-gray-400">{aanvraag.telefoon}</div>}
          </div>
        </div>
        <StatusBadge status={aanvraag.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {[
          ['Document', aanvraag.document_type],
          ['Nummer',   aanvraag.document_nummer],
          ['Geboortedatum', aanvraag.geboortedatum],
          ['Nationaliteit', aanvraag.nationaliteit || 'TR'],
          ['Ingediend', tijdGeleden(aanvraag.ingediend_op)],
          ['Beoordeeld', tijdGeleden(aanvraag.beoordeeld_op)],
        ].map(([label, waarde]) => (
          <div key={label} className="bg-gray-50 rounded-xl px-3 py-2">
            <div className="text-xs text-gray-400">{label}</div>
            <div className="font-medium text-gray-800 capitalize">{waarde || '—'}</div>
          </div>
        ))}
      </div>

      {aanvraag.status === 'in_behandeling' && (
        <div className="flex gap-2">
          <button
            onClick={() => beoordeel('goedgekeurd')}
            disabled={laden}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl transition text-sm">
            {bezig === 'goedgekeurd' ? '⏳' : '✅'} Goedkeuren
          </button>
          <button
            onClick={() => beoordeel('afgewezen')}
            disabled={laden}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl transition text-sm">
            {bezig === 'afgewezen' ? '⏳' : '❌'} Afwijzen
          </button>
          <button
            onClick={() => beoordeel('geblokkeerd')}
            disabled={laden}
            className="px-3 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl transition text-sm"
            title="Account blokkeren">
            {bezig === 'geblokkeerd' ? '⏳' : '🔒'}
          </button>
        </div>
      )}

      {aanvraag.status !== 'in_behandeling' && (
        <div className="flex gap-2">
          {aanvraag.status !== 'goedgekeurd' && (
            <button onClick={() => beoordeel('goedgekeurd')} disabled={laden}
              className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-2 rounded-xl transition text-sm">
              ✅ Alsnog goedkeuren
            </button>
          )}
          {aanvraag.status !== 'geblokkeerd' && (
            <button onClick={() => beoordeel('geblokkeerd')} disabled={laden}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl transition text-sm">
              🔒 Blokkeren
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat kaartje ──────────────────────────────────────────────────────────────
function StatKaart({ icoon, label, waarde, kleur }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="text-2xl mb-2">{icoon}</div>
      <div className={`text-2xl font-bold ${kleur}`}>{waarde}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { t } = useTaal();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const secret   = params.get('secret') || '';

  const [aanvragen,    setAanvragen   ] = useState([]);
  const [stats,        setStats       ] = useState(null);
  const [integriteit,  setIntegriteit ] = useState(null);
  const [filter,       setFilter      ] = useState('in_behandeling');
  const [laden,        setLaden       ] = useState(true);
  const [fout,         setFout        ] = useState('');

  const laadData = useCallback(async () => {
    setLaden(true);
    setFout('');
    try {
      const [kycRes, statsRes, integriteitRes] = await Promise.all([
        fetch(`${API}/kyc/alle`, {
        credentials: 'include', headers: { 'X-Admin-Secret': secret } }),
        fetch(`${API}/kyc/admin/stats`, {
        credentials: 'include', headers: { 'X-Admin-Secret': secret } }),
        fetch(`${API}/kyc/admin/integriteit`, {
        credentials: 'include', headers: { 'X-Admin-Secret': secret } }),
      ]);

      if (!kycRes.ok) {
        const d = await kycRes.json().catch(() => ({}));
        throw Object.assign(new Error(d.error || 'Geen toegang'), { errorCode: d.errorCode || d.code, data: d });
      }
      const kycData          = await kycRes.json();
      const statsData        = statsRes.ok ? await statsRes.json() : null;
      const integriteitData  = integriteitRes.ok ? await integriteitRes.json() : null;

      setAanvragen(kycData.aanvragen || []);
      setStats(statsData);
      setIntegriteit(integriteitData);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [secret]);

  useEffect(() => { laadData(); }, [laadData]);

  const gefilterd = aanvragen.filter(a => filter === 'alle' ? true : a.status === filter);

  if (!secret) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow max-w-sm w-full">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Admin toegang vereist</h2>
          <p className="text-gray-500 text-sm">Voeg <code className="bg-gray-100 px-1 rounded">?secret=...</code> toe aan de URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-2xl">⚡</button>
            <div>
              <div className="font-extrabold text-gray-900 leading-none">SwiftBridge Admin</div>
              <div className="text-xs text-amber-600 font-semibold">🔐 Beveiligd paneel</div>
            </div>
          </div>
          <button onClick={laadData} className="text-gray-400 hover:text-blue-600 text-xl transition" title="Vernieuwen">🔄</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Fout */}
        {fout && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-medium text-center">
            ❌ {fout}
          </div>
        )}

        {/* Audit log integriteit */}
        {integriteit && (
          <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
            integriteit.geldig
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'}`}>
            <span className="text-2xl">{integriteit.geldig ? '🔒' : '⚠️'}</span>
            <div>
              <div className="font-bold text-sm">
                {integriteit.geldig ? 'Audit log intact' : 'Audit log AANGETAST!'}
              </div>
              <div className="text-xs mt-0.5">
                {integriteit.geldig
                  ? `${integriteit.totaal} log entries — hash chain volledig geldig ✅`
                  : `Gebroken bij log ID ${integriteit.gebroken?.id} (${integriteit.gebroken?.actie})`}
              </div>
            </div>
          </div>
        )}

        {/* Statistieken */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatKaart icoon="👥" label="Gebruikers"        waarde={stats.gebruikers}                         kleur="text-blue-600"   />
            <StatKaart icoon="⏳" label="KYC in behandeling" waarde={stats.kyc?.in_behandeling || 0}           kleur="text-amber-600"  />
            <StatKaart icoon="✅" label="KYC goedgekeurd"    waarde={stats.kyc?.goedgekeurd || 0}              kleur="text-green-600"  />
            <StatKaart icoon="💶" label="Totaal verstuurd"
              waarde={`€${((stats.transacties?.voltooid?.totaal || 0)).toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              kleur="text-purple-600" />
          </div>
        )}

        {/* Filters */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">KYC Aanvragen</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'in_behandeling', label: `⏳ In behandeling (${aanvragen.filter(a => a.status === 'in_behandeling').length})` },
              { id: 'goedgekeurd',    label: `✅ Goedgekeurd (${aanvragen.filter(a => a.status === 'goedgekeurd').length})` },
              { id: 'afgewezen',      label: `❌ Afgewezen (${aanvragen.filter(a => a.status === 'afgewezen').length})` },
              { id: 'geblokkeerd',    label: `🔒 Geblokkeerd (${aanvragen.filter(a => a.status === 'geblokkeerd').length})` },
              { id: 'alle',           label: `📋 Alle (${aanvragen.length})` },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  filter === f.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* KYC lijst */}
        {laden ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl animate-pulse mb-2">⏳</div>
            <p>Laden...</p>
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            <div className="text-3xl mb-2">📭</div>
            <p>Geen aanvragen gevonden voor dit filter</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {gefilterd.map(a => (
              <KYCKaart key={a.id} aanvraag={a} secret={secret} onRefresh={laadData} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
