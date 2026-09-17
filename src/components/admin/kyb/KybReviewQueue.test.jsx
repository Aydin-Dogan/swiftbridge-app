/**
 * Tests KybReviewQueue — wachtrij met filter, badges, "In behandeling nemen" en doorklik naar het dossier.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaalProvider } from '../../../i18n';
import KybReviewQueue from './KybReviewQueue';
import { apiFetch } from '../../../services/api';

vi.mock('../../../services/api', () => ({
  API_URL: 'http://api.test',
  apiFetch: vi.fn(),
  parseError: (e) => e?.message || 'fout',
}));

const ITEMS = [
  { id: 'a1', userId: 'u1', versie: 1, bedrijfsnaam: 'Oefen Handel B.V.', kvkNummer: '00000001', rechtsvorm: 'bv', bron: 'kvk_mock', aanvragerNaam: 'Test Aanvrager', email: 'test@oefen.nl', status: 'ingediend', ingediendOp: 1788000000000, ingediendCount: 1, verwachtUiterlijkOp: 1788400000000, slaOverschreden: true, inBehandelingDoor: null, sanctieHit: 1, screeningOnbeschikbaar: false, risicoSignalen: ['sanctie_persoon'] },
  { id: 'a2', userId: 'u2', versie: 2, bedrijfsnaam: 'Oefen Webdesign', kvkNummer: '00000003', rechtsvorm: 'eenmanszaak', bron: 'handmatig', aanvragerNaam: 'Tweede Tester', email: 'twee@oefen.nl', status: 'in_behandeling', ingediendOp: 1788100000000, ingediendCount: 2, verwachtUiterlijkOp: 1789900000000, slaOverschreden: false, inBehandelingDoor: 'admin@swiftbridge.lokaal', sanctieHit: 0, screeningOnbeschikbaar: true, risicoSignalen: ['kvk_handmatig', 'sanctie_niet_gescreend'] },
];

function renderQueue() {
  return render(
    <TaalProvider>
      <KybReviewQueue />
    </TaalProvider>
  );
}

describe('KybReviewQueue', () => {
  beforeEach(() => {
    localStorage.setItem('swiftbridge_taal', 'nl'); // jsdom meldt 'en-US'; teksten in deze tests zijn NL
    apiFetch.mockReset();
    apiFetch.mockImplementation(async (pad) => {
      if (pad.startsWith('/admin/kyb?')) {
        const qs = new URLSearchParams(pad.split('?')[1]);
        if (qs.get('status') === 'open') return { totaal: 2, items: ITEMS };
        return { totaal: 0, items: [] };
      }
      if (pad === '/admin/kyb/a1') return { aanvraag: { id: 'a1', status: 'ingediend', bedrijf: { bedrijfsnaam: 'Oefen Handel B.V.', kvkNummer: '00000001' } }, account: {}, identiteit: {}, documenten: [], screening: null, eerdereAanvragen: [], historie: [] };
      return { ok: true };
    });
  });

  test('laadt standaard de open aanvragen en toont bedrijf, aanvrager, status en badges', async () => {
    renderQueue();
    expect(await screen.findByText('Oefen Handel B.V.')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/admin/kyb?status=open&limit=50&offset=0');
    expect(screen.getByText('Oefen Webdesign')).toBeInTheDocument();
    expect(screen.getByText('test@oefen.nl')).toBeInTheDocument();
    expect(screen.getByText('Doorlooptijd overschreden')).toBeInTheDocument();
    expect(screen.getByText('Sanctie-hit')).toBeInTheDocument();
    expect(screen.getByText('Screening niet uitgevoerd')).toBeInTheDocument();
    expect(screen.getByText('KvK handmatig')).toBeInTheDocument();
    expect(screen.getByText('In behandeling bij admin@swiftbridge.lokaal')).toBeInTheDocument();
    // Status-pills (naast de gelijknamige filterknoppen en kolomkop)
    expect(screen.getAllByText('Ingediend').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('In behandeling').length).toBeGreaterThanOrEqual(2);
  });

  test('"In behandeling nemen" alleen bij status ingediend; klik -> POST /admin/kyb/:id/in-behandeling', async () => {
    renderQueue();
    await screen.findByText('Oefen Handel B.V.');
    const knoppen = screen.getAllByRole('button', { name: /in behandeling nemen/i });
    expect(knoppen).toHaveLength(1);
    fireEvent.click(knoppen[0]);
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/admin/kyb/a1/in-behandeling', { method: 'POST', body: {} }));
    // lijst wordt opnieuw geladen
    await waitFor(() => expect(apiFetch.mock.calls.filter(([p]) => p.startsWith('/admin/kyb?')).length).toBeGreaterThanOrEqual(2));
  });

  test('filter "Goedgekeurd" vraagt status=goedgekeurd op en toont de lege melding', async () => {
    renderQueue();
    await screen.findByText('Oefen Handel B.V.');
    fireEvent.click(screen.getByRole('button', { name: /^goedgekeurd$/i }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/admin/kyb?status=goedgekeurd&limit=50&offset=0'));
    expect(await screen.findByText('Geen aanvragen in deze status.')).toBeInTheDocument();
  });

  test('filter "Alle" voegt open + goedgekeurd + afgewezen + ingetrokken samen', async () => {
    renderQueue();
    await screen.findByText('Oefen Handel B.V.');
    fireEvent.click(screen.getByRole('button', { name: /^alle$/i }));
    await waitFor(() => {
      const paden = apiFetch.mock.calls.map(([p]) => p);
      for (const s of ['open', 'goedgekeurd', 'afgewezen', 'ingetrokken']) {
        expect(paden).toContain(`/admin/kyb?status=${s}&limit=50&offset=0`);
      }
    });
    expect(await screen.findByText('Oefen Handel B.V.')).toBeInTheDocument();
  });

  test('zoekterm gaat als q= mee (na debounce van 400 ms)', async () => {
    renderQueue();
    await screen.findByText('Oefen Handel B.V.');
    fireEvent.change(screen.getByPlaceholderText(/zoeken/i), { target: { value: 'Webdesign' } });
    await waitFor(
      () => expect(apiFetch).toHaveBeenCalledWith('/admin/kyb?status=open&limit=50&offset=0&q=Webdesign'),
      { timeout: 2000 },
    );
  });

  test('klik op een rij opent het dossier; terugknop keert terug naar de lijst', async () => {
    renderQueue();
    await screen.findByText('Oefen Handel B.V.');
    fireEvent.click(screen.getByText('Oefen Handel B.V.'));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/admin/kyb/a1'));
    expect(await screen.findByRole('heading', { name: 'Oefen Handel B.V.' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /zakelijke aanvragen/i })[0]);
    expect(await screen.findByText('Oefen Webdesign')).toBeInTheDocument();
  });

  test('serverfout wordt getoond', async () => {
    apiFetch.mockRejectedValueOnce(new Error('Geen admin toegang'));
    renderQueue();
    expect(await screen.findByRole('alert')).toHaveTextContent('Geen admin toegang');
  });
});
