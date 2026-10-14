/**
 * VastgehoudenUitbetalingen.test.jsx — de lijst vastgehouden uitbetalingen.
 *
 * Sinds 14-10-2026 houdt de API een uitbetaling ook vast als er een
 * informatieverzoek openstaat, de KYC van de klant niet is goedgekeurd of het
 * account is opgeschort (API: services/uitbetalingVasthouden.js). Die rijen
 * komen in dezelfde lijst als de uitbetalingen op handwerk. Het verschil moet
 * zichtbaar zijn: bij een vastgehouden rij staat de reden, en er is GEEN knop
 * "uitbetaald", want die uitbetaling hoort niemand met de hand te doen.
 *
 * VERHUISD (14-10-2026)
 * Dit blok stond op /beheer (AdminPanel). Die pagina is weg (besluit Aydin):
 * hij nam KYC-besluiten buiten het dossierscherm om en vroeg nog een gedeeld
 * geheim in de adresbalk. Het blok staat nu op het overzicht van de
 * compliancewerkplek en praat met de API via de medewerkerssessie, zonder
 * X-Admin-Secret.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { TaalProvider } from '../i18n';
import VastgehoudenUitbetalingen from './VastgehoudenUitbetalingen';

const NU = new Date().toISOString();

function rij(extra) {
  return {
    id: extra.id,
    referentieNr: extra.referentieNr,
    ontvangerNaam: 'Amina Duran',
    ontvangerBank: 'Garanti BBVA',
    uitbetaalMethode: 'papara',
    uitbetaalReferentie: null,
    eurBedrag: 100,
    tryBedrag: 3400,
    valuta: 'TRY',
    status: 'in_behandeling',
    payoutStatus: null,
    vastgehouden: false,
    redenVasthouden: null,
    aangemaaktOp: NU,
    ...extra,
  };
}

const PAYOUTS = [
  rij({
    id: 'tx-vast', referentieNr: 'SB-VAST',
    payoutStatus: 'payout_vastgehouden: kyc_niet_goedgekeurd',
    vastgehouden: true, redenVasthouden: 'kyc_niet_goedgekeurd',
  }),
  rij({ id: 'tx-hand', referentieNr: 'SB-HAND', payoutStatus: 'payout_pending_manual: geen bank-rail' }),
  rij({ id: 'tx-geann', referentieNr: 'SB-GEANN', status: 'geannuleerd', payoutStatus: 'payout_vastgehouden: informatieverzoek' }),
];

/** Zoals fetch antwoordt; apiFetch leest de tekst en zet die om. */
function antwoord(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  });
}

function toon() {
  return render(<TaalProvider><VastgehoudenUitbetalingen /></TaalProvider>);
}

const regel = (ref) => screen.getByText(ref).closest('tr');
const knoppen = (tr) => within(tr).queryAllByRole('button').map((b) => b.textContent.toLowerCase());
const knop = (tr, tekst) => within(tr).getAllByRole('button').find((b) => b.textContent.toLowerCase().includes(tekst));

