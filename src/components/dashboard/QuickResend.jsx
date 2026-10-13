/**
 * QuickResend.jsx — Dashboard widget met laatste 3 ontvangers (Verbetering PPP).
 *
 * 1-tap "Stuur opnieuw" → zet naam + IBAN + bank + het laatste bedrag naar deze
 * ontvanger klaar (services/opnieuwVersturen.js) en opent de betaalflow meteen
 * op het bevestigscherm. De klant tikt daar "Bevestigen & betalen": de tweede
 * overboeking in twee tikken (aanmeldroute punt 11, 13-10-2026). De server
 * controleert die overboeking zoals elke andere.
 *
 * Zichtbaar vanaf de EERSTE geslaagde overboeking (voltooid, of betaald en
 * onderweg). Tot 13-10-2026 pas vanaf twee voltooide, dus juist bij overboeking
 * 2 ontbrak hij.
 */
import { useMemo } from 'react';
import { useTaal } from '../../i18n';
import Avatar from '../Avatar';
import { Zap } from '../icons/Icons';
import { isGeslaagd, gegevensUitTransactie, zetOpnieuwKlaar } from '../../services/opnieuwVersturen';

export default function QuickResend({ transacties = [] }) {
  const { t } = useTaal();

  // Unieke laatste-3 ontvangers (op IBAN, anders naam; behoud meest recente)
  const ontvangers = useMemo(() => {
    const geslaagd = transacties.filter(isGeslaagd);
    if (geslaagd.length < 1) return [];

    const sorted = [...geslaagd].sort(
      (a, b) => new Date(b.aangemaaktOp || 0) - new Date(a.aangemaaktOp || 0)
    );
    const seen = new Set();
    const uniek = [];
    for (const tx of sorted) {
      const naam = tx.ontvangerNaam || tx.ontvanger_naam;
      const iban = tx.ontvangerIBAN || tx.ontvanger_iban;
      const sleutel = iban ? `iban:${String(iban).replace(/\s/g, '').toUpperCase()}` : `naam:${naam}`;
      if (!naam || seen.has(sleutel)) continue;
      seen.add(sleutel);
      uniek.push(tx);
      if (uniek.length >= 3) break;
    }
    return uniek;
  }, [transacties]);

  if (!ontvangers.length) return null;

  function stuurOpnieuw(tx) {
    const gegevens = gegevensUitTransactie(tx);
    // Meteen naar bevestigen kan alleen met een IBAN (bankuitbetaling).
    zetOpnieuwKlaar(gegevens, { direct: Boolean(gegevens.iban) });
  }

  return (
    <section
      aria-label={t('quick_resend_titel')}
      className="rounded-md border border-border bg-surface shadow-soft animate-fade-up p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-medium text-ink-1 text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-500" aria-hidden="true" />
          {t('quick_resend_titel')}
        </h3>
        <span className="text-[11px] text-gray-400">
          {t('quick_resend_subtitel')}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ontvangers.map((tx) => {
          const naam = tx.ontvangerNaam || tx.ontvanger_naam;
          return (
            <button
              key={tx.id || naam}
              onClick={() => stuurOpnieuw(tx)}
              className="flex flex-col items-center gap-2 p-3 rounded-md bg-surface-2 hover:bg-brand-50 border border-border hover:border-brand-200 transition active:scale-95 group"
              aria-label={`${t('quick_resend_naar')} ${naam}`}
            >
              <Avatar naam={naam} size="lg" />
              <div className="text-center min-w-0 w-full">
                <div className="text-xs font-semibold text-ink-1 truncate">
                  {naam}
                </div>
                <div className="text-[10px] text-gray-500 font-display tabular-nums">
                  €{Number(tx.eurBedrag || tx.eur_bedrag || 0).toFixed(0)}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-brand-700 opacity-0 group-hover:opacity-100 transition">
                {t('quick_resend_actie')} →
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
