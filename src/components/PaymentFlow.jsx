/**
 * PaymentFlow.jsx — Verbeterde betaalflow
 * - iDEAL + SEPA keuze
 * - Multi-currency: TRY, AZN, KZT, UZS, TMT, KGS, USD, GBP, EUR, MAD
 * - Snelle bedragknoppen
 * - Opgeslagen ontvangers (localStorage)
 * - Transactie opslaan + dashboard notificatie
 * - Browser push notificatie na voltooiing
 */
import { useState, useEffect } from 'react';
import { VALUTAS, getValuta, formatBedrag } from '../services/currencies';
import { berekenKosten, KOSTEN_LABELS, zichtbarePercentage } from '../services/kosten';
import { apiFetch, parseError } from '../services/api';
import { useTaal } from '../i18n';
import Vlag from './Vlag';
import { TR_BANKEN_COMPLEET, CATEGORIE_LABELS, bankenPerCategorie } from '../services/trBanken';
import { bankenPerLand, bankenPerLandPerCategorie, LAND_INFO } from '../services/turkstaligeBanken';
import BeneficiaryKiezer from './beneficiaries/BeneficiaryKiezer';
import { Bank, Card, Wallet, Euro, Globe } from './icons/Icons';
import PaymentLoadingOverlay from './payment/PaymentLoadingOverlay';
import SimulatieBanner from './SimulatieBanner'; // F37 fix Ronde 3
import CurrencySelector from './CurrencySelector'; // Global herpositionering

const API       = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SWIFTNEWS = import.meta.env.VITE_SWIFTNEWS_URL || 'https://news-production-8477.up.railway.app';
const TX_KEY    = 'swiftbridge_transacties';
const ONTV_KEY  = 'swiftbridge_ontvangers';

const STAPPEN = ['Bedrag', 'Betaalmethode', 'Bevestiging', 'Verzonden'];
const SNELLE_BEDRAGEN = [100, 250, 500, 1000, 2000];

