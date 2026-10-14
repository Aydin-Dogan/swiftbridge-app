/**
 * PaymentFlow.jsx — Verbeterde betaalflow
 * - iDEAL + SEPA keuze
 * - Multi-currency: TRY, AZN, KZT, UZS, TMT, KGS, USD, GBP, EUR, MAD
 * - Snelle bedragknoppen
 * - Opgeslagen ontvangers (server, /beneficiaries; de server bewaart ze zelf na
 *   een geslaagde betaling — aanmeldroute punt 11). Geen vinkje "Bewaar als
 *   favoriete ontvanger" meer, wel een optionele bijnaam (services/ontvangerBijnaam)
 * - "Snel opnieuw": klaargezette ontvanger + bank + bedrag → meteen bevestigen
 * - Laatst gebruikte betaalmethode voorgekozen (alleen de naam, op dit toestel)
 * - Transactie opslaan + dashboard notificatie
 * - Browser push notificatie na voltooiing
 */
import { useState, useEffect, useRef } from 'react';
import { VALUTAS, getValuta, formatBedrag } from '../services/currencies';
import { berekenKosten, prijsopbouw, welkomstDealActief, MIN_BEDRAG } from '../services/kosten';
import { apiFetch, parseError } from '../services/api';
import { useTaal } from '../i18n';
import Vlag from './Vlag';
import { TR_BANKEN_COMPLEET, CATEGORIE_LABELS, bankenPerCategorie } from '../services/trBanken';
import { bankenPerLand, bankenPerLandPerCategorie, LAND_INFO } from '../services/turkstaligeBanken';
import BeneficiaryKiezer from './beneficiaries/BeneficiaryKiezer';
import { Bank, Card, Wallet, Zap, Clock, Bell, Check, X, Send, Sparkles, AlertTriangle } from './icons/Icons';
import PaymentLoadingOverlay from './payment/PaymentLoadingOverlay';
import SimulatieBanner from './SimulatieBanner'; // F37 fix Ronde 3
import CurrencySelector from './CurrencySelector'; // Global herpositionering
import WachtlijstModal from './WachtlijstModal'; // WL-2: binnenkort-corridor opt-in
import { useFavorieteValutas } from '../services/favorieteValutas'; // MMM
import AppLockScherm from './pin/AppLockScherm'; // PIN-1: tx-confirm
import TransactieDoel from './opdrachten/TransactieDoel'; // TX-DOEL: doel van de uitgave
import ZinMetLinks from './ZinMetLinks'; // Juridische documenten v1.0: contextlinks
import { methodeKanNu, geldigeMethode } from '../services/betaalmethodes'; // alleen wat de server aanneemt
import { startBetaling, doorsturenNaar } from '../services/betaalStart'; // geen vals "gelukt" meer
import { haalOpnieuwKlaar } from '../services/opnieuwVersturen'; // "Snel opnieuw" / "Opnieuw versturen"
import { leesLaatsteBetaalmethode, bewaarLaatsteBetaalmethode } from '../services/laatsteBetaalmethode';
import { bewaarBijnaam, BIJNAAM_MAX } from '../services/ontvangerBijnaam';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SWIFTNEWS = import.meta.env.VITE_SWIFTNEWS_URL || 'https://news-production-8477.up.railway.app';
const TX_KEY = 'swiftbridge_transacties';
const ONTV_KEY = 'swiftbridge_ontvangers';

const STAPPEN = ['Bedrag', 'Betaalmethode', 'Bevestiging', 'Verzonden'];
const SNELLE_BEDRAGEN = [100, 250, 500, 1000, 2000];

