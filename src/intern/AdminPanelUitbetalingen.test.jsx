/**
 * AdminPanelUitbetalingen.test.jsx — de lijst vastgehouden uitbetalingen.
 *
 * Sinds 14-10-2026 houdt de API een uitbetaling ook vast als er een
 * informatieverzoek openstaat, de KYC van de klant niet is goedgekeurd of het
 * account is opgeschort (API: services/uitbetalingVasthouden.js). Die rijen
 * komen in dezelfde lijst als de uitbetalingen op handwerk. Het verschil moet
 * zichtbaar zijn: bij een vastgehouden rij staat de reden, en er is GEEN knop
 * "uitbetaald", want die uitbetaling hoort niemand met de hand te doen.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TaalProvider } from '../i18n';
import AdminPanel from './AdminPanel';

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

function antwoord(body, status = 200) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });
}

function toon() {
  return render(
    <MemoryRouter initialEntries={['/beheer?secret=test']}>
      <TaalProvider><AdminPanel /></TaalProvider>
    </MemoryRouter>
  );
}

const regel = (ref) => screen.getByText(ref).closest('tr');
const knoppen = (tr) => within(tr).queryAllByRole('button').map((b) => b.textContent.toLowerCase());

describe('Vastgehouden uitbetalingen in het beheerpaneel', () => {
  let opnieuwAntwoord;

  beforeEach(() => {
    localStorage.setItem('swiftbridge_taal', 'nl');
    opnieuwAntwoord = () => antwoord({ ok: true });
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('fetch', vi.fn((url, opties = {}) => {
      if (url.endsWith('/kyc/alle')) return antwoord({ aanvragen: [] });
      if (url.endsWith('/kyc/admin/stats')) return antwoord({ gebruikers: 0, kyc: {}, transacties: {} });
      if (url.endsWith('/kyc/admin/integriteit')) return antwoord({ geldig: true, totaal: 0 });
      if (url.endsWith('/admin/payouts/pending')) return antwoord({ totaal: PAYOUTS.length, payouts: PAYOUTS });
      if (opties.method === 'POST' && url.endsWith('/opnieuw')) return opnieuwAntwoord();
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

    const knop = within(regel('SB-VAST')).getAllByRole('button')
      .find((b) => b.textContent.toLowerCase().includes('opnieuw'));
    fireEvent.click(knop);

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(window.alert.mock.calls[0][0]).toContain('Vastgehouden: de KYC van de klant is niet goedgekeurd');
  });
});
