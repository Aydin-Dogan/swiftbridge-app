/**
 * betaalStart.test.js — wat de app doet met het antwoord van POST /payments/start.
 *
 * AANLEIDING (analyse aanmeldroute, 13-10-2026)
 * Lukte het starten van de betaling niet, dan viel PaymentFlow "terug op demo
 * modus" en toonde "Geld onderweg! Je iDEAL betaling is verwerkt", ook als
 * Mollie wel was ingesteld en er niets was betaald. Alleen als de server zegt
 * dat betalen hier uit staat (PAY_NIET_GECONFIGUREERD, de simulatie) is dat
 * scherm op zijn plaats; elke andere fout is een fout.
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { maakFetchMock } from '../components/kyb/kybTestHulp';
import { startBetaling } from './betaalStart';

const TX = '3f1b8d2e-7c4a-4e5b-9a6d-1c2b3a4d5e6f';

describe('startBetaling', () => {
  let origineleFetch;
  beforeEach(() => { origineleFetch = globalThis.fetch; });
  afterEach(() => { globalThis.fetch = origineleFetch; });

  test('checkout-link → doorsturen', async () => {
    globalThis.fetch = maakFetchMock([
      { methode: 'POST', pad: '/payments/start', body: { paymentId: 'tr_1', checkoutUrl: 'https://mollie.test/c/1' } },
    ]);
    expect(await startBetaling({ transactieId: TX, methode: 'ideal' }))
      .toEqual({ soort: 'doorsturen', checkoutUrl: 'https://mollie.test/c/1' });
  });

  test('de server zegt dat betalen hier uit staat → simulatie', async () => {
    globalThis.fetch = maakFetchMock([
      { methode: 'POST', pad: '/payments/start', status: 503, body: { errorCode: 'PAY_NIET_GECONFIGUREERD', error: 'x' } },
    ]);
    expect((await startBetaling({ transactieId: TX, methode: 'ideal' })).soort).toBe('simulatie');
  });

  test.each([
    [500, 'PAY_MOLLIE_FOUT'],
    [403, 'CSRF_INVALID'],
    [409, 'PAY_NIET_MEER_TE_BETALEN'],
  ])('fout %i %s → fout, geen succes', async (status, errorCode) => {
    globalThis.fetch = maakFetchMock([
      { methode: 'POST', pad: '/payments/start', status, body: { errorCode, error: 'x' } },
    ]);
    const uit = await startBetaling({ transactieId: TX, methode: 'ideal' });
    expect(uit.soort).toBe('fout');
    expect(uit.fout.errorCode).toBe(errorCode);
  });

  test('geen verbinding → fout', async () => {
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    const uit = await startBetaling({ transactieId: TX, methode: 'ideal' });
    expect(uit.soort).toBe('fout');
  });

  test('antwoord zonder checkout-link → fout', async () => {
    globalThis.fetch = maakFetchMock([
      { methode: 'POST', pad: '/payments/start', body: { paymentId: 'tr_1' } },
    ]);
    expect((await startBetaling({ transactieId: TX, methode: 'ideal' })).soort).toBe('fout');
  });

  test('stuurt de transactie en de methode mee', async () => {
    const mock = maakFetchMock([
      { methode: 'POST', pad: '/payments/start', body: { checkoutUrl: 'https://mollie.test/c/2' } },
    ]);
    globalThis.fetch = mock;
    await startBetaling({ transactieId: TX, methode: 'bancontact' });
    const [, opties] = mock.mock.calls[0];
    expect(JSON.parse(opties.body)).toEqual({ transactieId: TX, methode: 'bancontact' });
  });
});
