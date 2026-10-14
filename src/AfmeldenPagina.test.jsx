/**
 * /afmelden — afmelden voor herinneringen met één klik, zonder inloggen
 * (ronde 3, onderdeel 8; besluit Aydin 14-10-2026).
 *
 * De herinneringsmail heeft onderaan de link APP_URL/afmelden?token=..&taal=..
 * (swiftbridge-api src/services/emailService.js); een GET op de API-route
 * stuurt hierheen zonder taal. Deze test bewijst:
 * - de pagina is openbaar: uitgelogd geen omweg via inloggen, geen foutpagina;
 * - bij het laden GEEN POST (review ronde 3): linkscanners die links in een
 *   sandbox met JavaScript openen (Defender Safe Links, Proofpoint, Mimecast)
 *   zouden de klant anders al afmelden voordat hij de mail heeft gezien. Pas
 *   de knop 'Geen herinneringen meer' doet precies één POST /users/afmelden
 *   met alleen { token } in de body, het token niet in het adres van de
 *   aanroep (ook onder StrictMode). Eén klik vanuit het mailprogramma loopt
 *   via List-Unsubscribe-Post op de API;
 * - geen info-lek: de API antwoordt altijd { ok: true }, de pagina toont dus
 *   voor elk token dezelfde neutrale bevestiging en vraagt verder niets op;
 * - in de taal van de mail (?taal=), anders de taal van de app; ?taal= is
 *   alleen voor deze pagina: niets in localStorage, geen PATCH naar de server,
 *   en daarna weer de bewaarde taal;
 * - een storing (500, 429, geen verbinding) geeft 'Opnieuw proberen';
 * - zonder token gaat er niets naar de server;
 * - het token komt niet in de console.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { TaalProvider } from './i18n';
import { nl } from './i18n/nl';
import { en } from './i18n/en';
import { tr } from './i18n/tr';
import { ru } from './i18n/ru';
import { az } from './i18n/az';

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
vi.mock('./pages/NotFound', () => ({ default: () => <p>FOUTPAGINA</p> }));
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

const TALEN = { nl, en, tr, ru, az };
// Zelfde vorm als lib/afmeldToken.js in de API: base64url '.' 64 hex.
const TOKEN = 'eyJ1IjoiMTIzIiwiZCI6ImhlcmlubmVyaW5nZW4iLCJ2IjoxNzk5OTk5OTk5fQ.' + 'a1'.repeat(32);
const KLANT = { id: 'u1', naam: 'Oefen Klant', email: 'oefen@voorbeeld.test', kycStatus: 'goedgekeurd', accountType: 'particulier' };

function start(pad, { streng = false } = {}) {
  window.history.replaceState({}, '', pad);
  const app = <TaalProvider><App /></TaalProvider>;
  render(streng ? <StrictMode>{app}</StrictMode> : app);
}

const afmeldAanroepen = () => apiFetch.mock.calls.filter(([pad]) => String(pad).startsWith('/users/afmelden'));

// De klant klikt op 'Geen herinneringen meer'.
async function klik(d = nl) {
  fireEvent.click(await screen.findByRole('button', { name: d.afmelden_knop }));
}

// Laat lopende effecten en aanroepen afronden.
async function rustig() {
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}

let consoleSpies;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('swiftbridge_taal', 'nl');
  apiFetch.mockReset();
  apiFetch.mockImplementation(async (pad) => {
    if (pad === '/auth/pin/status') return { ingeschakeld: false };
    if (pad === '/users/me') return { taal: 'nl' };
    return { ok: true };
  });
  haalProfiel.mockReset();
  haalProfiel.mockResolvedValue(null);
  window.scrollTo = vi.fn();
  consoleSpies = ['log', 'info', 'warn', 'error', 'debug'].map((m) => vi.spyOn(console, m));
});

afterEach(() => {
  consoleSpies.forEach((s) => s.mockRestore());
  window.history.replaceState({}, '', '/');
});

describe('/afmelden: één klik, zonder inloggen', () => {
  test('bij het laden gaat er niets naar de server: een linkscanner meldt niemand af', async () => {
    start(`/afmelden?token=${TOKEN}&taal=nl`);

    expect(await screen.findByText(nl.afmelden_vraag_titel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: nl.afmelden_knop })).toBeInTheDocument();
    await rustig();
    expect(afmeldAanroepen()).toHaveLength(0);
    expect(screen.queryByText(nl.afmelden_klaar_titel)).not.toBeInTheDocument();
  });

  test('uitgelogd: de pagina zelf, niet inloggen en niet de foutpagina', async () => {
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();

    expect(await screen.findByText(nl.afmelden_klaar_titel)).toBeInTheDocument();
    expect(screen.getByText(nl.afmelden_klaar_uitleg)).toBeInTheDocument();
    expect(screen.queryByTestId('inloggen')).not.toBeInTheDocument();
    expect(screen.queryByText('FOUTPAGINA')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/afmelden');
  });

  test('na de klik precies één POST /users/afmelden met alleen { token } in de body', async () => {
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();
    await screen.findByText(nl.afmelden_klaar_titel);

    expect(afmeldAanroepen()).toHaveLength(1);
    const [pad, opties] = afmeldAanroepen()[0];
    // Het token niet in het adres van de aanroep: dat komt in logs van servers en proxy's.
    expect(pad).toBe('/users/afmelden');
    expect(opties.method).toBe('POST');
    expect(opties.body).toEqual({ token: TOKEN });
  });

  test('ook onder StrictMode (effecten draaien dan twee keer): laden geen POST, de klik één', async () => {
    start(`/afmelden?token=${TOKEN}&taal=nl`, { streng: true });
    await screen.findByRole('button', { name: nl.afmelden_knop });
    await rustig();
    expect(afmeldAanroepen()).toHaveLength(0);

    await klik();
    await screen.findByText(nl.afmelden_klaar_titel);
    await rustig();
    expect(afmeldAanroepen()).toHaveLength(1);
  });

  test('ingelogd werkt het net zo: geen omleiding naar de app', async () => {
    haalProfiel.mockResolvedValue(KLANT);
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();

    expect(await screen.findByText(nl.afmelden_klaar_titel)).toBeInTheDocument();
    expect(afmeldAanroepen()).toHaveLength(1);
    expect(screen.queryByText('DASHBOARD')).not.toBeInTheDocument();
  });

  test("'Naar mijn voorkeuren' gaat uitgelogd eerst naar inloggen, met next naar Profiel", async () => {
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    fireEvent.click(await screen.findByRole('button', { name: nl.afmelden_naar_voorkeuren }));

    const inloggen = await screen.findByTestId('inloggen');
    const adres = new URL(inloggen.textContent, 'http://x');
    expect(adres.pathname).toBe('/login');
    expect(adres.searchParams.get('next')).toBe('/app?tab=profiel');
  });
});

// Review ronde 3: de API geeft bij een afgekapte, verlopen of vervalste link
// 400 LINK_ONGELDIG (vóór er een account wordt opgezocht). Opnieuw proberen
// helpt dan nooit; de klant moet naar de schakelaar in Profiel.
describe('ongeldige of verlopen link', () => {
  function apiZegtOngeldig() {
    apiFetch.mockImplementation(async (pad) => {
      if (pad === '/users/afmelden') {
        const fout = new Error('Deze link is niet compleet of niet meer geldig.');
        fout.status = 400;
        fout.errorCode = 'LINK_ONGELDIG';
        throw fout;
      }
      if (pad === '/auth/pin/status') return { ingeschakeld: false };
      if (pad === '/users/me') return { taal: 'nl' };
      return { ok: true };
    });
  }

  test('de klant leest dat de link niet werkt, niet "afgemeld" en niet "probeer opnieuw"', async () => {
    apiZegtOngeldig();
    start('/afmelden?token=afgekapt.00&taal=nl');
    await klik();

    expect(await screen.findByText(nl.afmelden_onvolledig_titel)).toBeInTheDocument();
    expect(nl.afmelden_onvolledig_titel).toMatch(/niet meer geldig/);
    expect(screen.queryByText(nl.afmelden_klaar_titel)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: nl.afmelden_opnieuw })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: nl.afmelden_naar_voorkeuren })).toBeInTheDocument();
  });

  test('een storing (500) geeft wel "opnieuw proberen"', async () => {
    apiFetch.mockImplementation(async (pad) => {
      if (pad === '/users/afmelden') { const f = new Error('Server fout'); f.status = 500; throw f; }
      return { ok: true };
    });
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();

    expect(await screen.findByRole('button', { name: nl.afmelden_opnieuw })).toBeInTheDocument();
  });
});

describe('geen info-lek', () => {
  test('een vervalst token geeft precies dezelfde pagina als een echt token', async () => {
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();
    await screen.findByText(nl.afmelden_klaar_titel);
    const echt = document.body.textContent;
    cleanup();

    start('/afmelden?token=vervalst.0000&taal=nl');
    await klik();
    await screen.findByText(nl.afmelden_klaar_titel);
    expect(document.body.textContent).toBe(echt);
  });

  test('de pagina vraagt niets anders op dan de afmelding: geen profiel, geen account', async () => {
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();
    await screen.findByText(nl.afmelden_klaar_titel);

    expect(apiFetch.mock.calls.map(([pad]) => pad)).toEqual(['/users/afmelden']);
    expect(screen.queryByText(KLANT.email)).not.toBeInTheDocument();
  });

  test('het token komt niet in de console', async () => {
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();
    await screen.findByText(nl.afmelden_klaar_titel);
    apiFetch.mockRejectedValueOnce(Object.assign(new Error('Server fout'), { status: 500 }));
    cleanup();
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();
    await screen.findByText(nl.afmelden_fout_titel);

    const alles = consoleSpies.flatMap((s) => s.mock.calls.flat()).map((a) => {
      try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); }
    }).join('\n');
    expect(alles).not.toContain(TOKEN);
  });
});

describe('in de taal van de klant', () => {
  test.each(Object.keys(TALEN))('?taal=%s: de vraag, de knop en de bevestiging in die taal', async (taal) => {
    start(`/afmelden?token=${TOKEN}&taal=${taal}`);
    const d = TALEN[taal];
    expect(await screen.findByText(d.afmelden_vraag_titel)).toBeInTheDocument();
    expect(screen.getByText(d.afmelden_vraag_uitleg)).toBeInTheDocument();
    await klik(d);
    expect(await screen.findByText(d.afmelden_klaar_titel)).toBeInTheDocument();
    expect(screen.getByText(d.afmelden_klaar_uitleg)).toBeInTheDocument();
    // Ook hier: welke mails altijd komen.
    expect(screen.getByText(d.notif_altijd)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: d.afmelden_naar_voorkeuren })).toBeInTheDocument();
  });

  test('zonder ?taal= (via de doorverwijzing van de API): de taal van de app', async () => {
    localStorage.setItem('swiftbridge_taal', 'ru');
    start(`/afmelden?token=${TOKEN}`);
    expect(await screen.findByText(ru.afmelden_vraag_titel)).toBeInTheDocument();
    await klik(ru);
    expect(await screen.findByText(ru.afmelden_klaar_titel)).toBeInTheDocument();
  });

  test('een onbekende ?taal= negeren: de taal van de app', async () => {
    localStorage.setItem('swiftbridge_taal', 'en');
    start(`/afmelden?token=${TOKEN}&taal=de`);
    expect(await screen.findByText(en.afmelden_vraag_titel)).toBeInTheDocument();
  });

  test('de vier talen naast nl zijn echt vertaald, niet de Nederlandse tekst', () => {
    const sleutels = Object.keys(nl).filter((k) => k.startsWith('afmelden_'));
    expect(sleutels.length).toBeGreaterThanOrEqual(11);
    for (const taal of ['en', 'tr', 'ru', 'az']) {
      for (const sleutel of sleutels) {
        expect(TALEN[taal][sleutel], `${taal}.${sleutel}`).toBeTruthy();
        expect(TALEN[taal][sleutel], `${taal}.${sleutel}`).not.toBe(nl[sleutel]);
      }
    }
  });

  test('geen termijn, geen "gratis" en geen snelheidsbelofte in deze teksten', () => {
    const verboden = /gratis|free\b|ücretsiz|бесплатн|pulsuz|\d+\s*(uur|dag|hours?|days?|saat|gün|час|дн|saat|gün)|minu|dakika|минут|dəqiq/iu;
    for (const taal of Object.keys(TALEN)) {
      for (const [sleutel, waarde] of Object.entries(TALEN[taal])) {
        if (!/^(afmelden_|notif_herinneringen_|notif_altijd)/.test(sleutel)) continue;
        expect(verboden.test(waarde), `${taal}.${sleutel}: ${waarde}`).toBe(false);
      }
    }
  });
});

// ?taal= is alleen de taal van deze pagina (review ronde 3). Een oude mail in
// het Nederlands mag de taal die de klant later koos niet terugzetten: niet in
// localStorage, en niet op de server, want mails en pushberichten volgen
// gebruikers.taal.
describe('?taal= geldt alleen voor deze pagina', () => {
  const taalPatches = () => apiFetch.mock.calls.filter(([pad, o]) => pad === '/users/me' && o?.method === 'PATCH');

  test('de pagina staat in de taal van de mail; de bewaarde taal blijft', async () => {
    localStorage.setItem('swiftbridge_taal', 'tr');
    start(`/afmelden?token=${TOKEN}&taal=nl`);

    expect(await screen.findByText(nl.afmelden_vraag_titel)).toBeInTheDocument();
    await rustig();
    expect(localStorage.getItem('swiftbridge_taal')).toBe('tr');
  });

  test('ingelogd, Turks op de server: geen PATCH /users/me naar de taal van de mail', async () => {
    localStorage.setItem('swiftbridge_taal', 'tr');
    haalProfiel.mockResolvedValue(KLANT);
    apiFetch.mockImplementation(async (pad, o) => {
      if (pad === '/auth/pin/status') return { ingeschakeld: false };
      if (pad === '/users/me' && !o?.method) return { taal: 'tr' };
      return { ok: true };
    });
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();
    await screen.findByText(nl.afmelden_klaar_titel);
    await rustig();

    expect(taalPatches()).toHaveLength(0);
    expect(localStorage.getItem('swiftbridge_taal')).toBe('tr');
  });

  test('na de pagina staat de app weer in de bewaarde taal', async () => {
    localStorage.setItem('swiftbridge_taal', 'tr');
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();
    fireEvent.click(await screen.findByRole('button', { name: nl.afmelden_naar_voorkeuren }));

    expect(await screen.findByTestId('inloggen')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('tr');
    expect(localStorage.getItem('swiftbridge_taal')).toBe('tr');
  });

  test('de taalkiezer op de pagina is wel een bewuste keuze: die blijft bewaard', async () => {
    localStorage.setItem('swiftbridge_taal', 'tr');
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await screen.findByText(nl.afmelden_vraag_titel);

    fireEvent.click(screen.getByTitle('Kies taal'));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(await screen.findByText(en.afmelden_vraag_titel)).toBeInTheDocument();
    expect(localStorage.getItem('swiftbridge_taal')).toBe('en');
  });
});

describe('storing en ontbrekend token', () => {
  test.each([
    ['500', Object.assign(new Error('Server fout'), { status: 500 })],
    ['429', Object.assign(new Error('Te veel verzoeken'), { status: 429, errorCode: 'RATE_LIMITED' })],
    ['geen verbinding', Object.assign(new Error('Kan de server niet bereiken'), { status: 0, netwerk: true })],
  ])('%s: een foutmelding, en "Opnieuw proberen" stuurt nog één POST', async (_naam, fout) => {
    apiFetch.mockRejectedValueOnce(fout);
    start(`/afmelden?token=${TOKEN}&taal=nl`);
    await klik();

    expect(await screen.findByText(nl.afmelden_fout_titel)).toBeInTheDocument();
    expect(screen.queryByText(nl.afmelden_klaar_titel)).not.toBeInTheDocument();
    // Geen ruwe servertekst op het scherm.
    expect(screen.queryByText(fout.message)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: nl.afmelden_opnieuw }));
    expect(await screen.findByText(nl.afmelden_klaar_titel)).toBeInTheDocument();
    expect(afmeldAanroepen()).toHaveLength(2);
    expect(afmeldAanroepen()[1][1].body).toEqual({ token: TOKEN });
  });

  test.each(['/afmelden', '/afmelden?taal=en', '/afmelden?token='])('%s: niets naar de server, wel de weg naar Profiel', async (pad) => {
    start(pad);
    const d = pad.includes('taal=en') ? en : nl;

    expect(await screen.findByText(d.afmelden_onvolledig_titel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: d.afmelden_naar_voorkeuren })).toBeInTheDocument();
    expect(afmeldAanroepen()).toHaveLength(0);
    expect(screen.queryByText(d.afmelden_klaar_titel)).not.toBeInTheDocument();
    // Zonder token ook geen knop die niets kan doen.
    expect(screen.queryByRole('button', { name: d.afmelden_knop })).not.toBeInTheDocument();
  });
});
