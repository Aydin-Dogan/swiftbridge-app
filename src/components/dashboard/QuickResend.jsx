/**
 * QuickResend.jsx — Dashboard widget met laatste 3 ontvangers (Verbetering PPP).
 *
 * 1-tap "Stuur opnieuw" → bevoegt naam+IBAN+bedrag uit laatste transactie naar
 * deze ontvanger, slaat op in swiftbridge_repeat_tx localStorage, opent
 * PaymentFlow (zelfde mechaniek als TransactieReceipt onHerhaal).
 *
 * Verbergt zichzelf als <2 voltooide transacties (clutter-vrij voor nieuwe users).
 */
import { useMemo } from 'react';
import { useTaal } from '../../i18n';
import Avatar from '../Avatar';
import { Zap } from '../icons/Icons';

export default function QuickResend({ transacties = [] }) {
  const { t } = useTaal();

  // Unieke laatste-3 ontvangers (deduplicate op naam, behoud meest recente)
  const ontvangers = useMemo(() => {
    const voltooid = transacties.filter(tx => tx.status === 'voltooid');
    if (voltooid.length < 2) return [];

    const sorted = [...voltooid].sort(
      (a, b) => new Date(b.aangemaaktOp || 0) - new Date(a.aangemaaktOp || 0)
    );
    const seen = new Set();
    const uniek = [];
    for (const tx of sorted) {
      const naam = tx.ontvangerNaam || tx.ontvanger_naam;
      if (!naam || seen.has(naam)) continue;
      seen.add(naam);
      uniek.push(tx);
      if (uniek.length >= 3) break;
    }
    return uniek;
  }, [transacties]);

  if (!ontvangers.length) return null;

  function stuurOpnieuw(tx) {
    try {
      localStorage.setItem('swiftbridge_repeat_tx', JSON.stringify({
        ontvanger: tx.ontvangerNaam || tx.ontvanger_naam,
        iban: tx.ontvangerIBAN || tx.ontvanger_iban,
        bedrag: tx.eurBedrag || tx.eur_bedrag,
        valuta: tx.valuta || 'TRY',
      }));
    } catch {/* private mode */}
    // Dispatch event om naar betaling-tab te navigeren
    window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }));
  }

  return (
    <section
      aria-label={t('quick_resend_titel')}
      className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-lg shadow-sm animate-fade-up p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" aria-hidden="true" />
          {t('quick_resend_titel')}
        </h3>
        <span className="text-[11px] text-slate-400">
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
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition active:scale-95 group"
              aria-label={`${t('quick_resend_naar')} ${naam}`}
            >
              <Avatar naam={naam} size="lg" />
              <div className="text-center min-w-0 w-full">
                <div className="text-xs font-semibold text-gray-800 truncate">
                  {naam}
                </div>
                <div className="text-[10px] text-gray-500">
                  €{Number(tx.eurBedrag || tx.eur_bedrag || 0).toFixed(0)}
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition">
                {t('quick_resend_actie')} →
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
