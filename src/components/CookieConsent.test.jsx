/**
 * Tests voor CookieConsent + useCookieConsent hook.
 *
 * Bewaakt:
 *   - banner verschijnt bij eerste bezoek (geen localStorage)
 *   - banner verbergt na keuze
 *   - 'Accept all' zet analytics + marketing op true
 *   - 'Reject all' houdt analytics + marketing op false
 *   - necessary is ALTIJD true (verplicht)
 *   - versie-check reset bij bump
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TaalProvider } from '../i18n';
import CookieConsent from './CookieConsent';

const STORAGE_KEY = 'swiftbridge_cookie_consent';

function renderBanner() {
  return render(
    <MemoryRouter>
      <TaalProvider>
        <CookieConsent />
      </TaalProvider>
    </MemoryRouter>
  );
}

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('toont banner bij eerste bezoek (geen localStorage entry)', () => {
    renderBanner();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('verbergt banner als gebruiker al beslist heeft', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: false,
        version: 1,
        timestamp: '2026-05-25T00:00:00Z',
      })
    );
    renderBanner();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('Accept all → analytics + marketing op true in localStorage', () => {
    renderBanner();
    const accept = screen.getByText(/accepteren|accept|kabul|принять|qəbul/i);
    fireEvent.click(accept);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.necessary).toBe(true);
    expect(stored.analytics).toBe(true);
    expect(stored.marketing).toBe(true);
    expect(stored.timestamp).toBeTruthy();
  });

  test('Reject all → analytics + marketing op false maar necessary blijft true', () => {
    renderBanner();
    // "Alleen noodzakelijk" / "Necessary only" / etc.
    const reject = screen.getByText(/noodzakelijk|necessary only|sadece gerekli|только необходимые|yalnız zəruri/i);
    fireEvent.click(reject);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.necessary).toBe(true);
    expect(stored.analytics).toBe(false);
    expect(stored.marketing).toBe(false);
  });

  test('versie-bump reset consent (oude versie wordt genegeerd)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: true,
        version: 0, // oude versie
        timestamp: '2025-01-01T00:00:00Z',
      })
    );
    renderBanner();
    // Banner verschijnt OPNIEUW omdat versie niet matcht
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('corrupt localStorage entry → banner verschijnt (fallback default)', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');
    renderBanner();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
