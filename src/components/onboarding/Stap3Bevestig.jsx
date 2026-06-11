/**
 * Stap3Bevestig.jsx — KYC voltooid + welkomstdeal onthullen
 *
 * - Toont alleen als gebruiker.kycStatus === 'goedgekeurd'
 * - Gradient achtergrond met confetti pattern (CSS only)
 * - Promo code "WELKOM800" tonen (mock, in productie genereert backend dit)
 * - CTA naar Stap 4
 */
import { useTaal } from '../../i18n';
import { Sparkles, Check } from '../icons/Icons';

const PROMO_CODE = 'WELKOM800';

export default function Stap3Bevestig({ onVolgende }) {
  const { t } = useTaal();

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mb-2 flex justify-center" aria-hidden="true">
          <Sparkles className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
          {t('onb_bevestig_titel')} <Check className="w-6 h-6 inline text-emerald-600" />
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          {t('onb_bevestig_subtitel')}
        </p>
      </div>

      {/* Promo card met gradient + confetti pattern */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        }}
      >
        {/* Confetti pattern overlay */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 1.5px, transparent 2px), ' +
              'radial-gradient(circle at 70% 80%, rgba(255,255,255,0.5) 1px, transparent 1.5px), ' +
              'radial-gradient(circle at 90% 20%, rgba(255,255,255,0.6) 1.5px, transparent 2px), ' +
              'radial-gradient(circle at 40% 70%, rgba(255,255,255,0.4) 1px, transparent 1.5px), ' +
              'radial-gradient(circle at 10% 90%, rgba(255,255,255,0.5) 1.5px, transparent 2px)',
            backgroundSize: '120px 120px',
          }}
          aria-hidden="true"
        />
        <div className="relative space-y-3 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">
            {t('onb_bevestig_promo_label')}
          </p>
          <p className="text-3xl font-extrabold">{t('onb_bevestig_promo_titel')}</p>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 inline-block border border-white/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70 mb-1">
              {t('onb_bevestig_promo_code_label')}
            </p>
            <p className="font-mono text-xl font-bold tracking-wider">{PROMO_CODE}</p>
          </div>
          <p className="text-xs text-white/90 max-w-xs mx-auto">
            {t('onb_bevestig_promo_uitleg')}
          </p>
        </div>
      </div>

      {/* Next step uitleg */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {t('onb_bevestig_volgende_label')}
        </p>
        <p className="text-sm text-slate-700 font-medium">{t('onb_bevestig_volgende_tekst')}</p>
      </div>

      {/* CTA */}
      <button
        onClick={onVolgende}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-emerald-300"
      >
        {t('onb_bevestig_cta')} →
      </button>
    </div>
  );
}
