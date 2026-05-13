/**
 * PaymentFlow.jsx — Verbeterde betaalflow
 * - iDEAL + SEPA keuze
 * - Snelle bedragknoppen
 * - Opgeslagen ontvangers (localStorage)
 * - Transactie opslaan + dashboard notificatie
 * - Browser push notificatie na voltooiing
 */
import { useState, useEffect } from 'react';

const API       = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SWIFTNEWS = import.meta.env.VITE_SWIFTNEWS_URL || 'https://news-production-8477.up.railway.app';
const TX_KEY    = 'swiftbridge_transacties';
const ONTV_KEY  = 'swiftbridge_ontvangers';

const STAPPEN = ['Bedrag', 'Betaalmethode', 'Bevestiging', 'Verzonden'];
const SNELLE_BEDRAGEN = [100, 250, 500, 1000, 2000];

const BETAALMETHODEN = [
  {
    id:    'ideal',
    label: 'iDEAL',
    icon:  '🏦',
    desc:  'Directe betaling via je bank',
    sub:   'Meest gekozen · Direct beschikbaar',
    kleur: 'border-blue-500 bg-blue-50',
  },
  {
    id:    'sepa',
    label: 'Bank overboeking (SEPA)',
    icon:  '🏛️',
    desc:  'Standaard bankoverboeking',
    sub:   'Verwerkingstijd: 1–2 werkdagen',
    kleur: 'border-purple-400 bg-purple-50',
  },
];

// ── IBAN validatie ────────────────────────────────────────────────────────────
const IBAN_LENGTES = { TR: 26, NL: 18, DE: 22, BE: 16, FR: 27, GB: 22, AT: 20, ES: 24, IT: 27, PL: 28 };

function valideerIBAN(iban) {
  const schoon = iban.replace(/\s/g, '').toUpperCase();
  if (schoon.length < 4) return { geldig: false, fout: 'IBAN te kort' };
  const land = schoon.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(land)) return { geldig: false, fout: 'Ongeldige landcode' };
  const verwachteLengte = IBAN_LENGTES[land];
  if (verwachteLengte && schoon.length !== verwachteLengte) {
    return { geldig: false, fout: `${land} IBAN moet ${verwachteLengte} tekens zijn (nu ${schoon.length})` };
  }
  // Mod-97 checksum
  const hergerangschikt = schoon.slice(4) + schoon.slice(0, 4);
  const numeriek = hergerangschikt.split('').map(c => {
    const code = c.charCodeAt(0);
    return code >= 65 ? (code - 55).toString() : c;
  }).join('');
  let rest = 0;
  for (const cijfer of numeriek) { rest = (rest * 10 + parseInt(cijfer)) % 97; }
  if (rest !== 1) return { geldig: false, fout: 'Ongeldig IBAN (controlecijfers kloppen niet)' };
  return { geldig: true, fout: null };
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function laadOntvangers() {
  try { return JSON.parse(localStorage.getItem(ONTV_KEY) || '[]'); }
  catch { return []; }
}

function slaOntvangerOp(naam, iban) {
  const bestaand = laadOntvangers();
  const bestaat  = bestaand.some(o => o.iban === iban);
  if (!bestaat && naam && iban) {
    const bijgewerkt = [{ naam, iban, datum: new Date().toISOString() }, ...bestaand].slice(0, 10);
    localStorage.setItem(ONTV_KEY, JSON.stringify(bijgewerkt));
  }
}

function slaTransactieOp(tx) {
  const bestaand = JSON.parse(localStorage.getItem(TX_KEY) || '[]');
  localStorage.setItem(TX_KEY, JSON.stringify([tx, ...bestaand]));
  window.dispatchEvent(new Event('swiftbridge_tx_update'));
}

async function stuurPushNotificatie(titel, tekst) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission === 'granted') {
    new Notification(titel, { body: tekst, icon: '/icon-192.png', badge: '/icon-192.png' });
  }
}

