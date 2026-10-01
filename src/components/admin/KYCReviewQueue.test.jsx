/**
 * KYCReviewQueue.test.jsx — het reviewscherm vraagt alleen documenten op die
 * er zijn.
 *
 * AANLEIDING (1-10-2026)
 * Bij een iDIN-record stonden drie fotovakken met elk "HTTP 404". Bij iDIN
 * stelt de bank de identiteit vast en wordt er niets geupload; die 404 was dus
 * correct, maar hij zei het verkeerde. Een beoordelaar kan aan "HTTP 404" niet
 * zien of het document ontbreekt of of het ophalen stuk is, en dat verschil
 * bepaalt wat hij moet doen: de klant om een nieuwe foto vragen, of een storing
 * melden.
 *
 * De wachtrij stuurt nu per record heeftVoorkant/heeftAchterkant/heeftSelfie
 * mee. Het scherm toont alleen die vakken en zegt het met zoveel woorden
 * wanneer er niets is.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TaalProvider } from '../../i18n';
import { apiFetch } from '../../services/api';
import KYCReviewQueue from './KYCReviewQueue';

vi.mock('../../services/api', () => ({
  API_URL: 'http://api.test',
  apiFetch: vi.fn(),
  parseError: (e) => e?.message || 'fout',
}));

const BASIS = {
  id: 'rec-1',
  userNaam: 'Test Klant',
  userEmail: 'klant@test.nl',
  context: 'kyc',
  status: 'in_behandeling',
  ingediendOp: '2026-09-18 21:47:53',
};

function toonWachtrijMet(record) {
  apiFetch.mockResolvedValue({ records: [{ ...BASIS, ...record }] });
  return render(<TaalProvider><KYCReviewQueue /></TaalProvider>);
}

async function openEersteRecord() {
  const knop = await screen.findByRole('button', { name: /bekijken/i });
  fireEvent.click(knop);
}

describe('KYCReviewQueue — welke documentvakken verschijnen', () => {
  beforeEach(() => {
    localStorage.setItem('swiftbridge_taal', 'nl');
    URL.createObjectURL = vi.fn(() => 'blob:http://app.test/abc');
    URL.revokeObjectURL = vi.fn();
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      blob: async () => new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }),
    }));
  });

  afterEach(() => { vi.clearAllMocks(); });

  test('iDIN zonder documenten: geen fotovakken, wel uitleg', async () => {
    toonWachtrijMet({
      documentType: 'rijbewijs', bron: 'idin',
      heeftVoorkant: false, heeftAchterkant: false, heeftSelfie: false,
    });
    await openEersteRecord();

    // Er wordt geen enkel document opgehaald — dus ook geen 404 om te tonen.
    await waitFor(() => expect(screen.getByText(/geen documenten/i)).toBeInTheDocument());
    const documentAanroepen = globalThis.fetch.mock.calls
      .filter(([url]) => String(url).includes('/document/'));
    expect(documentAanroepen).toHaveLength(0);
  });

  test('ID-kaart waarvan de achterkant ontbreekt: geen achterkant-vak', async () => {
    // Bewust GEEN paspoort: het oude scherm raadde de achterkant uit de naam
    // van het documenttype ("paspoort" -> geen achterkant). Bij een id_kaart
    // zonder achterkant-bestand raadt die regel fout en vraagt hij een document
    // op dat niet bestaat. Alleen de vlag uit de wachtrij klopt hier.
    toonWachtrijMet({
      documentType: 'id_kaart', bron: 'upload_telefoon',
      heeftVoorkant: true, heeftAchterkant: false, heeftSelfie: true,
    });
    await openEersteRecord();

    await waitFor(() => {
      const aanroepen = globalThis.fetch.mock.calls
        .map(([url]) => String(url)).filter((u) => u.includes('/document/'));
      expect(aanroepen).toHaveLength(2);
    });
    const aanroepen = globalThis.fetch.mock.calls.map(([url]) => String(url));
    expect(aanroepen.some((u) => u.endsWith('/document/voorkant'))).toBe(true);
    expect(aanroepen.some((u) => u.endsWith('/document/selfie'))).toBe(true);
    expect(aanroepen.some((u) => u.endsWith('/document/achterkant'))).toBe(false);
  });

  test('ID-kaart met alle drie: drie vakken', async () => {
    toonWachtrijMet({
      documentType: 'id_kaart', bron: 'upload_web',
      heeftVoorkant: true, heeftAchterkant: true, heeftSelfie: true,
    });
    await openEersteRecord();

    await waitFor(() => {
      const aanroepen = globalThis.fetch.mock.calls
        .map(([url]) => String(url)).filter((u) => u.includes('/document/'));
      expect(aanroepen).toHaveLength(3);
    });
  });

  test('oud antwoord zonder de vlaggen blijft werken', async () => {
    // Tijdens een uitrol kan het scherm al nieuw zijn terwijl de API nog de
    // oude vorm stuurt. Dan terugvallen op het oude gedrag (alles proberen) is
    // beter dan lege vakken tonen bij een record dat wel documenten heeft.
    toonWachtrijMet({ documentType: 'id_kaart', bron: 'upload_web' });
    await openEersteRecord();

    await waitFor(() => {
      const aanroepen = globalThis.fetch.mock.calls
        .map(([url]) => String(url)).filter((u) => u.includes('/document/'));
      expect(aanroepen).toHaveLength(3);
    });
  });
});
