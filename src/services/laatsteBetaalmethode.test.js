/**
 * laatsteBetaalmethode.test.js — het toestel onthoudt alleen WELKE betaalmethode
 * de klant het laatst gebruikte (bv. 'ideal'), nooit bankgegevens
 * (aanmeldroute punt 11).
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { leesLaatsteBetaalmethode, bewaarLaatsteBetaalmethode, LAATSTE_METHODE_SLEUTEL } from './laatsteBetaalmethode';

describe('laatst gebruikte betaalmethode op dit toestel', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { vi.restoreAllMocks(); });

  test('bewaart alleen de naam van de methode', () => {
    bewaarLaatsteBetaalmethode('creditcard');
    expect(localStorage.getItem(LAATSTE_METHODE_SLEUTEL)).toBe('creditcard');
    expect(leesLaatsteBetaalmethode()).toBe('creditcard');
  });

  test('een methode die de app niet kent, wordt niet bewaard en niet teruggegeven', () => {
    bewaarLaatsteBetaalmethode('paypal');
    expect(localStorage.getItem(LAATSTE_METHODE_SLEUTEL)).toBeNull();
    localStorage.setItem(LAATSTE_METHODE_SLEUTEL, 'NL91ABNA0417164300');
    expect(leesLaatsteBetaalmethode()).toBeNull();
  });

  test('de sleutel valt niet onder de gevoelige gegevens die bij uitloggen weg moeten', () => {
    // App.jsx wist bij uitloggen alles wat op dit patroon lijkt; een voorkeur
    // zonder persoonsgegevens hoort daar niet bij.
    expect(LAATSTE_METHODE_SLEUTEL).not.toMatch(/(ontvanger|transactie|repeat_tx|payment_draft|begunstigde|iban|chat_history)/i);
  });

  test('geen opslag beschikbaar (privémodus): geen fout, geen voorkeur', () => {
    // localStorage is in de tests een eigen mock (src/test/setup.js).
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => { throw new Error('privémodus'); });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('privémodus'); });
    expect(() => bewaarLaatsteBetaalmethode('ideal')).not.toThrow();
    expect(leesLaatsteBetaalmethode()).toBeNull();
  });
});
