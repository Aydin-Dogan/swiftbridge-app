// ── Betaalmethodes die de app toont ──────────────────────────────────────────
// Alleen methodes die de API aanneemt (swiftbridge-api/src/lib/betaalmethodes.js,
// METHODES_TOEGESTAAN). Tot 13-10-2026 toonde de betaalstap ook PayPal, SEPA
// bankoverboeking, KBC/CBC, Belfius, Pay By Bank en Billie; daarbij kreeg de
// klant pas na "Bevestigen & betalen" de melding "Ongeldige invoer" (analyse
// aanmeldroute). De API-test betaalmethodesGelijk.test.js leest deze lijst en
// faalt als hier een methode staat die de server weigert.
export const BETAALMETHODES_APP = ['ideal', 'creditcard', 'bancontact', 'applepay', 'klarna'];

// Zolang de server niet heeft gezegd welke methodes bij Mollie aan staan (nog
// niet geladen, Mollie niet ingesteld of storing), tonen we deze uitgeschakeld:
// ze moeten eerst bij Mollie worden aangezet.
export const STANDAARD_UIT = ['applepay', 'klarna'];

// Kan de klant deze methode nu kiezen? `beschikbaar` komt uit
// GET /payments/methodes (null = onbekend).
export function methodeKanNu(id, beschikbaar) {
  if (!BETAALMETHODES_APP.includes(id)) return false;
  if (Array.isArray(beschikbaar)) return beschikbaar.includes(id);
  return !STANDAARD_UIT.includes(id);
}

// Een methode uit een oud concept die nu niet kan, wordt de eerste die wel kan.
export function geldigeMethode(id, beschikbaar) {
  if (methodeKanNu(id, beschikbaar)) return id;
  return BETAALMETHODES_APP.find((m) => methodeKanNu(m, beschikbaar)) || 'ideal';
}
