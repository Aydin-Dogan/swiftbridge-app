/**
 * ZakelijkAanvraag.test.jsx — pagina-gedrag per status (fetch-mocks tegen docs/KYB_API.md):
 *  geen aanvraag -> intro; concept -> hub; ingediend -> statusscherm met '5 werkdagen';
 *  afgewezen sanctie -> alleen generieke tekst; 401 -> /login?next=...
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route } from 'react-router-dom';
import ZakelijkAanvraag from './ZakelijkAanvraag';
import {
  renderMetRouter, forceerNederlands, maakFetchMock, oefenAanvraag, OEFEN_ACCOUNT, LocatieSpion,
} from '../components/kyb/kybTestHulp';

const GEBRUIKER = { id: 'u-oefen', naam: 'Oefen Aanvrager', email: 'oefen@voorbeeld.test', accountType: 'zakelijk', kybStatus: 'geen' };
const GENERIEK = 'Op basis van ons acceptatiebeleid kunnen wij je aanvraag niet goedkeuren. Hierover doen wij geen verdere mededelingen.';

function aanvraagRespons(aanvraag) {
  return {
    aanvraag,
    account: OEFEN_ACCOUNT,
    kvk: { beschikbaar: true, bron: 'mock' },
    slaWerkdagen: 5,
    oefenmodus: true,
  };
}

function renderPagina(pad = '/app/zakelijk-aanvraag') {
  return renderMetRouter(<ZakelijkAanvraag gebruiker={GEBRUIKER} onProfielVerversen={() => {}} />, {
    pad,
    extraRoutes: (
      <>
        <Route path="/app/zakelijk-aanvraag" element={<ZakelijkAanvraag gebruiker={GEBRUIKER} onProfielVerversen={() => {}} />} />
        <Route path="/app/zakelijk-aanvraag/stap/:nr" element={<ZakelijkAanvraag gebruiker={GEBRUIKER} onProfielVerversen={() => {}} />} />
        <Route path="/login" element={<LocatieSpion />} />
      </>
    ),
  });
}

describe('ZakelijkAanvraag', () => {
  let origineleFetch;
  beforeEach(() => { forceerNederlands(); origineleFetch = globalThis.fetch; });
  afterEach(() => { globalThis.fetch = origineleFetch; });

  test('geen aanvraag -> intro met prijsregel, toezichtzin en "Aanvraag starten"', async () => {
    globalThis.fetch = maakFetchMock([{ pad: '/kyb/aanvraag', body: aanvraagRespons(null) }]);
    renderPagina();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Aanvraag starten' })).toBeInTheDocument());
    expect(screen.getByText(/Vast tarief van EUR 4,95 per overboeking/)).toBeInTheDocument();
    expect(screen.getAllByText(/SwiftBridge is geen bank en heeft geen eigen DNB-vergunning/).length).toBeGreaterThan(0);
    expect(screen.getByText(/uiterlijk binnen 5 werkdagen/)).toBeInTheDocument();
  });

  test('concept -> hub met "Ga verder met stap 3"', async () => {
    globalThis.fetch = maakFetchMock([
      { pad: '/kyb/aanvraag', body: aanvraagRespons(oefenAanvraag({ stappenVoltooid: [1, 2], volgendeStap: 3 })) },
    ]);
    renderPagina();
    await waitFor(() => expect(screen.getByRole('button', { name: /Ga verder met stap 3/ })).toBeInTheDocument());
    expect(screen.getByRole('list', { name: 'Je aanvraag' }).querySelectorAll('li')).toHaveLength(7);
  });

  test('ingediend -> statusscherm met "5 werkdagen" en de uiterste datum', async () => {
    const uiterlijk = Date.UTC(2026, 8, 21, 12, 0, 0);
    globalThis.fetch = maakFetchMock([
      { pad: '/kyb/aanvraag', body: aanvraagRespons(oefenAanvraag({ status: 'ingediend', stappenVoltooid: [1, 2, 3, 4, 5, 6, 7], ingediendOp: Date.now(), verwachtUiterlijkOp: uiterlijk })) },
    ]);
    renderPagina();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Je aanvraag is ingediend' })).toBeInTheDocument());
    expect(screen.getByText(/uiterlijk binnen 5 werkdagen/)).toBeInTheDocument();
    expect(screen.getByText(/Uiterlijk op 21 september 2026/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aanvraag starten' })).not.toBeInTheDocument();
  });

  test('afgewezen met reden sanctie -> alleen de generieke tekst, nooit de reden-code', async () => {
    globalThis.fetch = maakFetchMock([
      { pad: '/kyb/aanvraag', body: aanvraagRespons(oefenAanvraag({ status: 'afgewezen', besluitRedenCode: 'sanctie', berichtKlant: GENERIEK })) },
    ]);
    renderPagina();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Je aanvraag is niet goedgekeurd' })).toBeInTheDocument());
    expect(screen.getByText(GENERIEK)).toBeInTheDocument();
    expect(document.body.textContent.toLowerCase()).not.toContain('sanctie');
    expect(screen.getByRole('button', { name: 'Nieuwe aanvraag doen' })).toBeInTheDocument();
  });

  test('401 -> redirect naar /login?next=/app/zakelijk-aanvraag/stap/4', async () => {
    globalThis.fetch = maakFetchMock([
      { pad: '/kyb/aanvraag', status: 401, body: { error: 'Niet ingelogd', errorCode: 'UNAUTHORIZED' } },
    ]);
    renderPagina('/app/zakelijk-aanvraag/stap/4');
    await waitFor(() => expect(screen.getByTestId('locatie')).toHaveTextContent('/login?next=%2Fapp%2Fzakelijk-aanvraag%2Fstap%2F4'));
  });

  test('403 KYB_ACCOUNT_TYPE (particulier) -> melding, geen flow', async () => {
    globalThis.fetch = maakFetchMock([
      { pad: '/kyb/aanvraag', status: 403, body: { error: 'Dit is alleen beschikbaar voor zakelijke accounts.', errorCode: 'KYB_ACCOUNT_TYPE' } },
    ]);
    renderPagina();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('alleen beschikbaar voor zakelijke accounts'));
    expect(screen.queryByRole('button', { name: 'Aanvraag starten' })).not.toBeInTheDocument();
  });

  test('503 KYB_INTAKE_GESLOTEN -> intro zonder startknop met "binnenkort beschikbaar"', async () => {
    globalThis.fetch = maakFetchMock([
      { pad: '/kyb/aanvraag', status: 503, body: { error: 'nog niet', errorCode: 'KYB_INTAKE_GESLOTEN' } },
    ]);
    renderPagina();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('binnenkort beschikbaar'));
    expect(screen.queryByRole('button', { name: 'Aanvraag starten' })).not.toBeInTheDocument();
  });
});
