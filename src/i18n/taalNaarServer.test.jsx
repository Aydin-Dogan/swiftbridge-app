/**
 * De server kent de taal van de klant (ronde 3, onderdeel 5).
 *
 * Mails en pushberichten volgen gebruikers.taal op de server. Die bleef op 'nl'
 * staan, want de app gaf een taalwissel nooit door. Nu gaat er bij inloggen en
 * bij elke taalwissel (zetTaal) één PATCH /users/me met alleen {taal}: alleen
 * voor een ingelogde klant, en alleen als de server een andere taal heeft.
 * Profiel stuurt bij opslaan het hele formulier; dat mag hier niet, want dan
 * zou een taalwissel ook naam en adres meesturen.
 * Mislukt de PATCH, dan wisselt de taal in de app toch.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';

vi.mock('../services/api', () => ({ apiFetch: vi.fn() }));
import { apiFetch } from '../services/api';
import { TaalProvider, useTaal } from './index';

// De taalcontext van de laatste render, om zetTaal en koppelAccount aan te roepen.
const gevangen = { ctx: null };
function Kijker() {
  const ctx = useTaal();
  useEffect(() => { gevangen.ctx = ctx; });
  return <p data-testid="tab">{ctx.t('tab_profiel')}</p>;
}
const taalCtx = {
  zetTaal: (...a) => gevangen.ctx.zetTaal(...a),
  herstelTaal: (...a) => gevangen.ctx.herstelTaal(...a),
  koppelAccount: (...a) => gevangen.ctx.koppelAccount(...a),
};

function start() {
  render(<TaalProvider><Kijker /></TaalProvider>);
}

// Laat de lopende aanroepen naar de server afronden.
async function rustig() {
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}

const patches = () => apiFetch.mock.calls.filter(([, o]) => o?.method === 'PATCH');
const lezingen = () => apiFetch.mock.calls.filter(([, o]) => !o?.method || o.method === 'GET');

beforeEach(() => {
  apiFetch.mockReset();
  apiFetch.mockImplementation((_pad, o) => Promise.resolve(
    o?.method === 'PATCH' ? { gebruiker: { taal: o.body.taal } } : { taal: 'nl' },
  ));
  localStorage.clear();
  localStorage.setItem('swiftbridge_taal', 'nl');
});

describe('taalwissel naar de server', () => {
  test('ingelogd en zetTaal("tr"): precies één PATCH /users/me met alleen {taal: "tr"}', async () => {
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'nl' }));
    act(() => taalCtx.zetTaal('tr'));
    await rustig();

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [pad, opties] = apiFetch.mock.calls[0];
    expect(pad).toBe('/users/me');
    expect(opties.method).toBe('PATCH');
    // Alleen de taal: geen naam, telefoon of adres.
    expect(Object.keys(opties.body)).toEqual(['taal']);
    expect(opties.body.taal).toBe('tr');
    expect(screen.getByTestId('tab').textContent).toBe('Profil');
  });

  test('uitgelogd: geen aanroep, de taal wisselt wel', async () => {
    start();
    act(() => taalCtx.zetTaal('tr'));
    await rustig();

    expect(apiFetch).not.toHaveBeenCalled();
    expect(screen.getByTestId('tab').textContent).toBe('Profil');
  });

  test('na uitloggen: geen aanroep meer', async () => {
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'nl' }));
    act(() => taalCtx.koppelAccount(null));
    act(() => taalCtx.zetTaal('tr'));
    await rustig();

    expect(apiFetch).not.toHaveBeenCalled();
  });

  test('netwerkfout: de taal wisselt toch', async () => {
    apiFetch.mockImplementation(() => Promise.reject(
      Object.assign(new Error('Kan de server niet bereiken'), { status: 0, netwerk: true }),
    ));
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'nl' }));
    act(() => taalCtx.zetTaal('tr'));
    await rustig();

    expect(patches()).toHaveLength(1);
    expect(screen.getByTestId('tab').textContent).toBe('Profil');
    expect(document.documentElement.lang).toBe('tr');
    expect(localStorage.getItem('swiftbridge_taal')).toBe('tr');
  });

  test('na een mislukte PATCH probeert de volgende wissel het opnieuw', async () => {
    apiFetch.mockImplementationOnce(() => Promise.reject(new Error('500')));
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'nl' }));
    act(() => taalCtx.zetTaal('tr'));
    await rustig();
    act(() => taalCtx.zetTaal('en'));
    await rustig();

    expect(patches().map(([, o]) => o.body.taal)).toEqual(['tr', 'en']);
  });

  test('de server heeft dezelfde taal al: geen PATCH', async () => {
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'tr' }));
    act(() => taalCtx.zetTaal('tr'));
    await rustig();

    expect(apiFetch).not.toHaveBeenCalled();
  });

  test('tweemaal dezelfde taal kiezen: één PATCH', async () => {
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'nl' }));
    act(() => taalCtx.zetTaal('tr'));
    await rustig();
    act(() => taalCtx.zetTaal('tr'));
    await rustig();

    expect(patches()).toHaveLength(1);
  });

  test('snel na elkaar wisselen: de laatste keuze komt als laatste aan', async () => {
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'nl' }));
    act(() => {
      taalCtx.zetTaal('tr');
      taalCtx.zetTaal('en');
    });
    await rustig();

    expect(patches().map(([, o]) => o.body.taal)).toEqual(['tr', 'en']);
  });

  // GET /auth/me (het profiel na inloggen) geeft de taal niet mee. Dan leest de
  // app hem één keer uit GET /users/me, zodat er alleen bij een verschil een
  // PATCH (en dus een regel in het auditlog) bijkomt.
  test('taal van de server onbekend: eerst lezen, PATCH alleen bij verschil', async () => {
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1' }));
    act(() => taalCtx.zetTaal('tr'));
    await rustig();
    act(() => taalCtx.zetTaal('tr'));
    await rustig();

    expect(lezingen()).toHaveLength(1);
    expect(lezingen()[0][0]).toBe('/users/me');
    expect(patches()).toHaveLength(1);
    expect(patches()[0][1].body).toEqual({ taal: 'tr' });
  });

  test('taal van de server onbekend en gelijk: geen PATCH', async () => {
    apiFetch.mockImplementation(() => Promise.resolve({ taal: 'tr' }));
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1' }));
    act(() => taalCtx.zetTaal('tr'));
    await rustig();

    expect(patches()).toHaveLength(0);
  });
});

// De afmeldpagina toont de taal van de mail (?taal=). Dat is geen keuze van de
// klant: een oude mail mag zijn taal niet terugzetten (review ronde 3).
describe('alleen weergeven: zetTaal(taal, { bewaar: false })', () => {
  test('wisselt wat je ziet, maar niets in localStorage en niets naar de server', async () => {
    localStorage.setItem('swiftbridge_taal', 'tr');
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'tr' }));
    act(() => taalCtx.zetTaal('nl', { bewaar: false }));
    await rustig();

    expect(screen.getByTestId('tab').textContent).toBe('Profiel');
    expect(document.documentElement.lang).toBe('nl');
    expect(localStorage.getItem('swiftbridge_taal')).toBe('tr');
    expect(apiFetch).not.toHaveBeenCalled();
  });

  test('herstelTaal zet de bewaarde taal terug, zonder aanroep', async () => {
    localStorage.setItem('swiftbridge_taal', 'tr');
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'nl' }));
    act(() => taalCtx.zetTaal('nl', { bewaar: false }));
    act(() => taalCtx.herstelTaal());
    await rustig();

    expect(screen.getByTestId('tab').textContent).toBe('Profil');
    expect(document.documentElement.lang).toBe('tr');
    expect(apiFetch).not.toHaveBeenCalled();
  });

  test('daarna een echte keuze: die wordt wel bewaard en gaat naar de server', async () => {
    localStorage.setItem('swiftbridge_taal', 'tr');
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'tr' }));
    act(() => taalCtx.zetTaal('nl', { bewaar: false }));
    act(() => taalCtx.zetTaal('en'));
    act(() => taalCtx.herstelTaal());
    await rustig();

    expect(screen.getByTestId('tab').textContent).toBe('Profile');
    expect(localStorage.getItem('swiftbridge_taal')).toBe('en');
    expect(patches().map(([, o]) => o.body)).toEqual([{ taal: 'en' }]);
  });
});

describe('taal naar de server bij inloggen en registreren', () => {
  test('de app spreekt Engels, de server heeft Nederlands: één PATCH {taal: "en"}', async () => {
    localStorage.setItem('swiftbridge_taal', 'en');
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'nl' }, { naarServer: true }));
    await rustig();

    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch.mock.calls[0][0]).toBe('/users/me');
    expect(apiFetch.mock.calls[0][1]).toMatchObject({ method: 'PATCH', body: { taal: 'en' } });
    expect(Object.keys(apiFetch.mock.calls[0][1].body)).toEqual(['taal']);
  });

  test('zelfde taal als de server: geen PATCH', async () => {
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'nl' }, { naarServer: true }));
    await rustig();

    expect(apiFetch).not.toHaveBeenCalled();
  });

  test('profiel zonder taal (zoals /auth/me): lezen, en alleen bij verschil een PATCH', async () => {
    localStorage.setItem('swiftbridge_taal', 'ru');
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1' }, { naarServer: true }));
    await rustig();

    expect(lezingen()).toHaveLength(1);
    expect(patches()).toHaveLength(1);
    expect(patches()[0][1].body).toEqual({ taal: 'ru' });
  });

  test('alleen bekendmaken (opstarten met een bestaande sessie): geen aanroep', async () => {
    localStorage.setItem('swiftbridge_taal', 'en');
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'nl' }));
    await rustig();

    expect(apiFetch).not.toHaveBeenCalled();
  });

  test('een andere klant logt in: de taal van de vorige telt niet', async () => {
    start();
    act(() => taalCtx.koppelAccount({ id: 'u1', taal: 'tr' }));
    act(() => taalCtx.koppelAccount(null));
    act(() => taalCtx.koppelAccount({ id: 'u2' }));
    act(() => taalCtx.zetTaal('tr'));
    await rustig();

    // u2 heeft op de server 'nl' (GET /users/me in de nabootsing).
    expect(lezingen()).toHaveLength(1);
    expect(patches()).toHaveLength(1);
    expect(patches()[0][1].body).toEqual({ taal: 'tr' });
  });
});
