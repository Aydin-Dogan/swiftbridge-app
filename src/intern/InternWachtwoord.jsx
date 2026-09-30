/**
 * InternWachtwoord.jsx — een medewerker wijzigt zijn eigen wachtwoord.
 *
 * Nodig omdat het eerste account met een gegenereerd wachtwoord uit een bestand
 * werd aangemaakt; zonder dit scherm zit je daar voorgoed aan vast.
 *
 * Het huidige wachtwoord is verplicht, ook al ben je aangemeld. Dat is geen
 * pesterij: zonder die eis kan iemand die even achter een onbeheerde werkplek
 * gaat zitten het wachtwoord veranderen en jou buitensluiten.
 */
import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function InternWachtwoord({ opKlaar }) {
  const [huidig, setHuidig] = useState('');
  const [nieuw, setNieuw] = useState('');
  const [nogmaals, setNogmaals] = useState('');
  const [fout, setFout] = useState('');
  const [gelukt, setGelukt] = useState(false);
  const [bezig, setBezig] = useState(false);

  async function verstuur(e) {
    e.preventDefault();
    setFout('');

    if (nieuw !== nogmaals) {
      setFout('De twee nieuwe wachtwoorden zijn niet gelijk.');
      return;
    }

    setBezig(true);
    let data = {};
    let ok = false;
    try {
      const res = await fetch(`${API}/intern/auth/wachtwoord`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ huidigWachtwoord: huidig, nieuwWachtwoord: nieuw }),
      });
      ok = res.ok;
      try { data = await res.json(); } catch { /* leeg antwoord */ }
    } catch {
      setBezig(false);
      setFout('Geen verbinding. Probeer het opnieuw.');
      return;
    }
    setBezig(false);

    if (!ok) { setFout(data.error || 'Wijzigen lukte niet.'); return; }

    // Alles wissen: laat geen wachtwoorden in het formulier achter.
    setHuidig(''); setNieuw(''); setNogmaals('');
    setGelukt(true);
  }

  if (gelukt) {
    return (
      <Kader titel="Wachtwoord gewijzigd">
        <p className="text-sm text-ink-2">
          Je wachtwoord is aangepast. Andere sessies zijn afgemeld; deze blijft werken.
        </p>
        <button type="button" onClick={opKlaar}
          className="w-full rounded-md bg-fg-primary px-4 py-2.5 font-medium text-white hover:opacity-90">
          Terug
        </button>
      </Kader>
    );
  }

  return (
    <Kader titel="Wachtwoord wijzigen">
      <form onSubmit={verstuur} className="space-y-4">
        <Veld label="Huidig wachtwoord" type="password" autoComplete="current-password" required
          value={huidig} onChange={(e) => setHuidig(e.target.value)} />
        <Veld label="Nieuw wachtwoord" type="password" autoComplete="new-password" required
          value={nieuw} onChange={(e) => setNieuw(e.target.value)} />
        <Veld label="Nieuw wachtwoord nogmaals" type="password" autoComplete="new-password" required
          value={nogmaals} onChange={(e) => setNogmaals(e.target.value)} />

        <p className="text-xs text-ink-3">
          Minstens 12 tekens. Gebruik woorden die niets met jou of met SwiftBridge
          te maken hebben — je eigen naam of het bedrijf erin maakt het makkelijk
          te raden.
        </p>

        {fout && (
          <p role="alert" className="rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {fout}
          </p>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={opKlaar}
            className="flex-1 rounded-md border border-border px-4 py-2.5 text-ink-2 hover:bg-surface-2">
            Annuleren
          </button>
          <button type="submit" disabled={bezig}
            className="flex-1 rounded-md bg-fg-primary px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50">
            {bezig ? 'Bezig...' : 'Wijzigen'}
          </button>
        </div>
      </form>
    </Kader>
  );
}

function Veld({ label, ...rest }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-2 mb-1.5">{label}</span>
      <input {...rest}
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-ink-1
                   focus:border-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-primary/20" />
    </label>
  );
}

function Kader({ titel, children }) {
  return (
    <div className="min-h-screen bg-surface-2 flex items-start justify-center p-4 pt-16">
      <div className="w-full max-w-sm space-y-5 rounded-md border border-border bg-surface p-7 shadow-soft">
        <h1 className="font-display text-xl font-medium text-ink-1">{titel}</h1>
        {children}
      </div>
    </div>
  );
}