// Betaalmethodes — SVG iconen (Sprint 2: emoji-overload weg).
// Type-veld bepaalt welk icon getoond wordt; renderer logica zit in JSX
// (zodat zowel Icon-component als Vlag-component werken).
// Alleen methodes die de server aanneemt (services/betaalmethodes.js). PayPal,
// SEPA bankoverboeking, KBC/CBC, Belfius, Pay By Bank en Billie stonden hier
// ook; de server weigerde ze pas na "Bevestigen & betalen" (analyse
// aanmeldroute 13-10-2026). Of een methode nu kan, bepaalt methodeKanNu met de
// lijst die GET /payments/methodes teruggeeft.
const BETAALMETHODEN = [
  // ── Aanbevolen (NL klanten) ──
  {
    id: 'ideal',
    label: 'iDEAL',
    iconType: 'icon', Icon: Bank,
    desc: 'Direct via je Nederlandse bank',
    sub: 'Meest gekozen',
  },
  {
    id: 'creditcard',
    label: 'Credit/Debit kaart',
    iconType: 'icon', Icon: Card,
    desc: 'Visa, Mastercard',
    sub: 'Wereldwijd',
  },
  // ── BE klanten — vlag als logo ──
  {
    id: 'bancontact',
    label: 'Bancontact',
    iconType: 'vlag', land: 'BE',
    desc: 'Direct via Belgische bank',
    sub: 'Voor BE klanten',
  },
  // ── Alleen als ze bij Mollie aan staan ──
  {
    id: 'applepay',
    label: 'Apple Pay',
    iconType: 'icon', Icon: Card,
    desc: 'Touch/Face ID',
    sub: '',
  },
  {
    id: 'klarna',
    label: 'Klarna',
    iconType: 'icon', Icon: Card,
    desc: 'Achteraf betalen',
    sub: '',
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
  { id: 'mama', label: 'Mama' },
  { id: 'papa', label: 'Papa' },
  { id: 'oma', label: 'Oma' },
  { id: 'opa', label: 'Opa' },
  { id: 'broer', label: 'Broer' },
  { id: 'zus', label: 'Zus' },
  { id: 'oom', label: 'Oom' },
  { id: 'tante', label: 'Tante' },
  { id: 'partner', label: 'Partner' },
  { id: 'kind', label: 'Kind' },
  { id: 'vriend', label: 'Vriend(in)' },
  { id: 'anders', label: 'Anders' },
];

// ── localStorage helpers ──────────────────────────────────────────────────────
// Oude lijst "Kies opgeslagen" (naam + IBAN op het toestel). Sinds aanmeldroute
// punt 11 (13-10-2026) schrijven we hier niets meer bij: ontvangers staan op de
// server (de server bewaart ze na een geslaagde betaling) en bankgegevens horen
// niet in localStorage. Wat er nog staat, toont "Kies opgeslagen" tot de
// volgende keer uitloggen (App.jsx wist de sleutel dan).
function laadOntvangers() {
  try { return JSON.parse(localStorage.getItem(ONTV_KEY) || '[]'); }
  catch { return []; }
}

function getLabelInfo(labelId) {
  return FAMILIE_LABELS.find(l => l.id === labelId);
}

// Transactie-cache op het toestel (terugval van het overzicht als de server even
// niet antwoordt). Zonder IBAN: die staat op de server (aanmeldroute punt 11).
function slaTransactieOp(tx) {
  const bestaand = JSON.parse(localStorage.getItem(TX_KEY) || '[]');
  localStorage.setItem(TX_KEY, JSON.stringify([tx, ...bestaand]));
  window.dispatchEvent(new Event('swiftbridge_tx_update'));
}

// ── Ontvanger modal ───────────────────────────────────────────────────────────
function OntvangerModal({ onKies, onSluit }) {
  const ontvangers = laadOntvangers();
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-surface border border-border rounded-md shadow-soft w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h3 className="font-display font-medium text-ink-1">Kies ontvanger</h3>
          <button onClick={onSluit} className="text-gray-400 hover:text-ink-2" aria-label="Sluiten"><X className="w-5 h-5" /></button>
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
                className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-brand-50 transition text-left">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center font-display text-lg font-medium text-brand-700 flex-shrink-0">
                  {o.naam[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-ink-1 text-sm">{o.naam}</span>
                    {labelInfo && (
                      <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-semibold">
                        {labelInfo.label}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">{o.iban.slice(0, 4)} •••• {o.iban.slice(-4)}</div>
                  {o.laatsteBedrag && (
                    <div className="text-xs text-brand-700 font-medium">Vorige: €{o.laatsteBedrag}</div>
                  )}
                </div>
                <span className="text-brand-500">→</span>
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
        className="w-full border border-border rounded-md px-4 py-3 outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
        autoComplete="off"
      />
      {open && suggesties.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-soft max-h-64 overflow-y-auto">
          {suggesties.map(b => (
            <li key={b.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} /* voorkom blur vóór click */
                onClick={() => kies(b)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-50 transition border-b border-border-subtle last:border-b-0"
              >
                <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {(b.naam || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-1 truncate">
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

function StapBedrag({ bedrag, setBedrag, valuta, setValuta, snelheid, setSnelheid, ontvanger, setOntvanger, iban, setIban, liveKoersTry, uitbetaalMethode, setUitbetaalMethode, bankBeschikbaar = true, paparaIdentifier, setPaparaIdentifier, paparaIdentifierType, setPaparaIdentifierType, ontvangerBank, setOntvangerBank, onVolgende, ontvangerLabel, setOntvangerLabel, token, bijnaam, setBijnaam, favorieten, toggleFavoriet }) {
  const { t } = useTaal();
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

  const ibanCheck = iban.length > 4 ? valideerIBAN(iban) : null;
  const ibanGeldig = !iban || (ibanCheck?.geldig === true);
  const ontvangerInfoOK = uitbetaalMethode === 'papara'
    ? !!paparaIdentifier
    : (iban && ibanCheck?.geldig);
  // De ondergrens komt uit het prijsmodel, niet uit een los getal. Hier stond 10,
  // waardoor een klant met EUR 30 helemaal tot het bevestigingsscherm kwam en pas
  // bij Versturen te horen kreeg dat het niet kan.
  const kanVolgende = bedrag && !isNaN(bedrag) && parseFloat(bedrag) >= MIN_BEDRAG && ontvanger && ontvangerInfoOK;

  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-6 space-y-5 animate-fade-up">
      <h2 className="font-display text-xl font-medium text-ink-1">Geld overmaken</h2>

      <div>
        <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-2">Bedrag (EUR)</label>
        <div className="flex items-center border border-brand-500 rounded-md px-4 py-3 bg-brand-50/50 focus-within:ring-2 focus-within:ring-brand-100">
          <span className="font-display text-2xl font-medium text-brand-400 mr-2">€</span>
          <input type="number" min="0" max="5000" step="10" inputMode="decimal"
            value={bedrag}
            onChange={e => {
              const v = e.target.value;
              if (v === '' || v === '-') return setBedrag('');
              const n = parseFloat(v);
              if (!isNaN(n)) setBedrag(Math.max(0, n).toString());
            }}
            className="flex-1 font-display text-2xl font-medium tabular-nums text-ink-1 outline-none bg-transparent" />
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {SNELLE_BEDRAGEN.map(b => (
            <button key={b} onClick={() => setBedrag(b.toString())}
              className={`px-3 py-1 rounded-full text-sm font-semibold tabular-nums transition ${
                bedrag === b.toString()
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-ink-2 hover:bg-brand-100 hover:text-brand-700'}`}>
              €{b.toLocaleString('nl-NL')}
            </button>
          ))}
        </div>
      </div>

      {/* Snelheid keuze: Express vs Economy */}
      <div>
        <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-2">Snelheid</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSnelheid('express')}
            className={`p-3 rounded-md text-left border transition-colors active:scale-[0.99] ${
              snelheid === 'express'
                ? 'bg-brand-600 border-brand-600 text-white shadow-soft'
                : 'bg-surface border-border text-ink-2 hover:bg-surface-3'
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Zap className="w-4 h-4" />
              <span className="font-semibold text-sm">Express</span>
            </div>
            <div className={`text-[10px] tabular-nums ${snelheid === 'express' ? 'text-blue-100' : 'text-gray-500'}`}>
              Express · €{previewFee('express').toFixed(2)}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSnelheid('economy')}
            className={`p-3 rounded-md text-left border transition-colors active:scale-[0.99] ${
              snelheid === 'economy'
                ? 'bg-success-600 border-success-600 text-white shadow-soft'
                : 'bg-surface border-border text-ink-2 hover:bg-surface-3'
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Clock className="w-4 h-4" />
              <span className="font-semibold text-sm">Economy</span>
            </div>
            <div className={`text-[10px] tabular-nums ${snelheid === 'economy' ? 'text-success-100' : 'text-gray-500'}`}>
              Standaard · €{previewFee('economy').toFixed(2)} · zeer voordelig
            </div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-2">Ontvanger krijgt in</label>
        <CurrencySelector
          value={valuta}
          onChange={setValuta}
          favorieten={favorieten}
          onToggleFavoriet={toggleFavoriet}
        />
        {valutaInfo.status === 'binnenkort' && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5 mt-2 text-[11px] text-amber-800 leading-snug">
            <Bell className="w-4 h-4 flex-shrink-0" />
            <span>Uitbetaling naar {valutaInfo.land} komt binnenkort. Bereken alvast — je kunt je op de wachtlijst zetten.</span>
          </div>
        )}
      </div>

      {ontvangenNetto !== null && (
        <div className="rounded-md p-4 space-y-3 animate-fade-up bg-surface-2 border border-border">
          {/* PSD2 transparante kostenweergave — vereist door EU 2019/518 */}
          <div className="flex justify-between text-sm">
            <span className="text-ink-2">Servicekosten</span>
            <span className="font-mono font-semibold tabular-nums text-ink-1">€{kosten.klantBetaaltFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-ink-2">Wisselkoers marge ({kosten.fxAfwijkingPct}%)</span>
            <span className="font-mono font-semibold tabular-nums text-ink-1">€{kosten.fxKostenEur.toFixed(2)}</span>
          </div>

          <div className="border-t border-border-subtle pt-2 flex justify-between text-sm font-semibold text-rose-700">
            <span>Totale kosten</span>
            <span className="font-mono tabular-nums">€{kosten.totaleKostenEur.toFixed(2)} ({kosten.totaleKostenPct}%)</span>
          </div>

          {/* Mid-market vs gehanteerde koers — PSD2 vereiste */}
          <div className="bg-surface rounded-md p-2 space-y-1 text-[11px] border border-border-subtle">
            <div className="flex justify-between text-gray-500">
              <span>Mid-market koers (ECB referentie)</span>
              <span className="font-mono tabular-nums">1 EUR = {kosten.midMarketRate.toLocaleString('nl-NL', { maximumFractionDigits: 4 })}</span>
            </div>
            <div className="flex justify-between text-ink-1 font-semibold">
              <span>Onze koers</span>
              <span className="font-mono tabular-nums">1 EUR = {kosten.appliedRate.toLocaleString('nl-NL', { maximumFractionDigits: 4 })} {valutaInfo.code}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Onze koers wijkt {kosten.fxAfwijkingPct}% af van de ECB referentiekoers
            </div>
          </div>

          <div className="border-t border-border-subtle pt-2 flex justify-between font-semibold text-brand-700">
            <span>Ontvanger krijgt</span>
            <span className="font-display text-lg font-medium tabular-nums">{formatBedrag(ontvangenNetto, valuta)}</span>
          </div>

          <div className="bg-brand-50 border border-brand-100 rounded-md px-2 py-1.5 text-[11px] text-brand-700 leading-snug">
            <Vlag land={valutaInfo.landCode} size={14} /> <strong>Dit ziet je ontvanger</strong> op zijn/haar {valutaInfo.land} bankrekening.
          </div>

          {/* Juridische documenten v1.0: prijsspecificatie -> Tarievenoverzicht */}
          <a href="/tarieven" target="_blank" rel="noopener noreferrer"
            className="inline-block text-xs font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-600">
            {t('prijs_opbouw_link')}
          </a>
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
          <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">Naam ontvanger</label>
          {ontvangers.length > 0 && (
            <button onClick={() => setToonOntvangers(true)}
              className="text-sm font-semibold text-brand-700 hover:underline underline-offset-4">Kies opgeslagen</button>
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

        {/* Familie label selector */}
        {ontvanger && (
          <div className="mt-3">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-2">Wie is dit voor jou?</p>
            <div className="flex gap-1.5 flex-wrap">
              {FAMILIE_LABELS.map(l => (
                <button key={l.id} type="button"
                  onClick={() => setOntvangerLabel?.(l.id === ontvangerLabel ? null : l.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
                    l.id === ontvangerLabel
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-ink-2 hover:bg-brand-100 hover:text-brand-700'
                  }`}>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Uitbetaal methode toggle: bank vs Papara */}
      <div>
        <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-2">Hoe ontvangt {ontvanger || 'de ontvanger'} het geld?</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => bankBeschikbaar && setUitbetaalMethode('bank')}
            disabled={!bankBeschikbaar}
            className={`p-3 rounded-md text-left border transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
              uitbetaalMethode === 'bank'
                ? 'bg-brand-600 border-brand-600 text-white shadow-soft'
                : 'bg-surface border-border text-ink-2 hover:bg-surface-3'
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Bank className="w-4 h-4" />
              <span className="font-semibold text-sm">Bankrekening</span>
            </div>
            <div className={`text-[10px] ${uitbetaalMethode === 'bank' ? 'text-blue-100' : 'text-gray-500'}`}>
              {bankBeschikbaar ? 'Rechtstreeks op de rekening' : 'Binnenkort beschikbaar'}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUitbetaalMethode('papara')}
            className={`p-3 rounded-md text-left border transition-colors active:scale-[0.99] relative ${
              uitbetaalMethode === 'papara'
                ? 'bg-accent-500 border-accent-500 text-white shadow-soft'
                : 'bg-surface border-border text-ink-2 hover:bg-surface-3'
            }`}
          >
            <span className="absolute top-1 right-1 text-[8px] bg-amber-400 text-amber-900 font-bold px-1 rounded">SOON</span>
            <div className="flex items-center gap-2 mb-0.5">
              <Wallet className="w-4 h-4" />
              <span className="font-semibold text-sm">Digitale wallet</span>
            </div>
            <div className={`text-[10px] ${uitbetaalMethode === 'papara' ? 'text-white/80' : 'text-gray-500'}`}>
              Direct op de wallet-rekening
            </div>
          </button>
        </div>
      </div>

      {uitbetaalMethode === 'bank' ? (
        <div className="space-y-3">
          <div>
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-2">
              Bank van ontvanger
              {valutaInfo.landCode && LAND_INFO[valutaInfo.landCode] && (
                <span className="text-gray-400 ml-1 normal-case tracking-normal">
                  ({LAND_INFO[valutaInfo.landCode].naam})
                </span>
              )}
            </label>
            <select
              value={ontvangerBank}
              onChange={e => setOntvangerBank(e.target.value)}
              className="w-full border border-border rounded-md px-4 py-3 text-sm outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 font-medium"
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
                    <optgroup key={catKey} label={catInfo.naam}>
                      {banken.map(b => (
                        <option key={b.id} value={b.naam}>{b.naam}</option>
                      ))}
                    </optgroup>
                  );
                });
              })()}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              Banken passen automatisch aan op de gekozen valuta
            </p>
          </div>
          <div>
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-2">IBAN ontvanger</label>
            <input value={iban} onChange={e => setIban(e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder="TR330006100519786457841326"
              className={`w-full border rounded-md px-4 py-3 outline-none font-mono text-sm bg-surface transition focus:ring-2 focus:ring-brand-100 ${
                !iban ? 'border-border focus:border-brand-500' :
                ibanCheck?.geldig ? 'border-success-500 bg-success-50' : 'border-red-300 bg-red-50'
              }`} />
            {iban && ibanCheck && (
              <p className={`text-xs mt-1 ${ibanCheck.geldig ? 'text-success-700' : 'text-red-500'}`}>
                {ibanCheck.geldig ? 'Geldig IBAN' : `${ibanCheck.fout}`}
              </p>
            )}
          </div>
          {/* Bijnaam (optioneel). Was het vinkje "Bewaar als favoriete ontvanger";
              de server bewaart een bankontvanger na een geslaagde betaling toch al
              (review aanmeldroute punt 11). */}
          {ontvanger && iban && (
            <div>
              <label htmlFor="pf-bijnaam" className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-2">{t('benef_bijnaam')}</label>
              <input
                id="pf-bijnaam"
                value={bijnaam || ''}
                onChange={e => setBijnaam?.(e.target.value)}
                maxLength={BIJNAAM_MAX}
                placeholder={t('benef_bijnaam_placeholder')}
                autoComplete="off"
                className="w-full border border-border rounded-md px-4 py-3 outline-none bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
              <p className="text-[10px] text-gray-400 mt-1">{t('benef_bijnaam_uitleg')}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 text-[11px] text-amber-800 flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span><strong>Binnenkort:</strong> wallet-uitbetaling is in ontwikkeling (live verwacht Q3 2026). Voor nu kun je het bestellen — wij betalen handmatig uit zodra je transactie gelukt is.</span>
          </div>
          <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">Hoe wil je sturen?</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { type: 'papara_nummer', label: 'Wallet-ID', placeholder: 'Wallet-nummer' },
              { type: 'telefoon', label: 'Telefoon', placeholder: '+...' },
              { type: 'email', label: 'Email', placeholder: 'naam@x.com' },
            ].map(opt => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setPaparaIdentifierType(opt.type)}
                className={`py-2 rounded-md text-xs font-semibold transition ${
                  paparaIdentifierType === opt.type
                    ? 'bg-accent-500 text-white'
                    : 'bg-gray-100 text-ink-2'
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
              paparaIdentifierType === 'papara_nummer' ? 'Wallet-nummer van de ontvanger' :
              paparaIdentifierType === 'telefoon' ? '+31 6 12345678' :
              'naam@example.com'
            }
            className="w-full border border-border rounded-md px-4 py-3 outline-none font-mono text-sm bg-surface focus:border-accent-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      )}

      <button onClick={onVolgende}
        disabled={!kanVolgende}
        className="btn-inst w-full py-4 disabled:bg-gray-300 disabled:cursor-not-allowed">
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
function StapBetaalmethode({ methode, setMethode, beschikbaar, onVolgende, onTerug }) {
  const { t } = useTaal();
  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-6 space-y-5">
      <h2 className="font-display text-xl font-medium text-ink-1">Kies betaalmethode</h2>
      <div className="space-y-2.5">
        {BETAALMETHODEN.map(m => {
          const disabled = !methodeKanNu(m.id, beschikbaar);
          const selected = methode === m.id && !disabled;
          return (
            <label key={m.id}
              className={`flex items-center gap-4 p-4 rounded-md cursor-pointer transition-colors ${
                disabled ? 'border border-border bg-surface-2 opacity-50 cursor-not-allowed'
                : selected ? 'border border-brand-500 bg-brand-50'
                : 'border border-border hover:border-gray-300 hover:bg-surface-3 bg-surface'
              }`}>
              <input type="radio" name="methode" value={m.id}
                checked={selected} disabled={disabled}
                onChange={() => !disabled && setMethode(m.id)} className="sr-only" />
              <div className={`w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0 ${
                selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-ink-2'
              }`}>
                {m.iconType === 'vlag'
                  ? <Vlag land={m.land} size={22} decorative />
                  : <m.Icon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink-1">{m.label}</div>
                <div className="text-sm text-gray-500 truncate">{m.desc}</div>
                {(disabled || m.sub) && (
                  <div className="text-xs text-gray-400 mt-0.5">{disabled ? t('betaal_methode_niet_beschikbaar') : m.sub}</div>
                )}
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected ? 'border-brand-600 bg-brand-600' : 'border-gray-300'}`}>
                {selected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </label>
          );
        })}
      </div>

      {/* Hier stond een instructieblok "Maak over naar SwiftBridge" met een
          verzonnen rekeningnummer. Het verscheen nooit (de tegel had een ander
          id) en een bankoverboeking neemt de server niet aan; weg ermee. */}

      <div className="flex gap-3">
        <button onClick={onTerug} className="flex-1 border border-border rounded-md text-ink-2 font-semibold py-3 hover:bg-surface-3 transition">← Terug</button>
        <button onClick={onVolgende} disabled={!methodeKanNu(methode, beschikbaar)}
          className="flex-1 btn-inst py-3 disabled:bg-gray-300">Controleren →</button>
      </div>
    </div>
  );
}

// ── Stap 2: Bevestiging ───────────────────────────────────────────────────────
function StapBevestiging({ bedrag, valuta, ontvanger, iban, ontvangerBank, uitbetaalMethode, methode, liveKoersTry, gratisEersteTx, laden, fout, emailNietGeverifieerd, resendLaden, resendBericht, resendOk, onResendEmail, onVerstuur, onTerug, notitie, setNotitie, betaalStartFout, onOpnieuwBetalen, onNieuweOverboeking }) {
  const { t } = useTaal();
  const valutaInfo = getValuta(valuta);
  const effectieveKoers = valuta === 'TRY' && liveKoersTry ? liveKoersTry : valutaInfo.koers;
  const bedragNum = parseFloat(bedrag) || 0;
  const methodeObj = BETAALMETHODEN.find(m => m.id === methode);
  // PSD2 compliant cost breakdown
  const kosten = berekenKosten(bedragNum, methode || 'ideal', 'express', effectieveKoers);

  // De welkomstactie maakt de fee nul. Dit scherm kende die actie niet en toonde
  // dus EUR 4,95 servicekosten en een lager ontvangstbedrag dan de server boekte
  // — precies omgekeerd aan wat een klant mag verwachten van een bevestiging.
  // Het bedrag dat hier staat, is het bedrag dat wordt toegepast.
  const dealActief = welkomstDealActief(bedragNum, gratisEersteTx);
  const feeGetoond = dealActief ? 0 : kosten.klantBetaaltFee;
  const opbouw = prijsopbouw({
    bedrag: bedragNum,
    feeEur: feeGetoond,
    midMarketRate: effectieveKoers,
    niveau: kosten.niveau,
  });
  const totaleKostenEur = feeGetoond + opbouw.fxMargeEur;
  const totaleKostenPct = bedragNum > 0 ? (totaleKostenEur / bedragNum) * 100 : 0;

  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-6 space-y-5 animate-fade-up">
      <h2 className="font-display text-xl font-medium text-ink-1">Bevestig overmaken</h2>
      <div className="bg-surface-2 border border-border-subtle rounded-md p-4 space-y-3">
        {[
          ['Van', `€${bedragNum.toFixed(2)}`],
          ['Betaalmethode', methodeObj?.label || methode],
          ['Naar', ontvanger],
          ['IBAN', `${iban.slice(0,4)} •••• ${iban.slice(-4)}`],
          // Bij "Snel opnieuw" komt de klant hier zonder het eerste scherm te
          // zien; dan moet hij ook de bank kunnen nakijken.
          ...(uitbetaalMethode === 'bank' && ontvangerBank ? [[t('benef_bank'), ontvangerBank]] : []),
          ['Vaste kosten', dealActief ? '€0,00 (welkomstactie)' : `€${feeGetoond.toFixed(2)}`],
          [`Wisselkoers marge (${opbouw.fxMargePct}%)`, `€${opbouw.fxMargeEur.toFixed(2)}`],
          ['Totale kosten', `€${totaleKostenEur.toFixed(2)} (${totaleKostenPct.toFixed(2)}%)`],
          ['Mid-market koers (ECB)', `1 EUR = ${opbouw.midMarketKoers.toLocaleString('nl-NL', { maximumFractionDigits: 4 })}`],
          ['Onze wisselkoers', `1 EUR = ${opbouw.appliedRate.toLocaleString('nl-NL', { maximumFractionDigits: 4 })} ${valutaInfo.code}`],
          ['Ontvanger krijgt', formatBedrag(opbouw.ontvangenBedrag, valuta)],
          ['Aankomsttijd', 'Wordt gemeld na verwerking'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-gray-500 text-sm">{label}</span>
            <span className="font-semibold tabular-nums text-ink-1 text-sm text-right">{value}</span>
          </div>
        ))}
        {/* Juridische documenten v1.0: prijsspecificatie -> Tarievenoverzicht */}
        <a href="/tarieven" target="_blank" rel="noopener noreferrer"
          className="inline-block text-xs font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-600">
          {t('prijs_opbouw_link')}
        </a>
      </div>

      {fout && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border border-red-200 rounded-md p-3 text-red-600 text-sm space-y-2"
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
                  ? `${t('laden')}`
                  : `${t('payment_email_resend_link')}`}
              </button>
              {resendBericht && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`text-xs rounded-md px-2 py-1.5 border ${
                    resendOk
                      ? 'text-success-700 bg-success-50 border-success-100'
                      : 'text-red-700 bg-red-50 border-red-200'
                  }`}
                >
                  {resendOk ? '' : ''}
                  {resendBericht}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VVV — optionele notitie voor eigen administratie */}
      {setNotitie && (
        <div className="rounded-md bg-surface-2 border border-border p-3">
          <label className="block text-xs font-semibold text-ink-2 mb-1.5">
            Persoonlijke notitie <span className="text-gray-400 font-normal">(optioneel, alleen voor jou zichtbaar)</span>
          </label>
          <input
            type="text"
            value={notitie || ''}
            onChange={(e) => setNotitie(e.target.value.slice(0, 200))}
            placeholder="Bv. 'Verjaardag Moeder' of 'Huur juni'"
            maxLength={200}
            className="w-full text-sm border border-border bg-surface rounded-md px-3 py-2 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="text-[10px] text-gray-400 text-right mt-1">{(notitie || '').length}/200</div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Door te bevestigen ga je akkoord met onze{' '}
        <a href="/voorwaarden" target="_blank" rel="noopener noreferrer" className="text-brand-700 font-semibold hover:underline underline-offset-4">Algemene Voorwaarden</a>.
      </p>
      {/* Juridische documenten v1.0: bij de overboeking gelden de Voorwaarden Betaaldiensten (02) */}
      <p className="text-xs text-gray-500 text-center -mt-3">
        <ZinMetLinks
          tekst={t('overboeking_voorwaarden_zin')}
          links={[{ label: t('link_voorwaarden_betaaldiensten'), to: '/voorwaarden/betaaldiensten' }]}
          linkClassName="text-brand-700 font-semibold underline underline-offset-4 hover:text-brand-600"
        />
      </p>

      {betaalStartFout ? (
        // De overboeking bestaat al, maar de betaling is niet gestart. Eerlijk
        // zeggen, en DEZELFDE overboeking opnieuw laten betalen: nog een keer
        // "Bevestigen & betalen" zou een tweede overboeking aanmaken.
        <div role="alert" className="bg-amber-50 border border-amber-200 rounded-md p-4 space-y-3 text-amber-800">
          <p className="font-semibold">{t('betaal_start_mislukt_titel')}</p>
          <p className="text-sm">{t('betaal_start_mislukt_tekst')}</p>
          {betaalStartFout.melding && <p className="text-sm">{betaalStartFout.melding}</p>}
          {betaalStartFout.opnieuwMogelijk ? (
            <button type="button" onClick={onOpnieuwBetalen} disabled={laden}
              className="w-full btn-inst py-3 disabled:bg-gray-300">
              {laden ? t('laden') : t('betaal_opnieuw')}
            </button>
          ) : (
            <button type="button" onClick={onNieuweOverboeking}
              className="w-full btn-inst py-3">
              {t('betaal_nieuwe_overboeking')}
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={onTerug} className="flex-1 border border-border rounded-md text-ink-2 font-semibold py-3 hover:bg-surface-3 transition">← Terug</button>
          <button onClick={onVerstuur} disabled={laden}
            className="flex-1 bg-success-600 hover:bg-success-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-md transition">
            {laden ? 'Verwerken...' : 'Bevestigen & betalen'}
          </button>
        </div>
      )}
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
      <div className="bg-success-50 border border-success-100 rounded-md p-3 text-sm text-success-700 flex items-center gap-2">
        <Check className="w-4 h-4 flex-shrink-0" />
        Notificaties aangezet — je krijgt bericht bij aankomst.
      </div>
    );
  }

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-md p-4 text-left">
      <div className="flex items-start gap-3">
        <Bell className="w-6 h-6 text-brand-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-medium text-brand-900 text-sm">Krijg bericht bij aankomst?</p>
          <p className="text-xs text-brand-800 mt-0.5">
            We sturen één korte notificatie wanneer het geld is aangekomen op de rekening van de ontvanger.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={jaActiveer}
          disabled={bezig}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-md transition"
        >
          {bezig ? 'Bezig…' : 'Ja, graag'}
        </button>
        <button
          onClick={neeBedankt}
          className="text-xs font-semibold text-ink-2 hover:text-ink-1 px-3 py-2"
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
    <div className="bg-brand-50 border border-brand-200 rounded-md p-4 text-left space-y-3">
      <div className="flex items-start gap-3">
        <Send className="w-6 h-6 text-brand-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-medium text-brand-900 text-sm">Deel tracking-link met ontvanger</p>
          <p className="text-xs text-brand-800 mt-0.5">
            Ze kunnen status volgen zonder account — geen persoonsgegevens zichtbaar.
          </p>
        </div>
      </div>
      <div className="bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs font-mono text-ink-2 truncate">
        {trackUrl}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={kopieer}
          className="text-xs font-semibold text-ink-2 bg-gray-100 hover:bg-gray-200 rounded-md py-2.5 transition"
        >
          {gekopieerd ? 'Gekopieerd' : 'Kopieer'}
        </button>
        <button
          onClick={deelWhatsApp}
          className="text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1ebe57] rounded-md py-2.5 transition"
        >
          WhatsApp
        </button>
        <button
          onClick={deelNative}
          className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md py-2.5 transition"
        >
          Delen
        </button>
      </div>
    </div>
  );
}

// ── Stap 3: Verzonden (alleen simulatie) ──────────────────────────────────────
// Met Mollie gaat de klant na "Bevestigen & betalen" naar de betaalpagina en
// komt hij terug op /app?payment=<id> (BetaalStatusKaart). Dit scherm verschijnt
// alleen als de server zegt dat betalen hier uit staat (PAY_NIET_GECONFIGUREERD).
// Het zei "Geld onderweg! Je iDEAL betaling is verwerkt", ook als er niets was
// betaald (analyse aanmeldroute 13-10-2026); nu zegt het wat er echt gebeurde.
function StapVerzonden({ transactie, methode, onNieuw, token }) {
  const { t } = useTaal();
  const methodeObj = BETAALMETHODEN.find(m => m.id === methode);
  const valuta = transactie?.valuta || 'TRY';
  const ontvangenBedrag = transactie?.ontvangenBedrag ?? transactie?.tryBedrag ?? 0;
  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-6 text-center space-y-5 animate-fade-up">
      <div className="w-16 h-16 mx-auto bg-brand-100 rounded-full flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-brand-600" />
      </div>
      <h2 className="font-display text-2xl font-medium text-ink-1">{t('betaal_simulatie_titel')}</h2>
      <p className="text-ink-2 text-sm">{t('betaal_simulatie_tekst')}</p>
      <div className="rounded-md p-4 space-y-2 text-left bg-success-50 border border-success-100">
        {[
          ['Verstuurd', `€${transactie?.eurBedrag?.toFixed(2)}`],
          ['Ontvanger krijgt', formatBedrag(ontvangenBedrag, valuta)],
          ['Methode', methodeObj?.label || methode],
          ['Transactie ID', transactie?.id?.slice(0,16) + '…'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-ink-1 font-mono tabular-nums">{value}</span>
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

      {/* TX-DOEL: direct na het versturen vragen waarvoor de uitgave was */}
      {transactie?.id && <TransactieDoel transactieId={transactie.id} />}

      <button onClick={onNieuw} className="btn-inst w-full py-3">
        Nieuwe overschrijving
      </button>
    </div>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function PaymentFlow({ token }) {
  const { t } = useTaal();
  // MMM: favoriete valutas — server-sync via cookie-auth (PaymentFlow is
  // alleen bereikbaar voor ingelogde users via ProtectedRoute).
  const { favorieten, toggleFavoriet } = useFavorieteValutas();
  const [stap, setStap ] = useState(0);
  // WL-2: wachtlijst-modal voor binnenkort-corridors
  const [wachtlijstOpen, setWachtlijstOpen] = useState(false);
  const [bedrag, setBedrag ] = useState('500');
  const [valuta, setValuta ] = useState('TRY');
  const [snelheid, setSnelheid ] = useState('express'); // express | economy
  const [ontvanger, setOntvanger ] = useState('');
  const [ontvangerLabel, setOntvangerLabel] = useState(null);
  const [iban, setIban ] = useState('');
  const [uitbetaalMethode, setUitbetaalMethode] = useState('bank'); // bank | papara
  // Welke uitbetaalmethodes kunnen nu echt (21-9): in live-modus zonder bank-rail
  // weigert de API 'bank'; dan kiezen we vooraf de wallet i.p.v. een fout bij bevestigen.
  const [bankBeschikbaar, setBankBeschikbaar] = useState(true);
  // "Snel opnieuw" opende meteen het bevestigscherm (zie het voorvullen hieronder).
  const snelOpnieuwRef = useRef(false);
  useEffect(() => {
    let weg = false;
    Promise.resolve()
      .then(() => apiFetch('/transactions/uitbetaalmethodes'))
      .then((m) => {
        if (weg || !m) return;
        if (m.bank === false) {
          setBankBeschikbaar(false); setUitbetaalMethode('papara');
          // Een klaargezette bankontvanger kan nu niet: terug naar het eerste
          // scherm om de wallet in te vullen, niet bevestigen wat niet kan.
          if (snelOpnieuwRef.current) { snelOpnieuwRef.current = false; setStap(0); }
        }
      })
      .catch(() => { /* onbekend: niets blokkeren, de API controleert toch */ });
    return () => { weg = true; };
  }, []);
  // Staat de welkomstactie nog open? Nodig om op het bevestigingsscherm de
  // bedragen te tonen die de server werkelijk toepast. Lukt het ophalen niet,
  // dan gaan we uit van 'nee': dan ziet de klant de normale servicekosten en
  // valt de uitkomst mee, in plaats van dat we kosteloos beloven en toch rekenen.
  const [gratisEersteTx, setGratisEersteTx] = useState(false);
  useEffect(() => {
    let weg = false;
    Promise.resolve()
      .then(() => apiFetch('/users/me'))
      .then((u) => { if (!weg && u) setGratisEersteTx(Boolean(u.gratisEersteTx)); })
      .catch(() => { /* onbekend: normale kosten tonen */ });
    return () => { weg = true; };
  }, []);
  const [paparaIdentifier, setPaparaIdentifier] = useState('');
  const [paparaIdentifierType,setPaparaIdentifierType]= useState('papara_nummer'); // papara_nummer | telefoon | email
  // De methode van de vorige overboeking op dit toestel, anders iDEAL (meest
  // gebruikt in NL). Kan die nu niet, dan corrigeert GET /payments/methodes hem.
  const [methode, setMethode ] = useState(() => geldigeMethode(leesLaatsteBetaalmethode() || 'ideal', null));
  // Welke methodes staan bij Mollie aan (GET /payments/methodes)? null = onbekend:
  // dan geldt de standaard uit services/betaalmethodes.js.
  const [beschikbaar, setBeschikbaar] = useState(null);
  useEffect(() => {
    let weg = false;
    Promise.resolve()
      .then(() => apiFetch('/payments/methodes'))
      .then((d) => {
        if (weg || !Array.isArray(d?.beschikbaar)) return;
        setBeschikbaar(d.beschikbaar);
        // Staat de gekozen methode (bv. uit een oud concept) niet aan: eerste die wel kan.
        // Apple Pay en Klarna staan uit tot de server ze noemt; was een van die
        // twee de vorige methode en staat er nog de terugval, dan nu alsnog
        // voorkiezen (review 13-10-2026).
        setMethode((m) => {
          const vorige = leesLaatsteBetaalmethode();
          if (vorige && m === geldigeMethode(vorige, null) && methodeKanNu(vorige, d.beschikbaar)) return vorige;
          return geldigeMethode(m, d.beschikbaar);
        });
      })
      .catch(() => { /* onbekend: standaard tonen, de server controleert toch */ });
    return () => { weg = true; };
  }, []);
  // Overboeking aangemaakt, maar de betaling startte niet: die overboeking
  // opnieuw laten betalen in plaats van een tweede aan te maken.
  const [openTx, setOpenTx] = useState(null);
  const [betaalStartFout, setBetaalStartFout] = useState(null); // null | { melding, opnieuwMogelijk }
  const [notitie, setNotitie ] = useState(''); // VVV — persoonlijke notitie per transactie
  const [ontvangerBank, setOntvangerBank ] = useState('Ziraat Bankası');
  const [liveKoersTry, setLiveKoersTry ] = useState(null);
  const [transactie, setTransactie ] = useState(null);
  const [laden, setLaden ] = useState(false);
  const [fout, setFout ] = useState('');
  // Optionele bijnaam voor de opgeslagen ontvanger (leeg = de app slaat niets op;
  // de server bewaart een bankontvanger na een geslaagde betaling zelf).
  const [bijnaam, setBijnaam] = useState('');
  // Email verificatie — bij EMAIL_NIET_GEVERIFIEERD tonen we een resend-link
  const [emailNietGeverifieerd, setEmailNietGeverifieerd] = useState(false);
  const [resendLaden, setResendLaden ] = useState(false);
  const [resendBericht, setResendBericht ] = useState('');
  const [resendOk, setResendOk ] = useState(false);

  useEffect(() => {
    fetch(`${SWIFTNEWS}/api/forex`)
      .then(r => r.json())
      .then(j => { if (j.rate) setLiveKoersTry(j.rate); })
      .catch(() => {});

    // Opnieuw versturen: velden voorvullen met wat klaargezet is
    // (services/opnieuwVersturen.js: ontvanger, IBAN, bank, laatste bedrag, valuta).
    const r = haalOpnieuwKlaar();
    if (r) {
      const ibanSchoon = String(r.iban || '').replace(/\s/g, '').toUpperCase();
      if (r.ontvanger) setOntvanger(r.ontvanger);
      if (ibanSchoon) setIban(ibanSchoon);
      if (r.bedrag) setBedrag(String(r.bedrag));
      if (r.valuta) setValuta(r.valuta);
      if (r.bank) setOntvangerBank(r.bank);
      // "Snel opnieuw" (aanmeldroute punt 11): alles bekend en geldig → meteen
      // het bevestigscherm. Zelfde voorwaarden als de knop op het eerste scherm;
      // anders begint de klant daar, met alles ingevuld. De server controleert
      // de overboeking daarna zoals altijd (KYC, limieten, screening).
      const bedragNum = parseFloat(r.bedrag);
      const kanMeteenBevestigen = r.direct === true
        && String(r.ontvanger || '').trim().length >= 2
        && valideerIBAN(ibanSchoon).geldig
        && bedragNum >= MIN_BEDRAG
        && getValuta(r.valuta || 'TRY')?.status !== 'binnenkort';
      if (kanMeteenBevestigen) {
        snelOpnieuwRef.current = true;
        setStap(2);
      }
      return; // niet ook draft laden
    }

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
          if (d.bedrag) setBedrag(String(d.bedrag));
          if (d.valuta) setValuta(d.valuta);
          // Een oud concept kan een methode bevatten die de server niet aanneemt.
          if (d.methode) setMethode(geldigeMethode(d.methode, null));
          if (d.snelheid) setSnelheid(d.snelheid);
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

  // PIN-1: tx-confirm — wordt geset door PIN-prompt onSucces. Single-use token.
  const [txConfirmToken, setTxConfirmToken] = useState(null);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pinStatusVoorTx, setPinStatusVoorTx] = useState(null); // null/true/false

  // PIN-status laden bij component-mount zodat we kunnen voorzien of prompt nodig is
  useEffect(() => {
    if (!token) return;
    apiFetch('/auth/pin/status').then((d) => setPinStatusVoorTx(!!d?.ingeschakeld))
      .catch(() => setPinStatusVoorTx(false));
  }, [token]);

  // Loopt het ophalen van de pinstatus in startVerstuur nog? Dan telt een tweede
  // tik niet. De knop staat dan nog aan en elke poging krijgt een eigen
  // idempotency-sleutel, dus anders twee overboekingen (review 13-10-2026).
  const pinStatusOphalenRef = useRef(false);

  // Wrapper die de PIN-prompt eventueel toont vóór verstuur()
  async function startVerstuur() {
    if (pinStatusOphalenRef.current) return;
    // Bij "Snel opnieuw" staat het bevestigscherm er meteen; tikt de klant vóór
    // de pinstatus binnen is, dan eerst die status ophalen in plaats van zonder
    // pincode door te gaan (de server zou dan weigeren).
    let pinAan = pinStatusVoorTx;
    if (pinAan === null && token) {
      pinStatusOphalenRef.current = true;
      try { pinAan = !!(await apiFetch('/auth/pin/status'))?.ingeschakeld; }
      catch { pinAan = false; }
      finally { pinStatusOphalenRef.current = false; }
      setPinStatusVoorTx(pinAan);
    }
    if (pinAan === true && !txConfirmToken) {
      setPinPromptOpen(true);
      return;
    }
    await verstuur(txConfirmToken);
  }

  async function verstuur(passedConfirmToken) {
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
          // PIN-1: tx-confirm JWT (5min single-use). Backend eist dit als pin_ingeschakeld.
          txConfirmToken: passedConfirmToken || txConfirmToken || undefined,
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

      // Ontvangen bedrag en koers komen van de SERVER — dat zijn de bedragen die
      // daadwerkelijk geboekt zijn. Hier stond eerder een eigen berekening
      // (bedrag x 0,978 x de live tickerkoers) die de vaste fee en de marge
      // samenperste in één aftrek van 2,2% en vervolgens de referentiekoers
      // gebruikte in plaats van de toegepaste. Op EUR 100 beloofde dat scherm de
      // klant ruim 4% meer dan de server had geboekt, en bij de welkomst-deal
      // week het er de andere kant op vanaf. Nooit zelf herrekenen wat de server
      // al heeft vastgelegd.
      const ontvangenBedrag = data.transactie.tryBedrag;
      const effectieveKoers = data.transactie.wisselKoers;

      // ── Start Mollie betaling — krijg checkoutUrl en redirect gebruiker ──
      // Lukt dat niet, dan GEEN terugval op een succesmelding meer: alleen als de
      // server zegt dat betalen hier uit staat (simulatie) gaat het hieronder door.
      const uitkomst = await betaal(data.transactie);
      if (uitkomst !== 'simulatie') return;

      const tx = {
        id: data.transactie.id,
        eurBedrag: data.transactie.eurBedrag,
        tryBedrag: data.transactie.tryBedrag,
        valuta,
        ontvangenBedrag,
        feeEur: data.transactie.feeEur,
        wisselKoers: effectieveKoers,
        ontvangerNaam: data.transactie.ontvangerNaam,
        methode,
        status: data.transactie.status, // 'in_behandeling' van server
        datum: new Date().toISOString(),
      };

      slaTransactieOp(tx);
      if (uitbetaalMethode === 'bank' && iban) {
        await bewaarBijnaam({ token, naam: ontvanger, iban, bank: ontvangerBank, valuta, bijnaam });
      }
      setTransactie(tx);
      // Geen browsermelding "Betaling verstuurd!" meer: in de simulatie is er
      // niets betaald.
      setStap(3);
    } catch (e) {
      // Netwerk fout of timeout — parseError zorgt voor i18n vertaling
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }

  // Start (of herstart) de betaling van een aangemaakte overboeking.
  // 'doorgestuurd' = naar Mollie, 'simulatie' = betalen staat op de server uit,
  // 'fout' = niet gestart: eerlijke melding met "Opnieuw betalen".
  async function betaal(serverTx) {
    const uit = await startBetaling({ transactieId: serverTx.id, methode });
    // De server nam deze methode aan: volgende keer staat hij voorgekozen.
    if (uit.soort === 'doorsturen' || uit.soort === 'simulatie') bewaarLaatsteBetaalmethode(methode);
    if (uit.soort === 'doorsturen') {
      // Bewaar transactie lokaal vóór redirect
      slaTransactieOp({
        id: serverTx.id,
        eurBedrag: serverTx.eurBedrag,
        tryBedrag: serverTx.tryBedrag,
        valuta,
        ontvangenBedrag: serverTx.tryBedrag,
        feeEur: serverTx.feeEur,
        wisselKoers: serverTx.wisselKoers,
        ontvangerNaam: serverTx.ontvangerNaam,
        methode,
        status: 'wacht_op_betaling',
        datum: new Date().toISOString(),
      });
      // Alleen met een bijnaam (anders doet bewaarBijnaam niets). Vóór het
      // doorsturen: daarna breekt de browser lopende verzoeken af.
      if (uitbetaalMethode === 'bank' && iban) {
        await bewaarBijnaam({ token, naam: ontvanger, iban, bank: ontvangerBank, valuta, bijnaam });
      }
      setBetaalStartFout(null);
      // Redirect naar Mollie checkout
      doorsturenNaar(uit.checkoutUrl);
      return 'doorgestuurd';
    }
    if (uit.soort === 'simulatie') return 'simulatie';

    // Niet gestart. Bij deze codes heeft opnieuw proberen geen zin: de
    // overboeking is verlopen, de welkomstactie hoort bij een andere, of er
    // loopt al een betaling. Dan een nieuwe overboeking.
    const code = uit.fout?.errorCode || null;
    const geenZin = ['PAY_NIET_MEER_TE_BETALEN', 'PAY_WELKOMST_ELDERS', 'PAY_REEDS_VOLTOOID'].includes(code);
    setOpenTx(serverTx);
    setBetaalStartFout({ melding: parseError(uit.fout, t), opnieuwMogelijk: !geenZin });
    return 'fout';
  }

  async function opnieuwBetalen() {
    if (!openTx) return;
    setLaden(true);
    try {
      await betaal(openTx);
    } finally {
      setLaden(false);
    }
  }

  function reset() {
    setStap(0); setTransactie(null); setBedrag('500');
    setOntvanger(''); setIban(''); setMethode(geldigeMethode('ideal', beschikbaar)); setFout('');
    setOpenTx(null); setBetaalStartFout(null);
  }

  return (
    <div className="max-w-md mx-auto">
      {/* F37: simulatie-banner zolang EMI-partner-integratie niet live */}
      <SimulatieBanner />

      {/* Stap indicator */}
      <div className="flex items-center justify-center mb-6">
        {STAPPEN.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums transition ${
              i < stap ? 'bg-brand-600 text-white' :
              i === stap ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500' :
                           'bg-gray-100 text-gray-400'}`}>
              {i < stap ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`mx-1 text-[0.7rem] font-medium uppercase tracking-[0.15em] hidden sm:block ${i <= stap ? 'text-brand-700' : 'text-gray-400'}`}>
              {s}
            </span>
            {i < STAPPEN.length - 1 && (
              <div className={`w-5 h-0.5 mx-1 ${i < stap ? 'bg-brand-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {stap === 0 && <StapBedrag token={token} favorieten={favorieten} toggleFavoriet={toggleFavoriet} bijnaam={bijnaam} setBijnaam={setBijnaam} bedrag={bedrag} setBedrag={setBedrag} valuta={valuta} setValuta={setValuta} snelheid={snelheid} setSnelheid={setSnelheid} ontvanger={ontvanger} setOntvanger={setOntvanger} ontvangerLabel={ontvangerLabel} setOntvangerLabel={setOntvangerLabel} iban={iban} setIban={setIban} liveKoersTry={liveKoersTry} uitbetaalMethode={uitbetaalMethode} setUitbetaalMethode={setUitbetaalMethode} bankBeschikbaar={bankBeschikbaar} paparaIdentifier={paparaIdentifier} setPaparaIdentifier={setPaparaIdentifier} paparaIdentifierType={paparaIdentifierType} setPaparaIdentifierType={setPaparaIdentifierType} ontvangerBank={ontvangerBank} setOntvangerBank={setOntvangerBank} onVolgende={() => {
        // WL-2: bij binnenkort-valuta open de wachtlijst-modal i.p.v. door
        // naar betaling. Voorkomt dat klant iDEAL betaalt voor onmogelijke uitbetaling.
        if (getValuta(valuta)?.status === 'binnenkort') {
          setWachtlijstOpen(true);
        } else {
          setStap(1);
        }
      }} />}
      {stap === 1 && <StapBetaalmethode methode={methode} setMethode={setMethode} beschikbaar={beschikbaar} onVolgende={() => setStap(2)} onTerug={() => setStap(0)} />}
      {stap === 2 && <StapBevestiging bedrag={bedrag} valuta={valuta} ontvanger={ontvanger} iban={iban} ontvangerBank={ontvangerBank} uitbetaalMethode={uitbetaalMethode} methode={methode} liveKoersTry={liveKoersTry} gratisEersteTx={gratisEersteTx} laden={laden} fout={fout} emailNietGeverifieerd={emailNietGeverifieerd} resendLaden={resendLaden} resendBericht={resendBericht} resendOk={resendOk} onResendEmail={verstuurEmailOpnieuw} onVerstuur={startVerstuur} onTerug={() => setStap(1)} notitie={notitie} setNotitie={setNotitie} betaalStartFout={betaalStartFout} onOpnieuwBetalen={opnieuwBetalen} onNieuweOverboeking={reset} />}

      {/* PIN-1: tx-confirm PIN-prompt voor Mollie-redirect */}
      {pinPromptOpen && (
        <AppLockScherm
          doel="tx_confirm"
          onAnnuleer={() => setPinPromptOpen(false)}
          onSucces={async (newToken) => {
            setTxConfirmToken(newToken);
            setPinPromptOpen(false);
            await verstuur(newToken);
            // Token-cleanup na verzending (single-use)
            setTxConfirmToken(null);
          }}
        />
      )}
      {stap === 3 && <StapVerzonden transactie={transactie} methode={methode} onNieuw={reset} token={token} />}

      {/* PaymentLoadingOverlay (Verbetering W) — full-screen feedback tijdens
          de transactie-aanmaak → Mollie payment-start → redirect sequence.
          Voorkomt verwarring tijdens 1-4s wachttijd, plus blokkeert dubbele klik. */}
      <PaymentLoadingOverlay open={laden && stap === 2} />

      {/* WL-2: wachtlijst-modal voor binnenkort-corridors */}
      <WachtlijstModal
        open={wachtlijstOpen}
        valuta={getValuta(valuta)}
        eurBedrag={bedrag}
        gebruikerEmail={null /* PaymentFlow heeft geen direct toegang tot profiel-email — anoniem-flow */}
        onSluit={() => setWachtlijstOpen(false)}
      />
    </div>
  );
}
