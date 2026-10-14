// Namen eerlijk vergelijken (bouwplan ronde 3, onderdeel 4, 14-10-2026).
//
// Dit is een kopie van swiftbridge-api/src/lib/naamVergelijk.js, zodat een naam
// in de app en op de server hetzelfde uitvalt. De afspraak staat in
// naamVoorbeelden.json (letterlijke kopie van de API-fixture
// tests/fixtures/naamVoorbeelden.json); naamNormaal.test.js houdt beide gelijk.
// Wijzigt een regel in de API, neem hem dan hier over en kopieer de tabel.
//
// Waarom: 'Yılmaz' tegen 'YILMAZ' of 'Şahin' tegen 'SAHIN' gaf in het
// KYB-dossier een onterechte "Wijkt af", en wie 'yilmaz' zocht vond 'Yılmaz'
// niet. Een Turkse of Nederlandse naam mag niet strenger behandeld worden dan
// een andere.
//
// De vergelijking beslist nooit: de uitkomst is 'gelijk', 'twijfel' of
// 'anders', en 'twijfel' en 'anders' betekenen "een mens kijkt". Er bestaat
// geen uitkomst 'afgewezen'. Open besluit (Aydin): een naam met alleen
// voorletters of zonder tweede voornaam staat tot dan op 'twijfel'.
//
// Alleen in de app: naamBevat (zoekfilters) en ontvangerNaamGeldig.

export const REGELVERSIE = 'naam-vergelijk-2026-10-14';

/** De enige drie uitkomsten. Er is bewust geen 'afgewezen'. */
export const UITKOMSTEN = Object.freeze(['gelijk', 'twijfel', 'anders']);

/** Vaste redencodes, in de volgorde waarin ze in een uitkomst staan. */
export const REDENEN = Object.freeze([
  'naam_ontbreekt',          // een van de twee namen is leeg
  'voorletters',             // 'A.' tegen 'Aydin'
  'bijna_gelijk',            // 'Ahmet' tegen 'Ahmed', 'Mohammed' tegen 'Muhammad'
  'naamdeel_ontbreekt',      // de ene naam heeft een naamdeel dat de andere mist
  'tussenvoegsel_anders',    // 'van' tegen 'de'
  'tussenvoegsel_ontbreekt', // 'De Vries' tegen 'Vries', zonder voornaam
  'andere_naam',             // de naamdelen spreken elkaar tegen
]);

// Langer is geen naam meer; houdt het rekenwerk klein.
const MAX_LENGTE = 200;

// Tussenvoegsels die een bank of register de ene keer wel en de andere keer
// niet, of achteraan, schrijft. Geen losse letters ('D.' is meestal een
// voorletter) en geen 'le'/'do' (ook achternamen: Lê, Đỗ).
const TUSSENVOEGSELS = new Set([
  // Nederlands
  'van', 'de', 'der', 'den', 'het', 'ter', 'ten', 'te', 'tot', 'in', 'op',
  'onder', 'over', 'uit', 'aan', 'bij', 'voor',
  // Duits, Frans, Spaans, Portugees, Italiaans
  'von', 'vom', 'zu', 'zum', 'zur', 'du', 'des', 'del', 'della', 'da', 'das',
  'dos', 'di',
  // Arabisch
  'al', 'el', 'bin', 'ibn', 'bint',
]);

// Letters die NFKD niet ontleedt en die we toch gelijk willen stellen.
const LOSSE_LETTERS = Object.freeze({
  'ı': 'i',   // Turkse puntloze i
  'ə': 'a',   // Azerbeidzjaanse schwa; het paspoort schrijft 'Aliyev' voor 'Əliyev'
  'ǝ': 'a',   // dezelfde schwa, met het verkeerde teken getypt
  'ß': 'ss',
  'æ': 'ae',
  'œ': 'oe',
  'ø': 'o',
  'đ': 'd',
  'ð': 'd',
  'ł': 'l',
  'þ': 'th',
});
const LOSSE_LETTERS_RE = new RegExp(`[${Object.keys(LOSSE_LETTERS).join('')}]`, 'g');

