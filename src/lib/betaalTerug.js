// Na iDEAL stuurt Mollie de klant terug naar /app?payment=<transactie-id>
// (swiftbridge-api/src/services/mollie.js, betaalTerugUrl). Die parameter werd
// nergens gelezen, dus de klant zag na het betalen niets (analyse aanmeldroute
// 13-10-2026). De app toont nu de status van die betaling (BetaalStatusKaart).

// Transactie-id's zijn uuid's (POST /transactions).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function betaalTerugId(zoek) {
  const id = new URLSearchParams(zoek || '').get('payment');
  return id && UUID.test(id) ? id : null;
}

// Verlopen sessie bij de terugkeer: na het inloggen terug naar de betaalstatus.
// Login.jsx volgt ?next= (alleen /app-paden).
export function loginPadVoor(zoek) {
  const id = betaalTerugId(zoek);
  return id ? `/login?next=${encodeURIComponent(`/app?payment=${id}`)}` : '/login';
}
