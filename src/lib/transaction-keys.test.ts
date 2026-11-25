import { describe, expect, it } from 'vitest'
import { transactionKeys } from './transaction-keys'

describe('transactionKeys.list', () => {
  it('normalizes empty filters so the SSR key matches the hook key', () => {
    const ssrKey = transactionKeys.list({ page: 1 })
    const hookKey = transactionKeys.list({
      accountId: null, type: null, categoryId: null, startDate: null,
      endDate: null, tagId: null, search: null, page: 1,
    })
    expect(hookKey).toEqual(ssrKey)
  })

  it('treats the "no account" value consistently', () => {
    expect(transactionKeys.list({ accountId: '' })).toEqual(transactionKeys.list({ accountId: null }))
  })

  it('includes every filter so different filters never share a cache entry', () => {
    const a = transactionKeys.list({ search: 'uber' })
    const b = transactionKeys.list({ tagId: 'uber' })
    expect(a).not.toEqual(b)
  })

  it('starts with the shared prefix used for invalidation', () => {
    expect(transactionKeys.list().slice(0, 1)).toEqual([...transactionKeys.all])
  })
})
