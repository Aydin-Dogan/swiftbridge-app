/**
 * CTA.jsx — Final conversion section.
 * Bank-stijl: volle brand-gradient band (from-brand-800 to-brand-500) met
 * gecentreerde copy, amber primaire knop en outline-secundaire op donker.
 */
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { ArrowRight, ShieldCheck, Zap, Clock } from '../icons/Icons';

export default function CTA() {
  const navigate = useNavigate();
  const { t } = useTaal();

  return (
    <section className="py-20 sm:py-24 px-4 bg-gradient-to-br from-brand-800 to-brand-500 text-white text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl sm:text-4xl font-medium text-white leading-[1.18] mb-3">
          {t('landing_cta_titel')}
        </h2>
        <p className="text-blue-100 max-w-[52ch] mx-auto mb-6">
          {t('landing_cta_subtitel')}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-6">
          <button
            onClick={() => navigate('/calculator')}
            className="btn-inst-ondark inline-flex items-center justify-center gap-2"
          >
            {t('landing_cta_primary')}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="border border-white/30 text-white uppercase tracking-[0.2em] text-[0.7rem] font-medium px-5 py-3 rounded-[3px] hover:bg-white/10 transition"
          >
            {t('landing_cta_secondary')}
          </button>
        </div>

        <p className="text-blue-100/80 text-xs mb-8">
          {t('landing_cta_disclaimer')}
        </p>

        {/* 3 trust-bullets — herstijld voor de donkere band */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 text-accent-400 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">{t('landing_cta_bullet_snel_titel')}</div>
              <div className="text-xs text-blue-100/80">{t('landing_cta_bullet_snel_sub')}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 text-accent-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">{t('landing_cta_bullet_veilig_titel')}</div>
              <div className="text-xs text-blue-100/80">{t('landing_cta_bullet_veilig_sub')}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 text-accent-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">{t('landing_cta_bullet_geen_account_titel')}</div>
              <div className="text-xs text-blue-100/80">{t('landing_cta_bullet_geen_account_sub')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
