/**
 * CountrySupport.jsx — grid van uitbetaallanden met bank-aantallen.
 * Merkregel wereldwijd: neutrale spelling, alfabetisch, huisstijlkleur —
 * geen land uitgelicht.
 */
import { useTaal } from '../../i18n';
import Vlag from '../Vlag';

// Bank-aantallen per land — indicatief; alfabetisch, allemaal in huisstijl-navy
const LANDEN = [
  { code: 'AZ', naam: 'Azerbeidzjan',  banken: 8,  kleur: '#1B3252' },
  { code: 'KZ', naam: 'Kazachstan',    banken: 6,  kleur: '#1B3252' },
  { code: 'KG', naam: 'Kirgizië',      banken: 4,  kleur: '#1B3252' },
  { code: 'UZ', naam: 'Oezbekistan',   banken: 5,  kleur: '#1B3252' },
  { code: 'TJ', naam: 'Tadzjikistan',  banken: 3,  kleur: '#1B3252' },
  { code: 'TM', naam: 'Turkmenistan',  banken: 3,  kleur: '#1B3252' },
  { code: 'TR', naam: 'Türkiye',       banken: 14, kleur: '#1B3252' },
];

export default function CountrySupport() {
  const { t } = useTaal();
  const totaalBanken = LANDEN.reduce((a, l) => a + l.banken, 0);

  return (
    <section
      id="landen"
      className="py-16 sm:py-20 px-4"
      style={{
        background:
          'linear-gradient(180deg, #f8fafc 0%, #ecfeff 50%, #f8fafc 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[0.68rem] font-medium text-brand-600 uppercase tracking-[0.26em] mb-3">
            {t('landing_landen_eyebrow')}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-gray-900 leading-[1.18] mb-2.5">
            {t('landing_landen_titel')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t('landing_landen_subtitel', {
              banken: totaalBanken,
              landen: LANDEN.length,
            })}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {LANDEN.map((l, i) => (
            <div
              key={l.code}
              className="bg-white rounded-md border border-gray-200 hover:border-brand-300 transition p-5 text-center animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex justify-center mb-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ background: `${l.kleur}15`, border: `1px solid ${l.kleur}40` }}
                >
                  <Vlag land={l.code} size={32} />
                </div>
              </div>
              <div className="font-bold text-gray-900 text-sm mb-1">
                {l.naam}
              </div>
              <div className="text-xs text-gray-500">
                {l.banken}{' '}
                <span className="text-gray-400">
                  {t('landing_landen_banken')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
