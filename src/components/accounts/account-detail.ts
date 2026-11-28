import type { Account } from '@/types';
import { computeAccountBarModel, type CreditUsageTone } from './account-carousel';

export interface AccountLastTransaction {
  description: string;
  dateLabel: string;
}

/** Row returned by public.account_month_metrics() (computed in Postgres over all movements). */
export interface AccountMonthMetricsRow {
  month_start: string;
  month_spend: number;
  month_count: number;
  month_income: number;
  month_inflow: number;
  month_outflow: number;
  prev_month_spend: number;
  uncategorized_count: number;
  first_uncategorized_id: string | null;
  last_description: string | null;
  last_date: string | null;
}

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
  firstUncategorizedId: string | null;
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

const EMPTY_ROW: AccountMonthMetricsRow = {
  month_start: '',
  month_spend: 0,
  month_count: 0,
  month_income: 0,
  month_inflow: 0,
  month_outflow: 0,
  prev_month_spend: 0,
  uncategorized_count: 0,
  first_uncategorized_id: null,
  last_description: null,
  last_date: null,
};

/**
 * Shapes the account's metrics for /accounts. The figures come from account_month_metrics()
 * (all movements, in Postgres); this only adds labels, the credit bar and the cutoff alert.
 */
export function buildAccountDetailMetrics(
  account: Account,
  row: AccountMonthMetricsRow | null,
  referenceDate: Date = new Date(),
): AccountDetailMetrics {
  const m = row ?? EMPTY_ROW;
  const curMonth = referenceDate.getMonth();
  const prevMonthDate = new Date(referenceDate.getFullYear(), curMonth - 1, 1);

  const barModel = computeAccountBarModel(account, {
    monthSpend: m.month_spend,
    monthCount: m.month_count,
  });
  const savingsDeltaPct =
    m.prev_month_spend > 0 && m.month_spend < m.prev_month_spend
      ? Math.round(((m.prev_month_spend - m.month_spend) / m.prev_month_spend) * 100)
      : null;

  const lastTransaction: AccountLastTransaction | null = m.last_date
    ? {
        description: m.last_description?.trim() || 'Movimiento',
        dateLabel: formatShortSpanishDate(m.last_date),
      }
    : null;

  const daysUntilCutoff = computeDaysUntilCutoff(barModel.cutoffDay, referenceDate);
  const showCutoffAlert =
    barModel.isCreditCard && barModel.creditUsed > 0 && daysUntilCutoff !== null;

  return {
    monthLabel: SPANISH_MONTHS[curMonth],
    prevMonthLabel: SPANISH_MONTHS[prevMonthDate.getMonth()],
    monthSpend: m.month_spend,
    monthIncome: m.month_income,
    monthInflow: m.month_inflow,
    monthOutflow: m.month_outflow,
    monthCount: m.month_count,
    prevMonthSpend: m.prev_month_spend,
    savingsDeltaPct,
    lastTransaction,
    uncategorizedCount: m.uncategorized_count,
    firstUncategorizedId: m.first_uncategorized_id,
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
