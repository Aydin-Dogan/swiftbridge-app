/**
 * JuridischePaginaLayout — gedeelde opmaak voor de juridische documenten.
 *
 * Structuur: navy topbalk met logo, titel, versieregel, knop "Download of print
 * als PDF" (window.print), link naar het archief, inhoudsopgave (sticky op
 * desktop, inklapbaar boven de tekst op mobiel), de tekst zelf (max. ~70 tekens
 * per regel) en een footer met de juridische links en de verplichte disclosure.
 *
 * De documenten bestaan alleen in het Nederlands; bij een andere taal tonen wij
 * een melding dat de Nederlandse tekst leidend is.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { ARCHIEF_ROUTE, FOOTER_GROEPEN } from '../../content/juridisch/index';

// Printweergave: alleen het document, licht, zonder navigatie of knoppen.
const PRINT_CSS = `
@media print {
  @page { margin: 16mm 14mm; }
  html, body { background: #fff !important; }
  #root > *:not(.juridisch-pagina):not(:has(.juridisch-pagina)) { display: none !important; }
  .juridisch-pagina, .juridisch-pagina * {
    color: #12253A !important;
    background-color: transparent !important;
    box-shadow: none !important;
  }
  .juridisch-pagina thead tr, .juridisch-pagina thead th {
    background-color: #1B3252 !important;
    color: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .juridisch-pagina h1, .juridisch-pagina h2, .juridisch-pagina h3 { break-after: avoid; }
  .juridisch-pagina tr, .juridisch-pagina aside { break-inside: avoid; }
  .juridisch-pagina a { text-decoration: none !important; }
}
`;

function kleineBeginletter(tekst, taal) {
  if (!tekst) return tekst;
  return tekst.charAt(0).toLocaleLowerCase(taal) + tekst.slice(1);
}

function InhoudLijst({ items, onKies }) {
  return (
    <ol className="space-y-1 text-sm">
      {items.map((item) => (
        <li key={item.id} className={item.niveau > 2 ? 'pl-4' : ''}>
          <a
            href={`#${item.id}`}
            onClick={onKies}
            className={`block rounded-sm py-1 leading-snug transition-colors hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500
              ${item.niveau > 2 ? 'text-ink-2' : 'font-medium text-ink-1'}`}
          >
            {item.tekst}
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function JuridischePaginaLayout({
  titel,
  soort = null,
  versie,
  geldigVanaf,
  inhoudsopgave = [],
  kruimel = null,
  toonActies = true,
  children,
}) {
  const { t, taal } = useTaal();
  const [inhoudOpen, setInhoudOpen] = useState(false);
  const heeftInhoud = inhoudsopgave.length > 0;

  const versieRegel = versie && geldigVanaf
    ? `${t('juridisch_versie', { versie })} — ${kleineBeginletter(t('juridisch_geldig_vanaf', { datum: geldigVanaf }), taal)}`
    : null;

  return (
    <div className="juridisch-pagina min-h-screen bg-surface-2 text-ink-1">
      <style>{PRINT_CSS}</style>
      <a href="#juridische-inhoud" className="skip-link print:hidden">{t('a11y_skip')}</a>

      {/* Navy topbalk — '/' is de statische landing van de server, dus een gewone link */}
      <header className="bg-brand-500 text-white print:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500"
          >
            <img src="/brand/sb-logo.png" alt="" width="36" height="36" className="h-9 w-9 rounded-md" />
            <span className="font-display text-lg tracking-wide text-white">SwiftBridge</span>
          </a>
          <Link
            to={ARCHIEF_ROUTE}
            className="text-sm text-white/80 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-sm"
          >
            {t('juridisch_archief')}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-12">
        <div className={heeftInhoud ? 'lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10' : ''}>
          {heeftInhoud && (
            <aside className="hidden lg:block print:hidden">
              <nav aria-label={t('juridisch_inhoud')} className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-2">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-3">{t('juridisch_inhoud')}</p>
                <InhoudLijst items={inhoudsopgave} />
              </nav>
            </aside>
          )}

          <main id="juridische-inhoud" className="min-w-0">
            <article
              lang="nl"
              className="rounded-md border border-border bg-surface px-4 py-7 shadow-soft-sm sm:px-10 sm:py-10 print:border-0 print:p-0"
            >
              <header className="max-w-[70ch]">
                {kruimel && <div className="mb-4 text-sm print:hidden">{kruimel}</div>}
                {soort && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">{soort}</p>}
                <h1 className="font-display text-3xl leading-tight text-ink-1 sm:text-4xl">{titel}</h1>
                {versieRegel && <p className="mt-3 text-sm text-ink-2">{versieRegel}</p>}

                {taal !== 'nl' && (
                  <p role="note" className="mt-5 rounded-r-md border-l-4 border-accent-500 bg-surface-3 px-4 py-3 text-sm text-ink-1 print:hidden">
                    {t('juridisch_alleen_nl')}
                  </p>
                )}

                {toonActies && (
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 print:hidden">
                    <button type="button" className="btn-inst" onClick={() => window.print()}>
                      {t('juridisch_download_pdf')}
                    </button>
                    <Link
                      to={ARCHIEF_ROUTE}
                      className="text-sm text-brand-500 underline underline-offset-4 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-sm"
                    >
                      {t('juridisch_archief')}
                    </Link>
                  </div>
                )}
              </header>

              {heeftInhoud && (
                <details
                  className="mt-6 rounded-md border border-border bg-surface-2 lg:hidden print:hidden"
                  open={inhoudOpen}
                  onToggle={(e) => setInhoudOpen(e.currentTarget.open)}
                >
                  <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md">
                    {t('juridisch_inhoud')}
                  </summary>
                  <nav aria-label={t('juridisch_inhoud')} className="border-t border-border px-4 py-3">
                    <InhoudLijst items={inhoudsopgave} onKies={() => setInhoudOpen(false)} />
                  </nav>
                </details>
              )}

              <div className="mt-6 max-w-[70ch]">{children}</div>
            </article>

            <footer className="mt-10 border-t border-border pt-8">
              <div className="grid gap-8 sm:grid-cols-2 print:hidden">
                {FOOTER_GROEPEN.map((groep) => (
                  <nav key={groep.kopKey} aria-label={t(groep.kopKey)}>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-3">{t(groep.kopKey)}</h2>
                    <ul className="space-y-2 text-sm">
                      {groep.links.map((link) => (
                        <li key={link.route}>
                          <Link to={link.route} className="text-ink-2 hover:text-brand-500 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-sm">
                            {t(link.linkKey)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
              </div>
              <p className="mt-8 max-w-[90ch] text-xs leading-relaxed text-ink-2">{t('juridisch_disclosure')}</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
