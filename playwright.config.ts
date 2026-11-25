import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests run against a LOCAL Supabase stack (`npx supabase start`), never production.
 * Start the app pointed at it, e.g.:
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key> \
 *   NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next dev --webpack -p 3100
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-DO',
    timezoneId: 'America/Santo_Domingo',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
})
