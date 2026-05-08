import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API = 'http://localhost:3000';

export default function Login({ onLogin }) {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'register' ? 'register' : 'login');
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', naam: '', telefoon: '' });
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');

  useEffect(() => {
    setFout('');
  }, [tab]);

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

      onLogin(data.token, data.gebruiker);
      navigate('/app');
    } catch (e) {
      setFout(e.message);
    } finally {
      setLaden(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
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
          {/* Tabs */}
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
                    placeholder="Aydin Dogan"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Telefoonnummer</label>
                  <input value={form.telefoon} onChange={e => update('telefoon', e.target.value)}
                    placeholder="+31 6 12345678"
                    type="tel"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">E-mailadres</label>
              <input value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="naam@email.nl"
                type="email" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Wachtwoord</label>
              <input value={form.password} onChange={e => update('password', e.target.value)}
                placeholder="••••••••"
                type="password" required minLength={8}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              {tab === 'register' && (
                <p className="text-xs text-gray-400 mt-1">Minimaal 8 tekens</p>
              )}
            </div>

            {fout && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                ⚠️ {fout}
              </div>
            )}

            <button type="submit" disabled={laden}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition text-sm mt-2">
              {laden ? '⏳ Bezig...' : tab === 'login' ? '🔑 Inloggen' : '🚀 Account aanmaken'}
            </button>

            {tab === 'register' && (
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Door te registreren ga je akkoord met onze{' '}
                <span className="text-blue-500 cursor-pointer">gebruiksvoorwaarden</span> en{' '}
                <span className="text-blue-500 cursor-pointer">privacybeleid</span>.
              </p>
            )}
          </form>

          {/* Demo snelkoppeling */}
          <div className="px-6 pb-6">
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 text-center mb-2">Demo — gebruik testaccount:</p>
              <button
                onClick={() => {
                  setTab('login');
                  setForm(f => ({ ...f, email: 'test@swiftbridge.nl', password: 'Wachtwoord123' }));
                }}
                className="w-full border border-dashed border-gray-300 text-gray-500 text-xs py-2 rounded-xl hover:bg-gray-50 transition">
                🧪 Vul testaccount in
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          🔒 Beveiligd via JWT · DNB-geregistreerd · PCI DSS compliant
        </p>
      </div>
    </div>
  );
}
