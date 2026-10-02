/**
 * OpenstaandeVerzoeken.jsx — "wij hebben iets van u nodig".
 *
 * WAAROM DIT BOVENAAN HET OVERZICHT STAAT (2-10-2026)
 * Een medewerker kan sinds vandaag iets vragen aan een rekeninghouder, ook als
 * die nog geen enkele transactie en geen KYC-dossier heeft. Dat verzoek is
 * alleen zinvol als de klant het ook ziet. Hij krijgt een melding, maar een
 * melding verdwijnt; dit blijft staan tot het is beantwoord.
 *
 * Bewust geen apart tabblad: wie hier binnenkomt moet het meteen zien, niet
 * ergens moeten zoeken.
 */
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

export default function OpenstaandeVerzoeken() {
  const [verzoeken, setVerzoeken] = useState([]);
  const [antwoorden, setAntwoorden] = useState({});
  const [bezigId, setBezigId] = useState(null);
  const [fout, setFout] = useState('');

  const haalOp = useCallback(async () => {
    try {
      const d = await apiFetch('/verzoeken');
      setVerzoeken(d.verzoeken || []);
    } catch {
      // Stil: dit blok is aanvullend. Een storing hier mag het overzicht niet
      // in de weg zitten.
    }
  }, []);

  useEffect(() => {
    let geannuleerd = false;
    (async () => {
      try {
        const d = await apiFetch('/verzoeken');
        if (!geannuleerd) setVerzoeken(d.verzoeken || []);
      } catch { /* zie boven */ }
    })();
    return () => { geannuleerd = true; };
  }, []);

  async function beantwoord(id) {
    const tekst = (antwoorden[id] || '').trim();
    if (!tekst) return;
    setBezigId(id);
    setFout('');
    try {
      await apiFetch(`/verzoeken/${id}/antwoord`, { method: 'POST', body: { antwoord: tekst } });
      setAntwoorden((a) => ({ ...a, [id]: '' }));
      await haalOp();
    } catch (e) {
      setFout(e?.body?.error || 'Versturen is niet gelukt. Probeer het nog een keer.');
    } finally {
      setBezigId(null);
    }
  }

  const open = verzoeken.filter((v) => v.status === 'open');
  if (open.length === 0) return null;

  return (
    <section
      aria-label="Openstaande verzoeken"
      className="rounded-md border border-amber-200 bg-amber-50 p-4 mb-4"
    >
      <h2 className="font-display text-base font-medium text-amber-900">
        Wij hebben iets van u nodig
      </h2>
      <p className="text-sm text-amber-900/80 mt-0.5">
        {open.length === 1
          ? 'Er staat een vraag voor u klaar. Beantwoord hem, dan kunnen wij verder.'
          : `Er staan ${open.length} vragen voor u klaar.`}
      </p>

      <div className="space-y-3 mt-3">
        {open.map((v) => (
          <div key={v.id} className="rounded-md border border-amber-200 bg-surface p-3">
            <p className="text-sm text-ink-1 whitespace-pre-wrap">{v.vraag}</p>
            <label htmlFor={`antwoord-${v.id}`} className="sr-only">Uw antwoord</label>
            <textarea
              id={`antwoord-${v.id}`}
              rows={3}
              value={antwoorden[v.id] || ''}
              onChange={(e) => setAntwoorden((a) => ({ ...a, [v.id]: e.target.value }))}
              placeholder="Uw antwoord"
              className="mt-2 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => beantwoord(v.id)}
                disabled={bezigId === v.id || !(antwoorden[v.id] || '').trim()}
                className="px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-sm text-white font-semibold disabled:opacity-40"
              >
                Versturen
              </button>
            </div>
          </div>
        ))}
      </div>

      {fout && <div role="alert" className="text-sm text-red-700 mt-2">{fout}</div>}
    </section>
  );
}
