/**
 * LocaleLanding.jsx — Wrapper rond Landing die de i18n taal forceert
 * vanuit de URL.
 *
 * Werkt voor /nl/, /tr/, /en/, /ru/, /az/ routes — geeft Google een eigen
 * URL per locale zodat hreflang correct kan resolven naar verschillende
 * pagina's (in plaats van allemaal naar /).
 *
 * De geforceerde taal wordt OOK in localStorage opgeslagen zodat als user
 * van /tr/ naar / navigeert, de Turkse versie persistent blijft.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Landing from './Landing';
import { useTaal } from '../i18n';

const GELDIGE_LOCALES = ['nl', 'tr', 'en', 'ru', 'az'];

export default function LocaleLanding() {
  const { pathname } = useLocation();
  // Eerste pad-segment is de locale (bv. /tr → 'tr')
  const locale = (pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
  const { taal, zetTaal } = useTaal();

  useEffect(() => {
    // Bescherm tegen onbekende locale-segmenten (zou 404 moeten zijn, maar
    // route-pattern garandeert al een match — defensieve check.)
    if (!GELDIGE_LOCALES.includes(locale)) return;
    if (taal !== locale) {
      zetTaal(locale);
    }
    // Update <html lang="..."> meteen (anders Google ziet eerste fetch
    // met verkeerde lang-attribute)
    document.documentElement.lang = locale;

    // Inject hreflang-cluster voor deze specifieke pagina
    const links = [];
    for (const code of GELDIGE_LOCALES) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = code;
      link.href = `https://swiftbridge.tr/${code}/`;
      link.id = `dynamic-hreflang-${code}`;
      document.head.appendChild(link);
      links.push(link);
    }
    // x-default = NL als geen taal-detect mogelijk
    const def = document.createElement('link');
    def.rel = 'alternate';
    def.hreflang = 'x-default';
    def.href = 'https://swiftbridge.tr/';
    def.id = 'dynamic-hreflang-default';
    document.head.appendChild(def);
    links.push(def);

    // Update canonical naar de locale-URL
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute('href');
    if (canonical) {
      canonical.setAttribute('href', `https://swiftbridge.tr/${locale}/`);
    }

    return () => {
      links.forEach(l => l.remove());
      if (canonical && prevCanonical) canonical.setAttribute('href', prevCanonical);
    };
  }, [locale, taal, zetTaal]);

  return <Landing />;
}