// ── Ontvanger modal ───────────────────────────────────────────────────────────
function OntvangerModal({ onKies, onSluit }) {
  const ontvangers = laadOntvangers();
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Kies ontvanger</h3>
          <button onClick={onSluit} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
          {ontvangers.map((o, i) => (
            <button key={i} onClick={() => onKies(o)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition text-left">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                {o.naam[0]}
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{o.naam}</div>
                <div className="text-xs text-gray-400 font-mono">{o.iban.slice(0, 12)}…</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stap 0: Bedrag ────────────────────────────────────────────────────────────
function StapBedrag({ bedrag, setBedrag, ontvanger, setOntvanger, iban, setIban, koers, onVolgende }) {
  const [toonOntvangers, setToonOntvangers] = useState(false);
  const ontvangers = laadOntvangers();
  const netto      = parseFloat(bedrag) * 0.978;
  const tryBedrag  = koers && bedrag && !isNaN(bedrag) ? Math.floor(netto * koers) : null;

  const ibanCheck  = iban.length > 4 ? valideerIBAN(iban) : null;
  const ibanGeldig = !iban || (ibanCheck?.geldig === true);
  const kanVolgende = bedrag && !isNaN(bedrag) && parseFloat(bedrag) >= 10 && ontvanger && iban && ibanCheck?.geldig;

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5">
      <h2 className="text-xl font-bold text-gray-800">💸 Geld overmaken</h2>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Bedrag (EUR)</label>
        <div className="flex items-center border-2 border-blue-500 rounded-xl px-4 py-3 bg-blue-50/50">
          <span className="text-2xl font-bold text-blue-400 mr-2">€</span>
          <input type="number" min="10" max="5000" step="10"
            value={bedrag} onChange={e => setBedrag(e.target.value)}
            className="flex-1 text-2xl font-bold text-gray-800 outline-none bg-transparent" />
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {SNELLE_BEDRAGEN.map(b => (
            <button key={b} onClick={() => setBedrag(b.toString())}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                bedrag === b.toString()
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'}`}>
              €{b.toLocaleString('nl-NL')}
            </button>
          ))}
        </div>
      </div>

      {tryBedrag !== null && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Wisselkoers</span>
            <span className="font-medium">1 EUR = {koers.toFixed(4)} TRY</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Transactiekosten (2,2%)</span>
            <span className="font-medium text-red-500">−€{(parseFloat(bedrag) * 0.022).toFixed(2)}</span>
          </div>
          <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-blue-700">
            <span>Ontvanger krijgt</span>
            <span className="text-lg">₺{tryBedrag.toLocaleString('tr-TR')}</span>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-600">Naam ontvanger</label>
          {ontvangers.length > 0 && (
            <button onClick={() => setToonOntvangers(true)}
              className="text-xs text-blue-600 font-medium hover:underline">📋 Kies opgeslagen</button>
          )}
        </div>
        <input value={ontvanger} onChange={e => setOntvanger(e.target.value)}
          placeholder="Mehmet Yilmaz"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">IBAN ontvanger</label>
        <input value={iban} onChange={e => setIban(e.target.value.toUpperCase().replace(/\s/g, ''))}
          placeholder="TR330006100519786457841326"
          className={`w-full border-2 rounded-xl px-4 py-3 outline-none font-mono text-sm transition ${
            !iban ? 'border-gray-200' :
            ibanCheck?.geldig ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
          }`} />
        {iban && ibanCheck && (
          <p className={`text-xs mt-1 ${ibanCheck.geldig ? 'text-green-600' : 'text-red-500'}`}>
            {ibanCheck.geldig ? '✅ Geldig IBAN' : `❌ ${ibanCheck.fout}`}
          </p>
        )}
      </div>

      <button onClick={onVolgende}
        disabled={!kanVolgende}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition">
        Betaalmethode kiezen →
      </button>

      {toonOntvangers && (
        <OntvangerModal
          onKies={o => { setOntvanger(o.naam); setIban(o.iban); setToonOntvangers(false); }}
          onSluit={() => setToonOntvangers(false)} />
      )}
    </div>
  );
}

// ── Stap 1: Betaalmethode ─────────────────────────────────────────────────────
function StapBetaalmethode({ methode, setMethode, onVolgende, onTerug }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5">
      <h2 className="text-xl font-bold text-gray-800">💳 Kies betaalmethode</h2>
      <div className="space-y-3">
        {BETAALMETHODEN.map(m => (
          <label key={m.id}
            className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition ${
              methode === m.id ? m.kleur : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <input type="radio" name="methode" value={m.id}
              checked={methode === m.id} onChange={() => setMethode(m.id)} className="sr-only" />
            <span className="text-3xl">{m.icon}</span>
            <div className="flex-1">
              <div className="font-bold text-gray-800">{m.label}</div>
              <div className="text-sm text-gray-500">{m.desc}</div>
              <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              methode === m.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
              {methode === m.id && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </label>
        ))}
      </div>

      {methode === 'sepa' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 space-y-1">
          <p className="font-bold">🏛️ Maak over naar SwiftBridge:</p>
          <p className="font-mono text-xs">IBAN: NL12SWFT0000000001</p>
          <p className="font-mono text-xs">BIC: SWFTNL2A</p>
          <p className="text-xs text-amber-600 mt-1">Vermeld je e-mailadres als omschrijving.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onTerug} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">← Terug</button>
        <button onClick={onVolgende} disabled={!methode}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition">Controleren →</button>
      </div>
    </div>
  );
}

// ── Stap 2: Bevestiging ───────────────────────────────────────────────────────
function StapBevestiging({ bedrag, ontvanger, iban, methode, koers, laden, fout, onVerstuur, onTerug }) {
  const netto      = parseFloat(bedrag) * 0.978;
  const tryBedrag  = koers ? Math.floor(netto * koers) : 0;
  const methodeObj = BETAALMETHODEN.find(m => m.id === methode);

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5">
      <h2 className="text-xl font-bold text-gray-800">✅ Bevestig overmaken</h2>
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        {[
          ['Van',              `€${parseFloat(bedrag).toFixed(2)}`],
          ['Betaalmethode',    `${methodeObj?.icon} ${methodeObj?.label}`],
          ['Naar',             ontvanger],
          ['IBAN',             `${iban.slice(0,4)} •••• ${iban.slice(-4)}`],
          ['Transactiekosten', `€${(parseFloat(bedrag) * 0.022).toFixed(2)}`],
          ['Ontvanger krijgt', `₺${tryBedrag.toLocaleString('tr-TR')}`],
          ['Aankomsttijd',     methode === 'ideal' ? '< 5 minuten ⚡' : '1–2 werkdagen'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-gray-500 text-sm">{label}</span>
            <span className="font-semibold text-gray-800 text-sm text-right">{value}</span>
          </div>
        ))}
      </div>

      {fout && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{fout}</div>}

      <p className="text-xs text-gray-400 text-center">
        Door te bevestigen ga je akkoord met onze{' '}
        <a href="/algemene-voorwaarden" target="_blank" className="text-blue-500 hover:underline">Algemene Voorwaarden</a>.
      </p>

      <div className="flex gap-3">
        <button onClick={onTerug} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">← Terug</button>
        <button onClick={onVerstuur} disabled={laden}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition">
          {laden ? '⏳ Verwerken...' : '✓ Bevestigen & betalen'}
        </button>
      </div>
    </div>
  );
}

// ── Stap 3: Verzonden ─────────────────────────────────────────────────────────
function StapVerzonden({ transactie, methode, onNieuw }) {
  const methodeObj = BETAALMETHODEN.find(m => m.id === methode);
  return (
    <div className="bg-white rounded-2xl shadow p-6 text-center space-y-5">
      <div className="text-6xl">🎉</div>
      <h2 className="text-2xl font-bold text-green-600">Geld onderweg!</h2>
      <p className="text-gray-500 text-sm">
        {methode === 'ideal'
          ? 'Je iDEAL betaling is verwerkt. Het geld is binnen 5 minuten op de rekening in Turkije.'
          : 'Je SEPA overboeking is geregistreerd. Na ontvangst sturen we het geld door naar Turkije.'}
      </p>
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2 text-left">
        {[
          ['Verstuurd',        `€${transactie?.eurBedrag?.toFixed(2)}`],
          ['Ontvanger krijgt', `₺${transactie?.tryBedrag?.toLocaleString('tr-TR')}`],
          ['Methode',          `${methodeObj?.icon} ${methodeObj?.label}`],
          ['Transactie ID',    transactie?.id?.slice(0,16) + '…'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-bold text-gray-800">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Je ontvangt een bevestiging per e-mail. De transactie is zichtbaar in je dashboard.
      </p>
      <button onClick={onNieuw}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">
        Nieuwe overschrijving
      </button>
    </div>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function PaymentFlow({ token }) {
  const [stap,       setStap      ] = useState(0);
  const [bedrag,     setBedrag    ] = useState('500');
  const [ontvanger,  setOntvanger ] = useState('');
  const [iban,       setIban      ] = useState('');
  const [methode,    setMethode   ] = useState('ideal');
  const [koers,      setKoers     ] = useState(null);
  const [transactie, setTransactie] = useState(null);
  const [laden,      setLaden     ] = useState(false);
  const [fout,       setFout      ] = useState('');

  useEffect(() => {
    fetch(`${SWIFTNEWS}/api/forex`)
      .then(r => r.json())
      .then(j => { if (j.rate) setKoers(j.rate); })
      .catch(() => {});
  }, []);

  async function verstuur() {
    setLaden(true);
    setFout('');

    // Genereer een idempotency key per poging — voorkomt dubbele transacties bij retry
    const idempotencyKey = (window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`);

    try {
      const res = await fetch(`${API}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          eurBedrag: parseFloat(bedrag),
          ontvangerNaam: ontvanger,
          ontvangerIBAN: iban,
          ontvangerBank: 'Garanti BBVA',
          methode,
        }),
      });

      // Lees het antwoord
      const data = await res.json().catch(() => ({}));

      // FOUT — geen succes tonen, gebruiker terug naar bevestigingsscherm met fout
      if (!res.ok) {
        const errBericht = data.error || `Server fout (${res.status}). Probeer opnieuw.`;
        setFout(errBericht);
        return; // Belangrijk: NIET doorgaan naar succes scherm
      }

      // Server transactie gelukt — gebruik server data, niet lokale berekening
      if (!data.transactie?.id) {
        setFout('Onverwachte server respons. Neem contact op met support.');
        return;
      }

      const tx = {
        id: data.transactie.id,
        eurBedrag: data.transactie.eurBedrag,
        tryBedrag: data.transactie.tryBedrag,
        feeEur: data.transactie.feeEur,
        wisselKoers: data.transactie.wisselKoers,
        ontvangerNaam: data.transactie.ontvangerNaam,
        ontvangerIBAN: iban,
        methode,
        status: data.transactie.status, // 'in_behandeling' van server
        datum: new Date().toISOString(),
      };

      slaTransactieOp(tx);
      slaOntvangerOp(ontvanger, iban);
      setTransactie(tx);

      await stuurPushNotificatie(
        '✅ SwiftBridge — Betaling verstuurd!',
        `€${tx.eurBedrag.toFixed(2)} → ₺${tx.tryBedrag.toLocaleString('tr-TR')} voor ${ontvanger}`
      );

      setStap(3);
    } catch (e) {
      // Netwerk fout of timeout
      setFout('Geen verbinding met server. Controleer je internet en probeer opnieuw. Je transactie is NIET verstuurd.');
    } finally {
      setLaden(false);
    }
  }

  function reset() {
    setStap(0); setTransactie(null); setBedrag('500');
    setOntvanger(''); setIban(''); setMethode('ideal'); setFout('');
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Stap indicator */}
      <div className="flex items-center justify-center mb-6">
        {STAPPEN.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
              i < stap   ? 'bg-blue-600 text-white' :
              i === stap ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500' :
                           'bg-gray-100 text-gray-400'}`}>
              {i < stap ? '✓' : i + 1}
            </div>
            <span className={`mx-1 text-xs font-medium hidden sm:block ${i <= stap ? 'text-blue-600' : 'text-gray-400'}`}>
              {s}
            </span>
            {i < STAPPEN.length - 1 && (
              <div className={`w-5 h-0.5 mx-1 ${i < stap ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {stap === 0 && <StapBedrag bedrag={bedrag} setBedrag={setBedrag} ontvanger={ontvanger} setOntvanger={setOntvanger} iban={iban} setIban={setIban} koers={koers} onVolgende={() => setStap(1)} />}
      {stap === 1 && <StapBetaalmethode methode={methode} setMethode={setMethode} onVolgende={() => setStap(2)} onTerug={() => setStap(0)} />}
      {stap === 2 && <StapBevestiging bedrag={bedrag} ontvanger={ontvanger} iban={iban} methode={methode} koers={koers} laden={laden} fout={fout} onVerstuur={verstuur} onTerug={() => setStap(1)} />}
      {stap === 3 && <StapVerzonden transactie={transactie} methode={methode} onNieuw={reset} />}
    </div>
  );
}
