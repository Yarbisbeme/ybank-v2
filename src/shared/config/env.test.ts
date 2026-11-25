import { describe, expect, it } from 'vitest'
import { parseEnv, publicEnvSchema, serverEnvSchema } from './env'

const validPublic = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  NEXT_PUBLIC_SITE_URL: 'https://ybankapp.com',
}

describe('parseEnv', () => {
  it('accepts a valid public env', () => {
    expect(parseEnv(publicEnvSchema, validPublic)).toEqual(validPublic)
  })

  it('defaults NEXT_PUBLIC_SITE_URL to localhost when unset or empty', () => {
    const env = parseEnv(publicEnvSchema, { ...validPublic, NEXT_PUBLIC_SITE_URL: '' })
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
  })

  it('reports every invalid key in one error', () => {
    expect(() =>
      parseEnv(publicEnvSchema, { NEXT_PUBLIC_SUPABASE_URL: 'not-a-url', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' }),
    ).toThrowError(/NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/)
  })

  it('rejects secrets shorter than 32 chars', () => {
    expect(() => parseEnv(serverEnvSchema, { CRON_SECRET: 'short' })).toThrowError(/CRON_SECRET/)
  })

  it('allows optional server vars to be missing', () => {
    expect(parseEnv(serverEnvSchema, {})).toEqual({})
  })
})
