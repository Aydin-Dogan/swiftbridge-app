/**
 * StapToestemming.test.jsx — knop pas actief na vier vinkjes, marketing default uit
 * en niet vereist, body bevat productupdatesOptIn:false, KYB_NIET_COMPLEET -> links.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import StapToestemming from './StapToestemming';
import { renderMetRouter, forceerNederlands, maakFetchMock, oefenAanvraag } from './kybTestHulp';

const VOORWAARDEN = {
  voorwaardenVersie: '2026-09', privacyVersie: '2026-09', slaWerkdagen: 5,
  prijs: { vastEur: 4.95, minBedrag: 50, maxBedrag: 5000, fxMargeNiveaus: { basis: 0.012, plus: 0.01, premium: 0.008, black: 0.006 } },
  links: { algemeneVoorwaarden: '/voorwaarden', privacy: '/privacy', acceptatiecriteria: '/zakelijk/acceptatiecriteria', betaaldiensten: '/voorwaarden/betaaldiensten' },
};

function vinkAlles() {
  fireEvent.click(screen.getByLabelText(/juist en volledig/));
  fireEvent.click(screen.getByLabelText(/bevoegd ben/));
  fireEvent.click(screen.getByLabelText(/acceptatiecriteria/));
  fireEvent.click(screen.getByLabelText(/algemene voorwaarden \(versie 2026-09\)/));
}

describe('StapToestemming', () => {
  let origineleFetch;
  beforeEach(() => {
    forceerNederlands();
    origineleFetch = globalThis.fetch;
    globalThis.fetch = maakFetchMock([{ pad: '/kyb/voorwaarden', body: VOORWAARDEN }]);
  });
  afterEach(() => { globalThis.fetch = origineleFetch; });

  test('"Aanvraag indienen" is disabled tot de vier verklaringen aan staan', async () => {
    renderMetRouter(<StapToestemming aanvraag={oefenAanvraag({ stappenVoltooid: [1, 2, 3, 4, 5, 6] })} onIndienen={vi.fn()} onWijzig={() => {}} onTerug={() => {}} />);
    const knop = screen.getByRole('button', { name: 'Aanvraag indienen' });
    expect(knop).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/juist en volledig/));
    fireEvent.click(screen.getByLabelText(/bevoegd ben/));
    fireEvent.click(screen.getByLabelText(/acceptatiecriteria/));
    expect(knop).toBeDisabled();
    await waitFor(() => expect(screen.getByLabelText(/versie 2026-09/)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/versie 2026-09/));
    expect(knop).toBeEnabled();
  });

  test('marketing staat standaard uit, is niet vereist en gaat als productupdatesOptIn:false mee', async () => {
    const onIndienen = vi.fn().mockResolvedValue({});
    renderMetRouter(<StapToestemming aanvraag={oefenAanvraag({ stappenVoltooid: [1, 2, 3, 4, 5, 6] })} onIndienen={onIndienen} onWijzig={() => {}} onTerug={() => {}} />);
    const schakelaar = screen.getByRole('switch');
    expect(schakelaar).not.toBeChecked();
    await waitFor(() => expect(screen.getByLabelText(/versie 2026-09/)).toBeInTheDocument());
    vinkAlles();
    fireEvent.click(screen.getByRole('button', { name: 'Aanvraag indienen' }));
    await waitFor(() => expect(onIndienen).toHaveBeenCalledTimes(1));
    expect(onIndienen).toHaveBeenCalledWith({
      verklaringJuistVolledig: true,
      verklaringBevoegd: true,
      acceptatiecriteriaAkkoord: true,
      voorwaardenAkkoord: true,
      voorwaardenVersie: '2026-09',
      privacyVersie: '2026-09',
      productupdatesOptIn: false,
    });
  });

  test('medebestuurders-vinkje is extra vereist bij structuur meerdere_bestuurders', async () => {
    const onIndienen = vi.fn().mockResolvedValue({});
    renderMetRouter(<StapToestemming aanvraag={oefenAanvraag({ bedrijf: { bedrijfsnaam: 'Oefen Holding B.V.', kvkNummer: '00000004', structuur: ['meerdere_bestuurders'] } })} onIndienen={onIndienen} onWijzig={() => {}} onTerug={() => {}} />);
    await waitFor(() => expect(screen.getByLabelText(/versie 2026-09/)).toBeInTheDocument());
    vinkAlles();
    const knop = screen.getByRole('button', { name: 'Aanvraag indienen' });
    expect(knop).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/medebestuurders/));
    expect(knop).toBeEnabled();
    fireEvent.click(knop);
    await waitFor(() => expect(onIndienen).toHaveBeenCalled());
    expect(onIndienen.mock.calls[0][0].medebestuurdersAkkoord).toBe(true);
  });

  test('KYB_NIET_COMPLEET toont de ontbrekende stappen en documenten als links', async () => {
    const fout = new Error('Je aanvraag is nog niet compleet.');
    fout.status = 400;
    fout.errorCode = 'KYB_NIET_COMPLEET';
    fout.data = { errorCode: 'KYB_NIET_COMPLEET', ontbrekendeStappen: [6], ontbrekendeVelden: { 6: ['jaaromzet'] }, ontbrekendeDocumenten: ['kvk_uittreksel'] };
    const onIndienen = vi.fn().mockRejectedValue(fout);
    const onWijzig = vi.fn();
    renderMetRouter(<StapToestemming aanvraag={oefenAanvraag()} onIndienen={onIndienen} onWijzig={onWijzig} onTerug={() => {}} />);
    await waitFor(() => expect(screen.getByLabelText(/versie 2026-09/)).toBeInTheDocument());
    vinkAlles();
    fireEvent.click(screen.getByRole('button', { name: 'Aanvraag indienen' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Nog niet alles is ingevuld:'));
    fireEvent.click(screen.getByRole('button', { name: 'Naar stap 6' }));
    expect(onWijzig).toHaveBeenCalledWith(6);
    fireEvent.click(screen.getByRole('button', { name: 'Document ontbreekt: KvK-uittreksel' }));
    expect(onWijzig).toHaveBeenLastCalledWith(1);
  });
});
