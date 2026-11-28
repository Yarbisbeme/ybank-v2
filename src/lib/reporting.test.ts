import { describe, expect, it } from 'vitest'
import { countsInReports } from './reporting'

describe('countsInReports', () => {
  it('excludes balance adjustments', () => {
    expect(countsInReports({ is_balance_adjustment: true })).toBe(false)
  })

  it('includes regular movements, also rows cached before the column existed', () => {
    expect(countsInReports({ is_balance_adjustment: false })).toBe(true)
    expect(countsInReports({ is_balance_adjustment: null })).toBe(true)
    expect(countsInReports({})).toBe(true)
  })
})