describe('Vastgehouden uitbetalingen op de compliancewerkplek', () => {
  let payouts;
  let opnieuwAntwoord;
  let uitbetaaldAntwoord;

  beforeEach(() => {
    localStorage.setItem('swiftbridge_taal', 'nl');
    payouts = PAYOUTS;
    opnieuwAntwoord = () => antwoord({ ok: true });
    uitbetaaldAntwoord = () => antwoord({ ok: true });
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('fetch', vi.fn((url, opties = {}) => {
      if (url.endsWith('/admin/payouts/pending')) return antwoord({ totaal: payouts.length, payouts });
      if (opties.method === 'POST' && url.endsWith('/opnieuw')) return opnieuwAntwoord();
      if (opties.method === 'POST' && url.endsWith('/handmatig-uitbetaald')) return uitbetaaldAntwoord();
      return antwoord({}, 404);
    }));
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  test('een vastgehouden rij toont de reden en heeft geen knop "uitbetaald"', async () => {
    toon();
    await waitFor(() => expect(screen.getByText('SB-VAST')).toBeTruthy());

    const vast = regel('SB-VAST');
    expect(within(vast).getByText('Vastgehouden: de KYC van de klant is niet goedgekeurd')).toBeTruthy();
    expect(knoppen(vast).some((k) => k.includes('uitbetaald'))).toBe(false);
    expect(knoppen(vast).some((k) => k.includes('opnieuw'))).toBe(true);

    // Uitleg boven de lijst, want er staat een vastgehouden rij in.
    expect(screen.getByText(/niet met de hand uitbetalen/i)).toBeTruthy();
  });

  test('kop en kolommen in gewone woorden, geen sleutelnamen', async () => {
    // Op /beheer stond "admin_payouts_pending_titel (3)" als kop: t() geeft
    // bij een ontbrekende vertaling de sleutel terug, en "|| tekst" ving dat
    // nooit op.
    const { container } = toon();
    await waitFor(() => expect(screen.getByText('SB-VAST')).toBeTruthy());
    expect(screen.getByText(/^Vastgehouden uitbetalingen/)).toBeTruthy();
    expect(screen.getByText('Ontvanger')).toBeTruthy();
    expect(container.textContent).not.toMatch(/admin_payout/);
  });

  test('een rij op handwerk zonder openstaande reden houdt de knop "uitbetaald"', async () => {
    toon();
    await waitFor(() => expect(screen.getByText('SB-HAND')).toBeTruthy());

    const hand = regel('SB-HAND');
    expect(knoppen(hand).some((k) => k.includes('uitbetaald'))).toBe(true);
    expect(within(hand).queryByText(/^Vastgehouden/)).toBeNull();
  });

  test('een geannuleerde, betaalde overboeking staat erin zonder knoppen', async () => {
    toon();
    await waitFor(() => expect(screen.getByText('SB-GEANN')).toBeTruthy());

    const geann = regel('SB-GEANN');
    expect(within(geann).getByText('Status geannuleerd: betaald, niet uitbetaald')).toBeTruthy();
    expect(knoppen(geann)).toEqual([]);
  });

  test('"opnieuw" terwijl de reden er nog is: de reden komt in de melding', async () => {
    opnieuwAntwoord = () => antwoord(
      { errorCode: 'CONFLICT', error: 'Deze uitbetaling is nog vastgehouden.', reden: 'kyc_niet_goedgekeurd' }, 409
    );
    toon();
    await waitFor(() => expect(screen.getByText('SB-VAST')).toBeTruthy());

    fireEvent.click(knop(regel('SB-VAST'), 'opnieuw'));

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(window.alert.mock.calls[0][0]).toContain('Vastgehouden: de KYC van de klant is niet goedgekeurd');
  });

  test('"uitbetaald" op een overboeking die niet betaald is: de melding zegt waarom', async () => {
    // Sinds 14-10-2026 weigert de API dit (409 CONFLICT, zonder reden). De
    // algemene vertaling van CONFLICT ("Deze actie kon niet worden uitgevoerd")
    // zegt de medewerker niets; de tekst van de server wel.
    uitbetaaldAntwoord = () => antwoord(
      { errorCode: 'CONFLICT', error: 'Deze transactie is niet betaald; er valt niets uit te betalen' }, 409
    );
    toon();
    await waitFor(() => expect(screen.getByText('SB-HAND')).toBeTruthy());

    fireEvent.click(knop(regel('SB-HAND'), 'uitbetaald'));

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(window.alert.mock.calls[0][0]).toContain('niet betaald');
  });

  test('praat met de API via de medewerkerssessie, zonder gedeeld geheim', async () => {
    toon();
    await waitFor(() => expect(screen.getByText('SB-HAND')).toBeTruthy());
    fireEvent.click(knop(regel('SB-HAND'), 'uitbetaald'));
    await waitFor(() => expect(
      fetch.mock.calls.some(([url]) => url.endsWith('/admin/payouts/tx-hand/handmatig-uitbetaald'))
    ).toBe(true));

    for (const [, opties = {}] of fetch.mock.calls) {
      expect(opties.credentials).toBe('include');
      const kop = Object.keys(opties.headers || {}).map((k) => k.toLowerCase());
      expect(kop).not.toContain('x-admin-secret');
    }
  });

  test('niets vastgehouden: het blok blijft weg', async () => {
    payouts = [];
    const { container } = toon();
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    // Even laten afronden; daarna mag er niets staan.
    await new Promise((r) => setTimeout(r, 0));
    expect(container.textContent).toBe('');
  });
});
