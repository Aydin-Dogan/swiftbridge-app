/**
 * Calculator.jsx — Standalone transfer-calculator zonder account-vereiste.
 *
 * Doel (Sprint 4 / UX1 uit audit-rapport): drempel verlagen door bezoekers
 * vóór registratie te laten doorrekenen wat ze sturen + wat ontvanger krijgt.
 * Pas op de "Verder met overboeking" knop wordt /login?tab=register getoond.
 *
 * Bewaart state in URL query-params zodat klant deze pagina kan delen
 * (?bedrag=500&valuta=TRY&methode=ideal).
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTaal } from '../i18n';
import { VALUTAS } from '../services/currencies';
import {
  berekenKosten,
  TARIEF_MATRIX,
  methodeNaarTariefKolom,
} from '../services/kosten';
import { API_URL } from '../services/api';
import Vlag from '../components/Vlag';
import TaalKiezer from '../components/TaalKiezer';
import {
  Bank, Card, Zap, Clock, ShieldCheck, ArrowRight, CheckCircle,
} from '../components/icons/Icons';

// Snelle bedragknoppen
const SNEL_BEDRAGEN = [100, 250, 500, 1000, 2500];

// Methodes — alleen werkende (Klarna pas terug als Mollie 'm activeert)
const METHODEN = [
  { id: 'ideal',  Icon: Bank, label: 'iDEAL',         snelheid: 'express', sub: 'Aanrader · <5 min' },
  { id: 'card',   Icon: Card, label: 'Creditcard',    snelheid: 'express', sub: 'Visa/Mastercard · <5 min' },
  { id: 'sepa',   Icon: Bank, label: 'SEPA',          snelheid: 'economy', sub: 'Goedkoopst · 1-2 dagen' },
];

export default function Calculator() {
  const navigate = useNavigate();
  const { t } = useTaal();
  const [searchParams, setSearchParams] = useSearchParams();

  // State uit URL query params (deelbaar)
  const [bedrag, setBedrag] = useState(() => Number(searchParams.get('bedrag')) || 500);
  const [valuta, setValuta] = useState(() => searchParams.get('valuta') || 'TRY');
  const [methode, setMethode] = useState(() => searchParams.get('methode') || 'ideal');

  // Sync naar URL (voor delen + back-button)
  useEffect(() => {
    const p = new URLSearchParams();
    if (bedrag) p.set('bedrag', String(bedrag));
    if (valuta !== 'TRY') p.set('valuta', valuta);
    if (methode !== 'ideal') p.set('methode', methode);
    setSearchParams(p, { replace: true });
  }, [bedrag, valuta, methode, setSearchParams]);

  const [liveKoersen, setLiveKoersen] = useState(null);

  useEffect(() => {
    let geannuleerd = false;
    async function haal() {
      try {
        const res = await fetch(`${API_URL}/transactions/koersen`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!geannuleerd && data?.koersen) setLiveKoersen(data.koersen);
      } catch {
        // stil terugvallen op fallback
      }
    }
    haal();
    return () => { geannuleerd = true; };
  }, []);

  // Selecteer alleen TR + Turkse landen voor valuta (consistent met Hero)
  const valutaOpties = VALUTAS.filter(v => v.groep === 'turkije' || v.groep === 'turks');
  const valutaInfo = VALUTAS.find(v => v.code === valuta) ?? VALUTAS[0];
  const huidigeKoers = liveKoersen?.[valuta] ?? valutaInfo.koers;
  const bedragNum = Math.max(0, Number(bedrag) || 0);

  const methodeInfo = METHODEN.find(m => m.id === methode) || METHODEN[0];

  // Echte berekenKosten — bron-of-truth
  const kosten = useMemo(
    () => berekenKosten(bedragNum, methode, methodeInfo.snelheid, huidigeKoers),
    [bedragNum, methode, methodeInfo.snelheid, huidigeKoers],
  );

  const ontvangenFmt = (kosten.ontvangenBedrag || 0).toLocaleString(valutaInfo.locale, {
    minimumFractionDigits: valutaInfo.decimals,
    maximumFractionDigits: valutaInfo.decimals,
  });

  // Vergelijking met andere methodes voor dit bedrag
  const vergelijking = useMemo(() => {
    return METHODEN.map(m => {
      const k = berekenKosten(bedragNum, m.id, m.snelheid, huidigeKoers);
      return {
        ...m,
        fee: k.klantBetaaltFee,
        ontvangen: k.ontvangenBedrag,
        zichtbarePct: k.zichtbarePct,
      };
    });
  }, [bedragNum, huidigeKoers]);

  function setBedragSafe(val) {
    if (val === '' || val === '-') return setBedrag('');
    const n = parseFloat(val);
    if (isNaN(n)) return;
    setBedrag(Math.max(0, n));
  }

  // Tier (voor "vanaf" tarief in vergelijking) — voor display
  const tierLabels = ['€10-200', '€200-500', '€500-1.000', '€1.000-2.500', '€2.500+'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Lichte sticky header met taal + back */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 safe-top">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition">
            <Zap className="w-5 h-5 text-brand-600" />
            <span className="text-lg font-bold text-gray-900 tracking-tight">SwiftBridge</span>
          </Link>
          <div className="flex items-center gap-2">
            <TaalKiezer />
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700 px-3 py-2 transition"
            >
              {t('inloggen')}
            </button>
            <button
              onClick={() => navigate(`/login?tab=register&bedrag=${bedragNum}&valuta=${valuta}&methode=${methode}`)}
              className="btn-primary text-sm"
            >
              {t('registreren')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Pagina header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            {t('calc_titel')}
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            {t('calc_subtitel')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Linker kolom — calculator-inputs */}
          <div className="lg:col-span-2 space-y-5">
            {/* Bedrag */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-soft-sm">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {t('calc_bedrag_label')}
              </label>

              <div className="flex items-center border border-gray-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 rounded-xl px-4 py-3 mb-3">
                <span className="text-2xl font-semibold text-gray-400 mr-2">€</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="10"
                  value={bedrag}
                  onChange={e => setBedragSafe(e.target.value)}
                  className="flex-1 text-3xl font-bold text-gray-900 outline-none bg-transparent"
                  aria-label={t('calc_bedrag_label')}
                />
              </div>

              {/* Snelle bedragen */}
              <div className="flex flex-wrap gap-2">
                {SNEL_BEDRAGEN.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBedrag(b)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors active:scale-95 ${
                      bedragNum === b
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70'
                    }`}
                  >
                    €{b.toLocaleString('nl-NL')}
                  </button>
                ))}
              </div>
            </div>

            {/* Valuta + land */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-soft-sm">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {t('calc_valuta_label')}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {valutaOpties.map(v => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => setValuta(v.code)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
                      valuta === v.code
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70'
                    }`}
                    title={v.naam}
                  >
                    <Vlag land={v.landCode} size={22} decorative />
                    <span className="mt-1">{v.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Betaalmethode */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-soft-sm">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {t('calc_methode_label')}
              </label>
              <div className="space-y-2">
                {METHODEN.map(m => {
                  const selected = m.id === methode;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethode(m.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-colors active:scale-[0.99] ${
                        selected
                          ? 'border-2 border-brand-500 bg-brand-50'
                          : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <m.Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm">{m.label}</div>
                        <div className="text-xs text-gray-500">{m.sub}</div>
                      </div>
                      {selected && <CheckCircle className="w-5 h-5 text-brand-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Rechter kolom — sticky resultaat-kaart */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-soft-md sticky top-20">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {t('calc_resultaat_label')}
              </div>

              {/* Ontvanger krijgt — met skeleton tijdens koers-fetch */}
              <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-4 mb-4">
                <div className="text-xs text-gray-600 mb-1">{t('calc_ontvanger_krijgt')}</div>
                {liveKoersen === null ? (
                  <>
                    <div className="h-9 w-40 rounded-md animate-shimmer mb-1.5" aria-label="Bezig met laden" />
                    <div className="h-3 w-32 rounded animate-shimmer" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-brand-700">
                      {valutaInfo.symbool}{ontvangenFmt}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      1 € = {Number(huidigeKoers).toLocaleString('nl-NL', { maximumFractionDigits: 4 })} {valutaInfo.code}
                    </div>
                  </>
                )}
              </div>

              {/* Breakdown */}
              <dl className="space-y-2 text-sm mb-5">
                <div className="flex justify-between">
                  <dt className="text-gray-600">{t('calc_jij_stuurt')}</dt>
                  <dd className="font-semibold text-gray-900">€{bedragNum.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">{t('calc_servicekosten')}</dt>
                  <dd className="font-semibold text-gray-900">
                    €{(kosten.klantBetaaltFee || 0).toFixed(2).replace('.', ',')}
                    <span className="text-xs text-gray-500 ml-1">
                      ({String(kosten.zichtbarePct || 0).replace('.', ',')}%)
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <dt className="text-gray-600 inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {t('calc_levertijd')}
                  </dt>
                  <dd className="font-semibold text-gray-900">
                    {methodeInfo.snelheid === 'express' ? '< 5 min' : '1-2 dagen'}
                  </dd>
                </div>
              </dl>

              {/* CTA — pas hier naar registratie */}
              <button
                onClick={() => navigate(`/login?tab=register&bedrag=${bedragNum}&valuta=${valuta}&methode=${methode}`)}
                className="btn-primary w-full py-3.5 inline-flex items-center justify-center gap-2"
              >
                {t('calc_cta_doorgaan')}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Share-knop — kopieert huidige URL naar clipboard zodat
                  gebruiker zijn berekening kan delen via WhatsApp etc.
                  Gebruik navigator.share waar mogelijk (mobiel), anders clipboard. */}
              <ShareButton />

              {/* Trust signals onder CTA */}
              <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> {t('calc_trust_dnb')}</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success-600" /> {t('calc_trust_geen_verplichting')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vergelijking met andere methodes */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('calc_vergelijk_titel')}</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-soft-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">{t('calc_vergelijk_kol_methode')}</th>
                  <th className="px-4 py-3 text-right">{t('calc_vergelijk_kol_fee')}</th>
                  <th className="px-4 py-3 text-right">{t('calc_vergelijk_kol_pct')}</th>
                  <th className="px-4 py-3 text-right">{t('calc_vergelijk_kol_ontvangt')}</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">{t('calc_vergelijk_kol_snelheid')}</th>
                </tr>
              </thead>
              <tbody>
                {vergelijking.map((v, i) => {
                  const isSelected = v.id === methode;
                  return (
                    <tr
                      key={v.id}
                      className={`border-t border-gray-100 cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setMethode(v.id)}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900 inline-flex items-center gap-2">
                        <v.Icon className="w-4 h-4 text-brand-600" />
                        {v.label}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        €{(v.fee || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {String(v.zichtbarePct || 0).replace('.', ',')}%
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-brand-700">
                        {valutaInfo.symbool}{(v.ontvangen || 0).toLocaleString(valutaInfo.locale, { minimumFractionDigits: valutaInfo.decimals, maximumFractionDigits: valutaInfo.decimals })}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">
                        {v.snelheid === 'express' ? '< 5 min' : '1-2 dgn'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer — minimal */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500 mb-3">
            {t('calc_footer_geen_account')}
          </p>
          <Link to="/" className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
            ← {t('calc_terug_naar_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * ShareButton — deelt huidige Calculator URL (met query params).
 * Gebruikt navigator.share waar mogelijk (mobiel native sheet),
 * anders fallback naar clipboard + visuele "gekopieerd" bevestiging.
 */
function ShareButton() {
  const { t } = useTaal();
  const [gekopieerd, setGekopieerd] = useState(false);

  async function deel() {
    const url = window.location.href;
    const title = t('calc_share_title');
    const text = t('calc_share_text');

    // 1. Native share (mobiele Safari/Chrome) — beste UX
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User cancelled — niet doorgaan naar clipboard
        if (err.name === 'AbortError') return;
        // Andere fout → fallback naar clipboard
      }
    }

    // 2. Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2500);
    } catch {
      // Echt geen optie → toon URL in prompt zodat gebruiker handmatig kan kopiëren
      // eslint-disable-next-line no-alert
      window.prompt(t('calc_share_handmatig'), url);
    }
  }

  // WhatsApp direct-deeplink — opent WhatsApp met preset bericht + URL.
  // Werkt op alle platforms (mobile native app, desktop web/desktop app).
  function deelWhatsApp() {
    const url = window.location.href;
    const bericht = `${t('calc_share_text')} ${url}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(bericht)}`;
    window.open(wa, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2" aria-live="polite">
      <button
        onClick={deel}
        className="text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl px-4 py-2.5 transition inline-flex items-center justify-center gap-2"
      >
        {gekopieerd ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {t('calc_share_gekopieerd')}
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            {t('calc_share_knop')}
          </>
        )}
      </button>

      {/* WhatsApp directe deeplink — meest gebruikte share-kanaal in TR community */}
      <button
        onClick={deelWhatsApp}
        className="text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1ebe57] rounded-xl px-4 py-2.5 transition inline-flex items-center justify-center gap-2"
        aria-label={t('calc_share_whatsapp')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.4 0 .03 5.37.03 11.97c0 2.11.55 4.18 1.6 6L0 24l6.2-1.62a11.94 11.94 0 0 0 5.79 1.47h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.45-8.4zM12 21.83h-.01a9.93 9.93 0 0 1-5.07-1.39l-.36-.21-3.68.96.98-3.58-.24-.37a9.93 9.93 0 0 1-1.52-5.29c0-5.49 4.47-9.97 9.97-9.97 2.66 0 5.16 1.04 7.04 2.93a9.9 9.9 0 0 1 2.92 7.04c0 5.49-4.47 9.97-9.97 9.97zm5.47-7.46c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9.07 9.07 0 0 1-1.67-2.08c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.06 2.88 1.21 3.08.15.2 2.1 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
        </svg>
        WhatsApp
      </button>
    </div>
  );
}
