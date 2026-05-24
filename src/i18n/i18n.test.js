/**
 * Tests voor i18n integriteit — alle 5 talen hebben dezelfde keys.
 * Dit dekt wat scripts/i18n-check.mjs ook checkt, maar dan in CI als
 * normale unit-test (sneller feedback).
 */

import { describe, test, expect } from 'vitest';
import { nl } from './nl';
import { en } from './en';
import { tr } from './tr';
import { ru } from './ru';
import { az } from './az';

const TALEN = { nl, en, tr, ru, az };

describe('i18n key consistency', () => {
  const refKeys = new Set(Object.keys(nl));

  test.each(['en', 'tr', 'ru', 'az'])(
    '%s heeft exact dezelfde keys als nl',
    (taalCode) => {
      const taal = TALEN[taalCode];
      const keys = new Set(Object.keys(taal));
      const missend = [...refKeys].filter(k => !keys.has(k));
      const extra = [...keys].filter(k => !refKeys.has(k));
      expect(missend, `Missend in ${taalCode}: ${missend.slice(0, 5).join(', ')}`).toEqual([]);
      expect(extra, `Extra in ${taalCode}: ${extra.slice(0, 5).join(', ')}`).toEqual([]);
    }
  );

  test('Geen lege string-waardes', () => {
    for (const [code, dict] of Object.entries(TALEN)) {
      const lege = Object.entries(dict).filter(([k, v]) => v === '');
      expect(lege, `Lege string in ${code}: ${lege.map(([k]) => k).join(', ')}`).toEqual([]);
    }
  });

  test('Geen verouderde flat-fee strings in pricing-keys', () => {
    const slechte_patronen = [
      /vaste\s+fee/i,
      /flat\s+fee/i,
      /sabit\s+(işlem\s+)?üc?ret/i,
    ];
    for (const [code, dict] of Object.entries(TALEN)) {
      for (const [key, value] of Object.entries(dict)) {
        if (typeof value !== 'string') continue;
        if (/minimum/i.test(value)) continue; // 'Minimum fee €1,99' is OK
        for (const pat of slechte_patronen) {
          expect(
            pat.test(value),
            `Verouderde pricing-string in ${code}.${key}: "${value.slice(0, 80)}"`
          ).toBe(false);
        }
      }
    }
  });
});
