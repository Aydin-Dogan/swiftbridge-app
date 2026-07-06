import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { Lock, Check, AlertTriangle } from '../components/icons/Icons';
import { CodeInvoer, CODE_LENGTE } from './DeviceLogin';

/**
 * Bevestig-inlog-scherm (ING-model): iemand logt in op de website; de app-
 * gebruiker krijgt een push, opent dit scherm, toetst de 6-cijferige
 * toegangscode en bevestigt. Daarna logt de website automatisch door.
 * Route: /bevestig-inlog (push-notificatie wijst hierheen).
 */
export default function BevestigInlog({ onLogin }) {
  const navigate = useNavigate();
  const [fase, setFase] = useState('laden'); // laden | geen | open | klaar | geweigerd
  const [verzoek, setVerzoek] = useState(null);
  const [code, setCode] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  useEffect(() => {
    let weg = false;
    apiFetch('/auth/inlog-bevestiging/openstaand')
      .then((d) => { if (!weg) { setVerzoek(d?.openstaand ? d : null); setFase(d?.openstaand ? 'open' : 'geen'); } })
      .catch(() => { if (!weg) setFase('geen'); });
    return () => { weg = true; };
  }, []);

  async function bevestig(volledig) {
    const c = volledig || code;
    if (c.length < 5 || bezig) return;
    setBezig(true); setFout('');
    try {
      const data = await apiFetch('/auth/inlog-bevestiging/bevestig', { method: 'POST', body: { toegangscode: c } });
      onLogin?.(null, data.gebruiker); // app zelf is nu ook ingelogd
      setFase('klaar');
    } catch (e) {
      setCode('');
      if (e.errorCode === 'GEEN_OPENSTAAND') { setFase('geen'); }
      else setFout(e.message || 'Onjuiste code.');
    } finally { setBezig(false); }
  }

  async function weiger() {
    if (bezig) return;
    setBezig(true);
    try { await apiFetch('/auth/inlog-bevestiging/weiger', { method: 'POST', body: {} }); } catch { /* stil */ }
    setBezig(false);
    setFase('geweigerd');
  }

  // Browser-info leesbaar maken: "Chrome · Windows" uit de user-agent-string.
  function leesbaarApparaat(ua) {
    if (!ua) return 'Onbekend apparaat';
    const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    const os = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : '';
    return os ? `${browser} · ${os}` : browser;
  }

  return (
    <div className="min-h-screen bg-brand-hero flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-soft-lg p-7 text-center">

        {fase === 'laden' && <p className="text-ink-2 text-sm py-8">Controleren…</p>}

        {fase === 'geen' && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="font-display text-xl font-medium text-ink-1 mb-1">Geen openstaande inlog</h2>
            <p className="text-ink-2 text-sm mb-6">Er staat op dit moment geen inlogpoging te wachten op bevestiging. Het verzoek kan verlopen zijn (na 2 minuten).</p>
            <button onClick={() => navigate('/login')} className="btn-inst w-full py-3.5">Naar inloggen</button>
          </>
        )}

        {fase === 'open' && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="font-display text-xl font-medium text-ink-1 mb-1">Bevestig je inlog</h2>
            <p className="text-ink-2 text-sm mb-4">
              Er wordt ingelogd op SwiftBridge vanaf <strong>{leesbaarApparaat(verzoek?.browser)}</strong>.
              Ben jij dit? Toets dan je {CODE_LENGTE}-cijferige toegangscode.
            </p>
            <CodeInvoer waarde={code} setWaarde={setCode} onCompleet={(v) => bevestig(v)} disabled={bezig} />
            {fout && <p className="text-sm text-red-600 mt-4">{fout}</p>}
            <div className="mt-6 space-y-3">
              <button onClick={() => bevestig()} disabled={bezig || code.length < 5}
                className="btn-inst w-full py-3.5 disabled:opacity-50">
                {bezig ? 'Bevestigen…' : 'Bevestig inloggen'}
              </button>
              <button onClick={weiger} disabled={bezig}
                className="w-full text-sm font-semibold text-red-600 hover:underline underline-offset-4">
                Dit was ik niet
              </button>
            </div>
          </>
        )}

        {fase === 'klaar' && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-green-700" />
            </div>
            <h2 className="font-display text-xl font-medium text-ink-1 mb-1">Bevestiging gelukt</h2>
            <p className="text-ink-2 text-sm mb-6">Je bent nu ingelogd op je computer. Je kunt daar verder — of hier in de app.</p>
            <button onClick={() => navigate('/app')} className="btn-inst w-full py-3.5">Naar mijn overzicht</button>
          </>
        )}

        {fase === 'geweigerd' && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="font-display text-xl font-medium text-ink-1 mb-1">Inlog geweigerd</h2>
            <p className="text-ink-2 text-sm mb-6">
              De inlogpoging is geblokkeerd. Was jij dit niet? Wijzig dan voor de zekerheid je wachtwoord via "Wachtwoord vergeten".
            </p>
            <button onClick={() => navigate('/login')} className="btn-inst w-full py-3.5">Naar inloggen</button>
          </>
        )}
      </div>
    </div>
  );
}
