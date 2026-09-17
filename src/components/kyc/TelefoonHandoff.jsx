/**
 * TelefoonHandoff.jsx — foto's maken met de telefoon (bank-patroon).
 *
 * Gelicht uit KYCFlow.jsx (gedrag identiek) zodat de KYB-flow hem ook kan
 * gebruiken. De computer maakt een kortlevende link (POST /kyc/handoff), toont
 * een QR-code + kopieerlink en pollt elke 4 s of de telefoon klaar is.
 *
 * Props:
 *   form        { voornaam, achternaam, email, geboortedatum, nationaliteit, telefoon }
 *   token       sessie-sentinel (cookie is leidend; header blijft voor compat)
 *   doel        'kyc' (default) | 'kyb' — bij 'kyb' krijgt het kyc_record context 'kyb'
 *   onFotosKlaar callback zodra de handoff-status 'voltooid' is
 */
import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function TelefoonHandoff({ form, token, doel = 'kyc', onFotosKlaar }) {
  const [url, setUrl] = useState('');
  const [qr, setQr] = useState('');
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');
  const [gekopieerd, setGekopieerd] = useState(false);
  const [verlopen, setVerlopen] = useState(false);

  async function maakLink() {
    setLaden(true);
    setFout('');
    setVerlopen(false);
    try {
      const res = await fetch(`${API}/kyc/handoff`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          voornaam: form.voornaam, achternaam: form.achternaam, email: form.email,
          geboortedatum: form.geboortedatum, nationaliteit: form.nationaliteit, telefoon: form.telefoon,
          // Alleen meesturen als het afwijkt van de standaard, zodat de bestaande
          // KYC-flow exact hetzelfde verzoek blijft sturen.
          ...(doel === 'kyb' ? { doel: 'kyb' } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setUrl(data.url);
      // QR client-side genereren — lazy chunk, de link zelf blijft altijd bruikbaar
      try {
        const QR = await import('qrcode');
        setQr(await QR.toDataURL(data.url, { width: 220, margin: 1, color: { dark: '#1B3252' } }));
      } catch { /* geen QR — link + kopieerknop volstaan */ }
    } catch (e) {
      setFout(e.message || 'Kon geen telefoonlink maken');
    } finally {
      setLaden(false);
    }
  }

  // Poll de handoff-status: 'voltooid' = foto's binnen → computer gaat verder
  useEffect(() => {
    if (!url) return undefined;
    let weg = false;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API}/kyc/handoff/mijn-status`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const d = await res.json();
        if (weg) return;
        if (d.status === 'voltooid') onFotosKlaar();
        else if (d.status === 'verlopen') { setVerlopen(true); setUrl(''); setQr(''); }
      } catch { /* volgende poll */ }
    }, 4000);
    return () => { weg = true; clearInterval(id); };
  }, [url, token, onFotosKlaar]);

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(url);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2500);
    } catch { /* selectie blijft mogelijk */ }
  }

  return (
    <div className="border border-brand-100 bg-brand-50 rounded-md p-4 space-y-3">
      <div className="font-semibold text-ink-1 text-sm">Maak de foto's met je telefoon</div>
      <p className="text-xs text-ink-2">
        De camera van je telefoon maakt scherpere foto's van je document. Scan de QR-code of open de link op je
        telefoon — deze computer gaat automatisch verder zodra de foto's binnen zijn.
      </p>
      {!url && (
        <button onClick={maakLink} disabled={laden}
          className="btn-inst w-full py-2.5 text-sm disabled:opacity-50">
          {laden ? 'Bezig...' : 'Maak telefoonlink'}
        </button>
      )}
      {verlopen && (
        <p className="text-xs text-amber-700">De vorige link is verlopen (15 minuten). Maak een nieuwe link.</p>
      )}
      {fout && <p className="text-xs text-fg-error">{fout}</p>}
      {url && (
        <div className="space-y-3">
          {qr && (
            <img src={qr} alt="QR-code voor je telefoon" width="176" height="176"
              className="mx-auto rounded-md border border-border bg-white p-2" />
          )}
          <div className="text-xs text-ink-2 break-all bg-surface border border-border rounded-md p-2 select-all">{url}</div>
          <button onClick={kopieer}
            className="w-full py-2 rounded-md border border-brand-300 text-brand-700 hover:bg-surface text-xs font-semibold uppercase tracking-[0.16em] transition">
            {gekopieerd ? 'Gekopieerd' : 'Kopieer link'}
          </button>
          <p className="flex items-center justify-center gap-2 text-xs text-ink-2">
            <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" aria-hidden="true" />
            Wachten op je telefoon... de link is 15 minuten geldig.
          </p>
        </div>
      )}
    </div>
  );
}

export default TelefoonHandoff;
