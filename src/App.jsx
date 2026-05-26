import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LiveKoersTicker from './components/LiveKoersTicker';
import Landing from './pages/Landing';
import Login from './pages/Login';
import TaalKiezer from './components/TaalKiezer';
import OfflineBanner from './components/OfflineBanner';
import MaintenanceBanner from './components/MaintenanceBanner';
import SupportChat from './components/chat/SupportChat';
import ErrorBoundary from './components/ErrorBoundary';
import { useTaal } from './i18n';
import { haalProfiel, logout as logoutApi } from './services/api';

// Lazy load zware paginas (code splitting)
const PaymentFlow         = lazy(() => import('./components/PaymentFlow'));
const KYCFlow             = lazy(() => import('./components/KYCFlow'));
const Calculator          = lazy(() => import('./pages/Calculator'));
const KoersAlerts         = lazy(() => import('./components/KoersAlerts'));
const Profiel             = lazy(() => import('./components/Profiel'));
const AlgemeneVoorwaarden = lazy(() => import('./pages/AlgemeneVoorwaarden'));
const Privacybeleid       = lazy(() => import('./pages/Privacybeleid'));
const AMLBeleid           = lazy(() => import('./pages/AMLBeleid'));
const AdminPanel          = lazy(() => import('./pages/AdminPanel'));
const AdminCompliance     = lazy(() => import('./pages/AdminCompliance'));
const VerifyEmail         = lazy(() => import('./pages/VerifyEmail'));
const Recurring           = lazy(() => import('./pages/Recurring'));

// SEO landings (Sprint 3 deel 2) — long-tail Google traffic per query.
// Code-split zodat ze geen bundle-size toevoegen aan de hoofdroute.
const SeoWiseAlternatief    = lazy(() => import('./pages/seo/WiseAlternatief'));
const SeoWiseVsSwiftbridge  = lazy(() => import('./pages/seo/WiseVsSwiftbridge'));
const SeoGarantiOverboeking = lazy(() => import('./pages/seo/GarantiOverboeking'));
const SeoPaparaYukleme      = lazy(() => import('./pages/seo/PaparaYukleme'));
const SeoBayramRemittance   = lazy(() => import('./pages/seo/BayramRemittance'));
const NotFound              = lazy(() => import('./pages/NotFound'));
const LocaleLanding         = lazy(() => import('./pages/LocaleLanding'));
const Status                = lazy(() => import('./pages/Status'));
const AdminErrors           = lazy(() => import('./pages/AdminErrors'));

// Loading spinner voor lazy loaded routes
function LaadSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
    </div>
  );
}

// ── Detecteer iOS ────────────────────────────────────────────────────────────
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}
function isInStandaloneMode() {
  return window.navigator.standalone === true;
}

