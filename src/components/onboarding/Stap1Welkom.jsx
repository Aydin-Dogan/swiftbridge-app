/**
 * Stap1Welkom.jsx — Eerste stap: welkomstheet + 3-punt overzicht
 *
 * - Persoonlijke begroeting met voornaam
 * - 3 checklist punten (account gereed, KYC pending, eerste tx gratis)
 * - CTA "Laten we beginnen" → naar volgende stap
 */
import { useTaal } from '../../i18n';
import { Check, Lightbulb, Rocket, Sparkles } from '../icons/Icons';

export default function Stap1Welkom({ gebruiker, onVolgende }) {
  const { t } = useTaal();
  const voornaam = gebruiker?.naam?.split(' ')[0] || '';

  const punten = [
    { Icoon: Check, kleur: 'bg-success-50 text-success-700 border-success-100', tekst: t('onb_welkom_punt_1') },
    { Icoon: Lightbulb, kleur: 'bg-brand-50 text-brand-700 border-brand-100', tekst: t('onb_welkom_punt_2') },
    { Icoon: Rocket, kleur: 'bg-accent-400/15 text-accent-600 border-accent-400/30', tekst: t('onb_welkom_punt_3') },
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mb-2 flex justify-center" aria-hidden="true">
          <Sparkles className="w-12 h-12 text-accent-500" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-ink-1 leading-tight">
          {t('onb_welkom_titel', { naam: voornaam })}
        </h2>
        <p className="text-sm text-ink-2 max-w-md mx-auto">
          {t('onb_welkom_subtitel')}
        </p>
      </div>

      {/* 3 punten lijst */}
      <ul className="space-y-2.5">
        {punten.map((p, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 p-3 rounded-xl border ${p.kleur}`}
          >
            <p.Icoon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-sm font-medium leading-snug">{p.tekst}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onVolgende}
        className="btn-inst w-full py-3.5"
      >
        {t('onb_welkom_cta')} →
      </button>
    </div>
  );
}
