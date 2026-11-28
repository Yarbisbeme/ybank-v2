import { describe, expect, it } from 'vitest'
import { categoryBreakdown, dashboardWindow, monthSpendTotals, toDisplay, type SpendingRow } from './spending'

const row = (o: Partial<SpendingRow>): SpendingRow => ({
  day: '2026-11-10',
  currency: 'DOP',
  category_id: null,
  category_name: null,
  source: 'expense',
  total: 0,
  ...o,
})

const DOP = { currency: 'DOP' as const, rate: 60 }

describe('dashboardWindow', () => {
  it('spans from the first day of the previous month to today', () => {
    expect(dashboardWindow(new Date(2026, 10, 27))).toEqual({
      from: '2026-10-01',
      to: '2026-11-27',
      monthStart: '2026-11-01',
      prevMonthStart: '2026-10-01',
    })
  })

  it('crosses the year boundary', () => {
    expect(dashboardWindow(new Date(2027, 0, 5)).from).toBe('2026-12-01')
  })
})

describe('toDisplay', () => {
  it('converts USD to DOP and back with the rate', () => {
    expect(toDisplay(10, 'USD', DOP)).toBe(600)
    expect(toDisplay(600, 'DOP', { currency: 'USD', rate: 60 })).toBe(10)
    expect(toDisplay(-5, 'DOP', DOP)).toBe(5)
  })
})

describe('monthSpendTotals', () => {
  it('sums every expense of the month (no page limit), converting currencies', () => {
    const rows = [
      ...Array.from({ length: 12 }, (_, i) => row({ day: `2026-11-${String(i + 2).padStart(2, '0')}`, total: 100 })),
      row({ currency: 'USD', total: 10 }),
      row({ day: '2026-10-20', total: 3000 }),
      row({ source: 'external_transfer', total: 999 }),
    ]
    expect(monthSpendTotals(rows, { monthStart: '2026-11-01', prevMonthStart: '2026-10-01' }, DOP)).toEqual({
      current: 1800,
      previous: 3000,
      savingsDeltaPct: 40,
    })
  })
})

describe('categoryBreakdown', () => {
  it('groups this month by category, labels missing ones, keeps the top N', () => {
    const rows = [
      row({ category_name: 'Supermercado', total: 500 }),
      row({ category_name: 'Supermercado', total: 200 }),
      row({ category_name: null, total: 300 }),
      row({ category_name: 'Gym', currency: 'USD', total: 10 }),
      row({ category_name: 'Viejo', day: '2026-10-30', total: 9999 }),
    ]
    expect(categoryBreakdown(rows, '2026-11-01', DOP, 2)).toEqual([
      { name: 'Supermercado', total: 700 },
      { name: 'Gym', total: 600 },
    ])
  })
})
