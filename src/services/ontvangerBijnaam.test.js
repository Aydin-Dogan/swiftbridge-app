/**
 * ontvangerBijnaam.test.js — de bijnaam uit de betaalflow komt bij de
 * opgeslagen ontvanger (review aanmeldroute punt 11, 14-10-2026).
 *
 * AANLEIDING
 * Het vinkje "Bewaar als favoriete ontvanger" had geen zin meer: de server
 * bewaart een bankontvanger na een geslaagde betaling toch al. Wat de klant nog
 * wel kan toevoegen, is een bijnaam. Leeg = niets doen (de server bewaart de
 * ontvanger zelf). Bestaat de ontvanger al (409), dan krijgt die de bijnaam.
 * Alle netwerkverkeer is gemockt; fictieve gegevens.
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { maakFetchMock } from '../components/kyb/kybTestHulp';
import { bewaarBijnaam } from './ontvangerBijnaam';

const IBAN = 'TR330006100519786457841326';
const BESTAAND = '9c1b8d2e-7c4a-4e5b-9a6d-1c2b3a4d5e6f';

function aanroepen() {
  return globalThis.fetch.mock.calls.map(([u, o]) => ({
    url: String(u), methode: o?.method || 'GET', body: o?.body ? JSON.parse(o.body) : null,
  }));
}

describe('bewaarBijnaam', () => {
  let origineleFetch;
  beforeEach(() => { origineleFetch = globalThis.fetch; });
  afterEach(() => { globalThis.fetch = origineleFetch; vi.restoreAllMocks(); });

  test('geen bijnaam: geen verzoek, de server bewaart de ontvanger na de betaling zelf', async () => {
    globalThis.fetch = maakFetchMock([]);
    expect(await bewaarBijnaam({ naam: 'Oefen Ontvanger', iban: IBAN, valuta: 'TRY', bijnaam: '   ' }))
      .toEqual({ bewaard: false });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('nieuwe ontvanger: opgeslagen met bijnaam, land uit de IBAN', async () => {
    globalThis.fetch = maakFetchMock([
      { methode: 'POST', pad: '/beneficiaries', status: 201, body: { beneficiary: { id: 'nieuw' } } },
    ]);
    expect(await bewaarBijnaam({
      naam: 'Oefen Ontvanger', iban: 'nl91 abna 0417 1643 00', bank: 'ABN AMRO', valuta: 'EUR', bijnaam: ' Mama ',
    })).toEqual({ bewaard: true });

    const [post] = aanroepen();
    expect(post.methode).toBe('POST');
    expect(post.body).toEqual({
      naam: 'Oefen Ontvanger', iban: 'NL91ABNA0417164300', bank: 'ABN AMRO', valuta: 'EUR', land: 'NL', bijnaam: 'Mama',
    });
  });

  test('geen bank gekozen: het veld blijft weg (de server weigert null)', async () => {
    globalThis.fetch = maakFetchMock([
      { methode: 'POST', pad: '/beneficiaries', status: 201, body: { beneficiary: { id: 'nieuw' } } },
    ]);
    await bewaarBijnaam({ naam: 'Oefen Ontvanger', iban: IBAN, bank: '', valuta: 'TRY', bijnaam: 'Oom' });
    expect(aanroepen()[0].body).not.toHaveProperty('bank');
  });

  test('ontvanger bestaat al (409): die krijgt de bijnaam', async () => {
    globalThis.fetch = maakFetchMock([
      { methode: 'POST', pad: '/beneficiaries', status: 409, body: { errorCode: 'CONFLICT', error: 'x', bestaandId: BESTAAND } },
      { methode: 'PATCH', pad: `/beneficiaries/${BESTAAND}`, body: { beneficiary: { id: BESTAAND } } },
    ]);
    expect(await bewaarBijnaam({ naam: 'Oefen Ontvanger', iban: IBAN, valuta: 'TRY', bijnaam: 'Broer' }))
      .toEqual({ bewaard: true });

    const patch = aanroepen().find((a) => a.methode === 'PATCH');
    expect(patch.url).toContain(`/beneficiaries/${BESTAAND}`);
    expect(patch.body).toEqual({ bijnaam: 'Broer' });
  });

  test('te lang: afgekapt op 50 tekens (de server weigert langer)', async () => {
    globalThis.fetch = maakFetchMock([
      { methode: 'POST', pad: '/beneficiaries', status: 201, body: { beneficiary: { id: 'nieuw' } } },
    ]);
    await bewaarBijnaam({ naam: 'Oefen Ontvanger', iban: IBAN, valuta: 'TRY', bijnaam: 'x'.repeat(80) });
    expect(aanroepen()[0].body.bijnaam).toHaveLength(50);
  });

  test('fout of geen verbinding: geen uitzondering, de overboeking gaat gewoon door', async () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    expect(await bewaarBijnaam({ naam: 'Oefen Ontvanger', iban: IBAN, valuta: 'TRY', bijnaam: 'Mama' }))
      .toEqual({ bewaard: false });

    globalThis.fetch = maakFetchMock([
      { methode: 'POST', pad: '/beneficiaries', status: 403, body: { errorCode: 'TX_SANCTIONED_RECIPIENT', error: 'x' } },
    ]);
    expect(await bewaarBijnaam({ naam: 'Oefen Ontvanger', iban: IBAN, valuta: 'TRY', bijnaam: 'Mama' }))
      .toEqual({ bewaard: false });
  });
});
