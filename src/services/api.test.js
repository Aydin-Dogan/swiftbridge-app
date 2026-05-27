/**
 * api.test.js — Tests voor apiFetch CSRF-handling (F58 fix)
 *
 * Verifieert dat:
 *   1. apiFetch GEEN X-CSRF-Token stuurt op GET-requests
 *   2. apiFetch DE X-CSRF-Token stuurt op POST/PUT/PATCH/DELETE
 *      WANNEER de sb_csrf cookie aanwezig is in document.cookie
 *   3. apiFetch GEEN header stuurt als de cookie ontbreekt (bearer client)
 *   4. caller's eigen X-CSRF-Token header wordt niet overschreven
 */
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';

let apiFetch;

describe('apiFetch — F58 CSRF header behavior', () => {
  let fetchMock;
  let originalFetch;

  beforeEach(async () => {
    // Reset modules zodat env-vars en module-cache schoon zijn
    vi.resetModules();
    // Mock global fetch — geef voor elke call een verse Response (anders
    // raakt de body uitgeput bij tweede call binnen dezelfde test)
    fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    originalFetch = globalThis.fetch;
    globalThis.fetch = fetchMock;
    // Schoon document.cookie
    document.cookie.split(';').forEach(c => {
      const eq = c.indexOf('=');
      const key = (eq > -1 ? c.slice(0, eq) : c).trim();
      if (key) document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    // Import na reset
    ({ apiFetch } = await import('./api.js'));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function lastCallHeaders() {
    expect(fetchMock).toHaveBeenCalled();
    const [, opts] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    return opts.headers || {};
  }

  test('GET request: geen X-CSRF-Token header (niet nodig)', async () => {
    document.cookie = 'sb_csrf=abc123; path=/';
    await apiFetch('/auth/me');
    const headers = lastCallHeaders();
    expect(headers['X-CSRF-Token']).toBeUndefined();
  });

  test('POST met sb_csrf cookie: X-CSRF-Token header wordt automatisch toegevoegd', async () => {
    document.cookie = 'sb_csrf=mytoken123; path=/';
    await apiFetch('/transactions', { method: 'POST', body: { eurBedrag: 100 } });
    const headers = lastCallHeaders();
    expect(headers['X-CSRF-Token']).toBe('mytoken123');
  });

  test('PUT en PATCH en DELETE: krijgen allemaal X-CSRF-Token', async () => {
    document.cookie = 'sb_csrf=hxyz; path=/';
    await apiFetch('/foo', { method: 'PUT', body: { a: 1 } });
    expect(lastCallHeaders()['X-CSRF-Token']).toBe('hxyz');

    await apiFetch('/foo/bar', { method: 'PATCH', body: { b: 2 } });
    expect(lastCallHeaders()['X-CSRF-Token']).toBe('hxyz');

    await apiFetch('/foo/baz', { method: 'DELETE' });
    expect(lastCallHeaders()['X-CSRF-Token']).toBe('hxyz');
  });

  test('POST zonder sb_csrf cookie: GEEN header (bearer/mobile fallback)', async () => {
    // Geen cookie gezet
    await apiFetch('/transactions', { method: 'POST', body: { eurBedrag: 100 } });
    const headers = lastCallHeaders();
    expect(headers['X-CSRF-Token']).toBeUndefined();
  });

  test('caller eigen X-CSRF-Token header wordt niet overschreven', async () => {
    document.cookie = 'sb_csrf=auto-zou-zijn; path=/';
    await apiFetch('/transactions', {
      method: 'POST',
      body: {},
      headers: { 'X-CSRF-Token': 'handmatig-overschreven' },
    });
    const headers = lastCallHeaders();
    expect(headers['X-CSRF-Token']).toBe('handmatig-overschreven');
  });

  test('credentials: include wordt altijd gezet (voor cookies)', async () => {
    document.cookie = 'sb_csrf=x; path=/';
    await apiFetch('/transactions', { method: 'POST', body: {} });
    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.credentials).toBe('include');
  });
});
