/**
 * Banner.jsx — Eén app-wide announcement banner.
 *
 * Props:
 * - banner: { id, titel, bericht, type, sluitbaar, ctaTekst, ctaUrl, ... }
 * - onDismiss: () => void (alleen aangeroepen als sluitbaar=true)
 *
 * Styling per type:
 * info → blauwe gradient, Info-icoon
 * success → groene gradient, CheckCircle-icoon
 * warning → oranje gradient, AlertTriangle-icoon
 * error → rode gradient, XCircle-icoon
 *
 * Layout: glassmorphism kaart, optionele CTA-knop rechts, dismiss × rechtsboven.
 */
import { useTaal } from '../../i18n';
import { Info, CheckCircle, AlertTriangle, XCircle } from '../icons/Icons';

const STIJLEN = {
  info: {
    icoon: Info,
    gradient: 'from-blue-500/80 via-blue-600/80 to-cyan-500/80',
    border: 'border-blue-300/40',
    ringHover: 'hover:ring-blue-300/30',
  },
  success: {
    icoon: CheckCircle,
    gradient: 'from-emerald-500/80 via-green-500/80 to-teal-500/80',
    border: 'border-emerald-300/40',
    ringHover: 'hover:ring-emerald-300/30',
  },
  warning: {
    icoon: AlertTriangle,
    gradient: 'from-amber-500/80 via-orange-500/80 to-yellow-500/80',
    border: 'border-amber-300/50',
    ringHover: 'hover:ring-amber-300/40',
  },
  error: {
    icoon: XCircle,
    gradient: 'from-rose-500/80 via-red-600/80 to-pink-500/80',
    border: 'border-rose-300/40',
    ringHover: 'hover:ring-rose-300/30',
  },
};

export default function Banner({ banner, onDismiss }) {
  const { t } = useTaal();
  const type = STIJLEN[banner.type] ? banner.type : 'info';
  const stijl = STIJLEN[type];

  function isExterneLink(url) {
    if (!url) return false;
    return /^https?:\/\//i.test(url);
  }

  return (
    <div
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      className={`relative bg-gradient-to-r ${stijl.gradient} backdrop-blur-lg border ${stijl.border}
                  rounded-2xl p-4 shadow-lg text-white animate-fade-up overflow-hidden
                  ring-1 ring-white/10 ${stijl.ringHover} transition`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
          <stijl.icoon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0 pr-7">
          <div className="font-bold text-sm md:text-base leading-tight">
            {banner.titel}
          </div>
          <div className="text-xs md:text-sm text-white/95 mt-1 leading-snug whitespace-pre-line">
            {banner.bericht}
          </div>
          {banner.ctaTekst && banner.ctaUrl && (
            <div className="mt-3">
              {isExterneLink(banner.ctaUrl) ? (
                <a
                  href={banner.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30
                             text-white font-bold text-xs px-3 py-1.5 rounded-xl
                             border border-white/30 transition active:scale-95"
                >
                  {banner.ctaTekst} →
                </a>
              ) : (
                <a
                  href={banner.ctaUrl}
                  className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30
                             text-white font-bold text-xs px-3 py-1.5 rounded-xl
                             border border-white/30 transition active:scale-95"
                >
                  {banner.ctaTekst} →
                </a>
              )}
            </div>
          )}
        </div>
        {banner.sluitbaar && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t('banner_sluit') || 'Sluit melding'}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center
                       rounded-full text-white/80 hover:text-white hover:bg-white/15
                       transition focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <span aria-hidden="true" className="text-lg leading-none">×</span>
          </button>
        )}
      </div>
    </div>
  );
}
