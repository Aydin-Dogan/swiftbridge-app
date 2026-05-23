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
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">
            {t('landing_how_eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            {t('landing_how_titel')}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base">
            {t('landing_how_subtitel')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative">
          {/* Verbindingslijn op desktop — subtieler, matte */}
          <div
            className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px z-0"
            style={{ background: 'linear-gradient(90deg, transparent 0%, #cbd5e1 20%, #cbd5e1 80%, transparent 100%)' }}
            aria-hidden="true"
          />

          {STAPPEN.map((s, i) => (
            <div
              key={s.nr}
              className="relative z-10 text-center animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-20 h-20 mx-auto mb-5 relative">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-brand-50 border border-brand-100">
                  <s.Icon className="w-9 h-9 text-brand-600" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center ring-4 ring-white">
                  {s.nr}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                {t(`landing_step_${s.key}_titel`)}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t(`landing_step_${s.key}_tekst`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
