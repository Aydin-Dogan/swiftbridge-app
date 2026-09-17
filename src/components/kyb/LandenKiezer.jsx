/**
 * LandenKiezer.jsx — zoekbare multi-select met chips (ISO-2 landcodes).
 * Alle landen van de wereld; namen in de taal van de app (landNaam.js).
 *
 * Gedrag:
 *  - typen toont passende landen; klikken of Enter voegt het bovenste toe;
 *  - verlaat je het veld terwijl er precies één land past (of een exacte
 *    naam), dan wordt dat land alsnog toegevoegd, zodat "Turkije" typen en
 *    doorgaan niet ongemerkt leeg blijft (bevinding Aydin 16-9).
 *
 * Props: waarden (['TR', ...]), onChange(codes[]), label, id, max (default 30), fout (bool)
 */
import { useId, useMemo, useState } from 'react';
import { useTaal } from '../../i18n';
import { X } from '../icons/Icons';
import { landNaam, zoekLanden, normaliseer } from './landNaam';

export default function LandenKiezer({ waarden = [], onChange, label, id: idProp, max = 30, fout = false }) {
  const { t, taal } = useTaal();
  const autoId = useId();
  const id = idProp || autoId;
  const [zoek, setZoek] = useState('');
  const gekozen = useMemo(() => (Array.isArray(waarden) ? waarden : []), [waarden]);

  const resultaten = useMemo(() => zoekLanden(zoek, taal, gekozen).slice(0, 8), [zoek, taal, gekozen]);

  function voegToe(code) {
    if (!code || gekozen.includes(code) || gekozen.length >= max) return;
    onChange?.([...gekozen, code]);
    setZoek('');
  }

  function verwijder(code) {
    onChange?.(gekozen.filter((c) => c !== code));
  }

  function toets(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (resultaten[0]) voegToe(resultaten[0].code);
    }
  }

  function verlaat() {
    if (!zoek.trim()) return;
    const q = normaliseer(zoek);
    const exact = resultaten.find((l) => normaliseer(l.naam) === q);
    if (exact) voegToe(exact.code);
    else if (resultaten.length === 1) voegToe(resultaten[0].code);
  }

  return (
    <div>
      {label && (
        <label htmlFor={id} className={`block text-[0.7rem] font-medium uppercase tracking-[0.2em] mb-1 ${fout ? 'text-fg-error' : 'text-ink-2'}`}>
          {label}
        </label>
      )}
      {gekozen.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2" aria-label={label || t('kyb_landen_vraag')}>
          {gekozen.map((code) => (
            <li key={code} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold pl-2.5 pr-1 py-1">
              {landNaam(code, taal)}
              <button
                type="button"
                onClick={() => verwijder(code)}
                aria-label={`${t('kyb_verwijder_knop')}: ${landNaam(code, taal)}`}
                className="w-6 h-6 rounded-full hover:bg-brand-100 flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        type="text"
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
        onKeyDown={toets}
        onBlur={() => setTimeout(verlaat, 150)}
        placeholder={t('kyb_landen_zoek')}
        autoComplete="off"
        role="combobox"
        aria-expanded={resultaten.length > 0}
        aria-controls={`${id}-lijst`}
        aria-autocomplete="list"
        aria-invalid={fout || undefined}
        className={`w-full bg-surface text-ink-1 placeholder:text-ink-3 border rounded-md px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 ${fout ? 'border-border-error' : 'border-border focus:border-border-focus'}`}
      />
      {resultaten.length > 0 && (
        <ul id={`${id}-lijst`} role="listbox" className="mt-1 border border-border rounded-md bg-surface shadow-soft divide-y divide-border-subtle max-h-56 overflow-y-auto">
          {resultaten.map((l) => (
            <li key={l.code} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => voegToe(l.code)}
                className="w-full text-left px-3 py-2.5 text-sm text-ink-1 hover:bg-surface-2 min-h-[44px]"
              >
                {l.naam} <span className="text-ink-3 text-xs">({l.code})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
