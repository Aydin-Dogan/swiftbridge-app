/**
 * Dashboard.jsx — "Overzicht": het beginscherm na inloggen (bank-concept,
 * geïnspireerd op zakelijk internetbankieren, volledig SwiftBridge-huisstijl).
 *
 * Mobiel: één kolom. Desktop (xl): hoofdkolom + rechterkolom met
 * "Direct naar" en de Tijdlijn, zoals een echt bank-overzicht.
 *
 * Secties (v.b.n.b.): kop met Personaliseer, actiecirkels, Betaalrekening-
 * kaart, statistieken*, spaardoelen*, cashflow*, koers*, feestkalender*,
 * inzichten*, Direct naar, Tijdlijn, weeklimiet, beveiliging.
 * Secties met * zijn aan/uit te zetten via "Personaliseer overzicht"
 * (localStorage, per apparaat).
 *
 * Databronnen ongewijzigd: GET /transactions (+weeklimiet), GET
 * /transactions/koersen (60s), overige secties fetchen zelf.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import NotificatieInstellingen from './NotificatieInstellingen';
import TweeFactorInstellingen from './TweeFactorInstellingen';
import FeestKalender from './FeestKalender';
import { useTaal } from '../i18n';

// Dashboard subcomponents
import StatistiekCards from './dashboard/StatistiekCards';
import KoersChart from './dashboard/KoersChart';
import InsightsCard from './dashboard/InsightsCard';
import Spaardoelen from './dashboard/Spaardoelen';
import MaandOverzicht from './dashboard/MaandOverzicht';
import QuickResend from './dashboard/QuickResend';
import ActieCirkels from './dashboard/ActieCirkels';
import RekeningenCard from './dashboard/RekeningenCard';
import CashflowCard from './dashboard/CashflowCard';
import DirectNaar from './dashboard/DirectNaar';
import Tijdlijn from './dashboard/Tijdlijn';
import { Mail, Refresh, Gift, IdCard, Lock, Zap, Banknote, Settings } from './icons/Icons';

// Onboarding wizard voor nieuwe gebruikers
import OnboardingModal from './onboarding/OnboardingModal';
import TourOverlay, { moetTourTonen } from './onboarding/TourOverlay';

// App-wide announcement banners (door admin beheerd)
import BannerLijst from './banners/BannerLijst';

// API helper voor email verificatie resend
import { apiFetch, parseError } from '../services/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TX_KEY = 'swiftbridge_transacties';
const ONB_DISMISS_KEY = 'sb_onboarding_dismissed';
const VOORKEUR_KEY = 'sb_overzicht_uit';

// Bepaal of we de onboarding modal moeten tonen (zie uitleg per regel hieronder)
function moetOnboardingTonen(gebruiker) {
  if (!gebruiker) return false;
  try {
    if (localStorage.getItem(ONB_DISMISS_KEY) === '1') return false;
  } catch { /* private mode — gewoon doortonen */ }

  const aangemeld = gebruiker.aangemeldOp || gebruiker.aangemeld_op || gebruiker.createdAt || gebruiker.created_at;
  if (aangemeld) {
    const ts = new Date(aangemeld).getTime();
    if (Number.isFinite(ts)) {
      const verseAccount = (Date.now() - ts) < 24 * 60 * 60 * 1000;
      if (!verseAccount) return false;
    }
  }
  if (!aangemeld && gebruiker.kycStatus === 'goedgekeurd') return false;
  return true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function laadLokaleTransacties() {
  try { return JSON.parse(localStorage.getItem(TX_KEY) || '[]'); }
  catch { return []; }
}

function laadVoorkeuren() {
  // Feestkalender staat standaard UIT (merkregel wereldwijd — cultuurspecifieke
  // widget alleen voor wie hem bewust aanzet via Personaliseer overzicht).
  try {
    const opgeslagen = localStorage.getItem(VOORKEUR_KEY);
    if (opgeslagen == null) return new Set(['feest']);
    return new Set(JSON.parse(opgeslagen));
  } catch { return new Set(['feest']); }
}

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

