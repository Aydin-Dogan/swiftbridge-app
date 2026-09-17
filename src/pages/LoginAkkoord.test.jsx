/**
 * LoginAkkoord.test.jsx — juridisch akkoord bij registratie (juridische documenten v1.0).
 *
 * - zonder vinkje: geen /auth/register-aanroep, rode melding register_akkoord_verplicht
 * - vinkje heeft links naar /voorwaarden en /privacy (nieuw tabblad)
 * - met vinkje: body bevat voorwaardenAkkoord:true
 * - daarna koppel-scherm: regel met links naar /voorwaarden/digitale-toegang en /veiligheid/regels
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderMetRouter, forceerNederlands } from '../components/kyb/kybTestHulp';

const apiFetch = vi.fn();
const haalProfiel = vi.fn();
vi.mock('../services/api', () => ({
  apiFetch: (...args) => apiFetch(...args),
  haalProfiel: (...args) => haalProfiel(...args),
  parseError: (e) => e?.message || 'fout',
}));

const { default: Login } = await import('./Login');

function vulFormulier() {
  fireEvent.change(screen.getByLabelText('Volledige naam'), { target: { value: 'Oefen Klant' } });
  fireEvent.change(screen.getByLabelText('E-mailadres'), { target: { value: 'oefen@voorbeeld.test' } });
  fireEvent.change(screen.getByLabelText('Wachtwoord'), { target: { value: 'Zk9!mvBlx7Qr-3pTw' } });
}

describe('Login: juridisch akkoord bij registreren', () => {
  beforeEach(() => {
    forceerNederlands();
    apiFetch.mockReset();
    haalProfiel.mockReset();
    apiFetch.mockImplementation(async (pad) => {
      if (pad === '/auth/register') return { token: 'x', gebruiker: { id: 'u1', accountType: 'particulier' } };
      throw new Error(`niet gemockt: ${pad}`);
    });
    haalProfiel.mockResolvedValue({ id: 'u1', naam: 'Oefen Klant', accountType: 'particulier' });
  });

  test('zonder vinkje wordt er niet geregistreerd en staat de melding in rood', async () => {
    renderMetRouter(<Login onLogin={() => {}} />, { pad: '/login?tab=register' });
    vulFormulier();

    const vinkje = screen.getByRole('checkbox', { name: /Ik ga akkoord met de/ });
    expect(vinkje).not.toBeChecked();
    expect(screen.getByRole('link', { name: 'Voorwaarden' })).toHaveAttribute('href', '/voorwaarden');
    expect(screen.getByRole('link', { name: 'Voorwaarden' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Privacyverklaring' })).toHaveAttribute('href', '/privacy');

    fireEvent.click(screen.getByRole('button', { name: 'Account aanmaken' }));
    const melding = await screen.findByText('Ga akkoord met de voorwaarden om verder te gaan.');
    expect(melding).toHaveClass('text-red-600');
    expect(apiFetch).not.toHaveBeenCalledWith('/auth/register', expect.anything());
  });

  test('met vinkje gaat voorwaardenAkkoord:true mee en volgt het koppel-scherm met de juiste links', async () => {
    renderMetRouter(<Login onLogin={() => {}} />, { pad: '/login?tab=register' });
    vulFormulier();
    fireEvent.click(screen.getByRole('checkbox', { name: /Ik ga akkoord met de/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Account aanmaken' }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/auth/register', expect.anything()));
    const [, opties] = apiFetch.mock.calls.find(([pad]) => pad === '/auth/register');
    expect(opties.method).toBe('POST');
    expect(opties.body).toMatchObject({ email: 'oefen@voorbeeld.test', naam: 'Oefen Klant', voorwaardenAkkoord: true });
    expect(screen.queryByText('Ga akkoord met de voorwaarden om verder te gaan.')).not.toBeInTheDocument();

    // Toestel nog niet gekoppeld -> koppel-aanbod met Voorwaarden Digitale Toegang + Veiligheidsregels
    await screen.findByText('Onthoud dit apparaat');
    expect(screen.getByRole('link', { name: 'Voorwaarden Digitale Toegang' })).toHaveAttribute('href', '/voorwaarden/digitale-toegang');
    expect(screen.getByRole('link', { name: 'Veiligheidsregels' })).toHaveAttribute('href', '/veiligheid/regels');
  });
});
