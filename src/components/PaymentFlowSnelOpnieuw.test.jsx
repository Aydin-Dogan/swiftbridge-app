/**
 * PaymentFlowSnelOpnieuw.test.jsx — de tweede overboeking in twee tikken
 * (aanmeldroute punt 11, 13-10-2026).
 *
 *  - "Snel opnieuw" op het overzicht zet ontvanger, IBAN, bank en het laatste
 *    bedrag klaar; de betaalflow opent dan meteen het bevestigscherm. De klant
 *    tikt "Bevestigen & betalen" en keurt goed in zijn bank-app.
 *  - De laatst gebruikte betaalmethode staat voorgekozen. Het toestel onthoudt
 *    alleen de naam van de methode, nooit een IBAN.
 *  - Niets wordt overgeslagen: de server controleert de overboeking zoals altijd
 *    (hier gemockt), en de pincode wordt gevraagd als die aan staat.
 *  - Klopt er iets niet (te laag bedrag, geen bankuitbetaling mogelijk), dan
 *    gewoon het eerste scherm met alles ingevuld.
 * Alle netwerkverkeer is gemockt; fictieve gegevens.
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
import { OPNIEUW_SLEUTEL } from '../services/opnieuwVersturen';
import { LAATSTE_METHODE_SLEUTEL } from '../services/laatsteBetaalmethode';

const TX = '7a1b8d2e-7c4a-4e5b-9a6d-1c2b3a4d5e6f';
const IBAN = 'TR330006100519786457841326';

function routes({ bank = true, pin = false, extra = [] } = {}) {
  return [
    ...extra,
    { pad: '/beneficiaries', body: { beneficiaries: [] } },
    { pad: '/users/me', body: { gratisEersteTx: false } },
    { pad: '/transactions/uitbetaalmethodes', body: { bank, papara: true } },
    { pad: '/auth/pin/status', body: { ingeschakeld: pin } },
    { pad: '/payments/methodes', body: { methodes: [], beschikbaar: ['ideal', 'creditcard', 'bancontact'] } },
    {
      methode: 'POST', pad: /\/transactions$/, status: 201,
      body: { transactie: { id: TX, eurBedrag: 300, feeEur: 4.95, tryBedrag: 10400, wisselKoers: 35.7, ontvangerNaam: 'Oefen Ontvanger', status: 'in_behandeling' } },
    },
    { methode: 'POST', pad: '/payments/start', body: { paymentId: 'tr_snel', checkoutUrl: 'https://mollie.test/c/snel' } },
  ];
}

function snelOpnieuw(extra = {}) {
  sessionStorage.setItem(OPNIEUW_SLEUTEL, JSON.stringify({
    ontvanger: 'Oefen Ontvanger', iban: IBAN, bank: 'Akbank', bedrag: 300, valuta: 'TRY', direct: true, ...extra,
  }));
}

function alleWaarden(opslag) {
  const waarden = [];
  for (let i = 0; i < opslag.length; i += 1) waarden.push(opslag.getItem(opslag.key(i)));
  return waarden.join('\n');
}

function aanroepen() {
  return globalThis.fetch.mock.calls.map(([u, o]) => ({ url: String(u), methode: o?.method || 'GET', body: o?.body }));
}

describe('PaymentFlow: snel opnieuw', () => {
  let origineleFetch;
  beforeEach(() => {
    forceerNederlands();
    sessionStorage.clear();
    localStorage.removeItem(OPNIEUW_SLEUTEL);
    localStorage.removeItem(LAATSTE_METHODE_SLEUTEL);
    origineleFetch = globalThis.fetch;
    vi.mocked(doorsturenNaar).mockClear();
  });
  afterEach(() => { globalThis.fetch = origineleFetch; vi.restoreAllMocks(); });

  test('opent meteen het bevestigscherm, met ontvanger, bank, laatste bedrag en de laatst gebruikte methode', async () => {
    globalThis.fetch = maakFetchMock(routes());
    localStorage.setItem(LAATSTE_METHODE_SLEUTEL, 'creditcard');
    snelOpnieuw();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    expect(await screen.findByText('Bevestig overmaken')).toBeInTheDocument();
    expect(screen.getByText('Oefen Ontvanger')).toBeInTheDocument();
    expect(screen.getByText('Akbank')).toBeInTheDocument();
    expect(screen.getByText('€300.00')).toBeInTheDocument();
    expect(screen.getByText('Credit/Debit kaart')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Betaalmethode kiezen/ })).not.toBeInTheDocument();
  });

  test('tik 2: bevestigen & betalen maakt de overboeking op de server aan en gaat naar de betaalpagina', async () => {
    globalThis.fetch = maakFetchMock(routes());
    localStorage.setItem(LAATSTE_METHODE_SLEUTEL, 'creditcard');
    snelOpnieuw();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Bevestigen & betalen' }));
    await waitFor(() => expect(doorsturenNaar).toHaveBeenCalledWith('https://mollie.test/c/snel'));

    const aanmaak = aanroepen().find((a) => a.methode === 'POST' && /\/transactions$/.test(a.url));
    expect(JSON.parse(aanmaak.body)).toMatchObject({
      eurBedrag: 300, ontvangerNaam: 'Oefen Ontvanger', ontvangerIBAN: IBAN, ontvangerBank: 'Akbank',
      valuta: 'TRY', methode: 'creditcard', uitbetaalMethode: 'bank',
    });
    // Het toestel onthoudt de methode, maar geen IBAN.
    expect(localStorage.getItem(LAATSTE_METHODE_SLEUTEL)).toBe('creditcard');
    expect(alleWaarden(localStorage)).not.toContain(IBAN);
  });

  test('pincode aan: eerst de pincode, ook bij een snelle tik vóór de pinstatus binnen is', async () => {
    globalThis.fetch = maakFetchMock(routes({ pin: true }));
    snelOpnieuw();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    // Het bevestigscherm staat er meteen; de pinstatus is dan nog onderweg.
    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen & betalen' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(aanroepen().some((a) => a.methode === 'POST' && /\/transactions$/.test(a.url))).toBe(false);
    expect(doorsturenNaar).not.toHaveBeenCalled();
  });

  test('pincode uit: een snelle tik gaat gewoon door naar de server', async () => {
    globalThis.fetch = maakFetchMock(routes({ pin: false }));
    snelOpnieuw();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen & betalen' }));
    await waitFor(() => expect(doorsturenNaar).toHaveBeenCalledWith('https://mollie.test/c/snel'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('bedrag onder het minimum: eerste scherm, alles ingevuld', async () => {
    globalThis.fetch = maakFetchMock(routes());
    snelOpnieuw({ bedrag: 5 });
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    expect(await screen.findByRole('button', { name: /Betaalmethode kiezen/ })).toBeInTheDocument();
    expect(screen.queryByText('Bevestig overmaken')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mehmet Yilmaz')).toHaveValue('Oefen Ontvanger');
    expect(screen.getByPlaceholderText('TR330006100519786457841326')).toHaveValue(IBAN);
  });

  test('bankuitbetaling kan nu niet: terug naar het eerste scherm', async () => {
    globalThis.fetch = maakFetchMock(routes({ bank: false }));
    snelOpnieuw();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    expect(await screen.findByRole('button', { name: /Betaalmethode kiezen/ })).toBeInTheDocument();
    expect(screen.queryByText('Bevestig overmaken')).not.toBeInTheDocument();
  });

  test('zonder "snel" (bv. een mislukte overboeking opnieuw): eerste scherm met de bank ingevuld', async () => {
    globalThis.fetch = maakFetchMock(routes());
    snelOpnieuw({ direct: false });
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    expect(await screen.findByRole('button', { name: /Betaalmethode kiezen/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Akbank')).toBeInTheDocument();
  });

  test('de laatst gebruikte methode staat ook in de gewone route voorgekozen', async () => {
    globalThis.fetch = maakFetchMock(routes());
    localStorage.setItem(LAATSTE_METHODE_SLEUTEL, 'bancontact');
    snelOpnieuw({ direct: false });
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    fireEvent.click(await screen.findByRole('button', { name: /Betaalmethode kiezen/ }));
    await screen.findByText('Kies betaalmethode');
    expect(screen.getByRole('radio', { name: /Bancontact/ })).toBeChecked();
  });
});
