import type { Account, Transaction } from '@/types';

export type CreditUsageTone = 'credit' | 'pending' | 'debit';

export interface AccountMonthSummary {
  monthSpend: number;
  monthCount: number;
}

export interface AccountBarModel {
  label: string;
  isCreditCard: boolean;
  creditUsed: number;
  creditLimit: number;
  creditAvailable: number;
  cutoffDay: number | null;
  monthSpend: number;
  monthCount: number;
  percent: number;
  creditTone: CreditUsageTone;
}

/** Places the user's primary account first while preserving relative order of the rest. */
export function sortAccountsByPrimary(
  accounts: Account[],
  primaryAccountId?: string | null,
): Account[] {
  if (accounts.length === 0 || !primaryAccountId) {
    return accounts;
  }

  const favoriteAcc = accounts.find((acc) => acc.id === primaryAccountId);
  if (!favoriteAcc) {
    return accounts;
  }

  return [favoriteAcc, ...accounts.filter((acc) => acc.id !== primaryAccountId)];
}

/** Sums absolute expense amounts and counts expense movements for an account in the reference month. */
export function computeAccountMonthSummary(
  transactions: Transaction[],
  accountId: string,
  referenceDate: Date = new Date(),
): AccountMonthSummary {
  const curYear = referenceDate.getFullYear();
  const curMonth = referenceDate.getMonth();
  let monthSpend = 0;
  let monthCount = 0;

  for (const tx of transactions) {
    if (tx.account_id !== accountId || tx.type !== 'expense' || !tx.date) {
      continue;
    }
    const parsed = new Date(`${tx.date.slice(0, 10)}T00:00:00`);
    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === curYear &&
      parsed.getMonth() === curMonth
    ) {
      monthSpend += Math.abs(Number(tx.amount) || 0);
      monthCount += 1;
    }
  }

  return { monthSpend, monthCount };
}

/** Sums absolute expense amounts for a specific account within the reference calendar month. */
export function computeAccountMonthSpend(
  transactions: Transaction[],
  accountId: string,
  referenceDate: Date = new Date(),
): number {
  return computeAccountMonthSummary(transactions, accountId, referenceDate)
    .monthSpend;
}

/** Computes non-redundant monthly summary or credit limit availability metrics for an active account. */
export function computeAccountBarModel(
  account: Account,
  summary: AccountMonthSummary,
): AccountBarModel {
  const creditLimit = Number(account.credit_limit) || 0;
  const isCreditCard = account.type === 'credit_card' && creditLimit > 0;
  const creditUsed = isCreditCard
    ? Math.abs(Math.min(0, Number(account.current_balance) || 0))
    : 0;
  const creditAvailable = isCreditCard
    ? Math.max(0, creditLimit - creditUsed)
    : 0;
  const cutoffDay =
    isCreditCard &&
    typeof account.cutoff_day === 'number' &&
    account.cutoff_day > 0
      ? account.cutoff_day
      : null;
  const percent = isCreditCard
    ? Math.min(100, Math.max(0, Math.round((creditUsed / creditLimit) * 100)))
    : 0;
  const creditTone: CreditUsageTone =
    percent >= 75 ? 'debit' : percent >= 30 ? 'pending' : 'credit';

  return {
    label: isCreditCard ? 'Uso de límite' : 'Gastos este mes',
    isCreditCard,
    creditUsed,
    creditLimit,
    creditAvailable,
    cutoffDay,
    monthSpend: summary.monthSpend,
    monthCount: summary.monthCount,
    percent,
    creditTone,
  };
}
