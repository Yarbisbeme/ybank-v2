import { describe, expect, it } from 'vitest'
import { resolveOrigin } from './origin'

const h = (values: Record<string, string>) => ({ get: (k: string) => values[k] ?? null })
const FALLBACK = 'https://ybankapp.com'

describe('resolveOrigin', () => {
  it('uses the Vercel preview host the user is on (regression: preview sent Google login to localhost)', () => {
    expect(resolveOrigin(h({ 'x-forwarded-host': 'ybank-v2-git-fix-abc.vercel.app', 'x-forwarded-proto': 'https' }), FALLBACK))
      .toBe('https://ybank-v2-git-fix-abc.vercel.app')
  })

  it('uses the production domain', () => {
    expect(resolveOrigin(h({ host: 'ybankapp.com', 'x-forwarded-proto': 'https' }), FALLBACK)).toBe('https://ybankapp.com')
  })

  it('uses http for localhost without proxy headers', () => {
    expect(resolveOrigin(h({ host: 'localhost:3000' }), FALLBACK)).toBe('http://localhost:3000')
  })

  it('defaults to https for non-local hosts without a proto header', () => {
    expect(resolveOrigin(h({ host: 'ybankapp.com' }), FALLBACK)).toBe('https://ybankapp.com')
  })

  it('takes the first value of comma-separated proxy headers', () => {
    expect(resolveOrigin(h({ 'x-forwarded-host': 'a.vercel.app, b.internal', 'x-forwarded-proto': 'https, http' }), FALLBACK))
      .toBe('https://a.vercel.app')
  })

  it('falls back when the host is missing or malformed', () => {
    expect(resolveOrigin(h({}), FALLBACK)).toBe(FALLBACK)
    expect(resolveOrigin(h({ host: 'evil.com/path?x=' }), FALLBACK)).toBe(FALLBACK)
  })
})
