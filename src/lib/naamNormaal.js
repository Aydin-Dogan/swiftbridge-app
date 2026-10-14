// Namen eerlijk vergelijken (bouwplan ronde 3, onderdeel 4, 14-10-2026).
//
// Dezelfde regels als de API (swiftbridge-api/src/lib/naamVergelijk.js), zodat
// een naam in de app en op de server hetzelfde uitvalt. Wijzig je hier een
// regel, wijzig hem daar ook en hoog REGELVERSIE op.
//
// Waarom: 'Yılmaz' tegen 'YILMAZ' of 'Şahin' tegen 'SAHIN' gaf in het
// KYB-dossier een onterechte "Wijkt af", en wie 'yilmaz' zocht vond 'Yılmaz'
// niet. Een Turkse of Nederlandse naam mag niet strenger behandeld worden dan
// een andere.
//
// De vergelijking beslist nooit: de uitkomst is 'gelijk', 'twijfel' of
// 'anders', en bij twijfel kijkt een mens. Er bestaat geen uitkomst
// 'afgewezen'.

export const REGELVERSIE = 'naam-2026-10-14.1';

// Losse woorden die bij de achternaam horen. Ze tellen apart: ontbreken ze aan
// één kant, dan is de naam nog gelijk ('Jan van der Berg' = 'Berg Jan').
const TUSSENVOEGSELS = new Set([
  'van', 'de', 'der', 'den', 'het', 'ten', 'ter', 'te', 'op', 'in',
  'von', 'vom', 'zu', 'la', 'le', 'du', 'da', 'di', 'del', 'della', 'des', 'dos', 'das', 'do',
]);

// Twee woorden die zo dicht bij elkaar liggen (één tikfout in 'Yilmaz') zijn
// geen bewijs van een andere naam, maar ook niet gelijk: twijfel.
const BIJNA_GELIJK = 0.8;

/**
 * Hoofdletters, accenten en Turkse letters tellen niet mee. Koppeltekens,
 * apostrofs en andere leestekens worden een spatie; dubbele spaties één.
 */
export function normaliseerNaam(tekst) {
  return String(tekst ?? '')
    // ı heeft geen ontleding; İ wordt via NFKD een I met punt erboven.
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function woorden(naam) {
  const alle = normaliseerNaam(naam).split(' ').filter(Boolean);
  const kern = alle.filter((w) => !TUSSENVOEGSELS.has(w));
  // Bestaat een naam alleen uit "tussenvoegsels" ('Van Der'), dan zijn dat de woorden.
  if (!kern.length) return { kern: alle, tussen: [] };
  return { kern, tussen: alle.filter((w) => TUSSENVOEGSELS.has(w)) };
}

function afstand(a, b) {
  const rij = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let vorige = rij[0];
    rij[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const boven = rij[j];
      rij[j] = Math.min(rij[j] + 1, rij[j - 1] + 1, vorige + (a[i - 1] === b[j - 1] ? 0 : 1));
      vorige = boven;
    }
  }
  return rij[b.length];
}

function gelijkenis(a, b) {
  return 1 - afstand(a, b) / Math.max(a.length, b.length, 1);
}

// Haalt uit beide lijsten de paren die bij elkaar horen en telt ze.
function koppel(restA, restB, past) {
  let aantal = 0;
  for (let i = restA.length - 1; i >= 0; i -= 1) {
    const j = restB.findIndex((w) => past(restA[i], w));
    if (j >= 0) {
      restA.splice(i, 1);
      restB.splice(j, 1);
      aantal += 1;
    }
  }
  return aantal;
}

const isVoorletter = (w) => w.length === 1;

/**
 * Vergelijkt twee namen. De volgorde van de woorden maakt niet uit, een
 * voorletter past bij een voornaam met dezelfde beginletter.
 * @returns {{ uitkomst: 'gelijk'|'twijfel'|'anders', score: number, regelversie: string }}
 */
export function vergelijkNamen(a, b) {
  const uit = (uitkomst, score) => ({ uitkomst, score: Math.round(score * 100) / 100, regelversie: REGELVERSIE });
  const A = woorden(a);
  const B = woorden(b);
  // Niets om te vergelijken: dat moet een mens zien.
  if (!A.kern.length || !B.kern.length) return uit('twijfel', 0);

  const restA = [...A.kern];
  const restB = [...B.kern];
  const exact = koppel(restA, restB, (x, y) => x === y);
  const voorletters = koppel(restA, restB, (x, y) => isVoorletter(x) && !isVoorletter(y) && y.startsWith(x))
    + koppel(restB, restA, (x, y) => isVoorletter(x) && !isVoorletter(y) && y.startsWith(x));

  const kopieA = [...restA];
  const kopieB = [...restB];
  let bijna = 0;
  koppel(kopieA, kopieB, (x, y) => {
    const g = gelijkenis(x, y);
    if (g < BIJNA_GELIJK) return false;
    bijna += g;
    return true;
  });
  const score = (2 * exact + voorletters + 2 * bijna) / (A.kern.length + B.kern.length);

  // Beide hebben tussenvoegsels en die verschillen ('van Berg' tegen 'de Berg').
  const tussenAnders = A.tussen.length > 0 && B.tussen.length > 0
    && [...A.tussen].sort().join(' ') !== [...B.tussen].sort().join(' ');

  if (!restA.length && !restB.length) {
    return voorletters || tussenAnders ? uit('twijfel', Math.min(score, 0.99)) : uit('gelijk', 1);
  }
  // Geen enkel volledig woord gemeen: een andere naam.
  if (!exact) return uit('anders', score);
  // De ene naam heeft alleen extra woorden (tweede voornaam weggelaten).
  if (!restA.length || !restB.length) return uit('twijfel', score);
  // Verschillende woorden aan beide kanten: twijfel alleen als elk woord van de
  // kortste rest een bijna-gelijke partner heeft (een tikfout), anders 'anders'.
  const paren = restA.length - kopieA.length;
  return paren === Math.min(restA.length, restB.length) ? uit('twijfel', score) : uit('anders', score);
}

/** Zoekfilter: past de zoekterm ergens in de naam, los van hoofdletters en Turkse letters? */
export function naamBevat(naam, zoekterm) {
  const term = normaliseerNaam(zoekterm);
  if (!term) return true;
  if (naam === null || naam === undefined) return false;
  return normaliseerNaam(naam).includes(term);
}

// Naam van de ontvanger: dezelfde ondergrens als Overschrijven en de server
// (routes/beneficiaries.js). Strengere regels (voor- én achternaam) wachten op
// een besluit van Aydin.
export const ONTVANGER_NAAM_MIN = 2;

export function ontvangerNaamGeldig(naam) {
  return String(naam ?? '').trim().length >= ONTVANGER_NAAM_MIN;
}
