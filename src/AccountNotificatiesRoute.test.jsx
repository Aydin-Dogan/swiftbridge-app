/**
 * /account/notificaties — "Voorkeuren beheren" en "Uitschrijven"
 * (?unsubscribe=1) onderaan elke mail (swiftbridge-api
 * src/services/email/base.js) kwamen op een foutpagina (ronde 3, onderdeel 5).
 *
 * - uitgelogd: naar inloggen, met ?next=/app?tab=profiel (Login.jsx volgt
 *   ?next= voor /app-paden, dus daarna komt de klant bij zijn voorkeuren);
 * - ingelogd: de Profiel-tab staat open, bij de meldingsvoorkeuren, en ?tab=
 *   verdwijnt weer uit het adres;
 * - nooit de foutpagina;
 * - ?unsubscribe=1 zet nog niets uit: daarvoor is eerst een ondertekend
 *   afmeldtoken nodig (onderdeel 8).
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TaalProvider } from './i18n';
import { nl } from './i18n/nl';

const apiFetch = vi.fn();
const haalProfiel = vi.fn();
vi.mock('./services/api', async (origineel) => ({
  ...(await origineel()),
  apiFetch: (...a) => apiFetch(...a),
  haalProfiel: (...a) => haalProfiel(...a),
  logout: vi.fn(),
}));

// Zware of netwerkafhankelijke onderdelen die met dit adres niets te maken hebben.
vi.mock('./components/Dashboard', () => ({ default: () => <p>DASHBOARD</p> }));
vi.mock('./components/LiveKoersTicker', () => ({ default: () => null }));
vi.mock('./components/chat/SupportChat', () => ({ default: () => null }));
vi.mock('./components/OfflineBanner', () => ({ default: () => null }));
vi.mock('./components/MaintenanceBanner', () => ({ default: () => null }));
vi.mock('./components/KeyboardShortcuts', () => ({ default: () => null }));
vi.mock('./components/GdprBeheer', () => ({ default: () => null }));
vi.mock('./components/TweeFactorInstellingen', () => ({ default: () => null }));
vi.mock('./components/PasskeyInstellingen', () => ({ default: () => null }));
vi.mock('./components/pin/PinInstellingen', () => ({ default: () => null }));
vi.mock('./components/LoginHistory', () => ({ default: () => null }));
vi.mock('./components/AccountantBeheer', () => ({ default: () => null }));
vi.mock('./components/referral/ReferralKaart', () => ({ default: () => null }));
vi.mock('./components/beneficiaries/BeneficiaryLijst', () => ({ default: () => null }));
vi.mock('./components/EmailWijzigenModal', () => ({ default: () => null }));
vi.mock('./components/onboarding/TourOverlay', () => ({ default: () => null, resetTour: () => {} }));
vi.mock('./pages/NotFound', () => ({ default: () => <p>FOUTPAGINA</p> }));
// Het inlogscherm zelf hoort niet bij deze test: alleen waar de klant landt.
vi.mock('./pages/Login', async () => {
  const { useLocation } = await import('react-router-dom');
  return {
    default: function InlogScherm() {
      const l = useLocation();
      return <p data-testid="inloggen">{l.pathname + l.search}</p>;
    },
  };
});

const { default: App } = await import('./App');

const KLANT = { id: 'u1', naam: 'Oefen Klant', email: 'oefen@voorbeeld.test', kycStatus: 'goedgekeurd', accountType: 'particulier' };
const PROFIEL = {
  ...KLANT,
  taal: 'nl',
  emailOptIn: true,
  pushOptIn: true,
  whatsappOptIn: true,
  adres: { straat: '', huisnummer: '', postcode: '', stad: '', land: 'NL' },
  statistieken: { aantalTransacties: 0, totaalVerstuurdEur: 0 },
};

let fetchNep;

function start(pad) {
  window.history.replaceState({}, '', pad);
  render(<TaalProvider><App /></TaalProvider>);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('swiftbridge_taal', 'nl');
  apiFetch.mockReset();
  apiFetch.mockImplementation(async (pad) => (pad === '/auth/pin/status' ? { ingeschakeld: false } : {}));
  haalProfiel.mockReset();
  // Profiel haalt zijn gegevens met een losse fetch op (GET /users/me).
  fetchNep = vi.fn(async () => ({ ok: true, status: 200, json: async () => PROFIEL }));
  vi.stubGlobal('fetch', fetchNep);
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('/account/notificaties, uitgelogd', () => {
  beforeEach(() => { haalProfiel.mockResolvedValue(null); });

  test.each([
    '/account/notificaties',
    '/account/notificaties?unsubscribe=1',
  ])('%s gaat naar inloggen, met next naar de voorkeuren', async (pad) => {
    start(pad);

    const inloggen = await screen.findByTestId('inloggen');
    const adres = new URL(inloggen.textContent, 'http://x');
    expect(adres.pathname).toBe('/login');
    expect(adres.searchParams.get('next')).toBe('/app?tab=profiel');
    expect(screen.queryByText('FOUTPAGINA')).not.toBeInTheDocument();
  });
});

describe('/account/notificaties, ingelogd', () => {
  beforeEach(() => { haalProfiel.mockResolvedValue(KLANT); });

  test.each([
    '/account/notificaties',
    '/account/notificaties?unsubscribe=1',
    // Na het inloggen stuurt Login.jsx de klant via ?next= hierheen.
    '/app?tab=profiel',
  ])('%s opent Profiel bij de meldingsvoorkeuren', async (pad) => {
    start(pad);

    const titel = await screen.findByText(nl.notif_voorkeuren_titel);
    expect(screen.getByRole('button', { name: nl.tab_profiel, current: 'page' })).toBeInTheDocument();
    expect(screen.queryByText('DASHBOARD')).not.toBeInTheDocument();
    expect(screen.queryByText('FOUTPAGINA')).not.toBeInTheDocument();

    // Het voorkeurenblok schuift in beeld.
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
    const geschoven = Element.prototype.scrollIntoView.mock.contexts[0];
    expect(geschoven.id).toBe('meldingsvoorkeuren');
    expect(geschoven).toContainElement(titel);

    // ?tab= gaat weer uit het adres, zodat verversen gewoon de app opent.
    await waitFor(() => expect(window.location.pathname + window.location.search).toBe('/app'));
  });

  test('?unsubscribe=1 zet nog niets uit', async () => {
    start('/account/notificaties?unsubscribe=1');
    await screen.findByText(nl.notif_voorkeuren_titel);
    await waitFor(() => expect(window.location.pathname).toBe('/app'));

    const patch = (opties) => String(opties?.method || '').toUpperCase() === 'PATCH';
    expect(apiFetch.mock.calls.filter(([, o]) => patch(o))).toHaveLength(0);
    expect(fetchNep.mock.calls.filter(([, o]) => patch(o))).toHaveLength(0);
  });

  test('een ander tabblad dan profiel in ?tab= opent gewoon het overzicht', async () => {
    start('/app?tab=beheer');

    expect(await screen.findByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.queryByText(nl.notif_voorkeuren_titel)).not.toBeInTheDocument();
  });
});
