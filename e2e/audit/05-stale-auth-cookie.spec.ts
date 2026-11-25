import { test, expect } from '@playwright/test'

// Production bug (2026-11-25): after a Google sign-in that did not finish, the browser kept
// the PKCE cookie `sb-<ref>-auth-token-code-verifier`. The proxy treated any cookie containing
// "-auth-token" as a session and sent /sign-in -> /dashboard, while the dashboard layout found
// no user and sent /dashboard -> /sign-in?error=session_expired: an infinite redirect loop.

const host = new URL(process.env.E2E_BASE_URL ?? 'http://localhost:3100').hostname

for (const name of ['sb-127-auth-token-code-verifier', 'sb-127-auth-token']) {
  test(`stale "${name}" cookie does not cause a redirect loop`, async ({ page, context }) => {
    await context.addCookies([{ name, value: 'stale-or-invalid', domain: host, path: '/' }])

    const hops: string[] = []
    page.on('response', (r) => {
      if (r.request().resourceType() === 'document' && r.status() >= 300 && r.status() < 400) {
        hops.push(`${r.status()} ${new URL(r.url()).pathname}${new URL(r.url()).search}`)
      }
    })

    const response = await page.goto('/dashboard').catch((e: Error) => e)
    console.log(JSON.stringify({ name, hops: hops.length, first: hops.slice(0, 6), final: page.url(), error: response instanceof Error ? response.message : null }))

    expect(response).not.toBeInstanceOf(Error)
    expect(new URL(page.url()).pathname).toBe('/sign-in')
    expect(hops.length).toBeLessThanOrEqual(2)
    // A rejected session cookie is cleared so the next visit is clean. A lone PKCE
    // verifier is left alone: it no longer counts as a session, and another tab may
    // still be finishing a Google sign-in with it.
    const left = (await context.cookies()).filter((c) => c.name.startsWith('sb-')).map((c) => c.name)
    expect(left).not.toContain('sb-127-auth-token')
  })
}
