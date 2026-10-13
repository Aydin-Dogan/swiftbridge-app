/**
 * QuickResend.test.jsx — "Snel opnieuw versturen" op het overzicht
 * (aanmeldroute punt 11, 13-10-2026).
 *
 *  - Zichtbaar na de EERSTE geslaagde overboeking. De drempel stond op twee
 *    voltooide overboekingen, dus juist bij overboeking 2 ontbrak hij.
 *  - "Geslaagd" = voltooid, of betaald en onderweg (uitbetalen gaat nu nog met
 *    de hand en kan even duren).
 *  - Eén tik zet ontvanger, IBAN, bank en het laatste bedrag klaar en vraagt de
 *    betaalflow meteen het bevestigscherm te tonen. Via sessionStorage, niet via
 *    localStorage.
 * Fictieve gegevens, geen echte persoonsgegevens.
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMetRouter, forceerNederlands } from '../kyb/kybTestHulp';
import QuickResend from './QuickResend';
import { OPNIEUW_SLEUTEL } from '../../services/opnieuwVersturen';

const IBAN = 'TR330006100519786457841326';

function tx(extra = {}) {
  return {
    id: `tx_${Math.random().toString(36).slice(2, 8)}`,
    ontvangerNaam: 'Oefen Ontvanger',
    ontvangerIBAN: IBAN,
    ontvangerBank: 'Akbank',
    eurBedrag: 300,
    valuta: 'TRY',
    status: 'voltooid',
    aangemaaktOp: '2026-10-10T10:00:00Z',
    ...extra,
  };
}

describe('QuickResend: snel opnieuw na één overboeking', () => {
  let navigaties;
  function luister(e) { navigaties.push(e.detail); }

  beforeEach(() => {
    forceerNederlands();
    sessionStorage.clear();
    localStorage.removeItem(OPNIEUW_SLEUTEL);
    navigaties = [];
    window.addEventListener('swiftbridge_navigate', luister);
  });
  afterEach(() => { window.removeEventListener('swiftbridge_navigate', luister); });

  test('al zichtbaar na één voltooide overboeking', () => {
    renderMetRouter(<QuickResend transacties={[tx()]} />);
    expect(screen.getByRole('button', { name: /Stuur opnieuw naar Oefen Ontvanger/ })).toBeInTheDocument();
  });

  test('ook zichtbaar als de eerste overboeking betaald is en nog onderweg', () => {
    renderMetRouter(<QuickResend transacties={[tx({ status: 'in_behandeling', betalingStatus: 'paid' })]} />);
    expect(screen.getByRole('button', { name: /Stuur opnieuw naar Oefen Ontvanger/ })).toBeInTheDocument();
  });

  test('niet zichtbaar zonder geslaagde overboeking', () => {
    const { container } = renderMetRouter(<QuickResend transacties={[
      tx({ status: 'mislukt' }),
      tx({ status: 'wacht_op_betaling' }),
      tx({ status: 'in_behandeling', betalingStatus: null }),
    ]} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('één tik: ontvanger, IBAN, bank en laatste bedrag klaar, door naar bevestigen', () => {
    renderMetRouter(<QuickResend transacties={[
      tx({ eurBedrag: 300, aangemaaktOp: '2026-10-12T10:00:00Z' }),
      tx({ eurBedrag: 150, aangemaaktOp: '2026-10-01T10:00:00Z' }),
    ]} />);
    fireEvent.click(screen.getByRole('button', { name: /Stuur opnieuw naar Oefen Ontvanger/ }));

    expect(JSON.parse(sessionStorage.getItem(OPNIEUW_SLEUTEL))).toEqual({
      ontvanger: 'Oefen Ontvanger', iban: IBAN, bank: 'Akbank', bedrag: 300, valuta: 'TRY', direct: true,
    });
    expect(localStorage.getItem(OPNIEUW_SLEUTEL)).toBeNull();
    expect(navigaties).toEqual(['betaling']);
  });

  test('zelfde naam met een andere IBAN zijn twee ontvangers; zelfde IBAN maar één', () => {
    renderMetRouter(<QuickResend transacties={[
      tx({ aangemaaktOp: '2026-10-12T10:00:00Z' }),
      tx({ aangemaaktOp: '2026-10-11T10:00:00Z' }),
      tx({ ontvangerIBAN: 'NL91ABNA0417164300', aangemaaktOp: '2026-10-10T10:00:00Z' }),
    ]} />);
    expect(screen.getAllByRole('button', { name: /Stuur opnieuw naar Oefen Ontvanger/ })).toHaveLength(2);
  });

  test('wallet-overboeking zonder IBAN: wel klaarzetten, niet meteen naar bevestigen', () => {
    renderMetRouter(<QuickResend transacties={[tx({ ontvangerIBAN: null, ontvangerBank: null })]} />);
    fireEvent.click(screen.getByRole('button', { name: /Stuur opnieuw naar Oefen Ontvanger/ }));
    expect(JSON.parse(sessionStorage.getItem(OPNIEUW_SLEUTEL))).toMatchObject({ ontvanger: 'Oefen Ontvanger', direct: false });
  });
});
