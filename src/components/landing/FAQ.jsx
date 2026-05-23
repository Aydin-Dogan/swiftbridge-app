/**
 * FAQ.jsx — Accordion with 6 frequently asked questions.
 */
import { useState } from 'react';
import { useTaal } from '../../i18n';

// 12 vragen — long-tail SEO content. Volgorde: meest-gevraagd → minder.
const VRAGEN = [
  { key: 'snelheid' },
  { key: 'kosten' },
  { key: 'veiligheid' },
  { key: 'banken' },
  { key: 'idin' },
  { key: 'limieten' },          // NIEUW
  { key: 'wise_vergelijk' },    // NIEUW
  { key: 'annuleren' },         // NIEUW
  { key: 'koers_wijzigt' },     // NIEUW
  { key: 'feestdagen' },        // NIEUW
  { key: 'belgie_duitsland' },  // NIEUW
  { key: 'contact' },
];

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function AccordionItem({ vraag, antwoord, open, onToggle, index }) {
  const id = `faq-panel-${index}`;
  const btnId = `faq-button-${index}`;
  return (
    <div
      className={`bg-white rounded-2xl border transition ${
        open ? 'border-blue-300 shadow-md' : 'border-gray-200'
      }`}
    >
      <button
        type="button"
        id={btnId}
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 text-left px-5 sm:px-6 py-5"
      >
        <span className="font-bold text-gray-900 text-base">{vraag}</span>
        <span className={`flex-shrink-0 ${open ? 'text-blue-600' : 'text-gray-400'}`}>
          <ChevronIcon open={open} />
        </span>
      </button>
      <div
        id={id}
        role="region"
        aria-labelledby={btnId}
        hidden={!open}
        className="px-5 sm:px-6 pb-5 text-sm text-gray-600 leading-relaxed"
      >
        {antwoord}
      </div>
    </div>
  );
}

export default function FAQ() {
  const { t } = useTaal();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-16 sm:py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
            {t('landing_faq_eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            {t('landing_faq_titel')}
          </h2>
          <p className="text-gray-500">{t('landing_faq_subtitel')}</p>
        </div>

        <div className="space-y-3">
          {VRAGEN.map((v, i) => (
            <AccordionItem
              key={v.key}
              index={i}
              vraag={t(`landing_faq_${v.key}_vraag`)}
              antwoord={t(`landing_faq_${v.key}_antwoord`)}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500">
            {t('landing_faq_nog_vragen')}{' '}
            <a
              href="mailto:support@swiftbridge.tr"
              className="text-brand-600 hover:text-brand-700 font-semibold"
            >
              support@swiftbridge.tr
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
