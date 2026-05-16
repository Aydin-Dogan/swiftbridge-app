/**
 * TransactieReceipt.jsx — Volledige kwitantie met status timeline (Remitly-stijl)
 * Toont 4-stappen voortgang met tijdstempels + print/PDF functionaliteit
 */
import { useState } from 'react';
import Vlag from './Vlag';
import { formatBedrag, getValuta } from '../services/currencies';

function formatTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function maskIBAN(iban) {
  if (!iban || iban.length < 4) return iban || '—';
  return `••••${iban.slice(-4)}`;
}

const MILESTONES = [
  { id: 'initiated',          label: 'Jouw bank',          icon: '🏦', veld: 'milestoneInitiated' },
  { id: 'betaling_ontvangen', label: 'SwiftBridge',        icon: '🌉', veld: 'milestoneBetalingOntvangen' },
  { id: 'tr_bank_verzonden',  label: 'Bank ontvanger',     icon: '🏛️', veld: 'milestoneTrBankVerzonden' },
  { id: 'uitbetaald',         label: 'Rekening ontvanger', icon: '✅', veld: 'milestoneUitbetaald' },
];

export default function TransactieReceipt({ tx, onSluit, onHerhaal }) {
  const [print, setPrint] = useState(false);
  if (!tx) return null;

  const valutaInfo = getValuta(tx.valuta || 'TRY');
  const refNr = tx.referentieNr || tx.referentie_nr || tx.id?.slice(0, 16);

  return (
    <div
      className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 ${print ? 'print:bg-white print:p-0' : ''}`}
      onClick={onSluit}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl animate-fade-up print:shadow-none print:max-h-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 print:hidden">
          <h3 className="font-bold text-gray-800 text-lg">Transactie kwitantie</h3>
          <button onClick={onSluit} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">✕</button>
        </div>

        {/* Welkomst deal badge */}
        {tx.welkomstDeal && (
          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded-xl p-3 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <span className="text-base">🎁</span>
            <span>Welkomst-deal toegepast — fee gratis op deze transactie!</span>
          </div>
        )}

        {/* Ontvanger naam + bedragen */}
        <div className="text-center py-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Ontvanger</div>
          <div className="text-xl font-bold text-gray-800">{tx.ontvangerNaam || tx.ontvanger_naam}</div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div>
              <div className="text-2xl font-bold text-gray-900 font-mono">€{(tx.eurBedrag || tx.eur_bedrag)?.toFixed(2)}</div>
              <div className="text-[10px] text-gray-500">Verstuurd</div>
            </div>
            <div className="text-gray-400 text-xl">→</div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 font-mono">{formatBedrag(tx.ontvangenBedrag || tx.tryBedrag || tx.try_bedrag, tx.valuta || 'TRY')}</div>
              <div className="text-[10px] text-gray-500 flex items-center justify-end gap-1">
                <Vlag land={valutaInfo.landCode} size={10} />
                Ontvangen
              </div>
            </div>
          </div>
        </div>

        {/* Referentie nummer */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Referentienummer</div>
          <div className="font-mono text-sm font-bold text-gray-800 select-all">{refNr}</div>
        </div>

        {/* Status timeline */}
        <div className="space-y-1">
          <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Voortgang</div>
          {MILESTONES.map((m, i) => {
            const ts = tx[m.veld] || tx[m.id];
            const done = !!ts;
            const isLast = i === MILESTONES.length - 1;
            return (
              <div key={m.id} className="flex items-start gap-3">
                {/* Bullet + lijn */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 h-8 ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                  )}
                </div>
                {/* Tekst */}
                <div className="flex-1 pb-3">
                  <div className={`text-sm font-semibold ${done ? 'text-gray-800' : 'text-gray-400'}`}>
                    {m.icon} {m.label}
                  </div>
                  {done && (
                    <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                      {formatTime(ts)}
                    </div>
                  )}
                  {!done && i === MILESTONES.findIndex(x => !tx[x.veld] && !tx[x.id]) && (
                    <div className="text-[10px] text-amber-600 mt-0.5 animate-pulse">In behandeling...</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Details */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Datum</span>
            <span className="font-semibold text-gray-800">{formatTime(tx.aangemaaktOp || tx.datum || tx.milestoneInitiated)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Wisselkoers</span>
            <span className="font-mono font-semibold">1 EUR = {tx.wisselKoers || tx.wissel_koers || '—'} {tx.valuta || 'TRY'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Servicekosten</span>
            <span className={`font-mono font-semibold ${tx.welkomstDeal ? 'text-emerald-600' : 'text-gray-800'}`}>
              {tx.welkomstDeal ? 'GRATIS 🎁' : `€${(tx.feeEur || tx.fee_eur || 0).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Bank ontvanger</span>
            <span className="font-semibold text-gray-800">{tx.ontvangerBank || tx.ontvanger_bank || '—'}</span>
          </div>
          {(tx.ontvangerIBAN || tx.ontvanger_iban) && (
            <div className="flex justify-between">
              <span className="text-gray-500">IBAN</span>
              <span className="font-mono font-semibold">{maskIBAN(tx.ontvangerIBAN || tx.ontvanger_iban)}</span>
            </div>
          )}
        </div>

        {/* Aklınızda olsun / Houd er rekening mee */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-800 leading-snug">
          <strong>💡 Houd er rekening mee:</strong> de bank van de ontvanger kan het geld tot 3 werkdagen vasthouden voordat het beschikbaar is.
        </div>

        {/* Acties */}
        <div className="grid grid-cols-2 gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition active:scale-95"
          >
            🖨️ Print / PDF
          </button>
          <button
            onClick={() => onHerhaal?.(tx)}
            className="btn-primary py-3 text-sm"
          >
            🔁 Opnieuw versturen
          </button>
        </div>
      </div>
    </div>
  );
}
