import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TaalKiezer from '../components/TaalKiezer';
import { apiFetch, haalProfiel } from '../services/api';

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

      // apiFetch zet `credentials: 'include'` — backend zet sb_token cookie.
      const data = await apiFetch(endpoint, { method: 'POST', body });

      // 2FA tussenstap
      if (data.tweeFactor) {
        setTwofaUserId(data.userId);
        return;
      }

      // Cookie is gezet door server. Haal profiel op via /auth/me i.p.v. body te vertrouwen.
      const profiel = await haalProfiel();
      onLogin(null, profiel || data.gebruiker);
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
      const data = await apiFetch('/auth/wachtwoord-vergeten', {
        method: 'POST',
        body: { email: vergetenEmail },
      });
      setVergetenBericht('✅ ' + (data.bericht || 'Reset link verstuurd! Check je inbox én spam folder.'));
    } catch (e) {
      setVergetenBericht('❌ ' + (e.message || 'Geen verbinding met server. Probeer opnieuw.'));
    } finally {
      setVergetenLaden(false);
    }
  }

  async function resetWachtwoord(e) {
    e.preventDefault();
    if (nieuwWachtwoord.length < 8) return setResetBericht('Wachtwoord moet minimaal 8 tekens bevatten.');
    setResetLaden(true);
    try {
      await apiFetch('/auth/wachtwoord-reset', {
        method: 'POST',
        body: { token: resetToken, nieuwWachtwoord },
      });
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
      await apiFetch('/auth/2fa-verifieer', {
        method: 'POST',
        body: { userId: twofaUserId, code: twofaCode },
      });
      // Cookie is gezet — haal profiel op via /auth/me
      const profiel = await haalProfiel();
      onLogin(null, profiel);
      navigate('/app');
    } catch (e) {
      setTwofaFout(e.message);
    } finally {
      setTwofaLaden(false);
    }
  }

  // ── 2FA code invoeren ──
  if (twofaUserId) {
    // Plak code uit klembord (Clipboard API)
    async function plakUitKlembord() {
      try {
        const tekst = await navigator.clipboard.readText();
        const cijfers = tekst.replace(/\D/g, '').slice(0, 6);
        if (cijfers.length >= 4) {
          setTwofaCode(cijfers);
          // Auto-submit als 6 cijfers
          if (cijfers.length === 6) {
            setTimeout(() => document.getElementById('twofa-form')?.requestSubmit(), 200);
          }
        } else {
          setTwofaFout('Geen geldige code in klembord (verwacht 6 cijfers)');
        }
      } catch (err) {
        setTwofaFout('Klembord lezen niet toegestaan. Plak handmatig met Ctrl+V.');
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="w-full max-w-sm card-glass p-6 space-y-4 animate-fade-up">
          <div className="text-center">
            <div className="text-4xl mb-2">📧</div>
            <h2 className="text-xl font-bold text-gray-800">Inlogcode</h2>
            <p className="text-gray-500 text-sm">We hebben een 6-cijferige code naar je e-mail gestuurd. Check ook spam folder.</p>
          </div>
          <form id="twofa-form" onSubmit={verifieer2FA} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              name="otp"
              value={twofaCode}
              onChange={(e) => {
                const code = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTwofaCode(code);
                // Auto-submit bij paste van 6 cijfers
                if (code.length === 6 && twofaCode.length < 6) {
                  setTimeout(() => document.getElementById('twofa-form')?.requestSubmit(), 100);
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const tekst = (e.clipboardData || window.clipboardData).getData('text');
                const cijfers = tekst.replace(/\D/g, '').slice(0, 6);
                setTwofaCode(cijfers);
                if (cijfers.length === 6) {
                  setTimeout(() => document.getElementById('twofa-form')?.requestSubmit(), 100);
                }
              }}
              placeholder="123456"
              required
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={plakUitKlembord}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2.5 rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              📋 Plak code uit klembord
            </button>
            {twofaFout && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">❌ {twofaFout}</p>
            )}
            <button type="submit" disabled={twofaLaden || twofaCode.length !== 6}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {twofaLaden ? '⏳ Bezig...' : '🔓 Verifieer & inloggen'}
            </button>
            <button type="button" onClick={() => { setTwofaUserId(null); setTwofaCode(''); setTwofaFout(''); }}
              className="w-full text-gray-500 text-sm hover:text-gray-700">
              ← Terug naar inloggen
            </button>
          </form>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-[10px] text-blue-800 leading-snug">
            💡 <strong>Tip:</strong> Op iPhone (iOS 12+) verschijnt de code automatisch boven het toetsenbord wanneer je deze in Mail ziet. Tap erop om in te vullen.
          </div>
        </div>
      </div>
    );
  }

  // ── Wachtwoord reset scherm ──
  if (toonReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
        <div className="w-full max-w-sm card-glass p-6 space-y-4 animate-fade-up">
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
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
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
        <div className="w-full max-w-sm card-glass p-6 space-y-4 animate-fade-up">
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
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
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
              className="btn-primary w-full py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
