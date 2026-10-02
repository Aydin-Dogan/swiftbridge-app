/**
 * KycDossiers.test.jsx — Het particuliere dossierscherm.
 *
 * De gegevens hieronder zijn de echte vorm van wat GET /admin/kyc/wachtrij en
 * GET /admin/kyc/dossier/:id teruggeven, met de inhoud van de drie aanvragen die
 * op 28 september 2026 werkelijk in de wachtrij stonden.
 *
 * Wat hier bewezen moet worden is niet dat er een tabel verschijnt, maar dat het
 * scherm de gebruiker vertelt WAAROM hij nog niet kan besluiten. Dat was precies
 * wat ontbrak: de dossiers waren zichtbaar, maar dat ze onbeoordeelbaar waren
 * niet.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaalProvider } from '../../../i18n';
import { forceerNederlands } from '../../kyb/kybTestHulp';
import KycDossiers from './KycDossiers';
import { apiFetch } from '../../../services/api';

vi.mock('../../../services/api', () => ({
  API_URL: 'http://api.test',
  apiFetch: vi.fn(),
  parseError: (e) => e?.message || 'fout',
}));

const WACHTRIJ = {
  dossiers: [
    {
      id: 'k1', userId: 'u1', type: 'particulier', status: 'in_behandeling',
      documentType: 'rijbewijs', bron: 'idin', ingediendOp: '2026-05-13 14:01:10',
      dagenWachtend: 138, buitenTermijn: true,
      risicoKlasse: 'hoog', risicoScore: 70,
      redenBijMens: 'dossier is niet compleet',
      beoordeelbaar: false, blokkades: 5, aanbevolenVervolg: 'intake_uitbreiden',
    },
    {
      id: 'k2', userId: 'u2', type: 'particulier', status: 'in_behandeling',
      documentType: 'paspoort_eu', bron: 'upload_telefoon', ingediendOp: '2026-09-18 21:47:53',
      dagenWachtend: 10, buitenTermijn: true,
      risicoKlasse: 'midden', risicoScore: 30,
      redenBijMens: 'dossier is niet compleet',
      beoordeelbaar: false, blokkades: 4, aanbevolenVervolg: 'intake_uitbreiden',
    },
  ],
  tellers: { open: 2, buitenTermijn: 2, nietBeoordeelbaar: 2, wachtOpTweede: 0, hoogRisico: 1 },
};

const DOSSIER = {
  id: 'k1', userId: 'u1', type: 'particulier', status: 'in_behandeling',
  checklist: {},
  magBeoordelen: { mag: true },
  ingediendOp: '2026-05-13 14:01:10', dagenWachtend: 138, buitenTermijn: true,
  risico: {
    klasse: 'hoog', score: 70,
    factoren: [
      { code: 'sanctie_niet_gescreend', punten: 15, toelichting: 'Sanctiescreening kon niet worden uitgevoerd' },
      { code: 'identiteit_niet_vastgesteld', punten: 40, toelichting: 'Identiteit is nog niet geverifieerd' },
      { code: 'identiteit_idin', punten: -10, toelichting: 'Geverifieerd via iDIN: de bank heeft de klant al geidentificeerd' },
    ],
    ondergrenzen: [{ code: 'sanctie_niet_gescreend', minimum: 'midden' }],
    hertoetsingOverMaanden: 12, tweedeBeoordelaarNodig: true,
  },
  besluit: {
    beoordeelbaar: false,
    toelichting: 'Dit dossier kan niet worden beoordeeld omdat de app deze gegevens nooit heeft uitgevraagd.',
    ontbreekt: [
      { code: 'identiteit_vastgesteld', wat: 'De identiteit is met niets vastgesteld: geen geslaagde iDIN en geen foto van een identiteitsbewijs.', blokkerend: true, actie: 'informatie_opvragen' },
      { code: 'sanctiescreening', wat: 'Er is niet gescreend op sanctielijsten. Dat is een wettelijke verplichting zonder drempel.', blokkerend: true, actie: 'screening_uitvoeren' },
      { code: 'doel_gebruik', wat: 'De vragen over doel en gebruik zijn niet gesteld: waarvoor, naar welke landen, welk bedrag per maand, en wat de bron van het geld is.', blokkerend: true, actie: 'intake_uitbreiden' },
      { code: 'voorwaarden_vastgelegd', wat: 'Er is niet vastgelegd welke versie van de voorwaarden en de privacyverklaring de klant heeft geaccepteerd.', blokkerend: false, actie: 'informatie_opvragen' },
    ],
    aanbevolenVervolg: 'intake_uitbreiden',
    checklist: ['identiteit_geverifieerd', 'document_geldig', 'gelijkenis_gecontroleerd', 'sancties_gecontroleerd', 'pep_beoordeeld', 'doel_gebruik_begrepen'],
    redenCodes: ['identiteit_niet_verifieerbaar', 'sanctie', 'overig'],
  },
  vastlegging: {
    identiteit: {
      bron: 'idin', idinWerkelijkGeslaagd: false, idinStatus: null, idinBank: null,
      documentType: 'rijbewijs', nationaliteit: 'NL', beeldenBeschikbaar: [],
    },
    akkoord: { voorwaardenVersie: null, geaccepteerdOp: null, privacyVersie: null },
    account: { emailGeverifieerd: true, tweefactorAan: false, aangemeldOp: '2026-05-13 13:54:48', heeftAdres: false, land: 'NL' },
    screening: null,
  },
  gedrag: {
    aantalTransacties: 0, bestemmingslanden: [], opgegevenVerwachting: null, vergelijkingMogelijk: false,
    toelichting: 'De klant is nooit gevraagd wat hij van plan was, dus zijn gedrag is nergens tegen te toetsen.',
  },
};

/** Het dossier dat de nagebootste server teruggeeft; per test te overschrijven. */
let dossierAntwoord = DOSSIER;

