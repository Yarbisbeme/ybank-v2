import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests run against a LOCAL Supabase stack (`npx supabase start`), never production.
 *
 *   npm run e2e                      builds the app against local Supabase, starts it on :3100, runs
 *   E2E_SKIP_BUILD=1 npm run e2e     reuses the last build (no code changes since)
 *   E2E_EVIDENCE=1 npm run e2e       also saves screenshots + page text to e2e/.audit
 *   E2E_PORT=3200 npm run e2e        another port, e.g. while another agent's run uses 3100
 *
 * No `supabase db reset` is needed between runs: every run signs up a fresh user and
 * global-setup deletes the users left by the previous run.
 */

// Default keys of the local Supabase CLI stack (public by design, same on every machine).
// CI passes the ones reported by `supabase status`.
const LOCAL_SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const LOCAL_PUBLISHABLE_KEY = process.env.E2E_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

const externalBaseUrl = process.env.E2E_BASE_URL
const port = Number(process.env.E2E_PORT) || 3100

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  globalSetup: './e2e/global-setup.ts',
  // Specs share one user created by 01 and run in file order.
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: externalBaseUrl ?? `http://localhost:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-DO',
    timezoneId: 'America/Santo_Domingo',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        // Production build: dev mode compiles on first visit and makes timings flaky.
        command: process.env.E2E_SKIP_BUILD ? `npm run start -- -p ${port}` : `npm run build && npm run start -- -p ${port}`,
        url: `http://localhost:${port}/sign-in`,
        timeout: 300_000,
        // Opt-in only: silently reusing a server left running from another branch tests the wrong code.
        reuseExistingServer: !!process.env.E2E_REUSE_SERVER,
        stdout: 'ignore',
        stderr: 'pipe',
        env: {
          NEXT_PUBLIC_SUPABASE_URL: LOCAL_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: LOCAL_PUBLISHABLE_KEY,
          // NEXT_PUBLIC_SITE_URL left unset on purpose: 04-oauth-redirect proves the callback follows the host.
        },
      },
})
