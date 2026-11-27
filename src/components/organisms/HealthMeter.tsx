'use client';

import Link from 'next/link';
import { AlertTriangle, CalendarClock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton, formatMoney, type CurrencyCode } from '@/components/atoms';
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
  variant?: 'surface' | 'ink';
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const BADGE_CLASSES: Record<CreditHealthLevel, string> = {
  optimal: 'bg-action-wash text-action',
  elevated: 'bg-surface-sunk text-pending',
  risk: 'bg-surface-sunk text-debit',
};

const BAR_CLASSES: Record<CreditHealthLevel, string> = {
  optimal: 'bg-credit',
  elevated: 'bg-pending',
  risk: 'bg-debit',
};

const STATUS_TEXT_INK: Record<CreditHealthLevel, string> = {
  optimal: 'text-credit',
  elevated: 'text-pending',
  risk: 'text-debit',
};

/** Displays financial health / credit utilization in either dark ink block or flat surface card. */
export function HealthMeter({
  totalLimit,
  totalUsed,
  currency = 'DOP',
  nearestCutoffDays = null,
  isLoading = false,
  isRateUnavailable = false,
  hasCards = true,
  variant = 'surface',
  actionHref,
  actionLabel,
  onAction,
  className,
}: HealthMeterProps) {
  const isInk = variant === 'ink';

  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-panel border p-6 flex flex-col justify-between gap-4',
          isInk ? 'health-card-ink' : 'border-line bg-surface',
          className,
        )}
      >
        <Skeleton variant="line" className="w-32" label="Calculando salud financiera" />
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
    if (isInk) {
      return (
        <section
          aria-label="Salud financiera"
          className={cn(
            'rounded-panel border health-card-ink p-4 md:p-6 flex flex-col justify-between gap-2.5 md:gap-4',
            className,
          )}
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="title text-current">Salud financiera</h2>
            <span className="small text-credit">Sin deuda</span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="display tabular-nums">100</span>
            <span className="body health-card-ink-muted">/ 100</span>
          </div>

          <div
            role="meter"
            aria-label="Salud financiera"
            aria-valuenow={100}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-full overflow-hidden rounded-chip health-card-ink-track"
          >
            <div className="h-full w-full bg-credit" />
          </div>

          <p className="body health-card-ink-muted">
            No tienes deuda en tarjetas de crédito. Agrega una cuando quieras vigilar tu uso y fecha de corte.
          </p>

          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="self-start body-strong health-card-ink-link hover:underline cursor-pointer"
            >
              {actionLabel ?? 'Agregar tarjeta'}
            </button>
          ) : actionHref ? (
            <Link
              href={actionHref}
              className="self-start body-strong health-card-ink-link hover:underline"
            >
              {actionLabel ?? 'Ver tarjetas'}
            </Link>
          ) : null}
        </section>
      );
    }

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

  const score = Math.max(0, Math.min(100, 100 - health.utilizationPercent));

  const showCutoffIcon =
    typeof nearestCutoffDays === 'number' &&
    nearestCutoffDays <= 5 &&
    totalUsed > 0;

  if (isInk) {
    return (
      <section
        aria-label="Salud financiera"
        className={cn(
          'rounded-panel border health-card-ink p-4 md:p-6 flex flex-col justify-between gap-2.5 md:gap-4',
          className,
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="title text-current">Salud financiera</h2>
          <span className={cn('small', STATUS_TEXT_INK[health.level])}>
            {health.badgeLabel}
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="display tabular-nums">{score}</span>
            <span className="body health-card-ink-muted">/ 100</span>
          </div>
          <p className="hidden md:block small health-card-ink-muted mt-1 tabular-nums">
            {health.utilizationPercent}% usado · Disponible{' '}
            {formatMoney(health.available, { currency })}
          </p>
        </div>

        <div
          role="meter"
          aria-label="Salud financiera"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full overflow-hidden rounded-chip health-card-ink-track"
        >
          <div
            className={cn(
              'h-full transition-all duration-250',
              BAR_CLASSES[health.level],
            )}
            style={{ width: `${score}%` }}
          />
        </div>

        <p className="body health-card-ink-muted">{health.headline}</p>

        {actionHref ? (
          <Link
            href={actionHref}
            className="self-start body-strong health-card-ink-link hover:underline"
          >
            {actionLabel ?? 'Ver cómo mejorar'}
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="self-start body-strong health-card-ink-link hover:underline cursor-pointer"
          >
            {actionLabel ?? 'Ver cómo mejorar'}
          </button>
        ) : null}
      </section>
    );
  }

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
          <span className="amount tabular-nums text-ink">
            {formatMoney(health.available, { currency })}
          </span>
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
