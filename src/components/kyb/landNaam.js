/**
 * landNaam.js — landen voor de KYB-flow (ISO 3166-1 alpha-2).
 *
 * Alle landen van de wereld, met namen in de taal van de app via
 * Intl.DisplayNames (geen eigen vertaallijst nodig). Zoeken negeert
 * accenten en kent veelgebruikte alternatieve namen, zodat "Turkije",
 * "Turkey" en "Türkiye" allemaal Turkije vinden (bevinding Aydin 16-9:
 * stap 4 bleef hangen omdat "Turkije" niet werd gevonden).
 */

const ISO_CODES = (
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ '
  + 'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR '
  + 'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP '
  + 'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT '
  + 'MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW '
  + 'SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG '
  + 'UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'
).split(' ');

// Alternatieve zoeknamen (kleine letters, zonder accenten).
const ALIASSEN = {
  TR: ['turkije', 'turkey', 'turkiye', 'turkei', 'turquie', 'turkiye cumhuriyeti'],
  NL: ['holland', 'nederland', 'netherlands'],
  GB: ['engeland', 'england', 'uk', 'groot-brittannie', 'great britain', 'united kingdom'],
  US: ['amerika', 'america', 'usa', 'vs', 'verenigde staten'],
  DE: ['duitsland', 'germany', 'deutschland'],
  AE: ['emiraten', 'dubai', 'uae'],
  XK: ['kosovo'],
  MA: ['marokko', 'morocco'],
  RU: ['rusland', 'russia'],
  UA: ['oekraine', 'ukraine'],
  BY: ['wit-rusland', 'belarus'],
  CZ: ['tsjechie', 'czech'],
  MK: ['macedonie', 'noord-macedonie'],
};

const FALLBACK_NL = { XK: 'Kosovo', TR: 'Turkije' };

export function normaliseer(tekst) {
  return String(tekst || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const cache = new Map();

function weergaveNamen(taal) {
  const sleutel = taal || 'nl';
  if (cache.has(sleutel)) return cache.get(sleutel);
  const dn = maakWeergaveNamen(sleutel);
  cache.set(sleutel, dn);
  return dn;
}

function maakWeergaveNamen(taal) {
  try {
    return new Intl.DisplayNames([taal, 'nl'], { type: 'region' });
  } catch {
    return null;
  }
}

function regioNaam(dn, code) {
  try {
    return dn ? dn.of(code) : null;
  } catch {
    return null;
  }
}

/** Naam van een land in de gevraagde taal (standaard Nederlands). */
export function landNaam(code, taal = 'nl') {
  if (!code) return '';
  const naam = regioNaam(weergaveNamen(taal), code);
  if (!naam || naam === code) return FALLBACK_NL[code] || code;
  return naam;
}

/** Alle kiesbare landen, alfabetisch op naam in de gevraagde taal. */
export function kiesbareLanden(taal = 'nl') {
  const coll = new Intl.Collator(taal || 'nl');
  return ISO_CODES
    .map((code) => ({ code, naam: landNaam(code, taal) }))
    .sort((a, b) => coll.compare(a.naam, b.naam));
}

/** Achterwaartse compatibiliteit: Nederlandse lijst. */
export const KIESBARE_LANDEN = kiesbareLanden('nl');

/** Zoekt landen op naam (elke taal-variant), ISO-code of alias. */
export function zoekLanden(zoekterm, taal = 'nl', uitsluiten = []) {
  const q = normaliseer(zoekterm);
  if (!q) return [];
  const lijst = kiesbareLanden(taal).filter((l) => !uitsluiten.includes(l.code));
  const scoor = (l) => {
    const namen = [l.naam, landNaam(l.code, 'nl'), landNaam(l.code, 'en'), ...(ALIASSEN[l.code] || [])].map(normaliseer);
    if (l.code.toLowerCase() === q) return 0;
    if (namen.some((n) => n === q)) return 0;
    if (namen.some((n) => n.startsWith(q))) return 1;
    if (namen.some((n) => n.includes(q))) return 2;
    return 9;
  };
  return lijst
    .map((l) => ({ l, s: scoor(l) }))
    .filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s)
    .map((x) => x.l);
}
