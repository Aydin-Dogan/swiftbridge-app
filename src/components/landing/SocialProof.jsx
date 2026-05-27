/**
 * SocialProof.jsx — Stats bar + testimonial cards with Turkish names.
 */
import { useTaal } from '../../i18n';

function StarRating({ rating = 5 }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`w-4 h-4 ${i <= rating ? 'fill-amber-400' : 'fill-gray-200'}`}
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// Tot we échte (geanonimiseerde) klant-testimonials hebben met geschreven
// toestemming, blijven deze placeholders met initialen + stad uit en wachten
// we tot er werkelijke quotes binnenkomen. Wel landing tonen door inhoud
// in i18n keys leeg te laten als we geen echte reviews hebben.
const TESTIMONIALS = [];

// ⚠️ HARDE REGEL: geen verzonnen statistieken op landing. Tot we échte data
// hebben (geverifieerd via admin/stats endpoint of Trustpilot-koppeling)
// gebruiken we feitelijke beschrijvingen — geen aantallen.
const STATS = [
  { key: 'banken', getal: '100+' },        // echt — turkstaligeBanken.js
  { key: 'talen', getal: '5' },             // echt — i18n/{nl,en,tr,ru,az}
  { key: 'snelheid', getal: '<5 min' },     // echt — gemiddeld via iDEAL
  // F24 fix (Cursor review): "vanaf 0,8%" AFM-richtlijn problematisch.
  // Concretere framing: staffel vermeld zodat verwachting reëel is.
  { key: 'fee', getal: '0,8% - 2,0%' },     // staffel — tariefkaart §4.4
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
              'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #047857 100%)',
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

        {/* Testimonials worden zichtbaar zodra we échte klant-quotes hebben
            (met schriftelijke toestemming). Tot dan: alleen stats-bar boven. */}
        {TESTIMONIALS.length > 0 && (
          <>
            <div className="text-center mb-10">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                {t('landing_reviews_eyebrow')}
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                {t('landing_reviews_titel')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((tt, i) => (
                <div
                  key={tt.key}
                  className="card-glass p-6 animate-fade-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                      style={{ background: tt.color }}
                    >
                      {tt.initial}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{tt.naam}</div>
                      <div className="text-xs text-gray-500">{tt.plaats}</div>
                    </div>
                    <div className="ml-auto">
                      <StarRating rating={5} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    &ldquo;{t(`landing_testimonial_${tt.key}`)}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
