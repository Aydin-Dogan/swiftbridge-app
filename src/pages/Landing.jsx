/**
 * Landing.jsx — SwiftBridge premium landing page.
 *
 * Modular composition — see src/components/landing/* for individual sections.
 * Mobile-first, glassmorphism, gradient accents, conversion-optimised.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveKoersTicker from '../components/LiveKoersTicker';
import TaalKiezer from '../components/TaalKiezer';
import { useTaal } from '../i18n';

// Landing-specific sections
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import SocialProof from '../components/landing/SocialProof';
import PricingSection from '../components/landing/PricingSection';
import CountrySupport from '../components/landing/CountrySupport';
import FAQ from '../components/landing/FAQ';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTaal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sluit mobile menu bij ESC of bij route-change (anchor-klik)
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMobileMenuOpen(false);
    document.addEventListener('keydown', onKey);
    // Voorkom body-scroll wanneer menu open is
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-white">
      {/* Skip-to-content link voor toetsenbord-gebruikers (a11y).
          Verschijnt alleen bij focus (Tab-toets vanaf URL-bar). */}
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        {t('a11y_skip_to_content')}
      </a>

      {/* SEO content — visually hidden but crawlable.
          H1 staat visueel in Hero.jsx — hier alleen H2's met long-tail content
          om dubbele H1 te voorkomen. */}
      <div className="sr-only">
        <h2>SwiftBridge — Goedkoop alternatief voor Wise, Remitly en Western Union</h2>
        <p>
          SwiftBridge is een snelle en transparante manier om geld over te maken
          vanuit Nederland naar Turkije, Azerbeidzjan, Kazachstan, Oezbekistan,
          Turkmenistan, Kirgizië en Tadzjikistan. Tarieven vanaf 0,8% per
          overboeking met iDEAL, en betaling via iDEAL, creditcard, PayPal of
          SEPA. Het bedrag staat doorgaans binnen 5 minuten op de Turkse
          bankrekening (Garanti, Akbank, İş Bankası, Ziraat, Yapı Kredi en
          100+ andere banken).
        </p>
        <h2>Waarom SwiftBridge een goed Wise- en Remitly-alternatief is</h2>
        <ul>
          <li>Staffel-tarief vanaf 0,8% per overboeking (hoe meer je stuurt, hoe lager het tarief)</li>
          <li>Onder DNB-toezicht via EMI-partner (Wwft-compliant)</li>
          <li>Wwft- en AVG-compliant, EU-sanctielijst screening op iedere ontvanger</li>
          <li>256-bit encryptie en multi-factor authenticatie</li>
          <li>Volledige tariefkaart vooraf zichtbaar — geen verborgen vaste fees</li>
        </ul>
        <h2>Veelgestelde vragen — geld sturen naar Turkije</h2>
        <p>
          Hoe snel komt geld aan in Türkiye? Doorgaans binnen 5 minuten via iDEAL.
          Wat zijn de kosten? Vanaf 0,8% per overboeking via iDEAL (€2.500+);
          €500 kost 1,5% (€7,50), €1.000 kost 1,2% (€12). Volledige tariefkaart
          op landing-pagina. Is SwiftBridge veilig? Ja — onder DNB-toezicht via
          EMI-partner, volledig Wwft- en AVG-compliant.
        </p>
      </div>

      {/* Sticky navigation */}
      <nav className="header-glass-light sticky top-0 z-50 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 group">
            <span
              className="text-2xl transition-transform group-hover:scale-110"
              aria-hidden="true"
            >
              ⚡
            </span>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
              SwiftBridge
            </span>
          </a>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <a href="#hoe-werkt-het" className="hover:text-blue-600 transition">
              {t('landing_nav_how')}
            </a>
            <a href="#kosten" className="hover:text-blue-600 transition">
              {t('landing_nav_kosten')}
            </a>
            <a href="#landen" className="hover:text-blue-600 transition">
              {t('landing_nav_landen')}
            </a>
            <a href="#faq" className="hover:text-blue-600 transition">
              {t('landing_nav_faq')}
            </a>
          </div>

          <div className="flex items-center gap-1.5">
            <TaalKiezer />
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700 px-3 py-2 transition"
            >
              {t('inloggen')}
            </button>
            <button
              onClick={() => navigate('/login?tab=register')}
              className="btn-primary text-sm"
            >
              {t('landing_hero_cta_primary')} →
            </button>
            {/* Mobile hamburger — alleen <md zichtbaar */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition ml-1"
              aria-label="Menu openen"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="4" y1="7" x2="20" y2="7"/>
                <line x1="4" y1="12" x2="20" y2="12"/>
                <line x1="4" y1="17" x2="20" y2="17"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu — slide-down sheet, alleen <md */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Hoofdmenu"
        >
          <div
            className="absolute top-0 right-0 w-full max-w-xs h-full bg-white shadow-2xl flex flex-col safe-top"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-extrabold text-gray-900 text-lg">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
                aria-label="Menu sluiten"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="6" y1="6" x2="18" y2="18"/>
                  <line x1="6" y1="18" x2="18" y2="6"/>
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-5 py-6 flex flex-col gap-1 text-base font-semibold text-gray-700">
              <a href="#hoe-werkt-het" onClick={() => setMobileMenuOpen(false)} className="py-3 px-3 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition">
                {t('landing_nav_how')}
              </a>
              <a href="#kosten" onClick={() => setMobileMenuOpen(false)} className="py-3 px-3 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition">
                {t('landing_nav_kosten')}
              </a>
              <a href="#landen" onClick={() => setMobileMenuOpen(false)} className="py-3 px-3 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition">
                {t('landing_nav_landen')}
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-3 px-3 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition">
                {t('landing_nav_faq')}
              </a>
              <div className="border-t border-gray-100 my-3" />
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="py-3 px-3 rounded-lg text-left text-blue-600 hover:bg-blue-50 transition"
              >
                {t('inloggen')}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Live multi-currency ticker */}
      <LiveKoersTicker />

      {/* Modular sections */}
      <div id="top" />
      <Hero />
      <Features />
      <HowItWorks />
      <SocialProof />
      <PricingSection />
      <CountrySupport />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
