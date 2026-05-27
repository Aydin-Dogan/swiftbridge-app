/**
 * SimulatieBanner.jsx — toont expliciet dat bank-uitbetaling in simulatie draait.
 *
 * F37 fix (Cursor review Ronde 3): zolang er nog geen EMI-partner-integratie
 * is, simuleert de backend bank-uitbetaling via setTimeout. UI vertelde
 * voorheen "geld is verzonden" zonder dat er ook echt geld vertrok — Sr 326
 * oplichtings-risico. Deze banner maakt expliciet dat het test-modus is.
 *
 * Verdwijnt automatisch als VITE_EMI_LIVE=true wordt gezet in de Railway env
 * (na EMI-contract + integratie).
 */
import { useTaal } from '../i18n';

export default function SimulatieBanner({ kort = false }) {
  const { t } = useTaal();
  // EMI live? Banner niet meer tonen. Default = false (huidige staat).
  if (String(import.meta.env.VITE_EMI_LIVE).toLowerCase() === 'true') return null;

  if (kort) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300"
      >
        <span aria-hidden="true">🧪</span>
        {t('simulatie_banner_kort') || 'Test-modus'}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 sm:p-5 mb-4"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0" aria-hidden="true">🧪</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-amber-900 text-sm sm:text-base">
            {t('simulatie_banner_titel') || 'Test-modus: geen echte overboeking'}
          </h3>
          <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
            {t('simulatie_banner_bericht') ||
              'SwiftBridge draait momenteel in simulatie-modus tot onze EMI-partner-integratie live gaat. ' +
              'Je iDEAL-betaling wordt NIET daadwerkelijk doorgestuurd naar de ontvanger — dit is alleen voor tests. ' +
              'Gebruik geen echt geld dat je niet wilt verliezen.'}
          </p>
        </div>
      </div>
    </div>
  );
}
