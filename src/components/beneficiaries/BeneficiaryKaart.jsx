/**
 * BeneficiaryKaart.jsx — Individuele begunstigde card
 * Toont naam + bijnaam, gemaskeerde IBAN, bank, valuta vlag
 * met edit/delete knoppen. Glassmorphism stijl.
 */
import { useTaal } from '../../i18n';
import Vlag from '../Vlag';
import { getValuta } from '../../services/currencies';
import { Bank, Settings, Trash } from '../icons/Icons';

// IBAN masking: toon eerste 4 + laatste 4 chars: "NL12 **** **** 5678"
export function maskeerIban(iban) {
  if (!iban) return '';
  const schoon = String(iban).replace(/\s/g, '').toUpperCase();
  if (schoon.length < 8) return schoon;
  const eerste = schoon.slice(0, 4);
  const laatste = schoon.slice(-4);
  // Middelste deel in groepen van 4 vervangen door ****
  const middenLengte = schoon.length - 8;
  const sterretjes = '*'.repeat(middenLengte);
  // Format met spaties in groepjes van 4
  const samen = eerste + sterretjes + laatste;
  return samen.match(/.{1,4}/g).join(' ');
}

export default function BeneficiaryKaart({ beneficiary, onBewerk, onVerwijder }) {
  const { t } = useTaal();
  const valutaInfo = beneficiary?.valuta ? getValuta(beneficiary.valuta) : null;
  const naam = beneficiary?.naam || '';
  const bijnaam = beneficiary?.bijnaam || beneficiary?.label || null;

  return (
    <div className="bg-surface border border-border rounded-md p-4 shadow-soft hover:bg-surface-2 transition-all animate-fade-up">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-display text-xl font-medium flex-shrink-0">
          {naam?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Gegevens */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-display font-medium text-ink-1 text-sm truncate">{naam}</span>
            {bijnaam && (
              <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full font-semibold">
                {bijnaam}
              </span>
            )}
          </div>

          <div className="text-xs text-ink-3 font-mono tabular-nums mt-0.5 truncate" title={beneficiary?.iban}>
            {maskeerIban(beneficiary?.iban || '')}
          </div>

          <div className="flex items-center gap-2 mt-1">
            {beneficiary?.bank && (
              <span className="text-[11px] text-ink-2 max-w-[140px] inline-flex items-center gap-1 min-w-0" title={beneficiary.bank}>
                <Bank className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{beneficiary.bank}</span>
              </span>
            )}
            {valutaInfo && (
              <span className="flex items-center gap-1 text-[11px] text-ink-2">
                <Vlag land={valutaInfo.landCode} size={14} />
                <span className="font-semibold">{valutaInfo.code}</span>
              </span>
            )}
          </div>

          {beneficiary?.laatst_gebruikt_op && (
            <div className="text-[10px] text-ink-3 mt-1">
              {t('benef_laatst_gebruikt')}: {new Date(beneficiary.laatst_gebruikt_op).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Acties */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {onBewerk && (
            <button
              onClick={() => onBewerk(beneficiary)}
              className="p-2 rounded-md hover:bg-brand-50 text-brand-600 transition"
              title={t('benef_bewerk')}
              aria-label={t('benef_bewerk')}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {onVerwijder && (
            <button
              onClick={() => onVerwijder(beneficiary)}
              className="p-2 rounded-md hover:bg-rose-100 text-rose-600 transition"
              title={t('benef_verwijder')}
              aria-label={t('benef_verwijder')}
            >
              <Trash className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
