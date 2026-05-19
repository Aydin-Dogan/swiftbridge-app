/**
 * Pricing.jsx — Transparent pricing comparison vs banks vs Wise.
 */
import { useTaal } from '../../i18n';

// Voorbeeldbedrag voor de vergelijking
const BEDRAG = 500;

// Berekening op €500 via iDEAL Express:
// SwiftBridge: 1,5% staffel-fee = €7,50 (zie tariefkaart sectie voor volledige staffel)
// Bank: gem. €15 vast + 3-4% marge ≈ €15 + €17,50 = €32,50
// Wise: €4,38 fee + 0,5% marge ≈ €4,38 + €2,50 = €6,88 (sneller voor sommige routes)
const ROWS = [
  {
    key: 'swiftbridge',
    naam: 'SwiftBridge',
    highlight: true,
    fee: '1,5%',
    marge: 'inbegrepen',
    snelheid: '< 5 min',
    totaal: '€7,50',
    ontvanger: '~₺17.829',
    badge: 'landing_pricing_aanbevolen',
  },
  {
    key: 'bank',
    naam: 'Traditionele bank',
    fee: '€15+',
    marge: '3–4%',
    snelheid: '3–5 dagen',
    totaal: '€32,50',
    ontvanger: '~₺16.890',
  },
  {
    key: 'wise',
    naam: 'Wise',
    fee: '€4,38',
    marge: '0,5%',
    snelheid: '1–2 dgn',
    totaal: '€6,88',
    ontvanger: '~₺17.940',
  },
  {
    key: 'wu',
    naam: 'Western Union',
    fee: '€7,90',
    marge: '4–6%',
    snelheid: 'minuten – 1 dag',
    totaal: '€32,90',
    ontvanger: '~₺16.560',
  },
];

export default function Pricing() {
  const { t } = useTaal();

  return (
    <section
      id="kosten"
      className="py-16 sm:py-20 px-4 bg-gradient-to-b from-white to-slate-50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
            {t('landing_pricing_eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            {t('landing_pricing_titel')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t('landing_pricing_subtitel', { bedrag: `€${BEDRAG}` })}
          </p>
        </div>

        {/* Desktop tabel */}
        <div className="hidden md:block bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-blue-50/40 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">{t('landing_pricing_col_aanbieder')}</th>
                <th className="px-4 py-4 text-center">{t('landing_pricing_col_fee')}</th>
                <th className="px-4 py-4 text-center">{t('landing_pricing_col_marge')}</th>
                <th className="px-4 py-4 text-center">{t('landing_pricing_col_snelheid')}</th>
                <th className="px-4 py-4 text-center">{t('landing_pricing_col_totaal')}</th>
                <th className="px-4 py-4 text-center">{t('landing_pricing_col_ontvanger')}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(r => (
                <tr
                  key={r.key}
                  className={`border-t border-gray-100 transition ${
                    r.highlight
                      ? 'bg-gradient-to-r from-emerald-50/60 to-blue-50/40'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-extrabold ${
                          r.highlight ? 'text-blue-700' : 'text-gray-800'
                        }`}
                      >
                        {r.highlight && (
                          <span className="mr-1.5" aria-hidden="true">
                            ⚡
                          </span>
                        )}
                        {r.naam}
                      </span>
                      {r.highlight && (
                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {t(r.badge)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-5 text-center font-semibold ${r.highlight ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {r.fee}
                  </td>
                  <td className={`px-4 py-5 text-center font-semibold ${r.highlight ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {r.marge}
                  </td>
                  <td className={`px-4 py-5 text-center font-semibold ${r.highlight ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {r.snelheid}
                  </td>
                  <td className={`px-4 py-5 text-center font-extrabold ${r.highlight ? 'text-emerald-700' : 'text-gray-800'}`}>
                    {r.totaal}
                  </td>
                  <td className={`px-4 py-5 text-center font-bold ${r.highlight ? 'text-emerald-700' : 'text-gray-600'}`}>
                    {r.ontvanger}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobiele kaartweergave */}
        <div className="md:hidden space-y-4">
          {ROWS.map(r => (
            <div
              key={r.key}
              className={`rounded-2xl p-5 ${
                r.highlight
                  ? 'bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300'
                  : 'bg-white border border-gray-200'
              } shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-extrabold text-gray-900">
                  {r.highlight && '⚡ '}
                  {r.naam}
                </div>
                {r.highlight && (
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                    {t(r.badge)}
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-gray-500">{t('landing_pricing_col_fee')}</dt>
                <dd className="text-right font-semibold">{r.fee}</dd>
                <dt className="text-gray-500">{t('landing_pricing_col_marge')}</dt>
                <dd className="text-right font-semibold">{r.marge}</dd>
                <dt className="text-gray-500">{t('landing_pricing_col_snelheid')}</dt>
                <dd className="text-right font-semibold">{r.snelheid}</dd>
                <dt className="text-gray-500">{t('landing_pricing_col_totaal')}</dt>
                <dd className={`text-right font-extrabold ${r.highlight ? 'text-emerald-700' : 'text-gray-800'}`}>
                  {r.totaal}
                </dd>
                <dt className="text-gray-500">{t('landing_pricing_col_ontvanger')}</dt>
                <dd className={`text-right font-bold ${r.highlight ? 'text-emerald-700' : 'text-gray-700'}`}>
                  {r.ontvanger}
                </dd>
              </dl>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 max-w-2xl mx-auto">
          {t('landing_pricing_disclaimer')}
        </p>
      </div>
    </section>
  );
}
