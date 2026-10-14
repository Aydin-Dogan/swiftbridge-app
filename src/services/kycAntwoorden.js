// ── Doel en gebruik: de vragen vóór de eerste betaling (14-10-2026) ──────────
// Stap 6 van de aanmeldroute: waarvoor stuurt de klant geld, hoeveel per maand,
// waar komt het vandaan, is hij politiek prominent, en naar welke landen. De
// KYC-poort van de API keurt niemand goed zonder deze antwoorden.
//
// De keuzelijsten zijn een spiegel van swiftbridge-api src/lib/kyc/antwoorden.js
// (KEUZES). Verander je er een, verander dan beide: de API weigert een code die
// hij niet kent.
import { apiFetch } from './api';

export const DOELEN = ['familie', 'eigen_rekening', 'huur', 'zorg', 'onderwijs', 'cadeau', 'zakelijk', 'anders'];
export const MAANDVOLUMES = ['tot_500', '500_2000', '2000_5000', '5000_10000', 'meer'];
export const BRONNEN = ['loon', 'eigen_bedrijf', 'uitkering', 'pensioen', 'spaargeld', 'schenking', 'overig'];
export const MAX_LANDEN = 10;

// Opties voor KeuzeGroep: elke code met zijn vertaalsleutel.
export function opties(lijst, voorvoegsel) {
  return lijst.map((waarde) => ({ waarde, tKey: `${voorvoegsel}_${waarde}` }));
}

// Wie in deze sessie al antwoordde, hoeft bij het volgende scherm niet op de
// server te wachten. Per klant: op een gedeeld toestel kan na uitloggen iemand
// anders inloggen, en die moet de vragen wel krijgen.
const beantwoordDoor = new Set();

// Zette een antwoord de klant terug in beoordeling, dan blijft "We bekijken ze
// eerst" staan zolang deze sessie duurt. Het profiel in de app (kycStatus)
// ververst pas bij een nieuwe sessie; zonder dit kwam de klant bij de volgende
// tik op Overmaken weer in de betaalflow, en weigerde de server pas aan het eind.
const terugInBeoordeling = new Set();

export function isBekendBeantwoord(gebruikerId) {
  return Boolean(gebruikerId) && beantwoordDoor.has(gebruikerId);
}

export function isTerugInBeoordeling(gebruikerId) {
  return Boolean(gebruikerId) && terugInBeoordeling.has(gebruikerId);
}

// GET /kyc/antwoorden → { beantwoord, antwoorden }
export async function haalAntwoorden(gebruikerId) {
  const d = await apiFetch('/kyc/antwoorden');
  const beantwoord = d?.beantwoord === true;
  if (beantwoord && gebruikerId) beantwoordDoor.add(gebruikerId);
  return { beantwoord, antwoorden: d?.antwoorden || null };
}

// PUT /kyc/antwoorden → { beantwoord, opnieuwInBeoordeling }
// opnieuwInBeoordeling: een al goedgekeurde klant gaf een antwoord dat het
// risico verandert; een medewerker kijkt eerst, de klant kan nog niet betalen.
export async function slaAntwoordenOp(gebruikerId, antwoorden) {
  const d = await apiFetch('/kyc/antwoorden', { method: 'PUT', body: antwoorden });
  const beantwoord = d?.beantwoord === true;
  const opnieuwInBeoordeling = d?.opnieuwInBeoordeling === true;
  if (beantwoord && gebruikerId) beantwoordDoor.add(gebruikerId);
  if (opnieuwInBeoordeling && gebruikerId) terugInBeoordeling.add(gebruikerId);
  return { beantwoord, opnieuwInBeoordeling };
}

// Alleen voor de tests: begin met een lege sessie.
export function vergeetBeantwoord() {
  beantwoordDoor.clear();
  terugInBeoordeling.clear();
}
