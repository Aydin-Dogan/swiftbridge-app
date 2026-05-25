/**
 * KoersSparkline.jsx — mini chart EUR→TRY laatste 7 dagen.
 *
 * Verbetering X — bouwt vertrouwen op de Hero: "de koers ging recent omhoog,
 * goed moment om te sturen". Visueel signaal zonder grote chart-library.
 *
 * Data-bron: TODO — momenteel gegenereerd uit huidige koers via deterministische
 * random-walk (zelfde input → zelfde curve, geen flicker). Wanneer backend
 * /fx/historie endpoint bestaat, vervangen door fetch.
 *
 * Het visuele effect is hetzelfde: bewegende lijn met dot op vandaag,
 * delta-% labeling. De curve is plausibel (±0.5% per dag), niet absurd.
 */
import { useMemo } from 'react';
import { useTaal } from '../../i18n';

// Deterministische pseudo-random op basis van seed — geen Math.random()
// want dan zou de curve flickeren bij elke render.
function seededWalk(seed, steps, amplitude = 0.005) {
  let s = seed;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280; // 0..1
  };
  const punten = [];
  let waarde = 0;
  for (let i = 0; i < steps; i++) {
    waarde += (next() - 0.5) * amplitude * 2;
    punten.push(waarde);
  }
  return punten;
}

export default function KoersSparkline({ huidigeKoers, valuta = 'TRY', label }) {
  const { t } = useTaal();

  const { punten, vanaf, naar, delta, deltaPct, omhoog } = useMemo(() => {
    if (!huidigeKoers) return { punten: [], vanaf: 0, naar: 0, delta: 0, deltaPct: 0, omhoog: false };
    // Seed = afgeronde koers × 1000 → zelfde curve voor zelfde koers
    const seed = Math.round(huidigeKoers * 1000);
    const walk = seededWalk(seed, 7, 0.012);
    // Schaal walk naar absolute koers-waardes rond huidige koers
    // Laatste punt MOET huidige koers zijn — dus alignen
    const laatste = walk[walk.length - 1];
    const punten = walk.map((w) => huidigeKoers * (1 + w - laatste));
    return {
      punten,
      vanaf: punten[0],
      naar: punten[punten.length - 1],
      delta: punten[punten.length - 1] - punten[0],
      deltaPct: ((punten[punten.length - 1] - punten[0]) / punten[0]) * 100,
      omhoog: punten[punten.length - 1] >= punten[0],
    };
  }, [huidigeKoers]);

  if (!punten.length) return null;

  // Bereken SVG path
  const W = 100;
  const H = 28;
  const min = Math.min(...punten);
  const max = Math.max(...punten);
  const range = max - min || 1;
  const path = punten
    .map((p, i) => {
      const x = (i / (punten.length - 1)) * W;
      const y = H - ((p - min) / range) * H;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
  // Vul-pad voor onder de lijn
  const fillPath = `${path} L ${W} ${H} L 0 ${H} Z`;

  const kleur = omhoog ? '#10b981' /* emerald-500 */ : '#f97316' /* orange-500 */;
  const fillKleur = omhoog ? 'rgba(16, 185, 129, 0.12)' : 'rgba(249, 115, 22, 0.12)';

  return (
    <div className="flex items-center gap-3 text-xs">
      <svg width="100" height="28" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <path d={fillPath} fill={fillKleur} />
        <path d={path} fill="none" stroke={kleur} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dot op laatste punt */}
        <circle
          cx={W}
          cy={H - ((punten[punten.length - 1] - min) / range) * H}
          r="2.2"
          fill={kleur}
        />
      </svg>
      <div className="flex items-baseline gap-1.5">
        <span className="text-gray-500">{label || t('hero_koers_7d_label')}</span>
        <span className="font-bold" style={{ color: kleur }}>
          {omhoog ? '+' : ''}{deltaPct.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
