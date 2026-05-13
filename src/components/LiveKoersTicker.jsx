import { useState, useEffect } from 'react';

const VALUTA = [
  { code: 'TRY', land: 'Turkije',      vlag: '🇹🇷', basisKoers: 36.20 },
  { code: 'AZN', land: 'Azerbeidzjan', vlag: '🇦🇿', basisKoers: 1.89 },
  { code: 'KZT', land: 'Kazachstan',   vlag: '🇰🇿', basisKoers: 512.40 },
  { code: 'UZS', land: 'Oezbekistan',  vlag: '🇺🇿', basisKoers: 13850.00 },
  { code: 'TMT', land: 'Turkmenistan', vlag: '🇹🇲', basisKoers: 3.85 },
  { code: 'KGS', land: 'Kirgizistan',  vlag: '🇰🇬', basisKoers: 96.40 },
  { code: 'TJS', land: 'Tadzjikistan', vlag: '🇹🇯', basisKoers: 11.20 },
];

function simuleerKoers(basis) {
  const variatie = (Math.random() - 0.5) * 0.004;
  return (basis * (1 + variatie)).toFixed(basis >= 100 ? 0 : 2);
}

export default function LiveKoersTicker() {
  const [koersen, setKoersen] = useState(
    VALUTA.map(v => ({ ...v, koers: v.basisKoers.toFixed(v.basisKoers >= 100 ? 0 : 2), richting: 0 }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setKoersen(prev => prev.map(v => {
        const nieuweKoers = simuleerKoers(v.basisKoers);
        const richting = parseFloat(nieuweKoers) > parseFloat(v.koers) ? 1 : -1;
        return { ...v, koers: nieuweKoers, richting };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Dupliceer voor naadloze loop
  const items = [...koersen, ...koersen];

  return (
    <div className="bg-gray-900 text-white overflow-hidden" style={{ height: '32px' }}>
      <div className="flex items-center h-full ticker-scroll">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5 px-5 whitespace-nowrap text-xs font-medium border-r border-gray-700 h-full">
            <span className="text-base leading-none">{v.vlag}</span>
            <span className="text-gray-400">EUR/{v.code}</span>
            <span className={`font-bold ${v.richting > 0 ? 'text-green-400' : v.richting < 0 ? 'text-red-400' : 'text-white'}`}>
              {v.richting > 0 ? '▲' : v.richting < 0 ? '▼' : ''}
              {' '}{parseFloat(v.koers).toLocaleString('nl-NL')}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .ticker-scroll {
          animation: ticker 30s linear infinite;
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
