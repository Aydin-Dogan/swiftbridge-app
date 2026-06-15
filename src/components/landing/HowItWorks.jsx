/**
 * HowItWorks.jsx — 4-step explainer met SVG-iconen.
 * Sprint 2: emoji's vervangen door consistente Icons-set.
 */
import { useTaal } from '../../i18n';
import { User, IdCard, Card, CheckCircle } from '../icons/Icons';

const STAPPEN = [
  { nr: 1, Icon: User,        key: 'account' },
  { nr: 2, Icon: IdCard,      key: 'idin' },
  { nr: 3, Icon: Card,        key: 'ideal' },
  { nr: 4, Icon: CheckCircle, key: 'ontvangen' },
];

export default function HowItWorks() {
  const { t } = useTaal();

  return (
    <section id="hoe-werkt-het" className="py-20 sm:py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[0.68rem] font-medium text-brand-600 uppercase tracking-[0.26em] mb-3">
            {t('landing_how_eyebrow')}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-gray-900 leading-[1.18] mb-2.5">
            {t('landing_how_titel')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t('landing_how_subtitel')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {STAPPEN.map((s, i) => (
            <div
              key={s.nr}
              className="flex items-start gap-[18px] mb-[22px] last:mb-0 animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex-shrink-0 w-[38px] h-[38px] rounded-full border border-brand-500 text-brand-600 font-display text-base grid place-items-center">
                {s.nr}
              </div>
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-brand-50 border border-brand-100">
                <s.Icon className="w-6 h-6 text-brand-600" />
              </div>
              <div className="pt-1">
                <b className="block font-semibold text-gray-900">
                  {t(`landing_step_${s.key}_titel`)}
                </b>
                <p className="text-gray-500 text-[0.94rem] leading-relaxed">
                  {t(`landing_step_${s.key}_tekst`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
