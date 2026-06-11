/**
 * Pricing.jsx — Transparante prijs-vergelijking SwiftBridge vs concurrenten.
 *
 * Sprint 2/3 fix (P4 uit audit): ontvanger-bedragen dynamisch berekenen op
 * basis van live-koers + de échte berekenKosten() — voorheen hardcoded
 * '~₺17.829' wat afweek van de live-koers in Hero-widget.
 */
import { useState, useEffect } from 'react';
import { useTaal } from '../../i18n';
import { berekenKosten } from '../../services/kosten';
import { API_URL } from '../../services/api';
import { Zap } from '../icons/Icons';

// Voorbeeldbedrag voor de vergelijking
const BEDRAG = 500;

// Concurrent-tarieven (publieke pricing voorjaar 2026). Update bij majeure
// wijzigingen — bron: bank.nl, wise.com/pricing, westernunion.com.
// SwiftBridge wordt dynamisch berekend, niet hardcoded.
const CONCURRENT_DATA = [
  {
    key: 'bank',
    fee: '€15+',
    marge: '3–4%',
    snelheid: '3–5 dagen',
    totaalEur: 32.50,
    // Effectieve koers concurrent ≈ mid-market * (1 - margePct):
    // (500 - 15) * (mid * 0.965) = ontvangen
    margePct: 0.035,
    flatFeeEur: 15,
  },
  {
    key: 'wise',
    fee: '€4,38',
    marge: '0,5%',
    snelheid: '1–2 dgn',
    totaalEur: 6.88,
    margePct: 0.005,
    flatFeeEur: 4.38,
  },
  {
    key: 'wu',
    fee: '€7,90',
    marge: '4–6%',
    snelheid: 'minuten – 1 dag',
    totaalEur: 32.90,
    margePct: 0.05,
    flatFeeEur: 7.90,
  },
];

/**
 * @param {object} props
 * @param {boolean} [props.embedded=false] - als true: render zonder outer
 * section + heading (voor gebruik binnen PricingSection wrapper).
 */
export default function Pricing({ embedded = false }) {
  const { t } = useTaal();
  const [liveKoersTry, setLiveKoersTry] = useState(36.20); // fallback

  useEffect(() => {
    let geannuleerd = false;
    async function haal() {
      try {
        const res = await fetch(`${API_URL}/transactions/koersen`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!geannuleerd && data?.koersen?.TRY) setLiveKoersTry(data.koersen.TRY);
      } catch {
        // stille fallback
      }
    }
    haal();
    return () => { geannuleerd = true; };
  }, []);

  // Bereken SwiftBridge ontvanger-bedrag dynamisch via échte berekenKosten()
  // → ALTIJD synchroon met Hero-widget + Tariefkaart op dezelfde pagina
  const sbKosten = berekenKosten(BEDRAG, 'ideal', 'express', liveKoersTry);
  const sbOntvangenFmt = sbKosten.ontvangenBedrag.toLocaleString('tr-TR', {
    maximumFractionDigits: 0,
  });

  // Bereken concurrent-ontvangen op dezelfde live mid-market koers
  function berekenConcurrent(c) {
    const netto = BEDRAG - c.flatFeeEur;
    const effectieveKoers = liveKoersTry * (1 - c.margePct);
    return Math.max(0, netto * effectieveKoers).toLocaleString('tr-TR', {
      maximumFractionDigits: 0,
    });
  }

  const ROWS = [
    {
      key: 'swiftbridge',
      naam: 'SwiftBridge',
      highlight: true,
      fee: `${String(sbKosten.zichtbarePct).replace('.', ',')}%`,
      marge: 'inbegrepen',
      snelheid: '< 5 min',
      totaal: `€${sbKosten.klantBetaaltFee.toFixed(2).replace('.', ',')}`,
      ontvanger: `~₺${sbOntvangenFmt}`,
      badge: 'landing_pricing_aanbevolen',
    },
    {
      key: 'bank',
      naam: 'Traditionele bank',
      fee: CONCURRENT_DATA[0].fee,
      marge: CONCURRENT_DATA[0].marge,
      snelheid: CONCURRENT_DATA[0].snelheid,
      totaal: `€${CONCURRENT_DATA[0].totaalEur.toFixed(2).replace('.', ',')}`,
      ontvanger: `~₺${berekenConcurrent(CONCURRENT_DATA[0])}`,
    },
    {
      key: 'wise',
      naam: 'Wise',
      fee: CONCURRENT_DATA[1].fee,
      marge: CONCURRENT_DATA[1].marge,
      snelheid: CONCURRENT_DATA[1].snelheid,
      totaal: `€${CONCURRENT_DATA[1].totaalEur.toFixed(2).replace('.', ',')}`,
      ontvanger: `~₺${berekenConcurrent(CONCURRENT_DATA[1])}`,
    },
    {
      key: 'wu',
      naam: 'Western Union',
      fee: CONCURRENT_DATA[2].fee,
      marge: CONCURRENT_DATA[2].marge,
      snelheid: CONCURRENT_DATA[2].snelheid,
      totaal: `€${CONCURRENT_DATA[2].totaalEur.toFixed(2).replace('.', ',')}`,
      ontvanger: `~₺${berekenConcurrent(CONCURRENT_DATA[2])}`,
    },
  ];

  // Inhoud (tabel + mobile cards) — apart van outer-wrapper zodat we kunnen
  // kiezen of we 'm in een eigen section of in PricingSection renderen.
  const inhoud = (
    <>
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
                        className={`font-bold ${
                          r.highlight ? 'text-blue-700' : 'text-gray-800'
                        }`}
                      >
                        {r.highlight && (
                          <Zap className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" aria-hidden="true" />
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
                <div className="font-bold text-gray-900">
                  {r.highlight && ''}
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
    </>
  );

  // Embedded mode (binnen PricingSection wrapper): return alleen de inhoud
  if (embedded) {
    return inhoud;
  }

  // Standalone mode (backwards compat): wrap in eigen section + heading
  return (
    <section
      id="kosten"
      className="py-16 sm:py-20 px-4 bg-gradient-to-b from-white to-slate-50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-3">
            {t('landing_pricing_eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            {t('landing_pricing_titel')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t('landing_pricing_subtitel', { bedrag: `€${BEDRAG}` })}
          </p>
        </div>
        {inhoud}
      </div>
    </section>
  );
}
