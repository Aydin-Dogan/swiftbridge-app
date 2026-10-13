/**
 * OudAdresNaarApp — mails en de terugkeer na iDEAL verwezen naar /dashboard,
 * /overmaken, /kyc, /transacties en /profiel. Die pagina's bestaan niet; de
 * klant zag een foutpagina. Al verstuurde mails blijven werken doordat deze
 * adressen naar /app doorsturen, met behoud van de zoekparameters.
 */
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import OudAdresNaarApp from './OudAdresNaarApp';
import { OUDE_APP_PADEN } from '../lib/oudeAppPaden';

function Waar() {
  const l = useLocation();
  return <p data-testid="waar">{l.pathname + l.search}</p>;
}

function start(pad) {
  render(
    <MemoryRouter initialEntries={[pad]}>
      <Routes>
        {OUDE_APP_PADEN.map((p) => <Route key={p} path={p} element={<OudAdresNaarApp />} />)}
        <Route path="/app" element={<Waar />} />
      </Routes>
    </MemoryRouter>,
  );
  return screen.getByTestId('waar').textContent;
}

describe('OudAdresNaarApp', () => {
  test('terugkeer na iDEAL: /dashboard?payment=… gaat naar /app?payment=…', () => {
    expect(start('/dashboard?payment=abc-123')).toBe('/app?payment=abc-123');
  });

  test.each(['/overmaken', '/kyc', '/transacties', '/transacties/tx1/pdf', '/profiel'])('%s gaat naar /app', (pad) => {
    expect(start(pad)).toBe('/app');
  });
});
