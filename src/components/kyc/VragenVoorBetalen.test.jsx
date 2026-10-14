/**
 * VragenVoorBetalen.test.jsx — de vragen over doel en gebruik vóór de eerste
 * betaling (voorstel aanmeldroute stap 6; ronde 2, 14-10-2026).
 *
 * AANLEIDING
 * De KYC-poort van de API keurt niemand goed zonder deze antwoorden, en geen
 * enkel scherm vroeg erom. Het nieuwe scherm verschijnt alleen als de
 * antwoorden ontbreken; wie al antwoordde, merkt er niets van. Daarna gaat de
 * klant meteen verder met wat hij deed (betalen, of zijn identificatie).
 * Alle netwerkverkeer is gemockt; geen echte persoonsgegevens.
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderMetRouter, forceerNederlands, maakFetchMock } from '../kyb/kybTestHulp';
import VragenVoorBetalen from './VragenVoorBetalen';
import { vergeetBeantwoord } from '../../services/kycAntwoorden';

const KLANT = 'oefen-klant-1';

function Betaalscherm() {
  return <div>Stand-in betaalflow</div>;
}

function verzoeken(methode) {
  return globalThis.fetch.mock.calls.filter(([u, o]) => String(u).includes('/kyc/antwoorden')
    && String(o?.method || 'GET').toUpperCase() === methode);
}

describe('VragenVoorBetalen', () => {
  let origineleFetch;
  beforeEach(() => {
    forceerNederlands();
    vergeetBeantwoord();
    origineleFetch = globalThis.fetch;
  });
  afterEach(() => { globalThis.fetch = origineleFetch; });

  function toon(routes, props = {}) {
    globalThis.fetch = maakFetchMock(routes);
    return renderMetRouter(
      <VragenVoorBetalen gebruikerId={KLANT} {...props}>
        <Betaalscherm />
      </VragenVoorBetalen>
    );
  }

  /** Beantwoordt alle vijf de vragen zoals een klant dat doet. */
  function beantwoordAlles({ pep = 'Nee' } = {}) {
    fireEvent.click(screen.getByRole('radio', { name: 'Familie ondersteunen' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Tot € 500' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Mijn salaris' }));
    const pepGroep = screen.getByRole('radiogroup', { name: /politiek prominent/i });
    fireEvent.click(within(pepGroep).getByRole('radio', { name: pep }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Turkije' }));
  }

  test('ANTWOORDEN ONTBREKEN: de vragen verschijnen, de betaalflow nog niet', async () => {
    toon([{ pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } }]);

    expect(await screen.findByRole('heading', { name: 'Vijf korte vragen' })).toBeInTheDocument();
    expect(screen.getByText(/wet tegen witwassen/i)).toBeInTheDocument();
    expect(screen.queryByText('Stand-in betaalflow')).not.toBeInTheDocument();
  });

  test('na het beantwoorden gaat de klant meteen verder, en de server krijgt de codes', async () => {
    toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } },
      { methode: 'PUT', pad: '/kyc/antwoorden', body: { beantwoord: true, versie: 1, opnieuwInBeoordeling: false } },
    ]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });

    beantwoordAlles();
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));

    expect(await screen.findByText('Stand-in betaalflow')).toBeInTheDocument();
    const [put] = verzoeken('PUT');
    expect(JSON.parse(put[1].body)).toEqual({
      doel: 'familie', verwachtMaandVolume: 'tot_500', bronInkomen: 'loon', pep: false, landen: ['TR'],
    });
  });

  test('ANTWOORDEN AL GEGEVEN: geen vragen, de betaalflow verschijnt meteen', async () => {
    toon([{
      pad: '/kyc/antwoorden',
      body: {
        beantwoord: true,
        antwoorden: { doel: 'familie', verwachtMaandVolume: 'tot_500', bronInkomen: 'loon', pep: false, landen: ['TR'] },
      },
    }]);

    expect(await screen.findByText('Stand-in betaalflow')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vijf korte vragen' })).not.toBeInTheDocument();
  });

  test('wie in deze sessie al antwoordde, wacht de volgende keer niet op de server', async () => {
    const eerste = toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } },
      { methode: 'PUT', pad: '/kyc/antwoorden', body: { beantwoord: true, versie: 1, opnieuwInBeoordeling: false } },
    ]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });
    beantwoordAlles();
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));
    await screen.findByText('Stand-in betaalflow');
    eerste.unmount();

    toon([]); // elke aanroep zou 404 geven
    expect(screen.getByText('Stand-in betaalflow')).toBeInTheDocument();
    expect(verzoeken('GET')).toHaveLength(0);
  });

  test('een andere klant op hetzelfde toestel krijgt de vragen wel', async () => {
    toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: true, antwoorden: null } },
    ]).unmount();

    toon([{ pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } }], { gebruikerId: 'oefen-klant-2' });
    expect(await screen.findByRole('heading', { name: 'Vijf korte vragen' })).toBeInTheDocument();
  });

  test('een open vraag: melding bij die vraag, en niets naar de server', async () => {
    toon([{ pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } }]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });

    fireEvent.click(screen.getByRole('radio', { name: 'Familie ondersteunen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));

    expect(screen.getAllByText('Kies een antwoord.').length).toBeGreaterThanOrEqual(1);
    expect(verzoeken('PUT')).toHaveLength(0);
    expect(screen.queryByText('Stand-in betaalflow')).not.toBeInTheDocument();
  });

  test('PEP ja gaat als ja naar de server', async () => {
    toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } },
      { methode: 'PUT', pad: '/kyc/antwoorden', body: { beantwoord: true, versie: 1, opnieuwInBeoordeling: false } },
    ]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });

    beantwoordAlles({ pep: 'Ja' });
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));

    await waitFor(() => expect(verzoeken('PUT')).toHaveLength(1));
    expect(JSON.parse(verzoeken('PUT')[0][1].body).pep).toBe(true);
  });

  test('een ander land kiezen kan ook, en weer weghalen', async () => {
    toon([{ pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } }]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });

    fireEvent.change(screen.getByRole('combobox', { name: 'Ander land' }), { target: { value: 'DE' } });
    expect(screen.getByRole('button', { name: 'Duitsland weghalen' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Duitsland weghalen' }));
    expect(screen.queryByRole('button', { name: 'Duitsland weghalen' })).not.toBeInTheDocument();
  });

  test('eerdere, onvolledige antwoorden staan al ingevuld', async () => {
    toon([{
      pad: '/kyc/antwoorden',
      body: { beantwoord: false, antwoorden: { doel: 'onderwijs', verwachtMaandVolume: null, bronInkomen: null, pep: null, landen: ['TR'] } },
    }]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });

    expect(screen.getByRole('radio', { name: 'Studie of school' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Turkije' })).toHaveAttribute('aria-checked', 'true');
  });

  test('gaat de klant terug in beoordeling, dan ziet hij dat en nog geen betaalflow', async () => {
    toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } },
      { methode: 'PUT', pad: '/kyc/antwoorden', body: { beantwoord: true, versie: 2, opnieuwInBeoordeling: true } },
    ]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });

    beantwoordAlles({ pep: 'Ja' });
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));

    expect(await screen.findByRole('heading', { name: 'Bedankt voor je antwoorden' })).toBeInTheDocument();
    expect(screen.queryByText('Stand-in betaalflow')).not.toBeInTheDocument();
  });

  // Review ronde 2: het profiel in de app (kycStatus) blijft tot een nieuwe
  // sessie op 'goedgekeurd' staan. Bij de volgende tik op Overmaken zag de klant
  // dan weer de hele betaalflow, en pas aan het eind "KYC verificatie is
  // vereist" van de server.
  test('terug in beoordeling: ook bij de volgende keer Overmaken in deze sessie geen betaalflow', async () => {
    const eerste = toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } },
      { methode: 'PUT', pad: '/kyc/antwoorden', body: { beantwoord: true, versie: 2, opnieuwInBeoordeling: true } },
    ]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });
    beantwoordAlles({ pep: 'Ja' });
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));
    await screen.findByRole('heading', { name: 'Bedankt voor je antwoorden' });
    eerste.unmount();

    toon([{ pad: '/kyc/antwoorden', body: { beantwoord: true, antwoorden: null } }]);

    expect(screen.getByRole('heading', { name: 'Bedankt voor je antwoorden' })).toBeInTheDocument();
    expect(screen.queryByText('Stand-in betaalflow')).not.toBeInTheDocument();
  });

  // Besluit Aydin 14-10-2026: over een politiek prominente klant beslist later de
  // EMI-partner. De app belooft dan niet "zodra je weer geld kunt overmaken",
  // maar zegt eerlijk dat het apart en langer gaat.
  test('PEP ja (nieuwe klant): eerlijke uitleg, en daarna kan hij verder met zijn aanvraag', async () => {
    toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } },
      { methode: 'PUT', pad: '/kyc/antwoorden', body: { beantwoord: true, versie: 1, opnieuwInBeoordeling: false } },
    ]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });

    beantwoordAlles({ pep: 'Ja' });
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));

    expect(await screen.findByText(/beoordelen we je aanvraag apart/)).toBeInTheDocument();
    expect(screen.getByText(/duurt langer dan normaal/)).toBeInTheDocument();
    // Review 14-10-2026: zonder identificatie is er niets te beoordelen en komt
    // er ook geen mail. De klant moet dus weten dat die stap eerst komt.
    expect(screen.getByText(/Heb je je identificatie nog niet afgerond\? Doe dat dan eerst/)).toBeInTheDocument();
    expect(screen.queryByText(/zodra je weer geld kunt overmaken/)).not.toBeInTheDocument();
    expect(screen.queryByText('Stand-in betaalflow')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));
    expect(await screen.findByText('Stand-in betaalflow')).toBeInTheDocument();
  });

  test('PEP ja (al goedgekeurd, terug in beoordeling): geen belofte, ook niet bij de volgende keer', async () => {
    const eerste = toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } },
      { methode: 'PUT', pad: '/kyc/antwoorden', body: { beantwoord: true, versie: 2, opnieuwInBeoordeling: true } },
    ]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });
    beantwoordAlles({ pep: 'Ja' });
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));

    expect(await screen.findByRole('heading', { name: 'Bedankt voor je antwoorden' })).toBeInTheDocument();
    expect(screen.getByText(/beoordelen we je aanvraag apart/)).toBeInTheDocument();
    expect(screen.queryByText(/zodra je weer geld kunt overmaken/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verder' })).not.toBeInTheDocument();
    eerste.unmount();

    toon([{ pad: '/kyc/antwoorden', body: { beantwoord: true, antwoorden: null } }]);
    expect(screen.getByText(/beoordelen we je aanvraag apart/)).toBeInTheDocument();
    expect(screen.queryByText('Stand-in betaalflow')).not.toBeInTheDocument();
  });

  // Review 14-10-2026: kwam het antwoord van de server niet aan (netwerk weg) en
  // tikte de klant opnieuw, dan zei de server "niets veranderd" en kreeg een
  // goedgekeurde PEP-klant een Verder-knop naar de betaalflow.
  test('goedgekeurde klant zegt PEP ja, server meldt geen terugzetting: toch geen betaalflow', async () => {
    const eerste = toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } },
      { methode: 'PUT', pad: '/kyc/antwoorden', body: { beantwoord: true, versie: 2, opnieuwInBeoordeling: false } },
    ], { goedgekeurd: true });
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });
    beantwoordAlles({ pep: 'Ja' });
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));

    expect(await screen.findByText(/beoordelen we je aanvraag apart/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verder' })).not.toBeInTheDocument();
    expect(screen.queryByText(/identificatie nog niet afgerond/)).not.toBeInTheDocument();
    expect(screen.queryByText('Stand-in betaalflow')).not.toBeInTheDocument();
    eerste.unmount();

    toon([{ pad: '/kyc/antwoorden', body: { beantwoord: true, antwoorden: null } }], { goedgekeurd: true });
    expect(screen.queryByText('Stand-in betaalflow')).not.toBeInTheDocument();
  });

  test('PEP nee en terug in beoordeling: de gewone tekst', async () => {
    toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } },
      { methode: 'PUT', pad: '/kyc/antwoorden', body: { beantwoord: true, versie: 2, opnieuwInBeoordeling: true } },
    ]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });
    beantwoordAlles();
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));

    expect(await screen.findByRole('heading', { name: 'Bedankt voor je antwoorden' })).toBeInTheDocument();
    expect(screen.queryByText(/beoordelen we je aanvraag apart/)).not.toBeInTheDocument();
  });

  test('opslaan mislukt: de klant ziet een melding en blijft op het scherm', async () => {
    toon([
      { pad: '/kyc/antwoorden', body: { beantwoord: false, antwoorden: null } },
      { methode: 'PUT', pad: '/kyc/antwoorden', status: 500, body: { errorCode: 'SERVER_ERROR', error: 'Server fout' } },
    ]);
    await screen.findByRole('heading', { name: 'Vijf korte vragen' });

    beantwoordAlles();
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan en verder' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Stand-in betaalflow')).not.toBeInTheDocument();
  });

  test('kan de app de antwoorden niet ophalen, dan blokkeert het scherm niets (de server beslist)', async () => {
    toon([{ pad: '/kyc/antwoorden', status: 500, body: { errorCode: 'SERVER_ERROR' } }]);
    expect(await screen.findByText('Stand-in betaalflow')).toBeInTheDocument();
  });

  test('overslaan: meteen door, zonder iets op te halen', () => {
    toon([], { overslaan: true });
    expect(screen.getByText('Stand-in betaalflow')).toBeInTheDocument();
    expect(verzoeken('GET')).toHaveLength(0);
  });
});
