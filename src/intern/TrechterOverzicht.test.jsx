/**
 * TrechterOverzicht.test.jsx — de aanmeldtrechter op het beheeroverzicht.
 *
 * Aanmeldroute, sectie 6: per week van aanmelden zien hoeveel nieuwe accounts
 * elke stap haalden. Het scherm toont wat GET /admin/trechter teruggeeft: per
 * week en in totaal het aantal per stap, met eronder het percentage van de
 * vorige stap. Met een taalkeuze vraagt het de cijfers voor één taal op.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { TaalProvider } from '../i18n';
import { apiFetch } from '../services/api';
import TrechterOverzicht from './TrechterOverzicht';

vi.mock('../services/api', () => ({
  API_URL: 'http://api.test',
  apiFetch: vi.fn(),
}));

const STAPPEN = [
  'accountAangemaakt', 'emailBevestigd', 'kycIngediend', 'kycGoedgekeurd',
  'eersteTransactieAangemaakt', 'eersteTransactieBetaald', 'tweedeBinnen30Dagen',
];

/** Zelfde vorm als de API: aantal plus percentage van de vorige stap. */
function blok(aantallen, tweedeNogMogelijk = 0) {
  return {
    stappen: STAPPEN.map((stap, i) => ({
      stap,
      aantal: aantallen[i],
      pctVanVorige: i === 0 || !aantallen[i - 1] ? null : Math.round((aantallen[i] / aantallen[i - 1]) * 1000) / 10,
      pctVanAccounts: aantallen[0] ? Math.round((aantallen[i] / aantallen[0]) * 1000) / 10 : null,
    })),
    tweedeNogMogelijk,
  };
}

const ANTWOORD = {
  weken: 12,
  vanaf: '2026-07-27',
  taal: null,
  stappen: STAPPEN,
  perWeek: [
    { week: '2026-W42', vanaf: '2026-10-12', ...blok([4, 3, 3, 2, 1, 1, 0], 1) },
    { week: '2026-W41', vanaf: '2026-10-05', ...blok([0, 0, 0, 0, 0, 0, 0]) },
  ],
  totaal: blok([4, 3, 3, 2, 1, 1, 0], 1),
  perTaal: [{ taal: 'nl', ...blok([4, 3, 3, 2, 1, 1, 0], 1) }],
  gegenereerdOp: '2026-10-13T10:00:00.000Z',
};

function toon() {
  return render(<TaalProvider><TrechterOverzicht /></TaalProvider>);
}

describe('TrechterOverzicht', () => {
  beforeEach(() => {
    localStorage.setItem('swiftbridge_taal', 'nl');
  });
  afterEach(() => { vi.clearAllMocks(); });

  test('toont per week het aantal per stap en het percentage van de vorige stap', async () => {
    apiFetch.mockResolvedValue(ANTWOORD);
    toon();

    expect(await screen.findByRole('heading', { name: /aanmeldtrechter per week/i })).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/admin/trechter?weken=12');

    // Kolomkoppen in de volgorde van de trechter.
    const koppen = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(koppen).toEqual([
      'Week', 'Account', 'E-mail bevestigd', 'KYC ingediend', 'KYC goedgekeurd',
      'Eerste overboeking', 'Eerste betaald', 'Tweede binnen 30 dagen',
    ]);

    const rij = screen.getByRole('row', { name: /2026-W42/ });
    const cellen = within(rij).getAllByRole('cell');
    expect(cellen[0]).toHaveTextContent('4');
    expect(cellen[1]).toHaveTextContent('3');
    expect(cellen[1]).toHaveTextContent('75%'); // 3 van 4
    expect(cellen[3]).toHaveTextContent('66,7%'); // 2 van 3, Nederlandse notatie

    // Een lege week toont nullen en geen percentage.
    const leeg = within(screen.getByRole('row', { name: /2026-W41/ })).getAllByRole('cell');
    expect(leeg[1]).toHaveTextContent(/^0$/);

    expect(screen.getByRole('row', { name: /totaal/i })).toBeInTheDocument();
    expect(screen.getByText(/1 klanten zitten nog binnen hun 30 dagen/i)).toBeInTheDocument();
  });

  test('een taal kiezen vraagt de cijfers voor alleen die taal op', async () => {
    apiFetch.mockResolvedValue(ANTWOORD);
    toon();
    await screen.findByRole('row', { name: /2026-W42/ });

    apiFetch.mockResolvedValue({ ...ANTWOORD, taal: 'tr' });
    fireEvent.change(screen.getByLabelText('Taal'), { target: { value: 'tr' } });

    await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith('/admin/trechter?weken=12&taal=tr'));
  });

  test('een fout van de server komt in beeld in plaats van een lege tabel', async () => {
    apiFetch.mockRejectedValue(new Error('Geen toegang tot de interne omgeving.'));
    toon();

    expect(await screen.findByText(/trechter kon niet worden geladen/i)).toBeInTheDocument();
    expect(screen.getByText(/geen toegang tot de interne omgeving/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
