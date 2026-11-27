import { describe, expect, it } from 'vitest'
import { completeOnboardingSchema, createAccountSchema } from './validation'

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

describe('createAccountSchema card style', () => {
  const account = { name: 'Nómina', type: 'savings', currency: 'DOP', initial_balance: 0, is_active: true }

  it('accepts the stored (English) card style values', () => {
    const r = createAccountSchema.safeParse({
      ...account, color: '#1f4bff', color_secondary: '#0e0e10',
      card_base: 'gradient', card_shape_intensity: 2, card_finish: 'metal', network: 'visa',
    })
    expect(r.success).toBe(true)
  })

  it('rejects the Spanish UI ids, so the UI must map them before saving', () => {
    expect(createAccountSchema.safeParse({ ...account, card_base: 'degradado' }).success).toBe(false)
    expect(createAccountSchema.safeParse({ ...account, card_finish: 'mate' }).success).toBe(false)
  })

  it('rejects out-of-range intensity and unknown networks', () => {
    expect(createAccountSchema.safeParse({ ...account, card_shape_intensity: 3 }).success).toBe(false)
    expect(createAccountSchema.safeParse({ ...account, network: 'VISA' }).success).toBe(false)
  })

  it('allows clearing the network and the secondary colour', () => {
    expect(createAccountSchema.safeParse({ ...account, network: null, color_secondary: null }).success).toBe(true)
  })
})