// ── PWA Install Banner (Verbetering AA) ───────────────────────────────────────
// Verbeteringen:
//   - Toont pas vanaf 2e bezoek (minder opdringerig, geen "instant pitch")
//   - 3-voordelen lijst legt de waarde uit (sneller, offline, push)
//   - i18n via useTaal() — alle 5 talen
//   - "Niet nu" / "Niet meer vragen" twee-trap dismissal
function InstallBanner() {
  const { t } = useTaal();
  const [prompt, setPrompt] = useState(null);
  const [toonAndroid, setToonAndroid] = useState(false);
  const [toonIOS, setToonIOS] = useState(false);

  useEffect(() => {
    // Tel bezoeken — alleen tonen vanaf 2e bezoek voor minder opdringerig
    let bezoekCount = parseInt(localStorage.getItem('swiftbridge_bezoek_count') || '0', 10);
    bezoekCount += 1;
    try {
      localStorage.setItem('swiftbridge_bezoek_count', String(bezoekCount));
    } catch {/* ignored */}

    const permanentVerborgen = localStorage.getItem('swiftbridge_install_permanent_verborgen') === '1';
    const sessieVerborgen = sessionStorage.getItem('swiftbridge_install_verborgen') === '1';
    const minimaalBezoek = bezoekCount >= 2;
    const magTonen = minimaalBezoek && !permanentVerborgen && !sessieVerborgen;

    // Android / Chrome: beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      if (magTonen) setToonAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari: toon handmatige instructie als niet al geïnstalleerd
    if (isIOS() && !isInStandaloneMode() && magTonen) {
      setToonIOS(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function verberg(permanent = false) {
    if (permanent) {
      try { localStorage.setItem('swiftbridge_install_permanent_verborgen', '1'); } catch {/* ignored */}
    } else {
      try { sessionStorage.setItem('swiftbridge_install_verborgen', '1'); } catch {/* ignored */}
    }
    setToonAndroid(false);
    setToonIOS(false);
  }

  async function installeer() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setToonAndroid(false);
      try { localStorage.setItem('swiftbridge_install_permanent_verborgen', '1'); } catch {/* ignored */}
    }
  }

  // Voordelen-lijst — hergebruikt door beide platforms
  function Voordelen() {
    return (
      <ul className="space-y-1.5 text-xs">
        <li className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-300" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          {t('install_voordeel_snel')}
        </li>
        <li className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-300" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          {t('install_voordeel_push')}
        </li>
        <li className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-300" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          {t('install_voordeel_offline')}
        </li>
      </ul>
    );
  }

  // Android/Chrome banner — bottom-sheet stijl met voordelen
  if (toonAndroid && prompt) {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[100] bg-gray-900 text-white rounded-2xl shadow-2xl p-4 border border-gray-700 max-w-md mx-auto">
        <div className="flex items-start gap-3 mb-3">
          <img src="/icon-192.png" alt="" width="40" height="40" className="rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{t('install_android_titel')}</p>
            <p className="text-gray-400 text-xs mt-0.5">{t('install_android_subtitel')}</p>
          </div>
          <button
            onClick={() => verberg(false)}
            className="text-gray-500 hover:text-white text-xl leading-none flex-shrink-0"
            aria-label={t('install_sluit')}
          >
            ✕
          </button>
        </div>
        <Voordelen />
        <div className="flex gap-2 mt-4">
          <button
            onClick={installeer}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-xl transition active:scale-95"
          >
            {t('install_installeer')}
          </button>
          <button
            onClick={() => verberg(true)}
            className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2"
          >
            {t('install_niet_meer')}
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari banner met stap-voor-stap uitleg
  if (toonIOS) {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[100] bg-gray-900 text-white rounded-2xl shadow-2xl p-4 border border-gray-700 max-w-md mx-auto">
        <div className="flex items-start gap-3 mb-3">
          <img src="/icon-192.png" alt="" width="40" height="40" className="rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{t('install_ios_titel')}</p>
            <p className="text-gray-400 text-xs mt-0.5">{t('install_ios_subtitel')}</p>
          </div>
          <button
            onClick={() => verberg(false)}
            className="text-gray-500 hover:text-white text-xl leading-none flex-shrink-0"
            aria-label={t('install_sluit')}
          >
            ✕
          </button>
        </div>
        <Voordelen />
        <div className="space-y-2 mt-4 pt-3 border-t border-gray-700">
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
            <p className="text-xs text-gray-300">{t('install_ios_stap1')}</p>
          </div>
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
            <p className="text-xs text-gray-300">{t('install_ios_stap2')}</p>
          </div>
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
            <p className="text-xs text-gray-300">{t('install_ios_stap3')}</p>
          </div>
        </div>
        <button
          onClick={() => verberg(true)}
          className="text-xs text-gray-500 hover:text-gray-300 mt-3 underline"
        >
          {t('install_niet_meer')}
        </button>
      </div>
    );
  }

  return null;
}

function AppShell({ gebruiker, token, onLogout }) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onClickOutside = (e) => {
      if (!e.target.closest('#account-menu-wrap')) setAccountMenuOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setAccountMenuOpen(false); };
    document.addEventListener('click', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [accountMenuOpen]);
  const [actief, setActief] = useState('dashboard');
  const navigate = useNavigate();
  const { t } = useTaal();

  // Luister naar interne navigatie events (bijv. van FeestKalender)
  useEffect(() => {
    const handler = (e) => {
      if (['dashboard', 'betaling', 'kyc'].includes(e.detail)) setActief(e.detail);
    };
    window.addEventListener('swiftbridge_navigate', handler);
    return () => window.removeEventListener('swiftbridge_navigate', handler);
  }, []);

  const tabs = [
    { id: 'dashboard', label: t('tab_dashboard'),    icoon: '📊' },
    { id: 'betaling',  label: t('tab_overmaken'),    icoon: '💸' },
    { id: 'alerts',    label: t('tab_alerts'),       icoon: '🔔' },
    { id: 'profiel',   label: t('tab_profiel'),      icoon: '👤' },
    { id: 'kyc',       label: t('tab_verificatie'),  icoon: '🪪' },
  ];

  const kycGoedgekeurd = gebruiker?.kycStatus === 'goedgekeurd';

  return (
    <div className="min-h-screen bg-slate-100">
      <LiveKoersTicker />
      <InstallBanner />
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img
              src="/icon-192.png"
              alt="SwiftBridge"
              className="w-9 h-9 rounded-xl shadow-sm"
              width="36"
              height="36"
              decoding="async"
              fetchpriority="high"
            />
            <div>
              <h1 className="text-base font-extrabold text-gray-900 leading-none">SwiftBridge</h1>
              <p className="text-xs text-blue-600 font-medium">NL → TR in &lt;5 min</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {!kycGoedgekeurd && (
              <button onClick={() => setActief('kyc')}
                aria-label="KYC verificatie nog vereist - klik om te starten"
                className="text-xs bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-800 font-semibold px-3 py-2 min-h-[36px] rounded-full transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 inline-flex items-center gap-1">
                <span aria-hidden="true">⚠️</span> KYC
              </button>
            )}
            <TaalKiezer />
            <div id="account-menu-wrap" className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setAccountMenuOpen(o => !o); }}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full flex items-center justify-center text-white text-sm font-bold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Account menu"
                aria-expanded={accountMenuOpen}
              >
                {gebruiker?.naam?.[0]?.toUpperCase() || 'G'}
              </button>
              {accountMenuOpen && (
                <div
                  className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 w-60 p-2 z-50 animate-fade-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-3 border-b border-gray-100 mb-1">
                    <p className="font-semibold text-sm text-gray-800 truncate">{gebruiker?.naam}</p>
                    <p className="text-xs text-gray-400 truncate">{gebruiker?.email}</p>
                  </div>
                  <button
                    onClick={() => { setAccountMenuOpen(false); setActief('profiel'); }}
                    className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 px-3 py-2.5 rounded-lg font-medium flex items-center gap-2"
                  >
                    <span>👤</span> {t('tab_profiel')}
                  </button>
                  <button
                    onClick={() => { setAccountMenuOpen(false); onLogout(); }}
                    className="w-full text-left text-sm text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-lg font-medium flex items-center gap-2 mt-1"
                  >
                    <span>🚪</span> {t('uitloggen')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Inhoud */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-28">
        <Suspense fallback={<LaadSpinner />}>
          {actief === 'dashboard' && <Dashboard gebruiker={gebruiker} />}
          {actief === 'betaling' && (
            kycGoedgekeurd
              ? <PaymentFlow token={token} />
              : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">🪪</div>
                  <h3 className="font-bold text-gray-800 mb-2">KYC verificatie vereist</h3>
                  <p className="text-gray-500 text-sm mb-4">Je moet eerst je identiteit verifiëren voordat je geld kunt overmaken.</p>
                  <button onClick={() => setActief('kyc')}
                    className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition text-sm">
                    Verificatie starten →
                  </button>
                </div>
              )
          )}
          {actief === 'alerts' && <KoersAlerts token={token} />}
          {actief === 'profiel' && <Profiel token={token} gebruiker={gebruiker} />}
          {actief === 'kyc' && <KYCFlow token={token} gebruiker={gebruiker} />}
        </Suspense>
      </main>

      {/* Bottom navigatie — mobiel geoptimaliseerd */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActief(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 px-1 transition active:scale-95
                ${actief === tab.id ? 'text-blue-600' : 'text-gray-400'}`}>
              <span className={`text-2xl transition-transform ${actief === tab.id ? 'scale-110' : ''}`}>
                {tab.icoon}
              </span>
              <span className={`text-xs font-medium mt-0.5 ${actief === tab.id ? 'text-blue-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
              {actief === tab.id && <div className="w-4 h-0.5 bg-blue-600 rounded-full mt-1" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ProtectedRoute({ token, gebruiker, onLogout, children }) {
  if (!token) return <Navigate to="/login" replace />;
  return <AppShell token={token} gebruiker={gebruiker} onLogout={onLogout} />;
}

// ── Referral redirect: /r/:code → /login?tab=register&ref=:code ──
// Hierdoor werken gedeelde links zoals https://swiftbridge.app/r/ABCD1234
function ReferralRedirect() {
  const { code } = useParams();
  const safe = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  return <Navigate to={`/login?tab=register&ref=${encodeURIComponent(safe)}`} replace />;
}

// Sentinel: andere componenten ontvangen `token` als prop. Met de httpOnly cookie
// is er geen leesbare token-string meer, maar we willen die props niet wijzigen
// (out of scope). Een truthy placeholder houdt `if (token)`-checks elders heel —
// downstream fetch calls sturen straks gewoon `credentials: 'include'`.
const TOKEN_SENTINEL = 'cookie';

export default function App() {
  // `gebruiker === null` = uitgelogd, `gebruiker === undefined` = nog niet gecheckt
  const [gebruiker, setGebruiker] = useState(undefined);
  const token = gebruiker ? TOKEN_SENTINEL : null;

  // Bij opstarten: vraag /auth/me — als 401, dan niet ingelogd
  useEffect(() => {
    // Eenmalige opruimactie: oude tokens uit localStorage verwijderen.
    try {
      localStorage.removeItem('sb_token');
      localStorage.removeItem('sb_refresh');
      localStorage.removeItem('sb_gebruiker');
    } catch {}

    let geannuleerd = false;
    haalProfiel()
      .then(g => {
        if (geannuleerd) return;
        setGebruiker(g && g.id ? g : null);
      })
      .catch(() => { if (!geannuleerd) setGebruiker(null); });
    return () => { geannuleerd = true; };
  }, []);

  function handleLogin(_t, g) {
    // Token kwam mee in body voor backward compat — negeren, cookie is leidend.
    setGebruiker(g);
  }

  function handleLogout() {
    // Vertel server dat refresh token ingetrokken moet worden (cookie wordt server-side gewist)
    logoutApi();
    setGebruiker(null);
  }

  // Toon spinner terwijl /auth/me nog loopt — voorkomt flash van /login bij refresh
  if (gebruiker === undefined) {
    return (
      <BrowserRouter>
        <OfflineBanner />
      <MaintenanceBanner />
        <LaadSpinner />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <OfflineBanner />
      <MaintenanceBanner />
      {/* Globale ErrorBoundary (Verbetering N) — vangt uncaught JS errors per
          route op zodat we nooit een white screen tonen. Errors loggen naar
          /errors/frontend in productie + console in dev. */}
      <ErrorBoundary>
      <Suspense fallback={<LaadSpinner />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          {/* Multi-locale landing routes (Verbetering F) — voor hreflang SEO.
              /tr/, /nl/, /en/, /ru/, /az/ renderen allemaal Landing met geforceerde
              taal. Subpages (/calculator, /wise-alternatief, etc.) blijven mono-route. */}
          {['nl', 'tr', 'en', 'ru', 'az'].map(loc => (
            <Route
              key={loc}
              path={`/${loc}`}
              element={
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Laden...</div>}>
                  <LocaleLanding />
                </Suspense>
              }
            />
          ))}
          <Route path="/calculator" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Bezig met laden...</div>}>
              <Calculator />
            </Suspense>
          } />

          {/* SEO landings — public, no auth */}
          <Route path="/wise-alternatief" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Laden...</div>}>
              <SeoWiseAlternatief />
            </Suspense>
          } />
          <Route path="/wise-vs-swiftbridge" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Laden...</div>}>
              <SeoWiseVsSwiftbridge />
            </Suspense>
          } />
          <Route path="/garanti-overboeking" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Laden...</div>}>
              <SeoGarantiOverboeking />
            </Suspense>
          } />
          <Route path="/papara-yukleme" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Laden...</div>}>
              <SeoPaparaYukleme />
            </Suspense>
          } />
          <Route path="/bayram-remittance" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Laden...</div>}>
              <SeoBayramRemittance />
            </Suspense>
          } />
          <Route path="/login" element={
            token ? <Navigate to="/app" replace /> :
            <Login onLogin={handleLogin} />
          } />
          <Route path="/app" element={
            <ProtectedRoute token={token} gebruiker={gebruiker} onLogout={handleLogout}>
              <AppShell token={token} gebruiker={gebruiker} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/app/recurring" element={
            token ? <Recurring /> : <Navigate to="/login" replace />
          } />
          <Route path="/r/:code" element={<ReferralRedirect />} />
          <Route path="/verifieer-email" element={<VerifyEmail />} />
          <Route path="/algemene-voorwaarden" element={<AlgemeneVoorwaarden />} />
          <Route path="/privacybeleid" element={<Privacybeleid />} />
          <Route path="/aml-beleid" element={<AMLBeleid />} />
          {/* Publieke status page (Verbetering L) — bouwt vertrouwen, live healthchecks */}
          <Route path="/status" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Laden...</div>}>
              <Status />
            </Suspense>
          } />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/compliance" element={
            token ? <AdminCompliance /> : <Navigate to="/login" replace />
          } />
          {/* Admin errors viewer (Verbetering Z) — hangt aan U backend endpoint */}
          <Route path="/admin/errors" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Laden...</div>}>
              <AdminErrors />
            </Suspense>
          } />
          {/* Custom 404 ipv silent redirect — geeft bezoeker feedback + navigatie-suggesties */}
          <Route path="*" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Laden...</div>}>
              <NotFound />
            </Suspense>
          } />
        </Routes>
      </Suspense>
      </ErrorBoundary>
      <SupportChatGlobal gebruiker={gebruiker} token={token} />
    </BrowserRouter>
  );
}