const toon = (overschrijf = {}) => {
  dossierAntwoord = { ...DOSSIER, ...overschrijf };
  return render(<TaalProvider><KycDossiers /></TaalProvider>);
};

beforeEach(() => {
  // Zonder dit draait de testomgeving in het Engels en heet de sluitknop
  // "Close": de generieke sleutels zijn wel vertaald, de kyc_admin_*-teksten nog niet.
  localStorage.clear();
  forceerNederlands();
  dossierAntwoord = DOSSIER;
  apiFetch.mockReset();
  apiFetch.mockImplementation(async (pad) => {
    if (pad === '/admin/kyc/wachtrij') return WACHTRIJ;
    if (pad.includes('/checklist')) return { checklist: {} };
    if (pad.includes('/besluit')) return { status: 'wacht_op_tweede', definitief: false };
    if (pad.startsWith('/admin/kyc/dossier/')) return dossierAntwoord;
    throw new Error(`onverwacht pad: ${pad}`);
  });
});

describe('de wachtrij', () => {
  test('toont de tellers, met de alarmcijfers zichtbaar', async () => {
    toon();
    await screen.findByText('Buiten de termijn');
    expect(screen.getByText('Niet beoordeelbaar')).toBeInTheDocument();
    expect(screen.getByText('Hoog risico')).toBeInTheDocument();
  });

  test('toont per dossier de risicoklasse en de wachttijd', async () => {
    toon();
    await screen.findByText('Hoog');
    expect(screen.getByText('Midden')).toBeInTheDocument();
    expect(screen.getByText(/138 dagen/)).toBeInTheDocument();
  });

  test('zegt bij elk onbeoordeelbaar dossier hoeveel punten er eerst moeten worden opgelost', async () => {
    toon();
    await screen.findByText(/5 punten moeten eerst worden opgelost/);
    expect(screen.getByText(/4 punten moeten eerst worden opgelost/)).toBeInTheDocument();
  });

  test('meldt netjes dat de wachtrij leeg is in plaats van een lege tabel te tonen', async () => {
    apiFetch.mockImplementation(async () => ({ dossiers: [], tellers: { open: 0, buitenTermijn: 0, nietBeoordeelbaar: 0, wachtOpTweede: 0, hoogRisico: 0 } }));
    toon();
    await screen.findByText(/geen particuliere aanvragen/i);
  });

  test('toont een fout in plaats van een lege lijst als de server niet antwoordt', async () => {
    apiFetch.mockImplementation(async () => { throw new Error('Serverfout'); });
    toon();
    await screen.findByText('Serverfout');
  });
});

