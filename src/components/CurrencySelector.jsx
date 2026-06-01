/**
 * CurrencySelector.jsx — Wereldwijde valuta-picker (Wise-stijl).
 *
 * Global herpositionering: vervangt de 6-knops Turkse-grid door een echte
 * searchable selector met regio-groepering, vlaggen en live/binnenkort
 * badges. Herbruikbaar in Hero, Calculator en PaymentFlow.
 *
 * Props:
 *   value      — geselecteerde valuta-code (bv 'TRY')
 *   onChange   — (code) => void
 *   valutas    — lijst om uit te kiezen (default: alle VALUTAS)
 *   label      — optioneel label boven de trigger
 *   compact    — kleinere trigger (voor inline gebruik)
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import Vlag from './Vlag';
import { getValuta, valutasPerRegio, zoekValuta, VALUTAS } from '../services/currencies';

function ChevronDown({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CurrencySelector({ value, onChange, valutas = VALUTAS, label, compact = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const huidige = getValuta(value);

  // Sluiten bij klik buiten + ESC
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    // Focus zoekveld bij openen
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const secties = useMemo(() => {
    const gefilterd = zoekValuta(query, valutas);
    return valutasPerRegio(gefilterd);
  }, [query, valutas]);

  const totaalGevonden = useMemo(() => zoekValuta(query, valutas).length, [query, valutas]);

  function kies(code) {
    onChange?.(code);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="relative" ref={wrapRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl transition bg-white
          ${open ? 'border-brand-500 ring-2 ring-brand-100' : 'border-gray-200 hover:border-gray-300'}
          ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Vlag land={huidige.landCode} size={compact ? 22 : 26} />
          <span className="flex flex-col items-start min-w-0">
            <span className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>{huidige.code}</span>
            {!compact && <span className="text-[11px] text-gray-500 truncate max-w-[140px]">{huidige.land}</span>}
          </span>
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-50 mt-2 w-full sm:w-[340px] right-0 bg-white rounded-2xl shadow-soft-xl border border-gray-100 overflow-hidden animate-fade-in"
          role="listbox"
        >
          {/* Zoekveld */}
          <div className="p-3 border-b border-gray-100 sticky top-0 bg-white">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 transition">
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="9" cy="9" r="6" /><path d="M14 14l3 3" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Zoek land of valuta…"
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Lijst */}
          <div className="max-h-[320px] overflow-y-auto overscroll-contain py-1">
            {totaalGevonden === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-400">
                Geen valuta gevonden voor "{query}"
              </p>
            )}
            {secties.map(({ regio, valutas: rijen }) => (
              <div key={regio}>
                <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {regio}
                </div>
                {rijen.map(v => {
                  const actief = v.code === value;
                  return (
                    <button
                      key={v.code}
                      type="button"
                      role="option"
                      aria-selected={actief}
                      onClick={() => kies(v.code)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition
                        ${actief ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
                    >
                      <Vlag land={v.landCode} size={26} />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{v.code}</span>
                          {v.status === 'binnenkort' && (
                            <span className="text-[9px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-1.5 py-0.5">
                              Binnenkort
                            </span>
                          )}
                          {v.status === 'live' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-success-700 bg-success-50 border border-success-100 rounded-full px-1.5 py-0.5">
                              <span className="w-1 h-1 rounded-full bg-success-500" /> Live
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-gray-500 truncate">{v.naam} · {v.land}</span>
                      </span>
                      {actief && (
                        <svg viewBox="0 0 20 20" className="w-4 h-4 text-brand-600 flex-shrink-0" fill="currentColor" aria-hidden="true">
                          <path d="M8 13l-3-3 1.4-1.4L8 10.2l5.6-5.6L15 6z" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
