import { test, expect } from '@playwright/test'

// Regression: Google sign-in on a Vercel preview redirected to http://localhost:3000
// because the callback URL came from NEXT_PUBLIC_SITE_URL instead of the request.
// Run the app WITHOUT NEXT_PUBLIC_SITE_URL to prove the callback follows the host.
test('Google sign-in asks Supabase to return to the host the user is on', async ({ page, baseURL }) => {
  let authorizeUrl: string | null = null
  page.on('request', (r) => { if (r.url().includes('/auth/v1/authorize')) authorizeUrl = r.url() })

  await page.goto('/sign-in')
  await page.getByRole('button', { name: /google/i }).first().click()
  await expect.poll(() => authorizeUrl, { timeout: 15_000 }).not.toBeNull()

  const redirectTo = new URL(authorizeUrl!).searchParams.get('redirect_to')
  console.log(JSON.stringify({ authorizeUrl, redirectTo }))
  expect(redirectTo).toBe(`${baseURL}/auth/callback`)
})