describe('het dossier toont de vier vragen', () => {
  async function openDossier() {
    toon();
    const knoppen = await screen.findAllByRole('button', { name: /bekijken/i });
    fireEvent.click(knoppen[0]);
    await screen.findByText(/Wat is het risico van deze klant/);
  }

  test('alle vier de vragen staan er, in volgorde', async () => {
    await openDossier();
    expect(screen.getByText(/Wat is het risico van deze klant/)).toBeInTheDocument();
    expect(screen.getByText(/Accepteer ik hem, en waarom/)).toBeInTheDocument();
    expect(screen.getByText(/Waar leg ik dat vast/)).toBeInTheDocument();
    expect(screen.getByText(/Klopt zijn gedrag later nog met zijn verhaal/)).toBeInTheDocument();
  });

  test('vraag 1 laat zien waarom de klasse zo uitvalt, inclusief de aftrek van iDIN', async () => {
    await openDossier();
    expect(screen.getByText('Identiteit is nog niet geverifieerd')).toBeInTheDocument();
    expect(screen.getByText('+40')).toBeInTheDocument();
    // Een negatieve factor moet ook zichtbaar zijn, anders lijkt de score willekeurig.
    expect(screen.getByText('-10')).toBeInTheDocument();
  });

  test('vraag 1 waarschuwt dat het dossier niet op laag kan uitkomen', async () => {
    await openDossier();
    expect(screen.getByText(/kan niet op laag risico uitkomen/i)).toBeInTheDocument();
  });

  test('vraag 2 zet de blokkades apart van de aandachtspunten', async () => {
    await openDossier();
    expect(screen.getByText(/Dit moet eerst opgelost worden/i)).toBeInTheDocument();
    expect(screen.getByText(/houden het besluit niet op/i)).toBeInTheDocument();
    // De blokkade zelf, met de actie die de medewerker moet nemen.
    expect(screen.getByText(/niet gescreend op sanctielijsten/i)).toBeInTheDocument();
    expect(screen.getByText('Controle zelf uitvoeren')).toBeInTheDocument();
    expect(screen.getByText('Vraag ontbreekt in de aanvraag')).toBeInTheDocument();
  });

  test('vraag 2 zegt bovenaan wat er nu moet gebeuren', async () => {
    await openDossier();
    expect(screen.getByText('De aanvraag mist vragen die nooit zijn gesteld')).toBeInTheDocument();
  });

  test('VRAAG 3 VERZWIJGT NIET DAT IDIN NOOIT IS GESLAAGD', async () => {
    // Dit is de kern van het oudste dossier: de bron staat op iDIN, maar er is
    // nooit een verificatie voltooid. Zou het scherm alleen "iDIN" tonen, dan
    // zou een beoordelaar denken dat de identiteit vaststaat.
    await openDossier();
    expect(screen.getByText('iDIN werkelijk geslaagd')).toBeInTheDocument();
    const rij = screen.getByText('iDIN werkelijk geslaagd').closest('div');
    expect(rij.textContent).toMatch(/Nee/);
  });

  test('vraag 3 waarschuwt dat er nooit is gescreend', async () => {
    await openDossier();
    expect(screen.getByText(/nooit gescreend op sanctielijsten/i)).toBeInTheDocument();
  });

  test('vraag 3 markeert een ontbrekend adres en ontbrekende voorwaarden', async () => {
    await openDossier();
    expect(screen.getByText('Woonadres bekend')).toBeInTheDocument();
    expect(screen.getByText('niet vastgelegd')).toBeInTheDocument();
  });

  test('vraag 4 zegt dat vergelijken niet kan omdat het nooit is gevraagd', async () => {
    await openDossier();
    expect(screen.getByText('nooit gevraagd')).toBeInTheDocument();
    expect(screen.getByText(/nergens tegen te toetsen/i)).toBeInTheDocument();
  });

  test('het paneel is te sluiten', async () => {
    await openDossier();
    fireEvent.click(screen.getByRole('button', { name: /sluiten/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Wat is het risico van deze klant/)).not.toBeInTheDocument();
    });
  });
});

describe('het scherm neemt besluiten', () => {
  // Deze beschrijving stond tot 2-10-2026 op "neemt GEEN besluiten" en legde de
  // toenmalige beperking vast: de checklist was niet aan te vinken en er waren
  // geen knoppen, omdat het vierogenprincipe nog niet op de database was
  // aangesloten. Dat is nu wel zo, dus de test legt het nieuwe gedrag vast.

  test('de checklist is aan te vinken en wordt naar de server gestuurd', async () => {
    toon();
    fireEvent.click((await screen.findAllByRole('button', { name: /bekijken/i }))[0]);
    await screen.findByText(/Wat is het risico van deze klant/);

    // Per punt drie antwoorden: ja, nee, niet van toepassing. Bewust geen enkel
    // vinkje, want "niet van toepassing" is iets anders dan "niet afgevinkt".
    const jaKnoppen = screen.getAllByRole('button', { name: /^ja$/i });
    expect(jaKnoppen.length).toBeGreaterThan(0);

    apiFetch.mockClear();
    fireEvent.click(jaKnoppen[0]);
    await waitFor(() => {
      const aanroep = apiFetch.mock.calls.find(([pad]) => String(pad).includes('/checklist'));
      expect(aanroep).toBeDefined();
      expect(aanroep[1].method).toBe('PUT');
    });
  });

  test('de besluitknoppen staan er, en zijn uit als deze medewerker niet mag', async () => {
    // magBeoordelen komt van de server. Staat die op false, dan heeft deze
    // medewerker de eerste beoordeling zelf gedaan en mag hij zijn eigen besluit
    // niet bevestigen. De knop uitzetten is alleen een vriendelijkheid; de
    // echte blokkade zit in de API.
    toon({ magBeoordelen: { mag: false, reden: 'Een tweede beoordeling moet door een andere medewerker gebeuren.' } });
    fireEvent.click((await screen.findAllByRole('button', { name: /bekijken/i }))[0]);
    await screen.findByText(/Wat is het risico van deze klant/);

    expect(screen.getByRole('button', { name: /goedkeuren|bevestigen/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^afwijzen$/i })).toBeDisabled();
    // Informatie opvragen is geen afsluitend besluit en mag altijd.
    expect(screen.getByRole('button', { name: /informatie opvragen/i })).not.toBeDisabled();
  });

  test('de oude uitleg dat de knoppen nog niet werken is weg', async () => {
    toon();
    fireEvent.click((await screen.findAllByRole('button', { name: /bekijken/i }))[0]);
    await screen.findByText(/Wat is het risico van deze klant/);
    expect(screen.queryByText(/worden actief zodra het vierogenprincipe/i)).not.toBeInTheDocument();
  });
});
