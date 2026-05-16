import { useState, useEffect } from 'react';
import { VALUTAS } from '../services/currencies';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const EU_VLAG = '🇪🇺';

// Ticker valuta's (alles behalve EUR zelf)
const TICKER_VALUTAS = VALUTAS.filter(v => v.code !== 'EUR');

export default function LiveKoersTicker() {
  const [koersen, setKoersen] = useState(
    TICKER_VALUTAS.map(v => ({ ...v, huidigeKoers: v.koers, richting: 0 }))
  );

  async function haalKoersen() {
    try {
      const res = await fetch(`${API}/transactions/koersen`);
      if (!res.ok) throw new Error('API fout');
      const data = await res.json();
      setKoersen(prev => prev.map(v => {
        const nieuweKoers = data.koersen?.[v.code] ?? v.huidigeKoers;
        const richting = nieuweKoers > v.huidigeKoers ? 1 : nieuweKoers < v.huidigeKoers ? -1 : v.richting;
        return { ...v, huidigeKoers: nieuweKoers, richting };
      }));
    } catch {
      // Simulatie fallback
      setKoersen(prev => prev.map(v => {
        const variatie = (Math.random() - 0.5) * 0.004;
        const nieuweKoers = parseFloat((v.huidigeKoers * (1 + variatie)).toFixed(v.huidigeKoers >= 100 ? 0 : 4));
        const richting = nieuweKoers > v.huidigeKoers ? 1 : -1;
        return { ...v, huidigeKoers: nieuweKoers, richting };
      }));
    }
  }

  useEffect(() => {
    haalKoersen();
    const interval = setInterval(haalKoersen, 60000);
    return () => clearInterval(interval);
  }, []);

  const items = [...koersen, ...koersen];

  function formatKoers(koers, decimals) {
    if (decimals === 0) return Math.round(koers).toLocaleString('nl-NL');
    return parseFloat(koers).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }

  return (
    <div
      className="overflow-hidden text-white relative"
      style={{
        height: '34px',
        background: 'linear-gradient(90deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
        borderBottom: '1px solid rgba(59,130,246,0.25)',
      }}
    >
      <div className="flex items-center h-full ticker-scroll">
        {items.map((v, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-5 whitespace-nowrap text-xs font-medium border-r border-blue-900/40 h-full"
          >
            <span className="text-sm leading-none">{EU_VLAG}</span>
            <span className="text-blue-200/80">EUR</span>
            <span className="text-blue-400/60 mx-0.5">→</span>
            <span className="text-sm leading-none">{v.vlag}</span>
            <span className="text-gray-100 font-semibold">{v.land}</span>
            <span
              className={`font-bold font-mono ml-1 px-1.5 py-0.5 rounded-md text-[11px] ${
                v.richting > 0
                  ? 'text-emerald-300 bg-emerald-500/15'
                  : v.richting < 0
                  ? 'text-rose-300 bg-rose-500/15'
                  : 'text-white bg-white/10'
              }`}
            >
              {v.richting > 0 ? '▲' : v.richting < 0 ? '▼' : ''}
              {' '}{v.symbool}{formatKoers(v.huidigeKoers, v.decimals)}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .ticker-scroll {
          animation: ticker 45s linear infinite;
          width: max-content;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
