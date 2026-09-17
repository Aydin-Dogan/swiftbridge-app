/**
 * Tests KybDocumentKnop — documenten openen via fetch (credentials) -> blob -> window.open (nooit iframe).
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaalProvider } from '../../../i18n';
import KybDocumentKnop from './KybDocumentKnop';

vi.mock('../../../services/api', () => ({
  API_URL: 'http://api.test',
  apiFetch: vi.fn(),
  parseError: (e) => e?.message || 'fout',
}));

function renderKnop(props) {
  return render(
    <TaalProvider>
      <KybDocumentKnop pad="/admin/kyb/a1/document/d1" {...props} />
    </TaalProvider>
  );
}

describe('KybDocumentKnop', () => {
  const origOpen = window.open;
  const origCreate = URL.createObjectURL;
  const origRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    localStorage.setItem('swiftbridge_taal', 'nl'); // jsdom meldt 'en-US'; teksten in deze tests zijn NL
    URL.createObjectURL = vi.fn(() => 'blob:http://app.test/abc');
    URL.revokeObjectURL = vi.fn();
    globalThis.fetch = vi.fn(async () => ({ ok: true, blob: async () => new Blob(['%PDF-'], { type: 'application/pdf' }) }));
  });

  afterEach(() => {
    window.open = origOpen;
    URL.createObjectURL = origCreate;
    URL.revokeObjectURL = origRevoke;
    vi.restoreAllMocks();
  });

  test('haalt het document op met credentials en opent de blob-URL in een nieuw tabblad', async () => {
    window.open = vi.fn(() => null); // pop-up vooraf openen mislukt -> fallback window.open(blobUrl)
    renderKnop();
    fireEvent.click(screen.getByRole('button', { name: /openen/i }));

    await waitFor(() => expect(window.open).toHaveBeenCalledWith('blob:http://app.test/abc', '_blank'));
    expect(globalThis.fetch).toHaveBeenCalledWith('http://api.test/admin/kyb/a1/document/d1', { credentials: 'include' });
    expect(document.querySelector('iframe')).toBeNull();
  });

  test('gebruikt het vooraf geopende tabblad als dat lukt (pop-upblokkering omzeilen)', async () => {
    const venster = { closed: false, location: { href: '' }, close: vi.fn() };
    window.open = vi.fn(() => venster);
    renderKnop();
    fireEvent.click(screen.getByRole('button', { name: /openen/i }));

    await waitFor(() => expect(venster.location.href).toBe('blob:http://app.test/abc'));
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith('', '_blank');
  });

  test('toont een foutmelding en sluit het lege tabblad als de API weigert', async () => {
    const venster = { closed: false, location: { href: '' }, close: vi.fn() };
    window.open = vi.fn(() => venster);
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 403 }));
    renderKnop();
    fireEvent.click(screen.getByRole('button', { name: /openen/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(venster.close).toHaveBeenCalled();
    expect(venster.location.href).toBe('');
  });

  test('toont een eigen label als dat wordt meegegeven', () => {
    window.open = vi.fn(() => null);
    renderKnop({ label: 'Voorkant' });
    expect(screen.getByRole('button', { name: /voorkant/i })).toBeInTheDocument();
  });
});
