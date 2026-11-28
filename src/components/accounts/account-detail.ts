import type { Account, Transaction } from '@/types';
import {
  computeAccountBarModel,
  computeAccountMonthSummary,
  type CreditUsageTone,
} from './account-carousel';
import { countsInReports } from '@/lib/reporting';

export interface AccountLastTransaction {
  description: string;
  dateLabel: string;
}

export interface TransactionSubItem {
  id?: string;
  category_id?: string | null;
  category?: { id?: string; name?: string | null } | null;
}

export type AccountDetailTransaction = Transaction & {
  items?: TransactionSubItem[] | null;
  is_split_child?: boolean;
};

export interface AccountDetailMetrics {
  monthLabel: string;
  prevMonthLabel: string;
  monthSpend: number;
  monthIncome: number;
  monthInflow: number;
  monthOutflow: number;
  monthCount: number;
  prevMonthSpend: number;
  savingsDeltaPct: number | null;
  lastTransaction: AccountLastTransaction | null;
  uncategorizedCount: number;
  firstUncategorizedTx: AccountDetailTransaction | null;
  isCreditCard: boolean;
  creditUsed: number;
  creditLimit: number;
  creditAvailable: number;
  creditPercent: number;
  creditTone: CreditUsageTone;
  cutoffDay: number | null;
  daysUntilCutoff: number | null;
  showCutoffAlert: boolean;
}

const SPANISH_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const SHORT_SPANISH_MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function formatShortSpanishDate(isoDate: string): string {
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length !== 3) {
    return isoDate;
  }
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (
    Number.isNaN(monthIdx) ||
    Number.isNaN(day) ||
    monthIdx < 0 ||
    monthIdx > 11
  ) {
    return isoDate;
  }
  return `${day} ${SHORT_SPANISH_MONTHS[monthIdx]}`;
}

/** Returns whole calendar days from referenceDate until the next cutoff day occurrence. */
export function computeDaysUntilCutoff(
  cutoffDay: number | null | undefined,
  referenceDate: Date = new Date(),
): number | null {
  if (typeof cutoffDay !== 'number' || cutoffDay < 1 || cutoffDay > 31) {
    return null;
  }

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const todayDay = referenceDate.getDate();

  const daysInThisMonth = new Date(year, month + 1, 0).getDate();
  const clampedThisMonth = Math.min(cutoffDay, daysInThisMonth);

  if (clampedThisMonth >= todayDay) {
    return clampedThisMonth - todayDay;
  }

  const nextMonthDate = new Date(year, month + 1, 1);
  const daysInNextMonth = new Date(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth() + 1,
    0,
  ).getDate();
  const clampedNextMonth = Math.min(cutoffDay, daysInNextMonth);
  const target = new Date(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth(),
    clampedNextMonth,
  );
  const todayMidnight = new Date(year, month, todayDay);

  return Math.round(
    (target.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24),
  );
}

/** Returns true if a non-transfer movement (or any of its split items) still needs a category. */
export function isTransactionUncategorized(
  tx: AccountDetailTransaction,
): boolean {
  // Balance adjustments are corrections, not spending: nothing to categorize.
  if (tx.type === 'transfer' || tx.is_split_child || !countsInReports(tx)) {
    return false;
  }

  if (Array.isArray(tx.items) && tx.items.length > 0) {
    return tx.items.some((item) => !item.category_id && !item.category?.name);
  }

  return !tx.category_id && !tx.category?.name;
}

