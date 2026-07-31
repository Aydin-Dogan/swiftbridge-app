/**
 * Tariefkaart.jsx — Transparant prijsmodel per ledenniveau.
 *
 * Bron: bouwbrief §8 + SwiftBridge-prijsstrategie-transparant (BINDEND) —
 * gespiegeld in src/services/kosten.js (FEE_VAST + FX_MARGE_NIVEAUS), zodat
 * tariefkaart en checkout altijd dezelfde source-of-truth gebruiken.
 */
import { useTaal } from '../../i18n';
import { FEE_VAST, MIN_BEDRAG, FX_MARGE_NIVEAUS, NIVEAU_LABELS, berekenKosten } from '../../services/kosten';
import { Bank } from '../icons/Icons';

const NIVEAUS = ['basis', 'plus', 'premium', 'black'];
const VOORBEELD_BEDRAGEN = [100, 500, 1000, 2500];

function eur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}
function pct(v) {
  return `${(v * 100).toFixed(1).replace('.', ',')}%`;
}
// Totale kosten (fee + marge over netto) voor de voorbeeldtabel
function totaleKosten(bedrag, niveau) {
  return berekenKosten(bedrag, 'ideal', 'express', 36.20, niveau).totaleKostenEur;
}

/**
 * @param {object} props
 * @param {boolean} [props.embedded=false] - render zonder outer section/header
 */
export default function Tariefkaart({ embedded = false }) {
  const { t } = useTaal();

  const inhoud = (
    <>
      {/* Kern: één vaste fee + transparante marge per niveau */}
      <div className="grid sm:grid-cols-3 gap-4 mt-9 text-center">
        <div className="p-5 bg-white border border-gray-200">
          <div className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1.5">Vaste fee</div>
          <div className="font-display text-2xl font-medium text-gray-900 tabular-nums">{eur(FEE_VAST)}</div>
          <div className="text-xs text-gray-500 mt-1">per overboeking, elk niveau</div>
        </div>
        <div className="p-5 bg-white border border-gray-200">
          <div className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1.5">Koersmarge</div>
          <div className="font-display text-2xl font-medium text-gray-900 tabular-nums">{pct(FX_MARGE_NIVEAUS.basis)} &rarr; {pct(FX_MARGE_NIVEAUS.black)}</div>
          <div className="text-xs text-gray-500 mt-1">transparant getoond, daalt per ledenniveau</div>
        </div>
        <div className="p-5 bg-white border border-gray-200">
          <div className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1.5">Minimum</div>
          <div className="font-display text-2xl font-medium text-gray-900 tabular-nums">{eur(MIN_BEDRAG)}</div>
          <div className="text-xs text-gray-500 mt-1">per overboeking · max. &euro;5.000 p/w</div>
        </div>
      </div>

      {/* Totale kosten per niveau × voorbeeldbedrag */}
      <div className="border border-gray-200 bg-white overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 text-left px-[18px] py-3.5 border-b border-gray-200">
                <span className="inline-flex items-center gap-1.5"><Bank className="w-4 h-4" aria-hidden="true" /> Niveau</span>
              </th>
              <th className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 text-left px-[18px] py-3.5 border-b border-gray-200">Marge</th>
              {VOORBEELD_BEDRAGEN.map((b) => (
                <th key={b} className="text-[0.64rem] font-medium uppercase tracking-[0.2em] text-gray-500 text-right px-[18px] py-3.5 border-b border-gray-200">
                  op {eur(b)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NIVEAUS.map((niveau, idx) => {
              const rand = idx === NIVEAUS.length - 1 ? '' : 'border-b border-gray-200';
              return (
                <tr key={niveau}>
                  <td className={`px-[18px] py-3.5 ${rand} font-semibold text-gray-700`}>{NIVEAU_LABELS[niveau]}</td>
                  <td className={`px-[18px] py-3.5 ${rand} tabular-nums font-semibold text-brand-700`}>{pct(FX_MARGE_NIVEAUS[niveau])}</td>
                  {VOORBEELD_BEDRAGEN.map((b) => (
                    <td key={b} className={`px-[18px] py-3.5 ${rand} tabular-nums font-semibold text-right ${niveau === 'basis' ? 'text-gray-900' : 'text-gray-700'}`}>
                      {eur(totaleKosten(b, niveau))}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[0.72rem] text-gray-500 mt-3 max-w-2xl mx-auto">
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
          <p className="text-[0.68rem] font-medium text-brand-600 uppercase tracking-[0.26em] mb-3">
            {t('tariefkaart_eyebrow')}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-gray-900 leading-[1.18] mb-2.5">
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
