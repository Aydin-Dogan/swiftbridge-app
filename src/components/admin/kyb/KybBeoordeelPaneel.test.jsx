/**
 * Tests KybBeoordeelPaneel (contract sectie 8):
 *   - Goedkeuren disabled tot 6 vinkjes + identiteit goedgekeurd
 *   - Afwijzen eist reden-code; tipping-off-waarschuwing zichtbaar; generieke code -> geen klantbericht
 *   - Besluiten gaan naar POST /admin/kyb/:id/beoordeel met de contract-body
 *   - Notitie naar POST /admin/kyb/:id/notitie
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { TaalProvider } from '../../../i18n';
import KybBeoordeelPaneel from './KybBeoordeelPaneel';
import { apiFetch } from '../../../services/api';

vi.mock('../../../services/api', () => ({
  API_URL: 'http://api.test',
  apiFetch: vi.fn(),
  parseError: (e) => e?.message || 'fout',
}));

function renderPaneel(props = {}) {
  const onGewijzigd = vi.fn();
  const utils = render(
    <TaalProvider>
      <KybBeoordeelPaneel kybId="k1" bedrijfsnaam="Oefen Handel B.V." status="in_behandeling" identiteitGoedgekeurd onGewijzigd={onGewijzigd} {...props} />
    </TaalProvider>
  );
  return { ...utils, onGewijzigd };
}

function vinkAlles() {
  screen.getAllByRole('checkbox').forEach((cb) => { if (!cb.checked) fireEvent.click(cb); });
}

describe('KybBeoordeelPaneel', () => {
  beforeEach(() => {
    localStorage.setItem('swiftbridge_taal', 'nl'); // jsdom meldt 'en-US'; teksten in deze tests zijn NL
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({ ok: true, kybId: 'k1', status: 'goedgekeurd', vorigeStatus: 'in_behandeling' });
  });

  test('rendert niets bij een terminale status', () => {
    const { container } = renderPaneel({ status: 'goedgekeurd' });
    expect(container.querySelector('section')).toBeNull();
  });

  test('Goedkeuren is uit tot alle 6 controlepunten zijn afgevinkt', () => {
    renderPaneel();
    const goedkeuren = screen.getByRole('button', { name: /^goedkeuren$/i });
    expect(goedkeuren).toBeDisabled();
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(6);
    boxes.slice(0, 5).forEach((cb) => fireEvent.click(cb));
    expect(goedkeuren).toBeDisabled();
    fireEvent.click(boxes[5]);
    expect(goedkeuren).toBeEnabled();
  });

  test('Goedkeuren blijft uit zolang de identiteit niet is goedgekeurd', () => {
    renderPaneel({ identiteitGoedgekeurd: false });
    vinkAlles();
    expect(screen.getByRole('button', { name: /^goedkeuren$/i })).toBeDisabled();
    expect(screen.getByText(/keur eerst de identiteit/i)).toBeInTheDocument();
  });

  test('goedkeuren: bevestiging met bedrijfsnaam, daarna POST beoordeel met checklist', async () => {
    const { onGewijzigd } = renderPaneel();
    vinkAlles();
    fireEvent.click(screen.getByRole('button', { name: /^goedkeuren$/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Oefen Handel B\.V\./)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /^goedkeuren$/i }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    const [pad, opties] = apiFetch.mock.calls[0];
    expect(pad).toBe('/admin/kyb/k1/beoordeel');
    expect(opties.method).toBe('POST');
    expect(opties.body.besluit).toBe('goedgekeurd');
    expect([...opties.body.checklist].sort()).toEqual([
      'doel_aard_begrepen', 'identiteit_geverifieerd', 'kvk_gecontroleerd', 'pep_beoordeeld', 'sancties_gecontroleerd', 'ubo_compleet',
    ]);
    await waitFor(() => expect(onGewijzigd).toHaveBeenCalled());
  });

  test('afwijzen eist een reden-code en toont de tipping-off-waarschuwing', async () => {
    renderPaneel();
    fireEvent.click(screen.getByRole('button', { name: /^afwijzen$/i }));
    expect(screen.getByText(/Wwft art\. 23/i)).toBeInTheDocument();
    const afwijzen = screen.getByRole('button', { name: /^afwijzen$/i });
    expect(afwijzen).toBeDisabled();

    // Generieke code: geen klantbericht-veld
    fireEvent.change(screen.getByLabelText(/^reden$/i), { target: { value: 'sanctie' } });
    expect(screen.queryByLabelText(/bericht aan de klant/i)).not.toBeInTheDocument();
    expect(afwijzen).toBeEnabled();

    // Specifieke code: wel klantbericht-veld
    fireEvent.change(screen.getByLabelText(/^reden$/i), { target: { value: 'documenten_onleesbaar' } });
    fireEvent.change(screen.getByLabelText(/bericht aan de klant/i), { target: { value: 'Het uittreksel was onscherp.' } });

    fireEvent.click(afwijzen);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /^afwijzen$/i }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    const [pad, opties] = apiFetch.mock.calls[0];
    expect(pad).toBe('/admin/kyb/k1/beoordeel');
    expect(opties.body).toMatchObject({ besluit: 'afgewezen', redenCode: 'documenten_onleesbaar', berichtKlant: 'Het uittreksel was onscherp.' });
  });

  test('afwijzen met generieke code stuurt geen klantbericht mee', async () => {
    renderPaneel();
    fireEvent.click(screen.getByRole('button', { name: /^afwijzen$/i }));
    fireEvent.change(screen.getByLabelText(/^reden$/i), { target: { value: 'sanctie' } });
    fireEvent.click(screen.getByRole('button', { name: /^afwijzen$/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^afwijzen$/i }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    const body = apiFetch.mock.calls[0][1].body;
    expect(body.besluit).toBe('afgewezen');
    expect(body.redenCode).toBe('sanctie');
    expect(body.berichtKlant).toBeUndefined();
  });

  test('aanvullende informatie vragen: modal -> POST beoordeel info_nodig met stappen', async () => {
    renderPaneel();
    fireEvent.click(screen.getByRole('button', { name: /aanvullende informatie vragen/i }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/bericht aan de klant/i), { target: { value: 'Graag de landenlijst aanvullen' } });
    fireEvent.click(within(dialog).getByLabelText(/4\. Gebruik/i));
    fireEvent.click(within(dialog).getByRole('button', { name: /aanvullende informatie vragen/i }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    const [pad, opties] = apiFetch.mock.calls[0];
    expect(pad).toBe('/admin/kyb/k1/beoordeel');
    expect(opties.body).toMatchObject({ besluit: 'info_nodig', berichtKlant: 'Graag de landenlijst aanvullen', stappen: [4], documentSoorten: [] });
  });

  test('interne notitie gaat naar POST /admin/kyb/:id/notitie', async () => {
    renderPaneel();
    fireEvent.change(screen.getByLabelText(/interne notitie/i), { target: { value: 'KvK gebeld, klopt.' } });
    fireEvent.click(screen.getByRole('button', { name: /notitie opslaan/i }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/admin/kyb/k1/notitie', { method: 'POST', body: { notitie: 'KvK gebeld, klopt.' } }));
  });

  test('serverfout bij besluit wordt getoond', async () => {
    apiFetch.mockRejectedValueOnce(new Error('Vink eerst alle controlepunten af.'));
    renderPaneel();
    vinkAlles();
    fireEvent.click(screen.getByRole('button', { name: /^goedkeuren$/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^goedkeuren$/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/controlepunten/i));
  });
});
