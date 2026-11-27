export type BudgetBarVariant = 'budget' | 'goal';
export type BudgetProgressStatus = 'normal' | 'warning' | 'exceeded' | 'achieved';

export interface BudgetProgressResult {
  percent: number;
  clampedPercent: number;
  status: BudgetProgressStatus;
}

/** Computes clamped percentage and semantic status for budgets and savings goals. */
export function computeBudgetProgress(
  current: number,
  target: number,
  variant: BudgetBarVariant = 'budget',
): BudgetProgressResult {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
    return { percent: 0, clampedPercent: 0, status: 'normal' };
  }

  const safeCurrent = Math.max(0, current);
  const percent = Math.round((safeCurrent / target) * 1000) / 10;
  const clampedPercent = Math.max(0, Math.min(100, percent));

  if (variant === 'goal') {
    return {
      percent,
      clampedPercent,
      status: percent >= 100 ? 'achieved' : 'normal',
    };
  }

  const status: BudgetProgressStatus =
    percent >= 100 ? 'exceeded' : percent >= 80 ? 'warning' : 'normal';

  return { percent, clampedPercent, status };
}
