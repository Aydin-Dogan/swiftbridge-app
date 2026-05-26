/**
 * RecurringKaart.jsx — Card view voor één terugkerend schedule.
 *
 * Toont:
 *  - Naam (groot)
 *  - Bedrag + valuta
 *  - Frequentie label + dag info
 *  - Volgende uitvoering (relatief, bv "over 12 dagen")
 *  - Aantal uitgevoerd
 *  - Status pill (actief / pauze)
 *  - Acties: Pauzeren/Hervatten, Uitvoeren nu, Verwijderen
 */
import { useTaal } from '../../i18n';

function fmtEur(n, valuta = 'EUR') {
  try {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: valuta === 'TRY' ? 'EUR' : valuta }).format(n || 0);
  } catch {
    return `${n} ${valuta}`;
  }
}

function relativeDays(iso) {
  if (!iso) return '';
  const target = new Date(iso).getTime();
  const nu = Date.now();
  const dagen = Math.round((target - nu) / (1000 * 60 * 60 * 24));
  if (dagen === 0) return 'vandaag';
  if (dagen === 1) return 'morgen';
  if (dagen === -1) return 'gisteren';
  if (dagen > 0) return `over ${dagen} dagen`;
  return `${Math.abs(dagen)} dagen geleden`;
}

export default function RecurringKaart({ item, onPauzeer, onHervat, onUitvoer, onVerwijder, bezig }) {
  const { t } = useTaal();

  const freqLabel = {
    wekelijks: t('recurring_freq_wekelijks'),
    maandelijks: t('recurring_freq_maandelijks'),
    dagelijks: t('recurring_freq_dagelijks'),
  }[item.frequentie] || item.frequentie;

  const dagInfo = item.frequentie === 'maandelijks' && item.dagVanMaand
    ? `${t('recurring_dag_label')} ${item.dagVanMaand}`
    : '';

  const volgendeDatum = item.volgendeUitvoering
    ? new Date(item.volgendeUitvoering).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <article className={`rounded-2xl p-4 border shadow-sm transition ${
      item.actief
        ? 'bg-white border-gray-200'
        : 'bg-gray-50 border-gray-200 opacity-80'
    }`}>
      <header className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base text-gray-900 truncate">{item.naam}</h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.ontvangerNaam}</p>
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full flex-shrink-0 ${
          item.actief
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-200 text-gray-600'
        }`}>
          {item.actief ? t('recurring_status_actief') : t('recurring_status_pauze')}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-2 text-xs my-3">
        <div>
          <div className="text-gray-500">{t('recurring_kaart_bedrag')}</div>
          <div className="font-bold text-gray-900 text-sm">{fmtEur(item.bedragEur)}</div>
        </div>
        <div>
          <div className="text-gray-500">{t('recurring_kaart_frequentie')}</div>
          <div className="font-medium text-gray-800 text-sm">{freqLabel}{dagInfo ? ` · ${dagInfo}` : ''}</div>
        </div>
        <div>
          <div className="text-gray-500">{t('recurring_kaart_volgende')}</div>
          <div className="font-medium text-gray-800 text-sm">
            {volgendeDatum}
            <span className="text-gray-400 ml-1">({relativeDays(item.volgendeUitvoering)})</span>
          </div>
        </div>
        <div>
          <div className="text-gray-500">{t('recurring_kaart_uitgevoerd')}</div>
          <div className="font-medium text-gray-800 text-sm">{item.aantalUitgevoerd || 0}×</div>
        </div>
      </div>

      <footer className="flex flex-wrap gap-2 mt-2 pt-3 border-t border-gray-100">
        {item.actief ? (
          <button
            type="button"
            onClick={() => onPauzeer(item.id)}
            disabled={bezig}
            className="text-xs px-3 py-2 rounded-lg bg-amber-50 text-amber-700 font-medium border border-amber-100 hover:bg-amber-100 active:scale-95 transition disabled:opacity-50"
          >
            {t('recurring_actie_pauzeer')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onHervat(item.id)}
            disabled={bezig}
            className="text-xs px-3 py-2 rounded-lg bg-green-50 text-green-700 font-medium border border-green-100 hover:bg-green-100 active:scale-95 transition disabled:opacity-50"
          >
            {t('recurring_actie_hervat')}
          </button>
        )}
        <button
          type="button"
          onClick={() => onUitvoer(item.id)}
          disabled={bezig || !item.actief}
          className="text-xs px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium border border-blue-100 hover:bg-blue-100 active:scale-95 transition disabled:opacity-50"
        >
          {t('recurring_actie_uitvoer_nu')}
        </button>
        {/* III — calendar export */}
        <a
          href={`${import.meta.env.VITE_API_URL || ''}/recurring/${item.id}/ical`}
          className="text-xs px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-medium border border-purple-100 hover:bg-purple-100 active:scale-95 transition inline-flex items-center"
          title={t('recurring_ical_tooltip')}
        >
          {t('recurring_ical_knop')}
        </a>
        <button
          type="button"
          onClick={() => onVerwijder(item.id)}
          disabled={bezig}
          className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 font-medium border border-red-100 hover:bg-red-100 active:scale-95 transition disabled:opacity-50 ml-auto"
        >
          {t('recurring_actie_verwijder')}
        </button>
      </footer>
    </article>
  );
}
