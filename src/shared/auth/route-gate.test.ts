import { describe, expect, it } from 'vitest'
import { decideRoute, isSessionCookie } from './route-gate'

const decide = (path: string, cookieNames: string[] = [], query = '') =>
  decideRoute({ path, search: new URLSearchParams(query), cookieNames })

describe('isSessionCookie', () => {
  it('accepts the session cookie and its chunks', () => {
    expect(isSessionCookie('sb-cizbokgdcvvapncempdu-auth-token')).toBe(true)
    expect(isSessionCookie('sb-cizbokgdcvvapncempdu-auth-token.0')).toBe(true)
    expect(isSessionCookie('sb-cizbokgdcvvapncempdu-auth-token.1')).toBe(true)
  })

  it('rejects the PKCE verifier of an unfinished OAuth sign-in (root cause of the loop)', () => {
    expect(isSessionCookie('sb-cizbokgdcvvapncempdu-auth-token-code-verifier')).toBe(false)
  })

  it('rejects unrelated cookies', () => {
    expect(isSessionCookie('theme')).toBe(false)
    expect(isSessionCookie('my-auth-token')).toBe(false)
  })
})

describe('decideRoute', () => {
  const session = ['sb-ref-auth-token']
  const verifierOnly = ['sb-ref-auth-token-code-verifier']

  it('sends anonymous users from protected routes to sign-in', () => {
    expect(decide('/dashboard')).toEqual({ action: 'redirect', to: '/sign-in', clearCookies: [] })
    expect(decide('/transactions/123')).toMatchObject({ action: 'redirect', to: '/sign-in' })
  })

  it('treats a lone PKCE verifier as anonymous', () => {
    expect(decide('/dashboard', verifierOnly)).toMatchObject({ action: 'redirect', to: '/sign-in' })
    expect(decide('/sign-in', verifierOnly)).toMatchObject({ action: 'next' })
  })

  it('lets users with a session cookie into protected routes (works offline)', () => {
    expect(decide('/dashboard', session)).toMatchObject({ action: 'next' })
  })

  it('sends signed-in users away from sign-in/sign-up', () => {
    expect(decide('/sign-in', session)).toMatchObject({ action: 'redirect', to: '/dashboard' })
  })

  it('does NOT bounce a rejected session back to the dashboard, and clears auth cookies', () => {
    const d = decide('/sign-in', [...session, ...verifierOnly, 'theme'], 'error=session_expired')
    expect(d).toEqual({ action: 'next', clearCookies: ['sb-ref-auth-token', 'sb-ref-auth-token-code-verifier'] })
  })

  it('forwards an OAuth code that landed on the home page to the callback', () => {
    expect(decide('/', [], 'code=abc-123')).toEqual({ action: 'redirect', to: '/auth/callback?code=abc-123', clearCookies: [] })
  })

  it('leaves the home page alone without a code', () => {
    expect(decide('/', [])).toMatchObject({ action: 'next' })
  })

  it('does not treat lookalike paths as protected', () => {
    expect(decide('/dashboarding')).toMatchObject({ action: 'next' })
  })
})
