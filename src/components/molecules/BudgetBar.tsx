import { cn } from '@/lib/utils';
import { AchievementBadge, Money, type CurrencyCode } from '@/components/atoms';
import {
  computeBudgetProgress,
  type BudgetBarVariant,
  type BudgetProgressStatus,
} from './budget-bar';

export interface BudgetBarProps {
  label: string;
  current: number;
  target: number;
  currency?: CurrencyCode;
  variant?: BudgetBarVariant;
  showAmounts?: boolean;
  className?: string;
}

const FILL_CLASSES: Record<BudgetProgressStatus, string> = {
  normal: 'bg-action',
  warning: 'bg-pending',
  exceeded: 'bg-debit',
  achieved: 'bg-credit',
};

/** Accessible budget or savings goal progress bar with optional achievement state. */
export function BudgetBar({
  label,
  current,
  target,
  currency = 'DOP',
  variant = 'budget',
  showAmounts = true,
  className,
}: BudgetBarProps) {
  const { clampedPercent, status } = computeBudgetProgress(
    current,
    target,
    variant,
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="small text-ink truncate">{label}</span>
          {status === 'achieved' ? (
            <AchievementBadge label="Meta cumplida" />
          ) : null}
        </div>

        {showAmounts ? (
          <div className="flex items-baseline gap-1 shrink-0 tabular-nums">
            <Money value={current} currency={currency} size="small" />
            <span className="small text-ink-2">/</span>
            <Money
              value={target}
              currency={currency}
              size="small"
              tone="muted"
            />
          </div>
        ) : null}
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(clampedPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-chip bg-surface-sunk"
      >
        <div
          className={cn(
            'h-full rounded-chip transition-all duration-250',
            FILL_CLASSES[status],
          )}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}
