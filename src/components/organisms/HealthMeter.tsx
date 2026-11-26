'use client';

import { AlertTriangle, CalendarClock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Money, Skeleton, type CurrencyCode } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { computeCreditHealth, type CreditHealthLevel } from './health-meter';

export interface HealthMeterProps {
  totalLimit: number;
  totalUsed: number;
  currency?: CurrencyCode;
  nearestCutoffDays?: number | null;
  isLoading?: boolean;
  isRateUnavailable?: boolean;
  hasCards?: boolean;
  className?: string;
}

const BADGE_CLASSES: Record<CreditHealthLevel, string> = {
  optimal: 'bg-action-wash text-action',
  elevated: 'bg-surface-sunk text-pending',
  risk: 'bg-surface-sunk text-debit',
};

const BAR_CLASSES: Record<CreditHealthLevel, string> = {
  optimal: 'bg-action',
  elevated: 'bg-pending',
  risk: 'bg-debit',
};

/** Displays credit utilization with one protagonist percentage and a direct action insight. */
export function HealthMeter({
  totalLimit,
  totalUsed,
  currency = 'DOP',
  nearestCutoffDays = null,
  isLoading = false,
  isRateUnavailable = false,
  hasCards = true,
  className,
}: HealthMeterProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-panel border border-line bg-surface p-5 flex flex-col gap-4',
          className,
        )}
      >
        <Skeleton variant="line" className="w-32" label="Calculando salud crediticia" />
        <Skeleton variant="tile" />
        <Skeleton variant="line" />
      </div>
    );
  }

  if (isRateUnavailable) {
    return (
      <div
        className={cn(
          'rounded-panel border border-line bg-surface',
          className,
        )}
      >
        <EmptyState
          tone="error"
          icon={<AlertTriangle size={22} strokeWidth={2} />}
          title="Tasa de cambio no disponible"
          description="No pudimos convertir tus tarjetas. Reintenta cuando tengas conexión."
        />
      </div>
    );
  }

  if (!hasCards) {
    return (
      <div
        className={cn(
          'rounded-panel border border-line bg-surface',
          className,
        )}
      >
        <EmptyState
          icon={<ShieldCheck size={22} strokeWidth={2} />}
          title="Sin tarjetas de crédito activas"
          description="Cuando agregues una tarjeta de crédito verás aquí tu porcentaje de uso."
        />
      </div>
    );
  }

  const health = computeCreditHealth({
    totalLimit,
    totalUsed,
    nearestCutoffDays,
  });

  const showCutoffIcon =
    typeof nearestCutoffDays === 'number' &&
    nearestCutoffDays <= 5 &&
    totalUsed > 0;

  return (
    <section
      aria-label="Uso de crédito"
      className={cn(
        'rounded-panel border border-line bg-surface p-5 flex flex-col gap-4',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-ink-2">
          <ShieldCheck size={18} strokeWidth={2} className="text-action" />
          <h2 className="title-s text-ink">Uso de crédito</h2>
        </div>

        <span
          className={cn(
            'label rounded-chip px-2 py-0.5',
            BADGE_CLASSES[health.level],
          )}
        >
          {health.badgeLabel}
        </span>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="money-l text-ink tabular-nums">
            {health.utilizationPercent}%
          </p>
          <p className="small text-ink-2 mt-1">Límite utilizado</p>
        </div>

        <div className="text-right">
          <Money value={health.available} currency={currency} size="amount" />
          <p className="small text-ink-2 mt-0.5">Disponible</p>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Porcentaje de crédito utilizado"
        aria-valuenow={health.clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-chip bg-surface-sunk"
      >
        <div
          className={cn(
            'h-full rounded-chip transition-all duration-250',
            BAR_CLASSES[health.level],
          )}
          style={{ width: `${health.clampedPercent}%` }}
        />
      </div>

      <div className="flex items-start gap-2.5 border-t border-line pt-3">
        {showCutoffIcon ? (
          <CalendarClock size={16} strokeWidth={2} className="text-pending shrink-0 mt-0.5" />
        ) : health.level === 'risk' ? (
          <AlertTriangle size={16} strokeWidth={2} className="text-debit shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck size={16} strokeWidth={2} className="text-ink-2 shrink-0 mt-0.5" />
        )}
        <p className="small text-ink-2">{health.headline}</p>
      </div>
    </section>
  );
}
