/**
 * RekeningenCard.jsx — "Betaalrekening"-kaart op het Overzicht (bank-concept).
 * Rij 1: SwiftBridge-rekening van de gebruiker → klik opent /app/rekening.
 * Totaal-rij: alles wat ooit is overgemaakt. Daaronder Inzicht- en
 * Valuta wisselen-rijen zoals in het voorbeeldoverzicht.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { Wallet, Lightbulb, ArrowRight } from '../icons/Icons';

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

export default function RekeningenCard({ gebruiker, transacties = [], laden = false }) {
  const { t } = useTaal();
  const navigate = useNavigate();

  const { maandTotaal, totaal } = useMemo(() => {
    const nu = new Date();
    let maand = 0, alles = 0;
    for (const tx of transacties) {
      if (tx.status !== 'voltooid') continue;
      alles += tx.eurBedrag || 0;
      const d = new Date(tx.aangemaaktOp || tx.datum || 0);
      if (d.getFullYear() === nu.getFullYear() && d.getMonth() === nu.getMonth()) {
        maand += tx.eurBedrag || 0;
      }
    }
    return { maandTotaal: maand, totaal: alles };
  }, [transacties]);

  return (
    <section className="rounded-md border border-border bg-surface shadow-soft overflow-hidden animate-fade-up"
      aria-label={t('rekening_kaart_titel')}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <Wallet className="w-4 h-4 text-accent-600" aria-hidden="true" />
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600">
          {t('rekening_kaart_titel')}
        </h3>
      </div>

      {/* Rekening-rij → detailpagina */}
      <button
        onClick={() => navigate('/app/rekening')}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface-2 transition text-left focus:outline-none focus:bg-surface-2 border-b border-border-subtle"
      >
        <div className="min-w-0">
          <div className="font-semibold text-ink-1 text-sm truncate uppercase">
            {t('rekening_kaart_naam')}
          </div>
          <div className="text-[11px] text-ink-3 mt-0.5 truncate">{gebruiker?.naam || ''}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="font-display font-medium text-sm tabular-nums text-ink-1">
              {laden ? '…' : fmtEur(maandTotaal)}
            </div>
            <div className="text-[11px] text-ink-3">{t('rekening_deze_maand')}</div>
          </div>
          <span className="text-ink-3" aria-hidden="true">›</span>
        </div>
      </button>

      {/* Totaal-rij */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface">
        <span className="text-sm text-ink-2 font-medium">{t('rekening_totaal')}</span>
        <span className="font-display font-medium text-sm tabular-nums text-ink-1">
          {laden ? '…' : fmtEur(totaal)}
        </span>
      </div>

      {/* Inzicht-rij */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'inzicht' }))}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition text-left focus:outline-none focus:bg-surface-2 border-b border-border-subtle"
      >
        <span className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <Lightbulb className="w-4 h-4 text-brand-600" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink-1 text-sm">{t('rekening_inzicht_titel')}</div>
          <div className="text-[11px] text-ink-3 mt-0.5">{t('rekening_inzicht_sub')}</div>
        </div>
        <span className="text-ink-3" aria-hidden="true">›</span>
      </button>

      {/* Valuta wisselen-rij */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="font-semibold text-ink-1 text-sm">{t('rekening_wisselen_titel')}</div>
          <div className="text-[11px] text-ink-3 mt-0.5">{t('rekening_wisselen_sub')}</div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))}
          className="flex-shrink-0 text-sm font-semibold text-brand-700 border border-brand-300 hover:bg-brand-50 rounded-md px-4 py-2 transition inline-flex items-center gap-1.5"
        >
          {t('rekening_wisselen_knop')} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
