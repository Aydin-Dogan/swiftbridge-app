/**
 * kybAdminLabels.test.js — "Wijkt af" in het KYB-dossier (bouwplan ronde 3,
 * onderdeel 4).
 *
 * wijktAf vergeleek alleen hoofdletters en spaties. 'Yılmaz' tegen 'YILMAZ' of
 * 'Şahin' tegen 'SAHIN' gaf zo een rode "Wijkt af", terwijl het dezelfde naam
 * is. Nu telt dezelfde normalisatie als bij de naamvergelijking (lib/naamNormaal).
 * Een echt andere naam, datum of nummer blijft afwijken; de volgorde telt hier
 * wel mee, want wijktAf vergelijkt ook datums en adressen.
 * Fictieve gegevens.
 */
import { describe, test, expect } from 'vitest';
import { wijktAf } from './kybAdminLabels';

describe('wijktAf', () => {
  test.each([
    ['Yılmaz', 'YILMAZ'],
    ['Şahin', 'SAHIN'],
    ['Ayşe Doğan-Öztürk', 'AYSE DOGAN OZTURK'],
    ['İsmail Işık', 'ISMAIL ISIK'],
    ['Oefen  Bedrijf B.V.', 'OEFEN BEDRIJF B.V.'],
  ])('%s tegen %s wijkt niet af', (a, b) => {
    expect(wijktAf(a, b)).toBe(false);
  });

  test.each([
    ['Mehmet Yılmaz', 'Mehmet Demir'],
    ['Ayşe Kaya', 'Fatma Kaya'],
    ['1990-01-02', '1990-02-01'],
    ['12345678', '12345679'],
    ['NL', 'TR'],
  ])('%s tegen %s wijkt wel af', (a, b) => {
    expect(wijktAf(a, b)).toBe(true);
  });

  test('twee lege waarden wijken niet af; leeg tegen ingevuld wel', () => {
    expect(wijktAf('', null)).toBe(false);
    expect(wijktAf(undefined, '  ')).toBe(false);
    expect(wijktAf('', 'Yılmaz')).toBe(true);
  });
});
