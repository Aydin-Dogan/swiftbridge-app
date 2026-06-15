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
        kleur: 'bg-success-50 text-success-700 border-success-100',
        dot: 'bg-success-500',
        label: t('dashboard_kyc_status_goedgekeurd'),
        Icoon: Check,
      };
    case 'in_behandeling':
    case 'ingediend':
      return {
        kleur: 'bg-accent-400/10 text-accent-600 border-accent-400/30',
        dot: 'bg-accent-500 animate-pulse',
        label: t('dashboard_kyc_status_in_behandeling'),
        Icoon: Clock,
      };
    case 'afgewezen':
    case 'geblokkeerd':
      return {
        kleur: 'bg-surface text-fg-error border-border-error',
        dot: 'bg-fg-error',
        label: t('dashboard_kyc_status_afgewezen'),
        Icoon: AlertTriangle,
      };
    default:
      return {
        kleur: 'bg-surface-2 text-ink-2 border-border',
        dot: 'bg-ink-3',
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
      className="relative overflow-hidden rounded-md border border-border bg-surface p-5 shadow-soft animate-fade-up"
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-medium text-gray-500 uppercase tracking-[0.2em]">
            {begroeting}
          </p>
          <h2 className="font-display text-xl md:text-2xl font-medium text-ink-1 mt-1 truncate">
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
            className="flex-shrink-0 text-gray-400 hover:text-brand-600 active:scale-95 transition text-xl w-11 h-11 rounded-md flex items-center justify-center bg-surface border border-border hover:border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
