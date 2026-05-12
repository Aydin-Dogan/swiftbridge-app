import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import PaymentFlow from './components/PaymentFlow';
import KYCFlow from './components/KYCFlow';
import Dashboard from './components/Dashboard';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AlgemeneVoorwaarden from './pages/AlgemeneVoorwaarden';
import Privacybeleid from './pages/Privacybeleid';
import AMLBeleid from './pages/AMLBeleid';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icoon: '📊' },
  { id: 'betaling',  label: 'Overmaken',  icoon: '💸' },
  { id: 'kyc',       label: 'Verificatie', icoon: '🪪' },
];

function AppShell({ gebruiker, token, onLogout }) {
  const [actief, setActief] = useState('dashboard');
  const navigate = useNavigate();

  const kycGoedgekeurd = gebruiker?.kycStatus === 'goedgekeurd';

  return (
    <div className="min-h-screen bg-slate-100">
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
                ⚠️ KYC vereist
              </button>
            )}
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
                  🚪 Uitloggen
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Live koers banner */}
      <div className="bg-blue-600 text-white text-center py-1.5 text-xs font-medium">
        💱 Live: 1 EUR ≈ 36,20 TRY &nbsp;·&nbsp; Kosten: 2,0–2,5% &nbsp;·&nbsp; 24/7 beschikbaar
      </div>

      {/* Inhoud */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-28">
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
        {actief === 'kyc' && <KYCFlow token={token} />}
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

export default function App() {
  const [token, setToken] = useState(null);
  const [gebruiker, setGebruiker] = useState(null);

  function handleLogin(t, g) {
    setToken(t);
    setGebruiker(g);
  }

  function handleLogout() {
    setToken(null);
    setGebruiker(null);
  }

  return (
    <BrowserRouter>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
