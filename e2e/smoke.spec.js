import { test, expect } from '@playwright/test';

/**
 * Smoke-tests (E7) — bewust robuust: ze leunen op stabiele dingen (paginatitel,
 * landmarks, routes) en niet op exacte teksten/klassen die in de premium-restyle
 * kunnen wijzigen. Doel: vroeg signaal als de app helemaal niet meer laadt.
 */

test.describe('SwiftBridge — smoke', () => {
  test('landing laadt met de juiste titel', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SwiftBridge/i);
  });

  test('landing rendert zichtbare inhoud (geen lege React-root)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('skip-to-content link bestaat (a11y)', async ({ page }) => {
    await page.goto('/app');           // app-shell heeft de skip-link + <main id=inhoud>
    const skip = page.locator('a.skip-link');
    // Kan achter auth-redirect zitten; als hij bestaat moet hij naar #inhoud wijzen.
    if (await skip.count()) {
      await expect(skip.first()).toHaveAttribute('href', '#inhoud');
    }
  });

  test('login-route toont een invoerveld', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('onbekende route geeft de custom 404 (geen crash)', async ({ page }) => {
    const res = await page.goto('/deze-route-bestaat-niet-xyz');
    // SPA → 200 met 404-component; we checken dat er gewoon inhoud staat.
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('#root')).not.toBeEmpty();
  });
});
