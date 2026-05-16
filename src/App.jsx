import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LiveKoersTicker from './components/LiveKoersTicker';
import Landing from './pages/Landing';
import Login from './pages/Login';
import TaalKiezer from './components/TaalKiezer';
import OfflineBanner from './components/OfflineBanner';
import { useTaal } from './i18n';

// Lazy load zware paginas (code splitting)
const PaymentFlow         = lazy(() => import('./components/PaymentFlow'));
const KYCFlow             = lazy(() => import('./components/KYCFlow'));
const KoersAlerts         = lazy(() => import('./components/KoersAlerts'));
const Profiel             = lazy(() => import('./components/Profiel'));
const AlgemeneVoorwaarden = lazy(() => import('./pages/AlgemeneVoorwaarden'));
const Privacybeleid       = lazy(() => import('./pages/Privacybeleid'));
const AMLBeleid           = lazy(() => import('./pages/AMLBeleid'));
const AdminPanel          = lazy(() => import('./pages/AdminPanel'));

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

// ── PWA Install Banner ────────────────────────────────────────────────────────
function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [toonAndroid, setToonAndroid] = useState(false);
  const [toonIOS, setToonIOS] = useState(false);

  useEffect(() => {
    // Android / Chrome: beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      const verborgen = sessionStorage.getItem('swiftbridge_install_verborgen');
      if (!verborgen) setToonAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari: toon handmatige instructie als niet al geïnstalleerd
    if (isIOS() && !isInStandaloneMode()) {
      const verborgen = sessionStorage.getItem('swiftbridge_install_verborgen');
      if (!verborgen) setToonIOS(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function verberg() {
    sessionStorage.setItem('swiftbridge_install_verborgen', '1');
    setToonAndroid(false);
    setToonIOS(false);
  }

  async function installeer() {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setToonAndroid(false);
  }

  // Android/Chrome banner
  if (toonAndroid && prompt) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
        <span className="text-2xl flex-shrink-0">⚡</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-none">Download SwiftBridge</p>
          <p className="text-blue-200 text-xs mt-0.5">Installeer de app op je telefoon</p>
        </div>
        <button onClick={installeer}
          className="bg-white text-blue-600 font-bold text-xs px-3 py-2 rounded-xl flex-shrink-0 active:scale-95 transition">
          Installeer
        </button>
        <button onClick={verberg} className="text-blue-300 hover:text-white text-lg flex-shrink-0">✕</button>
      </div>
    );
  }

  // iOS Safari banner met stap-voor-stap uitleg
  if (toonIOS) {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[100] bg-gray-900 text-white rounded-2xl shadow-2xl p-4 border border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-bold text-sm">Installeer SwiftBridge</p>
              <p className="text-gray-400 text-xs">Zet de app op je beginscherm</p>
            </div>
          </div>
          <button onClick={verberg} className="text-gray-500 text-xl leading-none">✕</button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2">
            <span className="text-lg">1️⃣</span>
            <p className="text-xs text-gray-300">Tik op het <span className="text-white font-bold">Deel-icoon</span> <span className="text-blue-400">⬆️</span> onderaan Safari</p>
          </div>
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2">
            <span className="text-lg">2️⃣</span>
            <p className="text-xs text-gray-300">Scroll naar beneden en tik op <span className="text-white font-bold">"Zet op beginscherm"</span></p>
          </div>
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2">
            <span className="text-lg">3️⃣</span>
            <p className="text-xs text-gray-300">Tik op <span className="text-white font-bold">"Voeg toe"</span> — klaar! 🎉</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function AppShell({ gebruiker, token, onLogout }) {
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
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-base font-extrabold text-gray-900 leading-none">SwiftBridge</h1>
              <p className="text-xs text-blue-600 font-medium">NL → TR in &lt;5 min</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {!kycGoedgekeurd && (
              <button onClick={() => setActief('kyc')}
                className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-1 rounded-full">
                ⚠️ KYC
              </button>
            )}
            <TaalKiezer />
            <div className="relative group">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer">
                {gebruiker?.naam?.[0] || 'G'}
              </div>
              <div className="absolute right-0 top-11 bg-white rounded-xl shadow-lg border border-gray-100 w-48 p-2 hidden group-hover:block z-50">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="font-semibold text-sm text-gray-800">{gebruiker?.naam}</p>
                  <p className="text-xs text-gray-400">{gebruiker?.email}</p>
                </div>
                <button onClick={onLogout}
                  className="w-full text-left text-sm text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg font-medium">
                  {t('uitloggen')}
                </button>
              </div>
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

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('sb_token'));
  const [gebruiker, setGebruiker] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb_gebruiker')); } catch { return null; }
  });

  // Ververs access token met refresh token
  async function verversToken() {
    const refreshToken = localStorage.getItem('sb_refresh');
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error('Refresh mislukt');
      const data = await res.json();
      localStorage.setItem('sb_token', data.token);
      localStorage.setItem('sb_refresh', data.refreshToken);
      localStorage.setItem('sb_gebruiker', JSON.stringify(data.gebruiker));
      setToken(data.token);
      setGebruiker(data.gebruiker);
      return data.token;
    } catch {
      // Refresh token verlopen — uitloggen
      handleLogout();
      return null;
    }
  }

  // Bij opstarten: haal actuele gebruikersdata op
  useEffect(() => {
    const t = localStorage.getItem('sb_token');
    if (!t) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      .then(async r => {
        if (r.status === 401) {
          // Access token verlopen — probeer te vernieuwen
          return verversToken();
        }
        return r.ok ? r.json() : null;
      })
      .then(g => {
        if (g && g.id) {
          setGebruiker(g);
          localStorage.setItem('sb_gebruiker', JSON.stringify(g));
        }
      })
      .catch(() => {});
  }, []);

  function handleLogin(t, g, refreshToken) {
    setToken(t);
    setGebruiker(g);
    localStorage.setItem('sb_token', t);
    localStorage.setItem('sb_gebruiker', JSON.stringify(g));
    if (refreshToken) localStorage.setItem('sb_refresh', refreshToken);
  }

  function handleLogout() {
    // Vertel server dat refresh token ingetrokken moet worden
    const t = localStorage.getItem('sb_token');
    if (t) {
      fetch(`${API}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } }).catch(() => {});
    }
    setToken(null);
    setGebruiker(null);
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_refresh');
    localStorage.removeItem('sb_gebruiker');
  }

  return (
    <BrowserRouter>
      <OfflineBanner />
      <Suspense fallback={<LaadSpinner />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={
            token ? <Navigate to="/app" replace /> :
            <Login onLogin={handleLogin} />
          } />
          <Route path="/app" element={
            <ProtectedRoute token={token} gebruiker={gebruiker} onLogout={handleLogout}>
              <AppShell token={token} gebruiker={gebruiker} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/algemene-voorwaarden" element={<AlgemeneVoorwaarden />} />
          <Route path="/privacybeleid" element={<Privacybeleid />} />
          <Route path="/aml-beleid" element={<AMLBeleid />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
