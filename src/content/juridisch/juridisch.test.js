/**
 * juridisch.test.js — inhoud van de juridische documenten v1.0:
 * alle 11 documenten laden, geen [PLACEHOLDER]s of emoji meer, contract-
 * invullingen aanwezig en de agent-tokens geven zolang de EMI-koppeling niet
 * rond is NOOIT de claim dat SwiftBridge al als agent geregistreerd is.
 */
import { describe, test, expect } from 'vitest';
import {
  DOCUMENTEN,
  VERSIES,
  laadMarkdown,
  heeftDocument,
  documentOpRoute,
  archiefRoute,
} from './index';
import { JURIDISCH_VERSIE, GELDIG_VANAF, GELDIG_VANAF_ISO, AGENT_GEREGISTREERD, BEDRIJF } from './meta';
import { vervangTokens } from './tokens';
import { parseMarkdown } from '../../lib/juridisch/parser';

const VERWACHT = [
  ['voorwaarden', '/voorwaarden'],
  ['voorwaarden-betaaldiensten', '/voorwaarden/betaaldiensten'],
  ['voorwaarden-digitale-toegang', '/voorwaarden/digitale-toegang'],
  ['acceptatiecriteria-zakelijk', '/zakelijk/acceptatiecriteria'],
  ['jouw-geld', '/veiligheid/jouw-geld'],
  ['veiligheidsregels', '/veiligheid/regels'],
  ['klachten-en-geschillen', '/klachten/regeling'],
  ['kenmerken-particulier', '/particulier/kenmerken'],
  ['kenmerken-zakelijk', '/zakelijk/kenmerken'],
  ['tarieven', '/tarieven'],
  ['privacy', '/privacy'],
];

