/**
 * AdminOverzicht.jsx — KPI dashboard voor admin (Verbetering XX).
 *
 * Route: /admin/overzicht
 * Auth: admin (?secret= header of authMiddleware + isAdmin)
 *
 * Toont realtime KPIs uit /admin/stats endpoint:
 * - Gebruikers totaal + KYC funnel
 * - Transacties 7d / 30d (aantal + volume EUR)
 * - Totaal volume EUR
 * - Sanctie hits + GDPR acties
 *
 * Auto-refresh elke 60s. Quick-links naar admin sub-pagina's.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import { useTaal } from '../i18n';
import { Users, IdCard, Banknote, Calendar, Euro, Shield, Lock, Clock } from '../components/icons/Icons';

function KpiCard({ titel, waarde, sub, kleur = 'blue', icon: Icon }) {
  const kleurMap = {
    blue: 'text-brand-700',
    green: 'text-success-700',
    amber: 'text-accent-600',
    red: 'text-red-700',
    purple: 'text-ink-1',
  };
  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">{titel}</span>
        {Icon && <Icon className="w-5 h-5 text-gray-500" aria-hidden="true" />}
      </div>
      <div className={`font-display text-3xl font-medium tabular-nums ${kleurMap[kleur]}`}>{waarde}</div>
      {sub && <div className="text-xs text-ink-2 mt-1">{sub}</div>}
    </div>
  );
}

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function AdminOverzicht() {
  const { t } = useTaal();
  const [params] = useSearchParams();
  const secret = params.get('secret') || '';

  const [stats, setStats] = useState(null);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  const laad = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        credentials: 'include',
        headers: secret ? { 'X-Admin-Secret': secret } : {},
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error(t('admin_ov_geen_auth'));
        if (res.status === 403) throw new Error(t('admin_ov_geen_admin'));
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
      setLastUpdate(new Date());
      setFout('');
    } catch (e) {
      setFout(e.message);
    } finally {
      setLaden(false);
    }
  }, [secret, t]);

  useEffect(() => {
    document.title = `${t('admin_ov_titel')} — SwiftBridge`;
    laad();
    const interval = setInterval(laad, 60_000);
    return () => clearInterval(interval);
  }, [laad, t]);

  const conversieFunnel = stats
    ? (stats.kycGoedgekeurd / Math.max(stats.gebruikers, 1)) * 100
    : 0;

  return (
    <div className="min-h-screen bg-surface-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <nav className="text-sm mb-2">
              <Link to="/" className="text-brand-700 font-semibold hover:underline underline-offset-4">SwiftBridge</Link>
              <span className="text-gray-500 mx-2">/</span>
              <span className="text-gray-500">Admin</span>
              <span className="text-gray-500 mx-2">/</span>
              <span className="text-ink-2">{t('admin_ov_titel')}</span>
            </nav>
            <h1 className="font-display text-2xl font-medium text-ink-1">
              {t('admin_ov_titel')}
            </h1>
            <p className="text-sm text-ink-2 mt-1">
              {t('admin_ov_subtitel')}
            </p>
          </div>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              {t('admin_ov_laatst_update')}: {lastUpdate.toLocaleTimeString('nl-NL')} · {t('admin_ov_auto_refresh')}
            </span>
          )}
        </div>

        {fout ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-sm text-red-700">
            <strong>{t('admin_ov_fout')}:</strong> {fout}
          </div>
        ) : laden ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="rounded-md border border-border bg-surface-3 p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <KpiCard
                titel={t('admin_ov_gebruikers')}
                waarde={stats.gebruikers}
                sub={`${stats.kycGoedgekeurd} ${t('admin_ov_goedgekeurd')}`}
                kleur="blue"
                icon={Users}
              />
              <KpiCard
                titel={t('admin_ov_kyc_funnel')}
                waarde={`${conversieFunnel.toFixed(1)}%`}
                sub={`${stats.kycInBehandeling} ${t('admin_ov_wacht')}`}
                kleur="amber"
                icon={IdCard}
              />
              <KpiCard
                titel={t('admin_ov_tx_7d')}
                waarde={stats.transacties7d.aantal}
                sub={fmtEur(stats.transacties7d.totaalEur)}
                kleur="green"
                icon={Banknote}
              />
              <KpiCard
                titel={t('admin_ov_tx_30d')}
                waarde={stats.transacties30d.aantal}
                sub={fmtEur(stats.transacties30d.totaalEur)}
                kleur="green"
                icon={Calendar}
              />
              <KpiCard
                titel={t('admin_ov_volume')}
                waarde={fmtEur(stats.totaalVolumeEur)}
                sub={t('admin_ov_volume_sub')}
                kleur="purple"
                icon={Euro}
              />
              <KpiCard
                titel={t('admin_ov_sanctie')}
                waarde={stats.sanctieHits}
                sub={t('admin_ov_sanctie_sub')}
                kleur={stats.sanctieHits > 0 ? 'red' : 'green'}
                icon={Shield}
              />
              <KpiCard
                titel={t('admin_ov_gdpr')}
                waarde={stats.gdprActies}
                sub={t('admin_ov_gdpr_sub')}
                kleur="blue"
                icon={Lock}
              />
              <KpiCard
                titel={t('admin_ov_kyc_in_bh')}
                waarde={stats.kycInBehandeling}
                sub={t('admin_ov_actie_vereist')}
                kleur={stats.kycInBehandeling > 0 ? 'amber' : 'green'}
                icon={Clock}
              />
            </div>

            {/* Quick-links naar sub-paginas */}
            <div className="bg-surface rounded-md border border-border p-5 shadow-soft">
              <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-3">
                {t('admin_ov_quick_links')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  ['/admin/errors', t('admin_ov_link_errors')],
                  ['/admin/compliance', t('admin_ov_link_compliance')],
                  [`/admin?secret=${encodeURIComponent(secret)}`, t('admin_ov_link_kyc')],
                ].map(([url, label]) => (
                  <Link
                    key={url}
                    to={url}
                    className="text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md px-4 py-3 transition flex items-center justify-between"
                  >
                    {label}
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
