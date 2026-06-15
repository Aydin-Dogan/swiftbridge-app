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
        {/* Desktop tabel — bancaire hairline-stijl */}
        <div className="hidden md:block border border-gray-200 bg-white overflow-x-auto mt-9">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 text-left px-[18px] py-3.5 border-b border-gray-200">{t('landing_pricing_col_aanbieder')}</th>
                <th className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 text-left px-[18px] py-3.5 border-b border-gray-200">{t('landing_pricing_col_fee')}</th>
                <th className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 text-left px-[18px] py-3.5 border-b border-gray-200">{t('landing_pricing_col_marge')}</th>
                <th className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 text-left px-[18px] py-3.5 border-b border-gray-200">{t('landing_pricing_col_snelheid')}</th>
                <th className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 text-left px-[18px] py-3.5 border-b border-gray-200">{t('landing_pricing_col_totaal')}</th>
                <th className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 text-left px-[18px] py-3.5 border-b border-gray-200">{t('landing_pricing_col_ontvanger')}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => {
                const rand = i === ROWS.length - 1 ? '' : 'border-b border-gray-200';
                return (
                <tr
                  key={r.key}
                  className={r.highlight ? 'bg-brand-50' : ''}
                >
                  <td className={`px-[18px] py-3.5 ${rand} ${r.highlight ? 'font-semibold text-brand-800' : 'text-gray-700'}`}>
                    <span className="inline-flex items-center">
                      {r.highlight && (
                        <Zap className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" aria-hidden="true" />
                      )}
                      {r.naam}
                      {r.highlight && (
                        <span className="inline-block text-[9px] font-semibold uppercase tracking-[0.16em] bg-accent-400 text-brand-900 rounded-[2px] px-1.5 py-0.5 ml-2 align-middle">
                          {t(r.badge)}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={`px-[18px] py-3.5 ${rand} text-gray-700 tabular-nums`}>
                    {r.fee}
                  </td>
                  <td className={`px-[18px] py-3.5 ${rand} text-gray-700 tabular-nums`}>
                    {r.marge}
                  </td>
                  <td className={`px-[18px] py-3.5 ${rand} text-gray-700`}>
                    {r.snelheid}
                  </td>
                  <td className={`px-[18px] py-3.5 ${rand} text-gray-700 tabular-nums`}>
                    {r.totaal}
                  </td>
                  <td className={`px-[18px] py-3.5 ${rand} text-gray-700 tabular-nums`}>
                    {r.ontvanger}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobiele kaartweergave — hairline, plat */}
        <div className="md:hidden space-y-4 mt-9">
          {ROWS.map(r => (
            <div
              key={r.key}
              className={`p-5 border ${
                r.highlight
                  ? 'bg-brand-50 border-gray-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`inline-flex items-center ${r.highlight ? 'font-semibold text-brand-800' : 'font-medium text-gray-900'}`}>
                  {r.highlight && (
                    <Zap className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" aria-hidden="true" />
                  )}
                  {r.naam}
                </div>
                {r.highlight && (
                  <span className="inline-block text-[9px] font-semibold uppercase tracking-[0.16em] bg-accent-400 text-brand-900 rounded-[2px] px-1.5 py-0.5 align-middle">
                    {t(r.badge)}
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-gray-500">{t('landing_pricing_col_fee')}</dt>
                <dd className="text-right text-gray-700 tabular-nums">{r.fee}</dd>
                <dt className="text-gray-500">{t('landing_pricing_col_marge')}</dt>
                <dd className="text-right text-gray-700 tabular-nums">{r.marge}</dd>
                <dt className="text-gray-500">{t('landing_pricing_col_snelheid')}</dt>
                <dd className="text-right text-gray-700">{r.snelheid}</dd>
                <dt className="text-gray-500">{t('landing_pricing_col_totaal')}</dt>
                <dd className="text-right text-gray-700 tabular-nums">
                  {r.totaal}
                </dd>
                <dt className="text-gray-500">{t('landing_pricing_col_ontvanger')}</dt>
                <dd className="text-right text-gray-700 tabular-nums">
                  {r.ontvanger}
                </dd>
              </dl>
            </div>
          ))}
        </div>

        <p className="text-[0.72rem] text-gray-500 mt-3 max-w-2xl mx-auto">
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
          <p className="text-[0.68rem] font-medium text-brand-600 uppercase tracking-[0.26em] mb-3">
            {t('landing_pricing_eyebrow')}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-gray-900 leading-[1.18] mb-2.5">
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
