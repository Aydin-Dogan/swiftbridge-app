/**
 * VerifyEmail.jsx — Publieke pagina voor e-mail verificatie
 *
 * Route: /verifieer-email?token=XXX (public, geen auth)
 *
 * Flow:
 *   1. ⏳ Bij mount: extracteer token uit URL en doe GET /auth/verifieer-email?token={token}
 *   2. ✅ Success → na 2s auto-redirect naar /login
 *   3. ❌ Fout → toon uitleg + form om opnieuw te versturen
 *
 * Stijl: glassmorphism, matched met Login.jsx
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TaalKiezer from '../components/TaalKiezer';
import { useTaal } from '../i18n';
import { apiFetch, parseError } from '../services/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { t } = useTaal();
  const navigate = useNavigate();

  // Verificatie state: 'bezig' | 'succes' | 'fout'
  const [status, setStatus] = useState('bezig');
  const [foutBericht, setFoutBericht] = useState('');

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLaden, setResendLaden] = useState(false);
  const [resendBericht, setResendBericht] = useState('');
  const [resendOk, setResendOk] = useState(false);

  const token = params.get('token');

  useEffect(() => {
    let geannuleerd = false;
    async function verifieer() {
      if (!token) {
        setStatus('fout');
        setFoutBericht(t('verify_email_geen_token'));
        return;
      }
      try {
        await apiFetch(`/auth/verifieer-email?token=${encodeURIComponent(token)}`);
        if (geannuleerd) return;
        setStatus('succes');
        // Auto-redirect naar login na 2s (of /app als sessie nog actief is)
        setTimeout(() => {
          if (!geannuleerd) navigate('/login');
        }, 2000);
      } catch (e) {
        if (geannuleerd) return;
        setStatus('fout');
        setFoutBericht(parseError(e, t));
      }
    }
    verifieer();
    return () => { geannuleerd = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function stuurOpnieuw(e) {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLaden(true);
    setResendBericht('');
    setResendOk(false);
    try {
      const data = await apiFetch('/auth/verifieer-email/opnieuw-sturen', {
        method: 'POST',
        body: { email: resendEmail },
      });
      setResendOk(true);
      setResendBericht(data?.bericht || t('verify_email_resend_succes'));
    } catch (e) {
      // Rate limit (429) krijgt eigen tekst
      if (e.status === 429) {
        setResendBericht(t('verify_email_resend_rate_limit'));
      } else {
        setResendBericht(parseError(e, t));
      }
    } finally {
      setResendLaden(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 py-10 relative">
      <div className="absolute top-4 right-4"><TaalKiezer donker /></div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-white">
            <span className="text-4xl" aria-hidden="true">⚡</span>
            <div className="text-left">
              <div className="text-2xl font-extrabold">SwiftBridge</div>
              <div className="text-blue-200 text-xs">NL → TR in &lt;5 minuten</div>
            </div>
          </button>
        </div>

        <div
          className="card-glass p-6 space-y-4 animate-fade-up"
          role="status"
          aria-live="polite"
        >
          {/* ── Laden ── */}
          {status === 'bezig' && (
            <div className="text-center space-y-3">
              <div className="text-5xl mb-2" aria-hidden="true">⏳</div>
              <h2 className="text-xl font-bold text-gray-800">
                {t('verify_email_laden_titel')}
              </h2>
              <p className="text-gray-500 text-sm">
                {t('verify_email_laden_uitleg')}
              </p>
              <div className="flex justify-center pt-2">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600" />
              </div>
            </div>
          )}

          {/* ── Success ── */}
          {status === 'succes' && (
            <div className="text-center space-y-3">
              <div
                className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-2"
                aria-hidden="true"
              >
                <span className="text-5xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-emerald-700">
                {t('verify_email_succes_titel')}
              </h2>
              <p className="text-gray-600 text-sm">
                {t('verify_email_succes_uitleg')}
              </p>
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary w-full py-3"
                >
                  {t('verify_email_naar_login')}
                </button>
                <button
                  onClick={() => navigate('/app')}
                  className="w-full text-blue-600 text-sm font-semibold hover:text-blue-700 py-2"
                >
                  {t('verify_email_naar_dashboard')}
                </button>
              </div>
            </div>
          )}

          {/* ── Fout ── */}
          {status === 'fout' && (
            <div className="space-y-4">
              <div className="text-center">
                <div
                  className="inline-flex items-center justify-center w-20 h-20 bg-rose-100 rounded-full mb-3"
                  aria-hidden="true"
                >
                  <span className="text-5xl">❌</span>
                </div>
                <h2 className="text-xl font-bold text-rose-700">
                  {t('verify_email_fout_titel')}
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  {foutBericht || t('verify_email_fout_uitleg')}
                </p>
              </div>

              {/* Resend form */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  {t('verify_email_resend_titel')}
                </p>
                <form onSubmit={stuurOpnieuw} className="space-y-3">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder={t('verify_email_resend_placeholder')}
                    required
                    aria-label={t('verify_email_resend_placeholder')}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {resendBericht && (
                    <p
                      role="status"
                      aria-live="polite"
                      className={`text-sm rounded-xl p-3 border ${
                        resendOk
                          ? 'text-green-700 bg-green-50 border-green-200'
                          : 'text-red-600 bg-red-50 border-red-200'
                      }`}
                    >
                      {resendOk ? '✅ ' : '⚠️ '}
                      {resendBericht}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={resendLaden || !resendEmail}
                    className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendLaden ? `⏳ ${t('laden')}` : `📧 ${t('verify_email_resend_knop')}`}
                  </button>
                </form>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full text-gray-500 text-sm hover:text-gray-700 py-2"
                >
                  ← {t('verify_email_terug_login')}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          🔒 {t('verify_email_beveiligd_voet')}
        </p>
      </div>
    </div>
  );
}
