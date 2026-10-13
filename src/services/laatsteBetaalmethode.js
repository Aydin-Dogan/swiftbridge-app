// ── Laatst gebruikte betaalmethode, onthouden op dit toestel ─────────────────
// Aanmeldroute punt 11 (13-10-2026): bij de volgende overboeking staat de
// methode van de vorige (iDEAL, kaart, Bancontact ...) voorgekozen.
// Alleen de NAAM van de methode, nooit bankgegevens: geen IBAN, geen bank, geen
// rekeninghouder. Daarom mag dit in localStorage en hoeft het bij uitloggen
// niet weg (de sleutel valt bewust buiten het patroon in App.jsx).
// Of de methode nu kan, bepaalt de betaalflow nog steeds met methodeKanNu.
import { BETAALMETHODES_APP } from './betaalmethodes';

export const LAATSTE_METHODE_SLEUTEL = 'sb_laatste_betaalmethode';

export function leesLaatsteBetaalmethode() {
  try {
    const methode = localStorage.getItem(LAATSTE_METHODE_SLEUTEL);
    return BETAALMETHODES_APP.includes(methode) ? methode : null;
  } catch {
    return null;
  }
}

export function bewaarLaatsteBetaalmethode(methode) {
  if (!BETAALMETHODES_APP.includes(methode)) return;
  try { localStorage.setItem(LAATSTE_METHODE_SLEUTEL, methode); } catch { /* privémodus */ }
}
