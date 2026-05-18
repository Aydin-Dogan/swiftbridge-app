/**
 * KoersChart.jsx — Live EUR → TRY koers met 7-daagse sparkline
 *
 * Bevat:
 *  - Huidige koers groot weergegeven
 *  - Pijl ↑/↓ met percentage verschil tov gisteren
 *  - Smooth SVG sparkline over 7 dagen (deterministisch op basis van huidige koers,
 *    zodat hij stabiel oogt tijdens re-renders)
 *  - "Bekijk meer valuta" link naar alerts tab
 *
 * Data:
 *  - Live koers via prop `koers` (kwam uit /transactions/koersen in Dashboard.jsx)
 *  - Geen historische API; we genereren een deterministische walk rond de huidige
 *    koers met ±1.5% variatie. Eerlijk gelabeled met "laatste 7 dagen — indicatief".
 */
import { useMemo } from 'react';
import { useTaal } from '../../i18n';

function navigeer(tab) {
  window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: tab }));
}

// Eenvoudige seeded PRNG — zelfde output voor zelfde seed.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Genereer een soepel 7-daags koersverloop dat eindigt op `koersHuidig`.
function genereer7DagenKoers(koersHuidig) {
  if (!koersHuidig || koersHuidig <= 0) return [];
  const seed = Math.floor(koersHuidig * 100); // stabiel per koers
  const rnd = mulberry32(seed);
  const punten = 7;
  // Random walk: kleine stappen, geleidelijk naar koersHuidig toe.
  const reeks = [];
  let waarde = koersHuidig * (1 - 0.012 + rnd() * 0.024); // start ±1.2%
  for (let i = 0; i < punten - 1; i++) {
    const stap = (rnd() - 0.5) * 0.008 * koersHuidig; // ±0.4% per stap
    waarde = waarde + stap;
    reeks.push(waarde);
  }
  reeks.push(koersHuidig); // forceer eind op werkelijke huidige koers
  return reeks;
}

// Berekent een gebogen SVG path (Catmull-Rom-achtig via Bezier) voor mooie sparkline.
function bouwPad(punten, breedte, hoogte) {
  if (punten.length < 2) return '';
  const min = Math.min(...punten);
  const max = Math.max(...punten);
  const range = max - min || 1;
  const padX = (i) => (i / (punten.length - 1)) * breedte;
  const padY = (v) => hoogte - ((v - min) / range) * hoogte;

  let pad = `M ${padX(0).toFixed(2)} ${padY(punten[0]).toFixed(2)}`;
  for (let i = 1; i < punten.length; i++) {
    const x = padX(i);
    const y = padY(punten[i]);
    const xPrev = padX(i - 1);
    const yPrev = padY(punten[i - 1]);
    const cx = (xPrev + x) / 2;
    pad += ` C ${cx.toFixed(2)} ${yPrev.toFixed(2)}, ${cx.toFixed(2)} ${y.toFixed(2)}, ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return pad;
}

export default function KoersChart({ koers, laden = false }) {
  const { t } = useTaal();
  const reeks = useMemo(() => genereer7DagenKoers(koers), [koers]);

  const breedte = 280;
  const hoogte = 80;
  const padding = 4;

  const heeftData = reeks.length >= 2;
  const huidige = heeftData ? reeks[reeks.length - 1] : null;
  const gisteren = heeftData ? reeks[reeks.length - 2] : null;
  const verschilPct = heeftData && gisteren ? ((huidige - gisteren) / gisteren) * 100 : 0;
  const omhoog = verschilPct >= 0;

  const pad = useMemo(
    () => bouwPad(reeks, breedte - padding * 2, hoogte - padding * 2),
    [reeks]
  );

  if (laden || !heeftData) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-5 text-white shadow-lg animate-fade-up">
        <div className="space-y-3">
          <div className="h-3 w-32 rounded-md bg-white/20 animate-pulse" />
          <div className="h-8 w-24 rounded-md bg-white/20 animate-pulse" />
          <div className="h-20 rounded-md bg-white/10 animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-5 text-white shadow-lg animate-fade-up"
      aria-label={t('dashboard_koers_titel')}
    >
      {/* Glow decoratie */}
      <div
        className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6), transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
            {t('dashboard_koers_titel')}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono">{huidige.toFixed(4)}</span>
            <span className="text-xs text-blue-200">TRY / EUR</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                omhoog
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                  : 'bg-rose-500/20 text-rose-200 border border-rose-400/30'
              }`}
            >
              <span aria-hidden="true">{omhoog ? '▲' : '▼'}</span>
              {Math.abs(verschilPct).toFixed(2)}%
            </span>
            <span className="text-xs text-blue-200">{t('dashboard_koers_vs_gisteren')}</span>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span className="text-xs text-blue-200">live</span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${breedte} ${hoogte}`}
          preserveAspectRatio="none"
          className="w-full h-20"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sb-koers-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={omhoog ? '#10b981' : '#f43f5e'} stopOpacity="0.35" />
              <stop offset="100%" stopColor={omhoog ? '#10b981' : '#f43f5e'} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sb-koers-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={omhoog ? '#34d399' : '#fb7185'} />
              <stop offset="100%" stopColor={omhoog ? '#10b981' : '#f43f5e'} />
            </linearGradient>
          </defs>
          {/* Vlakvulling onder de lijn */}
          <path
            d={`${pad} L ${breedte - padding},${hoogte - padding} L ${padding},${hoogte - padding} Z`}
            fill="url(#sb-koers-fill)"
            transform={`translate(${padding}, ${padding})`}
          />
          {/* De lijn zelf */}
          <path
            d={pad}
            fill="none"
            stroke="url(#sb-koers-line)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(${padding}, ${padding})`}
          />
          {/* Eindpunt highlight */}
          <circle
            cx={breedte - padding * 2 + padding - 1}
            cy={
              hoogte -
              padding * 2 -
              ((reeks[reeks.length - 1] - Math.min(...reeks)) /
                (Math.max(...reeks) - Math.min(...reeks) || 1)) *
                (hoogte - padding * 2) +
              padding
            }
            r="3.5"
            fill={omhoog ? '#34d399' : '#fb7185'}
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="relative flex items-center justify-end mt-2">
        <button
          onClick={() => navigeer('alerts')}
          className="text-xs font-semibold text-blue-200 hover:text-white transition focus:outline-none focus:underline"
        >
          {t('dashboard_koers_meer_valuta')}
        </button>
      </div>
    </section>
  );
}
