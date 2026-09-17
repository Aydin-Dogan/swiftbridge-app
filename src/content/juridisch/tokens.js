/**
 * tokens.js — dynamische tekstdelen in de juridische markdown.
 *
 * Een token staat in de markdown als {{NAAM}}. De tekst hangt af van de
 * agent-status bij DNB (AGENT_GEREGISTREERD in meta.js): zolang de
 * EMI-samenwerking niet rond is, mag nergens staan dat SwiftBridge al als
 * agent geregistreerd IS.
 *
 * Let op: zet AGENT_GEREGISTREERD pas op true zodra de registratie in het
 * openbare DNB-register daadwerkelijk zichtbaar is, en publiceer dan een nieuwe
 * documentversie (de archiefversies gebruiken dezelfde tokens).
 */
import { AGENT_GEREGISTREERD, BEDRIJF, GELDIG_VANAF, JURIDISCH_VERSIE } from './meta';

const AGENT_TEKSTEN = {
  AGENT_REGISTRATIE: {
    geregistreerd: 'SwiftBridge zelf staat als agent geregistreerd in het openbare register van DNB.',
    nogNiet: 'SwiftBridge wordt als agent ingeschreven in het openbare register van DNB zodra de samenwerking met onze EMI-partner is afgerond. Tot die tijd voeren wij geen betaaldiensten uit.',
  },
  AGENT_REGISTRATIE_05: {
    geregistreerd: 'SwiftBridge B.V. is bij DNB geregistreerd als **agent** van die instelling. Je kunt die registratie zelf nakijken in het openbare register op www.dnb.nl.',
    nogNiet: 'SwiftBridge B.V. wordt bij DNB ingeschreven als **agent** van die instelling zodra de samenwerking is afgerond. Daarna kun je die registratie zelf nakijken in het openbare register op www.dnb.nl.',
  },
  AGENT_REGISTRATIE_KORT: {
    geregistreerd: 'SwiftBridge staat als agent geregistreerd bij DNB.',
    nogNiet: 'De inschrijving als agent bij DNB volgt zodra de samenwerking met onze EMI-partner is afgerond.',
  },
  AGENT_REGISTRATIE_09: {
    geregistreerd: 'geregistreerd bij DNB',
    nogNiet: 'inschrijving als agent bij DNB zodra de samenwerking is afgerond',
  },
};

/** Alle tokenwaarden voor de gegeven agent-status. */
export function tokenWaarden({ agentGeregistreerd = AGENT_GEREGISTREERD } = {}) {
  const waarden = {
    BEDRIJF_NAAM: BEDRIJF.naam,
    BEDRIJF_ADRES: BEDRIJF.adres,
    BEDRIJF_KVK: BEDRIJF.kvk,
    GELDIG_VANAF,
    JURIDISCH_VERSIE,
  };
  for (const [naam, teksten] of Object.entries(AGENT_TEKSTEN)) {
    waarden[naam] = agentGeregistreerd ? teksten.geregistreerd : teksten.nogNiet;
  }
  return waarden;
}

/**
 * Vervangt {{NAAM}}-tokens in een markdowntekst. Onbekende tokens worden
 * leeggemaakt (nooit een ruwe {{...}} op de pagina) en in dev gelogd.
 */
export function vervangTokens(tekst, opties = {}) {
  const waarden = tokenWaarden(opties);
  return String(tekst ?? '').replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_, naam) => {
    if (Object.prototype.hasOwnProperty.call(waarden, naam)) return waarden[naam];
    if (import.meta.env?.DEV) console.warn(`[juridisch] onbekend token {{${naam}}}`);
    return '';
  });
}