// Placeholders zoals [DATUM INVULLEN], [BEDRAG], [NUMMER], [CONTROLEREN: ...].
const PLACEHOLDER = /\[[A-Z][A-Z .:_-]{2,}/;
const EMOJI = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|\u{FE0F}/u;
const AGENT_CLAIM = /staat als agent geregistreerd|is bij DNB geregistreerd|is als agent geregistreerd|geregistreerd bij DNB/i;

async function laadAlles(opties) {
  const uit = {};
  for (const doc of DOCUMENTEN) {
    const ruw = await laadMarkdown(doc.slug);
    uit[doc.slug] = { ruw, tekst: vervangTokens(ruw, opties) };
  }
  return uit;
}

describe('meta', () => {
  test('versie, datum, agent-status en bedrijfsgegevens volgens contract', () => {
    expect(JURIDISCH_VERSIE).toBe('1.0');
    expect(GELDIG_VANAF).toBe('17 september 2026');
    expect(GELDIG_VANAF_ISO).toBe('2026-09-17');
    expect(AGENT_GEREGISTREERD).toBe(false);
    expect(BEDRIJF).toEqual({ naam: 'SwiftBridge B.V.', adres: 'Piet Heinstraat 137, 2518 CG Den Haag', kvk: '42138434' });
    expect(VERSIES[0]).toMatchObject({ versie: '1.0', geldigVanaf: GELDIG_VANAF, geldigVanafIso: GELDIG_VANAF_ISO });
  });
});

describe('registry', () => {
  test('11 documenten met de afgesproken slugs en routes', () => {
    expect(DOCUMENTEN.map((d) => [d.slug, d.route])).toEqual(VERWACHT);
    for (const doc of DOCUMENTEN) {
      expect(doc.versie).toBe('1.0');
      expect(doc.titel).toBeTruthy();
      expect(heeftDocument(doc.slug, '1.0')).toBe(true);
    }
  });

  test('route- en archief-hulpfuncties', () => {
    expect(documentOpRoute('/zakelijk/kenmerken/')?.slug).toBe('kenmerken-zakelijk');
    expect(documentOpRoute('/voorwaarden/betaaldiensten#artikel-9')?.slug).toBe('voorwaarden-betaaldiensten');
    expect(documentOpRoute('/zakelijk')).toBeNull();
    expect(archiefRoute('1.0', 'privacy')).toBe('/voorwaarden/archief/1.0/privacy');
    expect(heeftDocument('privacy', '0.9')).toBe(false);
    expect(heeftDocument('bestaat-niet', '1.0')).toBe(false);
  });

  test('onbekend document of onbekende versie geeft een fout', async () => {
    await expect(laadMarkdown('bestaat-niet')).rejects.toThrow();
    await expect(laadMarkdown('privacy', '9.9')).rejects.toThrow();
  });
});

describe('documenten v1.0', () => {
  test('alle 11 laden, beginnen met een titel en hebben de juiste geldigheidsdatum', async () => {
    const docs = await laadAlles();
    expect(Object.keys(docs)).toHaveLength(11);
    for (const [slug, { ruw }] of Object.entries(docs)) {
      expect(ruw.length, slug).toBeGreaterThan(1000);
      expect(ruw.startsWith('# '), slug).toBe(true);
      expect(ruw, slug).toMatch(/[Vv]ersie 1\.0[,]? — geldig vanaf 17 september 2026|versie 1\.0, geldig vanaf 17 september 2026/);
    }
  });

  test('geen [PLACEHOLDER] en geen emoji meer', async () => {
    const docs = await laadAlles({ agentGeregistreerd: false });
    for (const [slug, { ruw, tekst }] of Object.entries(docs)) {
      expect(ruw, slug).not.toMatch(PLACEHOLDER);
      expect(tekst, slug).not.toMatch(PLACEHOLDER);
      expect(tekst, slug).not.toMatch(EMOJI);
      expect(tekst, slug).not.toContain('INVULLEN');
      expect(tekst, slug).not.toContain('{{');
    }
  });

  test('contract-invullingen staan erin', async () => {
    const d = await laadAlles();
    expect(d.voorwaarden.tekst).toContain('KvK 42138434');

    expect(d['kenmerken-particulier'].tekst).toContain('| Maximum per transactie | € 5.000 |');
    expect(d['kenmerken-particulier'].tekst).toContain('| Maximum per week | € 5.000 |');
    expect(d['kenmerken-particulier'].tekst).not.toMatch(/Maximum per (dag|maand)/);

    expect(d['kenmerken-zakelijk'].tekst).toContain('| Standaard maximum per transactie | € 5.000 |');
    expect(d['kenmerken-zakelijk'].tekst).toContain('| Standaard maximum per week | € 5.000 |');
    expect(d['kenmerken-zakelijk'].tekst).not.toContain('Standaard maximum per maand');

    expect(d.tarieven.tekst.match(/\| Geen kosten \|/g)).toHaveLength(3);
    expect(d.tarieven.tekst).not.toContain('€ [');

    expect(d.privacy.tekst).toContain('Camera- en gespreksopnames: wij maken geen camera- of gespreksopnames. Gesprekken met onze digitale assistent bewaren wij maximaal 90 dagen.');
    expect(d.privacy.tekst).toContain('Gegevens van afgewezen aanvragen: vijf jaar na het besluit (Wwft). Niet-ingediende concept-aanvragen: 30 dagen na de laatste wijziging.');
  });

  test('ruwe markdown bevat zelf geen registratieclaim; die zit alleen in tokens', async () => {
    const docs = await laadAlles();
    for (const [slug, { ruw }] of Object.entries(docs)) {
      expect(ruw, slug).not.toMatch(AGENT_CLAIM);
    }
    expect(docs.voorwaarden.ruw).toContain('{{AGENT_REGISTRATIE}}');
    expect(docs['jouw-geld'].ruw).toContain('- {{AGENT_REGISTRATIE_05}}');
    expect(docs['kenmerken-particulier'].ruw).toContain('{{AGENT_REGISTRATIE_KORT}}');
    expect(docs['kenmerken-zakelijk'].ruw).toContain('{{AGENT_REGISTRATIE_09}}');
  });

  test('AGENT_GEREGISTREERD=false: "nog niet"-teksten en nooit "staat als agent geregistreerd"', async () => {
    const d = await laadAlles({ agentGeregistreerd: false });
    for (const [slug, { tekst }] of Object.entries(d)) {
      expect(tekst, slug).not.toMatch(/staat als agent geregistreerd/i);
      expect(tekst, slug).not.toMatch(AGENT_CLAIM);
    }
    expect(d.voorwaarden.tekst).toContain('SwiftBridge wordt als agent ingeschreven in het openbare register van DNB zodra de samenwerking met onze EMI-partner is afgerond. Tot die tijd voeren wij geen betaaldiensten uit.');
    expect(d['jouw-geld'].tekst).toContain('- SwiftBridge B.V. wordt bij DNB ingeschreven als **agent** van die instelling zodra de samenwerking is afgerond. Daarna kun je die registratie zelf nakijken in het openbare register op www.dnb.nl.');
    expect(d['kenmerken-particulier'].tekst).toContain('De inschrijving als agent bij DNB volgt zodra de samenwerking met onze EMI-partner is afgerond.');
    expect(d['kenmerken-zakelijk'].tekst).toContain('agentmodel onder een vergunninghoudende EMI, inschrijving als agent bij DNB zodra de samenwerking is afgerond.');
  });

  test('standaard (meta) gebruikt de "nog niet"-tekst', async () => {
    const ruw = await laadMarkdown('voorwaarden');
    expect(vervangTokens(ruw)).not.toMatch(/staat als agent geregistreerd/);
  });

  test('AGENT_GEREGISTREERD=true geeft de oorspronkelijke formuleringen', async () => {
    const d = await laadAlles({ agentGeregistreerd: true });
    expect(d.voorwaarden.tekst).toContain('SwiftBridge zelf staat als agent geregistreerd in het openbare register van DNB.');
    expect(d['jouw-geld'].tekst).toContain('SwiftBridge B.V. is bij DNB geregistreerd als **agent** van die instelling.');
    expect(d['kenmerken-particulier'].tekst).toContain('SwiftBridge staat als agent geregistreerd bij DNB.');
    expect(d['kenmerken-zakelijk'].tekst).toContain('agentmodel onder een vergunninghoudende EMI, geregistreerd bij DNB.');
  });

  test('koppen krijgen unieke ankers; artikel-9 bestaat in de Voorwaarden Betaaldiensten', async () => {
    const d = await laadAlles();
    for (const [slug, { tekst }] of Object.entries(d)) {
      const ids = [];
      for (const blok of parseMarkdown(tekst)) {
        if (blok.type === 'kop') {
          ids.push(blok.id);
          if (blok.aliasId) ids.push(blok.aliasId);
        }
      }
      expect(new Set(ids).size, slug).toBe(ids.length);
    }
    const koppen = parseMarkdown(d['voorwaarden-betaaldiensten'].tekst).filter((b) => b.type === 'kop');
    const art9 = koppen.find((k) => k.aliasId === 'artikel-9');
    expect(art9?.id).toBe('9-wanneer-wij-een-overboeking-pauzeren-voor-een-controle');
  });
});