// ── Weeklimiet balk ──────────────────────────────────────────────────────────
function WeeklimietBalk({ weekTotaal, weekLimiet }) {
  const { t } = useTaal();
  const pct = Math.min(100, (weekTotaal / weekLimiet) * 100);
  const resterend = Math.max(0, weekLimiet - weekTotaal);
  const barGradient = pct >= 90
    ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
    : pct >= 70
    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
    : 'linear-gradient(90deg, #10b981, #34d399)';
  const glowColor = pct >= 90 ? 'rgba(244,63,94,0.5)' : pct >= 70 ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)';

  return (
    <div className="bg-surface border border-border rounded-md shadow-soft p-4 space-y-3 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-brand-600" />
          <span className="font-display font-medium text-ink-1 text-sm">{t('weeklimiet')}</span>
        </div>
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">{t('weeklimiet_resets')}</span>
      </div>
      <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden relative">
        <div
          className="h-3 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: barGradient, boxShadow: `0 0 12px ${glowColor}` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>
          {t('weeklimiet_gebruikt_label')}{' '}
          <strong className="text-ink-1 font-display tabular-nums">{fmtEur(weekTotaal)}</strong>
        </span>
        <span>
          {t('weeklimiet_beschikbaar_label')}{' '}
          <strong className={`font-display tabular-nums ${resterend < 500 ? 'text-fg-error' : 'text-success-600'}`}>{fmtEur(resterend)}</strong>
        </span>
      </div>
      <div className="text-right text-[0.7rem] font-medium text-gray-500 uppercase tracking-[0.2em]">{t('weeklimiet_limiet', { bedrag: fmtEur(weekLimiet) })}</div>
    </div>
  );
}

