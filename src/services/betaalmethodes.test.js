/**
 * betaalmethodes.test.js — de app toont alleen betaalmethodes die de server
 * aanneemt.
 *
 * AANLEIDING (analyse aanmeldroute, 13-10-2026)
 * De betaalstap toonde PayPal, SEPA bankoverboeking, KBC/CBC, Belfius, Pay By
 * Bank en Billie. POST /transactions weigert die; de klant kreeg pas na
 * "Bevestigen & betalen" de melding "Ongeldige invoer". De serverlijst staat in
 * swiftbridge-api/src/lib/betaalmethodes.js; de API-test betaalmethodesGelijk
 * leest BETAALMETHODES_APP en faalt als de app iets toont wat daar ontbreekt.
 */
import { describe, test, expect } from 'vitest';
import { BETAALMETHODES_APP, methodeKanNu, geldigeMethode } from './betaalmethodes';

// Wat POST /transactions aanneemt (swiftbridge-api/src/lib/betaalmethodes.js).
const SERVER = ['ideal', 'wero', 'bancontact', 'card', 'creditcard', 'applepay', 'klarna', 'sepa'];

describe('betaalmethodes in de app', () => {
  test('de app toont niets wat de server weigert', () => {
    expect(BETAALMETHODES_APP.filter((id) => !SERVER.includes(id))).toEqual([]);
  });

  test.each(['paypal', 'banktransfer', 'kbc', 'belfius', 'paybybank', 'billie'])('%s staat er niet meer tussen', (id) => {
    expect(BETAALMETHODES_APP).not.toContain(id);
    expect(methodeKanNu(id, null)).toBe(false);
  });

  test('zonder lijst van de server: iDEAL, kaart en Bancontact aan, Apple Pay en Klarna uit', () => {
    expect(methodeKanNu('ideal', null)).toBe(true);
    expect(methodeKanNu('creditcard', null)).toBe(true);
    expect(methodeKanNu('bancontact', null)).toBe(true);
    expect(methodeKanNu('applepay', null)).toBe(false);
    expect(methodeKanNu('klarna', null)).toBe(false);
  });

  test('met een lijst van de server: alleen wat daarin staat', () => {
    const beschikbaar = ['ideal', 'applepay'];
    expect(methodeKanNu('ideal', beschikbaar)).toBe(true);
    expect(methodeKanNu('applepay', beschikbaar)).toBe(true);
    expect(methodeKanNu('creditcard', beschikbaar)).toBe(false);
  });

  test('een methode uit een oud concept die nu niet kan, wordt de eerste die wel kan', () => {
    expect(geldigeMethode('paypal', null)).toBe('ideal');
    expect(geldigeMethode('creditcard', ['bancontact'])).toBe('bancontact');
    expect(geldigeMethode('creditcard', null)).toBe('creditcard');
  });
});
