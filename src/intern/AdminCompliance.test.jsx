/**
 * AdminCompliance.test.jsx — de compliancewerkplek na onderdeel 7 (14-10-2026).
 *
 * Besluit Aydin: /beheer en de tab "KYC Review" gaan weg. Wat daar stond en
 * nodig blijft, staat nu hier:
 *  - de vastgehouden uitbetalingen staan op het overzicht (de startpagina);
 *  - goedkeuren, afwijzen en beëindigen gebeurt in Particuliere aanvragen, en
 *    "Open dossier" bij een gebruiker springt daar meteen naartoe.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TaalProvider } from '../i18n';
import { forceerNederlands } from '../components/kyb/kybTestHulp';
import { apiFetch } from '../services/api';
import AdminCompliance from './AdminCompliance';

vi.mock('../services/api', () => ({
  API_URL: 'http://api.test',
  apiFetch: vi.fn(),
  parseError: (e) => e?.message || 'fout',
}));

const STATS = {
  gebruikers: 3, kycInBehandeling: 1, kycGoedgekeurd: 1, totaalVolumeEur: 0,
  transacties7d: { aantal: 0, totaalEur: 0 }, transacties30d: { aantal: 0, totaalEur: 0 },
  sanctieHits: 0, gdprActies: 0, genereerdOp: '2026-10-14T10:00:00Z',
};

const PAYOUT = {
  id: 'tx-hand', referentieNr: 'SB-HAND', ontvangerNaam: 'Amina Duran', ontvangerBank: 'Garanti BBVA',
  uitbetaalMethode: 'papara', eurBedrag: 100, tryBedrag: 3400, valuta: 'TRY',
  status: 'in_behandeling', vastgehouden: false, redenVasthouden: null,
  aangemaaktOp: new Date().toISOString(),
};

const GEBRUIKER = {
  id: 'u1', email: 'klant@voorbeeld.test', naam: 'Oefen Klant', kycStatus: 'goedgekeurd',
  accountStatus: 'actief', aantalTransacties: 0, aangemeldOp: '2026-10-01T10:00:00Z',
};

const DOSSIER = {
  id: 'k-nieuw', userId: 'u1', type: 'particulier', status: 'goedgekeurd',
  checklist: {}, magBeoordelen: { mag: false, reden: 'Dit dossier is afgesloten.' },
  dagenWachtend: 0, buitenTermijn: false,
  risico: { klasse: 'laag', score: 0, factoren: [], ondergrenzen: [], hertoetsingOverMaanden: 24, tweedeBeoordelaarNodig: false },
  besluit: { beoordeelbaar: true, toelichting: 'Afgesloten.', ontbreekt: [], aanbevolenVervolg: 'beoordelen', checklist: [], redenCodes: [] },
  vastlegging: {
    identiteit: { bron: 'upload_web', idinWerkelijkGeslaagd: false, documentType: 'paspoort', nationaliteit: 'NL', beeldenBeschikbaar: [] },
    akkoord: {}, account: { emailGeverifieerd: true, tweefactorAan: true, heeftAdres: true, land: 'NL' }, screening: null,
  },
  gedrag: { aantalTransacties: 0, bestemmingslanden: [], vergelijkingMogelijk: false, toelichting: '-' },
};

beforeEach(() => {
  localStorage.clear();
  forceerNederlands();
  apiFetch.mockReset();
  apiFetch.mockImplementation(async (pad) => {
    if (pad === '/admin/stats') return STATS;
    if (pad === '/admin/audit-logs/verify-chain') return { geldig: true, totaal: 0 };
    if (pad === '/admin/payouts/pending') return { totaal: 1, payouts: [PAYOUT] };
    if (pad.startsWith('/admin/users?')) return { totaal: 1, users: [GEBRUIKER] };
    if (pad === '/admin/users/u1') {
      return {
        user: { ...GEBRUIKER, adres: {}, idin: {} }, transacties: [], auditLogs: [], notities: [], verzoeken: [],
        kycRecords: [{ id: 'k-nieuw', documentType: 'paspoort', status: 'goedgekeurd', ingediendOp: '2026-10-10T10:00:00Z' }],
      };
    }
    if (pad === '/admin/kyc/wachtrij') return { dossiers: [], tellers: null };
    if (pad.startsWith('/admin/kyc/dossier/')) return DOSSIER;
    throw new Error(`onverwacht pad: ${pad}`);
  });
});

function toon() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <TaalProvider>
        <Routes>
          <Route path="/" element={<AdminCompliance />} />
          <Route path="*" element={<div>PAGINA BESTAAT NIET</div>} />
        </Routes>
      </TaalProvider>
    </MemoryRouter>
  );
}

const tabbalk = () => screen.getByRole('button', { name: /^Overzicht$/ }).parentElement;

describe('de compliancewerkplek', () => {
  test('de tab "KYC Review" is weg; "Particuliere aanvragen" is er', async () => {
    toon();
    await screen.findByRole('button', { name: /^Overzicht$/ });
    expect(within(tabbalk()).queryByRole('button', { name: /KYC Review/i })).toBeNull();
    expect(within(tabbalk()).getByRole('button', { name: /Particuliere aanvragen/ })).toBeInTheDocument();
  });

  test('het overzicht toont de vastgehouden uitbetalingen (verhuisd van /beheer)', async () => {
    toon();
    expect(await screen.findByText('SB-HAND')).toBeInTheDocument();
    expect(screen.getByText(/Vastgehouden uitbetalingen/)).toBeInTheDocument();
  });

  test('"Open dossier" bij een gebruiker opent dat dossier in Particuliere aanvragen', async () => {
    toon();
    fireEvent.click(await screen.findByRole('button', { name: /^Gebruikers$/ }));
    fireEvent.click(await screen.findByText('Oefen Klant'));
    await screen.findByText('User detail');
    fireEvent.click(screen.getByRole('button', { name: 'KYC' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open dossier' }));

    await screen.findByRole('dialog', { name: 'Particulier dossier' });
    expect(apiFetch).toHaveBeenCalledWith('/admin/kyc/dossier/k-nieuw');

    // Dicht, en later zelf naar de tab: dan gaat dat dossier niet opnieuw open.
    fireEvent.click(screen.getByRole('button', { name: /sluiten/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(within(tabbalk()).getByRole('button', { name: /^Overzicht$/ }));
    fireEvent.click(within(tabbalk()).getByRole('button', { name: /Particuliere aanvragen/ }));
    await screen.findByText(/geen particuliere aanvragen/i);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('het logo blijft in de interne omgeving (er is daar geen /app)', async () => {
    toon();
    fireEvent.click(await screen.findByRole('button', { name: /^Gebruikers$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Naar het overzicht' }));
    expect(screen.queryByText('PAGINA BESTAAT NIET')).toBeNull();
    expect(await screen.findByText('SB-HAND')).toBeInTheDocument();
  });

  test('de kop belooft geen DNB-toezicht', async () => {
    toon();
    await screen.findByRole('button', { name: /^Overzicht$/ });
    expect(screen.queryByText(/DNB/)).toBeNull();
  });
});