// ── Email verificatie banner ─────────────────────────────────────────────────
function EmailVerificatieBanner({ email }) {
  const { t } = useTaal();
  const [laden, setLaden] = useState(false);
  const [bericht, setBericht] = useState('');
  const [ok, setOk] = useState(false);

  async function stuurOpnieuw() {
    if (!email) return;
    setLaden(true);
    setBericht('');
    setOk(false);
    try {
      const data = await apiFetch('/auth/verifieer-email/opnieuw-sturen', {
        method: 'POST',
        body: { email },
      });
      setOk(true);
      setBericht(data?.bericht || t('verify_email_resend_succes'));
    } catch (e) {
      if (e.status === 429) {
        setBericht(t('verify_email_resend_rate_limit'));
      } else {
        setBericht(parseError(e, t));
      }
    } finally {
      setLaden(false);
    }
  }

  return (
    <div role="alert" aria-live="polite"
      className="bg-surface border border-accent-400 rounded-md p-4 animate-fade-up shadow-soft">
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-md bg-accent-400/15 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <Mail className="w-5 h-5 text-accent-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-medium text-ink-1 text-sm">{t('email_banner_titel')}</div>
          <div className="text-gray-600 text-xs mt-1">{t('email_banner_uitleg', { email: email || '' })}</div>
          {bericht && (
            <div role="status" aria-live="polite"
              className={`mt-2 text-xs rounded-md px-2.5 py-2 border ${
                ok
                  ? 'text-success-700 bg-success-50 border-success-100'
                  : 'text-fg-error bg-surface border-border-error'
              }`}>
              {bericht}
            </div>
          )}
          <button onClick={stuurOpnieuw} disabled={laden}
            className="mt-3 btn-inst text-xs px-4 py-2 disabled:opacity-50">
            {laden ? `${t('laden')}` : `${t('email_banner_resend_knop')}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Personaliseer-paneel ─────────────────────────────────────────────────────
// Bank-concept "Personaliseer overzicht": optionele secties aan/uit,
// bewaard per apparaat in localStorage.
function PersonaliseerPaneel({ open, uit, onToggle, onSluit }) {
  const { t } = useTaal();
  if (!open) return null;
  const secties = [
    ['stats', t('overzicht_sectie_stats')],
    ['maand', t('overzicht_sectie_maand')],
    ['snelherhaal', t('overzicht_sectie_snelherhaal')],
    ['spaardoelen', t('overzicht_sectie_spaardoelen')],
    ['cashflow', t('overzicht_sectie_cashflow')],
    ['koers', t('overzicht_sectie_koers')],
    ['feest', t('overzicht_sectie_feest')],
    ['insights', t('overzicht_sectie_insights')],
  ];
  return (
    <div className="absolute right-0 top-9 z-40 w-64 bg-surface border border-border rounded-md shadow-soft-lg p-3 animate-fade-up"
      role="dialog" aria-label={t('overzicht_personaliseer')}>
      <div className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 mb-2">
        {t('overzicht_personaliseer')}
      </div>
      <div className="space-y-1">
        {secties.map(([id, label]) => (
          <label key={id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-2 cursor-pointer">
            <input type="checkbox" checked={!uit.has(id)} onChange={() => onToggle(id)}
              className="w-4 h-4 rounded border-border-strong text-brand-600 focus:ring-brand-300" />
            <span className="text-sm text-ink-1">{label}</span>
          </label>
        ))}
      </div>
      <button onClick={onSluit}
        className="mt-2 w-full text-center text-xs font-semibold text-brand-700 hover:underline underline-offset-4 py-1.5">
        {t('overzicht_personaliseer_klaar')}
      </button>
    </div>
  );
}

// ── Hoofdcomponent ───────────────────────────────────────────────────────────
export default function Dashboard({ gebruiker }) {
  const { t } = useTaal();
  const [koers, setKoers] = useState(null);
  const [koersGisteren, setKoersGisteren] = useState(null);
  const [ladenKoers, setLadenKoers] = useState(true);
  const [transacties, setTransacties] = useState([]);
  const [ladenTx, setLadenTx] = useState(true);
  const [weekData, setWeekData] = useState({ weekTotaal: 0, weekLimiet: 5000 });

  // Personaliseer overzicht (bank-concept): set van uitgeschakelde secties
  const [uit, setUit] = useState(laadVoorkeuren);
  const [paneelOpen, setPaneelOpen] = useState(false);
  function toggleSectie(id) {
    setUit(prev => {
      const kopie = new Set(prev);
      if (kopie.has(id)) kopie.delete(id); else kopie.add(id);
      try { localStorage.setItem(VOORKEUR_KEY, JSON.stringify([...kopie])); } catch {}
      return kopie;
    });
  }

  // Onboarding modal — toon één keer voor verse accounts
  const [onboardingOpen, setOnboardingOpen] = useState(() => moetOnboardingTonen(gebruiker));
  useEffect(() => {
    if (moetOnboardingTonen(gebruiker)) setOnboardingOpen(true);
  }, [gebruiker]);
  function sluitOnboarding() {
    try { localStorage.setItem(ONB_DISMISS_KEY, '1'); } catch {}
    setOnboardingOpen(false);
    if (moetTourTonen()) setTourOpen(true);
  }

  // Tour overlay (Verbetering BB)
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    if (!onboardingOpen && moetTourTonen() && gebruiker?.id) {
      const timer = setTimeout(() => setTourOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [onboardingOpen, gebruiker?.id]);

  // Live koers ophalen via backend (60s polling)
  const haalKoers = useCallback(async () => {
    setLadenKoers(true);
    try {
      const res = await fetch(`${API}/transactions/koersen`, { credentials: 'include' });
      const json = await res.json();
      if (json.koersen?.TRY) {
        setKoers(prev => {
          if (prev != null && prev !== json.koersen.TRY) setKoersGisteren(prev);
          return json.koersen.TRY;
        });
      }
    } catch { /* gebruik laatste bekende koers */ }
    finally { setLadenKoers(false); }
  }, []);

  // Transacties ophalen — cookie auth via credentials:'include'
  const haalTransacties = useCallback(async () => {
    setLadenTx(true);
    try {
      const res = await fetch(`${API}/transactions`, { credentials: 'include' });
      if (!res.ok) throw new Error('Niet ingelogd');
      const json = await res.json();
      setTransacties(json.transacties || []);
      setWeekData({
        weekTotaal: json.weekTotaal || 0,
        weekLimiet: json.weekLimiet || 5000,
      });
    } catch {
      setTransacties(laadLokaleTransacties());
    } finally {
      setLadenTx(false);
    }
  }, []);

  useEffect(() => {
    haalKoers();
    const id = setInterval(haalKoers, 60_000);
    return () => clearInterval(id);
  }, [haalKoers]);

  useEffect(() => {
    haalTransacties();
    const handler = () => haalTransacties();
    window.addEventListener('swiftbridge_tx_update', handler);
    return () => window.removeEventListener('swiftbridge_tx_update', handler);
  }, [haalTransacties]);

  const kycGoedgekeurd = gebruiker?.kycStatus === 'goedgekeurd';

  function vernieuwAlles() {
    haalKoers();
    haalTransacties();
  }

  // Totale besparing voor InsightsCard (mock: 2% van alle overgemaakte bedragen)
  const totaalBesparing = useMemo(
    () =>
      transacties
        .filter(tx => !['mislukt', 'geannuleerd'].includes(tx.status))
        .reduce((s, tx) => s + (tx.eurBedrag || 0) * 0.02, 0),
    [transacties]
  );

  return (
    <div className="space-y-4">
      <OnboardingModal gebruiker={gebruiker} open={onboardingOpen} onDismiss={sluitOnboarding} />
      <TourOverlay open={tourOpen} onSluit={() => setTourOpen(false)} />

      {gebruiker?.emailGeverifieerd === false && (
        <EmailVerificatieBanner email={gebruiker?.email} />
      )}
      <BannerLijst />

      {/* Kop: Overzicht + vernieuwen + Personaliseer (bank-concept) */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink-1">{t('overzicht_titel')}</h1>
        <div className="flex items-center gap-1 relative">
          <button onClick={vernieuwAlles} aria-label={t('overzicht_vernieuw_aria')}
            className="w-9 h-9 rounded-md hover:bg-surface flex items-center justify-center text-ink-2 transition">
            <Refresh className="w-4 h-4" aria-hidden="true" />
          </button>
          <button onClick={() => setPaneelOpen(o => !o)} aria-expanded={paneelOpen}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-ink-1 px-2 py-2 rounded-md hover:bg-surface transition">
            {t('overzicht_personaliseer')} <Settings className="w-4 h-4" aria-hidden="true" />
          </button>
          <PersonaliseerPaneel open={paneelOpen} uit={uit} onToggle={toggleSectie} onSluit={() => setPaneelOpen(false)} />
        </div>
      </div>

      {/* Welkomst-deal — eerste transactie gratis */}
      {gebruiker?.gratisEersteTx && kycGoedgekeurd && (
        <div className="bg-surface border border-accent-400 rounded-md p-4 shadow-soft animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-accent-400/15 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <Gift className="w-7 h-7 text-accent-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-medium text-sm text-ink-1">Welkomst-deal: 1e transactie GRATIS!</div>
              <div className="text-xs text-gray-600 mt-0.5">Geen servicekosten op je eerste overboeking (tot €800)</div>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))}
            className="btn-inst w-full mt-3 py-2.5 text-sm"
          >
            Verstuur je eerste gratis transactie →
          </button>
        </div>
      )}

      {/* KYC waarschuwing */}
      {!kycGoedgekeurd && (
        <div role="alert"
          className="bg-surface border border-accent-400 rounded-md shadow-soft p-4 flex gap-3 items-start animate-fade-up">
          <IdCard className="w-6 h-6 text-accent-600 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <div className="font-display font-medium text-ink-1 text-sm">{t('dashboard_kyc_vereist')}</div>
            <div className="text-gray-600 text-xs mt-1">{t('dashboard_kyc_uitleg')}</div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'kyc' }))}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline underline-offset-4 focus:outline-none focus:underline"
            >
              {t('kyc_titel')} →
            </button>
          </div>
        </div>
      )}

      {/* Actiecirkels */}
      <ActieCirkels />

      {/* Desktop: hoofdkolom + rechterkolom (Direct naar + Tijdlijn) */}
      <div className="xl:grid xl:grid-cols-[1fr_21rem] xl:gap-4 xl:items-start space-y-4 xl:space-y-0">
        <div className="space-y-4">
          <RekeningenCard gebruiker={gebruiker} transacties={transacties} laden={ladenTx} />

          {!uit.has('stats') && <StatistiekCards transacties={transacties} laden={ladenTx} />}
          {!uit.has('maand') && <MaandOverzicht transacties={transacties} />}
          {!uit.has('snelherhaal') && <QuickResend transacties={transacties} />}
          {!uit.has('spaardoelen') && <Spaardoelen />}
          {!uit.has('cashflow') && <CashflowCard transacties={transacties} laden={ladenTx} />}
          {!uit.has('koers') && <KoersChart koers={koers} laden={ladenKoers} />}
          {!uit.has('feest') && kycGoedgekeurd && (
            <FeestKalender onOvermaken={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))} />
          )}
          {!uit.has('insights') && (
            <InsightsCard koers={koers} koersGisteren={koersGisteren} totaalBesparing={totaalBesparing} />
          )}

          {kycGoedgekeurd && (
            <WeeklimietBalk weekTotaal={weekData.weekTotaal} weekLimiet={weekData.weekLimiet} />
          )}

          {/* Beveiliging — 2FA + Notificaties */}
          <div className="space-y-3 pt-2">
            <h3 className="font-display font-medium text-ink-1 text-sm px-1 flex items-center gap-2">
              <Lock className="w-4 h-4" aria-hidden="true" /> Beveiliging
            </h3>
            <TweeFactorInstellingen token="cookie" twofaIngeschakeld={!!gebruiker?.twofaIngeschakeld} />
          </div>
          {kycGoedgekeurd && <NotificatieInstellingen token="cookie" />}

          {/* Info balk — vertrouwenssignalen */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            {[
              { Icoon: Zap,      tekst: '< 5 min aankomst',           kleur: 'text-brand-600' },
              { Icoon: Lock,     tekst: 'Veilig via licentiepartner', kleur: 'text-success-600' },
              { Icoon: Banknote, tekst: '2,0–2,5% alles-in',          kleur: 'text-accent-600' },
            ].map(({ Icoon, tekst, kleur }) => (
              <div key={tekst} className="bg-surface rounded-md border border-border shadow-soft p-3">
                <div className={`flex justify-center mb-1 ${kleur}`} aria-hidden="true">
                  <Icoon className="w-5 h-5" />
                </div>
                <div className="text-xs text-gray-500 font-medium">{tekst}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rechterkolom: Direct naar + Tijdlijn */}
        <div className="space-y-4">
          <DirectNaar />
          <section className="rounded-md border border-border bg-surface shadow-soft overflow-hidden"
            aria-label={t('tijdlijn_titel')}>
            <div className="px-4 py-3 border-b border-border-subtle">
              <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600">
                {t('tijdlijn_titel')}
              </h3>
            </div>
            <Tijdlijn transacties={transacties} laden={ladenTx} limiet={8} toonVoet kaal />
          </section>
        </div>
      </div>
    </div>
  );
}
