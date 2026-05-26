/**
 * MaintenanceBanner.jsx — toont sticky banner als backend in onderhoud is.
 *
 * Verbetering LL — detect maintenance mode via een lichte poll op een
 * willekeurig endpoint. Bij 503 + errorCode MAINTENANCE_MODE → banner.
 * Bij gewone response → niets.
 *
 * Polls elke 60s zodat we automatisch terugkeren wanneer onderhoud klaar is.
 * Faalt stil bij netwerkfouten (offline → OfflineBanner pakt dat al op).
 */
import { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import { useTaal } from '../i18n';

const POLL_INTERVAL_MS = 60_000;

export default function MaintenanceBanner() {
  const { t } = useTaal();
  const [bezig, setBezig] = useState(false);
  const [info, setInfo] = useState(null); // null = niet in onderhoud

  useEffect(() => {
    let geannuleerd = false;

    async function check() {
      try {
        // Lichte ping op /readyz — geeft 503 bij maintenance ook back. Andere
        // endpoints zouden ook werken maar /readyz is bewust zonder auth.
        const res = await fetch(`${API_URL}/users/me`, {
          credentials: 'include',
          // Cache uitschakelen
          cache: 'no-store',
        });
        if (geannuleerd) return;

        if (res.status === 503) {
          // Mogelijk maintenance — check errorCode
          const data = await res.json().catch(() => ({}));
          if (data?.errorCode === 'MAINTENANCE_MODE') {
            setInfo({
              message: data.error || t('maintenance_default_msg'),
              eta: data.eta || null,
            });
            return;
          }
        }
        // Anders: niet in onderhoud
        setInfo(null);
      } catch {
        // netwerk-fout: OfflineBanner pakt dit op
      }
    }

    check(); // initial
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      geannuleerd = true;
      clearInterval(interval);
    };
  }, [t]);

  if (!info) return null;

  const etaFmt = info.eta
    ? new Date(info.eta).toLocaleString('nl-NL', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[150] bg-amber-500 text-white px-4 py-2.5 text-center text-sm font-semibold shadow-lg"
    >
      <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 flex-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        <span>{info.message}</span>
        {etaFmt && (
          <span className="opacity-90">
            · {t('maintenance_eta_label')}: {etaFmt}
          </span>
        )}
      </div>
    </div>
  );
}
