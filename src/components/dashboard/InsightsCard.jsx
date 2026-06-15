/**
 * InsightsCard.jsx — "Wist je dat?" tips kaartje
 *
 * - Toont rotatie van tips elke 8s (mits niet `reduce motion`)
 * - Subtle gradient, niet-storend
 * - Inhoud is contextueel (koers trend, besparing, snelheid)
 */
import { useEffect, useState, useMemo } from 'react';
import { useTaal } from '../../i18n';
import { ChevronUp, Banknote, Zap, Bell, Lock } from '../icons/Icons';

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
          Icoon: ChevronUp,
          tekst: t('dashboard_tip_1', { pct: pct.toFixed(1) }),
        });
      }
    }
    if (totaalBesparing > 0) {
      lijst.push({
        Icoon: Banknote,
        tekst: t('dashboard_tip_2', { bedrag: fmtEur(totaalBesparing) }),
      });
    }
    lijst.push({
      Icoon: Zap,
      tekst: t('dashboard_tip_3'),
    });
    lijst.push({
      Icoon: Bell,
      tekst: t('dashboard_tip_4'),
    });
    lijst.push({
      Icoon: Lock,
      tekst: t('dashboard_tip_5'),
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
      className="relative overflow-hidden rounded-md border border-border bg-surface p-4 shadow-soft animate-fade-up"
    >
      <div className="relative flex items-start gap-3">
        <huidige.Icoon className="w-6 h-6 text-ink-2 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-0.5">
            {t('dashboard_tips_titel')}
          </div>
          <p className="text-sm text-ink-2 leading-snug">
            {huidige.tekst}
          </p>
        </div>
        {tips.length > 1 && (
          <div className="flex flex-col gap-1 flex-shrink-0 mt-1" aria-hidden="true">
            {tips.map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full transition-all ${
                  i === idx ? 'bg-ink-1' : 'bg-ink-3'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