// ── SupportChat wrapper ─────────────────────────────────────────────────────
// Toont de chat widget:
//  - na login (token aanwezig) op alle interne paginas
//  - op de publieke landing
//  - NIET op /login en /admin* om de focus daar zuiver te houden
//  - auto-hide als window.__sb_kyc_scan_active__ === true (KYC camera flow)
function SupportChatGlobal({ gebruiker, token }) {
  const [pad, setPad] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [kycScanActief, setKycScanActief] = useState(false);

  useEffect(() => {
    const onPath = () => setPad(window.location.pathname);
    window.addEventListener('popstate', onPath);
    // Patch pushState/replaceState zodat we routewissels meekrijgen
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    window.history.pushState = function (...args) {
      const r = origPush.apply(this, args);
      onPath();
      return r;
    };
    window.history.replaceState = function (...args) {
      const r = origReplace.apply(this, args);
      onPath();
      return r;
    };
    return () => {
      window.removeEventListener('popstate', onPath);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, []);

  // Hook voor KYCFlow: dispatch CustomEvent('swiftbridge_kyc_scan', { detail: true|false })
  // om de chat tijdelijk te verbergen tijdens camera-gebruik.
  useEffect(() => {
    const handler = (e) => setKycScanActief(!!e.detail);
    window.addEventListener('swiftbridge_kyc_scan', handler);
    return () => window.removeEventListener('swiftbridge_kyc_scan', handler);
  }, []);

  // Bepaal of widget zichtbaar mag zijn
  const isLanding = pad === '/' || pad === '';
  const isApp = pad.startsWith('/app');
  const isPublic = isLanding;
  const isHidden = pad.startsWith('/login') || pad.startsWith('/admin');

  const mag = (token && isApp) || isPublic;
  if (!mag || isHidden || kycScanActief) return null;

  return <SupportChat gebruiker={gebruiker || null} actief={!kycScanActief} />;
}
