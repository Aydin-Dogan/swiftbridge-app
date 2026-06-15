/**
 * AdminPanel.jsx — Beveiligd admin dashboard
 * Toegang via: /admin?secret=JOUW_ADMIN_SECRET
 * KYC aanvragen goedkeuren / afwijzen / blokkeren
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { parseError } from '../services/api';
import { useTaal } from '../i18n';
import {
  Users, Clock, CheckCircle, XCircle, Euro, Lock, AlertTriangle, Zap, Refresh, Mail,
} from '../components/icons/Icons';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function tijdGeleden(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'zojuist';
  if (m < 60) return `${m} min geleden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} uur geleden`;
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  const { t } = useTaal();
  const map = {
    in_behandeling: { kleur: 'bg-accent-400/15 text-accent-600 border-accent-400/30', label: `${t('admin_status_in_behandeling') || 'In behandeling'}` },
    goedgekeurd: { kleur: 'bg-success-50 text-success-700 border-success-100', label: `${t('admin_status_goedgekeurd') || 'Goedgekeurd'}` },
    afgewezen: { kleur: 'bg-red-100 text-red-700 border-red-200', label: `${t('admin_status_afgewezen') || 'Afgewezen'}` },
    geblokkeerd: { kleur: 'bg-surface-3 text-ink-2 border-border', label: `${t('admin_status_geblokkeerd') || 'Geblokkeerd'}` },
    niet_ingediend: { kleur: 'bg-brand-50 text-brand-700 border-brand-100', label: `${t('admin_status_niet_ingediend') || 'Niet ingediend'}` },
  };
  const s = map[status] || map.niet_ingediend;
  return (
    <span className={`inline-flex items-center text-[0.7rem] font-medium uppercase tracking-[0.16em] px-2.5 py-1 rounded-full border ${s.kleur}`}>
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
    <div className={`bg-surface rounded-md border p-5 space-y-4 shadow-soft ${
      aanvraag.status === 'in_behandeling' ? 'border-accent-400/40' : 'border-border'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center font-display text-xl font-medium text-brand-700">
            {aanvraag.naam?.[0] || '?'}
          </div>
          <div>
            <div className="font-display font-medium text-ink-1">{aanvraag.naam}</div>
            <div className="text-sm text-ink-2">{aanvraag.email}</div>
            {aanvraag.telefoon && <div className="text-xs text-ink-3">{aanvraag.telefoon}</div>}
          </div>
        </div>
        <StatusBadge status={aanvraag.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {[
          [t('admin_kyc_document') || 'Document', aanvraag.document_type],
          [t('admin_kyc_nummer') || 'Nummer', aanvraag.document_nummer],
          [t('admin_kyc_geboortedatum') || 'Geboortedatum', aanvraag.geboortedatum],
          [t('admin_kyc_nationaliteit') || 'Nationaliteit', aanvraag.nationaliteit || 'TR'],
          [t('admin_kyc_ingediend') || 'Ingediend', tijdGeleden(aanvraag.ingediend_op)],
          [t('admin_kyc_beoordeeld') || 'Beoordeeld', tijdGeleden(aanvraag.beoordeeld_op)],
        ].map(([label, waarde]) => (
          <div key={label} className="bg-surface-3 rounded-md px-3 py-2">
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500">{label}</div>
            <div className="font-medium text-ink-1 capitalize">{waarde || '—'}</div>
          </div>
        ))}
      </div>

      {aanvraag.status === 'in_behandeling' && (
        <div className="flex gap-2">
          <button
            onClick={() => beoordeel('goedgekeurd')}
            disabled={laden}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-success-600 hover:bg-success-700 disabled:opacity-50 text-white font-medium uppercase tracking-[0.18em] py-2.5 rounded-md transition text-[0.7rem]">
            {bezig === 'goedgekeurd' ? <Clock className="w-4 h-4 inline-block align-text-bottom" /> : <CheckCircle className="w-4 h-4 inline-block align-text-bottom" />} {t('admin_actie_goedkeuren') || 'Goedkeuren'}
          </button>
          <button
            onClick={() => beoordeel('afgewezen')}
            disabled={laden}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium uppercase tracking-[0.18em] py-2.5 rounded-md transition text-[0.7rem]">
            {bezig === 'afgewezen' ? <Clock className="w-4 h-4 inline-block align-text-bottom" /> : <XCircle className="w-4 h-4 inline-block align-text-bottom" />} {t('admin_actie_afwijzen') || 'Afwijzen'}
          </button>
          <button
            onClick={() => beoordeel('geblokkeerd')}
            disabled={laden}
            className="px-3 bg-ink-1 hover:opacity-90 disabled:opacity-50 text-white font-medium py-2.5 rounded-md transition text-[0.7rem]"
            title={t('admin_actie_blokkeren_tooltip') || 'Account blokkeren'}>
            {bezig === 'geblokkeerd' ? <Clock className="w-4 h-4 inline-block align-text-bottom" /> : <Lock className="w-4 h-4 inline-block align-text-bottom" />}
          </button>
        </div>
      )}

      {aanvraag.status !== 'in_behandeling' && (
        <div className="flex gap-2">
          {aanvraag.status !== 'goedgekeurd' && (
            <button onClick={() => beoordeel('goedgekeurd')} disabled={laden}
              className="flex-1 bg-success-50 hover:bg-success-100 text-success-700 font-semibold py-2 rounded-md transition text-sm">
              {t('admin_actie_alsnog_goedkeuren') || 'Alsnog goedkeuren'}
            </button>
          )}
          {aanvraag.status !== 'geblokkeerd' && (
            <button onClick={() => beoordeel('geblokkeerd')} disabled={laden}
              className="flex-1 bg-surface-3 hover:bg-surface-2 text-ink-2 font-semibold py-2 rounded-md transition text-sm">
              {t('admin_actie_blokkeren') || 'Blokkeren'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat kaartje ──────────────────────────────────────────────────────────────
function StatKaart({ icoon: Icoon, label, waarde, kleur }) {
  return (
    <div className="bg-surface rounded-md border border-border p-4 shadow-soft">
      {Icoon && <Icoon className="w-6 h-6 mb-2 text-gray-500" />}
      <div className={`font-display text-2xl font-medium tabular-nums ${kleur}`}>{waarde}</div>
      <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { t } = useTaal();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const secret = params.get('secret') || '';

  const [aanvragen, setAanvragen ] = useState([]);
  const [stats, setStats ] = useState(null);
  const [integriteit, setIntegriteit ] = useState(null);
  const [filter, setFilter ] = useState('in_behandeling');
  const [laden, setLaden ] = useState(true);
  const [fout, setFout ] = useState('');

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
      const kycData = await kycRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : null;
      const integriteitData = integriteitRes.ok ? await integriteitRes.json() : null;

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
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="bg-surface border border-border rounded-md p-8 text-center shadow-soft max-w-sm w-full">
          <Lock className="w-10 h-10 mx-auto mb-4 text-gray-500" />
          <h2 className="font-display text-xl font-medium text-ink-1 mb-2">{t('admin_toegang_titel') || 'Admin toegang vereist'}</h2>
          <p className="text-ink-2 text-sm">{t('admin_toegang_uitleg_1') || 'Voeg'} <code className="bg-surface-3 px-1 rounded">?secret=...</code> {t('admin_toegang_uitleg_2') || 'toe aan de URL.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-brand-600"><Zap className="w-7 h-7" /></button>
            <div>
              <div className="font-display font-medium text-ink-1 leading-none">{t('admin_titel') || 'SwiftBridge Admin'}</div>
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-accent-600">{t('admin_beveiligd') || 'Beveiligd paneel'}</div>
            </div>
          </div>
          <button onClick={laadData} className="text-gray-500 hover:text-brand-600 transition" title={t('admin_vernieuwen') || 'Vernieuwen'}><Refresh className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Fout */}
        {fout && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 font-medium text-center">
            {fout}
          </div>
        )}

        {/* Audit log integriteit */}
        {integriteit && (
          <div className={`rounded-md border p-4 flex items-center gap-3 ${
            integriteit.geldig
              ? 'bg-success-50 border-success-100 text-success-700'
              : 'bg-red-50 border-red-200 text-red-800'}`}>
            {integriteit.geldig ? <Lock className="w-6 h-6 flex-shrink-0" /> : <AlertTriangle className="w-6 h-6 flex-shrink-0" />}
            <div>
              <div className="font-semibold text-sm">
                {integriteit.geldig ? (t('admin_audit_intact') || 'Audit log intact') : (t('admin_audit_aangetast') || 'Audit log AANGETAST!')}
              </div>
              <div className="text-xs mt-0.5">
                {integriteit.geldig
                  ? `${integriteit.totaal} ${t('admin_audit_entries_ok') || 'log entries — hash chain volledig geldig'}`
                  : `${t('admin_audit_gebroken_bij') || 'Gebroken bij log ID'} ${integriteit.gebroken?.id} (${integriteit.gebroken?.actie})`}
              </div>
            </div>
          </div>
        )}

        {/* Statistieken */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatKaart icoon={Users} label={t('admin_stat_gebruikers') || 'Gebruikers'} waarde={stats.gebruikers} kleur="text-brand-700" />
            <StatKaart icoon={Clock} label={t('admin_stat_kyc_inbeh') || 'KYC in behandeling'} waarde={stats.kyc?.in_behandeling || 0} kleur="text-accent-600" />
            <StatKaart icoon={CheckCircle} label={t('admin_stat_kyc_ok') || 'KYC goedgekeurd'} waarde={stats.kyc?.goedgekeurd || 0} kleur="text-success-700" />
            <StatKaart icoon={Euro} label={t('admin_stat_totaal_verstuurd') || 'Totaal verstuurd'}
              waarde={`€${((stats.transacties?.voltooid?.totaal || 0)).toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              kleur="text-ink-1" />
          </div>
        )}

        {/* Filters */}
        <div>
          <h2 className="font-display text-lg font-medium text-ink-1 mb-3">{t('admin_kyc_aanvragen') || 'KYC Aanvragen'}</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'in_behandeling', label: `${t('admin_status_in_behandeling') || 'In behandeling'} (${aanvragen.filter(a => a.status === 'in_behandeling').length})` },
              { id: 'goedgekeurd', label: `${t('admin_status_goedgekeurd') || 'Goedgekeurd'} (${aanvragen.filter(a => a.status === 'goedgekeurd').length})` },
              { id: 'afgewezen', label: `${t('admin_status_afgewezen') || 'Afgewezen'} (${aanvragen.filter(a => a.status === 'afgewezen').length})` },
              { id: 'geblokkeerd', label: `${t('admin_status_geblokkeerd') || 'Geblokkeerd'} (${aanvragen.filter(a => a.status === 'geblokkeerd').length})` },
              { id: 'alle', label: `${t('admin_status_alle') || 'Alle'} (${aanvragen.length})` },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  filter === f.id ? 'bg-brand-600 text-white' : 'bg-surface border border-border text-ink-2 hover:border-brand-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* KYC lijst */}
        {laden ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-8 h-8 mx-auto animate-pulse mb-2" />
            <p>{t('laden') || 'Laden...'}</p>
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="bg-surface rounded-md border border-border p-8 text-center text-gray-500">
            <Mail className="w-8 h-8 mx-auto mb-2" />
            <p>{t('admin_geen_aanvragen') || 'Geen aanvragen gevonden voor dit filter'}</p>
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
