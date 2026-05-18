/**
 * Stap1Welkom.jsx — Eerste stap: welkomstheet + 3-punt overzicht
 *
 * - Persoonlijke begroeting met voornaam
 * - 3 checklist punten (account ✓, KYC pending, eerste tx gratis)
 * - CTA "Laten we beginnen" → naar volgende stap
 */
import { useTaal } from '../../i18n';

export default function Stap1Welkom({ gebruiker, onVolgende }) {
  const { t } = useTaal();
  const voornaam = gebruiker?.naam?.split(' ')[0] || '';

  const punten = [
    { icoon: '✓', kleur: 'bg-emerald-100 text-emerald-700 border-emerald-200', tekst: t('onb_welkom_punt_1') },
    { icoon: '💡', kleur: 'bg-blue-100 text-blue-700 border-blue-200',         tekst: t('onb_welkom_punt_2') },
    { icoon: '🚀', kleur: 'bg-amber-100 text-amber-700 border-amber-200',       tekst: t('onb_welkom_punt_3') },
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-2" aria-hidden="true">🎉</div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
          {t('onb_welkom_titel', { naam: voornaam })}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
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
            <span className="text-xl flex-shrink-0 leading-none mt-0.5" aria-hidden="true">{p.icoon}</span>
            <span className="text-sm font-medium leading-snug">{p.tekst}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onVolgende}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-blue-600/30 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {t('onb_welkom_cta')} →
      </button>
    </div>
  );
}
