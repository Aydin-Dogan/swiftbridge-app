/**
 * Landing.jsx — SwiftBridge premium landing page.
 *
 * Modular composition — see src/components/landing/* for individual sections.
 * Mobile-first, glassmorphism, gradient accents, conversion-optimised.
 */
import { useNavigate } from 'react-router-dom';
import LiveKoersTicker from '../components/LiveKoersTicker';
import TaalKiezer from '../components/TaalKiezer';
import { useTaal } from '../i18n';

// Landing-specific sections
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import SocialProof from '../components/landing/SocialProof';
import Pricing from '../components/landing/Pricing';
import CountrySupport from '../components/landing/CountrySupport';
import FAQ from '../components/landing/FAQ';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTaal();

  return (
    <div className="min-h-screen bg-white">
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
          </div>
        </div>
      </nav>

      {/* Live multi-currency ticker */}
      <LiveKoersTicker />

      {/* Modular sections */}
      <div id="top" />
      <Hero />
      <Features />
      <HowItWorks />
      <SocialProof />
      <Pricing />
      <CountrySupport />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
