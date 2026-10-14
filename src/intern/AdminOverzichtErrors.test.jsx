/**
 * AdminOverzichtErrors.test.jsx — geen gedeeld geheim en geen dode links meer.
 *
 * Sinds ronde 0 (29-9-2026) kent de API geen X-Admin-Secret meer: alleen een
 * medewerkerssessie komt langs (API: middleware/admin.js). Toch lazen
 * AdminOverzicht en AdminErrors nog ?secret= uit de adresbalk en stuurden ze
 * het als header mee. Dat deed niets meer, behalve het geheim in de
 * browsergeschiedenis en in links laten staan.
 *
 * Ook de snelkoppelingen wezen nog naar de oude klantapp-paden (/admin/errors,
 * /admin/compliance, /admin?secret=). In de interne omgeving bestaan die niet,
 * dus elke klik eindigde op "pagina niet gevonden". De echte routes staan in
 * InternApp.jsx: / (werkplek), /overzicht en /fouten.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TaalProvider } from '../i18n';
import AdminOverzicht from './AdminOverzicht';
import AdminErrors from './AdminErrors';

vi.mock('./TrechterOverzicht', () => ({ default: () => null }));

const STATS = {
  gebruikers: 3, kycInBehandeling: 1, kycGoedgekeurd: 1, totaalVolumeEur: 0,
  transacties7d: { aantal: 0, totaalEur: 0 }, transacties30d: { aantal: 0, totaalEur: 0 },
  sanctieHits: 0, gdprActies: 0, kyb: { open: 0, slaOverschreden: 0 },
};

const FOUT = {
  id: 1, error_id: 'ERR-1234567', message: 'Iets ging mis', url: 'https://app.test/app',
  user_agent: 'jsdom', user_id: null, ontvangen_op: '2026-10-14T10:00:00Z', opgetreden_op: '2026-10-14T10:00:00Z',
};

function antwoord(body) {
  return Promise.resolve({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) });
}

beforeEach(() => {
  localStorage.setItem('swiftbridge_taal', 'nl');
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (String(url).includes('/admin/stats')) return antwoord(STATS);
    if (String(url).includes('/errors/frontend/list')) return antwoord({ errors: [FOUT] });
    return antwoord({});
  }));
});

afterEach(() => { vi.unstubAllGlobals(); });

function toon(element, pad) {
  return render(
    <MemoryRouter initialEntries={[pad]}>
      <TaalProvider>{element}</TaalProvider>
    </MemoryRouter>
  );
}

function geenGeheimMeegestuurd() {
  expect(fetch).toHaveBeenCalled();
  for (const [url, opties = {}] of fetch.mock.calls) {
    expect(String(url)).not.toMatch(/secret/i);
    expect(opties.credentials).toBe('include');
    const kop = Object.keys(opties.headers || {}).map((k) => k.toLowerCase());
    expect(kop).not.toContain('x-admin-secret');
  }
}

describe('AdminOverzicht', () => {
  test('stuurt geen X-Admin-Secret, ook niet met ?secret= in de adresbalk', async () => {
    toon(<AdminOverzicht />, '/overzicht?secret=oud-geheim');
    await screen.findByText('3');
    geenGeheimMeegestuurd();
  });

  test('de snelkoppelingen wijzen naar routes die bestaan, zonder geheim', async () => {
    const { container } = toon(<AdminOverzicht />, '/overzicht?secret=oud-geheim');
    // Wachten tot de cijfers er zijn; de snelkoppelingen staan eronder.
    await screen.findByText('3');
    const doelen = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(doelen).toContain('/fouten');
    expect(doelen).toContain('/');
    for (const d of doelen) {
      expect(d).not.toMatch(/^\/admin/);
      expect(d).not.toMatch(/secret/);
    }
  });
});

describe('AdminErrors', () => {
  test('stuurt geen X-Admin-Secret, ook niet met ?secret= in de adresbalk', async () => {
    toon(<AdminErrors />, '/fouten?secret=oud-geheim');
    await screen.findByText('ERR-1234567');
    geenGeheimMeegestuurd();
  });

  test('"alle met dit ID" blijft op /fouten en neemt geen geheim mee', async () => {
    const { container } = toon(<AdminErrors />, '/fouten?secret=oud-geheim');
    fireEvent.click(await screen.findByText('Iets ging mis'));
    const doelen = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(doelen).toContain('/fouten?errorId=ERR-1234567');
    for (const d of doelen) {
      expect(d).not.toMatch(/^\/admin/);
      expect(d).not.toMatch(/secret/);
    }
  });
});
