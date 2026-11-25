/**
 * Routing decisions for the proxy, kept pure so they can be unit-tested.
 *
 * The proxy is only a UX gate that works offline (it never calls Supabase).
 * Real authorization is RLS plus the getUser() check in the dashboard layout.
 */

const PROTECTED_PREFIXES = ['/dashboard', '/accounts', '/transactions', '/settings', '/onboarding']
const AUTH_PREFIXES = ['/sign-in', '/sign-up']

/**
 * A Supabase session cookie: `sb-<ref>-auth-token`, or its chunks `.0`, `.1`…
 * Excludes `sb-<ref>-auth-token-code-verifier`, the temporary PKCE cookie of an
 * OAuth sign-in that has not finished; it is NOT a session.
 */
export function isSessionCookie(name: string): boolean {
  return /^sb-[^.]+-auth-token(\.\d+)?$/.test(name)
}

/** Every Supabase auth cookie (session chunks and PKCE verifier). */
export function isSupabaseAuthCookie(name: string): boolean {
  return /^sb-[^.]+-auth-token/.test(name)
}

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`))

export type GateDecision =
  | { action: 'next'; clearCookies: string[] }
  | { action: 'redirect'; to: string; clearCookies: string[] }

export function decideRoute(input: { path: string; search: URLSearchParams; cookieNames: string[] }): GateDecision {
  const { path, search, cookieNames } = input
  const hasSession = cookieNames.some(isSessionCookie)
  const isProtected = matches(path, PROTECTED_PREFIXES)
  const isAuthRoute = matches(path, AUTH_PREFIXES)

  // Supabase falls back to the Site URL (the landing page) when the requested
  // redirect is not in its allow-list; finish the sign-in instead of dropping it.
  if (path === '/' && search.has('code')) {
    return { action: 'redirect', to: `/auth/callback?${search.toString()}`, clearCookies: [] }
  }

  // The dashboard layout sends users here with ?error= when the server rejected
  // the session. Never bounce them back to /dashboard (that was an infinite
  // redirect loop); drop the stale auth cookies so the next attempt is clean.
  if (isAuthRoute && search.has('error')) {
    return { action: 'next', clearCookies: cookieNames.filter(isSupabaseAuthCookie) }
  }

  if (hasSession && isAuthRoute) return { action: 'redirect', to: '/dashboard', clearCookies: [] }
  if (!hasSession && isProtected) return { action: 'redirect', to: '/sign-in', clearCookies: [] }
  return { action: 'next', clearCookies: [] }
}
