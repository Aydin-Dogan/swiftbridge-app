/**
 * BetaalStatusKaart.test.jsx — wat de klant ziet als hij terugkomt van iDEAL.
 *
 * AANLEIDING (analyse aanmeldroute, 13-10-2026)
 * Mollie stuurt de klant terug naar /app?payment=<id>, maar die parameter werd
 * nergens gelezen: na het betalen zag hij niets, ook niet als de betaling was
 * afgebroken of mislukt. Nu: betaald, nog bezig, afgebroken of mislukt, en bij
 * afgebroken of mislukt een knop om dezelfde overboeking opnieuw te betalen.
 * Alle netwerkverkeer is gemockt; geen echte persoonsgegevens.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderMetRouter, forceerNederlands, maakFetchMock } from '../kyb/kybTestHulp';

vi.mock('../../services/betaalStart', async (origineel) => ({
  ...(await origineel()),
  doorsturenNaar: vi.fn(),
}));

import BetaalStatusKaart from './BetaalStatusKaart';
import { doorsturenNaar } from '../../services/betaalStart';

const TX = '3f1b8d2e-7c4a-4e5b-9a6d-1c2b3a4d5e6f';

function status(extra) {
  return {
    transactieId: TX,
    uitkomst: 'betaald',
    kanOpnieuwBetalen: false,
    betaalMethode: 'ideal',
    eurBedrag: 100,
    ontvangenBedrag: 3575.25,
    valuta: 'TRY',
    welkomstDeal: false,
    ...extra,
  };
}

describe('BetaalStatusKaart', () => {
  let origineleFetch;
  beforeEach(() => {
    forceerNederlands();
    origineleFetch = globalThis.fetch;
    vi.mocked(doorsturenNaar).mockClear();
  });
  afterEach(() => { globalThis.fetch = origineleFetch; });

  function toon(routes, props = {}) {
    globalThis.fetch = maakFetchMock(routes);
    return renderMetRouter(
      <BetaalStatusKaart transactieId={TX} onSluit={vi.fn()} onNieuweOverboeking={vi.fn()} pollMs={5} {...props} />
    );
  }

  test('betaald: de klant ziet dat zijn betaling binnen is', async () => {
    toon([{ pad: `/payments/${TX}/status`, body: status() }]);
    expect(await screen.findByText('Betaling ontvangen')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opnieuw betalen' })).not.toBeInTheDocument();
  });

  test('afgebroken: eerlijke melding, niets afgeschreven, en opnieuw betalen', async () => {
    toon([
      { pad: `/payments/${TX}/status`, body: status({ uitkomst: 'afgebroken', kanOpnieuwBetalen: true }) },
      { methode: 'POST', pad: '/payments/start', body: { checkoutUrl: 'https://mollie.test/c/9' } },
    ]);
    expect(await screen.findByText('Betaling afgebroken')).toBeInTheDocument();
    expect(screen.getByText(/niets afgeschreven/i)).toBeInTheDocument();
    expect(screen.queryByText('Betaling ontvangen')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Opnieuw betalen' }));
    await waitFor(() => expect(doorsturenNaar).toHaveBeenCalledWith('https://mollie.test/c/9'));
    const start = globalThis.fetch.mock.calls.find(([u, o]) => String(u).includes('/payments/start') && o?.method === 'POST');
    expect(JSON.parse(start[1].body)).toEqual({ transactieId: TX, methode: 'ideal' });
  });

  test('mislukt: eigen titel en ook opnieuw betalen', async () => {
    toon([{ pad: `/payments/${TX}/status`, body: status({ uitkomst: 'mislukt', kanOpnieuwBetalen: true }) }]);
    expect(await screen.findByText('Betaling mislukt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opnieuw betalen' })).toBeInTheDocument();
  });

  test('de welkomstactie blijft bij een afgebroken betaling, en dat ziet de klant', async () => {
    toon([{ pad: `/payments/${TX}/status`, body: status({ uitkomst: 'afgebroken', kanOpnieuwBetalen: true, welkomstDeal: true }) }]);
    expect(await screen.findByText(/welkomstactie blijft staan/i)).toBeInTheDocument();
  });

  test('niet meer te betalen: geen knop opnieuw betalen, wel een nieuwe overboeking', async () => {
    const onNieuweOverboeking = vi.fn();
    toon([{ pad: `/payments/${TX}/status`, body: status({ uitkomst: 'afgebroken', kanOpnieuwBetalen: false }) }], { onNieuweOverboeking });
    expect(await screen.findByText('Betaling afgebroken')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opnieuw betalen' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nieuwe overboeking' }));
    expect(onNieuweOverboeking).toHaveBeenCalled();
  });

  test('nog bezig: de kaart kijkt opnieuw en toont daarna betaald', async () => {
    let n = 0;
    toon([{
      pad: `/payments/${TX}/status`,
      body: () => { n += 1; return status({ uitkomst: n < 2 ? 'bezig' : 'betaald' }); },
    }]);
    expect(await screen.findByText('Je betaling is nog niet afgerond')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verder met betalen' })).toBeInTheDocument();
    expect(await screen.findByText('Betaling ontvangen')).toBeInTheDocument();
  });

  test('opnieuw betalen lukt niet: de melding van de server, geen doorsturen', async () => {
    toon([
      { pad: `/payments/${TX}/status`, body: status({ uitkomst: 'mislukt', kanOpnieuwBetalen: true }) },
      { methode: 'POST', pad: '/payments/start', status: 409, body: { errorCode: 'PAY_WELKOMST_ELDERS', error: 'x' } },
    ]);
    fireEvent.click(await screen.findByRole('button', { name: 'Opnieuw betalen' }));
    expect(await screen.findByText(/hoort nu bij een andere overboeking/i)).toBeInTheDocument();
    expect(doorsturenNaar).not.toHaveBeenCalled();
  });

  test('status niet op te halen: dat zeggen we, zonder succes te suggereren', async () => {
    toon([{ pad: `/payments/${TX}/status`, status: 500, body: { errorCode: 'SERVER_ERROR' } }]);
    expect(await screen.findByText(/konden de status van je betaling niet ophalen/i)).toBeInTheDocument();
    expect(screen.queryByText('Betaling ontvangen')).not.toBeInTheDocument();
  });
});
