/**
 * Tests KybDossier — dossier leesbaar (gedecrypte blokken), afwijkingen rood, identiteit beoordelen,
 * documenten via KybDocumentKnop, beoordeelpaneel bij open status.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaalProvider } from '../../../i18n';
import KybDossier from './KybDossier';
import { apiFetch } from '../../../services/api';

vi.mock('../../../services/api', () => ({
  API_URL: 'http://api.test',
  apiFetch: vi.fn(),
  parseError: (e) => e?.message || 'fout',
}));

const DOSSIER = {
  aanvraag: {
    id: 'a1', status: 'ingediend', versie: 1, ingediendCount: 1,
    ingediendOp: 1789000000000, verwachtUiterlijkOp: 1789500000000,
    bedrijf: {
      rechtsvorm: 'bv', structuur: ['enige_bestuurder', 'enige_eigenaar'], kvkNummer: '00000001',
      bedrijfsnaam: 'Oefen Handel BV', handelsnaam: 'Oefen Handel', website: null, geenWebsite: true,
      vestiging: { straat: 'Oefenstraat', huisnummer: '1', postcode: '1234 AB', plaats: 'Oefenstad', land: 'NL' },
      sbiCodes: [{ code: '46901', omschrijving: 'Niet-gespecialiseerde groothandel' }], sbiBevestigd: true, bron: 'kvk_mock',
      kvkProfiel: { kvkNummer: '00000001', naam: 'Oefen Handel B.V.', handelsnamen: ['Oefen Handel'], rechtsvormKvk: 'Besloten Vennootschap',
        vestiging: { straat: 'Oefenstraat', huisnummer: '1', postcode: '1234 AB', plaats: 'Oefenstad', land: 'NL' },
        sbiCodes: [{ code: '46901', omschrijving: 'Niet-gespecialiseerde groothandel', hoofdactiviteit: true }] },
    },
    ubo: [
      { id: 'u1', rol: 'ubo', voornamen: 'Test', achternaam: 'Aanvrager', geboortedatum: '1990-01-01', nationaliteit: 'NL', uboAard: 'eigendom', uboPercentageKlasse: '75_100', pep: false, isAanvrager: true },
      { id: 'u2', rol: 'bestuurder', voornamen: 'Extra', achternaam: 'Bestuurder', geboortedatum: '1985-05-05', nationaliteit: 'NL', pep: true, pepToelichting: 'Voormalig wethouder' },
    ],
    persoon: { roepnaam: 'Test', voornamen: 'Test', achternaam: 'Aanvrager', geboortedatum: '1990-01-01', nationaliteit: 'NL', telefoonMobiel: '+31600000000', adres: { straat: 'Straat', huisnummer: '2', postcode: '1000 AA', plaats: 'Stad', land: 'NL' }, pep: false },
    toestel: { gekoppeld: true, apparaatNaam: 'Win32', passkey: false, overgeslagen: false },
    gebruik: { txPerJaar: '100_500', omvangPerTx: '1k_10k', internationaal: true, landen: ['TR'], volumeKwartaal: '50k_150k', herkomstMiddelen: ['omzet_onderneming'] },
    identiteit: { bron: 'upload_web', kycRecordId: 'kyc1', snapshot: { voornamen: 'Test', achternaam: 'Aanvrager', geboortedatum: '1990-01-02', nationaliteit: 'NL', documentType: 'paspoort_eu', documentNummerLaatste4: '1234' }, bevestigdOp: 1789000000000 },
    aanvullend: { jaaromzet: '100k_500k', deelnemingen: false, actiefBuitenNl: false, actiefLanden: [] },
    toestemming: { verklaringJuistVolledig: true, verklaringBevoegd: true, acceptatiecriteriaAkkoord: true, voorwaardenAkkoord: true, voorwaardenVersie: '2026-09', privacyVersie: '2026-09', productupdatesOptIn: false, akkoordOp: 1789000000000, ipHash: 'abc123', userAgent: 'test' },
    risicoSignalen: ['identiteit_mismatch', 'pep'],
    sanctieHit: 0,
    beoordelingChecklist: [],
    beoordelingNotitie: '',
  },
  account: { naam: 'Test Aanvrager', email: 'test@oefen.nl', emailGeverifieerd: true, telefoon: '+31600000000', kycStatus: 'in_behandeling', idinStatus: null, apparaten: 1, passkeys: 0 },
  identiteit: { kycRecordId: 'kyc1', kycStatus: 'in_behandeling', documentType: 'paspoort_eu', bron: 'upload_web', ingediendOp: 1789000000000, snapshot: { voornamen: 'Test', achternaam: 'Aanvrager', geboortedatum: '1990-01-02', nationaliteit: 'NL', documentType: 'paspoort_eu', documentNummerLaatste4: '1234' }, mismatch: true, beeldenBeschikbaar: ['voorkant', 'selfie'] },
  documenten: [{ id: 'd1', soort: 'kvk_uittreksel', mime: 'application/pdf', grootte: 12345, bestandsnaam: 'uittreksel.pdf', geuploadOp: 1789000000000, verwijderdOp: null }],
  screening: { op: 1789000100000, unavailable: false, bedrijf: { hit: false, matches: [] }, handelsnaam: { hit: false, matches: [] }, personen: [{ id: 'u1', rol: 'ubo', hit: false, matches: [] }, { id: 'u2', rol: 'bestuurder', hit: true, matches: ['EXTRA BESTUURDER'] }] },
  eerdereAanvragen: [],
  historie: [{ id: 1, actie: 'kyb_ingediend', aangemaaktOp: '2026-09-14T10:00:00Z', details: { versie: 1 } }],
};

function renderDossier() {
  const onTerug = vi.fn();
  render(
    <TaalProvider>
      <KybDossier id="a1" onTerug={onTerug} />
    </TaalProvider>
  );
  return { onTerug };
}

describe('KybDossier', () => {
  beforeEach(() => {
    localStorage.setItem('swiftbridge_taal', 'nl'); // jsdom meldt 'en-US'; teksten in deze tests zijn NL
    apiFetch.mockReset();
    apiFetch.mockImplementation(async (pad) => {
      if (pad === '/admin/kyb/a1') return JSON.parse(JSON.stringify(DOSSIER));
      return { ok: true };
    });
  });

  test('toont bedrijf, gedecrypte personen, PEP en de afwijking met het Handelsregister', async () => {
    renderDossier();
    expect(await screen.findByRole('heading', { name: 'Oefen Handel BV' })).toBeInTheDocument();
    expect(screen.getByText('Oefen Handel B.V.')).toBeInTheDocument(); // KvK-kolom
    expect(screen.getAllByText('Wijkt af').length).toBeGreaterThan(0); // naam wijkt af van KvK
    expect(screen.getAllByText('Test Aanvrager').length).toBeGreaterThan(0); // UBO-tabel + identiteitstabel
    expect(screen.getAllByText('Extra Bestuurder').length).toBeGreaterThan(0); // UBO-tabel + screening-sectie
    expect(screen.getByText('Voormalig wethouder')).toBeInTheDocument();
    expect(screen.getAllByText('PEP').length).toBeGreaterThan(0);
    // Screening-hit op de tweede persoon
    expect(screen.getAllByText('Sanctie-hit').length).toBeGreaterThan(0);
    expect(screen.getAllByText('EXTRA BESTUURDER').length).toBeGreaterThan(0); // UBO-tabel + screening-sectie
    expect(apiFetch).toHaveBeenCalledWith('/admin/kyb/a1');
  });

  test('identiteit: mismatch-melding, beelden-knoppen en goedkeuren via PATCH /admin/kyc/:id/beoordeel', async () => {
    renderDossier();
    await screen.findByRole('heading', { name: 'Oefen Handel BV' });
    expect(screen.getByText(/Geboortedatum wijkt af van het identiteitsbewijs/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /voorkant/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /selfie/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /achterkant/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /identiteit goedkeuren/i }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/admin/kyc/kyc1/beoordeel', { method: 'PATCH', body: { status: 'goedgekeurd' } }));
  });

  test('identiteit afwijzen eist een opmerking', async () => {
    renderDossier();
    await screen.findByRole('heading', { name: 'Oefen Handel BV' });
    fireEvent.click(screen.getByRole('button', { name: /identiteit afwijzen/i }));
    const bevestig = screen.getByRole('button', { name: /identiteit afwijzen/i });
    expect(bevestig).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/reden van afkeuring/i), { target: { value: 'Selfie onscherp' } });
    fireEvent.click(bevestig);
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/admin/kyc/kyc1/beoordeel', { method: 'PATCH', body: { status: 'afgekeurd', opmerking: 'Selfie onscherp' } }));
  });

  test('documenten worden via een Openen-knop aangeboden (geen iframe)', async () => {
    renderDossier();
    await screen.findByRole('heading', { name: 'Oefen Handel BV' });
    expect(screen.getAllByText(/uittreksel\.pdf/).length).toBeGreaterThan(0); // sectie Bedrijf + sectie Documenten
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.getAllByRole('button', { name: /openen/i }).length).toBeGreaterThan(0);
  });

  test('in behandeling nemen en herscreenen roepen de contract-endpoints aan', async () => {
    renderDossier();
    await screen.findByRole('heading', { name: 'Oefen Handel BV' });
    fireEvent.click(screen.getByRole('button', { name: /in behandeling nemen/i }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/admin/kyb/a1/in-behandeling', { method: 'POST', body: {} }));
    fireEvent.click(screen.getByRole('button', { name: /opnieuw screenen/i }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/admin/kyb/a1/herscreen', { method: 'POST', body: {} }));
  });

  test('beoordeelpaneel staat onder het dossier zolang de aanvraag open is; Goedkeuren uit tot identiteit ok', async () => {
    renderDossier();
    await screen.findByRole('heading', { name: 'Oefen Handel BV' });
    expect(screen.getByText(/Controlepunten \(verplicht voor goedkeuren\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^goedkeuren$/i })).toBeDisabled();
  });

  test('geen beoordeelpaneel bij een afgewezen aanvraag', async () => {
    apiFetch.mockImplementation(async () => ({ ...JSON.parse(JSON.stringify(DOSSIER)), aanvraag: { ...DOSSIER.aanvraag, status: 'afgewezen', berichtKlant: 'Een of meer documenten waren niet leesbaar.' } }));
    renderDossier();
    await screen.findByRole('heading', { name: 'Oefen Handel BV' });
    expect(screen.queryByText(/Controlepunten \(verplicht voor goedkeuren\)/)).not.toBeInTheDocument();
    expect(screen.getByText(/documenten waren niet leesbaar/)).toBeInTheDocument();
  });

  test('terugknop werkt', async () => {
    const { onTerug } = renderDossier();
    await screen.findByRole('heading', { name: 'Oefen Handel BV' });
    fireEvent.click(screen.getAllByRole('button', { name: /zakelijke aanvragen/i })[0]);
    expect(onTerug).toHaveBeenCalled();
  });
});
