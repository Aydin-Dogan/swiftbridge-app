/**
 * TaalKiezer — Dropdown om de taal te kiezen
 */
import { useState, useEffect, useRef } from 'react';
import { useTaal, TALEN } from '../i18n';

export default function TaalKiezer({ donker = false }) {
  const { taal, zetTaal } = useTaal();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Sluit dropdown bij klik buiten
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const huidige = TALEN.find(l => l.code === taal) || TALEN[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold transition ${
          donker
            ? 'text-white hover:bg-white/10'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="Kies taal"
      >
        <span className="text-base">{huidige.vlag}</span>
        <span className="hidden sm:inline">{huidige.code.toUpperCase()}</span>
        <span className="text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-44 overflow-hidden">
          {TALEN.map(l => (
            <button
              key={l.code}
              onClick={() => { zetTaal(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition hover:bg-blue-50 ${
                l.code === taal ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{l.vlag}</span>
              <span className="flex-1">{l.naam}</span>
              {l.code === taal && <span className="text-blue-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
