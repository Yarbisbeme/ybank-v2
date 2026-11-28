/**
 * Credit cards are shown and edited by what is left, not by what is owed (people ask "how much
 * do I have left?"). The stored balance stays signed (debt < 0) because net worth needs it;
 * these helpers only translate for display and for the form. The DB applies the same rule when
 * saving (set_account_available: balance = available - limit).
 */

const hasLimit = (limit: number | null | undefined): limit is number =>
  typeof limit === 'number' && Number.isFinite(limit) && limit > 0

/** What is left on the card: limit + balance (balance is negative while there is debt). */
export function availableCredit(balance: number, limit: number | null | undefined): number | null {
  return hasLimit(limit) ? limit + (Number(balance) || 0) : null
}

/** Debt as a positive amount (0 when the card is paid off or in favour). */
export function cardDebt(balance: number): number {
  return Math.max(0, -(Number(balance) || 0))
}

export interface CardFace {
  /** Big number on the card. */
  amount: number
  /** Small line under it, or null. */
  caption: { debt: number; limit: number } | null
}

/** What the card face shows: the available amount for credit cards with a limit, else the balance. */
export function cardFace(accountType: string | undefined, balance: number, limit?: number | null): CardFace {
  const available = accountType === 'credit_card' ? availableCredit(balance, limit) : null
  if (available === null) return { amount: Number(balance) || 0, caption: null }
  return { amount: available, caption: { debt: cardDebt(balance), limit: limit as number } }
}
