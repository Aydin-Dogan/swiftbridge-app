/**
 * PaymentFlowJuridisch.test.jsx — overboekingsflow rendert (stap Bedrag) en de
 * prijsspecificatie linkt naar het Tarievenoverzicht in een nieuw tabblad
 * (juridische documenten v1.0). Alle netwerkverkeer is gemockt (404/lege lijst).
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderMetRouter, forceerNederlands, maakFetchMock } from './kyb/kybTestHulp';
import PaymentFlow from './PaymentFlow';

describe('PaymentFlow: juridische contextlinks', () => {
  let origineleFetch;
  beforeEach(() => {
    forceerNederlands();
    try { sessionStorage.clear(); localStorage.removeItem('swiftbridge_repeat_tx'); } catch { /* setup-mock */ }
    origineleFetch = globalThis.fetch;
    globalThis.fetch = maakFetchMock([
      { pad: '/beneficiaries', body: [] },
      { pad: '/users/me', body: {} },
    ]);
  });
  afterEach(() => { globalThis.fetch = origineleFetch; vi.restoreAllMocks(); });

  test('stap Bedrag toont de prijsspecificatie met link "Hoe onze prijs is opgebouwd" naar /tarieven', async () => {
    renderMetRouter(<PaymentFlow token="oefen-token" />);
    const link = await screen.findByRole('link', { name: 'Hoe onze prijs is opgebouwd' });
    expect(link).toHaveAttribute('href', '/tarieven');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
