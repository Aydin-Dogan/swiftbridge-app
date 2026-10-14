/**
 * geenKycWachttijd.test.js — de app belooft geen wachttijd voor de
 * identificatie.
 *
 * AANLEIDING (14-10-2026)
 * Hoe lang de beoordeling duurt en of een klant wordt goedgekeurd, bepaalt de
 * EMI-partner (besluit Aydin). Bij een politiek prominente klant beslissen we
 * samen met de partner, en dat duurt langer. Toch stond er in alle vijf de
 * talen "de review duurt 1-2 werkdagen". Dat is een snelheidsbelofte die het
 * bedrijf niet kan waarmaken.
 *
 * Alleen de kyc_*-teksten. De zakelijke aanvraag (kyb_*) beoordeelt SwiftBridge
 * zelf, met een eigen termijn.
 */
import { describe, test, expect } from 'vitest';
import { nl } from '../i18n/nl';
import { en } from '../i18n/en';
import { tr } from '../i18n/tr';
import { ru } from '../i18n/ru';
import { az } from '../i18n/az';

const TALEN = { nl, en, tr, ru, az };

// Een termijn in werkdagen, uren of minuten, in elke taal van de app.
const TERMIJN = /werkdag|business day|working day|iş gün|рабоч|\d+\s*(uur|hours?|saat|час|minuten|minutes?|dakika|минут|dəqiqə)/i;

describe('geen wachttijd-belofte bij de identificatie', () => {
  for (const [taal, teksten] of Object.entries(TALEN)) {
    test(`${taal}: geen kyc-tekst noemt een termijn`, () => {
      const fout = Object.entries(teksten)
        .filter(([sleutel, waarde]) => sleutel.startsWith('kyc_') && typeof waarde === 'string' && TERMIJN.test(waarde))
        .map(([sleutel]) => sleutel);
      expect(fout).toEqual([]);
    });
  }
});
