/**
 * Dashboard.jsx — Premium dashboard voor SwiftBridge
 *
 * Layout (van boven naar beneden):
 * 1. SaldoCard — welcome header met KYC status pill
 * 2. Welkomst-deal — gratis eerste transactie banner (indien van toepassing)
 * 3. KYC waarschuwing — als KYC nog niet goedgekeurd is
 * 4. StatistiekCards — 4 hero stat boxes (deze maand)
 * 5. QuickActions — 3 CTA knoppen
 * 6. KoersChart — EUR→TRY live + sparkline 7d
 * 7. FeestKalender — Bayram/Ramadan herinneringen (alleen na KYC)
 * 8. RecentTransacties — laatste 5 transacties met badge + detail modal
 * 9. InsightsCard — "Wist je dat?" tip rotatie
 * 10. WeeklimietBalk — alleen na KYC
 * 11. 2FA + Notificaties — beveiliging & instellingen
 *
 * Behoudt:
 * - a11y verbeteringen vorige polish ronde (refresh aria-label, 44px touch,
 * lege-state CTA, KYC waarschuwing)
 * - Live FX via /transactions/koersen elke 60s
 * - Transactiehistorie via /transactions met credentials:'include' (cookie auth)
 * - localStorage fallback
 * - Custom event 'swiftbridge_navigate' voor in-app navigatie
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificatieInstellingen from './NotificatieInstellingen';
import TweeFactorInstellingen from './TweeFactorInstellingen';
import FeestKalender from './FeestKalender';
import { useTaal } from '../i18n';

// Dashboard subcomponents (premium redesign)
import SaldoCard from './dashboard/SaldoCard';
import StatistiekCards from './dashboard/StatistiekCards';
import QuickActions from './dashboard/QuickActions';
import KoersChart from './dashboard/KoersChart';
import RecentTransacties from './dashboard/RecentTransacties';
import InsightsCard from './dashboard/InsightsCard';
import Spaardoelen from './dashboard/Spaardoelen';
import MaandOverzicht from './dashboard/MaandOverzicht';
import QuickResend from './dashboard/QuickResend';
import { Mail, Refresh, Gift, IdCard, Lock, Zap, Banknote } from './icons/Icons';

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

// Bepaal of we de onboarding modal moeten tonen.
// Voorwaarden:
// - gebruiker.aangemeldOp < 24u geleden (verse accounts)
// - kycStatus !== 'goedgekeurd' (KYC nudge nog relevant) OF nog niet dismissed
// - localStorage 'sb_onboarding_dismissed' niet gezet
// Robust voor missende `aangemeldOp` op de backend: als veld ontbreekt vallen we
// terug op alleen de KYC-staat zodat we de wizard niet voor elke bestaande
// gebruiker forceren te zien.
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
    // Als de timestamp aanwezig maar onparseerbaar is, toon toch — dismiss-flag
    // is dan de enige stop. Dit voorkomt dat een verkeerde datum de wizard verbergt.
  }
  // Geen aangemeld-datum bekend? Toon enkel zolang KYC niet voltooid is — dan
  // weten we redelijk zeker dat de gebruiker nog in het onboarding-traject zit.
  if (!aangemeld && gebruiker.kycStatus === 'goedgekeurd') return false;
  return true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function laadLokaleTransacties() {
  try { return JSON.parse(localStorage.getItem(TX_KEY) || '[]'); }
  catch { return []; }
}

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

// ── Weeklimiet balk (behouden van oude versie) ───────────────────────────────
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
          style={{
            width: `${pct}%`,
            background: barGradient,
            boxShadow: `0 0 12px ${glowColor}`,
          }}
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
// Toont bovenaan dashboard als gebruiker.emailGeverifieerd === false.
// Niet dismissible — gebruiker moet email verifiëren om te kunnen overmaken.
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
    <div
      role="alert"
      aria-live="polite"
      className="bg-surface border border-accent-400 rounded-md p-4 animate-fade-up shadow-soft"
    >
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-md bg-accent-400/15 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <Mail className="w-5 h-5 text-accent-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-medium text-ink-1 text-sm">
            {t('email_banner_titel')}
          </div>
          <div className="text-gray-600 text-xs mt-1">
            {t('email_banner_uitleg', { email: email || '' })}
          </div>
          {bericht && (
            <div
              role="status"
              aria-live="polite"
              className={`mt-2 text-xs rounded-md px-2.5 py-2 border ${
                ok
                  ? 'text-success-700 bg-success-50 border-success-100'
                  : 'text-fg-error bg-surface border-border-error'
              }`}
            >
              {ok ? '' : ''}
              {bericht}
            </div>
          )}
          <button
            onClick={stuurOpnieuw}
            disabled={laden}
            className="mt-3 btn-inst text-xs px-4 py-2 disabled:opacity-50"
          >
            {laden ? `${t('laden')}` : `${t('email_banner_resend_knop')}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Terugkerend (recurring) badge / link ─────────────────────────────────────
// Klein kaartje onder de QuickActions dat het aantal actieve recurring
// schedules toont en navigeert naar /app/recurring. Wordt verborgen totdat
// de gebruiker KYC heeft (anders ziet hij toch een 403 op die pagina).
function RecurringBadge() {
  const { t } = useTaal();
  const navigate = useNavigate();
  const [aantal, setAantal] = useState(null);

  useEffect(() => {
    let geannuleerd = false;
    apiFetch('/recurring')
      .then(d => { if (!geannuleerd) setAantal(d?.actief ?? 0); })
      .catch(() => { if (!geannuleerd) setAantal(0); });
    return () => { geannuleerd = true; };
  }, []);

  return (
    <button
      type="button"
      onClick={() => navigate('/app/recurring')}
      className="w-full bg-surface border border-border rounded-md p-4 text-left shadow-soft hover:shadow-soft-md transition flex items-center gap-3 animate-fade-up"
    >
      <span className="flex-shrink-0 w-11 h-11 rounded-md bg-brand-50 flex items-center justify-center" aria-hidden="true">
        <Refresh className="w-5 h-5 text-brand-600" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-display font-medium text-sm text-ink-1 leading-tight">
          {t('dashboard_recurring_titel')}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {aantal == null
            ? t('dashboard_recurring_subtitel_laden')
            : aantal === 0
              ? t('dashboard_recurring_subtitel_leeg')
              : t('dashboard_recurring_subtitel_n', { n: aantal })}
        </div>
      </div>
      <span className="text-lg flex-shrink-0 text-gray-400" aria-hidden="true">→</span>
    </button>
  );
}

// ── Hoofdcomponent ───────────────────────────────────────────────────────────
export default function Dashboard({ gebruiker }) {
  const { t } = useTaal();
  const [koers, setKoers ] = useState(null);
  const [koersGisteren, setKoersGisteren] = useState(null);
  const [ladenKoers, setLadenKoers ] = useState(true);
  const [transacties, setTransacties ] = useState([]);
  const [ladenTx, setLadenTx ] = useState(true);
  const [weekData, setWeekData ] = useState({ weekTotaal: 0, weekLimiet: 5000 });

  // Onboarding modal — toon één keer voor verse accounts die nog niet door KYC heen zijn
  const [onboardingOpen, setOnboardingOpen] = useState(() => moetOnboardingTonen(gebruiker));
  useEffect(() => {
    // Herevalueer wanneer de gebruiker-data binnenkomt (login flow)
    if (moetOnboardingTonen(gebruiker)) setOnboardingOpen(true);
  }, [gebruiker]);
  function sluitOnboarding() {
    try { localStorage.setItem(ONB_DISMISS_KEY, '1'); } catch {}
    setOnboardingOpen(false);
    // Tour-overlay direct hierna tonen — 1× automatisch (Verbetering BB)
    if (moetTourTonen()) setTourOpen(true);
  }

  // Tour overlay state (Verbetering BB) — 5-staps bottom-nav uitleg
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    // Toon tour ook als wizard al weg is maar tour nog niet — bv. herhaalde
    // bezoekers die wizard al hadden gesloten vóór BB werd uitgerold.
    // Maar NIET tegelijk met wizard (kan dubbele overlay geven).
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
          // Bewaar vorige koers als "gisteren" benadering (eerste keer = null)
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
      // Fallback op localStorage zodat dashboard nooit leeg blijft bij netwerkfout
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
      {/* Onboarding wizard voor verse accounts — 1x dismissibel via localStorage */}
      <OnboardingModal
        gebruiker={gebruiker}
        open={onboardingOpen}
        onDismiss={sluitOnboarding}
      />

      {/* Tour-overlay (Verbetering BB) — 5-staps uitleg bottom-nav.
          Toont 1× automatisch na wizard, opnieuw via "Tour herstarten" in Profiel. */}
      <TourOverlay open={tourOpen} onSluit={() => setTourOpen(false)} />

      {/* Email verificatie banner — niet dismissible, blokkeert overboeking-flow */}
      {gebruiker?.emailGeverifieerd === false && (
        <EmailVerificatieBanner email={gebruiker?.email} />
      )}

      {/* App-wide banners (admin-gedreven, dismissible per gebruiker) */}
      <BannerLijst />

      {/* 1. Welcome header met KYC status pill */}
      <SaldoCard gebruiker={gebruiker} onVernieuw={vernieuwAlles} />

      {/* 2. Welkomst-deal — eerste transactie gratis */}
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

      {/* 3. KYC waarschuwing (a11y behouden uit polish ronde) */}
      {!kycGoedgekeurd && (
        <div
          role="alert"
          className="bg-surface border border-accent-400 rounded-md shadow-soft p-4 flex gap-3 items-start animate-fade-up"
        >
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

      {/* 4. Stats hero — 4 boxes deze maand */}
      <StatistiekCards transacties={transacties} laden={ladenTx} />

      {/* MaandOverzicht widget (Verbetering EEE) — verbergt zichzelf als
          0 voltooide transacties. Hergebruikt al-opgehaalde transacties prop. */}
      <MaandOverzicht transacties={transacties} />

      {/* QuickResend (Verbetering PPP) — 3 laatste ontvangers voor 1-tap
          herhaal-overboeking. Verbergt zichzelf als <2 voltooide transacties. */}
      <QuickResend transacties={transacties} />

      {/* 5. Quick Actions */}
      <QuickActions />

      {/* 5b. Terugkerende overboekingen link (alleen voor KYC-goedgekeurde users) */}
      {kycGoedgekeurd && <RecurringBadge />}

      {/* 6. Live koers met sparkline */}
      <KoersChart koers={koers} laden={ladenKoers} />

      {/* 7. Culturele kalender — alleen na KYC */}
      {kycGoedgekeurd && (
        <FeestKalender onOvermaken={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))} />
      )}

      {/* 8. Recente transacties (incl. lege-state CTA) */}
      <RecentTransacties transacties={transacties} laden={ladenTx} />

      {/* Spaardoelen (Verbetering AAA) — user-defined savings goals
          met progress-bar, deadline-countdown en suggested bijdrage. */}
      <Spaardoelen />

      {/* 9. Insights / Tips */}
      <InsightsCard
        koers={koers}
        koersGisteren={koersGisteren}
        totaalBesparing={totaalBesparing}
      />

      {/* 10. Weeklimiet — alleen na KYC */}
      {kycGoedgekeurd && (
        <WeeklimietBalk
          weekTotaal={weekData.weekTotaal}
          weekLimiet={weekData.weekLimiet}
        />
      )}

      {/* 11. Beveiliging — 2FA + Notificaties */}
      <div className="space-y-3 pt-2">
        <h3 className="font-display font-medium text-ink-1 text-sm px-1 flex items-center gap-2">
          <Lock className="w-4 h-4" aria-hidden="true" /> Beveiliging
        </h3>
        <TweeFactorInstellingen
          token="cookie"
          twofaIngeschakeld={!!gebruiker?.twofaIngeschakeld}
        />
      </div>

      {kycGoedgekeurd && <NotificatieInstellingen token="cookie" />}

      {/* Info balk — vertrouwenssignalen */}
      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        {[
          { Icoon: Zap,      tekst: '< 5 min aankomst',         kleur: 'text-brand-600' },
          { Icoon: Lock,     tekst: 'Veilig via licentiepartner', kleur: 'text-success-600' },
          { Icoon: Banknote, tekst: '2,0–2,5% alles-in',         kleur: 'text-accent-600' },
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
  );
}
