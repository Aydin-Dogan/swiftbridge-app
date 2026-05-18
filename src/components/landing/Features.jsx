/**
 * Features.jsx — Three-column feature grid with SVG icons.
 */
import { useTaal } from '../../i18n';

// Inline SVG icoontjes — geen externe afhankelijkheden
const ICONS = {
  rocket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  coins: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
};

const FEATURES = [
  {
    icon: 'rocket',
    color: 'from-blue-500 to-indigo-500',
    key: 'snel',
  },
  {
    icon: 'coins',
    color: 'from-emerald-500 to-teal-500',
    key: 'goedkoop',
  },
  {
    icon: 'shield',
    color: 'from-amber-500 to-orange-500',
    key: 'veilig',
  },
];

export default function Features() {
  const { t } = useTaal();

  return (
    <section id="features" className="py-16 sm:py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
            {t('landing_features_eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            {t('landing_features_titel')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t('landing_features_subtitel')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.key}
              className="card-glass p-7 text-left animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center mb-5 shadow-lg`}
              >
                {ICONS[f.icon]}
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                {t(`landing_feature_${f.key}_titel`)}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t(`landing_feature_${f.key}_tekst`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
