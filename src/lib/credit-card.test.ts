import { describe, expect, it } from 'vitest'
import { availableCredit, cardDebt, cardFace } from './credit-card'

describe('availableCredit', () => {
  it('is what is left of the limit', () => {
    expect(availableCredit(-15, 200)).toBe(185)
    expect(availableCredit(0, 200)).toBe(200)
    expect(availableCredit(10, 200)).toBe(210) // overpaid: credit in favour
  })

  it('is unknown without a limit', () => {
    expect(availableCredit(-15, null)).toBeNull()
    expect(availableCredit(-15, 0)).toBeNull()
  })
})

describe('cardDebt', () => {
  it('is the positive amount owed, never negative', () => {
    expect(cardDebt(-15)).toBe(15)
    expect(cardDebt(10)).toBe(0)
  })
})

describe('cardFace', () => {
  it('shows the available amount on credit cards with a limit', () => {
    expect(cardFace('credit_card', -15, 200)).toEqual({ amount: 185, caption: { debt: 15, limit: 200 } })
  })

  it('falls back to the balance for cards without a limit and for other accounts', () => {
    expect(cardFace('credit_card', -500, null)).toEqual({ amount: -500, caption: null })
    expect(cardFace('savings', 1200, 5000)).toEqual({ amount: 1200, caption: null })
  })
})
