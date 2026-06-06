/**
 * TourOverlay.jsx — bottom-nav uitleg-tour voor nieuwe gebruikers.
 *
 * Verbetering BB: complement op de bestaande OnboardingWizard.
 * Waar de wizard "welkom + KYC nudge" doet, doet deze tour een korte
 * uitleg van de 5 bottom-nav tabs (Dashboard / Overmaken / Alerts /
 * Profiel / KYC).
 *
 * Trigger:
 * - 1× automatisch na sluiting van OnboardingWizard
 * - handmatig via "Tour starten" knop in Profiel
 *
 * State: localStorage `sb_tour_done`.
 *
 * UX:
 * - 5 stappen, één per tab
 * - Skip-knop zichtbaar op elk moment
 * - Pijl wijst naar gerelateerde tab onderaan
 * - Esc-toets sluit
 */
import { useState, useEffect } from 'react';
import { useTaal } from '../../i18n';

const TOUR_KEY = 'sb_tour_done';

const STAPPEN = [
  { id: 'dashboard', icoon: '📊' },
  { id: 'overmaken', icoon: '💸' },
  { id: 'alerts', icoon: '🔔' },
  { id: 'profiel', icoon: '👤' },
  { id: 'kyc', icoon: '🪪' },
];

export function moetTourTonen() {
  try {
    return localStorage.getItem(TOUR_KEY) !== '1';
  } catch {
    return false;
  }
}

export function markeerTourGedaan() {
  try { localStorage.setItem(TOUR_KEY, '1'); } catch {/* ignored */}
}

export function resetTour() {
  try { localStorage.removeItem(TOUR_KEY); } catch {/* ignored */}
}

export default function TourOverlay({ open, onSluit }) {
  const { t } = useTaal();
  const [stap, setStap] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStap(0);
    const onKey = (e) => {
      if (e.key === 'Escape') sluit();
      if (e.key === 'ArrowRight') setStap((s) => Math.min(s + 1, STAPPEN.length - 1));
      if (e.key === 'ArrowLeft') setStap((s) => Math.max(s - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function sluit() {
    markeerTourGedaan();
    onSluit?.();
  }

  function volgende() {
    if (stap === STAPPEN.length - 1) {
      sluit();
    } else {
      setStap(stap + 1);
    }
  }

  if (!open) return null;

  const huidige = STAPPEN[stap];
  const laatste = stap === STAPPEN.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-titel"
      className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-32 sm:pb-4"
      onClick={sluit}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">{huidige.icoon}</span>
            <h2 id="tour-titel" className="font-bold text-gray-900 text-base">
              {t(`tour_${huidige.id}_titel`)}
            </h2>
          </div>
          <button
            onClick={sluit}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label={t('tour_sluit')}
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          {t(`tour_${huidige.id}_uitleg`)}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {STAPPEN.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStap(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === stap ? 'bg-blue-600 w-6' : 'bg-gray-300 w-1.5 hover:bg-gray-400'
              }`}
              aria-label={`${t('tour_naar_stap')} ${i + 1}`}
              aria-current={i === stap ? 'step' : undefined}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {stap > 0 && (
            <button
              onClick={() => setStap(stap - 1)}
              className="text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2.5 transition"
            >
              ← {t('tour_terug')}
            </button>
          )}
          <button
            onClick={volgende}
            className="btn-primary flex-1 text-sm"
          >
            {laatste ? t('tour_klaar') : `${t('tour_volgende')} (${stap + 1}/${STAPPEN.length}) →`}
          </button>
        </div>

        {!laatste && (
          <button
            onClick={sluit}
            className="text-xs text-gray-400 hover:text-gray-600 mt-3 mx-auto block"
          >
            {t('tour_overslaan')}
          </button>
        )}
      </div>
    </div>
  );
}
