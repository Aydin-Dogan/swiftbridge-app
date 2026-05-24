/**
 * PricingSection.jsx — Wrapper die Pricing + Tariefkaart consolideert
 * onder één visuele sectie met een segmented-control toggle.
 *
 * Audit P1: twee opeenvolgende tabel-secties (Pricing competitor-vergelijking
 * + Tariefkaart staffel) waren verwarrend voor klanten omdat ze beide
 * kosten vergelijken maar verschillende dimensies. Nu één sectie, twee tabs.
 *
 * Default-tab: 'vergelijking' (concurrent-comparison) — sterkste hook.
 * 'staffel' (volledige tariefkaart) als secundair voor diepere check.
 */
import { useState } from 'react';
import Pricing from './Pricing';
import Tariefkaart from './Tariefkaart';
import { useTaal } from '../../i18n';

export default function PricingSection() {
  const { t } = useTaal();
  const [tab, setTab] = useState('vergelijking');

  return (
    <section id="kosten" className="py-16 sm:py-20 px-4 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Section heading boven de tabs */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">
            {t('pricing_section_eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            {t('pricing_section_titel')}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base">
            {t('pricing_section_subtitel')}
          </p>
        </div>

        {/* Segmented control — tab keuze */}
        <div className="flex justify-center mb-8" role="tablist" aria-label="Prijs-weergave">
          <div className="inline-flex p-1 bg-white border border-gray-200 rounded-xl shadow-soft-sm">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'vergelijking'}
              onClick={() => setTab('vergelijking')}
              className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'vergelijking'
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('pricing_section_tab_vergelijking')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'staffel'}
              onClick={() => setTab('staffel')}
              className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'staffel'
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('pricing_section_tab_staffel')}
            </button>
          </div>
        </div>

        {/* Geselecteerde tab content. We renderen alleen ÉÉN component
            tegelijk zodat React de DOM volledig vervangt (geen state-lekken
            tussen tabs). Wrappers verbergen hun eigen <section>-padding
            wanneer ze in deze gebruikt worden via een CSS-modifier op de
            outer element — simpeler oplossing hier: laat de child-section
            zonder eigen padding renderen door content directly in de wrapper. */}
        <div className="animate-fade-up" style={{ animationDuration: '0.25s' }}>
          {tab === 'vergelijking' ? <Pricing embedded /> : <Tariefkaart embedded />}
        </div>
      </div>
    </section>
  );
}
