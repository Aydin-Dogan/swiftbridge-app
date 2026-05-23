/**
 * Features.jsx — Three-column feature grid.
 * Sprint 2: één brand-color voor alle 3 icons, soft-shadow ipv glassmorphism.
 */
import { useTaal } from '../../i18n';
import { Zap, Euro, ShieldCheck } from '../icons/Icons';

const FEATURES = [
  { Icon: Zap,         key: 'snel' },
  { Icon: Euro,        key: 'goedkoop' },
  { Icon: ShieldCheck, key: 'veilig' },
];

export default function Features() {
  const { t } = useTaal();

  return (
    <section id="features" className="py-20 sm:py-24 px-4 bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">
            {t('landing_features_eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            {t('landing_features_titel')}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base">
            {t('landing_features_subtitel')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.key}
              className="bg-white rounded-2xl p-7 border border-gray-200/70 shadow-soft-sm animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <f.Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