/** Computes real monthly cash flow, last movement, uncategorized items, and credit cutoff alerts for /accounts. */
export function computeAccountDetailMetrics(
  account: Account,
  transactions: AccountDetailTransaction[],
  referenceDate: Date = new Date(),
): AccountDetailMetrics {
  const curYear = referenceDate.getFullYear();
  const curMonth = referenceDate.getMonth();
  const prevMonthDate = new Date(curYear, curMonth - 1, 1);

  const curSummary = computeAccountMonthSummary(
    transactions,
    account.id,
    referenceDate,
  );
  const prevSummary = computeAccountMonthSummary(
    transactions,
    account.id,
    prevMonthDate,
  );

  const barModel = computeAccountBarModel(account, curSummary);
  const savingsDeltaPct =
    prevSummary.monthSpend > 0 && curSummary.monthSpend < prevSummary.monthSpend
      ? Math.round(
          ((prevSummary.monthSpend - curSummary.monthSpend) /
            prevSummary.monthSpend) *
            100,
        )
      : null;

  let monthIncome = 0;
  let monthInflow = 0;
  let monthOutflow = 0;
  let uncategorizedCount = 0;
  let firstUncategorizedTx: AccountDetailTransaction | null = null;
  let latestTx: AccountDetailTransaction | null = null;

  for (const tx of transactions) {
    const isOwnerAccount = tx.account_id === account.id;
    const isIncomingTransfer =
      !tx.is_split_child &&
      tx.type === 'transfer' &&
      tx.transfer_to_account_id === account.id;

    if (!isOwnerAccount && !isIncomingTransfer) {
      continue;
    }

    if (tx.date) {
      const parsed = new Date(`${tx.date.slice(0, 10)}T00:00:00`);
      const isCurrentMonth =
        !Number.isNaN(parsed.getTime()) &&
        parsed.getFullYear() === curYear &&
        parsed.getMonth() === curMonth;

      if (isCurrentMonth && countsInReports(tx)) {
        if (isOwnerAccount && !tx.is_split_child) {
          const absAmount = Math.abs(Number(tx.amount) || 0);
          if (tx.type === 'income') {
            monthIncome += absAmount;
            monthInflow += absAmount;
          } else if (
            tx.type === 'expense' ||
            tx.type === 'transfer' ||
            tx.type === 'payment'
          ) {
            monthOutflow += absAmount;
          }
        } else if (isIncomingTransfer) {
          monthInflow += Math.abs(Number(tx.target_amount ?? tx.amount) || 0);
        }
      }

      if (!latestTx || tx.date.slice(0, 10) > (latestTx.date ?? '').slice(0, 10)) {
        latestTx = tx;
      }
    }

    if (isOwnerAccount && isTransactionUncategorized(tx)) {
      uncategorizedCount += 1;
      if (!firstUncategorizedTx) {
        firstUncategorizedTx = tx;
      }
    }
  }

  const lastTransaction: AccountLastTransaction | null = latestTx
    ? {
        description: latestTx.description?.trim() || 'Movimiento',
        dateLabel: latestTx.date ? formatShortSpanishDate(latestTx.date) : '',
      }
    : null;

  const daysUntilCutoff = computeDaysUntilCutoff(
    barModel.cutoffDay,
    referenceDate,
  );
  const showCutoffAlert =
    barModel.isCreditCard &&
    barModel.creditUsed > 0 &&
    daysUntilCutoff !== null;

  return {
    monthLabel: SPANISH_MONTHS[curMonth],
    prevMonthLabel: SPANISH_MONTHS[prevMonthDate.getMonth()],
    monthSpend: curSummary.monthSpend,
    monthIncome,
    monthInflow,
    monthOutflow,
    monthCount: curSummary.monthCount,
    prevMonthSpend: prevSummary.monthSpend,
    savingsDeltaPct,
    lastTransaction,
    uncategorizedCount,
    firstUncategorizedTx,
    isCreditCard: barModel.isCreditCard,
    creditUsed: barModel.creditUsed,
    creditLimit: barModel.creditLimit,
    creditAvailable: barModel.creditAvailable,
    creditPercent: barModel.percent,
    creditTone: barModel.creditTone,
    cutoffDay: barModel.cutoffDay,
    daysUntilCutoff,
    showCutoffAlert,
  };
}
