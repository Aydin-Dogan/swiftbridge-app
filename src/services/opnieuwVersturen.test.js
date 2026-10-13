/**
 * opnieuwVersturen.test.js — de overdracht van een eerdere overboeking naar de
 * betaalflow ("Snel opnieuw" / "Opnieuw versturen", aanmeldroute punt 11).
 *
 *  - Naam en IBAN gaan via sessionStorage, niet via localStorage: ze horen niet
 *    op het toestel achter te blijven (sessionStorage is weg bij tab dicht en
 *    wordt bij uitloggen gewist).
 *  - De bank gaat mee; die ontbrak.
 *  - Een oude overdracht in localStorage (van vóór deze versie) wordt nog
 *    gelezen en daarna weggehaald.
 * Fictieve gegevens, geen echte persoonsgegevens.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  zetOpnieuwKlaar, haalOpnieuwKlaar, gegevensUitTransactie, isGeslaagd, OPNIEUW_SLEUTEL,
} from './opnieuwVersturen';

const IBAN = 'TR330006100519786457841326';

// Alles wat in een opslag staat, als één tekst (localStorage is in de tests een mock).
function alleWaarden(opslag) {
  const waarden = [];
  for (let i = 0; i < opslag.length; i += 1) waarden.push(opslag.getItem(opslag.key(i)));
  return waarden.join('\n');
}

describe('opnieuw versturen: overdracht naar de betaalflow', () => {
  let navigaties;
  function luister(e) { navigaties.push(e.detail); }

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    navigaties = [];
    window.addEventListener('swiftbridge_navigate', luister);
  });
  afterEach(() => { window.removeEventListener('swiftbridge_navigate', luister); vi.restoreAllMocks(); });

  test('zet de gegevens in sessionStorage, niet in localStorage, en gaat naar de betaalflow', () => {
    zetOpnieuwKlaar({ ontvanger: 'Oefen Ontvanger', iban: IBAN, bank: 'Akbank', bedrag: 300, valuta: 'TRY' }, { direct: true });

    expect(JSON.parse(sessionStorage.getItem(OPNIEUW_SLEUTEL))).toEqual({
      ontvanger: 'Oefen Ontvanger', iban: IBAN, bank: 'Akbank', bedrag: 300, valuta: 'TRY', direct: true,
    });
    expect(localStorage.getItem(OPNIEUW_SLEUTEL)).toBeNull();
    expect(alleWaarden(localStorage)).not.toContain(IBAN);
    expect(navigaties).toEqual(['betaling']);
  });

  test('haalOpnieuwKlaar geeft de gegevens één keer terug', () => {
    zetOpnieuwKlaar({ ontvanger: 'Oefen Ontvanger', iban: IBAN, bedrag: 100, valuta: 'TRY' });
    expect(haalOpnieuwKlaar()).toMatchObject({ ontvanger: 'Oefen Ontvanger', iban: IBAN, direct: false });
    expect(haalOpnieuwKlaar()).toBeNull();
    expect(sessionStorage.getItem(OPNIEUW_SLEUTEL)).toBeNull();
  });

  test('een oude overdracht in localStorage wordt gelezen en weggehaald', () => {
    localStorage.setItem(OPNIEUW_SLEUTEL, JSON.stringify({ ontvanger: 'Oefen Ontvanger', iban: IBAN, bedrag: 100, valuta: 'TRY' }));
    expect(haalOpnieuwKlaar()).toMatchObject({ ontvanger: 'Oefen Ontvanger', iban: IBAN });
    expect(localStorage.getItem(OPNIEUW_SLEUTEL)).toBeNull();
  });

  test('kapotte inhoud of geen opslag: geen overdracht, geen fout', () => {
    sessionStorage.setItem(OPNIEUW_SLEUTEL, '{kapot');
    expect(haalOpnieuwKlaar()).toBeNull();
    const weigert = () => { throw new Error('privémodus'); };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(weigert); // sessionStorage
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(weigert);
    expect(haalOpnieuwKlaar()).toBeNull();
  });

  test('gegevensUitTransactie neemt naam, IBAN, bank, laatste bedrag en valuta over', () => {
    expect(gegevensUitTransactie({
      ontvangerNaam: 'Oefen Ontvanger', ontvangerIBAN: IBAN, ontvangerBank: 'Akbank', eurBedrag: 250, valuta: 'TRY',
    })).toEqual({ ontvanger: 'Oefen Ontvanger', iban: IBAN, bank: 'Akbank', bedrag: 250, valuta: 'TRY' });
    // snake_case uit oudere bronnen
    expect(gegevensUitTransactie({ ontvanger_naam: 'Oefen', ontvanger_iban: IBAN, ontvanger_bank: 'Akbank', eur_bedrag: 50 }))
      .toEqual({ ontvanger: 'Oefen', iban: IBAN, bank: 'Akbank', bedrag: 50, valuta: 'TRY' });
  });

  test('isGeslaagd: voltooid of betaald telt, mislukt of nog niet betaald niet', () => {
    expect(isGeslaagd({ status: 'voltooid' })).toBe(true);
    expect(isGeslaagd({ status: 'in_behandeling', betalingStatus: 'paid' })).toBe(true);
    expect(isGeslaagd({ status: 'wacht_op_betaling' })).toBe(false);
    expect(isGeslaagd({ status: 'in_behandeling', betalingStatus: null })).toBe(false);
    expect(isGeslaagd({ status: 'mislukt', betalingStatus: 'paid' })).toBe(false);
    expect(isGeslaagd({ status: 'geannuleerd' })).toBe(false);
    expect(isGeslaagd(null)).toBe(false);
  });
});
