/**
 * TransactieReceipt.jsx — Volledige kwitantie met status timeline (Remitly-stijl)
 * Toont 4-stappen voortgang met tijdstempels + print/PDF functionaliteit
 */
import { useState, useEffect } from 'react';
import Vlag from './Vlag';
import { formatBedrag, getValuta } from '../services/currencies';
import { API_URL } from '../services/api';

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
  { id: 'initiated', label: 'Jouw bank', icon: '🏦', veld: 'milestoneInitiated' },
  { id: 'betaling_ontvangen', label: 'SwiftBridge', icon: '🌉', veld: 'milestoneBetalingOntvangen' },
  { id: 'tr_bank_verzonden', label: 'Bank ontvanger', icon: '🏛️', veld: 'milestoneTrBankVerzonden' },
  { id: 'uitbetaald', label: 'Rekening ontvanger', icon: '✅', veld: 'milestoneUitbetaald' },
];

export default function TransactieReceipt({ tx, onSluit, onHerhaal }) {
  const [print, setPrint] = useState(false);
  const [pdfLaden, setPdfLaden] = useState(false);
  const [pdfFout, setPdfFout] = useState(null);
  if (!tx) return null;

  const valutaInfo = getValuta(tx.valuta || 'TRY');
  const refNr = tx.referentieNr || tx.referentie_nr || tx.id?.slice(0, 16);
  const isVoltooid = tx.status === 'voltooid';

  async function downloadPdf() {
    if (!tx?.id || pdfLaden) return;
    setPdfLaden(true);
    setPdfFout(null);
    try {
      const res = await fetch(`${API_URL}/transactions/${tx.id}/pdf`, {
        credentials: 'include',
      });
      if (!res.ok) {
        let bericht = `PDF kon niet worden geladen (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) bericht = data.error;
        } catch { /* niet JSON */ }
        throw new Error(bericht);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swiftbridge-${refNr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // korte timeout zodat de browser de download kan starten voordat de URL wordt vrijgegeven
      setTimeout(() => window.URL.revokeObjectURL(url), 1500);
    } catch (err) {
      console.error('PDF download fout:', err);
      setPdfFout(err.message || 'PDF download mislukt');
    } finally {
      setPdfLaden(false);
    }
  }

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
          <strong>Houd er rekening mee:</strong> de bank van de ontvanger kan het geld tot 3 werkdagen vasthouden voordat het beschikbaar is.
        </div>

        {/* PDF foutmelding */}
        {pdfFout && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[11px] text-red-800 print:hidden">
            {pdfFout}
          </div>
        )}

        {/* Acties */}
        <div className="grid grid-cols-2 gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition active:scale-95"
          >
            🖨️ Print
          </button>
          <button
            onClick={downloadPdf}
            disabled={!isVoltooid || pdfLaden}
            title={!isVoltooid ? 'PDF beschikbaar zodra de transactie voltooid is' : 'Download officiële kwitantie als PDF'}
            className={`font-semibold py-3 rounded-xl text-sm transition active:scale-95 flex items-center justify-center gap-1 ${
              !isVoltooid || pdfLaden
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {pdfLaden ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Bezig…
              </>
            ) : (
              <>📄 Download PDF</>
            )}
          </button>
          <button
            onClick={() => onHerhaal?.(tx)}
            className="btn-primary py-3 text-sm col-span-2"
          >
            Opnieuw versturen
          </button>
        </div>

        {/* Persoonlijke notitie (Verbetering VVV) — inline edit */}
        <NotitieSectie tx={tx} />

        {/* Vertel-een-vriend CTA (Verbetering OOO) — alleen tonen na
            voltooide transactie, motiveert referral op het juiste moment. */}
        {isVoltooid && (
          <ReferralCtaInReceipt />
        )}
      </div>
    </div>
  );
}

/**
 * Mini-component dat alleen verschijnt na voltooide transactie.
 * Toont referral-aanbieding met copy-knop. Lazy-load van apiFetch om
 * geen extra werk te doen bij iedere modal-open.
 */
function ReferralCtaInReceipt() {
  const [data, setData] = useState(null);
  const [gekopieerd, setGekopieerd] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('../services/api').then(({ apiFetch }) => {
      apiFetch('/referral/mijn')
        .then(d => { if (!cancelled) setData(d); })
        .catch(() => {/* niet kritiek */});
    });
    return () => { cancelled = true; };
  }, []);

  if (!data?.deelUrl) return null;

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(data.deelUrl);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2500);
    } catch {/* silent */}
  }

  function whatsapp() {
    const bericht = `Ik gebruik SwiftBridge voor geld sturen naar Türkiye — snel én goedkoop. Doe je mee? ${data.deelUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(bericht)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="mt-3 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-3 print:hidden">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl flex-shrink-0" aria-hidden="true">🎁</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-emerald-900 text-sm">
            Verdien €{data.beloningPerVriendEur} per uitnodiging
          </p>
          <p className="text-xs text-emerald-800 mt-0.5">
            Vertel een vriend over SwiftBridge — jullie krijgen allebei een bonus.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={kopieer}
          className="text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg py-2 transition"
        >
          {gekopieerd ? '✓ Gekopieerd' : 'Kopieer link'}
        </button>
        <button
          onClick={whatsapp}
          className="text-xs font-bold text-white bg-[#25D366] hover:bg-[#1ebe57] rounded-lg py-2 transition"
        >
          💬 WhatsApp
        </button>
      </div>
    </div>
  );
}

/**
 * NotitieSectie — inline weergave + edit van persoonlijke notitie per tx (VVV).
 * Optimistisch: laat nieuwe waarde direct zien, rollback bij API-fout.
 */
function NotitieSectie({ tx }) {
  const [notitie, setNotitie] = useState(tx?.notitie || '');
  const [bewerk, setBewerk] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const oudeWaardeRef = tx?.notitie || '';

  async function opslaan() {
    setBezig(true);
    setFout('');
    try {
      const res = await fetch(`${API_URL}/transactions/${tx.id}/notitie`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notitie: notitie.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFout(data.error || `HTTP ${res.status}`);
        setNotitie(oudeWaardeRef); // rollback
        return;
      }
      setBewerk(false);
    } catch (err) {
      setFout(err.message);
      setNotitie(oudeWaardeRef);
    } finally {
      setBezig(false);
    }
  }

  if (!tx) return null;

  return (
    <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-200 print:hidden">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-600">📝 Persoonlijke notitie</span>
        {!bewerk && (
          <button
            onClick={() => setBewerk(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            disabled={bezig}
          >
            {notitie ? 'Bewerken' : '+ Toevoegen'}
          </button>
        )}
      </div>
      {bewerk ? (
        <div className="space-y-2">
          <input
            type="text"
            value={notitie}
            onChange={(e) => setNotitie(e.target.value.slice(0, 200))}
            placeholder="Bv. 'Verjaardag Moeder'"
            maxLength={200}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
            disabled={bezig}
          />
          <div className="flex gap-2">
            <button
              onClick={opslaan}
              disabled={bezig}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg px-3 py-1.5"
            >
              {bezig ? '...' : 'Opslaan'}
            </button>
            <button
              onClick={() => { setNotitie(oudeWaardeRef); setBewerk(false); setFout(''); }}
              disabled={bezig}
              className="text-xs text-gray-500 hover:text-gray-700 px-2"
            >
              Annuleren
            </button>
          </div>
          {fout && <div className="text-xs text-red-600">{fout}</div>}
        </div>
      ) : (
        <p className="text-sm text-gray-700 italic">
          {notitie || <span className="text-gray-400">Geen notitie — klik "Toevoegen" om een herinnering aan deze transactie toe te voegen.</span>}
        </p>
      )}
    </div>
  );
}
