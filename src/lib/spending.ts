/**
 * Presentation helpers over the rows of spending_by_day() (already aggregated and complete in
 * Postgres). Only display concerns live here: picking the window and converting currency for
 * the selected display currency.
 */

export type CurrencyCode = 'DOP' | 'USD'

export interface SpendingRow {
  day: string // YYYY-MM-DD
  currency: string
  category_id: string | null
  category_name: string | null
  source: 'expense' | 'external_transfer'
  total: number
}

export interface DisplayCurrency {
  currency: CurrencyCode
  /** DOP per USD. */
  rate: number
}

export const UNCATEGORIZED_LABEL = 'Otros gastos'

export function toDisplay(amount: number, from: string, { currency, rate }: DisplayCurrency): number {
  const value = Math.abs(Number(amount) || 0)
  if (from === currency || !rate) return value
  if (currency === 'USD' && from === 'DOP') return value / rate
  if (currency === 'DOP' && from === 'USD') return value * rate
  return value
}

const pad = (n: number) => String(n).padStart(2, '0')
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** First day of the previous month .. today: one window for every dashboard figure. */
export function dashboardWindow(today: Date = new Date()) {
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  return {
    from: toIsoDate(prevMonthStart),
    to: toIsoDate(today),
    monthStart: toIsoDate(monthStart),
    prevMonthStart: toIsoDate(prevMonthStart),
  }
}

/** Expenses this month vs. last month, in the display currency. */
export function monthSpendTotals(
  rows: SpendingRow[],
  window: { monthStart: string; prevMonthStart: string },
  display: DisplayCurrency,
) {
  let current = 0
  let previous = 0
  for (const r of rows) {
    if (r.source !== 'expense') continue
    const amount = toDisplay(r.total, r.currency, display)
    if (r.day >= window.monthStart) current += amount
    else if (r.day >= window.prevMonthStart) previous += amount
  }
  const savingsDeltaPct =
    previous > 0 && current < previous ? Math.round(((previous - current) / previous) * 100) : null
  return { current, previous, savingsDeltaPct }
}

/** Top categories of this month's expenses, largest first. */
export function categoryBreakdown(
  rows: SpendingRow[],
  monthStart: string,
  display: DisplayCurrency,
  limit = 5,
) {
  const byName = new Map<string, number>()
  for (const r of rows) {
    if (r.source !== 'expense' || r.day < monthStart) continue
    const name = r.category_name || UNCATEGORIZED_LABEL
    byName.set(name, (byName.get(name) ?? 0) + toDisplay(r.total, r.currency, display))
  }
  return Array.from(byName, ([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}
