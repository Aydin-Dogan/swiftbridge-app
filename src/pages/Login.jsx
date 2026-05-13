import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TaalKiezer from '../components/TaalKiezer';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Login({ onLogin }) {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'register' ? 'register' : 'login');
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', naam: '', telefoon: '' });
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');
  const [toonVergeten, setToonVergeten] = useState(false);
  const [vergetenEmail, setVergetenEmail] = useState('');
  const [vergetenBericht, setVergetenBericht] = useState('');
  const [vergetenLaden, setVergetenLaden] = useState(false);

  // 2FA state
  const [twofaUserId, setTwofaUserId] = useState(null);
  const [twofaCode,   setTwofaCode  ] = useState('');
  const [twofaLaden,  setTwofaLaden ] = useState(false);
  const [twofaFout,   setTwofaFout  ] = useState('');

  // Wachtwoord reset via link (?reset=TOKEN)
  const resetToken = params.get('reset');
  const [toonReset, setToonReset] = useState(!!resetToken);
  const [nieuwWachtwoord, setNieuwWachtwoord] = useState('');
  const [resetBericht, setResetBericht] = useState('');
  const [resetLaden, setResetLaden] = useState(false);

  useEffect(() => { setFout(''); }, [tab]);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setLaden(true);
    setFout('');
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const body = tab === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, naam: form.naam, telefoon: form.telefoon };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 2FA tussenstap
      if (data.tweeFactor) {
        setTwofaUserId(data.userId);
        return;
      }

      onLogin(data.token, data.gebruiker, data.refreshToken);
      navigate('/app');
    } catch (e) {
      setFout(e.message);
    } finally {
      setLaden(false);
    }
  }

  async function stuurResetLink(e) {
    e.preventDefault();
    setVergetenLaden(true);
    setVergetenBericht('');
    try {
      const res = await fetch(`${API}/auth/wachtwoord-vergeten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: vergetenEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVergetenBericht('❌ ' + (data.error || 'Er ging iets mis. Neem contact op met support.'));
      } else {
        setVergetenBericht('✅ ' + (data.bericht || 'Reset link verstuurd! Check je inbox én spam folder.'));
      }
    } catch {
      setVergetenBericht('❌ Geen verbinding met server. Probeer opnieuw.');
    } finally {
      setVergetenLaden(false);
    }
  }

  async function resetWachtwoord(e) {
    e.preventDefault();
    if (nieuwWachtwoord.length < 8) return setResetBericht('Wachtwoord moet minimaal 8 tekens bevatten.');
    setResetLaden(true);
    try {
      const res = await fetch(`${API}/auth/wachtwoord-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, nieuwWachtwoord }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetBericht('✅ Wachtwoord gewijzigd! Je kunt nu inloggen.');
      setTimeout(() => setToonReset(false), 2000);
    } catch (e) {
      setResetBericht('❌ ' + e.message);
    } finally {
      setResetLaden(false);
    }
  }

  async function verifieer2FA(e) {
    e.preventDefault();
    setTwofaLaden(true);
    setTwofaFout('');
    try {
      const res = await fetch(`${API}/auth/2fa-verifieer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: twofaUserId, code: twofaCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.token, data.gebruiker, data.refreshToken);
      navigate('/app');
    } catch (e) {
      setTwofaFout(e.message);
    } finally {
      setTwofaLaden(false);
    }
  }

  // ── 2FA code invoeren ──
  if (twofaUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">📧</div>
            <h2 className="text-xl font-bold text-gray-800">Inlogcode</h2>
            <p className="text-gray-500 text-sm">We hebben een 6-cijferige code naar je e-mail gestuurd. Check ook spam folder.</p>
          </div>
          <form onSubmit={verifieer2FA} className="space-y-4">
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={twofaCode}
              onChange={e => setTwofaCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              required autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] outline-none focus:border-blue-500"
            />
            {twofaFout && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">❌ {twofaFout}</p>
            )}
            <button type="submit" disabled={twofaLaden || twofaCode.length !== 6}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition">
              {twofaLaden ? '⏳ Bezig...' : '🔓 Verifieer & inloggen'}
            </button>
            <button type="button" onClick={() => { setTwofaUserId(null); setTwofaCode(''); setTwofaFout(''); }}
              className="w-full text-gray-500 text-sm hover:text-gray-700">
              ← Terug naar inloggen
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Wachtwoord reset scherm ──
  if (toonReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🔐</div>
            <h2 className="text-xl font-bold text-gray-800">Nieuw wachtwoord</h2>
            <p className="text-gray-500 text-sm">Kies een nieuw wachtwoord voor je account</p>
          </div>
          <form onSubmit={resetWachtwoord} className="space-y-4">
            <input
              type="password" value={nieuwWachtwoord}
              onChange={e => setNieuwWachtwoord(e.target.value)}
              placeholder="Nieuw wachtwoord (min. 8 tekens)"
              minLength={8} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
            {resetBericht && (
              <p className={`text-sm ${resetBericht.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{resetBericht}</p>
            )}
            <button type="submit" disabled={resetLaden}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition">
              {resetLaden ? '⏳ Bezig...' : '🔑 Wachtwoord opslaan'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Wachtwoord vergeten scherm ──
  if (toonVergeten) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <button onClick={() => setToonVergeten(false)} className="text-gray-400 text-sm">← Terug</button>
          <div className="text-center">
            <div className="text-4xl mb-2">📧</div>
            <h2 className="text-xl font-bold text-gray-800">Wachtwoord vergeten</h2>
            <p className="text-gray-500 text-sm">Voer je e-mailadres in — je ontvangt een reset link</p>
          </div>
          <form onSubmit={stuurResetLink} className="space-y-4">
            <input
              type="email" value={vergetenEmail}
              onChange={e => setVergetenEmail(e.target.value)}
              placeholder="jouw@email.nl" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
            {vergetenBericht && (
              <p className={`text-sm rounded-xl p-3 border ${
                vergetenBericht.startsWith('✅')
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : 'text-red-600 bg-red-50 border-red-200'
              }`}>{vergetenBericht}</p>
            )}
            <button type="submit" disabled={vergetenLaden}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition">
              {vergetenLaden ? '⏳ Bezig...' : '📧 Stuur reset link'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 py-10 relative">
      <div className="absolute top-4 right-4"><TaalKiezer donker /></div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-white">
            <span className="text-4xl">⚡</span>
            <div className="text-left">
              <div className="text-2xl font-extrabold">SwiftBridge</div>
              <div className="text-blue-200 text-xs">NL → TR in &lt;5 minuten</div>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex">
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-4 font-bold text-sm transition
                  ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {t === 'login' ? '🔑 Inloggen' : '🚀 Registreren'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Volledige naam</label>
                  <input value={form.naam} onChange={e => update('naam', e.target.value)}
                    placeholder="Naam" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Telefoonnummer</label>
                  <input value={form.telefoon} onChange={e => update('telefoon', e.target.value)}
                    placeholder="+31 6 12345678" type="tel"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">E-mailadres</label>
              <input value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="naam@email.nl" type="email" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Wachtwoord</label>
              <input value={form.password} onChange={e => update('password', e.target.value)}
                placeholder="••••••••" type="password" required minLength={8}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              {tab === 'register' && (
                <p className="text-xs text-gray-400 mt-1">Minimaal 8 tekens</p>
              )}
            </div>

            {tab === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => setToonVergeten(true)}
                  className="text-xs text-blue-500 hover:text-blue-700">
                  Wachtwoord vergeten?
                </button>
              </div>
            )}

            {fout && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                ⚠️ {fout}
              </div>
            )}

            <button type="submit" disabled={laden}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition text-sm mt-2">
              {laden ? '⏳ Bezig...' : tab === 'login' ? '🔑 Inloggen' : '🚀 Account aanmaken'}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          🔒 Beveiligd via JWT · Rate limited · End-to-end versleuteld
        </p>
      </div>
    </div>
  );
}
