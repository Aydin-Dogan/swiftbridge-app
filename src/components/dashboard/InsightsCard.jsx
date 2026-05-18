/**
 * InsightsCard.jsx — "Wist je dat?" tips kaartje
 *
 * - Toont rotatie van tips elke 8s (mits niet `reduce motion`)
 * - Subtle gradient, niet-storend
 * - Inhoud is contextueel (koers trend, besparing, snelheid)
 */
import { useEffect, useState, useMemo } from 'react';
import { useTaal } from '../../i18n';

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function InsightsCard({ koers, koersGisteren, totaalBesparing }) {
  const { t } = useTaal();

  const tips = useMemo(() => {
    const lijst = [];
    if (koers && koersGisteren) {
      const pct = ((koers - koersGisteren) / koersGisteren) * 100;
      if (pct > 0.1) {
        lijst.push({
          icoon: '📈',
          tekst: t('dashboard_tip_1', { pct: pct.toFixed(1) }),
          accent: 'from-emerald-500/20 to-teal-500/10',
        });
      }
    }
    if (totaalBesparing > 0) {
      lijst.push({
        icoon: '💰',
        tekst: t('dashboard_tip_2', { bedrag: fmtEur(totaalBesparing) }),
        accent: 'from-amber-500/20 to-orange-500/10',
      });
    }
    lijst.push({
      icoon: '⚡',
      tekst: t('dashboard_tip_3'),
      accent: 'from-blue-500/20 to-indigo-500/10',
    });
    lijst.push({
      icoon: '🔔',
      tekst: t('dashboard_tip_4'),
      accent: 'from-violet-500/20 to-fuchsia-500/10',
    });
    lijst.push({
      icoon: '🔒',
      tekst: t('dashboard_tip_5'),
      accent: 'from-slate-500/20 to-slate-400/10',
    });
    return lijst;
  }, [koers, koersGisteren, totaalBesparing, t]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || tips.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % tips.length), 8000);
    return () => clearInterval(id);
  }, [tips.length]);

  if (tips.length === 0) return null;
  const huidige = tips[idx];

  return (
    <section
      aria-label={t('dashboard_tips_titel')}
      className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg p-4 shadow-sm animate-fade-up"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${huidige.accent} opacity-60 pointer-events-none transition-all duration-500`}
        aria-hidden="true"
      />
      <div className="relative flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">{huidige.icoon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
            {t('dashboard_tips_titel')}
          </div>
          <p className="text-sm text-slate-700 leading-snug">
            {huidige.tekst}
          </p>
        </div>
        {tips.length > 1 && (
          <div className="flex flex-col gap-1 flex-shrink-0 mt-1" aria-hidden="true">
            {tips.map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full transition-all ${
                  i === idx ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