// Gewicht van een overeenkomst in de score.
const GEWICHT_EXACT = 1;
const GEWICHT_BIJNA = 0.8;
const GEWICHT_VOORLETTER = 0.5;

/**
 * Kleine letters, geen accenten, Turkse letters gelijkgetrokken (İ, I en ı
 * worden i; ş, ğ, ç, ö en ü worden s, g, c, o en u), leestekens als spatie,
 * enkele spaties. Alleen tekst of een getal telt als naam; de rest wordt ''.
 */
export function normaliseerNaam(naam) {
  let tekst;
  if (typeof naam === 'string') tekst = naam;
  else if (typeof naam === 'number' && Number.isFinite(naam)) tekst = String(naam);
  else return '';

  return tekst
    .slice(0, MAX_LENGTE * 2)
    // NFKD haalt de accenten los van de letter (ş = s + cedille, İ = I + punt).
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    // Na het weghalen van de punt is de İ een gewone I; toLowerCase zonder
    // taalinstelling maakt daar een i van.
    .toLowerCase()
    .replace(LOSSE_LETTERS_RE, (letter) => LOSSE_LETTERS[letter])
    // Koppeltekens, apostrofs (ook de 'letter-apostrof' ʼ), punten en komma's
    // worden een spatie.
    .replace(/\p{Lm}|[^\p{L}\p{N}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_LENGTE)
    .trim();
}

function naamDelen(naam) {
  const genormaliseerd = normaliseerNaam(naam);
  return genormaliseerd ? genormaliseerd.split(' ') : [];
}

// Voegt naast elkaar staande naamdelen samen als de andere naam ze aaneen
// schrijft ('al assad' - 'alassad'), maar niet als dat een volle voornaam
// opslokt zonder dat er iets overblijft ('Jan Sen' is geen 'Jansen').
function voegSamen(delen, andereDelen) {
  const anderen = new Set(andereDelen);
  const uit = [...delen];
  for (let i = 0; i < uit.length; i += 1) {
    const voorvoegsel = TUSSENVOEGSELS.has(uit[i]) || uit[i].length === 1;
    if (!voorvoegsel && andereDelen.length < 2) continue;
    for (const aantal of [3, 2]) {
      if (i + aantal > uit.length) continue;
      const samen = uit.slice(i, i + aantal).join('');
      if (anderen.has(samen) && !uit.includes(samen)) {
        uit.splice(i, aantal, samen);
        break;
      }
    }
  }
  return uit;
}

function splitsTussenvoegsels(delen) {
  const kern = delen.filter((d) => !TUSSENVOEGSELS.has(d));
  // Een naam die alleen uit 'tussenvoegsels' bestaat, is gewoon een naam.
  if (kern.length === 0) return { kern: [...delen], tussen: [] };
  return { kern, tussen: delen.filter((d) => TUSSENVOEGSELS.has(d)) };
}

// Levenshtein-afstand; namen zijn kort, dus de eenvoudige vorm volstaat.
function afstand(a, b) {
  let vorige = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const huidige = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      huidige[j] = Math.min(vorige[j] + 1, huidige[j - 1] + 1, vorige[j - 1] + kosten);
    }
    vorige = huidige;
  }
  return vorige[b.length];
}

// Eén letter verschil mag, bij lange namen twee ('Mohammed' - 'Muhammad').
// Korte delen nooit: 'Jan' en 'Jon' zijn verschillende namen.
function bijnaAfstand(a, b) {
  if (Math.min(a.length, b.length) < 4) return null;
  const toegestaan = Math.max(a.length, b.length) >= 8 ? 2 : 1;
  if (Math.abs(a.length - b.length) > toegestaan) return null;
  const d = afstand(a, b);
  return d > 0 && d <= toegestaan ? d : null;
}

const isLosseLetter = (deel) => deel.length === 1 && /\p{L}/u.test(deel);
const isLetterreeks = (deel) => /^\p{L}{2,3}$/u.test(deel);

