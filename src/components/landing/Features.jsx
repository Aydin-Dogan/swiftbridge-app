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
          <p className="text-[0.68rem] font-medium text-brand-600 uppercase tracking-[0.26em] mb-3">
            {t('landing_features_eyebrow')}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-gray-900 leading-[1.18] mb-2.5">
            {t('landing_features_titel')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t('landing_features_subtitel')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-200 bg-white mt-10">
          {FEATURES.map((f, i) => (
            <div
              key={f.key}
              className="p-7 sm:p-[30px] border-b border-gray-200 md:border-b-0 md:border-r md:border-gray-200 last:border-r-0 last:border-b-0 animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <f.Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-medium text-brand-800 mb-2">
                {t(`landing_feature_${f.key}_titel`)}
              </h3>
              <p className="text-gray-500 text-[0.93rem] leading-relaxed">
                {t(`landing_feature_${f.key}_tekst`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
