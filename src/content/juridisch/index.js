/**
 * Registry van de juridische documenten (SwiftBridge juridische documenten v1.0).
 *
 * De teksten staan als markdown in een map per versie (./1.0/...). Compliance
 * kan zo een tekst wijzigen zonder componenten aan te passen. Nieuwe versie?
 * Kopieer de map naar bijv. ./1.1/, pas de teksten aan, voeg de versie toe aan
 * VERSIES en zet JURIDISCH_VERSIE in meta.js om. De oude map blijft via het
 * archief bereikbaar (/voorwaarden/archief/1.0/<slug>).
 *
 * De markdown wordt pas geladen als een pagina hem nodig heeft (Vite '?raw' +
 * dynamische import), zodat deze registry licht blijft om te importeren.
 */
import { JURIDISCH_VERSIE, GELDIG_VANAF, GELDIG_VANAF_ISO } from './meta';

export { JURIDISCH_VERSIE, GELDIG_VANAF, GELDIG_VANAF_ISO };

/** Alle gepubliceerde versies, nieuwste eerst. */
export const VERSIES = [
  { versie: '1.0', geldigVanaf: '17 september 2026', geldigVanafIso: '2026-09-17' },
];

/**
 * De elf documenten. `bestand` is relatief aan de versiemap; `linkKey` is de
 * i18n-sleutel voor de linktekst in footers en contextlinks.
 */
export const DOCUMENTEN = [
  { nummer: '01', slug: 'voorwaarden', titel: 'Algemene Voorwaarden', route: '/voorwaarden', bestand: '01-algemene-voorwaarden.md', linkKey: 'link_voorwaarden' },
  { nummer: '02', slug: 'voorwaarden-betaaldiensten', titel: 'Voorwaarden Betaaldiensten', route: '/voorwaarden/betaaldiensten', bestand: '02-voorwaarden-betaaldiensten.md', linkKey: 'link_voorwaarden_betaaldiensten' },
  { nummer: '03', slug: 'voorwaarden-digitale-toegang', titel: 'Voorwaarden Digitale Toegang', route: '/voorwaarden/digitale-toegang', bestand: '03-voorwaarden-digitale-toegang.md', linkKey: 'link_voorwaarden_digitale_toegang' },
  { nummer: '04', slug: 'acceptatiecriteria-zakelijk', titel: 'Acceptatiecriteria zakelijke klanten', route: '/zakelijk/acceptatiecriteria', bestand: '04-acceptatiecriteria-zakelijk.md', linkKey: 'link_acceptatiecriteria' },
  { nummer: '05', slug: 'jouw-geld', titel: 'Hoe jouw geld beschermd is', route: '/veiligheid/jouw-geld', bestand: '05-hoe-jouw-geld-beschermd-is.md', linkKey: 'link_jouw_geld' },
  { nummer: '06', slug: 'veiligheidsregels', titel: 'Veiligheidsregels', route: '/veiligheid/regels', bestand: '06-veiligheidsregels.md', linkKey: 'link_veiligheidsregels' },
  { nummer: '07', slug: 'klachten-en-geschillen', titel: 'Klachten en geschillen', route: '/klachten/regeling', bestand: '07-klachten-en-geschillen.md', linkKey: 'link_klachtenregeling' },
  { nummer: '08', slug: 'kenmerken-particulier', titel: 'Kenmerken Particulier', route: '/particulier/kenmerken', bestand: '08-kenmerken-particulier.md', linkKey: 'link_kenmerken_particulier' },
  { nummer: '09', slug: 'kenmerken-zakelijk', titel: 'Kenmerken Zakelijk', route: '/zakelijk/kenmerken', bestand: '09-kenmerken-zakelijk.md', linkKey: 'link_kenmerken_zakelijk' },
  { nummer: '10', slug: 'tarieven', titel: 'Tarievenoverzicht', route: '/tarieven', bestand: '10-tarievenoverzicht.md', linkKey: 'link_tarieven' },
  { nummer: '11', slug: 'privacy', titel: 'Privacyverklaring', route: '/privacy', bestand: '11-privacyverklaring.md', linkKey: 'link_privacy' },
].map((doc) => ({ ...doc, versie: JURIDISCH_VERSIE, geldigVanaf: GELDIG_VANAF }));

