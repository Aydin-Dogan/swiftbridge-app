// "Voorkeuren beheren" en "Uitschrijven" onderaan elke mail wijzen naar
// /account/notificaties (swiftbridge-api src/services/email/base.js). Dat adres
// bestond in de app niet: de klant kwam op de foutpagina (ronde 3, onderdeel 5).
// Nu opent het Profiel, bij de meldingsvoorkeuren.

// AppShell opent bij ?tab=profiel de Profiel-tab, bij de meldingsvoorkeuren.
export const VOORKEUREN_IN_APP = '/app?tab=profiel';

// Uitgelogd eerst inloggen. Login.jsx volgt ?next= voor /app-paden, dus daarna
// komt de klant alsnog bij zijn voorkeuren.
export function voorkeurenPad(ingelogd) {
  return ingelogd ? VOORKEUREN_IN_APP : `/login?next=${encodeURIComponent(VOORKEUREN_IN_APP)}`;
}

// Welk tabblad ?tab= opent. Alleen 'profiel'; een andere waarde negeren we.
export function tabUitZoek(zoek) {
  return new URLSearchParams(zoek || '').get('tab') === 'profiel' ? 'profiel' : null;
}
