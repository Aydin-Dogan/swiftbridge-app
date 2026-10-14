/**
 * De schakelaar 'Herinneringen' in Profiel (ronde 3, onderdeel 8).
 *
 * Besluit Aydin 14-10-2026: herinneringen bij een onafgemaakte aanmelding
 * krijgen een eigen schakelaar, los van 'E-mail'. Hij doet PATCH /users/me met
 * alleen {herinneringen} (swiftbridge-api src/routes/users.js). Eronder staat
 * één zin welke mails altijd komen: het besluit over de identificatie, een
 * vraag van ons en de betaalbevestiging. Die lezen de schakelaar niet en zijn
 * nooit uit te zetten.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('../services/api', async (origineel) => ({
  ...(await origineel()),
  apiFetch: vi.fn(),
}));
import { apiFetch } from '../services/api';
import { TaalProvider } from '../i18n';
import { nl } from '../i18n/nl';
import { en } from '../i18n/en';
import { tr } from '../i18n/tr';
import { ru } from '../i18n/ru';
import { az } from '../i18n/az';
import NotificatieVoorkeuren from './NotificatieVoorkeuren';

const TALEN = { nl, en, tr, ru, az };

function toon(profiel, onUpdate = vi.fn()) {
  render(<TaalProvider><NotificatieVoorkeuren profiel={profiel} onUpdate={onUpdate} /></TaalProvider>);
  return onUpdate;
}

const schakelaar = () => screen.getByRole('switch', { name: nl.notif_herinneringen_label });
const patches = () => apiFetch.mock.calls.filter(([, o]) => o?.method === 'PATCH');

beforeEach(() => {
  apiFetch.mockReset();
  apiFetch.mockResolvedValue({ bericht: 'Profiel bijgewerkt', gebruiker: {} });
  localStorage.clear();
  localStorage.setItem('swiftbridge_taal', 'nl');
});

describe("schakelaar 'Herinneringen'", () => {
  test('staat aan als de server herinneringen: true geeft', () => {
    toon({ herinneringen: true });
    expect(schakelaar()).toHaveAttribute('aria-checked', 'true');
  });

  test('staat uit na afmelden (herinneringen: false)', () => {
    toon({ herinneringen: false });
    expect(schakelaar()).toHaveAttribute('aria-checked', 'false');
  });

  test('zonder het veld staat hij aan: dat is de standaard op de server', () => {
    toon({ emailOptIn: true });
    expect(schakelaar()).toHaveAttribute('aria-checked', 'true');
  });

  test('uitzetten: precies één PATCH /users/me met alleen {herinneringen: false}', async () => {
    const onUpdate = toon({ herinneringen: true });
    fireEvent.click(schakelaar());

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith({ herinneringen: false }));
    expect(patches()).toHaveLength(1);
    const [pad, opties] = patches()[0];
    expect(pad).toBe('/users/me');
    // Alleen deze schakelaar: niet 'E-mail', geen naam of adres.
    expect(opties.body).toEqual({ herinneringen: false });
  });

  test('aanzetten: PATCH met {herinneringen: true}, een boolean', async () => {
    const onUpdate = toon({ herinneringen: false });
    fireEvent.click(schakelaar());

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith({ herinneringen: true }));
    expect(patches()[0][1].body).toEqual({ herinneringen: true });
    expect(typeof patches()[0][1].body.herinneringen).toBe('boolean');
  });

  test('mislukt de PATCH, dan een foutmelding en blijft de stand zoals hij was', async () => {
    apiFetch.mockRejectedValue(Object.assign(new Error('Server fout bij bijwerken'), { status: 500 }));
    const onUpdate = toon({ herinneringen: true });
    fireEvent.click(schakelaar());

    expect(await screen.findByText('Server fout bij bijwerken')).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(schakelaar()).toHaveAttribute('aria-checked', 'true');
  });

  test("de schakelaar 'E-mail' blijft los: hij stuurt geen herinneringen mee", async () => {
    toon({ emailOptIn: true, herinneringen: true });
    fireEvent.click(screen.getByRole('switch', { name: nl.notif_email_label }));

    await waitFor(() => expect(patches()).toHaveLength(1));
    expect(patches()[0][1].body).toEqual({ emailOptIn: false });
  });
});

describe('welke mails altijd komen', () => {
  test('één zin noemt de identificatie, een vraag van ons en de betaalbevestiging', () => {
    toon({ herinneringen: true });
    expect(screen.getByText(nl.notif_altijd)).toBeInTheDocument();
    expect(nl.notif_altijd).toMatch(/identificatie/);
    expect(nl.notif_altijd).toMatch(/vragen van ons/);
    expect(nl.notif_altijd).toMatch(/betaalbevestiging/);
  });

  test.each(Object.keys(TALEN))('%s: de schakelaar en de zin staan in de taal van de klant', (taal) => {
    localStorage.setItem('swiftbridge_taal', taal);
    toon({ herinneringen: true });
    const d = TALEN[taal];
    expect(screen.getByRole('switch', { name: d.notif_herinneringen_label })).toBeInTheDocument();
    expect(screen.getByText(d.notif_herinneringen_uitleg)).toBeInTheDocument();
    expect(screen.getByText(d.notif_altijd)).toBeInTheDocument();
  });

  test('de vier talen naast nl zijn echt vertaald, niet de Nederlandse tekst', () => {
    for (const taal of ['en', 'tr', 'ru', 'az']) {
      for (const sleutel of ['notif_herinneringen_label', 'notif_herinneringen_uitleg', 'notif_altijd']) {
        expect(TALEN[taal][sleutel], `${taal}.${sleutel}`).toBeTruthy();
        expect(TALEN[taal][sleutel], `${taal}.${sleutel}`).not.toBe(nl[sleutel]);
      }
    }
  });
});

// act-waarschuwingen van een nog lopende PATCH na afloop voorkomen.
afterEach(async () => { await act(async () => {}); });
