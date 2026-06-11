/**
 * Tariefkaart.jsx — Volledige bedrag × methode-staffel.
 *
 * Bron: KOSTEN_TARIEF_OVERZICHT.md §4.4 — gespiegeld in TARIEF_MATRIX
 * (zie src/services/kosten.js). Hier puur presentatie; de waardes komen
 * uit dezelfde source-of-truth zodat staffel en checkout altijd matchen.
 */
import { useTaal } from '../../i18n';
import { TARIEF_MATRIX } from '../../services/kosten';
import { Bank, Card } from '../icons/Icons';

const TIERS = [
  { label: '€10 – €200' },
  { label: '€200 – €500' },
  { label: '€500 – €1.000' },
  { label: '€1.000 – €2.500' },
  { label: '€2.500+' },
];

// Klarna staat in PaymentFlow.jsx als 'Activeer eerst in Mollie' — totdat
// Klarna écht beschikbaar is, niet in publieke tariefkaart tonen (anders
// misleidende reclame). Voeg Klarna weer toe zodra Mollie het activeert.
const METHODEN = [
  { key: 'ideal', Icon: Bank, i18n: 'tariefkaart_methode_ideal' },
  { key: 'card', Icon: Card, i18n: 'tariefkaart_methode_card' },
  { key: 'sepa', Icon: Bank, i18n: 'tariefkaart_methode_sepa' },
];

function pct(v) {
  // 0.020 → '2,0%'
  return `${(v * 100).toFixed(1).replace('.', ',')}%`;
}

/**
 * @param {object} props
 * @param {boolean} [props.embedded=false] - render zonder outer section/header
 * (voor gebruik binnen PricingSection wrapper).
 */
export default function Tariefkaart({ embedded = false }) {
  const { t } = useTaal();

  const inhoud = (
    <>
        {/* Desktop tabel */}
        <div className="hidden md:block bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-blue-50/40 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">{t('tariefkaart_col_bedrag')}</th>
                {METHODEN.map((m) => (
                  <th key={m.key} className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 justify-center">
                      <m.Icon className="w-4 h-4" aria-hidden="true" />
                      {t(m.i18n)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIERS.map((tier, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-100 hover:bg-slate-50/60 transition"
                >
                  <td className="px-6 py-5 font-bold text-gray-800">{tier.label}</td>
                  {METHODEN.map((m) => (
                    <td
                      key={m.key}
                      className={`px-4 py-5 text-center font-extrabold ${
                        m.key === 'ideal'
                          ? 'text-emerald-700'
                          : m.key === 'sepa'
                          ? 'text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {pct(TARIEF_MATRIX[m.key][idx])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobiele kaartweergave — een kaart per methode */}
        <div className="md:hidden space-y-4">
          {METHODEN.map((m) => (
            <div
              key={m.key}
              className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <m.Icon className="w-5 h-5 text-gray-700" aria-hidden="true" />
                <div className="font-bold text-gray-900">{t(m.i18n)}</div>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {TIERS.flatMap((tier, idx) => [
                  <dt key={`${m.key}-${idx}-l`} className="text-gray-500">
                    {tier.label}
                  </dt>,
                  <dd
                    key={`${m.key}-${idx}-v`}
                    className={`text-right font-bold ${
                      m.key === 'ideal'
                        ? 'text-emerald-700'
                        : m.key === 'sepa'
                        ? 'text-blue-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {pct(TARIEF_MATRIX[m.key][idx])}
                  </dd>,
                ])}
              </dl>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 max-w-2xl mx-auto">
          {t('tariefkaart_disclaimer')}
        </p>
    </>
  );

  if (embedded) {
    return inhoud;
  }

  return (
    <section id="tariefkaart" className="py-16 sm:py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">
            {t('tariefkaart_eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            {t('tariefkaart_titel')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t('tariefkaart_subtitel')}
          </p>
        </div>
        {inhoud}
      </div>
    </section>
  );
}
