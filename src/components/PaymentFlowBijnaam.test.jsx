/**
 * PaymentFlowBijnaam.test.jsx — geen vinkje "Bewaar als favoriete ontvanger"
 * meer, maar een optioneel veld "Bijnaam" (review aanmeldroute punt 11,
 * 14-10-2026).
 *
 *  - De server bewaart een bankontvanger na een geslaagde betaling toch al; het
 *    vinkje deed er dus niet meer toe. De klant ziet wel dat het gebeurt en waar
 *    hij de ontvanger kan verwijderen.
 *  - Vult hij een bijnaam in, dan komt die bij de opgeslagen ontvanger. Laat hij
 *    het leeg, dan stuurt de app niets extra's.
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

const TX = '5d1b8d2e-7c4a-4e5b-9a6d-1c2b3a4d5e6f';
const IBAN = 'TR330006100519786457841326';

function routes() {
  return [
    { pad: '/beneficiaries', body: { beneficiaries: [] } },
    { methode: 'POST', pad: '/beneficiaries', status: 201, body: { beneficiary: { id: 'nieuw' } } },
    { pad: '/users/me', body: { gratisEersteTx: false } },
    { pad: '/transactions/uitbetaalmethodes', body: { bank: true, papara: true } },
    { pad: '/auth/pin/status', body: { ingeschakeld: false } },
    { pad: '/payments/methodes', body: { methodes: [], beschikbaar: ['ideal'] } },
    {
      methode: 'POST', pad: /\/transactions$/, status: 201,
      body: { transactie: { id: TX, eurBedrag: 100, feeEur: 4.95, tryBedrag: 3400, wisselKoers: 35.7, ontvangerNaam: 'Oefen Ontvanger', status: 'in_behandeling' } },
    },
    { methode: 'POST', pad: '/payments/start', body: { paymentId: 'tr_bijnaam', checkoutUrl: 'https://mollie.test/c/bijnaam' } },
  ];
}

function vulOverboekingVooraf() {
  localStorage.setItem('swiftbridge_repeat_tx', JSON.stringify({
    ontvanger: 'Oefen Ontvanger', iban: IBAN, bedrag: 100, valuta: 'TRY',
  }));
}

function aanroepen() {
  return globalThis.fetch.mock.calls.map(([u, o]) => ({ url: String(u), methode: o?.method || 'GET', body: o?.body }));
}

async function bevestigEnBetaal() {
  fireEvent.click(await screen.findByRole('button', { name: /Betaalmethode kiezen/ }));
  await screen.findByText('Kies betaalmethode');
  fireEvent.click(screen.getByRole('button', { name: /Controleren/ }));
  fireEvent.click(await screen.findByRole('button', { name: 'Bevestigen & betalen' }));
  await waitFor(() => expect(doorsturenNaar).toHaveBeenCalledWith('https://mollie.test/c/bijnaam'));
}

describe('PaymentFlow: bijnaam in plaats van het vinkje', () => {
  let origineleFetch;
  beforeEach(() => {
    forceerNederlands();
    try { sessionStorage.clear(); localStorage.removeItem('swiftbridge_repeat_tx'); } catch { /* setup-mock */ }
    origineleFetch = globalThis.fetch;
    vi.mocked(doorsturenNaar).mockClear();
  });
  afterEach(() => { globalThis.fetch = origineleFetch; vi.restoreAllMocks(); });

  test('geen vinkje meer; wel een optioneel veld Bijnaam en uitleg dat de ontvanger bewaard wordt', async () => {
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    expect(await screen.findByLabelText('Bijnaam (optioneel)')).toHaveValue('');
    expect(screen.queryByText('Bewaar als favoriete ontvanger')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(/Na een geslaagde betaling staat deze ontvanger in Mijn ontvangers/)).toBeInTheDocument();
  });

  test('bijnaam ingevuld: de opgeslagen ontvanger krijgt hem, na het aanmaken van de overboeking', async () => {
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    fireEvent.change(await screen.findByLabelText('Bijnaam (optioneel)'), { target: { value: 'Mama' } });
    await bevestigEnBetaal();

    const lijst = aanroepen();
    const aanmaak = lijst.findIndex((a) => a.methode === 'POST' && /\/transactions$/.test(a.url));
    const bewaar = lijst.findIndex((a) => a.methode === 'POST' && /\/beneficiaries$/.test(a.url));
    expect(aanmaak).toBeGreaterThanOrEqual(0);
    expect(bewaar).toBeGreaterThan(aanmaak);
    expect(JSON.parse(lijst[bewaar].body)).toMatchObject({
      naam: 'Oefen Ontvanger', iban: IBAN, valuta: 'TRY', land: 'TR', bijnaam: 'Mama',
    });
  });

  // Review 14-10-2026: reset() wiste ontvanger en IBAN, maar niet de bijnaam.
  // Bij de volgende overschrijving stond "Mama" dan al ingevuld bij een andere
  // ontvanger, en zonder opletten kreeg die ontvanger die bijnaam.
  test('nieuwe overschrijving: de bijnaam van de vorige ontvanger staat er niet meer', async () => {
    globalThis.fetch = maakFetchMock(routes().filter((r) => r.pad !== '/payments/start').concat([
      { methode: 'POST', pad: '/payments/start', status: 503, body: { errorCode: 'PAY_NIET_GECONFIGUREERD', error: 'x' } },
    ]));
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    fireEvent.change(await screen.findByLabelText('Bijnaam (optioneel)'), { target: { value: 'Mama' } });
    fireEvent.click(await screen.findByRole('button', { name: /Betaalmethode kiezen/ }));
    await screen.findByText('Kies betaalmethode');
    fireEvent.click(screen.getByRole('button', { name: /Controleren/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bevestigen & betalen' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Nieuwe overschrijving' }));

    fireEvent.change(await screen.findByPlaceholderText('Mehmet Yilmaz'), { target: { value: 'Oefen Broer' } });
    fireEvent.change(screen.getByPlaceholderText(IBAN), { target: { value: 'NL91ABNA0417164300' } });
    expect(await screen.findByLabelText('Bijnaam (optioneel)')).toHaveValue('');
  });

  // Besluit Aydin 14-10-2026: de knoppen "Wie is dit voor jou?" (Mama, Papa, …)
  // bewaarden sinds de bijnaam niets meer. Nu vullen ze de bijnaam in.
  test('knop Mama vult de bijnaam in, en die gaat mee met de opgeslagen ontvanger', async () => {
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    const knop = await screen.findByRole('button', { name: 'Mama' });
    expect(knop).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(knop);
    expect(screen.getByLabelText('Bijnaam (optioneel)')).toHaveValue('Mama');
    expect(knop).toHaveAttribute('aria-pressed', 'true');

    await bevestigEnBetaal();
    const bewaar = aanroepen().find((a) => a.methode === 'POST' && /\/beneficiaries$/.test(a.url));
    expect(JSON.parse(bewaar.body)).toMatchObject({ bijnaam: 'Mama' });
  });

  test('nog eens op dezelfde knop: de bijnaam is weer leeg', async () => {
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    const knop = await screen.findByRole('button', { name: 'Papa' });
    fireEvent.click(knop);
    fireEvent.click(knop);
    expect(screen.getByLabelText('Bijnaam (optioneel)')).toHaveValue('');
    expect(knop).toHaveAttribute('aria-pressed', 'false');
  });

  test('een andere knop vervangt de bijnaam; zelf typen kan altijd', async () => {
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Mama' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oma' }));
    const veld = screen.getByLabelText('Bijnaam (optioneel)');
    expect(veld).toHaveValue('Oma');

    fireEvent.change(veld, { target: { value: 'Oma Ayse' } });
    expect(screen.getByRole('button', { name: 'Oma' })).toHaveAttribute('aria-pressed', 'false');
    // "Anders" is geen bijnaam: wie iets anders wil, typt het zelf.
    expect(screen.queryByRole('button', { name: 'Anders' })).not.toBeInTheDocument();
  });

  // Review 14-10-2026: na een snelknop een bestaande ontvanger kiezen liet de
  // oude bijnaam staan. Na de betaling kreeg die ontvanger dan de verkeerde
  // bijnaam (POST → 409 → PATCH).
  test('bestaande ontvanger kiezen: zijn eigen bijnaam staat er, niet die van de knop', async () => {
    const lijst = [
      { id: 'b1', naam: 'Oefen Zus', iban: 'NL91ABNA0417164300', bank: 'ABN AMRO', valuta: 'TRY', bijnaam: 'Zus' },
      { id: 'b2', naam: 'Oefen Neef', iban: 'NL02RABO0123456789', bank: 'Rabobank', valuta: 'TRY', bijnaam: null },
    ];
    globalThis.fetch = maakFetchMock(routes().map((r) => (r.pad === '/beneficiaries' && !r.methode
      ? { ...r, body: { beneficiaries: lijst } } : r)));
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Broer' }));
    fireEvent.click(screen.getByRole('button', { name: /Kies bestaande ontvanger/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Oefen Zus/ }));
    expect(await screen.findByLabelText('Bijnaam (optioneel)')).toHaveValue('Zus');
    expect(screen.getByRole('button', { name: 'Broer' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Zus' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Kies bestaande ontvanger/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Oefen Neef/ }));
    expect(await screen.findByLabelText('Bijnaam (optioneel)')).toHaveValue('');
  });

  test('de knop Vriend vult "Vriend" in, zonder "(in)"', async () => {
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Vriend' }));
    expect(screen.getByLabelText('Bijnaam (optioneel)')).toHaveValue('Vriend');
  });

  test('bijnaam leeg: de app slaat zelf niets op (dat doet de server na de betaling)', async () => {
    globalThis.fetch = maakFetchMock(routes());
    vulOverboekingVooraf();
    renderMetRouter(<PaymentFlow token="oefen-token" />);

    await screen.findByLabelText('Bijnaam (optioneel)');
    await bevestigEnBetaal();

    expect(aanroepen().some((a) => a.methode === 'POST' && /\/beneficiaries$/.test(a.url))).toBe(false);
  });
});
