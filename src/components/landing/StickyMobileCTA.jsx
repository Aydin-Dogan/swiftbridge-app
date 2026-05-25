/**
 * StickyMobileCTA.jsx — onderaan-vastgeplakte CTA op mobiel.
 *
 * Verschijnt zodra de gebruiker voorbij Hero is gescrold (≈ 600px),
 * verdwijnt als ze weer omhoog scrollen naar Hero. Alleen <md (mobiel).
 *
 * Waarom: op mobiel ben je vaak ver onder de Hero CTA — dan moet je
 * helemaal omhoog scrollen om een actie te starten. Met sticky CTA blijft
 * de actie altijd één tap weg.
 *
 * Audit P2 — conversion booster.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';

const SCROLL_THRESHOLD = 600; // px voorbij Hero

export default function StickyMobileCTA() {
  const { t } = useTaal();
  const navigate = useNavigate();
  const [zichtbaar, setZichtbaar] = useState(false);

  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      // requestAnimationFrame om scroll-event niet elke pixel te raken
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        // Verberg in de allerlaatste 200px (CTA-sectie zelf staat al op scherm)
        const onderkant =
          document.documentElement.scrollHeight - window.innerHeight;
        const dichtbijFooter = y > onderkant - 250;
        setZichtbaar(y > SCROLL_THRESHOLD && !dichtbijFooter);
        raf = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-[80] safe-area-inset-bottom pointer-events-none transition-transform duration-300 ${
        zichtbaar ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!zichtbaar}
    >
      <div className="p-3 pb-4 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-auto">
        <button
          onClick={() => navigate('/calculator')}
          className="btn-primary w-full text-base font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
        >
          {t('sticky_cta_label')}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