// Koppelt de naamdelen van twee kanten: eerst exact, dan bijna gelijk, dan
// voorletters. Symmetrisch: A tegen B geeft hetzelfde als B tegen A.
function koppel(kantA, kantB) {
  const maak = ({ kern, tussen }) => ({
    kern: kern.map((deel) => ({ deel, gewicht: 0, soort: null })),
    tussen: tussen.map((deel) => ({ deel, gebruikt: false })),
  });
  const A = maak(kantA);
  const B = maak(kantB);
  const vrij = (zijde) => zijde.kern.filter((d) => d.gewicht === 0);
  const zet = (d, gewicht, soort) => { d.gewicht = gewicht; d.soort = soort; };

  // 1. Exact.
  for (const a of A.kern) {
    const b = vrij(B).find((x) => x.deel === a.deel);
    if (b) { zet(a, GEWICHT_EXACT, 'exact'); zet(b, GEWICHT_EXACT, 'exact'); }
  }

  // 2. Bijna gelijk; kleinste afstand voorop, los van welke naam links staat.
  const kandidaten = [];
  for (const a of vrij(A)) {
    for (const b of vrij(B)) {
      const d = bijnaAfstand(a.deel, b.deel);
      if (d !== null) kandidaten.push({ a, b, d, sleutel: [a.deel, b.deel].sort().join(' ') });
    }
  }
  kandidaten.sort((x, y) => x.d - y.d || (x.sleutel < y.sleutel ? -1 : x.sleutel > y.sleutel ? 1 : 0));
  for (const { a, b } of kandidaten) {
    if (a.gewicht === 0 && b.gewicht === 0) { zet(a, GEWICHT_BIJNA, 'bijna'); zet(b, GEWICHT_BIJNA, 'bijna'); }
  }

  // 3. Voorletters, in beide richtingen.
  for (const [hier, daar] of [[A, B], [B, A]]) {
    // 3a. Een losse letter tegen een voluit geschreven naamdeel: 'a' - 'aydin'.
    for (const letter of vrij(hier).filter((d) => isLosseLetter(d.deel))) {
      const doel = vrij(daar).find((x) => x.deel.length >= 2 && x.deel[0] === letter.deel);
      if (doel) { zet(letter, GEWICHT_VOORLETTER, 'voorletter'); zet(doel, GEWICHT_VOORLETTER, 'voorletter'); }
    }
    // 3b. Aaneengeschreven voorletters: 'aj' - 'anna johanna'.
    for (const reeks of vrij(hier).filter((d) => isLetterreeks(d.deel))) {
      const vrijDaar = vrij(daar).filter((x) => x.deel.length >= 2);
      const gedekt = [];
      for (const x of vrijDaar) {
        if (gedekt.length < reeks.deel.length && x.deel[0] === reeks.deel[gedekt.length]) gedekt.push(x);
      }
      if (gedekt.length === reeks.deel.length) {
        zet(reeks, GEWICHT_VOORLETTER, 'voorletter');
        for (const x of gedekt) zet(x, GEWICHT_VOORLETTER, 'voorletter');
      }
    }
    // 3c. Een losse letter als afgekort tussenvoegsel: 'v.d.' - 'van den'.
    for (const letter of vrij(hier).filter((d) => isLosseLetter(d.deel))) {
      const tv = daar.tussen.find((t) => !t.gebruikt && t.deel[0] === letter.deel);
      if (tv) { zet(letter, GEWICHT_VOORLETTER, 'voorletter'); tv.gebruikt = true; }
    }
  }

  return { A, B };
}

function afgerond(getal) {
  return Math.round(getal * 100) / 100;
}

function uitkomst(soort, score, redenen) {
  const volgorde = [...new Set(redenen)].sort((x, y) => REDENEN.indexOf(x) - REDENEN.indexOf(y));
  return Object.freeze({
    uitkomst: soort,
    score,
    redenen: Object.freeze(volgorde),
    regelversie: REGELVERSIE,
  });
}

