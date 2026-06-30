import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E-config (E7). Smoke-tests tegen de vite dev-server.
 * Lokaal:  npm run test:e2e          (start de dev-server vanzelf)
 * Eerste keer: npx playwright install chromium  (download de browser)
 * CI:      zet E2E_BASE_URL om tegen een bestaande deploy te testen.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Start de dev-server alleen wanneer we niet tegen een externe URL testen.
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
