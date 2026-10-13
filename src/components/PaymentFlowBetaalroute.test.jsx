/**
 * PaymentFlowBetaalroute.test.jsx — de betaalroute in de app zegt wat er echt
 * gebeurt (analyse aanmeldroute, 13-10-2026).
 *
 *  - Lukt het starten van de betaling niet, dan GEEN "Geld onderweg!" meer, maar
 *    een eerlijke melding en een knop die dezelfde overboeking opnieuw laat
 *    betalen (geen tweede overboeking).
 *  - De betaalstap toont alleen methodes die de server aanneemt; methodes die
 *    bij Mollie niet aan staan, zijn uitgeschakeld.
 *  - Een oud concept met een methode die niet meer kan, valt terug op iDEAL.
 * Alle netwerkverkeer is gemockt; geen echte persoonsgegevens.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderMetRouter, forceerNederlands, maakFetchMock } from './kyb/kybTestHulp';

vi.mock('../services/betaalStart', async (origineel) => ({
  ...(await origineel()),
  doorsturenNaar: vi.fn(),
}));

import PaymentFlow from './PaymentFlow';
import { doorsturenNaar } from '../services/betaalStart';

const TX = '3f1b8d2e-7c4a-4e5b-9a6d-1c2b3a4d5e6f';

function basisRoutes(extra = []) {
  return [
    ...extra,
    { pad: '/beneficiaries', body: [] },
    { pad: '/users/me', body: { gratisEersteTx: false } },
    { pad: '/transactions/uitbetaalmethodes', body: { bank: true, papara: true } },
    { pad: '/auth/pin/status', body: { ingeschakeld: false } },
    {
      methode: 'POST', pad: /\/transactions$/, status: 201,
      body: { transactie: { id: TX, eurBedrag: 100, feeEur: 4.95, tryBedrag: 3400, wisselKoers: 35.7, ontvangerNaam: 'Oefen Ontvanger', status: 'in_behandeling' } },
    },
  ];
}

function vulOverboekingVooraf() {
  localStorage.setItem('swiftbridge_repeat_tx', JSON.stringify({
    ontvanger: 'Oefen Ontvanger', iban: 'TR330006100519786457841326', bedrag: 100, valuta: 'TRY',
  }));
}

async function naarBetaalmethode() {
  fireEvent.click(await screen.findByRole('button', { name: /Betaalmethode kiezen/ }));
  await screen.findByText('Kies betaalmethode');
}

async function naarBevestigen() {
  await naarBetaalmethode();
  fireEvent.click(screen.getByRole('button', { name: /Controleren/ }));
  await screen.findByText('Bevestig overmaken');
}

describe('PaymentFlow: betaalroute', () => {
  let origineleFetch;
  beforeEach(() => {
    forceerNederlands();
    try { sessionStorage.clear(); localStorage.removeItem('swiftbridge_repeat_tx'); } catch { /* setup-mock */ }
    origineleFetch = globalThis.fetch;
    vi.mocked(doorsturenNaar).mockClear();
  });
  afterEach(() => { globalThis.fetch = origineleFetch; vi.restoreAllMocks(); });

  test('betaalstap: alleen methodes die de server aanneemt', async () => {
    globalThis.fetch = maakFetchMock(basisRoutes([
      { pad: '/payments/methodes', body: { methodes: [], beschikbaar: null } },
    ]));
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);
    await naarBetaalmethode();

    for (const weg of ['PayPal', 'SEPA bankoverboeking', 'KBC/CBC', 'Belfius Pay', 'Pay By Bank', 'Billie (factuur)']) {
      expect(screen.queryByText(weg)).not.toBeInTheDocument();
    }
    expect(screen.getByRole('radio', { name: /iDEAL/ })).not.toBeDisabled();
    expect(screen.getByRole('radio', { name: /Credit\/Debit kaart/ })).not.toBeDisabled();
    expect(screen.getByRole('radio', { name: /Bancontact/ })).not.toBeDisabled();
    expect(screen.getByRole('radio', { name: /Apple Pay/ })).toBeDisabled();
    // Geen nep-rekeningnummer meer voor een overboeking naar ons.
    expect(screen.queryByText(/NL12SWFT/)).not.toBeInTheDocument();
  });

  test('betaalstap: wat bij Mollie niet aan staat, is uitgeschakeld', async () => {
    globalThis.fetch = maakFetchMock(basisRoutes([
      { pad: '/payments/methodes', body: { methodes: [{ id: 'ideal' }], beschikbaar: ['ideal', 'wero'] } },
    ]));
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);
    await naarBetaalmethode();

    await waitFor(() => expect(screen.getByRole('radio', { name: /Bancontact/ })).toBeDisabled());
    expect(screen.getByRole('radio', { name: /Credit\/Debit kaart/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /iDEAL/ })).not.toBeDisabled();
  });

  test('een oud concept met PayPal valt terug op iDEAL', async () => {
    globalThis.fetch = maakFetchMock(basisRoutes());
    sessionStorage.setItem('swiftbridge_payment_draft_v2', JSON.stringify({
      bedrag: 100, valuta: 'TRY', methode: 'paypal', snelheid: 'express', opgeslagen_op: Date.now(),
    }));
    renderMetRouter(<PaymentFlow token="oefen-token" />);
    // Het concept bewaart geen naam of IBAN; die vult de klant zelf in.
    fireEvent.change(await screen.findByPlaceholderText('Mehmet Yilmaz'), { target: { value: 'Oefen Ontvanger' } });
    fireEvent.change(screen.getByPlaceholderText('TR330006100519786457841326'), { target: { value: 'TR330006100519786457841326' } });
    await naarBetaalmethode();
    expect(screen.getByRole('radio', { name: /iDEAL/ })).toBeChecked();
    expect(screen.queryByText('PayPal')).not.toBeInTheDocument();
  });

  test('betaling start niet: eerlijke melding, geen succes, en opnieuw betalen voor dezelfde overboeking', async () => {
    let starts = 0;
    globalThis.fetch = maakFetchMock(basisRoutes([
      {
        methode: 'POST', pad: '/payments/start',
        status: 500,
        body: () => { starts += 1; return { errorCode: 'PAY_MOLLIE_FOUT', error: 'x' }; },
      },
    ]));
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);
    await naarBevestigen();
    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen & betalen' }));

    expect(await screen.findByText('Je betaling is niet gestart')).toBeInTheDocument();
    expect(screen.queryByText('Geld onderweg!')).not.toBeInTheDocument();
    expect(screen.queryByText(/betaling is verwerkt/i)).not.toBeInTheDocument();
    expect(doorsturenNaar).not.toHaveBeenCalled();
    expect(starts).toBe(1);

    // Opnieuw betalen: nu lukt het, en er komt GEEN tweede overboeking bij.
    globalThis.fetch = maakFetchMock(basisRoutes([
      { methode: 'POST', pad: '/payments/start', body: { paymentId: 'tr_2', checkoutUrl: 'https://mollie.test/c/2' } },
    ]));
    fireEvent.click(screen.getByRole('button', { name: 'Opnieuw betalen' }));
    await waitFor(() => expect(doorsturenNaar).toHaveBeenCalledWith('https://mollie.test/c/2'));
    const aanroepen = globalThis.fetch.mock.calls.map(([u, o]) => `${o?.method || 'GET'} ${u}`);
    expect(aanroepen.filter((a) => /^POST .*\/transactions$/.test(a))).toHaveLength(0);
    const start = globalThis.fetch.mock.calls.find(([u]) => String(u).includes('/payments/start'));
    expect(JSON.parse(start[1].body)).toEqual({ transactieId: TX, methode: 'ideal' });
  });

  test('niet meer te betalen: geen knop opnieuw betalen, wel een nieuwe overboeking', async () => {
    globalThis.fetch = maakFetchMock(basisRoutes([
      { methode: 'POST', pad: '/payments/start', status: 409, body: { errorCode: 'PAY_NIET_MEER_TE_BETALEN', error: 'x' } },
    ]));
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);
    await naarBevestigen();
    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen & betalen' }));

    expect(await screen.findByText('Je betaling is niet gestart')).toBeInTheDocument();
    expect(screen.getByText(/kan niet meer worden betaald/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opnieuw betalen' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nieuwe overboeking' }));
    expect(await screen.findByRole('button', { name: /Betaalmethode kiezen/ })).toBeInTheDocument();
  });

  test('betaling gestart: door naar de betaalpagina', async () => {
    globalThis.fetch = maakFetchMock(basisRoutes([
      { methode: 'POST', pad: '/payments/start', body: { paymentId: 'tr_1', checkoutUrl: 'https://mollie.test/c/1' } },
    ]));
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);
    await naarBevestigen();
    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen & betalen' }));
    await waitFor(() => expect(doorsturenNaar).toHaveBeenCalledWith('https://mollie.test/c/1'));
    expect(screen.queryByText('Je betaling is niet gestart')).not.toBeInTheDocument();
  });

  test('simulatie (betalen staat uit op de server): geen "betaling verwerkt", wel eerlijk testbericht', async () => {
    globalThis.fetch = maakFetchMock(basisRoutes([
      { methode: 'POST', pad: '/payments/start', status: 503, body: { errorCode: 'PAY_NIET_GECONFIGUREERD', error: 'x' } },
    ]));
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);
    await naarBevestigen();
    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen & betalen' }));

    expect(await screen.findByText('Testoverboeking verwerkt')).toBeInTheDocument();
    expect(screen.getByText(/niets afgeschreven/i)).toBeInTheDocument();
    expect(screen.queryByText(/iDEAL betaling is verwerkt/i)).not.toBeInTheDocument();
  });
});