/**
 * Vergelijkt twee namen. De volgorde van de naamdelen telt niet,
 * tussenvoegsels tellen apart, voorletters en kleine schrijfverschillen worden
 * herkend.
 * @returns {{ uitkomst: 'gelijk'|'twijfel'|'anders', score: number, redenen: string[], regelversie: string }}
 *   score loopt van 0 tot 1; alleen 'gelijk' scoort 1.
 */
export function vergelijkNamen(naamA, naamB) {
  const ruwA = naamDelen(naamA);
  const ruwB = naamDelen(naamB);
  if (ruwA.length === 0 || ruwB.length === 0) return uitkomst('twijfel', 0, ['naam_ontbreekt']);

  // Allebei tegen de oorspronkelijke andere kant, zodat A-B en B-A gelijk uitvallen.
  const delenA = voegSamen(ruwA, ruwB);
  const delenB = voegSamen(ruwB, ruwA);

  // Dezelfde naamdelen in een andere volgorde: gelijk.
  if ([...delenA].sort().join(' ') === [...delenB].sort().join(' ')) return uitkomst('gelijk', 1, []);

  const { A, B } = koppel(splitsTussenvoegsels(delenA), splitsTussenvoegsels(delenB));
  const alles = [...A.kern, ...B.kern];
  const restA = A.kern.filter((d) => d.gewicht === 0);
  const restB = B.kern.filter((d) => d.gewicht === 0);
  const tussenGebruikt = [...A.tussen, ...B.tussen].filter((t) => t.gebruikt).length;

  // Score: Dice-coefficient, gewogen naar hoe zeker de koppeling is.
  const som = alles.reduce((s, d) => s + d.gewicht, 0) + tussenGebruikt * GEWICHT_VOORLETTER;
  let score = som / (alles.length + tussenGebruikt);

  // Niets gekoppeld, of aan beide kanten een naamdeel zonder tegenhanger: twee
  // verschillende namen ('Aydin Doğan' tegen 'Mehmet Doğan': een broer is iemand anders).
  if (alles.every((d) => d.gewicht === 0) || (restA.length > 0 && restB.length > 0)) {
    return uitkomst('anders', Math.min(afgerond(score), 0.99), ['andere_naam']);
  }

  const redenen = [];
  if (alles.some((d) => d.soort === 'voorletter')) redenen.push('voorletters');
  if (alles.some((d) => d.soort === 'bijna')) redenen.push('bijna_gelijk');
  if (restA.length > 0 || restB.length > 0) redenen.push('naamdeel_ontbreekt');

  // Tussenvoegsels aan beide kanten moeten gelijk zijn. Aan één kant is gewoon
  // hoe banken schrijven ('Berg Jan'), maar alleen met een voornaam erbij.
  const tvA = A.tussen.filter((t) => !t.gebruikt).map((t) => t.deel).sort().join(' ');
  const tvB = B.tussen.filter((t) => !t.gebruikt).map((t) => t.deel).sort().join(' ');
  const exacteDelen = A.kern.filter((d) => d.soort === 'exact').length;
  if (tvA && tvB && tvA !== tvB) {
    redenen.push('tussenvoegsel_anders');
    score *= 0.9;
  } else if ((tvA && !tvB) || (!tvA && tvB)) {
    if (exacteDelen < 2) {
      redenen.push('tussenvoegsel_ontbreekt');
      score *= 0.9;
    }
  }

  if (redenen.length === 0) return uitkomst('gelijk', 1, []);
  return uitkomst('twijfel', Math.min(afgerond(score), 0.99), redenen);
}

/** Zoekfilter: past de zoekterm ergens in de naam, los van hoofdletters en Turkse letters? */
export function naamBevat(naam, zoekterm) {
  const term = normaliseerNaam(zoekterm);
  if (!term) return true;
  return normaliseerNaam(naam).includes(term);
}

// Naam van de ontvanger: dezelfde ondergrens als Overschrijven en de server
// (routes/beneficiaries.js). Strengere regels (voor- én achternaam) wachten op
// een besluit van Aydin.
export const ONTVANGER_NAAM_MIN = 2;

export function ontvangerNaamGeldig(naam) {
  return String(naam ?? '').trim().length >= ONTVANGER_NAAM_MIN;
}
