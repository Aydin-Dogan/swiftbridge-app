/**
 * PaymentLoadingOverlay.jsx — full-screen feedback tijdens transactie-aanmaak.
 *
 * Context: na klik op "Bevestigen & betalen" duurt het 1-4 seconden voordat
 * de Mollie checkout-URL klaar is en de browser geredirect wordt. In die tijd
 * zag de gebruiker alleen een knop met "⏳ Verwerken..." — te weinig feedback,
 * wat ongeduldige users dubbel laat klikken (race condition).
 *
 * Deze overlay:
 *   - Dekt het hele scherm tijdens de async flow
 *   - Toont progress in 3 fases: aanmaken → betaling starten → redirect
 *   - Skeleton-style animatie ipv leeg scherm
 *   - Aria-live region voor screen readers
 *
 * Verbetering W (oorspronkelijk IBAN-skeleton bedoeld, maar de echte UX gap
 * zit bij payment redirect — IBAN-check is synchroon mod-97, geen latency).
 */
import { useState, useEffect } from 'react';
import { useTaal } from '../../i18n';

export default function PaymentLoadingOverlay({ open, faseHint }) {
  const { t } = useTaal();
  const [fase, setFase] = useState(1);

  // Cycle door fases om vooruitgang te suggereren — synchroniseert ongeveer
  // met de werkelijke async stappen. Niet exact, maar geeft beweging.
  useEffect(() => {
    if (!open) {
      setFase(1);
      return;
    }
    const t1 = setTimeout(() => setFase(2), 600);
    const t2 = setTimeout(() => setFase(3), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open]);

  // Override fase via prop (parent kan exacte stap doorgeven)
  const huidigeFase = faseHint || fase;

  if (!open) return null;

  const stappen = [
    { key: 1, label: t('pay_overlay_stap1') }, // Transactie aanmaken
    { key: 2, label: t('pay_overlay_stap2') }, // Betaling voorbereiden
    { key: 3, label: t('pay_overlay_stap3') }, // Doorsturen naar betaalpagina
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-overlay-title"
      aria-live="polite"
      className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center px-4"
    >
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 text-center animate-fade-up">
        {/* Spinner-icoon */}
        <div className="w-14 h-14 mx-auto mb-5 relative">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>

        <h2 id="pay-overlay-title" className="font-bold text-gray-900 text-lg mb-1">
          {t('pay_overlay_titel')}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          {t('pay_overlay_subtitel')}
        </p>

        {/* Progress steps */}
        <ol className="space-y-2 text-left">
          {stappen.map((s) => {
            const status =
              s.key < huidigeFase ? 'done'
              : s.key === huidigeFase ? 'active'
              : 'pending';
            return (
              <li
                key={s.key}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  status === 'done'
                    ? 'bg-green-50 text-green-800'
                    : status === 'active'
                      ? 'bg-blue-50 text-blue-800'
                      : 'bg-gray-50 text-gray-400'
                }`}
              >
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center">
                  {status === 'done' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : status === 'active' ? (
                    <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                  )}
                </div>
                <span className="font-medium">{s.label}</span>
              </li>
            );
          })}
        </ol>

        <p className="text-xs text-gray-400 mt-5">
          {t('pay_overlay_geduld')}
        </p>
      </div>
    </div>
  );
}
