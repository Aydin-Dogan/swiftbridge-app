/**
 * KvkZoeker.test.jsx — resultaten, niet beschikbaar -> handmatig, oefenbadge, prefill.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import KvkZoeker from './KvkZoeker';
import { renderMetRouter, forceerNederlands, maakFetchMock } from './kybTestHulp';

const OEFEN_BEDRIJF = {
  kvkNummer: '00000001',
  naam: 'Oefen Handel B.V.',
  handelsnamen: ['Oefen Handel'],
  rechtsvormKvk: 'bv',
  vestiging: { straat: 'Oefenstraat', huisnummer: '1', postcode: '1234 AB', plaats: 'Oefenstad', land: 'NL' },
  sbiCodes: [{ code: '46901', omschrijving: 'Niet-gespecialiseerde groothandel', hoofdactiviteit: true }],
  opgehaaldOp: 1,
};

describe('KvkZoeker', () => {
  let origineleFetch;
  beforeEach(() => { forceerNederlands(); origineleFetch = globalThis.fetch; });
  afterEach(() => { globalThis.fetch = origineleFetch; });

  test('zoekt na 400 ms en toont resultaatkaarten; klik haalt basisprofiel op', async () => {
    globalThis.fetch = maakFetchMock([
      { pad: '/kyb/kvk/zoeken', body: { bron: 'mock', resultaten: [
        { kvkNummer: '00000001', naam: 'Oefen Handel B.V.', straat: 'Oefenstraat', huisnummer: '1', postcode: '1234 AB', plaats: 'Oefenstad', type: 'hoofdvestiging' },
        { kvkNummer: '00000002', naam: 'Oefen Uitzendbureau B.V.', plaats: 'Oefenstad' },
      ] } },
      { pad: '/kyb/kvk/basisprofiel/00000001', body: { bron: 'mock', bedrijf: OEFEN_BEDRIJF } },
    ]);
    const onGekozen = vi.fn();
    renderMetRouter(<KvkZoeker beschikbaar bron="mock" onGekozen={onGekozen} onHandmatig={() => {}} />);
    fireEvent.change(screen.getByLabelText('Zoek je bedrijf'), { target: { value: 'Oefen' } });
    await waitFor(() => expect(screen.getByText('Oefen Handel B.V.')).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByText('Oefen Uitzendbureau B.V.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Oefen Handel B.V.'));
    await waitFor(() => expect(onGekozen).toHaveBeenCalled());
    const [profiel, bronCode] = onGekozen.mock.calls[0];
    expect(profiel.naam).toBe('Oefen Handel B.V.');
    expect(profiel.sbiCodes).toHaveLength(1);
    expect(bronCode).toBe('kvk_mock');
  });

  test('beschikbaar:false -> melding + knop "Gegevens zelf invullen" roept onHandmatig aan', () => {
    globalThis.fetch = maakFetchMock([]);
    const onHandmatig = vi.fn();
    renderMetRouter(<KvkZoeker beschikbaar={false} bron="geen" onGekozen={() => {}} onHandmatig={onHandmatig} />);
    expect(screen.getByRole('status')).toHaveTextContent('Het Handelsregister is nu niet bereikbaar');
    fireEvent.click(screen.getByRole('button', { name: 'Gegevens zelf invullen' }));
    expect(onHandmatig).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('bron mock -> badge "Oefenmodus: voorbeeldbedrijven"', () => {
    globalThis.fetch = maakFetchMock([]);
    renderMetRouter(<KvkZoeker beschikbaar bron="mock" onGekozen={() => {}} onHandmatig={() => {}} />);
    expect(screen.getByText('Oefenmodus: voorbeeldbedrijven')).toBeInTheDocument();
  });

  test('bron kvk -> geen oefenbadge', () => {
    globalThis.fetch = maakFetchMock([]);
    renderMetRouter(<KvkZoeker beschikbaar bron="kvk" onGekozen={() => {}} onHandmatig={() => {}} />);
    expect(screen.queryByText('Oefenmodus: voorbeeldbedrijven')).not.toBeInTheDocument();
  });

  test('prefill uit registratie: "Is dit je bedrijf?" met bevestigknop', async () => {
    globalThis.fetch = maakFetchMock([
      { pad: '/kyb/kvk/basisprofiel/00000001', body: { bron: 'mock', bedrijf: OEFEN_BEDRIJF } },
    ]);
    const onGekozen = vi.fn();
    renderMetRouter(<KvkZoeker beschikbaar bron="mock" beginKvkNummer="00000001" onGekozen={onGekozen} onHandmatig={() => {}} />);
    await waitFor(() => expect(screen.getByText('Is dit je bedrijf?')).toBeInTheDocument());
    expect(screen.getByText('Oefen Handel B.V.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ja, dit is mijn bedrijf' }));
    expect(onGekozen).toHaveBeenCalledWith(expect.objectContaining({ kvkNummer: '00000001' }), 'kvk_mock');
  });

  test('503 bij zoeken -> schakelt over naar handmatige invoer', async () => {
    globalThis.fetch = maakFetchMock([
      { pad: '/kyb/kvk/zoeken', status: 503, body: { error: 'Het Handelsregister is tijdelijk niet bereikbaar.', errorCode: 'KYB_KVK_NIET_BESCHIKBAAR' } },
    ]);
    renderMetRouter(<KvkZoeker beschikbaar bron="kvk" onGekozen={() => {}} onHandmatig={() => {}} />);
    fireEvent.change(screen.getByLabelText('Zoek je bedrijf'), { target: { value: 'Oefen' } });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('niet bereikbaar'), { timeout: 3000 });
  });
});
