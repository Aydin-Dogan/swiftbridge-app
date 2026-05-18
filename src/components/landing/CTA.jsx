/**
 * CTA.jsx — Final conversion section with gradient background.
 */
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';

export default function CTA() {
  const navigate = useNavigate();
  const { t } = useTaal();

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background:
          'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 35%, #059669 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 30%, rgba(255,255,255,0.18) 0, transparent 50%), radial-gradient(circle at 20% 80%, rgba(250,204,21,0.18) 0, transparent 50%)',
        }}
        aria-hidden="true"
      />
      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-20 text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
          {t('landing_cta_titel')}
        </h2>
        <p className="text-blue-100/95 text-base sm:text-lg max-w-xl mx-auto mb-8">
          {t('landing_cta_subtitel')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/login?tab=register')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold text-blue-700 bg-white hover:bg-blue-50 transition shadow-2xl active:scale-[0.98]"
          >
            {t('landing_cta_primary')} →
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-bold text-white border border-white/30 hover:bg-white/10 transition"
          >
            {t('landing_cta_secondary')}
          </button>
        </div>
        <p className="text-blue-100/80 text-xs mt-5">
          {t('landing_cta_disclaimer')}
        </p>
      </div>
    </section>
  );
}
