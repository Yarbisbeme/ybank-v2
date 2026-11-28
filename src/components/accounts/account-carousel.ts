import type { Account, Transaction } from '@/types';
import { countsInReports } from '@/lib/reporting';

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

/** A transaction as the list hook returns it; see getLedgerType. */
export type ListedTransaction = Transaction & { original_type?: string | null };

/**
 * Stored type of a transaction. When the list is scoped to one account,
 * useTransactionsList rewrites transfers as 'income' / 'expense' so the table
 * reads naturally, keeping the real type in original_type. Metrics must use the
 * real one: an incoming transfer is not owned by this account, and moving money
 * between your own accounts is not spending.
 */
export function getLedgerType(tx: ListedTransaction): string {
  return tx.original_type || tx.type;
}

/** Sums absolute expense amounts and counts expense movements for an account in the reference month. */
export function computeAccountMonthSummary(
  transactions: ListedTransaction[],
  accountId: string,
  referenceDate: Date = new Date(),
): AccountMonthSummary {
  const curYear = referenceDate.getFullYear();
  const curMonth = referenceDate.getMonth();
  let monthSpend = 0;
  let monthCount = 0;

  for (const tx of transactions) {
    if (
      tx.account_id !== accountId ||
      getLedgerType(tx) !== 'expense' ||
      !tx.date ||
      !countsInReports(tx)
    ) {
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

/**
 * Selection state for a carousel whose active card can also be driven from
 * outside (the `?accountId=` URL on /accounts).
 *
 * The local selection must win so the card animates on the same frame as the
 * gesture; the URL lags behind by a server round-trip. When the controlling
 * prop changes we must tell apart the echo of our own request (ignore it, a
 * newer request may be in flight) from a genuine external navigation (adopt it).
 */
export interface CarouselSelection {
  selectedId: string | null;
  /** Ids we asked the controller for that it has not echoed back yet, oldest first. */
  pendingIds: string[];
  /** Last value of the controlling prop we reconciled against. */
  syncedPropId: string | null;
}

export function createCarouselSelection(
  propId?: string | null,
): CarouselSelection {
  const id = propId ?? null;
  return { selectedId: id, pendingIds: [], syncedPropId: id };
}

/** Records a user selection. `tracked` is false when nobody controls the carousel. */
export function requestCarouselSelection(
  state: CarouselSelection,
  id: string,
  tracked: boolean,
): CarouselSelection {
  return {
    ...state,
    selectedId: id,
    pendingIds: tracked ? [...state.pendingIds, id] : state.pendingIds,
  };
}

/** Reconciles the local selection with a new value of the controlling prop. */
export function syncCarouselSelectionFromProp(
  state: CarouselSelection,
  propId?: string | null,
): CarouselSelection {
  const id = propId ?? null;
  if (id === state.syncedPropId) {
    return state;
  }

  const echoIndex = id === null ? -1 : state.pendingIds.indexOf(id);
  if (echoIndex >= 0) {
    // Navigations resolve in order, so older requests can no longer arrive.
    return {
      ...state,
      pendingIds: state.pendingIds.slice(echoIndex + 1),
      syncedPropId: id,
    };
  }

  return { selectedId: id, pendingIds: [], syncedPropId: id };
}

/** Index of the selected account, falling back to the first card when it is gone. */
export function resolveCarouselIndex(
  accounts: Pick<Account, 'id'>[],
  selectedId: string | null,
): number {
  if (accounts.length === 0 || !selectedId) {
    return 0;
  }
  return Math.max(
    0,
    accounts.findIndex((acc) => acc.id === selectedId),
  );
}
