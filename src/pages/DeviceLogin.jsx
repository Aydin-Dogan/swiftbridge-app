import { useState, useRef, useEffect } from 'react';
import { apiFetch, haalProfiel } from '../services/api';
import { Zap } from '../components/icons/Icons';

/**
 * ING-stijl device-login. Twee modi:
 *  - modus="inloggen": snelle login op een gekoppeld toestel met de 6-cijferige
 *    toegangscode (POST /auth/apparaat/inloggen).
 *  - modus="koppelen": ná een volledige login dit toestel onthouden door een
 *    6-cijferige code te kiezen (POST /auth/apparaat/koppelen).
 *
 * Bezit van het gekoppelde toestel (httpOnly cookie) + kennis van de code =
 * twee factoren, zonder e-mailcode bij elke login.
 * (5→6 cijfers op verzoek Aydin 6-7-2026; bestaande 5-cijferige codes blijven
 * inloggen via de knop — auto-submit gebeurt pas bij 6 cijfers.)
 */
export const CODE_LENGTE = 6;

// Losse cijfervelden met auto-advance, backspace en plak-ondersteuning.
// Ook gebruikt door het "Bevestig inlog"-scherm (BevestigInlog.jsx).
export function CodeInvoer({ waarde, setWaarde, onCompleet, disabled, lengte = CODE_LENGTE }) {
  const refs = useRef([]);
  const cijfers = waarde.padEnd(lengte, ' ').slice(0, lengte).split('');

  function zet(i, v) {
    const only = v.replace(/\D/g, '');
    if (!only) return;
    const arr = waarde.split('');
    arr[i] = only[only.length - 1];
    const nieuw = arr.join('').slice(0, lengte);
    setWaarde(nieuw);
    if (i < lengte - 1) refs.current[i + 1]?.focus();
    if (nieuw.replace(/\s/g, '').length === lengte) onCompleet?.(nieuw);
  }
  function toets(i, e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = waarde.padEnd(lengte, ' ').split('');
      if (arr[i] && arr[i] !== ' ') { arr[i] = ' '; setWaarde(arr.join('').trimEnd()); }
      else if (i > 0) { arr[i - 1] = ' '; setWaarde(arr.join('').trimEnd()); refs.current[i - 1]?.focus(); }
    }
  }
  function plak(e) {
    const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, lengte);
    if (t) { e.preventDefault(); setWaarde(t); if (t.length === lengte) onCompleet?.(t); else refs.current[t.length]?.focus(); }
  }
  useEffect(() => { refs.current[0]?.focus(); }, []);

  return (
    <div className="flex justify-center gap-2" onPaste={plak}>
      {cijfers.map((c, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={1}
          disabled={disabled}
          aria-label={`Cijfer ${i + 1}`}
          value={c.trim()}
          onChange={(e) => zet(i, e.target.value)}
          onKeyDown={(e) => toets(i, e)}
          className="w-11 h-14 text-center text-2xl font-semibold rounded-xl border-2 border-gray-300 bg-white text-brand-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
        />
      ))}
    </div>
  );
}

export default function DeviceLogin({ modus, apparaatNaam, onGelukt, onAnnuleer, onAnderAccount }) {
  const [code, setCode] = useState('');
  const [code2, setCode2] = useState('');
  const [stap, setStap] = useState('code'); // koppelen: 'code' → 'herhaal'
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');

  async function snelleLogin(volledig) {
    const c = volledig || code;
    // Minimaal 5: koppelingen van vóór de 6-cijfer-omschakeling blijven werken.
    if (c.length < 5 || laden) return;
    setLaden(true); setFout('');
    try {
      await apiFetch('/auth/apparaat/inloggen', { method: 'POST', body: { toegangscode: c } });
      const profiel = await haalProfiel();
      onGelukt?.(profiel);
    } catch (e) {
      setCode('');
      if (e.errorCode === 'APPARAAT_ONBEKEND' || e.errorCode === 'APPARAAT_VERLOPEN') {
        setFout(e.message); onAnderAccount?.(); // val terug op volledige login
      } else {
        setFout(e.message || 'Onjuiste code.');
      }
    } finally { setLaden(false); }
  }

  async function koppel() {
    if (stap === 'code') {
      if (code.length !== CODE_LENGTE) return setFout(`Kies een ${CODE_LENGTE}-cijferige code.`);
      setFout(''); setStap('herhaal'); return;
    }
    if (code2 !== code) { setFout('De codes komen niet overeen.'); setCode2(''); setStap('code'); setCode(''); return; }
    setLaden(true); setFout('');
    try {
      const naam = typeof navigator !== 'undefined' ? (navigator.platform || 'Dit apparaat') : 'Dit apparaat';
      await apiFetch('/auth/apparaat/koppelen', { method: 'POST', body: { toegangscode: code, apparaatNaam: naam } });
      onGelukt?.();
    } catch (e) {
      setFout(e.message || 'Kon apparaat niet koppelen.'); setStap('code'); setCode(''); setCode2('');
    } finally { setLaden(false); }
  }

  const isKoppel = modus === 'koppelen';
  const titel = isKoppel
    ? (stap === 'code' ? 'Onthoud dit apparaat' : 'Herhaal je code')
    : 'Welkom terug';
  const uitleg = isKoppel
    ? (stap === 'code'
        ? `Kies een ${CODE_LENGTE}-cijferige toegangscode. Daarmee log je op dit toestel voortaan snel en veilig in — zonder e-mailcode.`
        : `Voer dezelfde ${CODE_LENGTE} cijfers nog een keer in ter bevestiging.`)
    : `Voer je ${CODE_LENGTE}-cijferige toegangscode in${apparaatNaam ? '' : ''}.`;

  const huidig = isKoppel && stap === 'herhaal' ? code2 : code;
  const setHuidig = isKoppel && stap === 'herhaal' ? setCode2 : setCode;
  const onCompleet = isKoppel ? undefined : (v) => snelleLogin(v);

  return (
    <div className="min-h-screen bg-brand-hero flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-soft-lg p-7 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
          <Zap className="w-7 h-7 text-brand-600" />
        </div>
        <h2 className="font-display text-xl font-medium text-ink-1 mb-1">{titel}</h2>
        <p className="text-ink-2 text-sm mb-6">{uitleg}</p>

        <CodeInvoer waarde={huidig} setWaarde={setHuidig} onCompleet={onCompleet} disabled={laden} />

        {fout && <p className="text-sm text-red-600 mt-4">{fout}</p>}

        <div className="mt-6 space-y-3">
          {isKoppel ? (
            <>
              <button onClick={koppel} disabled={laden || huidig.length !== CODE_LENGTE}
                className="btn-inst w-full py-3.5 disabled:opacity-50">
                {laden ? 'Bezig…' : (stap === 'code' ? 'Volgende' : 'Apparaat koppelen')}
              </button>
              <button onClick={onAnnuleer} className="text-sm text-ink-2 hover:underline">
                Nu niet — vraag me later
              </button>
            </>
          ) : (
            <>
              <button onClick={() => snelleLogin()} disabled={laden || code.length < 5}
                className="btn-inst w-full py-3.5 disabled:opacity-50">
                {laden ? 'Inloggen…' : 'Inloggen'}
              </button>
              <button onClick={onAnderAccount} className="text-sm text-brand-600 hover:underline">
                Met e-mail en wachtwoord inloggen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
