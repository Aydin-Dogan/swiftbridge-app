/**
 * OnboardingModal.jsx — Full screen wizard voor nieuwe SwiftBridge gebruikers
 *
 * 4 stappen:
 *   1. Welkom + 3-punt overzicht
 *   2. KYC nudge → /verificatie
 *   3. KYC bevestiging + welkomstdeal (alleen als KYC al goedgekeurd)
 *   4. Klaar — quick tips + CTA naar overboeking
 *
 * Logica:
 *   - Start op stap 1 voor verse gebruikers
 *   - Start op stap 3 als KYC al voltooid is (gebruiker kwam terug)
 *   - Sluiten via X knop of "Sla over voor nu" → onDismiss callback
 *   - ESC sluit modal
 *   - Body scroll lock terwijl modal open is
 *   - Slide animatie op stap-transitions
 */
import { useEffect, useState } from 'react';
import { useTaal } from '../../i18n';
import StappenIndicator from './StappenIndicator';
import Stap1Welkom from './Stap1Welkom';
import Stap2KYC from './Stap2KYC';
import Stap3Bevestig from './Stap3Bevestig';
import Stap4Klaar from './Stap4Klaar';

const TOTAAL_STAPPEN = 4;

export default function OnboardingModal({ gebruiker, open, onDismiss }) {
  const { t } = useTaal();
  const kycGoedgekeurd = gebruiker?.kycStatus === 'goedgekeurd';
  // Bij terugkomst na geslaagde KYC: start direct op stap 3
  const [stap, setStap] = useState(kycGoedgekeurd ? 3 : 1);
  const [slideKey, setSlideKey] = useState(0); // forceer re-mount voor animatie

  // Body scroll lock + ESC luisteren
  useEffect(() => {
    if (!open) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => { if (e.key === 'Escape') onDismiss?.(); };
    document.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = origOverflow;
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, onDismiss]);

  // Als KYC status verandert terwijl modal open is, navigeer naar stap 3
  useEffect(() => {
    if (open && kycGoedgekeurd && stap < 3) {
      setStap(3);
      setSlideKey(k => k + 1);
    }
  }, [open, kycGoedgekeurd, stap]);

  if (!open) return null;

  function gaNaar(nieuweStap) {
    if (nieuweStap < 1 || nieuweStap > TOTAAL_STAPPEN) return;
    setStap(nieuweStap);
    setSlideKey(k => k + 1);
  }

  function startKYC() {
    onDismiss?.(); // sluit eerst zodat tab navigatie zichtbaar is
    window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'kyc' }));
  }

  function naarBetaling() {
    onDismiss?.();
    window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }));
  }

  // Labels voor de stappen-indicator (kort, hoeft niet vertaald, of via t() indien nodig)
  const stapLabels = [t('onb_label_welkom'), t('onb_label_kyc'), t('onb_label_deal'), t('onb_label_klaar')];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-titel"
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 animate-fade-up"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('sluiten')}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-default"
      />

      {/* Modal content */}
      <div
        id="onboarding-modal-titel"
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-white/60"
      >
        {/* Top bar: stappen indicator + sluit knop */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 sm:px-6 pt-5 pb-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('onb_stap_van_totaal', { huidige: stap, totaal: TOTAAL_STAPPEN })}
            </span>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-full w-9 h-9 flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label={t('onb_sla_over')}
              title={t('onb_sla_over')}
            >
              <span aria-hidden="true" className="text-lg leading-none">✕</span>
            </button>
          </div>
          <StappenIndicator huidigeStap={stap} totaalStappen={TOTAAL_STAPPEN} labels={stapLabels} />
        </div>

        {/* Stap content — key forceert re-mount + animatie bij wissel */}
        <div key={slideKey} className="p-5 sm:p-8">
          {stap === 1 && (
            <Stap1Welkom
              gebruiker={gebruiker}
              onVolgende={() => gaNaar(2)}
            />
          )}
          {stap === 2 && (
            <Stap2KYC
              onStartKYC={startKYC}
              onLater={onDismiss}
              onTerug={() => gaNaar(1)}
            />
          )}
          {stap === 3 && (
            <Stap3Bevestig onVolgende={() => gaNaar(4)} />
          )}
          {stap === 4 && (
            <Stap4Klaar onNaarOverboeking={naarBetaling} />
          )}
        </div>

        {/* Footer: subtiele "sla over" link */}
        <div className="px-5 sm:px-8 pb-5 pt-1 text-center">
          <button
            onClick={onDismiss}
            className="text-xs text-slate-400 hover:text-slate-600 hover:underline focus:outline-none"
          >
            {t('onb_sla_over')}
          </button>
        </div>
      </div>
    </div>
  );
}
