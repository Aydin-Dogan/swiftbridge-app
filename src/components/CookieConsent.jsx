/**
 * CookieConsent.jsx — AVG/GDPR cookie consent banner.
 *
 * Verschijnt bij eerste bezoek wanneer er nog geen entry is in
 * localStorage onder `swiftbridge_cookie_consent`. Vraagt granular
 * toestemming voor:
 *   - necessary   (altijd aan, niet uit te zetten — session, taal-keuze)
 *   - analytics   (opt-in — bijv. Plausible/Umami in de toekomst)
 *   - marketing   (opt-in — bijv. Meta-pixel als we ooit ads draaien)
 *
 * Filosofie: GEEN tracking voordat de gebruiker actief 'Accepteren' of
 * een granular keuze heeft gemaakt. Reject is even prominent als Accept
 * (donker patroon-vrij). Banner blokkeert de pagina niet — gebruiker
 * kan blijven scrollen/lezen.
 *
 * Helper: `useCookieConsent()` hook voor andere componenten om te
 * checken of analytics/marketing actief mag worden.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTaal } from '../i18n';

const STORAGE_KEY = 'swiftbridge_cookie_consent';
const CONSENT_VERSION = 1; // bump bij beleid-wijziging → banner verschijnt opnieuw

const DEFAULT_CONSENT = {
  necessary: true, // altijd true, niet wijzigbaar
  analytics: false,
  marketing: false,
  version: CONSENT_VERSION,
  timestamp: null,
};

/**
 * Hook — geeft huidige consent + setter.
 * Andere componenten kunnen `consent.analytics` checken voor ze
 * een tracking-pixel injecten.
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CONSENT;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_CONSENT;
      const parsed = JSON.parse(raw);
      // Versie-check — bij nieuwer beleid resetten we
      if (parsed.version !== CONSENT_VERSION) return DEFAULT_CONSENT;
      return { ...DEFAULT_CONSENT, ...parsed };
    } catch {
      return DEFAULT_CONSENT;
    }
  });

  const hasDecided = consent.timestamp !== null;

  const save = useCallback((updates) => {
    const next = {
      ...DEFAULT_CONSENT,
      ...consent,
      ...updates,
      necessary: true, // forceer
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    setConsent(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage geblokkeerd (private mode etc) — silently skip
    }
  }, [consent]);

  return { consent, hasDecided, save };
}

export default function CookieConsent() {
  const { t } = useTaal();
  const { consent, hasDecided, save } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(consent.analytics);
  const [marketing, setMarketing] = useState(consent.marketing);

  // Sync local state met opgeslagen consent als hook update
  useEffect(() => {
    setAnalytics(consent.analytics);
    setMarketing(consent.marketing);
  }, [consent.analytics, consent.marketing]);

  // Niet renderen als al beslist
  if (hasDecided) return null;

  const acceptAll = () => save({ analytics: true, marketing: true });
  const rejectAll = () => save({ analytics: false, marketing: false });
  const saveCustom = () => save({ analytics, marketing });

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-0 left-0 right-0 z-[90] p-3 sm:p-4 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 sm:p-6 pointer-events-auto animate-fade-in">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
              <circle cx="8.5" cy="8.5" r="0.5" fill="currentColor"/>
              <circle cx="15" cy="11" r="0.5" fill="currentColor"/>
              <circle cx="11" cy="14.5" r="0.5" fill="currentColor"/>
              <circle cx="14" cy="16.5" r="0.5" fill="currentColor"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="cookie-consent-title" className="font-bold text-gray-900 text-base sm:text-lg mb-1">
              {t('cookie_title')}
            </h3>
            <p id="cookie-consent-desc" className="text-sm text-gray-600 leading-relaxed">
              {t('cookie_desc')}{' '}
              <Link to="/privacybeleid" className="text-blue-600 hover:underline font-medium">
                {t('cookie_privacy_link')}
              </Link>
              .
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="border-t border-gray-100 pt-4 mt-3 space-y-3">
            <label className="flex items-start gap-3 opacity-60 cursor-not-allowed">
              <input type="checkbox" checked disabled className="mt-1 rounded" />
              <div>
                <div className="font-semibold text-sm text-gray-900">
                  {t('cookie_cat_necessary')}
                </div>
                <div className="text-xs text-gray-600">{t('cookie_cat_necessary_desc')}</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-sm text-gray-900">
                  {t('cookie_cat_analytics')}
                </div>
                <div className="text-xs text-gray-600">{t('cookie_cat_analytics_desc')}</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-sm text-gray-900">
                  {t('cookie_cat_marketing')}
                </div>
                <div className="text-xs text-gray-600">{t('cookie_cat_marketing_desc')}</div>
              </div>
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          {showDetails ? (
            <button
              onClick={saveCustom}
              className="btn-primary text-sm flex-1 sm:flex-initial"
            >
              {t('cookie_save_choice')}
            </button>
          ) : (
            <>
              <button
                onClick={acceptAll}
                className="btn-primary text-sm flex-1 sm:flex-initial"
              >
                {t('cookie_accept_all')}
              </button>
              <button
                onClick={rejectAll}
                className="text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2.5 transition flex-1 sm:flex-initial"
              >
                {t('cookie_reject_all')}
              </button>
            </>
          )}
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 px-4 py-2.5 transition"
          >
            {showDetails ? t('cookie_hide_details') : t('cookie_customize')}
          </button>
        </div>
      </div>
    </div>
  );
}
