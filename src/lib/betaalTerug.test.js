/**
 * betaalTerug.test.js — de terugkeer na iDEAL op /app?payment=<transactie-id>.
 *
 * De parameter werd nergens uitgelezen: na het betalen zag de klant niets
 * (analyse aanmeldroute, 13-10-2026). Alleen een geldig transactie-id telt; een
 * verlopen sessie stuurt via het inloggen terug naar dezelfde betaalstatus.
 */
import { describe, test, expect } from 'vitest';
import { betaalTerugId, loginPadVoor } from './betaalTerug';

const TX = '3f1b8d2e-7c4a-4e5b-9a6d-1c2b3a4d5e6f';

describe('betaalTerugId', () => {
  test('leest het transactie-id uit ?payment=', () => {
    expect(betaalTerugId(`?payment=${TX}`)).toBe(TX);
    expect(betaalTerugId(`?x=1&payment=${TX}`)).toBe(TX);
  });

  test.each(['', '?payment=', '?payment=abc', '?payment=../../admin', `?payment=${TX}x`])('negeert %s', (zoek) => {
    expect(betaalTerugId(zoek)).toBeNull();
  });
});

describe('loginPadVoor', () => {
  test('met een betaling: na het inloggen terug naar de betaalstatus', () => {
    expect(loginPadVoor(`?payment=${TX}`)).toBe(`/login?next=${encodeURIComponent(`/app?payment=${TX}`)}`);
  });

  test('zonder betaling: gewoon naar /login', () => {
    expect(loginPadVoor('')).toBe('/login');
    expect(loginPadVoor('?payment=onzin')).toBe('/login');
  });
});
