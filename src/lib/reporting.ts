/**
 * Whether a movement counts as income or spending in reports (monthly spend, activity,
 * account summaries). Balance adjustments move the balance but are neither: they are a
 * correction, not money earned or spent.
 */
export function countsInReports(tx: { is_balance_adjustment?: boolean | null }): boolean {
  return !tx.is_balance_adjustment
}
