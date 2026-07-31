/**
 * Tijdlijn.jsx — datum-gegroepeerde transactielijst (bank-Overzicht concept)
 *
 * Gedeeld tussen het Overzicht (rechterkolom, compacte feed) en de
 * Rekening-detailpagina ("Af- en bijschrijvingen", volledig + zoeken).
 * Rijen: status-icoon, ontvanger, omschrijving/status, rechts −EUR (fg-minus)
 * met daaronder het ontvangen bedrag (fg-plus). Klik → TransactieReceipt.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TransactieReceipt from '../TransactieReceipt';
import { formatBedrag } from '../../services/currencies';
import { useTaal } from '../../i18n';
import { CheckCircle, Clock, XCircle, X as XIcon, Info } from '../icons/Icons';

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function fmtOntvangen(tx) {
  if (tx?.valuta && tx?.ontvangenBedrag != null) return formatBedrag(tx.ontvangenBedrag, tx.valuta);
  if (tx?.tryBedrag != null) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(tx.tryBedrag);
  }
  return null;
}

const TAAL_LOCALES = { nl: 'nl-NL', tr: 'tr-TR', en: 'en-GB', ru: 'ru-RU', az: 'az-AZ' };

function dagLabel(isoDag, taal) {
  const locale = TAAL_LOCALES[taal] || 'nl-NL';
  const d = new Date(`${isoDag}T12:00:00`);
  const nu = new Date();
  const opties = { day: 'numeric', month: 'long' };
  if (d.getFullYear() !== nu.getFullYear()) opties.year = 'numeric';
  return d.toLocaleDateString(locale, opties);
}

function StatusIcoon({ status }) {
  if (status === 'voltooid') return <CheckCircle className="w-5 h-5 text-success-600" />;
  if (status === 'mislukt') return <XCircle className="w-5 h-5 text-fg-error" />;
  if (status === 'geannuleerd') return <XIcon className="w-5 h-5 text-ink-3" />;
  if (status === 'info_nodig' || status === 'info_in_behandeling') return <Info className="w-5 h-5 text-accent-600" />;
  return <Clock className="w-5 h-5 text-accent-600" />;
}

export default function Tijdlijn({
  transacties = [],
  laden = false,
  limiet = null,          // max aantal rijen (Overzicht-feed); null = alles
  metZoeken = false,      // zoekveld boven de lijst (Rekening-detail)
  toonVoet = false,       // "Ga naar alle transacties" onderaan (Overzicht-feed)
  kaal = false,           // zonder eigen kaart-rand (voor gebruik binnen een Card)
}) {
  const { t, taal } = useTaal();
  const navigate = useNavigate();
  const [detailTx, setDetailTx] = useState(null);
  const [zoekTerm, setZoekTerm] = useState('');

  const rijen = useMemo(() => {
    let lijst = [...transacties].sort(
      (a, b) => new Date(b.aangemaaktOp || b.datum || 0) - new Date(a.aangemaaktOp || a.datum || 0)
    );
    if (zoekTerm.trim()) {
      const term = zoekTerm.toLowerCase().trim();
      lijst = lijst.filter(tx => {
        const naam = (tx.ontvangerNaam || tx.ontvanger_naam || '').toLowerCase();
        const notitie = (tx.notitie || '').toLowerCase();
        return naam.includes(term) || notitie.includes(term) || String(tx.eurBedrag || '').includes(term);
      });
    }
    if (limiet) lijst = lijst.slice(0, limiet);
    return lijst;
  }, [transacties, zoekTerm, limiet]);

  // Groepeer op kalenderdag (lokale datum uit ISO-timestamp)
  const groepen = useMemo(() => {
    const perDag = new Map();
    for (const tx of rijen) {
      const iso = tx.aangemaaktOp || tx.datum;
      const dag = iso ? new Date(iso).toISOString().slice(0, 10) : 'onbekend';
      if (!perDag.has(dag)) perDag.set(dag, []);
      perDag.get(dag).push(tx);
    }
    return [...perDag.entries()];
  }, [rijen]);

  function dagTotaal(txs) {
    const som = txs
      .filter(tx => !['mislukt', 'geannuleerd'].includes(tx.status))
      .reduce((s, tx) => s + (tx.eurBedrag || 0), 0);
    return som > 0 ? `−${fmtEur(som)}` : null;
  }

  return (
    <div className={kaal ? '' : 'rounded-md border border-border bg-surface shadow-soft overflow-hidden'}>
      {metZoeken && !laden && transacties.length > 0 && (
        <div className="px-4 py-2.5 bg-surface-2 border-b border-border-subtle">
          <input
            type="search"
            value={zoekTerm}
            onChange={(e) => setZoekTerm(e.target.value)}
            placeholder={t('tijdlijn_zoek')}
            aria-label={t('tijdlijn_zoek')}
            className="w-full text-xs border border-border bg-surface rounded-md px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      )}

      {laden && (
        <div className="divide-y divide-border-subtle">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full animate-shimmer" />
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded-md animate-shimmer" />
                  <div className="h-3 w-16 rounded-md animate-shimmer" />
                </div>
              </div>
              <div className="h-3 w-16 rounded-md animate-shimmer" />
            </div>
          ))}
        </div>
      )}

      {!laden && rijen.length === 0 && (
        <p className="text-sm text-ink-3 px-4 py-8 text-center">
          {zoekTerm ? t('tijdlijn_geen_resultaat') : t('tijdlijn_leeg')}
        </p>
      )}

      {!laden && groepen.map(([dag, txs]) => (
        <section key={dag} aria-label={dagLabel(dag, taal)}>
          <div className="flex items-center justify-between px-4 pt-3 pb-1.5 bg-surface">
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600">
              {dagLabel(dag, taal)}
            </span>
            <span className="text-[11px] text-ink-3 font-display tabular-nums">
              {dagTotaal(txs) || 'EUR'}
            </span>
          </div>
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {txs.map((tx, i) => {
              const ontvangen = fmtOntvangen(tx);
              const geweigerd = tx.status === 'mislukt' || tx.status === 'geannuleerd';
              return (
                <li key={tx.id || `${dag}-${i}`}>
                  <button
                    onClick={() => setDetailTx(tx)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2 transition text-left focus:outline-none focus:bg-surface-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tx.status === 'voltooid' ? 'bg-success-50' : geweigerd ? 'bg-surface-2' : 'bg-accent-400/10'
                      }`} aria-hidden="true">
                        <StatusIcoon status={tx.status} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-1 text-sm truncate">
                          {tx.ontvangerNaam || tx.ontvanger_naam || '—'}
                        </div>
                        <div className="text-[11px] text-ink-3 truncate mt-0.5">
                          {tx.notitie
                            || (tx.status === 'voltooid' ? t('status_voltooid')
                              : tx.status === 'mislukt' ? t('status_mislukt')
                              : tx.status === 'geannuleerd' ? t('status_geannuleerd')
                              : tx.status === 'info_nodig' ? t('status_info_nodig')
                              : tx.status === 'info_in_behandeling' ? t('status_info_in_behandeling')
                              : t('status_in_behandeling'))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`font-display font-medium text-sm tabular-nums ${
                        geweigerd ? 'text-ink-3 line-through' : 'text-fg-minus'
                      }`}>
                        {'−'}{fmtEur(tx.eurBedrag)}
                      </div>
                      {ontvangen && tx.status === 'voltooid' && (
                        <div className="text-[11px] text-fg-plus font-semibold font-display tabular-nums">{ontvangen}</div>
                      )}
                    </div>
                  </button>
                  {tx.status === 'info_nodig' && (
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => navigate(`/app/transactie-info/${tx.id}`)}
                        className="w-full py-2.5 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-[0.7rem] font-semibold uppercase tracking-[0.16em] transition-colors"
                      >
                        {t('info_aanleveren_cta')}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {toonVoet && !laden && transacties.length > (limiet || 0) && (
        <div className="border-t border-border-subtle px-4 py-3">
          <button
            onClick={() => navigate('/app/rekening')}
            className="w-full text-center text-sm text-brand-700 font-semibold hover:underline underline-offset-4 focus:outline-none focus:underline"
          >
            {t('tijdlijn_alle')}
          </button>
        </div>
      )}

      <TransactieReceipt
        tx={detailTx}
        onSluit={() => setDetailTx(null)}
        onHerhaal={(tx) => {
          localStorage.setItem('swiftbridge_repeat_tx', JSON.stringify({
            ontvanger: tx.ontvangerNaam || tx.ontvanger_naam,
            iban: tx.ontvangerIBAN || tx.ontvanger_iban,
            bedrag: tx.eurBedrag || tx.eur_bedrag,
            valuta: tx.valuta || 'TRY',
          }));
          setDetailTx(null);
          window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }));
        }}
      />
    </div>
  );
}
