/**
 * Query keys for metrics computed in Postgres (account_month_metrics, spending_by_day).
 * Any write that moves money must invalidate `metricsKeys.all`.
 */
export const metricsKeys = {
  all: ['metrics'] as const,
  account: (accountId: string, month: string) => ['metrics', 'account', accountId, month] as const,
  spending: (from: string, to: string) => ['metrics', 'spending', from, to] as const,
}
