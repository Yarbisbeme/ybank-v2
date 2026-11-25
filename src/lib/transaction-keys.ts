/**
 * Single source of truth for transaction list query keys. SSR hydration
 * (DashboardProviders), the list hook and the offline fallback must all build
 * keys here; hand-written keys drifted apart and broke hydration before.
 */

export const TRANSACTIONS_PAGE_SIZE = 10

export interface TransactionListKeyParams {
  accountId?: string | null
  type?: string | null
  categoryId?: string | null
  startDate?: string | null
  endDate?: string | null
  tagId?: string | null
  search?: string | null
  page?: number
}

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (p: TransactionListKeyParams = {}) =>
    [
      'transactions',
      p.accountId || null,
      p.type || '',
      p.categoryId || '',
      p.startDate || '',
      p.endDate || '',
      p.tagId || '',
      p.search || '',
      p.page ?? 1,
    ] as const,
}
