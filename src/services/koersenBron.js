/**
 * koersenBron.js — één bron voor de live koersen (20-9-2026).
 *
 * De ticker en het overzicht haalden allebei elke minuut hun eigen koersen op,
 * ook als het tabblad op de achtergrond stond. Dat is dubbel werk per klant en
 * telt bij groei hard op (bij 100.000 gelijktijdige klanten schelen deze twee
 * maatregelen ruim de helft van alle verzoeken).
 *
 * - één gedeelde cache van 45 seconden voor de hele pagina;
 * - gelijktijdige aanvragen delen hetzelfde antwoord (geen dubbele fetch);
 * - `pollBijZichtbaar` stopt met ophalen zodra het tabblad verborgen is en
 *   haalt meteen opnieuw op zodra de klant terugkomt.
 */
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MAX_LEEFTIJD_MS = 45_000;

let cache = { data: null, tijd: 0 };
let lopend = null;

export async function haalKoersen({ forceer = false } = {}) {
  const nu = Date.now();
  if (!forceer && cache.data && nu - cache.tijd < MAX_LEEFTIJD_MS) return cache.data;
  if (lopend) return lopend;
  lopend = fetch(`${API}/transactions/koersen`, { credentials: 'include' })
    .then((r) => {
      if (!r.ok) throw new Error(`koersen ${r.status}`);
      return r.json();
    })
    .then((json) => {
      cache = { data: json, tijd: Date.now() };
      return json;
    })
    .finally(() => { lopend = null; });
  return lopend;
}

export function koersenUitCache() {
  return cache.data;
}

/**
 * Roept `taak` direct aan en daarna elke `intervalMs`, maar alleen als het
 * tabblad zichtbaar is. Geeft een opruimfunctie terug (voor useEffect).
 */
export function pollBijZichtbaar(taak, intervalMs) {
  const verborgen = () => typeof document !== 'undefined' && document.hidden;
  const draai = () => { if (!verborgen()) taak(); };
  draai();
  const timer = setInterval(draai, intervalMs);
  const bijTerug = () => { if (!verborgen()) taak(); };
  document.addEventListener('visibilitychange', bijTerug);
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', bijTerug);
  };
}
