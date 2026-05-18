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
import { parseError } from '../services/api';
import { useTaal } from '../i18n';
import Vlag from './Vlag';
import { TR_BANKEN_COMPLEET, CATEGORIE_LABELS, bankenPerCategorie } from '../services/trBanken';
import { bankenPerLand, bankenPerLandPerCategorie, LAND_INFO } from '../services/turkstaligeBanken';

const API       = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SWIFTNEWS = import.meta.env.VITE_SWIFTNEWS_URL || 'https://news-production-8477.up.railway.app';
const TX_KEY    = 'swiftbridge_transacties';
const ONTV_KEY  = 'swiftbridge_ontvangers';

const STAPPEN = ['Bedrag', 'Betaalmethode', 'Bevestiging', 'Verzonden'];
const SNELLE_BEDRAGEN = [100, 250, 500, 1000, 2000];

const BETAALMETHODEN = [
  // ── Aanbevolen (NL klanten) ──
  {
    id:    'ideal',
    label: 'iDEAL',
    icon:  '🏦',
    desc:  'Direct via je Nederlandse bank',
    sub:   '⭐ Meest gekozen · vanaf 0,8%',
    kleur: 'border-blue-500 bg-blue-50',
  },
  {
    id:    'creditcard',
    label: 'Credit/Debit kaart',
    icon:  '💳',
    desc:  'Visa, Mastercard',
    sub:   'Wereldwijd · 1,8% extra',
    kleur: 'border-indigo-500 bg-indigo-50',
  },
  {
    id:    'paypal',
    label: 'PayPal',
    icon:  '💙',
    desc:  'Betalen met je PayPal account',
    sub:   'Internationaal',
    kleur: 'border-sky-500 bg-sky-50',
  },
  {
    id:    'banktransfer',
    label: 'SEPA bankoverboeking',
    icon:  '🏛️',
    desc:  'Standaard bankoverboeking',
    sub:   '1-2 dagen · goedkoopste optie',
    kleur: 'border-emerald-500 bg-emerald-50',
  },
  // ── BE klanten ──
  {
    id:    'bancontact',
    label: 'Bancontact',
    icon:  '🇧🇪',
    desc:  'Direct via Belgische bank',
    sub:   'Voor BE klanten',
    kleur: 'border-yellow-500 bg-yellow-50',
  },
  {
    id:    'kbc',
    label: 'KBC/CBC',
    icon:  '🇧🇪',
    desc:  'KBC of CBC bank knop',
    sub:   'Belgische banken',
    kleur: 'border-yellow-500 bg-yellow-50',
  },
  {
    id:    'belfius',
    label: 'Belfius Pay',
    icon:  '🇧🇪',
    desc:  'Belfius bank app',
    sub:   'Voor Belfius klanten',
    kleur: 'border-purple-500 bg-purple-50',
  },
  // ── UK ──
  {
    id:    'paybybank',
    label: 'Pay By Bank',
    icon:  '🇬🇧',
    desc:  'UK Open Banking',
    sub:   'Voor UK klanten',
    kleur: 'border-blue-500 bg-blue-50',
  },
  // ── B2B ──
  {
    id:    'billie',
    label: 'Billie (factuur)',
    icon:  '📄',
    desc:  'Pay by Invoice voor zakelijk',
    sub:   'Achteraf betalen',
    kleur: 'border-rose-500 bg-rose-50',
  },
  // ── Nog te activeren ──
  {
    id:    'applepay',
    label: 'Apple Pay',
    icon:  '🍎',
    desc:  '⚠️ Activeer eerst in Mollie',
    sub:   'Touch/Face ID',
    kleur: 'border-gray-300 bg-gray-50 opacity-60',
  },
  {
    id:    'klarna',
    label: 'Klarna',
    icon:  '🛍️',
    desc:  '⚠️ Activeer eerst in Mollie',
    sub:   'Achteraf betalen',
    kleur: 'border-gray-300 bg-gray-50 opacity-60',
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
function StapBedrag({ bedrag, setBedrag, valuta, setValuta, snelheid, setSnelheid, ontvanger, setOntvanger, iban, setIban, liveKoersTry, uitbetaalMethode, setUitbetaalMethode, paparaIdentifier, setPaparaIdentifier, paparaIdentifierType, setPaparaIdentifierType, ontvangerBank, setOntvangerBank, onVolgende, ontvangerLabel, setOntvangerLabel }) {
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
        <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto">
          {VALUTAS.map(v => (
            <button
              key={v.code}
              type="button"
              onClick={() => setValuta(v.code)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                valuta === v.code
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={`${v.naam} (${v.land})`}
            >
              <Vlag land={v.landCode} size={20} />
              <span className="text-[10px] mt-0.5">{v.code}</span>
            </button>
          ))}
        </div>
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
function StapBevestiging({ bedrag, valuta, ontvanger, iban, methode, liveKoersTry, laden, fout, onVerstuur, onTerug }) {
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
          ['Betaalmethode',    `${methodeObj?.icon} ${methodeObj?.label}`],
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
          ['Methode',          `${methodeObj?.icon} ${methodeObj?.label}`],
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
  const [ontvangerBank,  setOntvangerBank ] = useState('Ziraat Bankası');
  const [liveKoersTry,   setLiveKoersTry  ] = useState(null);
  const [transactie,     setTransactie    ] = useState(null);
  const [laden,          setLaden         ] = useState(false);
  const [fout,           setFout          ] = useState('');

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
      }
    } catch {}
  }, []);

  // Reset bank wanneer valuta verandert (bv USD -> TRY: ander land = andere banken)
  useEffect(() => {
    const vInfo = getValuta(valuta);
    const landCode = LAND_INFO[vInfo.landCode] ? vInfo.landCode : 'TR';
    const banken = bankenPerLand(landCode).filter(b => b.categorie !== 'wallet');
    if (banken.length && !banken.find(b => b.naam === ontvangerBank)) {
      setOntvangerBank(banken[0].naam); // default eerste bank van het nieuwe land
    }
  }, [valuta]);

  async function verstuur() {
    setLaden(true);
    setFout('');

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
        setFout(parseError({ ...data, status: res.status }, t));
        return; // Belangrijk: NIET doorgaan naar succes scherm
      }

      // Server transactie gelukt — gebruik server data, niet lokale berekening
      if (!data.transactie?.id) {
        setFout(parseError({ errorCode: 'SERVER_ERROR' }, t));
        return;
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

      {stap === 0 && <StapBedrag bedrag={bedrag} setBedrag={setBedrag} valuta={valuta} setValuta={setValuta} snelheid={snelheid} setSnelheid={setSnelheid} ontvanger={ontvanger} setOntvanger={setOntvanger} ontvangerLabel={ontvangerLabel} setOntvangerLabel={setOntvangerLabel} iban={iban} setIban={setIban} liveKoersTry={liveKoersTry} uitbetaalMethode={uitbetaalMethode} setUitbetaalMethode={setUitbetaalMethode} paparaIdentifier={paparaIdentifier} setPaparaIdentifier={setPaparaIdentifier} paparaIdentifierType={paparaIdentifierType} setPaparaIdentifierType={setPaparaIdentifierType} ontvangerBank={ontvangerBank} setOntvangerBank={setOntvangerBank} onVolgende={() => setStap(1)} />}
      {stap === 1 && <StapBetaalmethode methode={methode} setMethode={setMethode} onVolgende={() => setStap(2)} onTerug={() => setStap(0)} />}
      {stap === 2 && <StapBevestiging bedrag={bedrag} valuta={valuta} ontvanger={ontvanger} iban={iban} methode={methode} liveKoersTry={liveKoersTry} laden={laden} fout={fout} onVerstuur={verstuur} onTerug={() => setStap(1)} />}
      {stap === 3 && <StapVerzonden transactie={transactie} methode={methode} onNieuw={reset} />}
    </div>
  );
}
