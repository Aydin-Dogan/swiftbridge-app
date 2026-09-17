/**
 * kybTestHulp.jsx — hulpfuncties voor de KYB-tests (fetch-mock op basis van
 * pad + methode, render-wrapper met MemoryRouter + TaalProvider).
 * Geen echte persoonsgegevens: alleen fictieve "Oefen"-data.
 */
/* eslint-disable react-refresh/only-export-components -- testhulp, geen app-code: fast refresh is hier niet van toepassing */
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { TaalProvider } from '../../i18n';

/**
 * Maakt een fetch-mock. routes: [{ methode?, pad (string-suffix of RegExp), status?, body (object of fn(opties)) }]
 * Niet-gemockte aanroepen geven 404 zodat een test nooit stil "slaagt" op een echte call.
 */
export function maakFetchMock(routes = []) {
  return vi.fn(async (url, opties = {}) => {
    const u = String(url);
    const m = String(opties.method || 'GET').toUpperCase();
    for (const r of routes) {
      const methode = String(r.methode || 'GET').toUpperCase();
      const past = typeof r.pad === 'string' ? u.includes(r.pad) : r.pad.test(u);
      if (methode === m && past) {
        const body = typeof r.body === 'function' ? r.body(opties, u) : r.body;
        return new Response(JSON.stringify(body ?? {}), {
          status: r.status || 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return new Response(JSON.stringify({ error: `niet gemockt: ${m} ${u}`, errorCode: 'NOT_FOUND' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/** Toont het huidige pad + querystring, handig om redirects te controleren. */
export function LocatieSpion() {
  const loc = useLocation();
  return <div data-testid="locatie">{loc.pathname}{loc.search}</div>;
}

export function renderMetRouter(ui, { pad = '/', extraRoutes = null } = {}) {
  return render(
    <MemoryRouter initialEntries={[pad]}>
      <TaalProvider>
        {extraRoutes ? (
          <Routes>
            <Route path="*" element={ui} />
            {extraRoutes}
          </Routes>
        ) : ui}
      </TaalProvider>
    </MemoryRouter>
  );
}

/** Zet de app-taal op Nederlands (jsdom heeft navigator.language en-US). */
export function forceerNederlands() {
  try { localStorage.setItem('swiftbridge_taal', 'nl'); } catch { /* setup-mock */ }
}

export const OEFEN_ACCOUNT = {
  naam: 'Oefen Aanvrager',
  email: 'oefen@voorbeeld.test',
  emailGeverifieerd: true,
  telefoon: '+31600000000',
  adres: null,
  kycStatus: 'niet_ingediend',
  idinStatus: null,
  apparaatGekoppeld: false,
  passkeys: 0,
};

export function oefenAanvraag(extra = {}) {
  return {
    id: 'kyb-oefen-1',
    versie: 1,
    status: 'concept',
    stappenVoltooid: [],
    volgendeStap: 1,
    bedrijf: { kvkNummer: '00000001', bedrijfsnaam: 'Oefen Handel B.V.' },
    ubos: [],
    persoon: {},
    toestel: {},
    gebruik: {},
    identiteit: {},
    aanvullend: {},
    toestemming: {},
    documenten: [],
    ...extra,
  };
}
