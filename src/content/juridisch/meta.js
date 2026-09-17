/**
 * meta.js — centrale versie- en bedrijfsgegevens van de juridische documenten.
 *
 * Wijzig je een document inhoudelijk? Maak dan een nieuwe versiemap aan
 * (bijv. ./1.1/), zet JURIDISCH_VERSIE + GELDIG_VANAF op de nieuwe waarden en
 * laat de oude map staan: die blijft bereikbaar via /voorwaarden/archief.
 * De API (swiftbridge-api/src/lib/juridisch.js) moet hetzelfde versienummer
 * exporteren, zodat bij registratie de juiste versie wordt vastgelegd.
 */

export const JURIDISCH_VERSIE = '1.0';
export const GELDIG_VANAF = '17 september 2026';
export const GELDIG_VANAF_ISO = '2026-09-17';

/**
 * Staat SwiftBridge al als agent in het openbare DNB-register?
 * Zolang de samenwerking met de EMI-partner niet rond is: false.
 * Bepaalt welke tekst de {{AGENT_REGISTRATIE...}}-tokens krijgen (zie tokens.js).
 */
export const AGENT_GEREGISTREERD = false;

export const BEDRIJF = {
  naam: 'SwiftBridge B.V.',
  adres: 'Piet Heinstraat 137, 2518 CG Den Haag',
  kvk: '42138434',
};
