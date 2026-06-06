/**
 * EmailWijzigen.jsx — Publieke landingpagina voor SS bevestig+intrek links.
 *
 * Routes:
 * /email-wijzigen-bevestigen?token=XXX -> POST /users/me/email-wijzig-bevestigen
 * /email-wijzigen-intrekken?token=XXX -> POST /users/me/email-wijzig-intrekken
 *
 * Beide endpoints zijn anoniem (token IS auth). Bij succes van bevestiging
 * is de gebruiker uitgelogd op alle apparaten -> redirect naar /login.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TaalKiezer from '../components/TaalKiezer';
import { useTaal } from '../i18n';
import { apiFetch, parseError } from '../services/api';
import { Clock, CheckCircle, AlertTriangle, Refresh } from '../components/icons/Icons';

export default function EmailWijzigen({ modus }) {
  const [params] = useSearchParams();
  const { t } = useTaal();
  const navigate = useNavigate();
  const [status, setStatus] = useState('bezig'); // 'bezig' | 'succes' | 'fout'
  const [foutBericht, setFoutBericht] = useState('');

  const token = params.get('token');
  const isBevestigen = modus === 'bevestigen';
  const endpoint = isBevestigen
    ? '/users/me/email-wijzig-bevestigen'
    : '/users/me/email-wijzig-intrekken';

  useEffect(() => {
    let geannuleerd = false;
    async function run() {
      if (!token) {
        setStatus('fout');
        setFoutBericht(t('email_wijzig_geen_token') || 'Geen token in de link gevonden');
        return;
      }
      try {
        await apiFetch(endpoint, { method: 'POST', body: { token } });
        if (geannuleerd) return;
        setStatus('succes');
        // Bevestigen: backend heeft refresh-tokens ingetrokken -> uitloggen
        if (isBevestigen) {
          // Wis lokale sessie-state direct
          try { localStorage.removeItem('sb_token'); } catch {}
          try { sessionStorage.clear(); } catch {}
          setTimeout(() => { if (!geannuleerd) navigate('/login'); }, 4000);
        }
      } catch (e) {
        if (geannuleerd) return;
        setStatus('fout');
        setFoutBericht(parseError(e, t));
      }
    }
    run();
    return () => { geannuleerd = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, endpoint, isBevestigen]);

  const titelBezig = isBevestigen
    ? (t('email_wijzig_bevestigen_bezig') || 'Wijziging wordt bevestigd...')
    : (t('email_wijzig_intrekken_bezig') || 'Aanvraag wordt ingetrokken...');

  const titelSucces = isBevestigen
    ? (t('email_wijzig_bevestigen_succes_titel') || 'E-mailadres gewijzigd!')
    : (t('email_wijzig_intrekken_succes_titel') || 'Wijziging ingetrokken');

  const uitlegSucces = isBevestigen
    ? (t('email_wijzig_bevestigen_succes_uitleg') ||
       'Je e-mailadres is bijgewerkt. Je bent uitgelogd op alle apparaten. Je wordt nu doorgestuurd naar de inlogpagina.')
    : (t('email_wijzig_intrekken_succes_uitleg') ||
       'De aanvraag is ingetrokken. We adviseren je nu direct je wachtwoord te wijzigen via "Wachtwoord vergeten".');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <TaalKiezer />
      </div>
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/40">
        {status === 'bezig' && (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 animate-pulse">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{titelBezig}</h1>
            <p className="text-sm text-gray-600">{t('email_wijzig_even_geduld') || 'Een ogenblik geduld...'}</p>
          </div>
        )}

        {status === 'succes' && (
          <div className="text-center py-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              isBevestigen ? 'bg-green-50' : 'bg-blue-50'
            }`}>
              {isBevestigen
                ? <CheckCircle className="w-8 h-8 text-green-600" />
                : <Refresh className="w-8 h-8 text-blue-600" />}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-3">{titelSucces}</h1>
            <p className="text-sm text-gray-700 leading-relaxed mb-5">{uitlegSucces}</p>
            {!isBevestigen && (
              <button
                onClick={() => navigate('/login?reset=1')}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                {t('email_wijzig_naar_wachtwoord_reset') || 'Wachtwoord wijzigen'}
              </button>
            )}
            {isBevestigen && (
              <button
                onClick={() => navigate('/login')}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                {t('email_wijzig_naar_login') || 'Naar inlogpagina'}
              </button>
            )}
          </div>
        )}

        {status === 'fout' && (
          <div className="text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-3">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-3">
              {t('email_wijzig_fout_titel') || 'Er ging iets mis'}
            </h1>
            <p className="text-sm text-gray-700 mb-5">
              {foutBericht || (t('email_wijzig_fout_algemeen') || 'De link is mogelijk verlopen of al gebruikt.')}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              {t('email_wijzig_naar_login') || 'Naar inlogpagina'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