export const ARCHIEF_ROUTE = '/voorwaarden/archief';

/** Linkgroepen voor footers (volgorde volgens de bouwinstructie). */
export const FOOTER_GROEPEN = [
  {
    kopKey: 'footer_juridisch_kop',
    links: [
      { route: '/voorwaarden', linkKey: 'link_voorwaarden' },
      { route: '/voorwaarden/betaaldiensten', linkKey: 'link_voorwaarden_betaaldiensten' },
      { route: '/voorwaarden/digitale-toegang', linkKey: 'link_voorwaarden_digitale_toegang' },
      { route: '/privacy', linkKey: 'link_privacy' },
      { route: '/klachten', linkKey: 'link_klachten' },
    ],
  },
  {
    kopKey: 'footer_veiligheid_geld_kop',
    links: [
      { route: '/veiligheid/regels', linkKey: 'link_veiligheidsregels' },
      { route: '/veiligheid/jouw-geld', linkKey: 'link_jouw_geld' },
      { route: '/tarieven', linkKey: 'link_tarieven' },
    ],
  },
];

/**
 * Documentnamen die in de teksten voorkomen en automatisch naar het document
 * linken (bijv. "Voorwaarden Betaaldiensten, artikel 11" -> #artikel-11).
 * Zo linkt elke vermelding van "Hoe jouw geld beschermd is" door, zoals de
 * bouwinstructie voorschrijft. De zichtbare tekst verandert niet.
 */
export const KRUISVERWIJZINGEN = [
  { naam: 'Algemene Voorwaarden', slug: 'voorwaarden' },
  { naam: 'Voorwaarden Betaaldiensten', slug: 'voorwaarden-betaaldiensten' },
  { naam: 'Voorwaarden Digitale Toegang', slug: 'voorwaarden-digitale-toegang' },
  { naam: 'Acceptatiecriteria zakelijke klanten', slug: 'acceptatiecriteria-zakelijk' },
  { naam: 'Hoe jouw geld beschermd is', slug: 'jouw-geld' },
  { naam: 'Veiligheidsregels', slug: 'veiligheidsregels' },
  { naam: 'Tarievenoverzicht', slug: 'tarieven' },
].map((v) => ({ ...v, route: DOCUMENTEN.find((d) => d.slug === v.slug).route }));

export function documentOpSlug(slug) {
  return DOCUMENTEN.find((d) => d.slug === slug) || null;
}

export function documentOpRoute(route) {
  const pad = String(route || '').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return DOCUMENTEN.find((d) => d.route === pad) || null;
}

export function versieInfo(versie) {
  return VERSIES.find((v) => v.versie === versie) || null;
}

/** Route van een document in het archief, bijv. /voorwaarden/archief/1.0/privacy. */
export function archiefRoute(versie, slug) {
  return `${ARCHIEF_ROUTE}/${encodeURIComponent(versie)}/${encodeURIComponent(slug)}`;
}

// Alle markdown per versiemap; laden gebeurt pas bij aanroep (code-splitting).
const MARKDOWN_LADERS = import.meta.glob('./*/*.md', { query: '?raw', import: 'default' });

/** Bestaat dit document in deze versie? */
export function heeftDocument(slug, versie = JURIDISCH_VERSIE) {
  const doc = documentOpSlug(slug);
  return Boolean(doc && versieInfo(versie) && MARKDOWN_LADERS[`./${versie}/${doc.bestand}`]);
}

/**
 * Laadt de ruwe markdown van een document (tokens nog niet vervangen).
 * Gooit een fout als slug of versie onbekend is.
 */
export async function laadMarkdown(slug, versie = JURIDISCH_VERSIE) {
  const doc = documentOpSlug(slug);
  const lader = doc && versieInfo(versie) ? MARKDOWN_LADERS[`./${versie}/${doc.bestand}`] : null;
  if (!lader) throw new Error(`Juridisch document niet gevonden: ${versie}/${slug}`);
  return lader();
}
