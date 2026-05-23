/**
 * SeoLanding.jsx — Gedeelde layout voor de 5 SEO-landings.
 *
 * Doel: long-tail Google traffic vangen door dedicated pages per query.
 * Iedere SEO-landing geeft:
 *  - Eigen <title> + <meta description> + canonical link (gemanaged via useEffect)
 *  - Eigen H1 (één per page, in-content)
 *  - 500+ woorden content (Google scoort op tekst-diepte)
 *  - Anchor naar /calculator?bedrag=X met voorbeeld-bedrag van die query
 *  - Breadcrumb-navigatie + interne link naar root /
 *  - JSON-LD Article-schema voor rich snippets
 */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap } from '../../components/icons/Icons';
import { useTaal } from '../../i18n';

/**
 * @param {object} props
 * @param {string} props.title             - <title> + H1
 * @param {string} props.description       - meta description
 * @param {string} props.canonicalPath     - bv. '/wise-alternatief'
 * @param {string} props.heroEyebrow       - kleine tekst boven H1
 * @param {string} props.heroSubtitel      - tekst onder H1
 * @param {number} props.voorbeeldBedrag   - default bedrag in CTA-link
 * @param {string} props.cta               - knop-tekst
 * @param {React.ReactNode} props.content  - hoofdtekst (markdown-style JSX)
 * @param {array} props.bullets            - lijst quick-bullets onder H1
 * @param {array} props.faq                - extra FAQ-items voor deze pagina
 */
export default function SeoLanding({
  title,
  description,
  canonicalPath,
  heroEyebrow,
  heroSubtitel,
  voorbeeldBedrag = 500,
  cta = 'Bereken je transfer',
  content,
  bullets = [],
  faq = [],
}) {
  const navigate = useNavigate();
  const { t } = useTaal();

  // SEO meta-tags injecteren op deze specifieke pagina
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title + ' | SwiftBridge';

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }

    // Update canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute('href');
    if (canonical) {
      canonical.setAttribute('href', `https://swiftbridge.tr${canonicalPath}`);
    }

    // Inject Article JSON-LD
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'seo-article-jsonld';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      author: {
        '@type': 'Organization',
        name: 'SwiftBridge',
        url: 'https://swiftbridge.tr',
      },
      publisher: {
        '@type': 'Organization',
        name: 'SwiftBridge',
        logo: {
          '@type': 'ImageObject',
          url: 'https://swiftbridge.tr/icon-512.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://swiftbridge.tr${canonicalPath}`,
      },
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
      if (canonical && prevCanonical) canonical.setAttribute('href', prevCanonical);
      const el = document.getElementById('seo-article-jsonld');
      if (el) el.remove();
    };
  }, [title, description, canonicalPath]);

  return (
    <div className="min-h-screen bg-white">
      {/* Lichte sticky header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 safe-top">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition">
            <Zap className="w-5 h-5 text-brand-600" />
            <span className="text-lg font-bold text-gray-900 tracking-tight">SwiftBridge</span>
          </Link>
          <button
            onClick={() => navigate(`/calculator?bedrag=${voorbeeldBedrag}`)}
            className="btn-primary text-sm"
          >
            {cta}
          </button>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 text-xs text-gray-500" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand-600">Home</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-gray-900">{title}</span>
        </nav>
      </div>

      {/* Hero */}
      <header className="bg-brand-hero text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-3">
            {heroEyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mb-6 leading-relaxed">
            {heroSubtitel}
          </p>

          {bullets.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100 mb-7">
              {bullets.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-200" />
                  {b}
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => navigate(`/calculator?bedrag=${voorbeeldBedrag}`)}
            className="px-6 py-3.5 rounded-xl text-base font-semibold text-brand-800 bg-white hover:bg-blue-50 transition-colors duration-150 active:scale-[0.98] inline-flex items-center justify-center gap-2"
          >
            {cta}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <article className="prose-content space-y-6 text-gray-700 leading-relaxed">
          {content}
        </article>

        {/* FAQ specifiek voor deze landing */}
        {faq.length > 0 && (
          <section className="mt-12 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Veelgestelde vragen</h2>
            <div className="space-y-4">
              {faq.map((q, i) => (
                <details key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <summary className="font-semibold text-gray-900 cursor-pointer">
                    {q.vraag}
                  </summary>
                  <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                    {q.antwoord}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Mid-content CTA */}
        <div className="mt-12 bg-brand-50 border border-brand-100 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Klaar om geld te sturen?</h3>
          <p className="text-gray-600 text-sm mb-5">
            Bereken eerst wat de ontvanger krijgt — zonder account aan te maken.
          </p>
          <button
            onClick={() => navigate(`/calculator?bedrag=${voorbeeldBedrag}`)}
            className="btn-primary px-6 py-3 inline-flex items-center justify-center gap-2"
          >
            {cta}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Terug-link */}
        <div className="mt-12 text-center">
          <Link to="/" className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
            ← Terug naar home
          </Link>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="bg-gray-900 text-gray-400 text-xs py-8 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-2">
          <p>© 2026 SwiftBridge — onder DNB-toezicht via EMI-partner</p>
          <div className="space-x-4">
            <Link to="/algemene-voorwaarden" className="hover:text-white">Algemene voorwaarden</Link>
            <Link to="/privacybeleid" className="hover:text-white">Privacy</Link>
            <Link to="/aml-beleid" className="hover:text-white">AML</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
