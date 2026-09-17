/**
 * markdown.jsx — veilige markdown-naar-React-renderer voor de juridische pagina's.
 *
 * Geen dangerouslySetInnerHTML: de parser (parser.js) levert een boom van
 * gewone objecten en hier worden alleen bekende elementen aangemaakt. HTML in
 * de bron blijft zichtbare tekst. Tokens ({{...}}) worden vervangen via
 * src/content/juridisch/tokens.js (op basis van meta.js).
 *
 * Gebruik:
 *   <MarkdownInhoud markdown={ruweTekst} huidigeSlug="voorwaarden" />
 *   <MarkdownInhoud blokken={alGeparseerdeBlokken} ... />
 */
import { Fragment, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { parseMarkdown, parseInline, maakInlineOpties } from './parser';
import { vervangTokens } from '../../content/juridisch/tokens';
import { KRUISVERWIJZINGEN } from '../../content/juridisch/index';

const LINK_KLASSE = 'text-brand-500 underline underline-offset-2 decoration-brand-200 hover:decoration-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-sm';

function Koppeling({ knoop }) {
  const inhoud = <InlineKnopen knopen={knoop.kinderen} />;
  const { href } = knoop;
  if (href.startsWith('/')) {
    return <Link to={href} className={LINK_KLASSE}>{inhoud}</Link>;
  }
  if (knoop.extern) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_KLASSE}>{inhoud}</a>;
  }
  // Anker op dezelfde pagina, mailto of tel.
  return <a href={href} className={LINK_KLASSE}>{inhoud}</a>;
}

function InlineKnopen({ knopen }) {
  return (knopen || []).map((k, i) => {
    switch (k.type) {
      case 'tekst':
        return <Fragment key={i}>{k.waarde}</Fragment>;
      case 'vet':
        return <strong key={i} className="font-semibold text-ink-1"><InlineKnopen knopen={k.kinderen} /></strong>;
      case 'cursief':
        return <em key={i}><InlineKnopen knopen={k.kinderen} /></em>;
      case 'link':
        return <Koppeling key={i} knoop={k} />;
      default:
        return null;
    }
  });
}

function Inline({ tekst, opties }) {
  return <InlineKnopen knopen={parseInline(tekst, opties)} />;
}

const KOP_KLASSEN = {
  1: 'font-display text-3xl sm:text-4xl leading-tight text-ink-1 mt-2 mb-4',
  2: 'font-display text-2xl leading-snug text-ink-1 mt-10 mb-3',
  3: 'font-display text-lg sm:text-xl leading-snug text-ink-1 mt-8 mb-2',
  4: 'text-base font-semibold text-ink-1 mt-6 mb-2',
};

function Kop({ blok, opties }) {
  const niveau = Math.min(Math.max(blok.niveau, 1), 4);
  const Tag = `h${niveau}`;
  // Koppen linken niet automatisch door (alleen expliciete markdown-links).
  const kopOpties = { ...opties, _matcher: null };
  return (
    <>
      {blok.aliasId && <span id={blok.aliasId} className="block" aria-hidden="true" />}
      <Tag id={blok.id} className={KOP_KLASSEN[niveau]}>
        <Inline tekst={blok.tekst} opties={kopOpties} />
      </Tag>
    </>
  );
}

function Tabel({ blok, opties }) {
  const zonderKop = !blok.kop;
  return (
    <div className="my-6 overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-sm leading-6">
        {blok.kop && (
          <thead>
            <tr className="bg-brand-500 text-white">
              {blok.kop.map((cel, i) => (
                <th key={i} scope="col" className="px-3 py-2.5 text-left font-semibold align-bottom text-white">
                  <Inline tekst={cel} opties={opties} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-border">
          {blok.rijen.map((rij, r) => (
            <tr key={r} className="bg-surface even:bg-surface-2">
              {rij.map((cel, c) => (
                <td key={c} className={`px-3 py-2.5 align-top text-ink-1 ${zonderKop && c === 0 ? 'font-medium' : ''}`}>
                  <Inline tekst={cel} opties={opties} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Blokken({ blokken, opties }) {
  return (blokken || []).map((blok, i) => {
    switch (blok.type) {
      case 'kop':
        return <Kop key={i} blok={blok} opties={opties} />;
      case 'alinea':
        return (
          <p key={i} className="my-4 text-base leading-7 text-ink-1">
            {blok.regels.map((regel, r) => (
              <Fragment key={r}>
                {r > 0 && <br />}
                <Inline tekst={regel} opties={opties} />
              </Fragment>
            ))}
          </p>
        );
      case 'lijst': {
        const Tag = blok.geordend ? 'ol' : 'ul';
        return (
          <Tag
            key={i}
            start={blok.geordend && blok.start !== 1 ? blok.start : undefined}
            className={`my-4 space-y-1.5 pl-6 text-base leading-7 text-ink-1 marker:text-ink-3 ${blok.geordend ? 'list-decimal' : 'list-disc'}`}
          >
            {blok.items.map((item, j) => (
              <li key={j} className="pl-1"><Inline tekst={item} opties={opties} /></li>
            ))}
          </Tag>
        );
      }
      case 'tabel':
        return <Tabel key={i} blok={blok} opties={opties} />;
      case 'citaat':
        return (
          <aside key={i} role="note" className="my-6 rounded-r-md border-l-4 border-accent-500 bg-surface-3 px-4 py-1">
            <Blokken blokken={blok.blokken} opties={opties} />
          </aside>
        );
      case 'scheiding':
        return <hr key={i} className="my-8 border-0 border-t border-border" />;
      default:
        return null;
    }
  });
}

/**
 * Rendert juridische markdown.
 * - markdown:     ruwe tekst (tokens worden vervangen), of
 * - blokken:      al geparseerde blokken (tokens al vervangen door de aanroeper)
 * - huidigeSlug:  slug van dit document (geen kruisverwijzing naar zichzelf)
 * - routeVoor:    (slug) => route, bijv. naar archiefversies
 * - verwijzingen: documentnamen die automatisch doorlinken (standaard alle)
 */
export function MarkdownInhoud({ markdown, blokken, huidigeSlug, routeVoor, verwijzingen = KRUISVERWIJZINGEN, agentGeregistreerd }) {
  const opties = useMemo(
    () => maakInlineOpties({ verwijzingen, huidigeSlug, routeVoor }),
    [verwijzingen, huidigeSlug, routeVoor],
  );
  const lijst = useMemo(() => {
    if (blokken) return blokken;
    const tokenOpties = agentGeregistreerd === undefined ? {} : { agentGeregistreerd };
    return parseMarkdown(vervangTokens(markdown, tokenOpties));
  }, [blokken, markdown, agentGeregistreerd]);

  return <Blokken blokken={lijst} opties={opties} />;
}

export default MarkdownInhoud;
