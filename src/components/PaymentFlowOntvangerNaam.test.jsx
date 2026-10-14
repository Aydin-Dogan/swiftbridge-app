/**
 * PaymentFlowOntvangerNaam.test.jsx — de naam van de ontvanger (bouwplan
 * ronde 3, onderdeel 4).
 *
 *  - PaymentFlow liet een naam van alleen een spatie door: de knop
 *    "Betaalmethode kiezen" keek alleen of het veld niet leeg was. Nu dezelfde
 *    regel als Overschrijven en de server: na trim minimaal 2 tekens. Ook
 *    BeneficiaryFormulier (Mijn ontvangers) weigerde alleen een leeg veld.
 *  - Bij de naam staat op alle drie de plekken de hint "Naam precies zoals bij
 *    de bank van de ontvanger". Strengere regels wachten op een besluit.
 *  - Zoeken in opgeslagen ontvangers vindt 'Yılmaz' ook als je 'yilmaz' typt.
 * Alle netwerkverkeer is gemockt; fictieve namen.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, render } from '@testing-library/react';
import { renderMetRouter, forceerNederlands, maakFetchMock } from './kyb/kybTestHulp';
import { TaalProvider } from '../i18n';

vi.mock('../services/betaalStart', async (origineel) => ({
  ...(await origineel()),
  doorsturenNaar: vi.fn(),
}));

import PaymentFlow from './PaymentFlow';
import BeneficiaryFormulier from './beneficiaries/BeneficiaryFormulier';
import Overschrijven from './opdrachten/Overschrijven';
import { doorsturenNaar } from '../services/betaalStart';

const TX = '7a2c9e1f-3b4d-4c5e-8f6a-2b3c4d5e6f70';
const IBAN = 'TR330006100519786457841326';
const HINT = 'Naam precies zoals bij de bank van de ontvanger';
const FOUT = 'Vul de naam van de ontvanger in';

function routes(beneficiaries = []) {
  return [
    { pad: '/beneficiaries', body: { beneficiaries } },
    { pad: '/users/me', body: { gratisEersteTx: false } },
    { pad: '/transactions/uitbetaalmethodes', body: { bank: true, papara: true } },
    { pad: '/auth/pin/status', body: { ingeschakeld: false } },
    { pad: '/payments/methodes', body: { methodes: [], beschikbaar: ['ideal'] } },
    {
      methode: 'POST', pad: /\/transactions$/, status: 201,
      body: { transactie: { id: TX, eurBedrag: 100, feeEur: 4.95, tryBedrag: 3400, wisselKoers: 35.7, ontvangerNaam: 'Mehmet Yilmaz', status: 'in_behandeling' } },
    },
    { methode: 'POST', pad: '/payments/start', body: { paymentId: 'tr_naam', checkoutUrl: 'https://mollie.test/c/naam' } },
  ];
}

function vulOverboekingVooraf() {
  localStorage.setItem('swiftbridge_repeat_tx', JSON.stringify({
    ontvanger: 'Oefen Ontvanger', iban: IBAN, bedrag: 100, valuta: 'TRY',
  }));
}

const knop = () => screen.getByRole('button', { name: /Betaalmethode kiezen/ });

describe('PaymentFlow: naam van de ontvanger', () => {
  let origineleFetch;
  beforeEach(() => {
    forceerNederlands();
    try { sessionStorage.clear(); localStorage.removeItem('swiftbridge_repeat_tx'); } catch { /* setup-mock */ }
    origineleFetch = globalThis.fetch;
    vi.mocked(doorsturenNaar).mockClear();
  });
  afterEach(() => { globalThis.fetch = origineleFetch; vi.restoreAllMocks(); });

  test('een naam van alleen een spatie of één letter wordt geweigerd, met uitleg', async () => {
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    const veld = await screen.findByPlaceholderText('Mehmet Yilmaz');
    expect(knop()).not.toBeDisabled();

    fireEvent.change(veld, { target: { value: ' ' } });
    expect(knop()).toBeDisabled();
    expect(screen.getByText(FOUT)).toBeInTheDocument();

    fireEvent.change(veld, { target: { value: ' A ' } });
    expect(knop()).toBeDisabled();
  });

  test.each(['Mehmet Yilmaz', 'Oefen Ontvanger', 'Oefen Broer', 'Al'])('%s blijft geldig', async (naam) => {
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    fireEvent.change(await screen.findByPlaceholderText('Mehmet Yilmaz'), { target: { value: naam } });
    expect(knop()).not.toBeDisabled();
    expect(screen.queryByText(FOUT)).not.toBeInTheDocument();
  });

  test('de hint staat bij het naamveld', async () => {
    globalThis.fetch = maakFetchMock(routes());
    renderMetRouter(<PaymentFlow token="oefen-token" />);
    expect(await screen.findByText(HINT)).toBeInTheDocument();
  });

  test('de overboeking krijgt de naam zonder spaties eromheen', async () => {
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    fireEvent.change(await screen.findByPlaceholderText('Mehmet Yilmaz'), { target: { value: '  Mehmet Yilmaz ' } });
    fireEvent.click(knop());
    await screen.findByText('Kies betaalmethode');
    fireEvent.click(screen.getByRole('button', { name: /Controleren/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bevestigen & betalen' }));
    await waitFor(() => expect(doorsturenNaar).toHaveBeenCalled());

    const aanmaak = globalThis.fetch.mock.calls.find(([u, o]) => o?.method === 'POST' && /\/transactions$/.test(String(u)));
    expect(JSON.parse(aanmaak[1].body).ontvangerNaam).toBe('Mehmet Yilmaz');
  });

  test('zoeken in opgeslagen ontvangers: "yilmaz" vindt Yılmaz', async () => {
    globalThis.fetch = maakFetchMock(routes([
      { id: 'b1', naam: 'Ayşe Yılmaz', iban: 'NL91ABNA0417164300', bank: 'ABN AMRO', valuta: 'TRY', bijnaam: null },
      { id: 'b2', naam: 'Oefen Neef', iban: 'NL02RABO0123456789', bank: 'Rabobank', valuta: 'TRY', bijnaam: null },
    ]));
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    const veld = await screen.findByPlaceholderText('Mehmet Yilmaz');
    // Wachten tot de lijst er is: de autocomplete haalt hem zelf op.
    await waitFor(() => expect(globalThis.fetch.mock.calls.some(([u]) => /\/beneficiaries$/.test(String(u)))).toBe(true));
    fireEvent.focus(veld);
    fireEvent.change(veld, { target: { value: 'yilmaz' } });
    expect(await screen.findByRole('button', { name: /Ayşe Yılmaz/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Oefen Neef/ })).not.toBeInTheDocument();
  });

  test('bijnaamknop in het Turks: zelf "buyukanne" typen drukt de knop Büyükanne in', async () => {
    try { localStorage.setItem('swiftbridge_taal', 'tr'); } catch { /* setup-mock */ }
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    const knopOma = await screen.findByRole('button', { name: 'Büyükanne' });
    fireEvent.change(screen.getByLabelText('Takma ad (isteğe bağlı)'), { target: { value: 'buyukanne' } });
    expect(knopOma).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('BeneficiaryFormulier: naam van de ontvanger', () => {
  beforeEach(() => { forceerNederlands(); });

  function toon(onOpslaan) {
    render(
      <TaalProvider>
        <BeneficiaryFormulier open initial={null} bezig={false} fout="" onAnnuleer={() => {}} onOpslaan={onOpslaan} />
      </TaalProvider>,
    );
  }

  test('één letter na trim wordt niet opgeslagen; de hint staat erbij', () => {
    const onOpslaan = vi.fn();
    toon(onOpslaan);
    expect(screen.getByText(HINT)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Mehmet Yilmaz'), { target: { value: ' A ' } });
    fireEvent.change(screen.getByPlaceholderText(IBAN), { target: { value: IBAN } });
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan' }));
    expect(onOpslaan).not.toHaveBeenCalled();
    expect(screen.getByText('Naam is verplicht')).toBeInTheDocument();
  });

  test('een gewone naam wordt opgeslagen, zonder spaties eromheen', () => {
    const onOpslaan = vi.fn();
    toon(onOpslaan);
    fireEvent.change(screen.getByPlaceholderText('Mehmet Yilmaz'), { target: { value: ' Oefen Broer ' } });
    fireEvent.change(screen.getByPlaceholderText(IBAN), { target: { value: IBAN } });
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan' }));
    expect(onOpslaan).toHaveBeenCalledWith(expect.objectContaining({ naam: 'Oefen Broer' }));
  });
});

describe('Overschrijven: naam van de ontvanger', () => {
  let origineleFetch;
  beforeEach(() => {
    forceerNederlands();
    origineleFetch = globalThis.fetch;
    globalThis.fetch = maakFetchMock([{ pad: '/beneficiaries', body: { beneficiaries: [] } }]);
  });
  afterEach(() => { globalThis.fetch = origineleFetch; vi.restoreAllMocks(); });

  test('de hint staat bij het naamveld; één letter geeft de foutmelding', async () => {
    renderMetRouter(<Overschrijven />);
    const veld = await screen.findByLabelText(/Naam ontvanger/);
    expect(screen.getByText(HINT)).toBeInTheDocument();

    fireEvent.change(veld, { target: { value: ' A ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Versturen' }));
    expect(await screen.findByText(FOUT)).toBeInTheDocument();
  });
});
