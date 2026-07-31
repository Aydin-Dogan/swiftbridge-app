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

  test('Geen verouderde staffel-strings in pricing-keys (model = vaste fee €4,95, bouwbrief §8)', () => {
    const slechte_patronen = [
      /staffel/i,
      /€s?7[.,]50/,
      /€s?4[.,]50/,
      /€s?1[.,]99/,
      /€s?0[.,]99/,
      /2,0%[^)]*0,8%/, // oude staffel-range
    ];
    for (const [code, dict] of Object.entries(TALEN)) {
      for (const [key, value] of Object.entries(dict)) {
        if (typeof value !== 'string') continue;
        if (!/pric|tarief|kosten|fee|goedkoop/i.test(key)) continue;
        for (const pat of slechte_patronen) {
          expect(
            pat.test(value),
                      ).toBe(false);
        }
      }
    }
  });
});
