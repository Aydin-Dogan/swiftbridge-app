/**
 * KeuzeGroep.jsx — toegankelijke keuzelijst (radio- of checkbox-gedrag) voor
 * de KYB-stappen.
 *
 * Props:
 *   opties      [{ waarde, tKey, uitlegKey? }]  (zie kybOpties.js)
 *   waarde      gekozen waarde (enkelvoudig)
 *   waarden     gekozen waarden (meervoudig)
 *   onChange    (waarde | waarden[]) => void
 *   meervoudig  false = radiogroup, true = group met checkboxes
 *   naam        naam van de groep (voor id's)
 *   label       zichtbaar label / aria-label
 *   kolommen    1 (default) of 2
 *
 * Toetsenbord: pijltjes verplaatsen de focus (bij radio ook de keuze),
 * spatie/enter kiest. Elke optie is minimaal 48px hoog (mobiel).
 */
import { useRef } from 'react';
import { useTaal } from '../../i18n';
import { Check } from '../icons/Icons';

export default function KeuzeGroep({
  opties = [], waarde = null, waarden = [], onChange, meervoudig = false,
  naam = 'keuze', label, kolommen = 1,
}) {
  const { t } = useTaal();
  const refs = useRef([]);
  const gekozen = new Set(meervoudig ? (waarden || []) : (waarde != null ? [waarde] : []));

  function isAan(w) { return gekozen.has(w); }

  function kies(w) {
    if (typeof onChange !== 'function') return;
    if (meervoudig) {
      const volgende = new Set(gekozen);
      if (volgende.has(w)) volgende.delete(w); else volgende.add(w);
      onChange(opties.map((o) => o.waarde).filter((v) => volgende.has(v)));
    } else {
      onChange(w);
    }
  }

  function focusNaar(idx) {
    const n = opties.length;
    if (!n) return;
    const doel = ((idx % n) + n) % n;
    refs.current[doel]?.focus();
    if (!meervoudig) kies(opties[doel].waarde);
  }

  function toets(e, idx) {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        focusNaar(idx + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        focusNaar(idx - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusNaar(0);
        break;
      case 'End':
        e.preventDefault();
        focusNaar(opties.length - 1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        kies(opties[idx].waarde);
        break;
      default:
    }
  }

  // Roving tabindex bij radio: de gekozen optie (of de eerste) is tabbaar.
  const eersteTabbaar = (() => {
    if (meervoudig) return -1;
    const i = opties.findIndex((o) => isAan(o.waarde));
    return i >= 0 ? i : 0;
  })();

  return (
    <div
      role={meervoudig ? 'group' : 'radiogroup'}
      aria-label={label || naam}
      className={`grid gap-2 ${kolommen === 2 ? 'sm:grid-cols-2' : ''}`}
    >
      {opties.map((o, idx) => {
        const aan = isAan(o.waarde);
        return (
          <button
            key={o.waarde}
            ref={(el) => { refs.current[idx] = el; }}
            type="button"
            role={meervoudig ? 'checkbox' : 'radio'}
            aria-checked={aan}
            tabIndex={meervoudig ? 0 : (idx === eersteTabbaar ? 0 : -1)}
            data-waarde={o.waarde}
            onClick={() => kies(o.waarde)}
            onKeyDown={(e) => toets(e, idx)}
            className={`w-full min-h-[48px] flex items-center gap-3 text-left px-3.5 py-2.5 rounded-md border transition
              focus:outline-none focus:ring-2 focus:ring-brand-500/30
              ${aan ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-border bg-surface text-ink-1 hover:border-brand-300'}`}
          >
            <span
              aria-hidden="true"
              className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-2 transition
                ${meervoudig ? 'rounded' : 'rounded-full'}
                ${aan ? 'border-brand-600 bg-brand-600 text-white' : 'border-border-strong bg-surface'}`}
            >
              {aan && <Check className="w-3.5 h-3.5" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium">{t(o.tKey)}</span>
              {o.uitlegKey && <span className="block text-xs text-ink-3 mt-0.5">{t(o.uitlegKey)}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
