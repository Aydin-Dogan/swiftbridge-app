/**
 * CTA.jsx — Final conversion section.
 * Sprint 2 deel 2: distinct van Hero. Hero is donker-blauw gradient,
 * CTA wordt licht met soft-shadow kaart — voelt als "ander moment in flow".
 */
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { ArrowRight, ShieldCheck, Zap, Clock } from '../icons/Icons';

export default function CTA() {
  const navigate = useNavigate();
  const { t } = useTaal();

  return (
    <section className="py-20 sm:py-24 px-4 bg-gray-50/50">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-white rounded-3xl border border-gray-200 shadow-soft-lg overflow-hidden">
          {/* Subtiele brand-accent links */}
          <div
            className="absolute top-0 left-0 w-1.5 h-full bg-brand-cta"
            aria-hidden="true"
          />

          <div className="relative p-8 sm:p-12 md:p-16">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 items-center">
              {/* Linker: tekst + CTA's */}
              <div className="md:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3 leading-tight">
                  {t('landing_cta_titel')}
                </h2>
                <p className="text-gray-600 text-base max-w-md mb-7 leading-relaxed">
                  {t('landing_cta_subtitel')}
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                  <button
                    onClick={() => navigate('/calculator')}
                    className="btn-primary px-7 py-3.5 text-base inline-flex items-center justify-center gap-2"
                  >
                    {t('landing_cta_primary')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-secondary px-5 py-3.5 text-sm"
                  >
                    {t('landing_cta_secondary')}
                  </button>
                </div>

                <p className="text-gray-500 text-xs">
                  {t('landing_cta_disclaimer')}
                </p>
              </div>

              {/* Rechter: 3 trust-bullets (alleen md+) */}
              <div className="hidden md:flex flex-col gap-4 border-l border-gray-200 pl-8">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t('landing_cta_bullet_snel_titel')}</div>
                    <div className="text-xs text-gray-500">{t('landing_cta_bullet_snel_sub')}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t('landing_cta_bullet_veilig_titel')}</div>
                    <div className="text-xs text-gray-500">{t('landing_cta_bullet_veilig_sub')}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t('landing_cta_bullet_geen_account_titel')}</div>
                    <div className="text-xs text-gray-500">{t('landing_cta_bullet_geen_account_sub')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
