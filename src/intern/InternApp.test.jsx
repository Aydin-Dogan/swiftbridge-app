/**
 * InternApp.test.jsx — de routes van de interne omgeving na onderdeel 7.
 *
 * /beheer (AdminPanel) is weg (besluit Aydin, 14-10-2026): die pagina nam
 * KYC-besluiten buiten het dossier om en vroeg een gedeeld geheim in de
 * adresbalk. Een oude bladwijzer naar /intern/beheer komt nu op de
 * compliancewerkplek uit, waar de vastgehouden uitbetalingen staan, en niet op
 * "pagina niet gevonden".
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import InternApp from './InternApp';

vi.mock('./AdminCompliance', () => ({ default: () => <div>COMPLIANCE-WERKPLEK</div> }));
vi.mock('./AdminOverzicht', () => ({ default: () => <div>OVERZICHT</div> }));
vi.mock('./AdminErrors', () => ({ default: () => <div>FOUTEN</div> }));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (String(url).endsWith('/intern/auth/ik')) {
      return { ok: true, status: 200, json: async () => ({ medewerker: { naam: 'Oefen Medewerker', rol: 'compliance_officer' } }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.pushState({}, '', '/');
});

function opPad(pad) {
  window.history.pushState({}, '', pad);
  return render(<InternApp />);
}

describe('routes van de interne omgeving', () => {
  test('/intern/beheer gaat naar de compliancewerkplek', async () => {
    opPad('/intern/beheer?secret=oud');
    expect(await screen.findByText('COMPLIANCE-WERKPLEK')).toBeInTheDocument();
    expect(screen.queryByText(/Pagina niet gevonden/)).toBeNull();
    // En het geheim blijft niet in de adresbalk staan.
    await waitFor(() => expect(window.location.pathname).toMatch(/^\/intern\/?$/));
    expect(window.location.search).toBe('');
  });

  test('overzicht en fouten blijven bereikbaar', async () => {
    opPad('/intern/fouten');
    expect(await screen.findByText('FOUTEN')).toBeInTheDocument();
  });
});
