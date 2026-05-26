/**
 * AdminOverzicht.jsx — KPI dashboard voor admin (Verbetering XX).
 *
 * Route: /admin/overzicht
 * Auth: admin (?secret= header of authMiddleware + isAdmin)
 *
 * Toont realtime KPIs uit /admin/stats endpoint:
 *   - Gebruikers totaal + KYC funnel
 *   - Transacties 7d / 30d (aantal + volume EUR)
 *   - Totaal volume EUR
 *   - Sanctie hits + GDPR acties
 *
 * Auto-refresh elke 60s. Quick-links naar admin sub-pagina's.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import { useTaal } from '../i18n';

function KpiCard({ titel, waarde, sub, kleur = 'blue', icon }) {
  const kleurMap = {
    blue: 'from-blue-50 to-sky-50 border-blue-200 text-blue-900',
    green: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900',
    amber: 'from-amber-50 to-orange-50 border-amber-200 text-amber-900',
    red: 'from-red-50 to-rose-50 border-red-200 text-red-900',
    purple: 'from-purple-50 to-violet-50 border-purple-200 text-purple-900',
  };
  return (
    <div className={`rounded-xl border-2 p-4 bg-gradient-to-br ${kleurMap[kleur]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{titel}</span>
        {icon && <span className="text-xl opacity-60" aria-hidden="true">{icon}</span>}
      </div>
      <div className="text-3xl font-extrabold">{waarde}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <nav className="text-sm mb-2">
              <Link to="/" className="text-blue-600 hover:underline">SwiftBridge</Link>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-500">Admin</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-700">{t('admin_ov_titel')}</span>
            </nav>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {t('admin_ov_titel')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('admin_ov_subtitel')}
            </p>
          </div>
          {lastUpdate && (
            <span className="text-xs text-gray-400">
              {t('admin_ov_laatst_update')}: {lastUpdate.toLocaleTimeString('nl-NL')} · {t('admin_ov_auto_refresh')}
            </span>
          )}
        </div>

        {fout ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
            <strong>{t('admin_ov_fout')}:</strong> {fout}
          </div>
        ) : laden ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 animate-pulse h-24" />
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
                icon="👥"
              />
              <KpiCard
                titel={t('admin_ov_kyc_funnel')}
                waarde={`${conversieFunnel.toFixed(1)}%`}
                sub={`${stats.kycInBehandeling} ${t('admin_ov_wacht')}`}
                kleur="amber"
                icon="🪪"
              />
              <KpiCard
                titel={t('admin_ov_tx_7d')}
                waarde={stats.transacties7d.aantal}
                sub={fmtEur(stats.transacties7d.totaalEur)}
                kleur="green"
                icon="💸"
              />
              <KpiCard
                titel={t('admin_ov_tx_30d')}
                waarde={stats.transacties30d.aantal}
                sub={fmtEur(stats.transacties30d.totaalEur)}
                kleur="green"
                icon="📈"
              />
              <KpiCard
                titel={t('admin_ov_volume')}
                waarde={fmtEur(stats.totaalVolumeEur)}
                sub={t('admin_ov_volume_sub')}
                kleur="purple"
                icon="💰"
              />
              <KpiCard
                titel={t('admin_ov_sanctie')}
                waarde={stats.sanctieHits}
                sub={t('admin_ov_sanctie_sub')}
                kleur={stats.sanctieHits > 0 ? 'red' : 'green'}
                icon="🛡️"
              />
              <KpiCard
                titel={t('admin_ov_gdpr')}
                waarde={stats.gdprActies}
                sub={t('admin_ov_gdpr_sub')}
                kleur="blue"
                icon="🔐"
              />
              <KpiCard
                titel={t('admin_ov_kyc_in_bh')}
                waarde={stats.kycInBehandeling}
                sub={t('admin_ov_actie_vereist')}
                kleur={stats.kycInBehandeling > 0 ? 'amber' : 'green'}
                icon="⏳"
              />
            </div>

            {/* Quick-links naar sub-paginas */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-3 text-sm">
                {t('admin_ov_quick_links')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  ['/admin/errors',     t('admin_ov_link_errors')],
                  ['/admin/compliance', t('admin_ov_link_compliance')],
                  [`/admin?secret=${encodeURIComponent(secret)}`, t('admin_ov_link_kyc')],
                ].map(([url, label]) => (
                  <Link
                    key={url}
                    to={url}
                    className="text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-4 py-3 transition flex items-center justify-between"
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
