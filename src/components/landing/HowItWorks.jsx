/**
 * HowItWorks.jsx — 4-step explainer with connecting line on desktop.
 */
import { useTaal } from '../../i18n';

const STAPPEN = [
  { nr: 1, icoon: '👤', key: 'account' },
  { nr: 2, icoon: '🪪', key: 'idin' },
  { nr: 3, icoon: '💳', key: 'ideal' },
  { nr: 4, icoon: '✅', key: 'ontvangen' },
];

export default function HowItWorks() {
  const { t } = useTaal();

  return (
    <section
      id="hoe-werkt-het"
      className="py-16 sm:py-20 px-4"
      style={{
        background:
          'linear-gradient(180deg, #f8fafc 0%, #eff6ff 50%, #f8fafc 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
            {t('landing_how_eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            {t('landing_how_titel')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t('landing_how_subtitel')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Verbindingslijn alleen op desktop */}
          <div
            className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 z-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(59,130,246,0.4) 0%, rgba(16,185,129,0.4) 100%)',
            }}
            aria-hidden="true"
          />

          {STAPPEN.map((s, i) => (
            <div
              key={s.nr}
              className="relative z-10 text-center animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl shadow-lg"
                  style={{
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                    border: '2px solid rgba(59,130,246,0.25)',
                  }}
                >
                  {s.icoon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md ring-4 ring-white">
                  {s.nr}
                </div>
              </div>
              <h3 className="font-extrabold text-gray-900 text-base mb-1.5">
                {t(`landing_step_${s.key}_titel`)}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed px-2">
                {t(`landing_step_${s.key}_tekst`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
