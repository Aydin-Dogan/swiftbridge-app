/**
 * StatistiekCards.jsx — Hero stats grid (4 boxes) voor dashboard
 *
 * Toont:
 * - Totaal overgemaakt deze maand (€)
 * - Aantal transacties
 * - Gemiddelde aankomsttijd (mock 4 min)
 * - Besparing tov bank (mock berekening: 2.5% extra marge gemiddelde bank)
 *
 * Glassmorphism cards met gradient accents. Mobile-first: 2×2 op <md, 4×1 op md+.
 * Laat skeletons zien tijdens loading. Cards animeren in met staggered fade-up.
 */
import { useMemo } from 'react';
import { useTaal } from '../../i18n';
import { Euro, Zap, Clock, Banknote } from '../icons/Icons';

function fmtEur(n, maxFractie = 0) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: maxFractie,
  }).format(n || 0);
}

// Indicatieve "bank tarief" is gemiddeld ~4.5% all-in (SWIFT + slechte koers + receiving fee).
// SwiftBridge ~2.0–2.5%. Verschil ≈ 2.0% van het overgemaakte bedrag = besparing.
function berekenBesparing(totaalEur) {
  return Math.max(0, totaalEur * 0.02);
}

export default function StatistiekCards({ transacties = [], laden = false }) {
  const { t } = useTaal();

  const stats = useMemo(() => {
    if (laden) return null;
    const nu = new Date();
    const dezeMaand = transacties.filter(tx => {
      const d = new Date(tx.aangemaaktOp || tx.datum || 0);
      return d.getMonth() === nu.getMonth() && d.getFullYear() === nu.getFullYear()
        && !['mislukt', 'geannuleerd'].includes(tx.status);
    });
    const totaal = dezeMaand.reduce((s, tx) => s + (tx.eurBedrag || 0), 0);
    return {
      totaal,
      aantal: dezeMaand.length,
      gemTijd: dezeMaand.length > 0 ? 4 : 5, // mock: <5 min typische aankomst
      bespaard: berekenBesparing(transacties.reduce((s, tx) => s + (tx.eurBedrag || 0), 0)),
    };
  }, [transacties, laden]);

  const boxes = [
    {
      Icoon: Euro,
      label: t('dashboard_stats_overgemaakt'),
      waarde: stats ? fmtEur(stats.totaal) : null,
      gradient: 'from-blue-500/20 to-indigo-500/10',
      accent: 'text-blue-700',
      ring: 'ring-blue-300/40',
    },
    {
      Icoon: Zap,
      label: t('dashboard_stats_aantal_tx'),
      waarde: stats ? String(stats.aantal) : null,
      gradient: 'from-violet-500/20 to-fuchsia-500/10',
      accent: 'text-violet-700',
      ring: 'ring-violet-300/40',
    },
    {
      Icoon: Clock,
      label: t('dashboard_stats_gem_tijd'),
      waarde: stats ? `${stats.gemTijd} ${t('dashboard_stats_min')}` : null,
      gradient: 'from-amber-500/20 to-orange-500/10',
      accent: 'text-amber-700',
      ring: 'ring-amber-300/40',
    },
    {
      Icoon: Banknote,
      label: t('dashboard_stats_bespaard'),
      waarde: stats ? fmtEur(stats.bespaard) : null,
      gradient: 'from-emerald-500/20 to-teal-500/10',
      accent: 'text-emerald-700',
      ring: 'ring-emerald-300/40',
    },
  ];

  return (
    <section aria-label={t('dashboard_stats_maand_titel')} className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {t('dashboard_stats_maand_titel')}
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {boxes.map((box, i) => (
          <div
            key={box.label}
            className={`relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Subtle gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${box.gradient} opacity-60 pointer-events-none`} aria-hidden="true" />
            {/* Inner ring accent */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${box.ring} ring-8 opacity-30 pointer-events-none`} aria-hidden="true" />
            <div className="relative">
              <div className={`mb-2 ${box.accent}`} aria-hidden="true">
                <box.Icoon className="w-5 h-5" />
              </div>
              {laden ? (
                <div className="space-y-2">
                  <div className="h-5 w-20 rounded-md animate-shimmer" />
                  <div className="h-3 w-14 rounded-md animate-shimmer" />
                </div>
              ) : (
                <>
                  <div className={`text-lg font-extrabold ${box.accent} font-mono leading-tight`}>
                    {box.waarde}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {box.label}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
