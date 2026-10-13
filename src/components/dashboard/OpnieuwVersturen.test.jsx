/**
 * OpnieuwVersturen.test.jsx — "Opnieuw versturen" op de bon en bij een
 * geweigerde overboeking (aanmeldroute punt 11, 13-10-2026).
 *
 *  - Op de bon van een geslaagde overboeking: ontvanger, IBAN, bank en bedrag
 *    klaar en meteen naar het bevestigscherm.
 *  - Bij een geweigerde overboeking: wel alles klaarzetten, maar op het eerste
 *    scherm beginnen; daar was iets mis.
 *  - Altijd via sessionStorage, nooit met de IBAN in localStorage.
 * Fictieve gegevens; netwerk gemockt.
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderMetRouter, forceerNederlands, maakFetchMock } from '../kyb/kybTestHulp';
import Tijdlijn from './Tijdlijn';
import RecentTransacties from './RecentTransacties';
import { OPNIEUW_SLEUTEL } from '../../services/opnieuwVersturen';

const IBAN = 'TR330006100519786457841326';

function tx(extra = {}) {
  return {
    id: 'tx_oefen_1',
    ontvangerNaam: 'Oefen Ontvanger',
    ontvangerIBAN: IBAN,
    ontvangerBank: 'Akbank',
    eurBedrag: 250,
    tryBedrag: 8700,
    ontvangenBedrag: 8700,
    feeEur: 4.95,
    wisselKoers: 35.5,
    valuta: 'TRY',
    status: 'voltooid',
    aangemaaktOp: '2026-10-12T10:00:00Z',
    ...extra,
  };
}

describe('Opnieuw versturen vanaf de bon en bij een geweigerde overboeking', () => {
  let origineleFetch;
  let navigaties;
  function luister(e) { navigaties.push(e.detail); }

  beforeEach(() => {
    forceerNederlands();
    sessionStorage.clear();
    localStorage.removeItem(OPNIEUW_SLEUTEL);
    navigaties = [];
    window.addEventListener('swiftbridge_navigate', luister);
    origineleFetch = globalThis.fetch;
    globalThis.fetch = maakFetchMock([
      { pad: '/referral/mijn', body: {} },
      { pad: '/recurring', body: { recurring: [] } },
    ]);
  });
  afterEach(() => {
    window.removeEventListener('swiftbridge_navigate', luister);
    globalThis.fetch = origineleFetch;
    vi.restoreAllMocks();
  });

  test('bon van een geslaagde overboeking: alles klaar en meteen naar bevestigen', async () => {
    renderMetRouter(<Tijdlijn transacties={[tx()]} />);
    fireEvent.click(screen.getByRole('button', { name: /Oefen Ontvanger/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Opnieuw versturen' }));

    expect(JSON.parse(sessionStorage.getItem(OPNIEUW_SLEUTEL))).toEqual({
      ontvanger: 'Oefen Ontvanger', iban: IBAN, bank: 'Akbank', bedrag: 250, valuta: 'TRY', direct: true,
    });
    expect(localStorage.getItem(OPNIEUW_SLEUTEL)).toBeNull();
    expect(navigaties).toEqual(['betaling']);
  });

  test('geweigerde overboeking: klaarzetten, maar op het eerste scherm beginnen', () => {
    renderMetRouter(<RecentTransacties transacties={[tx({ status: 'mislukt' })]} />);
    const rij = screen.getAllByRole('listitem').find((li) => within(li).queryByText('Oefen Ontvanger')) || document.body;
    fireEvent.click(within(rij).getByRole('button', { name: /Opnieuw versturen/ }));

    expect(JSON.parse(sessionStorage.getItem(OPNIEUW_SLEUTEL))).toMatchObject({
      ontvanger: 'Oefen Ontvanger', iban: IBAN, bank: 'Akbank', bedrag: 250, direct: false,
    });
    expect(localStorage.getItem(OPNIEUW_SLEUTEL)).toBeNull();
    expect(navigaties).toEqual(['betaling']);
  });
});
