/**
 * CountrySupport.jsx — Carousel/grid of supported Turkic countries with bank counts.
 */
import { useTaal } from '../../i18n';
import Vlag from '../Vlag';

// Bank-aantallen per land — indicatief, sluit aan op turkstaligeBanken.js data
const LANDEN = [
  { code: 'TR', naam: 'Türkiye',       banken: 14, kleur: '#E30A17' },
  { code: 'AZ', naam: 'Azerbaycan',    banken: 8,  kleur: '#00B5E2' },
  { code: 'KZ', naam: 'Kazakistan',    banken: 6,  kleur: '#00AFCA' },
  { code: 'UZ', naam: 'Özbekistan',    banken: 5,  kleur: '#1EB53A' },
  { code: 'TM', naam: 'Türkmenistan',  banken: 3,  kleur: '#00853E' },
  { code: 'KG', naam: 'Kırgızistan',   banken: 4,  kleur: '#E8112D' },
  { code: 'TJ', naam: 'Tacikistan',    banken: 3,  kleur: '#cc0000' },
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
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
            {t('landing_landen_eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
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
              className="bg-white rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition p-5 text-center animate-fade-up"
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
              <div className="font-extrabold text-gray-900 text-sm mb-1">
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
