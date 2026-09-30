/**
 * InternAanmelden.jsx — het aanmeldscherm van de interne omgeving.
 *
 * Ronde 0, stap 4: de medewerker meldt zich hier aan, niet op het klantscherm.
 * Wachtwoord alleen is nooit genoeg; er volgt altijd een tweede stap.
 *
 * De drie toestanden:
 *   wachtwoord      e-mail + wachtwoord
 *   instellen       eerste keer: QR-code scannen en bevestigen
 *   code            daarna: zescijferige code, of een back-upcode
 *
 * Het scherm vertelt bewust weinig. Bij een fout adres, een fout wachtwoord of
 * een niet-actief account staat er hetzelfde: anders is dit een manier om uit te
 * vinden wie er bij dit bedrijf werkt.
 */
import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

async function stuur(pad, body) {
  const res = await fetch(`${API}/intern/auth/${pad}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  let data = {};
  try { data = await res.json(); } catch { /* leeg antwoord */ }
  return { ok: res.ok, status: res.status, data };
}

function Veld({ label, ...rest }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-2 mb-1.5">{label}</span>
      <input
        {...rest}
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-ink-1
                   focus:border-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-primary/20"
      />
    </label>
  );
}

function Melding({ tekst }) {
  if (!tekst) return null;
  return (
    <p role="alert" className="rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
      {tekst}
    </p>
  );
}

export default function InternAanmelden({ opAangemeld }) {
  const [stap, setStap] = useState('wachtwoord');
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [code, setCode] = useState('');
  const [tussentoken, setTussentoken] = useState(null);
  const [qr, setQr] = useState(null);
  const [backupCodes, setBackupCodes] = useState(null);
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);

  async function verstuurWachtwoord(e) {
    e.preventDefault();
    setFout(''); setBezig(true);
    const { ok, data } = await stuur('aanmelden', { email, wachtwoord });
    setBezig(false);
    if (!ok) { setFout(data.error || 'Aanmelden lukte niet.'); return; }

    setTussentoken(data.tussentoken);
    if (data.stap === 'tweefactor_instellen') {
      // Meteen de QR ophalen: één handeling minder voor de medewerker.
      setBezig(true);
      const inst = await stuur('tweefactor-instellen', { tussentoken: data.tussentoken });
      setBezig(false);
      if (!inst.ok) { setFout(inst.data.error || 'Instellen lukte niet.'); return; }
      setQr(inst.data.qr);
      setTussentoken(inst.data.tussentoken);
      setStap('instellen');
    } else {
      setStap('code');
    }
  }

  async function verstuurCode(e) {
    e.preventDefault();
    setFout(''); setBezig(true);
    const pad = stap === 'instellen' ? 'tweefactor-bevestigen' : 'tweefactor';
    const { ok, data } = await stuur(pad, { tussentoken, code: code.trim() });
    setBezig(false);
    if (!ok) { setFout(data.error || 'Die code klopt niet.'); setCode(''); return; }

    if (data.backupCodes) {
      // Eerst laten opschrijven: hierna zijn ze weg.
      setBackupCodes(data.backupCodes);
      return;
    }
    opAangemeld(data.medewerker);
  }

  // ── Back-upcodes: eenmalig scherm, met een bewuste bevestiging ────────────
  if (backupCodes) {
    return (
      <Omhulsel titel="Bewaar deze back-upcodes">
        <p className="text-sm text-ink-2">
          Elke code werkt één keer en helpt je aanmelden als je je telefoon niet hebt.
          Ze worden nu getoond en daarna nooit meer.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-md border border-border bg-surface-2 p-3 font-mono text-sm text-ink-1">
          {backupCodes.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <button
          type="button"
          // Niet zelf een medewerker-object verzinnen: de sessie staat al, dus
          // vraag de server wie er is aangemeld. Hier stond eerst een stub
          // zonder rol, waardoor het scherm erna wit werd.
          onClick={async () => {
            try {
              const r = await fetch(`${API}/intern/auth/ik`, { credentials: 'include' });
              const d = r.ok ? await r.json() : null;
              opAangemeld(d ? d.medewerker : null);
            } catch {
              opAangemeld(null);
            }
          }}
          className="w-full rounded-md bg-fg-primary px-4 py-2.5 font-medium text-white hover:opacity-90"
        >
          Ik heb ze opgeschreven
        </button>
      </Omhulsel>
    );
  }

  if (stap === 'wachtwoord') {
    return (
      <Omhulsel titel="Interne omgeving">
        <form onSubmit={verstuurWachtwoord} className="space-y-4">
          <Veld label="E-mailadres" type="email" autoComplete="username" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <Veld label="Wachtwoord" type="password" autoComplete="current-password" required
            value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} />
          <Melding tekst={fout} />
          <button type="submit" disabled={bezig}
            className="w-full rounded-md bg-fg-primary px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50">
            {bezig ? 'Bezig...' : 'Volgende'}
          </button>
        </form>
      </Omhulsel>
    );
  }

  return (
    <Omhulsel titel={stap === 'instellen' ? 'Tweefactor instellen' : 'Tweede stap'}>
      {stap === 'instellen' && (
        <>
          <p className="text-sm text-ink-2">
            Scan deze code met je authenticatie-app en vul daarna de zes cijfers in
            die de app toont.
          </p>
          {qr && <img src={qr} alt="QR-code voor de authenticatie-app" className="mx-auto h-44 w-44 rounded-md border border-border" />}
        </>
      )}
      <form onSubmit={verstuurCode} className="space-y-4">
        <Veld
          label={stap === 'instellen' ? 'Code uit de app' : 'Code uit de app of een back-upcode'}
          inputMode="text" autoComplete="one-time-code" required autoFocus
          value={code} onChange={(e) => setCode(e.target.value)}
        />
        <Melding tekst={fout} />
        <button type="submit" disabled={bezig}
          className="w-full rounded-md bg-fg-primary px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50">
          {bezig ? 'Bezig...' : 'Aanmelden'}
        </button>
      </form>
      <button type="button" onClick={() => { setStap('wachtwoord'); setCode(''); setFout(''); setQr(null); }}
        className="w-full text-sm text-ink-3 hover:text-ink-1 hover:underline">
        Opnieuw beginnen
      </button>
    </Omhulsel>
  );
}

function Omhulsel({ titel, children }) {
  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5 rounded-md border border-border bg-surface p-7 shadow-soft">
        <div>
          <h1 className="font-display text-xl font-medium text-ink-1">{titel}</h1>
          {/* Geen logo, geen bedrijfsnaam, geen uitleg over wat hierachter zit. */}
        </div>
        {children}
      </div>
    </div>
  );
}
