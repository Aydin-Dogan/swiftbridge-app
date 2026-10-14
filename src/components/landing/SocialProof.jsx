/**
 * SocialProof.jsx — balk met de twee getallen die echt kloppen: aantal talen en
 * de vaste fee.
 *
 * 14-10-2026: de verzonnen klantverhalen, sterren en reviewaantallen zijn weg,
 * ook uit de taalbestanden (bewaakt door src/lib/geenNepReviews.test.js).
 * Klantervaringen komen pas terug als ze echt zijn, met schriftelijke
 * toestemming en bronvermelding.
 */
import { useTaal } from '../../i18n';

// HARDE REGEL: geen verzonnen statistieken op landing. Tot we échte data
// hebben (geverifieerd via admin/stats endpoint of Trustpilot-koppeling)
// gebruiken we feitelijke beschrijvingen — geen aantallen.
// 12-10-2026: 'banken' (100+) en 'snelheid' weggehaald — er is nog geen
// uitbetaalpartner, dus geen ondersteunde banken en geen levertijd om te tonen.
const STATS = [
  { key: 'talen', getal: '5' }, // echt — i18n/{nl,en,tr,ru,az}
  // F24 fix (Cursor review): los "vanaf"-percentage AFM-richtlijn
  // problematisch. Vaste fee is het enige harde getal; de koersmarge
  // (1,2% → 0,6% per ledenniveau) staat in de tariefkaart-sectie ernaast.
  { key: 'fee', getal: '€4,95' }, // vaste fee — tariefkaart §4.4
];

export default function SocialProof() {
  const { t } = useTaal();

  return (
    <section className="py-16 sm:py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Stats bar */}
        <div
          className="rounded-3xl p-7 sm:p-10 mb-12 text-white relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #142641 0%, #1B3252 50%, #22416B 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 90% 10%, rgba(250,204,21,0.4) 0, transparent 50%)',
            }}
            aria-hidden="true"
          />
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <div
                key={s.key}
                className="text-center md:text-left animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-white to-amber-200 bg-clip-text text-transparent">
                  {s.getal}
                </div>
                <div className="text-xs text-blue-100 mt-1 font-medium">
                  {t(`landing_stat_${s.key}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
