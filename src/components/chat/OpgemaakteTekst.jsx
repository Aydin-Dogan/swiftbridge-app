/**
 * OpgemaakteTekst — rendert een AI-antwoord (zonder actie-tokens) als alinea's,
 * genummerde stappen en opsommingen met **vet**. Alleen React-tekst, geen HTML.
 * Parser en allowlist: ./chatOpmaak.js
 */
import { parseBlokken } from './chatOpmaak';

/** **vet** → <strong>; de rest blijft platte tekst. */
function InlineTekst({ tekst }) {
  const delen = String(tekst || '').split(/(\*\*[^*\n]+\*\*)/g);
  return delen.map((deel, i) =>
    deel.startsWith('**') && deel.endsWith('**') && deel.length > 4
      ? <strong key={i} className="font-semibold text-gray-900">{deel.slice(2, -2)}</strong>
      : <span key={i}>{deel}</span>
  );
}

export function OpgemaakteTekst({ tekst }) {
  const blokken = parseBlokken(tekst);
  return (
    <div className="space-y-2">
      {blokken.map((b, i) => {
        if (b.type === 'ol') {
          return (
            <ol key={i} className="space-y-1.5">
              {b.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 mt-px rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold flex items-center justify-center" aria-hidden="true">
                    {item.nr}
                  </span>
                  <span className="flex-1 min-w-0"><InlineTekst tekst={item.tekst} /></span>
                </li>
              ))}
            </ol>
          );
        }
        if (b.type === 'ul') {
          return (
            <ul key={i} className="space-y-1 list-disc pl-4 marker:text-gray-400">
              {b.items.map((item, j) => <li key={j}><InlineTekst tekst={item} /></li>)}
            </ul>
          );
        }
        return (
          <p key={i}>
            {b.regels.map((r, j) => (
              <span key={j}>{j > 0 && <br />}<InlineTekst tekst={r} /></span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
