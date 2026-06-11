/**
 * QuickActions.jsx — 3 prominente CTA knoppen onder de welcome header
 *
 * - Nieuwe overboeking (primary, blauw gradient)
 * - Bekijk koersen
 * - Maak alert
 *
 * Communiceert met App via een custom event ('swiftbridge_navigate' met tab id),
 * conform de bestaande Dashboard.jsx en FeestKalender patronen.
 */
import { useTaal } from '../../i18n';
import { Send, Euro, Bell } from '../icons/Icons';

function navigeer(tab) {
  window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: tab }));
}

export default function QuickActions() {
  const { t } = useTaal();

  const acties = [
    {
      tab: 'betaling',
      Icoon: Send,
      titel: t('dashboard_quick_nieuwe_tx'),
      sub: t('dashboard_quick_nieuwe_tx_sub'),
      primary: true,
    },
    {
      tab: 'alerts',
      Icoon: Euro,
      titel: t('dashboard_quick_koersen'),
      sub: t('dashboard_quick_koersen_sub'),
      primary: false,
    },
    {
      tab: 'alerts',
      Icoon: Bell,
      titel: t('dashboard_quick_alert'),
      sub: t('dashboard_quick_alert_sub'),
      primary: false,
    },
  ];

  return (
    <section aria-label={t('dashboard_quick_nieuwe_tx')} className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {acties.map((a, i) => (
        <button
          key={a.titel}
          onClick={() => navigeer(a.tab)}
          className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[80px] animate-fade-up ${
            a.primary
              ? 'bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-400'
              : 'bg-white/80 backdrop-blur-lg border border-white/70 text-slate-800 shadow-sm hover:shadow-md focus:ring-blue-300'
          }`}
          style={{ animationDelay: `${i * 70}ms` }}
        >
          {a.primary && (
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-30 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)' }}
              aria-hidden="true"
            />
          )}
          <div className="relative flex items-center gap-3">
            <span
              className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                a.primary ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
              }`}
              aria-hidden="true"
            >
              <a.Icoon className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className={`font-bold text-sm leading-tight ${a.primary ? '' : 'text-slate-900'}`}>
                {a.titel}
              </div>
              <div className={`text-xs mt-0.5 ${a.primary ? 'text-blue-100' : 'text-slate-500'}`}>
                {a.sub}
              </div>
            </div>
            <span className={`text-lg flex-shrink-0 ${a.primary ? 'text-white/80' : 'text-slate-400'}`} aria-hidden="true">
              →
            </span>
          </div>
        </button>
      ))}
    </section>
  );
}
