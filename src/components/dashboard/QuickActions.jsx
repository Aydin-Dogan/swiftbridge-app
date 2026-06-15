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
          className={`relative overflow-hidden rounded-md p-4 text-left transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[80px] animate-fade-up ${
            a.primary
              ? 'bg-brand-cta text-white shadow-soft-md hover:shadow-soft-lg focus:ring-brand-400'
              : 'bg-surface border border-border text-ink-1 shadow-soft hover:shadow-soft-md focus:ring-brand-200'
          }`}
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div className="relative flex items-center gap-3">
            <span
              className={`flex-shrink-0 w-11 h-11 rounded-md flex items-center justify-center ${
                a.primary ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600'
              }`}
              aria-hidden="true"
            >
              <a.Icoon className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className={`font-display font-medium text-sm leading-tight ${a.primary ? '' : 'text-ink-1'}`}>
                {a.titel}
              </div>
              <div className={`text-xs mt-0.5 ${a.primary ? 'text-brand-100' : 'text-gray-500'}`}>
                {a.sub}
              </div>
            </div>
            <span className={`text-lg flex-shrink-0 ${a.primary ? 'text-white/80' : 'text-gray-400'}`} aria-hidden="true">
              →
            </span>
          </div>
        </button>
      ))}
    </section>
  );
}
