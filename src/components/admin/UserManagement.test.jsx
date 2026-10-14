/**
 * UserManagement.test.jsx — gebruikersbeheer neemt geen afsluitend KYC-besluit.
 *
 * AANLEIDING (14-10-2026, onderdeel 7 van ronde 3)
 * Het keuzevenster "KYC status wijzigen" stond standaard op "Goedgekeurd": wie
 * zonder te kijken op Bevestigen drukte, keurde een klant goed. Ook afkeuren
 * kon hier, buiten het dossierscherm om, zonder reden en zonder tweede
 * beoordelaar. De API weigert dat sinds vandaag (409 KYC_POORT_GEWEIGERD).
 *
 * Wat hier moet gelden (besluit Aydin):
 *  - goedkeuren, afwijzen en beëindigen gebeurt alleen in het dossierscherm;
 *    hier staat een knop "Open dossier" die daarheen gaat;
 *  - terug in behandeling en blokkeren (tussenbesluiten) mag één medewerker,
 *    dus die blijven hier;
 *  - het keuzevenster kiest niets vooraf: de medewerker kiest zelf.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { TaalProvider } from '../../i18n';
import { forceerNederlands } from '../kyb/kybTestHulp';
import { apiFetch } from '../../services/api';
import UserManagement from './UserManagement';

vi.mock('../../services/api', () => ({
  API_URL: 'http://api.test',
  apiFetch: vi.fn(),
  parseError: (e) => e?.message || 'fout',
}));

const LIJST = {
  totaal: 1,
  users: [{
    id: 'u1', email: 'klant@voorbeeld.test', naam: 'Oefen Klant', telefoon: null,
    kycStatus: 'goedgekeurd', accountStatus: 'actief', aantalTransacties: 0,
    twofaIngeschakeld: false, aangemeldOp: '2026-10-01T10:00:00Z',
  }],
};

function detail(kycRecords) {
  return {
    user: {
      id: 'u1', naam: 'Oefen Klant', email: 'klant@voorbeeld.test',
      kycStatus: 'goedgekeurd', accountStatus: 'actief',
      adres: {}, idin: {},
    },
    transacties: [],
    // Zoals de API ze geeft: nieuwste eerst (ORDER BY ingediend_op DESC).
    kycRecords,
    auditLogs: [],
    notities: [],
    verzoeken: [],
    pushSubscriptions: 0,
  };
}

const TWEE_DOSSIERS = [
  { id: 'k-nieuw', documentType: 'paspoort', documentNummer: 'X1', geboortedatum: '1990-01-01', nationaliteit: 'NL', status: 'goedgekeurd', ingediendOp: '2026-10-10T10:00:00Z' },
  { id: 'k-oud', documentType: 'id_kaart', documentNummer: 'X0', geboortedatum: '1990-01-01', nationaliteit: 'NL', status: 'afgewezen', ingediendOp: '2026-09-01T10:00:00Z' },
];

let kycRecords;

beforeEach(() => {
  localStorage.clear();
  forceerNederlands();
  kycRecords = TWEE_DOSSIERS;
  apiFetch.mockReset();
  apiFetch.mockImplementation(async (pad) => {
    if (pad.startsWith('/admin/users?')) return LIJST;
    if (pad === '/admin/users/u1') return detail(kycRecords);
    return { success: true };
  });
});

async function openGebruiker(onOpenDossier = vi.fn()) {
  render(<TaalProvider><UserManagement onOpenDossier={onOpenDossier} /></TaalProvider>);
  fireEvent.click(await screen.findByText('Oefen Klant'));
  await screen.findByText('User detail');
  return onOpenDossier;
}

async function naarTab(naam) {
  const balk = screen.getByText('User detail').closest('div.sticky').parentElement;
  fireEvent.click(within(balk).getByRole('button', { name: naam }));
}

const muterend = () => apiFetch.mock.calls.filter(([, o]) => o && o.method && o.method !== 'GET');

describe('het KYC-tabblad', () => {
  test('elk dossier heeft "Open dossier", dat naar het dossierscherm gaat', async () => {
    const onOpenDossier = await openGebruiker();
    await naarTab('KYC');

    const knoppen = screen.getAllByRole('button', { name: 'Open dossier' });
    expect(knoppen).toHaveLength(2);
    fireEvent.click(knoppen[1]);
    expect(onOpenDossier).toHaveBeenCalledWith('k-oud');
  });

  test('er staat geen knop die goedkeurt of afwijst', async () => {
    await openGebruiker();
    await naarTab('KYC');
    expect(screen.queryByRole('button', { name: /goedkeur|afkeur|afwijz/i })).toBeNull();
  });
});

describe('het tabblad Acties', () => {
  test('"Open dossier" opent het nieuwste dossier', async () => {
    const onOpenDossier = await openGebruiker();
    await naarTab('Acties');
    fireEvent.click(screen.getByRole('button', { name: 'Open dossier' }));
    expect(onOpenDossier).toHaveBeenCalledWith('k-nieuw');
  });

  test('het keuzevenster kiest niets vooraf en kent geen goedkeuren of afkeuren', async () => {
    await openGebruiker();
    await naarTab('Acties');
    fireEvent.click(screen.getByRole('button', { name: 'Status wijzigen' }));

    const keuze = await screen.findByRole('combobox');
    expect(keuze.value).toBe('');
    const opties = within(keuze).getAllByRole('option').map((o) => o.value);
    expect(opties).toEqual(['', 'in_behandeling', 'geblokkeerd']);
    expect(opties).not.toContain('goedgekeurd');
    expect(opties).not.toContain('afgekeurd');

    // Zonder keuze is er niets te bevestigen, dus ook niets per ongeluk.
    const bevestig = screen.getByRole('button', { name: 'Bevestigen' });
    expect(bevestig).toBeDisabled();
    fireEvent.click(bevestig);
    expect(muterend()).toHaveLength(0);
  });

  test('terug in behandeling gaat naar de gebruikersroute, met de reden', async () => {
    await openGebruiker();
    await naarTab('Acties');
    fireEvent.click(screen.getByRole('button', { name: 'Status wijzigen' }));
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'in_behandeling' } });
    fireEvent.change(screen.getByPlaceholderText(/Bijv\./), { target: { value: 'Opnieuw bekijken' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen' }));

    await waitFor(() => expect(muterend()).toHaveLength(1));
    expect(muterend()[0]).toEqual(['/admin/users/u1/kyc-status', {
      method: 'PATCH', body: { status: 'in_behandeling', reden: 'Opnieuw bekijken' },
    }]);
  });

  test('blokkeren gaat naar het nieuwste dossier, zonder dossierscherm (spoed)', async () => {
    await openGebruiker();
    await naarTab('Acties');
    fireEvent.click(screen.getByRole('button', { name: 'Status wijzigen' }));
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'geblokkeerd' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen' }));

    await waitFor(() => expect(muterend()).toHaveLength(1));
    expect(muterend()[0][0]).toBe('/kyc/k-nieuw/beoordeel');
    expect(muterend()[0][1]).toMatchObject({ method: 'PATCH', body: { beslissing: 'geblokkeerd' } });
  });

  test('zonder dossier: geen "Open dossier" en geen blokkeren, wel terug in behandeling', async () => {
    kycRecords = [];
    await openGebruiker();
    await naarTab('Acties');
    expect(screen.queryByRole('button', { name: 'Open dossier' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Status wijzigen' }));
    const opties = within(await screen.findByRole('combobox')).getAllByRole('option').map((o) => o.value);
    expect(opties).toEqual(['', 'in_behandeling']);
  });
});
