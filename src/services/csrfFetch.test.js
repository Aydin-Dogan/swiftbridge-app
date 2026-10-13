/**
 * csrfFetch — losse fetch-aanroepen naar onze eigen API krijgen de
 * X-CSRF-Token-header, net als apiFetch. Zonder die header weigert de API elke
 * POST/PATCH/DELETE met 403 zodra de sb_csrf-cookie staat (na het inloggen).
 * Analyse 13-10-2026: o.a. de betaalknop (PaymentFlow) liep daarop vast.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { installeerCsrfFetch } from './csrfFetch';

function maakVenster() {
  const echte = vi.fn(async () => new Response('{}', { status: 200 }));
  return { venster: { fetch: echte, location: { origin: 'https://www.swiftbridge.nl' } }, echte };
}
const headersVan = (aanroep) => new Headers(aanroep[1]?.headers);

describe('installeerCsrfFetch', () => {
  beforeEach(() => {
    document.cookie = 'sb_csrf=tok123; path=/';
  });

  test('POST naar de eigen API krijgt de CSRF-header', async () => {
    const { venster, echte } = maakVenster();
    installeerCsrfFetch(venster, '/api');
    await venster.fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const h = headersVan(echte.mock.calls[0]);
    expect(h.get('X-CSRF-Token')).toBe('tok123');
    expect(h.get('Content-Type')).toBe('application/json');
  });

  test('ook PATCH en DELETE, en een volledige URL op de eigen origin', async () => {
    const { venster, echte } = maakVenster();
    installeerCsrfFetch(venster, '/api');
    await venster.fetch('https://www.swiftbridge.nl/api/beneficiaries/1', { method: 'DELETE' });
    await venster.fetch('/api/transactions/1/notitie', { method: 'PATCH' });
    expect(headersVan(echte.mock.calls[0]).get('X-CSRF-Token')).toBe('tok123');
    expect(headersVan(echte.mock.calls[1]).get('X-CSRF-Token')).toBe('tok123');
  });

  test('GET krijgt geen header', async () => {
    const { venster, echte } = maakVenster();
    installeerCsrfFetch(venster, '/api');
    await venster.fetch('/api/transactions');
    expect(headersVan(echte.mock.calls[0]).get('X-CSRF-Token')).toBeNull();
  });

  test('verzoeken naar een andere site krijgen het token nooit', async () => {
    const { venster, echte } = maakVenster();
    installeerCsrfFetch(venster, '/api');
    await venster.fetch('https://api.mollie.com/v2/payments', { method: 'POST' });
    await venster.fetch('/apix/iets', { method: 'POST' });
    expect(headersVan(echte.mock.calls[0]).get('X-CSRF-Token')).toBeNull();
    expect(headersVan(echte.mock.calls[1]).get('X-CSRF-Token')).toBeNull();
  });

  test('werkt ook met een absolute API-URL (lokaal ontwikkelen)', async () => {
    const { venster, echte } = maakVenster();
    installeerCsrfFetch(venster, 'http://localhost:3000');
    await venster.fetch('http://localhost:3000/transactions', { method: 'POST' });
    expect(headersVan(echte.mock.calls[0]).get('X-CSRF-Token')).toBe('tok123');
  });

  test('een header die de aanroeper zelf meegeeft, blijft staan', async () => {
    const { venster, echte } = maakVenster();
    installeerCsrfFetch(venster, '/api');
    await venster.fetch('/api/beneficiaries', { method: 'POST', headers: { 'X-CSRF-Token': 'eigen' } });
    expect(headersVan(echte.mock.calls[0]).get('X-CSRF-Token')).toBe('eigen');
  });

  test('twee keer installeren wikkelt fetch niet dubbel in', async () => {
    const { venster, echte } = maakVenster();
    installeerCsrfFetch(venster, '/api');
    const eerste = venster.fetch;
    installeerCsrfFetch(venster, '/api');
    expect(venster.fetch).toBe(eerste);
    await venster.fetch('/api/x', { method: 'POST' });
    expect(echte).toHaveBeenCalledTimes(1);
  });
});
