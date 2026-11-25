import { describe, expect, it } from 'vitest'
import { completeOnboardingSchema } from './validation'

const base = { fullName: 'Usuario', currency: 'DOP', primaryAccountId: '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f' }

describe('completeOnboardingSchema', () => {
  // Regression: email sign-ups could never finish onboarding (found in the Phase 0.5 audit).
  it('accepts an empty password from users who signed up with email', () => {
    const r = completeOnboardingSchema.safeParse({ ...base, password: '' })
    expect(r.success).toBe(true)
    expect(r.success && r.data.password).toBeUndefined()
  })

  it('accepts a missing password', () => {
    expect(completeOnboardingSchema.safeParse(base).success).toBe(true)
  })

  it('rejects a password shorter than 6 characters with a Spanish message', () => {
    const r = completeOnboardingSchema.safeParse({ ...base, password: '123' })
    expect(r.success).toBe(false)
    expect(!r.success && r.error.issues[0].message).toMatch(/al menos 6/)
  })
})