// Betaalmethodes — SVG iconen (Sprint 2: emoji-overload weg).
// Type-veld bepaalt welk icon getoond wordt; renderer logica zit in JSX
// (zodat zowel Icon-component als Vlag-component werken).
const BETAALMETHODEN = [
  // ── Aanbevolen (NL klanten) ──
  {
    id:    'ideal',
    label: 'iDEAL',
    iconType: 'icon', Icon: Bank,
    desc:  'Direct via je Nederlandse bank',
    sub:   'Meest gekozen · vanaf 0,8%',
  },
  {
    id:    'creditcard',
    label: 'Credit/Debit kaart',
    iconType: 'icon', Icon: Card,
    desc:  'Visa, Mastercard',
    sub:   'Wereldwijd',
  },
  {
    id:    'paypal',
    label: 'PayPal',
    iconType: 'icon', Icon: Wallet,
    desc:  'Betalen met je PayPal account',
    sub:   'Internationaal',
  },
  {
    id:    'banktransfer',
    label: 'SEPA bankoverboeking',
    iconType: 'icon', Icon: Euro,
    desc:  'Standaard bankoverboeking',
    sub:   '1-2 dagen · goedkoopste optie',
  },
  // ── BE klanten — vlag als logo ──
  {
    id:    'bancontact',
    label: 'Bancontact',
    iconType: 'vlag', land: 'BE',
    desc:  'Direct via Belgische bank',
    sub:   'Voor BE klanten',
  },
  {
    id:    'kbc',
    label: 'KBC/CBC',
    iconType: 'vlag', land: 'BE',
    desc:  'KBC of CBC bank knop',
    sub:   'Belgische banken',
  },
  {
    id:    'belfius',
    label: 'Belfius Pay',
    iconType: 'vlag', land: 'BE',
    desc:  'Belfius bank app',
    sub:   'Voor Belfius klanten',
  },
  // ── UK ──
  {
    id:    'paybybank',
    label: 'Pay By Bank',
    iconType: 'vlag', land: 'GB',
    desc:  'UK Open Banking',
    sub:   'Voor UK klanten',
  },
  // ── B2B ──
  {
    id:    'billie',
    label: 'Billie (factuur)',
    iconType: 'icon', Icon: Globe,
    desc:  'Pay by Invoice voor zakelijk',
    sub:   'Achteraf betalen',
  },
  // ── Nog te activeren ──
  {
    id:    'applepay',
    label: 'Apple Pay',
    iconType: 'icon', Icon: Card,
    desc:  'Activeer eerst in Mollie',
    sub:   'Touch/Face ID',
    disabled: true,
  },
  {
    id:    'klarna',
    label: 'Klarna',
    iconType: 'icon', Icon: Card,
    desc:  'Activeer eerst in Mollie',
    sub:   'Achteraf betalen',
    disabled: true,
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

// ── Emotionele labels voor begunstigden (familie-focus) ───────────────────────
const FAMILIE_LABELS = [
  { id: 'mama',    label: 'Mama',       emoji: '👩‍🦳' },
  { id: 'papa',    label: 'Papa',       emoji: '👨‍🦳' },
  { id: 'oma',     label: 'Oma',        emoji: '👵' },
  { id: 'opa',     label: 'Opa',        emoji: '👴' },
  { id: 'broer',   label: 'Broer',      emoji: '👨' },
  { id: 'zus',     label: 'Zus',        emoji: '👩' },
  { id: 'oom',     label: 'Oom',        emoji: '🧓' },
  { id: 'tante',   label: 'Tante',      emoji: '👩‍🦰' },
  { id: 'partner', label: 'Partner',    emoji: '💑' },
  { id: 'kind',    label: 'Kind',       emoji: '🧒' },
  { id: 'vriend',  label: 'Vriend(in)', emoji: '👥' },
  { id: 'anders',  label: 'Anders',     emoji: '👤' },
];

// ── localStorage helpers ──────────────────────────────────────────────────────
function laadOntvangers() {
  try { return JSON.parse(localStorage.getItem(ONTV_KEY) || '[]'); }
  catch { return []; }
}

function slaOntvangerOp(naam, iban, label = null) {
  const bestaand = laadOntvangers();
  const bestaat  = bestaand.some(o => o.iban === iban);
  if (!bestaat && naam && iban) {
    const bijgewerkt = [{
      naam, iban,
      label: label || null,
      datum: new Date().toISOString(),
      laatsteBedrag: null,
    }, ...bestaand].slice(0, 10);
    localStorage.setItem(ONTV_KEY, JSON.stringify(bijgewerkt));
  }
}

function getLabelInfo(labelId) {
  return FAMILIE_LABELS.find(l => l.id === labelId);
}

function slaTransactieOp(tx) {
  const bestaand = JSON.parse(localStorage.getItem(TX_KEY) || '[]');
  localStorage.setItem(TX_KEY, JSON.stringify([tx, ...bestaand]));
  window.dispatchEvent(new Event('swiftbridge_tx_update'));
}

// ── Beneficiary helper: opslaan via API (best-effort, faalt stil) ────────────
function leesCsrfCookie() {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const m = document.cookie.match(/(?:^|;\s*)sb_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function slaBeneficiaryOpAPI({ token, naam, iban, bank, valuta, bijnaam }) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const csrf = leesCsrfCookie();
    if (csrf) headers['X-CSRF-Token'] = csrf;
    if (token) headers.Authorization = `Bearer ${token}`;
    await fetch(`${API}/beneficiaries`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ naam, iban, bank, valuta, bijnaam: bijnaam || null }),
    });
  } catch (e) {
    // Best-effort — niet fataal voor de transactie
    console.warn('Beneficiary opslaan mislukt:', e?.message);
  }
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
        <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
          {ontvangers.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">
              Nog geen opgeslagen ontvangers
            </p>
          )}
          {ontvangers.map((o, i) => {
            const labelInfo = getLabelInfo(o.label);
            return (
              <button key={i} onClick={() => onKies(o)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition text-left">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                  {labelInfo?.emoji || o.naam[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-800 text-sm">{o.naam}</span>
                    {labelInfo && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                        {labelInfo.label}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">{o.iban.slice(0, 4)} •••• {o.iban.slice(-4)}</div>
                  {o.laatsteBedrag && (
                    <div className="text-xs text-blue-600 font-medium">Vorige: €{o.laatsteBedrag}</div>
                  )}
                </div>
                <span className="text-blue-500">→</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Stap 0: Bedrag ────────────────────────────────────────────────────────────
// ── BeneficiaryAutocomplete (Verbetering WWW) ────────────────────────────
// Input voor ontvanger-naam met live suggesties uit /beneficiaries.
// Op klik op suggestie → vult IBAN + bank + label automatisch in.
// Vereist >=2 karakters om suggesties te tonen.
function BeneficiaryAutocomplete({ token, ontvanger, setOntvanger, setIban, setOntvangerBank, setOntvangerLabel }) {
  const [alle, setAlle] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API}/beneficiaries`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d) setAlle(d.beneficiaries || []); })
      .catch(() => {/* geen autocomplete is OK */});
    return () => { cancelled = true; };
  }, [token]);

  const term = (ontvanger || '').trim().toLowerCase();
  const suggesties = !alle || term.length < 2
    ? []
    : alle.filter(b => {
        const naam = (b.naam || '').toLowerCase();
        const bijnaam = (b.bijnaam || '').toLowerCase();
        return naam.includes(term) || bijnaam.includes(term);
      }).slice(0, 5);

  function kies(b) {
    setOntvanger(b.naam);
    if (b.iban && setIban) setIban(b.iban);
    if (b.bank && setOntvangerBank) setOntvangerBank(b.bank);
    if (b.bijnaam && setOntvangerLabel) setOntvangerLabel(b.bijnaam);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        value={ontvanger}
        onChange={(e) => { setOntvanger(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Mehmet Yilmaz"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
        autoComplete="off"
      />
      {open && suggesties.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {suggesties.map(b => (
            <li key={b.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} /* voorkom blur vóór click */
                onClick={() => kies(b)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 transition border-b border-gray-50 last:border-b-0"
              >
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {(b.naam || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {b.bijnaam || b.naam}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {b.iban?.slice(0, 4)} •••• {b.iban?.slice(-4)} · {b.bank || ''}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StapBedrag({ bedrag, setBedrag, valuta, setValuta, snelheid, setSnelheid, ontvanger, setOntvanger, iban, setIban, liveKoersTry, uitbetaalMethode, setUitbetaalMethode, paparaIdentifier, setPaparaIdentifier, paparaIdentifierType, setPaparaIdentifierType, ontvangerBank, setOntvangerBank, onVolgende, ontvangerLabel, setOntvangerLabel, token, bewaarAlsFavoriet, setBewaarAlsFavoriet }) {
  const [toonOntvangers, setToonOntvangers] = useState(false);
  const ontvangers = laadOntvangers();
  const valutaInfo = getValuta(valuta);
  // Gebruik live TRY koers indien beschikbaar, anders statische koers per valuta
  const effectieveKoers = valuta === 'TRY' && liveKoersTry ? liveKoersTry : valutaInfo.koers;
  const bedragNum = Math.max(0, parseFloat(bedrag) || 0);

  // Pricing met tariefkaart-staffel + verborgen FX (zie services/kosten.js)
  const kosten = berekenKosten(bedragNum, 'ideal', snelheid, effectieveKoers);
  const ontvangenNetto = bedrag && !isNaN(bedrag) ? kosten.ontvangenBedrag : null;

  // Display fee voor Express/Economy preview — gebruikt nu de matrix
  function previewFee(snel) {
    const methodeVoorPreview = snel === 'economy' ? 'sepa' : 'ideal';
    const k = berekenKosten(bedragNum || 100, methodeVoorPreview, snel, effectieveKoers);
    return k.klantBetaaltFee;
  }

  const ibanCheck  = iban.length > 4 ? valideerIBAN(iban) : null;
  const ibanGeldig = !iban || (ibanCheck?.geldig === true);
  const ontvangerInfoOK = uitbetaalMethode === 'papara'
    ? !!paparaIdentifier
    : (iban && ibanCheck?.geldig);
  const kanVolgende = bedrag && !isNaN(bedrag) && parseFloat(bedrag) >= 10 && ontvanger && ontvangerInfoOK;

  return (
    <div className="card-glass p-6 space-y-5 animate-fade-up">
      <h2 className="text-xl font-bold text-gray-800 tracking-tight">💸 Geld overmaken</h2>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Bedrag (EUR)</label>
        <div className="flex items-center border-2 border-blue-500 rounded-xl px-4 py-3 bg-blue-50/50">
          <span className="text-2xl font-bold text-blue-400 mr-2">€</span>
          <input type="number" min="0" max="5000" step="10" inputMode="decimal"
            value={bedrag}
            onChange={e => {
              const v = e.target.value;
              if (v === '' || v === '-') return setBedrag('');
              const n = parseFloat(v);
              if (!isNaN(n)) setBedrag(Math.max(0, n).toString());
            }}
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

      {/* Snelheid keuze: Express vs Economy */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Snelheid</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSnelheid('express')}
            className={`p-3 rounded-xl text-left transition-all active:scale-95 ${
              snelheid === 'express'
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">⚡</span>
              <span className="font-bold text-sm">Express</span>
            </div>
            <div className={`text-[10px] ${snelheid === 'express' ? 'text-blue-100' : 'text-gray-500'}`}>
              &lt;5 min · €{previewFee('express').toFixed(2)}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSnelheid('economy')}
            className={`p-3 rounded-xl text-left transition-all active:scale-95 ${
              snelheid === 'economy'
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">🐢</span>
              <span className="font-bold text-sm">Economy</span>
            </div>
            <div className={`text-[10px] ${snelheid === 'economy' ? 'text-emerald-100' : 'text-gray-500'}`}>
              1-2 dagen · €{previewFee('economy').toFixed(2)} · zeer voordelig
            </div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Ontvanger krijgt in</label>
        <CurrencySelector value={valuta} onChange={setValuta} />
        {valutaInfo.status === 'binnenkort' && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mt-2 text-[11px] text-amber-800 leading-snug">
            <span aria-hidden="true">🔔</span>
            <span>Uitbetaling naar {valutaInfo.land} komt binnenkort. Bereken alvast — je kunt je op de wachtlijst zetten.</span>
          </div>
        )}
      </div>

      {ontvangenNetto !== null && (
        <div
          className="rounded-xl p-4 space-y-3 animate-fade-up"
          style={{
            background: 'linear-gradient(135deg, rgba(219,234,254,0.6), rgba(199,210,254,0.4))',
            border: '1px solid rgba(59,130,246,0.25)',
          }}
        >
          {/* PSD2 transparante kostenweergave — vereist door EU 2019/518 */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">💰 Servicekosten</span>
            <span className="font-mono font-semibold text-gray-800">€{kosten.klantBetaaltFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">💱 Wisselkoers marge ({kosten.fxAfwijkingPct}%)</span>
            <span className="font-mono font-semibold text-gray-800">€{kosten.fxKostenEur.toFixed(2)}</span>
          </div>

          <div className="border-t border-blue-200 pt-2 flex justify-between text-sm font-bold text-rose-700">
            <span>💸 Totale kosten</span>
            <span className="font-mono">€{kosten.totaleKostenEur.toFixed(2)} ({kosten.totaleKostenPct}%)</span>
          </div>

          {/* Mid-market vs gehanteerde koers — PSD2 vereiste */}
          <div className="bg-white/60 rounded-lg p-2 space-y-1 text-[11px] border border-blue-100">
            <div className="flex justify-between text-gray-500">
              <span>Mid-market koers (ECB referentie)</span>
              <span className="font-mono">1 EUR = {kosten.midMarketRate.toLocaleString('nl-NL', { maximumFractionDigits: 4 })}</span>
            </div>
            <div className="flex justify-between text-gray-800 font-semibold">
              <span>Onze koers</span>
              <span className="font-mono">1 EUR = {kosten.appliedRate.toLocaleString('nl-NL', { maximumFractionDigits: 4 })} {valutaInfo.code}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Onze koers wijkt {kosten.fxAfwijkingPct}% af van de ECB referentiekoers
            </div>
          </div>

          <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-blue-700">
            <span>✅ Ontvanger krijgt</span>
            <span className="text-lg font-mono">{formatBedrag(ontvangenNetto, valuta)}</span>
          </div>

          <div className="bg-blue-100/60 rounded-lg px-2 py-1.5 text-[11px] text-blue-700 leading-snug">
            <Vlag land={valutaInfo.landCode} size={14} /> <strong>Dit ziet je ontvanger</strong> op zijn/haar {valutaInfo.land} bankrekening.
          </div>
        </div>
      )}

      {/* Bestaande ontvanger kiezen (uit beneficiaries API) */}
      <BeneficiaryKiezer
        token={token}
        onSelect={(b) => {
          if (b?.naam) setOntvanger(b.naam);
          if (b?.iban) setIban(b.iban);
          if (b?.bank) setOntvangerBank(b.bank);
          if (b?.valuta) setValuta(b.valuta);
          if (b?.bijnaam || b?.label) setOntvangerLabel?.(b.bijnaam || b.label);
        }}
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-600">Naam ontvanger</label>
          {ontvangers.length > 0 && (
            <button onClick={() => setToonOntvangers(true)}
              className="text-xs text-blue-600 font-medium hover:underline">📋 Kies opgeslagen</button>
          )}
        </div>
        <BeneficiaryAutocomplete
          token={token}
          ontvanger={ontvanger}
          setOntvanger={setOntvanger}
          setIban={setIban}
          setOntvangerBank={setOntvangerBank}
          setOntvangerLabel={setOntvangerLabel}
        />

        {/* Bewaar als favoriete ontvanger checkbox */}
        {ontvanger && iban && (
          <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-gray-600 select-none">
            <input
              type="checkbox"
              checked={!!bewaarAlsFavoriet}
              onChange={e => setBewaarAlsFavoriet?.(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            <span>💾 Bewaar als favoriete ontvanger</span>
          </label>
        )}

        {/* Familie label selector */}
        {ontvanger && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Wie is dit voor jou?</p>
            <div className="flex gap-1.5 flex-wrap">
              {FAMILIE_LABELS.map(l => (
                <button key={l.id} type="button"
                  onClick={() => setOntvangerLabel?.(l.id === ontvangerLabel ? null : l.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
                    l.id === ontvangerLabel
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                  }`}>
                  <span>{l.emoji}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Uitbetaal methode toggle: bank vs Papara */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Hoe ontvangt {ontvanger || 'de ontvanger'} het geld?</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setUitbetaalMethode('bank')}
            className={`p-3 rounded-xl text-left transition-all active:scale-95 ${
              uitbetaalMethode === 'bank'
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">🏦</span>
              <span className="font-bold text-sm">Bankrekening</span>
            </div>
            <div className={`text-[10px] ${uitbetaalMethode === 'bank' ? 'text-blue-100' : 'text-gray-500'}`}>
              Garanti, İş Bankası, Ziraat...
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUitbetaalMethode('papara')}
            className={`p-3 rounded-xl text-left transition-all active:scale-95 relative ${
              uitbetaalMethode === 'papara'
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="absolute top-1 right-1 text-[8px] bg-amber-400 text-amber-900 font-bold px-1 rounded">SOON</span>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">💜</span>
              <span className="font-bold text-sm">Papara wallet</span>
            </div>
            <div className={`text-[10px] ${uitbetaalMethode === 'papara' ? 'text-pink-100' : 'text-gray-500'}`}>
              Instant · 18M users in TR
            </div>
          </button>
        </div>
      </div>

      {uitbetaalMethode === 'bank' ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Bank van ontvanger
              {valutaInfo.landCode && LAND_INFO[valutaInfo.landCode] && (
                <span className="text-gray-400 text-xs ml-1">
                  ({LAND_INFO[valutaInfo.landCode].naam})
                </span>
              )}
            </label>
            <select
              value={ontvangerBank}
              onChange={e => setOntvangerBank(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 font-medium"
            >
              {(() => {
                // Bepaal welk land op basis van gekozen valuta
                const landCode = LAND_INFO[valutaInfo.landCode] ? valutaInfo.landCode : 'TR';
                const groups = bankenPerLandPerCategorie(landCode);
                const cats = Object.entries(CATEGORIE_LABELS).sort((a, b) => a[1].volgorde - b[1].volgorde);
                return cats.map(([catKey, catInfo]) => {
                  const banken = (groups[catKey] || []).filter(b => catKey !== 'wallet');
                  if (!banken.length) return null;
                  return (
                    <optgroup key={catKey} label={`${catInfo.icon}  ${catInfo.naam}`}>
                      {banken.map(b => (
                        <option key={b.id} value={b.naam}>{b.naam}</option>
                      ))}
                    </optgroup>
                  );
                });
              })()}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              💡 Banken passen automatisch aan op de gekozen valuta
            </p>
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
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-[11px] text-purple-800 flex items-start gap-1.5">
            <span>🚧</span>
            <span><strong>Coming soon:</strong> Papara wallet uitbetaling is in ontwikkeling (live verwacht Q3 2026). Voor nu kun je het bestellen — wij betalen handmatig uit zodra je transactie gelukt is.</span>
          </div>
          <label className="block text-sm font-medium text-gray-600">Hoe wil je sturen?</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { type: 'papara_nummer', label: 'Papara #', placeholder: 'PL1234567890' },
              { type: 'telefoon',      label: 'Telefoon',  placeholder: '+90...' },
              { type: 'email',         label: 'Email',     placeholder: 'naam@x.com' },
            ].map(opt => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setPaparaIdentifierType(opt.type)}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  paparaIdentifierType === opt.type
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            value={paparaIdentifier}
            onChange={e => setPaparaIdentifier(e.target.value)}
            placeholder={
              paparaIdentifierType === 'papara_nummer' ? 'PL1234567890' :
              paparaIdentifierType === 'telefoon' ? '+905XX1234567' :
              'naam@example.com'
            }
            className="w-full border-2 border-purple-300 rounded-xl px-4 py-3 outline-none font-mono text-sm focus:border-purple-500"
          />
        </div>
      )}

      <button onClick={onVolgende}
        disabled={!kanVolgende}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition">
        Betaalmethode kiezen →
      </button>

      {toonOntvangers && (
        <OntvangerModal
          onKies={o => {
            setOntvanger(o.naam);
            setIban(o.iban);
            setOntvangerLabel?.(o.label || null);
            setToonOntvangers(false);
          }}
          onSluit={() => setToonOntvangers(false)} />
      )}
    </div>
  );
}

// ── Stap 1: Betaalmethode ─────────────────────────────────────────────────────
function StapBetaalmethode({ methode, setMethode, onVolgende, onTerug }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 space-y-5">
      <h2 className="text-xl font-semibold text-gray-900">Kies betaalmethode</h2>
      <div className="space-y-2.5">
        {BETAALMETHODEN.map(m => {
          const selected = methode === m.id;
          const disabled = m.disabled;
          return (
            <label key={m.id}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors ${
                disabled ? 'border border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                : selected ? 'border-2 border-brand-500 bg-brand-50'
                : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'
              }`}>
              <input type="radio" name="methode" value={m.id}
                checked={selected} disabled={disabled}
                onChange={() => !disabled && setMethode(m.id)} className="sr-only" />
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {m.iconType === 'vlag'
                  ? <Vlag land={m.land} size={22} decorative />
                  : <m.Icon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{m.label}</div>
                <div className="text-sm text-gray-500 truncate">{m.desc}</div>
                <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected ? 'border-brand-600 bg-brand-600' : 'border-gray-300'}`}>
                {selected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </label>
          );
        })}
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
function StapBevestiging({ bedrag, valuta, ontvanger, iban, methode, liveKoersTry, laden, fout, emailNietGeverifieerd, resendLaden, resendBericht, resendOk, onResendEmail, onVerstuur, onTerug, notitie, setNotitie }) {
  const { t } = useTaal();
  const valutaInfo = getValuta(valuta);
  const effectieveKoers = valuta === 'TRY' && liveKoersTry ? liveKoersTry : valutaInfo.koers;
  const bedragNum = parseFloat(bedrag) || 0;
  const methodeObj = BETAALMETHODEN.find(m => m.id === methode);
  // PSD2 compliant cost breakdown
  const kosten = berekenKosten(bedragNum, methode || 'ideal', 'express', effectieveKoers);

  return (
    <div className="card-glass p-6 space-y-5 animate-fade-up">
      <h2 className="text-xl font-bold text-gray-800 tracking-tight">✅ Bevestig overmaken</h2>
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        {[
          ['Van',              `€${bedragNum.toFixed(2)}`],
          ['Betaalmethode',    methodeObj?.label || methode],
          ['Naar',             ontvanger],
          ['IBAN',             `${iban.slice(0,4)} •••• ${iban.slice(-4)}`],
          ['Servicekosten',    `€${kosten.klantBetaaltFee.toFixed(2)}`],
          [`Wisselkoers marge (${kosten.fxAfwijkingPct}%)`, `€${kosten.fxKostenEur.toFixed(2)}`],
          ['Totale kosten',    `€${kosten.totaleKostenEur.toFixed(2)} (${kosten.totaleKostenPct}%)`],
          ['Mid-market koers (ECB)', `1 EUR = ${kosten.midMarketRate.toLocaleString('nl-NL', { maximumFractionDigits: 4 })}`],
          ['Onze wisselkoers',  `1 EUR = ${kosten.appliedRate.toLocaleString('nl-NL', { maximumFractionDigits: 4 })} ${valutaInfo.code}`],
          ['Ontvanger krijgt',  formatBedrag(kosten.ontvangenBedrag, valuta)],
          ['Aankomsttijd',      methode === 'ideal' ? '< 5 minuten ⚡' : '1–2 werkdagen'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-gray-500 text-sm">{label}</span>
            <span className="font-semibold text-gray-800 text-sm text-right">{value}</span>
          </div>
        ))}
      </div>

      {fout && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm space-y-2"
        >
          <div>{fout}</div>
          {emailNietGeverifieerd && (
            <div className="border-t border-red-200 pt-2 space-y-2">
              <button
                type="button"
                onClick={onResendEmail}
                disabled={resendLaden}
                className="text-red-700 hover:text-red-900 font-bold underline text-sm disabled:opacity-50"
              >
                {resendLaden
                  ? `⏳ ${t('laden')}`
                  : `📨 ${t('payment_email_resend_link')}`}
              </button>
              {resendBericht && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`text-xs rounded-lg px-2 py-1.5 border ${
                    resendOk
                      ? 'text-green-700 bg-green-50 border-green-200'
                      : 'text-red-700 bg-red-50 border-red-200'
                  }`}
                >
                  {resendOk ? '✅ ' : '⚠️ '}
                  {resendBericht}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VVV — optionele notitie voor eigen administratie */}
      {setNotitie && (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            📝 Persoonlijke notitie <span className="text-gray-400 font-normal">(optioneel, alleen voor jou zichtbaar)</span>
          </label>
          <input
            type="text"
            value={notitie || ''}
            onChange={(e) => setNotitie(e.target.value.slice(0, 200))}
            placeholder="Bv. 'Verjaardag Moeder' of 'Huur juni'"
            maxLength={200}
            className="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="text-[10px] text-gray-400 text-right mt-1">{(notitie || '').length}/200</div>
        </div>
      )}

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

// ── Push opt-in card (Verbetering NN) — toont alleen bij succes-scherm ──────
// Triggered op StapVerzonden zodat we de gebruiker vragen IN context van een
// transactie ("Wil je melding bij aankomst?") ipv apart in Profiel waar het
// makkelijk gemist wordt. Veel hogere acceptance rate.
function PushOptInCard({ token }) {
  const [verborgen, setVerborgen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [resultaat, setResultaat] = useState(null); // null | 'ok' | 'geweigerd' | 'fout'

  useEffect(() => {
    // Verberg als browser niet ondersteunt of al beslist (granted/denied)
    if (typeof window === 'undefined') return;
    const heeftBeslist = sessionStorage.getItem('sb_push_optin_done') === '1';
    if (heeftBeslist) setVerborgen(true);
    // Niet tonen als notif al granted (gebruiker is al actief)
    if ('Notification' in window && Notification.permission === 'granted') {
      setVerborgen(true);
    }
    // Niet tonen als al denied (dan moeten ze handmatig naar settings)
    if ('Notification' in window && Notification.permission === 'denied') {
      setVerborgen(true);
    }
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setVerborgen(true);
    }
  }, []);

  async function jaActiveer() {
    setBezig(true);
    try {
      const { pushInschakelen } = await import('../services/pushNotificatie');
      await pushInschakelen(token);
      setResultaat('ok');
    } catch (err) {
      setResultaat(err?.message?.includes('geweigerd') ? 'geweigerd' : 'fout');
    } finally {
      setBezig(false);
      try { sessionStorage.setItem('sb_push_optin_done', '1'); } catch {/* ignored */}
    }
  }

  function neeBedankt() {
    setVerborgen(true);
    try { sessionStorage.setItem('sb_push_optin_done', '1'); } catch {/* ignored */}
  }

  if (verborgen) return null;
  if (resultaat === 'ok') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 flex items-center gap-2">
        <span aria-hidden="true">✓</span>
        Notificaties aangezet — je krijgt bericht bij aankomst.
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-left">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-blue-900 text-sm">Krijg bericht bij aankomst?</p>
          <p className="text-xs text-blue-800 mt-0.5">
            We sturen één korte notificatie wanneer het geld is aangekomen op de Turkse rekening.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={jaActiveer}
          disabled={bezig}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition"
        >
          {bezig ? 'Bezig…' : 'Ja, graag'}
        </button>
        <button
          onClick={neeBedankt}
          className="text-xs font-semibold text-gray-600 hover:text-gray-800 px-3 py-2"
        >
          Nee, dank je
        </button>
      </div>
      {resultaat === 'geweigerd' && (
        <p className="text-[11px] text-amber-700 mt-2">Je hebt toestemming geweigerd. Aanpassen kan in je browserinstellingen.</p>
      )}
      {resultaat === 'fout' && (
        <p className="text-[11px] text-red-700 mt-2">Activeren mislukt. Probeer het later opnieuw via Alerts.</p>
      )}
    </div>
  );
}

// ── Tracking-link share card (Verbetering OO) ────────────────────────────────
// Toont copy + WhatsApp share knoppen voor publieke /tx/:token URL.
// Veilig: link bevat geen PII, alleen status-info voor ontvanger.
function TrackingShareCard({ trackingToken }) {
  const [gekopieerd, setGekopieerd] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const trackUrl = `${origin}/tx/${trackingToken}`;

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(trackUrl);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2500);
    } catch {
      window.prompt('Kopieer deze link:', trackUrl);
    }
  }

  function deelWhatsApp() {
    const text = `Hier kan je het geld volgen: ${trackUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  async function deelNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SwiftBridge transactie',
          text: 'Hier kan je de status van de overboeking volgen',
          url: trackUrl,
        });
      } catch (e) { if (e.name !== 'AbortError') kopieer(); }
    } else {
      kopieer();
    }
  }

  return (
    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 text-left space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">🔗</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-indigo-900 text-sm">Deel tracking-link met ontvanger</p>
          <p className="text-xs text-indigo-800 mt-0.5">
            Ze kunnen status volgen zonder account — geen persoonsgegevens zichtbaar.
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg px-3 py-2 text-xs font-mono text-gray-700 truncate">
        {trackUrl}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={kopieer}
          className="text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg py-2.5 transition"
        >
          {gekopieerd ? '✓ Gekopieerd' : '📋 Kopieer'}
        </button>
        <button
          onClick={deelWhatsApp}
          className="text-xs font-bold text-white bg-[#25D366] hover:bg-[#1ebe57] rounded-lg py-2.5 transition"
        >
          WhatsApp
        </button>
        <button
          onClick={deelNative}
          className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg py-2.5 transition"
        >
          🔗 Delen
        </button>
      </div>
    </div>
  );
}

// ── Stap 3: Verzonden ─────────────────────────────────────────────────────────
function StapVerzonden({ transactie, methode, onNieuw, token }) {
  const methodeObj = BETAALMETHODEN.find(m => m.id === methode);
  const valuta = transactie?.valuta || 'TRY';
  const valutaInfo = getValuta(valuta);
  const ontvangenBedrag = transactie?.ontvangenBedrag ?? transactie?.tryBedrag ?? 0;
  return (
    <div className="card-glass p-6 text-center space-y-5 animate-fade-up">
      <div className="text-6xl">🎉</div>
      <h2 className="text-2xl font-bold text-emerald-600 tracking-tight">Geld onderweg!</h2>
      <p className="text-gray-500 text-sm">
        {methode === 'ideal'
          ? `Je iDEAL betaling is verwerkt. Het geld is binnen 5 minuten op de rekening in ${valutaInfo.land}.`
          : `Je SEPA overboeking is geregistreerd. Na ontvangst sturen we het geld door naar ${valutaInfo.land}.`}
      </p>
      <div
        className="rounded-xl p-4 space-y-2 text-left"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
          border: '1px solid rgba(16,185,129,0.25)',
        }}
      >
        {[
          ['Verstuurd',        `€${transactie?.eurBedrag?.toFixed(2)}`],
          ['Ontvanger krijgt', `${valutaInfo.vlag} ${formatBedrag(ontvangenBedrag, valuta)}`],
          ['Methode',          methodeObj?.label || methode],
          ['Transactie ID',    transactie?.id?.slice(0,16) + '…'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-bold text-gray-800 font-mono">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Je ontvangt een bevestiging per e-mail. De transactie is zichtbaar in je dashboard.
      </p>

      {/* Tracking-link share (Verbetering OO) — alleen als trackingToken aanwezig is */}
      {transactie?.trackingToken && (
        <TrackingShareCard trackingToken={transactie.trackingToken} />
      )}

      {/* Push opt-in (Verbetering NN) — alleen tonen als browser ondersteunt en niet al beslist */}
      <PushOptInCard token={token} />

      <button onClick={onNieuw} className="btn-primary w-full py-3">
        Nieuwe overschrijving
      </button>
    </div>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function PaymentFlow({ token }) {
  const { t } = useTaal();
  const [stap,           setStap          ] = useState(0);
  const [bedrag,         setBedrag        ] = useState('500');
  const [valuta,         setValuta        ] = useState('TRY');
  const [snelheid,       setSnelheid      ] = useState('express'); // express | economy
  const [ontvanger,      setOntvanger     ] = useState('');
  const [ontvangerLabel, setOntvangerLabel] = useState(null);
  const [iban,           setIban          ] = useState('');
  const [uitbetaalMethode,    setUitbetaalMethode]    = useState('bank'); // bank | papara
  const [paparaIdentifier,    setPaparaIdentifier]    = useState('');
  const [paparaIdentifierType,setPaparaIdentifierType]= useState('papara_nummer'); // papara_nummer | telefoon | email
  const [methode,        setMethode       ] = useState('ideal'); // iDEAL default — meest gebruikt in NL
  const [notitie,        setNotitie       ] = useState(''); // VVV — persoonlijke notitie per transactie
  const [ontvangerBank,  setOntvangerBank ] = useState('Ziraat Bankası');
  const [liveKoersTry,   setLiveKoersTry  ] = useState(null);
  const [transactie,     setTransactie    ] = useState(null);
  const [laden,          setLaden         ] = useState(false);
  const [fout,           setFout          ] = useState('');
  const [bewaarAlsFavoriet, setBewaarAlsFavoriet] = useState(false);
  // Email verificatie — bij EMAIL_NIET_GEVERIFIEERD tonen we een resend-link
  const [emailNietGeverifieerd, setEmailNietGeverifieerd] = useState(false);
  const [resendLaden,     setResendLaden    ] = useState(false);
  const [resendBericht,   setResendBericht  ] = useState('');
  const [resendOk,        setResendOk       ] = useState(false);

  useEffect(() => {
    fetch(`${SWIFTNEWS}/api/forex`)
      .then(r => r.json())
      .then(j => { if (j.rate) setLiveKoersTry(j.rate); })
      .catch(() => {});

    // Repeat transactie: pre-fill velden vanuit localStorage
    try {
      const repeatRaw = localStorage.getItem('swiftbridge_repeat_tx');
      if (repeatRaw) {
        const r = JSON.parse(repeatRaw);
        if (r.ontvanger)   setOntvanger(r.ontvanger);
        if (r.iban)        setIban(r.iban);
        if (r.bedrag)      setBedrag(String(r.bedrag));
        if (r.valuta)      setValuta(r.valuta);
        localStorage.removeItem('swiftbridge_repeat_tx');
        return; // niet ook draft laden
      }
    } catch {/* private mode */}

    // SSS+F42 (Cursor review Ronde 3): laad concept als die bestaat.
    // BELANGRIJK: draft bevat GEEN IBAN of ontvanger-naam meer — die
    // zijn PII en mochten zichtbaar worden voor de volgende gebruiker
    // op een gedeeld apparaat (familie-PC, internetcafé). Alleen niet-
    // gevoelige UI-state (bedrag/valuta/methode/snelheid) wordt herstelt.
    // Plus: sessionStorage ipv localStorage — tab-close = wis.
    try {
      const draftRaw = sessionStorage.getItem('swiftbridge_payment_draft_v2');
      if (draftRaw) {
        const d = JSON.parse(draftRaw);
        // Alleen herstellen als draft <24u oud is — anders mogelijk verouderd
        const ouderdom = Date.now() - (d.opgeslagen_op || 0);
        if (ouderdom < 24 * 60 * 60 * 1000) {
          // Geen window.confirm meer — silent restore want geen PII
          if (d.bedrag)    setBedrag(String(d.bedrag));
          if (d.valuta)    setValuta(d.valuta);
          if (d.methode)   setMethode(d.methode);
          if (d.snelheid)  setSnelheid(d.snelheid);
        } else {
          sessionStorage.removeItem('swiftbridge_payment_draft_v2');
        }
      }
      // Cleanup oude PII-bevattende draft uit localStorage (migratie van v1)
      localStorage.removeItem('swiftbridge_payment_draft');
    } catch {/* skip */}
  }, []);

  // SSS+F42: auto-save draft bij elke wijziging van NIET-PII velden.
  // IBAN + ontvanger-naam worden NIET meer opgeslagen.
  useEffect(() => {
    // Alleen opslaan als minstens iets is ingevuld
    if (!bedrag) return;
    // Niet opslaan tijdens stap 3 (verzonden) — flow is dan klaar
    if (stap === 3) return;
    try {
      sessionStorage.setItem('swiftbridge_payment_draft_v2', JSON.stringify({
        bedrag, valuta, methode, snelheid,
        opgeslagen_op: Date.now(),
      }));
    } catch {/* private mode */}
  }, [bedrag, valuta, methode, snelheid, stap]);

  // SSS+F42: wis draft na succesvolle transactie (stap 3 = verzonden)
  useEffect(() => {
    if (stap === 3) {
      try {
        sessionStorage.removeItem('swiftbridge_payment_draft_v2');
        localStorage.removeItem('swiftbridge_payment_draft'); // legacy
      } catch {/* skip */}
    }
  }, [stap]);

  // Reset bank wanneer valuta verandert (bv USD -> TRY: ander land = andere banken)
  useEffect(() => {
    const vInfo = getValuta(valuta);
    const landCode = LAND_INFO[vInfo.landCode] ? vInfo.landCode : 'TR';
    const banken = bankenPerLand(landCode).filter(b => b.categorie !== 'wallet');
    if (banken.length && !banken.find(b => b.naam === ontvangerBank)) {
      setOntvangerBank(banken[0].naam); // default eerste bank van het nieuwe land
    }
  }, [valuta]);

  async function verstuurEmailOpnieuw() {
    setResendLaden(true);
    setResendBericht('');
    setResendOk(false);
    try {
      const data = await apiFetch('/auth/verifieer-email/opnieuw-sturen', {
        method: 'POST',
        body: {},
      });
      setResendOk(true);
      setResendBericht(data?.bericht || t('verify_email_resend_succes'));
    } catch (e) {
      if (e.status === 429) {
        setResendBericht(t('verify_email_resend_rate_limit'));
      } else {
        setResendBericht(parseError(e, t));
      }
    } finally {
      setResendLaden(false);
    }
  }

  async function verstuur() {
    setLaden(true);
    setFout('');
    setEmailNietGeverifieerd(false);
    setResendBericht('');
    setResendOk(false);

    // Genereer een idempotency key per poging — voorkomt dubbele transacties bij retry
    const idempotencyKey = (window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`);

    try {
      const res = await fetch(`${API}/transactions`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          eurBedrag: parseFloat(bedrag),
          ontvangerNaam: ontvanger,
          ontvangerIBAN: uitbetaalMethode === 'bank' ? iban : null,
          ontvangerBank: ontvangerBank,
          methode,
          valuta,
          snelheid,
          uitbetaalMethode,
          paparaIdentifier: uitbetaalMethode === 'papara' ? paparaIdentifier : null,
          paparaIdentifierType: uitbetaalMethode === 'papara' ? paparaIdentifierType : null,
        }),
      });

      // Lees het antwoord
      const data = await res.json().catch(() => ({}));

      // FOUT — geen succes tonen, gebruiker terug naar bevestigingsscherm met fout
      if (!res.ok) {
        const code = data?.errorCode || data?.code;
        if (code === 'EMAIL_NIET_GEVERIFIEERD') {
          setEmailNietGeverifieerd(true);
        }
        setFout(parseError({ ...data, status: res.status }, t));
        return; // Belangrijk: NIET doorgaan naar succes scherm
      }

      // Server transactie gelukt — gebruik server data, niet lokale berekening
      if (!data.transactie?.id) {
        setFout(parseError({ errorCode: 'SERVER_ERROR' }, t));
        return;
      }

      // VVV — als gebruiker een notitie heeft ingevuld, PATCH naar backend.
      // Best-effort: faalt niet de transactie.
      if (notitie && notitie.trim()) {
        fetch(`${API}/transactions/${data.transactie.id}/notitie`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ notitie: notitie.trim() }),
        }).catch(err => console.warn('Notitie opslaan faalde:', err.message));
      }

      // Bereken ontvangen bedrag in gekozen valuta
      const valutaInfo = getValuta(valuta);
      const effectieveKoers = valuta === 'TRY' && liveKoersTry ? liveKoersTry : valutaInfo.koers;
      const eurNetto = data.transactie.eurBedrag * 0.978;
      const ontvangenBedrag = eurNetto * effectieveKoers;

      // ── Start Mollie betaling — krijg checkoutUrl en redirect gebruiker ──
      try {
        const betalingRes = await fetch(`${API}/payments/start`, {
        credentials: 'include',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            transactieId: data.transactie.id,
            methode,
          }),
        });
        const betalingData = await betalingRes.json();
        if (betalingRes.ok && betalingData.checkoutUrl) {
          // Bewaar transactie lokaal vóór redirect
          slaTransactieOp({
            id: data.transactie.id,
            eurBedrag: data.transactie.eurBedrag,
            tryBedrag: data.transactie.tryBedrag,
            valuta,
            ontvangenBedrag,
            feeEur: data.transactie.feeEur,
            wisselKoers: effectieveKoers,
            ontvangerNaam: data.transactie.ontvangerNaam,
            ontvangerIBAN: iban,
            methode,
            status: 'wacht_op_betaling',
            datum: new Date().toISOString(),
          });
          slaOntvangerOp(ontvanger, iban, ontvangerLabel);
          if (bewaarAlsFavoriet && uitbetaalMethode === 'bank' && iban) {
            await slaBeneficiaryOpAPI({ token, naam: ontvanger, iban, bank: ontvangerBank, valuta, bijnaam: ontvangerLabel });
          }

          // Redirect naar Mollie checkout
          window.location.href = betalingData.checkoutUrl;
          return;
        }
        // Als betaling niet kon worden gestart, val terug op simulatie modus
        console.warn('Mollie betaling kon niet worden gestart, val terug op demo modus');
      } catch (e) {
        console.warn('Mollie niet beschikbaar, demo modus:', e.message);
      }

      const tx = {
        id: data.transactie.id,
        eurBedrag: data.transactie.eurBedrag,
        tryBedrag: data.transactie.tryBedrag,
        valuta,
        ontvangenBedrag,
        feeEur: data.transactie.feeEur,
        wisselKoers: effectieveKoers,
        ontvangerNaam: data.transactie.ontvangerNaam,
        ontvangerIBAN: iban,
        methode,
        status: data.transactie.status, // 'in_behandeling' van server
        datum: new Date().toISOString(),
      };

      slaTransactieOp(tx);
      slaOntvangerOp(ontvanger, iban, ontvangerLabel);
      if (bewaarAlsFavoriet && uitbetaalMethode === 'bank' && iban) {
        await slaBeneficiaryOpAPI({ token, naam: ontvanger, iban, bank: ontvangerBank, valuta, bijnaam: ontvangerLabel });
      }
      setTransactie(tx);

      await stuurPushNotificatie(
        '✅ SwiftBridge — Betaling verstuurd!',
        `€${tx.eurBedrag.toFixed(2)} → ${formatBedrag(ontvangenBedrag, valuta)} voor ${ontvanger}`
      );

      setStap(3);
    } catch (e) {
      // Netwerk fout of timeout — parseError zorgt voor i18n vertaling
      setFout(parseError(e, t));
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
      {/* F37: simulatie-banner zolang EMI-partner-integratie niet live */}
      <SimulatieBanner />

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

      {stap === 0 && <StapBedrag token={token} bewaarAlsFavoriet={bewaarAlsFavoriet} setBewaarAlsFavoriet={setBewaarAlsFavoriet} bedrag={bedrag} setBedrag={setBedrag} valuta={valuta} setValuta={setValuta} snelheid={snelheid} setSnelheid={setSnelheid} ontvanger={ontvanger} setOntvanger={setOntvanger} ontvangerLabel={ontvangerLabel} setOntvangerLabel={setOntvangerLabel} iban={iban} setIban={setIban} liveKoersTry={liveKoersTry} uitbetaalMethode={uitbetaalMethode} setUitbetaalMethode={setUitbetaalMethode} paparaIdentifier={paparaIdentifier} setPaparaIdentifier={setPaparaIdentifier} paparaIdentifierType={paparaIdentifierType} setPaparaIdentifierType={setPaparaIdentifierType} ontvangerBank={ontvangerBank} setOntvangerBank={setOntvangerBank} onVolgende={() => setStap(1)} />}
      {stap === 1 && <StapBetaalmethode methode={methode} setMethode={setMethode} onVolgende={() => setStap(2)} onTerug={() => setStap(0)} />}
      {stap === 2 && <StapBevestiging bedrag={bedrag} valuta={valuta} ontvanger={ontvanger} iban={iban} methode={methode} liveKoersTry={liveKoersTry} laden={laden} fout={fout} emailNietGeverifieerd={emailNietGeverifieerd} resendLaden={resendLaden} resendBericht={resendBericht} resendOk={resendOk} onResendEmail={verstuurEmailOpnieuw} onVerstuur={verstuur} onTerug={() => setStap(1)} notitie={notitie} setNotitie={setNotitie} />}
      {stap === 3 && <StapVerzonden transactie={transactie} methode={methode} onNieuw={reset} token={token} />}

      {/* PaymentLoadingOverlay (Verbetering W) — full-screen feedback tijdens
          de transactie-aanmaak → Mollie payment-start → redirect sequence.
          Voorkomt verwarring tijdens 1-4s wachttijd, plus blokkeert dubbele klik. */}
      <PaymentLoadingOverlay open={laden && stap === 2} />
    </div>
  );
}
