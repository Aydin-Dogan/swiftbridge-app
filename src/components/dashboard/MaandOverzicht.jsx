/**
 * MaandOverzicht.jsx — Dashboard widget "Deze maand verstuurd" (Verbetering EEE).
 *
 * Toont:
 *   - Totaal EUR deze maand (huidige kalendermaand 1 t/m heden)
 *   - Vergelijking met vorige maand (+/- %)
 *   - Aantal transacties deze maand
 *   - Mini bar-chart per dag (laatste 30 dagen)
 *
 * Verbergt zichzelf als user 0 transacties heeft (clutter-vrij).
 *
 * Data komt uit `transacties` prop die Dashboard al ophaalt — geen extra
 * API-call nodig.
 */
import { useMemo } from 'react';
import { useTaal } from '../../i18n';

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n || 0);
}

function maandLabel(date, taal) {
  const localeMap = { nl: 'nl-NL', en: 'en-GB', tr: 'tr-TR', ru: 'ru-RU', az: 'az-AZ' };
  try {
    return date.toLocaleDateString(localeMap[taal] || 'nl-NL', { month: 'long', year: 'numeric' });
  } catch {
    return date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  }
}

export default function MaandOverzicht({ transacties = [] }) {
  const { t, taal } = useTaal();

  const stats = useMemo(() => {
    if (!transacties.length) return null;

    const nu = new Date();
    const startMaand = new Date(nu.getFullYear(), nu.getMonth(), 1);
    const startVorigeMaand = new Date(nu.getFullYear(), nu.getMonth() - 1, 1);
    const eindVorigeMaand = new Date(nu.getFullYear(), nu.getMonth(), 0, 23, 59, 59);
    const start30Dagen = new Date(nu.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totaalDezeMaand = 0;
    let aantalDezeMaand = 0;
    let totaalVorigeMaand = 0;

    // Bin per dag voor mini-chart (30 dagen)
    const perDag = new Array(30).fill(0);

    for (const tx of transacties) {
      if (tx.status !== 'voltooid') continue;
      const txDatum = new Date(tx.aangemaaktOp || tx.datum);
      if (isNaN(txDatum.getTime())) continue;
      const bedrag = Number(tx.eurBedrag || 0);

      if (txDatum >= startMaand) {
        totaalDezeMaand += bedrag;
        aantalDezeMaand++;
      } else if (txDatum >= startVorigeMaand && txDatum <= eindVorigeMaand) {
        totaalVorigeMaand += bedrag;
      }

      if (txDatum >= start30Dagen) {
        const dagen = Math.floor((nu.getTime() - txDatum.getTime()) / (24 * 60 * 60 * 1000));
        const idx = 29 - Math.min(29, dagen);
        if (idx >= 0 && idx < 30) perDag[idx] += bedrag;
      }
    }

    const deltaPct = totaalVorigeMaand > 0
      ? ((totaalDezeMaand - totaalVorigeMaand) / totaalVorigeMaand) * 100
      : null;

    return {
      totaalDezeMaand,
      aantalDezeMaand,
      totaalVorigeMaand,
      deltaPct,
      perDag,
      max: Math.max(...perDag, 1),
    };
  }, [transacties]);

  // Verberg als nog geen voltooide transacties
  if (!stats || stats.aantalDezeMaand + stats.totaalVorigeMaand === 0) return null;

  const omhoog = stats.deltaPct !== null && stats.deltaPct >= 0;
  const huidigeMaand = maandLabel(new Date(), taal);

  return (
    <section
      aria-label={t('maand_overzicht_titel')}
      className="rounded-2xl border border-white/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-lg shadow-sm p-4 animate-fade-up"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs font-semibold text-blue-900/70 uppercase tracking-wider">
            {t('maand_overzicht_titel')}
          </div>
          <div className="text-xs text-blue-800/70 mt-0.5 capitalize">
            {huidigeMaand}
          </div>
        </div>
        {stats.deltaPct !== null && (
          <div className={`text-xs font-bold px-2 py-1 rounded-full ${
            omhoog
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {omhoog ? '↑' : '↓'} {Math.abs(stats.deltaPct).toFixed(0)}%
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="text-3xl font-extrabold text-gray-900">
          {fmtEur(stats.totaalDezeMaand)}
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          {stats.aantalDezeMaand} {t(stats.aantalDezeMaand === 1 ? 'maand_overzicht_tx_enkel' : 'maand_overzicht_tx_meerdere')}
          {stats.totaalVorigeMaand > 0 && (
            <>
              {' · '}
              {t('maand_overzicht_vorige_maand')}: {fmtEur(stats.totaalVorigeMaand)}
            </>
          )}
        </div>
      </div>

      {/* Mini bar-chart 30 dagen */}
      <div className="flex items-end gap-px h-10" aria-hidden="true">
        {stats.perDag.map((v, i) => (
          <div
            key={i}
            className="flex-1 bg-blue-300/60 rounded-sm hover:bg-blue-400 transition"
            style={{ height: `${Math.max(2, (v / stats.max) * 100)}%` }}
            title={`Dag ${30 - i}: ${fmtEur(v)}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>{t('maand_overzicht_30d_geleden')}</span>
        <span>{t('maand_overzicht_vandaag')}</span>
      </div>
    </section>
  );
}
