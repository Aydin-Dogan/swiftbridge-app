/**
 * SaldoCard.jsx — Welcome header met KYC status pill en tijdgebonden begroeting
 *
 * - Toont "Goedemorgen/middag/avond, {naam}"
 * - KYC status pill (groen/amber/rood) gebaseerd op gebruiker.kycStatus
 * - Vernieuw knop met aria-label en 44px touch target (a11y behouden)
 * - Subtle gradient achtergrond
 */
import { useTaal } from '../../i18n';
import { Check, Clock, AlertTriangle, IdCard, Refresh } from '../icons/Icons';

function begroetingKey(uur) {
  if (uur < 12) return 'dashboard_goedemorgen';
  if (uur < 18) return 'dashboard_goedemiddag';
  return 'dashboard_goedenavond';
}

function kycPill(status, t) {
  switch (status) {
    case 'goedgekeurd':
      return {
        kleur: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        label: t('dashboard_kyc_status_goedgekeurd'),
        Icoon: Check,
      };
    case 'in_behandeling':
    case 'ingediend':
      return {
        kleur: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500 animate-pulse',
        label: t('dashboard_kyc_status_in_behandeling'),
        Icoon: Clock,
      };
    case 'afgewezen':
    case 'geblokkeerd':
      return {
        kleur: 'bg-rose-100 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        label: t('dashboard_kyc_status_afgewezen'),
        Icoon: AlertTriangle,
      };
    default:
      return {
        kleur: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        label: t('dashboard_kyc_status_geen'),
        Icoon: IdCard,
      };
  }
}

export default function SaldoCard({ gebruiker, onVernieuw }) {
  const { t } = useTaal();
  const uur = new Date().getHours();
  const begroeting = t(begroetingKey(uur));
  const voornaam = gebruiker?.naam?.split(' ')[0] || '';
  const pill = kycPill(gebruiker?.kycStatus, t);

  return (
    <header
      aria-label="Welkom"
      className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl p-5 shadow-sm animate-fade-up"
    >
      {/* Decoratieve gradient blobs */}
      <div
        className="absolute -top-16 -right-10 w-48 h-48 rounded-full opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {begroeting}
          </p>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1 truncate">
            {voornaam
              ? t('dashboard_welkom_terug', { naam: voornaam })
              : t('dashboard_welkom_terug', { naam: '' }).replace(/, $/, '')}
          </h2>

          {/* KYC status pill */}
          <div className="mt-3 inline-flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${pill.kleur}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} aria-hidden="true" />
              <pill.Icoon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{pill.label}</span>
            </span>
          </div>
        </div>

        {/* Vernieuw knop — behoud a11y verbeteringen (aria-label + 44px touch) */}
        {onVernieuw && (
          <button
            onClick={onVernieuw}
            className="flex-shrink-0 text-slate-400 hover:text-blue-600 active:scale-95 transition text-xl w-11 h-11 rounded-full flex items-center justify-center bg-white/70 border border-white/80 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            title={t('vernieuwen')}
            aria-label={t('vernieuwen')}
          >
            <Refresh className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
