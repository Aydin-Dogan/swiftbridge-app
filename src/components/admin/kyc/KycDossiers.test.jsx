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
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

  test('de besluitknoppen staan er bij een eerste beoordeling', async () => {
    toon();
    fireEvent.click((await screen.findAllByRole('button', { name: /bekijken/i }))[0]);
    await screen.findByText(/Wat is het risico van deze klant/);

    expect(screen.getByRole('button', { name: /^goedkeuren$/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /^afwijzen$/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /informatie opvragen/i })).not.toBeDisabled();
  });

  test('de oude uitleg dat de knoppen nog niet werken is weg', async () => {
    toon();
    fireEvent.click((await screen.findAllByRole('button', { name: /bekijken/i }))[0]);
    await screen.findByText(/Wat is het risico van deze klant/);
    expect(screen.queryByText(/worden actief zodra het vierogenprincipe/i)).not.toBeInTheDocument();
  });
});

/**
 * De antwoorden van de klant over doel en gebruik (14-10-2026). Zonder die
 * antwoorden keurt de KYC-poort niet goed; de beoordelaar moet ze kunnen lezen,
 * en na een wijziging zien wat er veranderde.
 */
describe('de antwoorden van de klant over doel en gebruik', () => {
  const ANTWOORDEN = {
    doel: 'onderwijs', verwachtMaandVolume: '500_2000', bronInkomen: 'uitkering', pep: true, landen: ['TR', 'DE'],
    bron: 'klant', versie: 2, opgeslagenOp: '2026-10-14 09:12:00',
    vorige: { doel: 'familie', verwachtMaandVolume: '500_2000', bronInkomen: 'uitkering', pep: false, landen: ['TR'] },
    gewijzigd: ['doel', 'pep', 'landen'],
  };

  async function openMet(extra) {
    toon(extra);
    fireEvent.click((await screen.findAllByRole('button', { name: /bekijken/i }))[0]);
    await screen.findByText(/Wat is het risico van deze klant/);
  }

  test('staan leesbaar in het dossier, met de PEP-verklaring opvallend', async () => {
    await openMet({ antwoorden: ANTWOORDEN, gedrag: { ...DOSSIER.gedrag, opgegevenVerwachting: '500_2000' } });
    const blok = screen.getByRole('group', { name: 'Wat de klant opgaf' });
    expect(within(blok).getByText('Studie of school')).toBeInTheDocument();
    expect(within(blok).getByText('€ 500 tot € 2.000')).toBeInTheDocument();
    expect(within(blok).getByText('Uitkering')).toBeInTheDocument();
    expect(within(blok).getByText('Ja')).toHaveClass('text-red-600');
    expect(within(blok).getByText('TR, DE')).toBeInTheDocument();
    expect(within(blok).getByText(/versie 2/)).toBeInTheDocument();
  });

  test('na een wijziging staat erbij wat de klant eerder opgaf', async () => {
    await openMet({ antwoorden: ANTWOORDEN });
    const blok = screen.getByRole('group', { name: 'Wat de klant opgaf' });
    expect(within(blok).getByText(/eerder: Familie ondersteunen/)).toBeInTheDocument();
    expect(within(blok).getByText(/eerder: Nee/)).toBeInTheDocument();
    expect(within(blok).getByText('eerder: TR')).toBeInTheDocument();
    // Wat niet veranderde, krijgt geen 'eerder'.
    expect(within(blok).queryByText(/eerder: Uitkering/)).not.toBeInTheDocument();
  });

  test('zonder antwoorden zegt het dossier dat ze nog niet zijn gegeven', async () => {
    await openMet({ antwoorden: null });
    expect(screen.getByText('nooit gevraagd')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Wat de klant opgaf' })).not.toBeInTheDocument();
  });
});

// ── Het beoordelaarsscherm (14-10-2026) ─────────────────────────────────────
// Open punten uit de review van de KYC-poort: de tweede beoordelaar zag niet
// wat de eerste besloot en "Bevestigen" stuurde altijd 'goedgekeurd';
// "Informatie opvragen" stuurde geen vraag mee (de API gaf 400); "Afwijzen"
// stuurde geen reden mee; een mogelijke treffer kon niet worden verworpen.

/** Het laatste besluit dat het scherm naar de server stuurde. */
function laatsteBesluit() {
  const aanroepen = apiFetch.mock.calls.filter(([pad]) => String(pad).includes('/besluit'));
  return aanroepen.length ? aanroepen[aanroepen.length - 1][1] : null;
}

async function openDossierMet(extra) {
  toon(extra);
  fireEvent.click((await screen.findAllByRole('button', { name: /bekijken/i }))[0]);
  await screen.findByText(/Wat is het risico van deze klant/);
}

const WACHT_OP_TWEEDE = {
  status: 'wacht_op_tweede',
  magBeoordelen: { mag: true },
  checklist: {
    identiteit_geverifieerd: 'akkoord', document_geldig: 'akkoord', gelijkenis_gecontroleerd: 'akkoord',
    sancties_gecontroleerd: 'akkoord', pep_beoordeeld: 'akkoord', doel_gebruik_begrepen: 'akkoord',
  },
  eersteBeoordeling: {
    besluit: 'afgewezen',
    redenCode: 'risico_te_hoog',
    op: '2026-10-14T09:30:00.000Z',
    beoordelaar: { naam: 'Fatma Eerste', rol: 'compliance_officer' },
  },
};

describe('punt a: de tweede beoordelaar ziet en bevestigt het besluit van de eerste', () => {
  test('hij ziet welk besluit de eerste nam, met reden, naam, rol en tijd', async () => {
    await openDossierMet(WACHT_OP_TWEEDE);
    const blok = screen.getByRole('group', { name: 'Besluit van de eerste beoordelaar' });
    expect(within(blok).getByText('Afwijzen')).toBeInTheDocument();
    expect(within(blok).getByText('Risico te hoog (algemene tekst)')).toBeInTheDocument();
    expect(within(blok).getByText(/Fatma Eerste/)).toBeInTheDocument();
    expect(within(blok).getByText(/Compliance officer/)).toBeInTheDocument();
    expect(within(blok).getByText(/14 okt\.? 2026/)).toBeInTheDocument();
  });

  test('"Bevestigen" stuurt het besluit van de eerste, met diens reden, en niet "goedgekeurd"', async () => {
    await openDossierMet(WACHT_OP_TWEEDE);
    // Een ander afsluitend besluit is er in deze stand niet.
    expect(screen.queryByRole('button', { name: /^goedkeuren$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^afwijzen$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen: Afwijzen' }));

    await waitFor(() => expect(laatsteBesluit()).not.toBeNull());
    expect(laatsteBesluit().body).toEqual({ besluit: 'afgewezen', redenCode: 'risico_te_hoog' });
  });

  test('een goedkeuring van de eerste bevestigt hij als goedkeuring', async () => {
    await openDossierMet({
      ...WACHT_OP_TWEEDE,
      eersteBeoordeling: { ...WACHT_OP_TWEEDE.eersteBeoordeling, besluit: 'goedgekeurd', redenCode: null },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen: Goedkeuren' }));
    await waitFor(() => expect(laatsteBesluit()).not.toBeNull());
    expect(laatsteBesluit().body).toMatchObject({ besluit: 'goedgekeurd' });
  });

  test('een ander besluit kiest hij alleen bewust, met een reden', async () => {
    await openDossierMet(WACHT_OP_TWEEDE);
    fireEvent.click(screen.getByRole('button', { name: 'Niet eens' }));

    const opslaan = screen.getByRole('button', { name: 'Vastleggen' });
    expect(opslaan).toBeDisabled();
    expect(laatsteBesluit()).toBeNull();

    fireEvent.change(screen.getByLabelText(/Waarom ben je het niet eens/), {
      target: { value: '  De selfie lijkt niet op de pasfoto.  ' },
    });
    expect(opslaan).not.toBeDisabled();
    fireEvent.click(opslaan);

    await waitFor(() => expect(laatsteBesluit()).not.toBeNull());
    expect(laatsteBesluit().body).toEqual({ besluit: 'in_behandeling', opmerking: 'De selfie lijkt niet op de pasfoto.' });
  });

  test('niet eens kan ook: informatie opvragen bij de klant', async () => {
    await openDossierMet(WACHT_OP_TWEEDE);
    fireEvent.click(screen.getByRole('button', { name: 'Niet eens' }));
    fireEvent.click(screen.getByLabelText('Informatie opvragen bij de klant'));
    fireEvent.change(screen.getByLabelText(/Wat heb je van de klant nodig/), {
      target: { value: 'Graag een recent adresbewijs.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Vastleggen' }));

    await waitFor(() => expect(laatsteBesluit()).not.toBeNull());
    expect(laatsteBesluit().body).toEqual({ besluit: 'info_nodig', opmerking: 'Graag een recent adresbewijs.' });
  });

  test('review: een interne notitie gaat niet als vraag naar de klant als hij daarna "informatie opvragen" kiest', async () => {
    // Het vak is eerst een interne notitie ("de klant ziet hem niet") en bij
    // informatie opvragen de vraag aan de klant. Bleef de tekst staan bij het
    // wisselen, dan ging de interne notitie met één klik naar de klant, in de
    // app en in de mail (Wwft art. 23).
    await openDossierMet(WACHT_OP_TWEEDE);
    fireEvent.click(screen.getByRole('button', { name: 'Niet eens' }));
    fireEvent.change(screen.getByLabelText(/Waarom ben je het niet eens/), {
      target: { value: 'Mogelijk een stroman; overleg met de MLRO.' },
    });
    fireEvent.click(screen.getByLabelText('Informatie opvragen bij de klant'));

    expect(screen.getByLabelText(/Wat heb je van de klant nodig/)).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Vastleggen' })).toBeDisabled();
    expect(laatsteBesluit()).toBeNull();
  });

  test('wie de eerste beoordeling zelf deed, kan niets bevestigen of terugzetten', async () => {
    await openDossierMet({
      ...WACHT_OP_TWEEDE,
      magBeoordelen: { mag: false, reden: 'Een tweede beoordeling moet door een andere medewerker gebeuren.' },
    });
    expect(screen.getByText(/moet door een andere medewerker gebeuren/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bevestigen: Afwijzen' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Niet eens' })).toBeDisabled();
  });

  test('is het eerste besluit niet terug te vinden, dan alleen terugzetten', async () => {
    await openDossierMet({ ...WACHT_OP_TWEEDE, eersteBeoordeling: null });
    expect(screen.getByText(/niet terug te vinden/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Bevestigen/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Terug in behandeling' })).not.toBeDisabled();
  });

  test('een oudere afwijzing zonder vastgelegde reden: de tweede kiest de reden', async () => {
    await openDossierMet({
      ...WACHT_OP_TWEEDE,
      eersteBeoordeling: { ...WACHT_OP_TWEEDE.eersteBeoordeling, redenCode: null },
    });
    const bevestig = screen.getByRole('button', { name: 'Bevestigen: Afwijzen' });
    expect(bevestig).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Reden van de afwijzing'), { target: { value: 'identiteit_niet_verifieerbaar' } });
    fireEvent.click(bevestig);
    await waitFor(() => expect(laatsteBesluit()).not.toBeNull());
    expect(laatsteBesluit().body).toEqual({ besluit: 'afgewezen', redenCode: 'identiteit_niet_verifieerbaar' });
  });

  test('de volgende beoordelaar ziet waarom een collega het dossier terugzette', async () => {
    await openDossierMet({ besluit: { ...DOSSIER.besluit, interneNotitie: 'Adres klopt niet met iDIN.' } });
    const blok = screen.getByRole('group', { name: 'Interne notitie bij het vorige besluit' });
    expect(within(blok).getByText('Adres klopt niet met iDIN.')).toBeInTheDocument();
  });
});

describe('punt b: informatie opvragen stuurt een vraag aan de klant mee', () => {
  test('eerst de vraag, dan pas versturen; de vraag gaat mee', async () => {
    await openDossierMet();
    fireEvent.click(screen.getByRole('button', { name: /informatie opvragen/i }));
    // Er is nog niets verstuurd: zonder vraag weigert de API, en de klant zou
    // een melding zonder vraag krijgen.
    expect(laatsteBesluit()).toBeNull();

    const versturen = screen.getByRole('button', { name: 'Vraag versturen' });
    expect(versturen).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Wat heb je van de klant nodig/), {
      target: { value: 'Graag een scherpere foto van de voorkant van uw paspoort.' },
    });
    fireEvent.click(versturen);

    await waitFor(() => expect(laatsteBesluit()).not.toBeNull());
    expect(laatsteBesluit().body).toEqual({
      besluit: 'info_nodig', opmerking: 'Graag een scherpere foto van de voorkant van uw paspoort.',
    });
  });

  test('annuleren stuurt niets', async () => {
    await openDossierMet();
    fireEvent.click(screen.getByRole('button', { name: /informatie opvragen/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuleren' }));
    expect(screen.queryByRole('button', { name: 'Vraag versturen' })).not.toBeInTheDocument();
    expect(laatsteBesluit()).toBeNull();
  });
});

describe('punt c: afwijzen met reden, en een mogelijke treffer bewust verwerpen', () => {
  test('afwijzen vraagt een reden en stuurt die mee', async () => {
    await openDossierMet();
    fireEvent.click(screen.getByRole('button', { name: /^afwijzen$/i }));
    const vastleggen = screen.getByRole('button', { name: 'Afwijzing vastleggen' });
    expect(vastleggen).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Reden van de afwijzing'), { target: { value: 'identiteit_niet_verifieerbaar' } });
    fireEvent.click(vastleggen);

    await waitFor(() => expect(laatsteBesluit()).not.toBeNull());
    expect(laatsteBesluit().body).toEqual({ besluit: 'afgewezen', redenCode: 'identiteit_niet_verifieerbaar' });
  });

  const MOGELIJKE_TREFFER = {
    op: '2026-10-14T09:00:00.000Z', uitgevoerd: true, hit: false, unavailable: false,
    mogelijkeTreffers: 1, hoogsteScore: 0.71, bron: 'eu', pep: { beoordeeld: false, treffer: false, bron: null },
  };

  test('bij een mogelijke treffer keurt hij pas goed als hij hem zelf verwierp', async () => {
    await openDossierMet({ vastlegging: { ...DOSSIER.vastlegging, screening: MOGELIJKE_TREFFER } });
    expect(screen.getByText(/Mogelijke treffer op de sanctielijst/)).toBeInTheDocument();
    expect(screen.getByText(/71%/)).toBeInTheDocument();

    const goedkeuren = screen.getByRole('button', { name: /^goedkeuren$/i });
    expect(goedkeuren).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/het is niet deze klant/));
    expect(goedkeuren).not.toBeDisabled();
    fireEvent.click(goedkeuren);

    await waitFor(() => expect(laatsteBesluit()).not.toBeNull());
    expect(laatsteBesluit().body).toEqual({ besluit: 'goedgekeurd', mogelijkeTrefferBeoordeeld: true });
  });

  test('ook de tweede beoordelaar verwerpt de mogelijke treffer zelf', async () => {
    await openDossierMet({
      ...WACHT_OP_TWEEDE,
      eersteBeoordeling: { ...WACHT_OP_TWEEDE.eersteBeoordeling, besluit: 'goedgekeurd', redenCode: null },
      vastlegging: { ...DOSSIER.vastlegging, screening: MOGELIJKE_TREFFER },
    });
    const bevestig = screen.getByRole('button', { name: 'Bevestigen: Goedkeuren' });
    expect(bevestig).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/het is niet deze klant/));
    fireEvent.click(bevestig);
    await waitFor(() => expect(laatsteBesluit()).not.toBeNull());
    expect(laatsteBesluit().body).toEqual({ besluit: 'goedgekeurd', mogelijkeTrefferBeoordeeld: true });
  });

  test('vraag 3 toont de uitslag van de laatste screening', async () => {
    await openDossierMet({
      vastlegging: { ...DOSSIER.vastlegging, screening: { ...MOGELIJKE_TREFFER, mogelijkeTreffers: 0, hoogsteScore: null } },
    });
    expect(screen.getByText(/Geen treffer op de sanctielijst/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/het is niet deze klant/)).not.toBeInTheDocument();
  });

  test('na een weigering door de poort haalt het scherm het dossier opnieuw op (verse screening)', async () => {
    await openDossierMet();
    apiFetch.mockImplementation(async (pad) => {
      if (pad.includes('/besluit')) {
        const e = new Error('Dit dossier kan (nog) niet worden goedgekeurd.');
        e.body = {
          errorCode: 'KYC_POORT_GEWEIGERD',
          error: 'Dit dossier kan (nog) niet worden goedgekeurd. De sanctiescreening geeft een mogelijke treffer.',
          redenen: [{ code: 'sanctie_mogelijke_treffer', wat: 'De sanctiescreening geeft een mogelijke treffer.' }],
        };
        throw e;
      }
      if (pad.startsWith('/admin/kyc/dossier/')) return dossierAntwoord;
      return WACHTRIJ;
    });
    const voor = apiFetch.mock.calls.filter(([pad]) => pad === '/admin/kyc/dossier/k1').length;

    fireEvent.click(screen.getByRole('button', { name: /^goedkeuren$/i }));

    await screen.findByText(/geeft een mogelijke treffer/);
    await waitFor(() => {
      expect(apiFetch.mock.calls.filter(([pad]) => pad === '/admin/kyc/dossier/k1').length).toBeGreaterThan(voor);
    });
  });

  test('ook met de echte foutvorm van apiFetch (data, niet body) haalt hij het dossier opnieuw op', async () => {
    // apiFetch zet het antwoord van de server op fout.data. Het scherm las
    // alleen fout.body; in productie gebeurde het opnieuw ophalen dus nooit.
    await openDossierMet();
    apiFetch.mockImplementation(async (pad) => {
      if (pad.includes('/besluit')) {
        const e = new Error('Dit dossier kan (nog) niet worden goedgekeurd.');
        e.status = 409;
        e.errorCode = 'KYC_POORT_GEWEIGERD';
        e.data = {
          errorCode: 'KYC_POORT_GEWEIGERD',
          error: 'Dit dossier kan (nog) niet worden goedgekeurd.',
          redenen: [{ code: 'sanctie_mogelijke_treffer', wat: 'De sanctiescreening geeft een mogelijke treffer.' }],
        };
        throw e;
      }
      if (pad.startsWith('/admin/kyc/dossier/')) return dossierAntwoord;
      return WACHTRIJ;
    });
    const voor = apiFetch.mock.calls.filter(([pad]) => pad === '/admin/kyc/dossier/k1').length;

    fireEvent.click(screen.getByRole('button', { name: /^goedkeuren$/i }));

    await screen.findByText(/kan \(nog\) niet worden goedgekeurd/);
    await waitFor(() => {
      expect(apiFetch.mock.calls.filter(([pad]) => pad === '/admin/kyc/dossier/k1').length).toBeGreaterThan(voor);
    });
  });
});

describe('onderdeel 7: het dossierscherm vervangt het oude KYC-reviewscherm', () => {
  // Sinds 14-10-2026 is de tab "KYC Review" weg (besluit Aydin). Dat was de
  // enige plek waar de foto's van een particulier identiteitsbewijs te zien
  // waren. Zonder die foto's kan niemand de identiteit beoordelen, dus staan ze
  // nu in het dossier zelf, bij vraag 3.
  let geopend;

  beforeEach(() => {
    geopend = { location: { href: '' }, closed: false, close: vi.fn() };
    vi.stubGlobal('open', vi.fn(() => geopend));
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true, status: 200,
      blob: async () => new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }),
    })));
    URL.createObjectURL = vi.fn(() => 'blob:http://app.test/abc');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  test('vraag 3: de foto\'s die er zijn, zijn vanuit het dossier te openen', async () => {
    await openDossierMet({
      vastlegging: {
        ...DOSSIER.vastlegging,
        identiteit: { ...DOSSIER.vastlegging.identiteit, bron: 'upload_telefoon', beeldenBeschikbaar: ['voorkant', 'selfie'] },
      },
    });

    expect(screen.getByRole('button', { name: 'Foto voorkant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Selfie met document' })).toBeInTheDocument();
    // Alleen wat er is: geen vak voor een achterkant die niet bestaat.
    expect(screen.queryByRole('button', { name: 'Foto achterkant' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Foto voorkant' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://api.test/admin/kyc/k1/document/voorkant', { credentials: 'include' }
    ));
    await waitFor(() => expect(geopend.location.href).toBe('blob:http://app.test/abc'));
  });

  test('vraag 3: zonder foto\'s staat er met zoveel woorden "geen", en wordt niets opgehaald', async () => {
    await openDossierMet();
    const rij = screen.getByText('Beschikbare foto’s').closest('div');
    expect(within(rij).getByText('geen')).toBeInTheDocument();
    expect(within(rij).queryByRole('button')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('een dossier is van buitenaf direct te openen (Open dossier bij Gebruikers)', async () => {
    dossierAntwoord = { ...DOSSIER, id: 'k9', status: 'goedgekeurd' };
    render(<TaalProvider><KycDossiers startDossier="k9" /></TaalProvider>);

    await screen.findByRole('dialog', { name: 'Particulier dossier' });
    expect(apiFetch).toHaveBeenCalledWith('/admin/kyc/dossier/k9');
  });
});
