/**
 * naamZoeken.test.jsx — zoeken op naam negeert hoofdletters en Turkse letters
 * (bouwplan ronde 3, onderdeel 4).
 *
 * Wie 'yilmaz' of 'sahin' typte, vond 'Yılmaz' en 'Şahin' niet: de filters in
 * BeneficiaryKiezer, RecentTransacties en Tijdlijn vergeleken alleen kleine
 * letters. Nu dezelfde normalisatie als lib/naamNormaal. Zoeken op IBAN of
 * bedrag werkt zoals voorheen.
 * Alle netwerkverkeer is gemockt; fictieve namen.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMetRouter, forceerNederlands, maakFetchMock } from './kyb/kybTestHulp';
import BeneficiaryKiezer from './beneficiaries/BeneficiaryKiezer';
import RecentTransacties from './dashboard/RecentTransacties';
import Tijdlijn from './dashboard/Tijdlijn';

const ONTVANGERS = [
  { id: 'b1', naam: 'Ayşe Şahin', iban: 'NL91ABNA0417164300', bank: 'ABN AMRO', valuta: 'TRY', bijnaam: null },
  { id: 'b2', naam: 'Oefen Neef', iban: 'TR330006100519786457841326', bank: 'Ziraat Bankası', valuta: 'TRY', bijnaam: null },
];

function tx(id, ontvangerNaam, eurBedrag) {
  return { id, ontvangerNaam, eurBedrag, status: 'voltooid', aangemaaktOp: `2026-10-0${id}T10:00:00Z`, valuta: 'TRY', ontvangenBedrag: 1000 };
}

const TRANSACTIES = [
  tx(1, 'Ayşe Yılmaz', 125),
  tx(2, 'Oefen Neef', 80),
  tx(3, 'Oefen Zus', 60),
  tx(4, 'Oefen Oom', 70),
  tx(5, 'Oefen Tante', 90),
];

describe('zoeken op naam', () => {
  let origineleFetch;
  beforeEach(() => {
    forceerNederlands();
    origineleFetch = globalThis.fetch;
    globalThis.fetch = maakFetchMock([
      { pad: '/beneficiaries', body: { beneficiaries: ONTVANGERS } },
      { pad: '/recurring', body: { recurring: [] } },
    ]);
  });
  afterEach(() => { globalThis.fetch = origineleFetch; vi.restoreAllMocks(); });

  test('BeneficiaryKiezer: "sahin" vindt Şahin; zoeken op IBAN werkt nog', async () => {
    renderMetRouter(<BeneficiaryKiezer token="oefen-token" onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Kies bestaande ontvanger/ }));
    const zoek = await screen.findByPlaceholderText('Zoek op naam, IBAN of bank...');
    await screen.findByText('Oefen Neef');

    fireEvent.change(zoek, { target: { value: 'sahin' } });
    expect(screen.getByText('Ayşe Şahin')).toBeInTheDocument();
    expect(screen.queryByText('Oefen Neef')).not.toBeInTheDocument();

    fireEvent.change(zoek, { target: { value: 'TR33' } });
    expect(screen.getByText('Oefen Neef')).toBeInTheDocument();
    expect(screen.queryByText('Ayşe Şahin')).not.toBeInTheDocument();
  });

  test('RecentTransacties: "yilmaz" vindt Yılmaz; zoeken op bedrag werkt nog', () => {
    renderMetRouter(<RecentTransacties transacties={TRANSACTIES} />);
    const zoek = screen.getByRole('searchbox', { name: 'Zoek transacties' });

    fireEvent.change(zoek, { target: { value: 'yilmaz' } });
    expect(screen.getByText('Ayşe Yılmaz')).toBeInTheDocument();
    expect(screen.queryByText('Oefen Neef')).not.toBeInTheDocument();

    fireEvent.change(zoek, { target: { value: '80' } });
    expect(screen.getByText('Oefen Neef')).toBeInTheDocument();
    expect(screen.queryByText('Ayşe Yılmaz')).not.toBeInTheDocument();
  });

  test('Tijdlijn: "AYSE" vindt Ayşe; zoeken op bedrag werkt nog', () => {
    renderMetRouter(<Tijdlijn transacties={TRANSACTIES} metZoeken />);
    const zoek = screen.getByRole('searchbox', { name: 'Zoeken in transacties' });

    fireEvent.change(zoek, { target: { value: 'AYSE' } });
    expect(screen.getByText('Ayşe Yılmaz')).toBeInTheDocument();
    expect(screen.queryByText('Oefen Neef')).not.toBeInTheDocument();

    fireEvent.change(zoek, { target: { value: '125' } });
    expect(screen.getByText('Ayşe Yılmaz')).toBeInTheDocument();
    expect(screen.queryByText('Oefen Zus')).not.toBeInTheDocument();
  });
});
