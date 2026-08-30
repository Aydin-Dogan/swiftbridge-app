import { useState, useEffect, useRef } from 'react';
import { apiFetch, haalProfiel } from '../services/api';
import { Bell } from '../components/icons/Icons';

/**
 * Wachtscherm op de website ná de wachtwoordstap (ING-model): "Bevestig in de
 * SwiftBridge-app". Pollt elke 2s de status; bij 'bevestigd' claimt hij de
 * sessie en logt de website automatisch door.
 */
export default function InlogWachtOpApp({ bevestigingToken, onIngelogd, onFallback, onTerug }) {
  const [status, setStatus] = useState('wachtend'); // wachtend | geweigerd | verlopen
  const [fout, setFout] = useState('');
  const [fallbackBezig, setFallbackBezig] = useState(false);
  const klaarRef = useRef(false);

  useEffect(() => {
    let weg = false;
    const timer = setInterval(async () => {
      if (weg || klaarRef.current) return;
      try {
        const d = await apiFetch(`/auth/inlog-bevestiging/status?token=${encodeURIComponent(bevestigingToken)}`);
        if (weg || klaarRef.current) return;
        if (d.status === 'bevestigd') {
          klaarRef.current = true;
          clearInterval(timer);
          await apiFetch('/auth/inlog-bevestiging/claim', { method: 'POST', body: { bevestigingToken } });
          const profiel = await haalProfiel();
          onIngelogd?.(profiel);
        } else if (d.status === 'geweigerd') {
          klaarRef.current = true; clearInterval(timer); setStatus('geweigerd');
        } else if (d.status === 'verlopen' || d.status === 'gebruikt') {
          klaarRef.current = true; clearInterval(timer); setStatus('verlopen');
        }
      } catch (e) {
        // Token verlopen (5 min) → terug naar login
        if (e.errorCode === 'TOKEN_ONGELDIG') { klaarRef.current = true; clearInterval(timer); setStatus('verlopen'); }
      }
    }, 2000);
    return () => { weg = true; clearInterval(timer); };
  }, [bevestigingToken, onIngelogd]);

  async function gebruikEmailCode() {
    if (fallbackBezig) return;
    setFallbackBezig(true); setFout('');
    try {
      const d = await apiFetch('/auth/inlog-bevestiging/fallback', { method: 'POST', body: { bevestigingToken } });
      klaarRef.current = true;
      onFallback?.(d); // schakelt over naar het bestaande e-mailcode-scherm
    } catch (e) {
      if (e.errorCode === 'EMAILCODE_NIET_BESCHIKBAAR') {
        // Mail is tijdelijk stuk; het app-verzoek blijft geldig (de poll loopt
        // door), dus bevestigen via de app kan gewoon nog.
        setStatus('mailfout');
      } else {
        setFout(e.error || e.message || 'Overschakelen mislukt. Log opnieuw in.');
      }
    } finally { setFallbackBezig(false); }
  }

  return (
    <div className="min-h-screen bg-brand-hero flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-soft-lg p-7 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
          <Bell className="w-7 h-7 text-brand-600" />
        </div>

        {status === 'wachtend' && (
          <>
            <h2 className="font-display text-xl font-medium text-ink-1 mb-1">Bevestig in de app</h2>
            <p className="text-ink-2 text-sm mb-6">
              We hebben een melding naar je telefoon gestuurd. Open de <strong>SwiftBridge-app</strong>,
              toets je toegangscode en bevestig deze inlog. Deze pagina logt daarna automatisch door.
            </p>
            <div className="flex justify-center mb-6" aria-label="Wachten op bevestiging">
              <div className="w-8 h-8 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
            </div>
            <div className="space-y-3">
              <button onClick={gebruikEmailCode} disabled={fallbackBezig}
                className="w-full text-sm font-semibold text-brand-700 hover:underline underline-offset-4 disabled:opacity-50">
                {fallbackBezig ? 'Bezig…' : 'Geen app bij de hand? Gebruik een e-mailcode'}
              </button>
              <button onClick={onTerug} className="w-full text-sm text-ink-2 hover:underline">Annuleren</button>
            </div>
          </>
        )}

        {status === 'mailfout' && (
          <>
            <h2 className="font-display text-xl font-medium text-ink-1 mb-1">E-mailcode niet beschikbaar</h2>
            <p className="text-ink-2 text-sm mb-6">
              De e-mailcode kan op dit moment niet verstuurd worden. Je kunt deze inlog
              nog steeds <strong>bevestigen in de SwiftBridge-app</strong> — deze pagina
              logt dan vanzelf door. Of ga terug en probeer het later opnieuw.
            </p>
            <button onClick={onTerug} className="btn-inst w-full py-3.5">Terug naar inloggen</button>
          </>
        )}

        {status === 'geweigerd' && (
          <>
            <h2 className="font-display text-xl font-medium text-ink-1 mb-1">Inlog geweigerd</h2>
            <p className="text-ink-2 text-sm mb-6">Deze inlogpoging is in de app geweigerd. Was jij dit zelf? Log dan opnieuw in.</p>
            <button onClick={onTerug} className="btn-inst w-full py-3.5">Terug naar inloggen</button>
          </>
        )}

        {status === 'verlopen' && (
          <>
            <h2 className="font-display text-xl font-medium text-ink-1 mb-1">Verzoek verlopen</h2>
            <p className="text-ink-2 text-sm mb-6">De bevestiging is niet binnen 2 minuten gedaan. Log opnieuw in om een nieuwe melding te sturen.</p>
            <button onClick={onTerug} className="btn-inst w-full py-3.5">Terug naar inloggen</button>
          </>
        )}

        {fout && <p className="text-sm text-red-600 mt-4">{fout}</p>}
      </div>
    </div>
  );
}
