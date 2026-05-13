import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const VALUTA = [
  { code: 'TRY', land: 'Turkije',      vlag: '🇹🇷', basisKoers: 36.20 },
  { code: 'AZN', land: 'Azerbeidzjan', vlag: '🇦🇿', basisKoers: 1.89 },
  { code: 'KZT', land: 'Kazachstan',   vlag: '🇰🇿', basisKoers: 512.40 },
  { code: 'UZS', land: 'Oezbekistan',  vlag: '🇺🇿', basisKoers: 13850.00 },
  { code: 'TMT', land: 'Turkmenistan', vlag: '🇹🇲', basisKoers: 3.85 },
  { code: 'KGS', land: 'Kirgizistan',  vlag: '🇰🇬', basisKoers: 96.40 },
  { code: 'TJS', land: 'Tadzjikistan', vlag: '🇹🇯', basisKoers: 11.20 },
];

const EU_VLAG = '🇪🇺';

export default function LiveKoersTicker() {
  const [koersen, setKoersen] = useState(
    VALUTA.map(v => ({ ...v, koers: v.basisKoers, richting: 0 }))
  );

  async function haalKoersen() {
    try {
      const res = await fetch(`${API}/transactions/koersen`);
      if (!res.ok) throw new Error('API fout');
      const data = await res.json();

      setKoersen(prev => prev.map(v => {
        const nieuweKoers = data.koersen[v.code] ?? v.koers;
        const richting = nieuweKoers > v.koers ? 1 : nieuweKoers < v.koers ? -1 : v.richting;
        return { ...v, koers: nieuweKoers, richting };
      }));
    } catch {
      // Fallback: kleine simulatie als API niet bereikbaar
      setKoersen(prev => prev.map(v => {
        const variatie = (Math.random() - 0.5) * 0.004;
        const nieuweKoers = parseFloat((v.koers * (1 + variatie)).toFixed(v.koers >= 100 ? 0 : 4));
        const richting = nieuweKoers > v.koers ? 1 : -1;
        return { ...v, koers: nieuweKoers, richting };
      }));
    }
  }

  useEffect(() => {
    haalKoersen(); // Direct bij opstarten
    const interval = setInterval(haalKoersen, 60000); // Elke 60 seconden
    return () => clearInterval(interval);
  }, []);

  // Dupliceer voor naadloze loop
  const items = [...koersen, ...koersen];

  function formatKoers(koers, code) {
    if (code === 'KZT' || code === 'UZS') {
      return Math.round(koers).toLocaleString('nl-NL');
    }
    return parseFloat(koers).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }

  return (
    <div className="bg-gray-900 text-white overflow-hidden" style={{ height: '32px' }}>
      <div className="flex items-center h-full ticker-scroll">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-2 px-5 whitespace-nowrap text-xs font-medium border-r border-gray-700 h-full">
            <span className="text-base leading-none">{EU_VLAG}</span>
            <span className="text-gray-400">Europa</span>
            <span className="text-gray-500 mx-0.5">→</span>
            <span className="text-base leading-none">{v.vlag}</span>
            <span className="text-gray-300 font-semibold">{v.land}</span>
            <span className={`font-bold ml-1 ${v.richting > 0 ? 'text-green-400' : v.richting < 0 ? 'text-red-400' : 'text-white'}`}>
              {v.richting > 0 ? '▲' : v.richting < 0 ? '▼' : ''}
              {' '}{formatKoers(v.koers, v.code)}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .ticker-scroll {
          animation: ticker 35s linear infinite;
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
