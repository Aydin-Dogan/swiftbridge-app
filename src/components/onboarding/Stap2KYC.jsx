/**
 * Stap2KYC.jsx — KYC nudge: leg uit waarom + start iDIN flow
 *
 * - Heading + uitleg (Wwft, neemt 60 sec)
 * - Visuele NL bank logos (emoji surrogate, branding-vrij)
 * - "Waarom?" expander met 3 bullet redenen
 * - Twee knoppen: Start iDIN → /verificatie, "Doe ik later" → sluit modal
 */
import { useState } from 'react';
import { useTaal } from '../../i18n';
import { IdCard, MessageCircle, ChevronDown } from '../icons/Icons.jsx';

const BANK_LOGOS = [
  { naam: 'ING', kleur: 'bg-orange-500' },
  { naam: 'ABN AMRO', kleur: 'bg-emerald-700' },
  { naam: 'Rabobank', kleur: 'bg-blue-700' },
];

export default function Stap2KYC({ onStartKYC, onLater, onTerug }) {
  const { t } = useTaal();
  const [expandOpen, setExpandOpen] = useState(false);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mb-2" aria-hidden="true"><IdCard className="w-12 h-12 mx-auto text-blue-600" /></div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
          {t('onb_kyc_titel')}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          {t('onb_kyc_subtitel')}
        </p>
      </div>

      {/* Bank logos */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
          {t('onb_kyc_via_bank')}
        </p>
        <div className="flex items-center justify-center gap-3">
          {BANK_LOGOS.map(bank => (
            <div
              key={bank.naam}
              className={`${bank.kleur} text-white text-[11px] font-bold px-3 py-2 rounded-lg shadow-sm`}
            >
              {bank.naam}
            </div>
          ))}
        </div>
      </div>

      {/* Waarom? expander */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <button
          onClick={() => setExpandOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
          aria-expanded={expandOpen}
        >
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-600" aria-hidden="true" /> {t('onb_kyc_waarom_titel')}
          </span>
          <span className={`text-slate-400 transition-transform ${expandOpen ? 'rotate-180' : ''}`} aria-hidden="true">
            <ChevronDown className="w-4 h-4" />
          </span>
        </button>
        {expandOpen && (
          <ul className="px-4 pb-4 space-y-2 text-xs text-slate-600 animate-fade-up">
            <li className="flex gap-2"><span className="text-blue-600" aria-hidden="true">•</span> {t('onb_kyc_reden_1')}</li>
            <li className="flex gap-2"><span className="text-blue-600" aria-hidden="true">•</span> {t('onb_kyc_reden_2')}</li>
            <li className="flex gap-2"><span className="text-blue-600" aria-hidden="true">•</span> {t('onb_kyc_reden_3')}</li>
          </ul>
        )}
      </div>

      {/* Knoppen */}
      <div className="space-y-2">
        <button
          onClick={onStartKYC}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-blue-600/30 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {t('onb_kyc_start_idin')} →
        </button>
        <button
          onClick={onLater}
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-2xl text-sm border border-slate-200 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          {t('onb_kyc_later')}
        </button>
      </div>

      {/* Terug-link */}
      {onTerug && (
        <button
          onClick={onTerug}
          className="block mx-auto text-xs text-slate-500 hover:text-slate-700 underline focus:outline-none"
        >
          ← {t('terug').replace(/[←→]/g, '').trim()}
        </button>
      )}
    </div>
  );
}
