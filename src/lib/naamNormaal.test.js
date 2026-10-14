/**
 * naamNormaal.test.js — namen eerlijk vergelijken (bouwplan ronde 3, onderdeel 4).
 *
 * Dezelfde regels als de API (swiftbridge-api/src/lib/naamVergelijk.js), met
 * dezelfde voorbeeldtabel, zodat app en API niet uit elkaar lopen:
 *  - hoofdletters, accenten en Turkse letters tellen niet (İ, I en ı worden i;
 *    ş, ğ, ç, ö en ü worden s, g, c, o en u);
 *  - koppeltekens en apostrofs worden een spatie, dubbele spaties één;
 *  - tussenvoegsels tellen apart, de volgorde maakt niet uit, voorletters
 *    worden herkend;
 *  - uitkomst 'gelijk', 'twijfel' of 'anders'. Nooit een afwijzing: bij twijfel
 *    kijkt een mens.
 * Fictieve namen.
 *
 * naamVoorbeelden.json is een letterlijke kopie van de afspraak met de API
 * (swiftbridge-api/tests/fixtures/naamVoorbeelden.json). Wijzigt daar een
 * regel, kopieer dan het bestand opnieuw; deze test laat zien wat de app nog
 * anders doet.
 */
import { describe, test, expect } from 'vitest';
import {
  normaliseerNaam, vergelijkNamen, naamBevat, ontvangerNaamGeldig, REGELVERSIE,
} from './naamNormaal';
import afspraak from './naamVoorbeelden.json';

describe('dezelfde voorbeeldtabel als de API', () => {
  test('dezelfde versie van de regels', () => {
    expect(REGELVERSIE).toBe(afspraak.regelversie);
  });

  test.each(afspraak.normaliseren.map((v) => [v.invoer, v.verwacht, v.toelichting]))(
    'normaliseren: %j wordt %j (%s)',
    (invoer, verwacht) => {
      expect(normaliseerNaam(invoer)).toBe(verwacht);
    },
  );

  test.each(afspraak.vergelijken.map((v) => [v.a, v.b, v.uitkomst, v.toelichting]))(
    'vergelijken: %j tegen %j geeft %s (%s)',
    (a, b, verwacht) => {
      expect(vergelijkNamen(a, b).uitkomst).toBe(verwacht);
      expect(vergelijkNamen(b, a).uitkomst).toBe(verwacht);
    },
  );
});

// [a, b, verwachte uitkomst]
const VOORBEELDEN = [
  ['İsmail', 'ismail', 'gelijk'],
  ['Işık', 'Isik', 'gelijk'],
  ['Yılmaz', 'YILMAZ', 'gelijk'],
  ['Şahin', 'SAHIN', 'gelijk'],
  ['Gülşen Çelik', 'Gulsen Celik', 'gelijk'],
  ['Ayşe Doğan-Öztürk', 'Ayse Dogan Ozturk', 'gelijk'],
  ['Jan van der Berg', 'Berg Jan', 'gelijk'],
  ['Al-Assad', 'Al Assad', 'gelijk'],
  ["O'Brien", 'O Brien', 'gelijk'],
  ['  Mehmet   Yilmaz ', 'Mehmet Yilmaz', 'gelijk'],
  ['Yilmaz Mehmet', 'Mehmet Yilmaz', 'gelijk'],
  ['A. Doğan', 'Aydin Doğan', 'twijfel'],
  ['M. A. Yilmaz', 'Mehmet Ali Yilmaz', 'twijfel'],
  ['Mehmet Ali Yilmaz', 'Mehmet Yilmaz', 'twijfel'],
  ['Jan van Berg', 'Jan de Berg', 'twijfel'],
  ['Mehmet Yilmaz', 'Mehmet Yilmas', 'twijfel'],
  ['Mehmet Yilmaz', 'Pieter de Vries', 'anders'],
  ['Ayşe Kaya', 'Fatma Demir', 'anders'],
  ['Mehmet Yilmaz', 'Mehmet Demir', 'anders'],
];

describe('normaliseerNaam', () => {
  test.each([
    ['İSMAİL', 'ismail'],
    ['Işık', 'isik'],
    ['ŞAHİN', 'sahin'],
    ['Gülşen Çelik Öğüt', 'gulsen celik ogut'],
    ['José Müller', 'jose muller'],
    ['Al-Assad', 'al assad'],
    ["O'Brien", 'o brien'],
    ['O’Brien', 'o brien'],
    ['  Mehmet \t  Yilmaz  ', 'mehmet yilmaz'],
  ])('%s wordt %s', (in_, uit) => {
    expect(normaliseerNaam(in_)).toBe(uit);
  });

  test('leeg, null en undefined geven een lege tekst', () => {
    expect(normaliseerNaam('')).toBe('');
    expect(normaliseerNaam(null)).toBe('');
    expect(normaliseerNaam(undefined)).toBe('');
  });
});

describe('vergelijkNamen', () => {
  test.each(VOORBEELDEN)('%s tegen %s: %s', (a, b, verwacht) => {
    expect(vergelijkNamen(a, b).uitkomst).toBe(verwacht);
    // De volgorde van de twee namen maakt niet uit.
    expect(vergelijkNamen(b, a).uitkomst).toBe(verwacht);
  });

  test('geeft een score tussen 0 en 1 en de versie van de regels', () => {
    const gelijk = vergelijkNamen('Yılmaz', 'YILMAZ');
    expect(gelijk.score).toBe(1);
    expect(gelijk.regelversie).toBe(REGELVERSIE);
    const twijfel = vergelijkNamen('A. Doğan', 'Aydin Doğan');
    expect(twijfel.score).toBeGreaterThan(0);
    expect(twijfel.score).toBeLessThan(1);
    expect(vergelijkNamen('Mehmet Yilmaz', 'Pieter de Vries').score).toBeLessThan(twijfel.score);
  });

  test('er komt nooit een afwijzing uit, ook niet bij lege of rare invoer', () => {
    const namen = ['', ' ', null, '-', 'A.', 'Van der', 'İ', ...VOORBEELDEN.flatMap(([a, b]) => [a, b])];
    for (const a of namen) {
      for (const b of namen) {
        expect(['gelijk', 'twijfel', 'anders']).toContain(vergelijkNamen(a, b).uitkomst);
      }
    }
  });
});

describe('naamBevat (zoekfilters)', () => {
  test('vindt een Turkse naam ook zonder Turkse letters, en andersom', () => {
    expect(naamBevat('Ayşe Yılmaz', 'yilmaz')).toBe(true);
    expect(naamBevat('AYSE YILMAZ', 'Ayşe')).toBe(true);
    expect(naamBevat('Şahin Doğan-Öztürk', 'dogan oz')).toBe(true);
  });

  test('een lege zoekterm past altijd; een andere naam niet', () => {
    expect(naamBevat('Mehmet', '')).toBe(true);
    expect(naamBevat('Mehmet', 'Fatma')).toBe(false);
    expect(naamBevat(null, 'a')).toBe(false);
  });
});

describe('ontvangerNaamGeldig', () => {
  test('na trim minimaal 2 tekens', () => {
    expect(ontvangerNaamGeldig('Mehmet Yilmaz')).toBe(true);
    expect(ontvangerNaamGeldig(' Al ')).toBe(true);
    expect(ontvangerNaamGeldig(' ')).toBe(false);
    expect(ontvangerNaamGeldig('  A  ')).toBe(false);
    expect(ontvangerNaamGeldig('')).toBe(false);
    expect(ontvangerNaamGeldig(undefined)).toBe(false);
  });
});
