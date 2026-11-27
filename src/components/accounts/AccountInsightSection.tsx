'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useAccounts,
  useProfile,
  useTransactionsList,
} from '@/hooks/useCatalogs';
import { useModalStore } from '@/store/useModalStore';
import { cn } from '@/lib/utils';
import {
  AchievementBadge,
  Money,
  Skeleton,
  formatMoney,
} from '@/components/atoms';
import { sortAccountsByPrimary, type CreditUsageTone } from './account-carousel';
import {
  computeAccountDetailMetrics,
  type AccountDetailTransaction,
} from './account-detail';

const CREDIT_BAR_CLASSES: Record<CreditUsageTone, string> = {
  credit: 'bg-credit',
  pending: 'bg-pending',
  debit: 'bg-debit',
};

const CREDIT_TEXT_CLASSES: Record<CreditUsageTone, string> = {
  credit: 'text-credit',
  pending: 'text-pending',
  debit: 'text-debit',
};

/** Protagonist cash-flow summary, credit limit bar, and conditional attention items inside the /accounts stage. */
export default function AccountInsightSection() {
  const searchParams = useSearchParams();
  const openModal = useModalStore((state) => state.openModal);
  const urlAccountId = searchParams.get('accountId');

  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: profile } = useProfile();
  const { data: txData, isLoading: isLoadingTx } = useTransactionsList();

  const sortedAccounts = useMemo(
    () => sortAccountsByPrimary(accounts, profile?.primary_account_id),
    [accounts, profile?.primary_account_id],
  );

  const activeAccount = useMemo(() => {
    if (sortedAccounts.length === 0) {
      return null;
    }
    return (
      sortedAccounts.find((acc) => acc.id === urlAccountId) ?? sortedAccounts[0]
    );
  }, [sortedAccounts, urlAccountId]);

  const transactions = useMemo(
    () =>
      (Array.isArray(txData)
        ? txData
        : txData?.transactions || []) as AccountDetailTransaction[],
    [txData],
  );

  const metrics = useMemo(() => {
    if (!activeAccount) {
      return null;
    }
    return computeAccountDetailMetrics(activeAccount, transactions);
  }, [activeAccount, transactions]);

  if (isLoadingAccounts || (isLoadingTx && transactions.length === 0)) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton variant="line" className="w-48" label="Cargando resumen" />
        <Skeleton variant="tile" className="h-12 w-64" />
      </div>
    );
  }

  if (!activeAccount || !metrics) {
    return null;
  }

  const hasAttentionItems =
    metrics.uncategorizedCount > 0 || metrics.showCutoffAlert;
  const isCutoffUrgent =
    metrics.daysUntilCutoff !== null && metrics.daysUntilCutoff <= 5;
  const lastMovementText = metrics.lastTransaction
    ? `Último movimiento: ${metrics.lastTransaction.description}${metrics.lastTransaction.dateLabel ? ` · ${metrics.lastTransaction.dateLabel}` : ''}`
    : 'Sin movimientos en esta cuenta';

  const creditMeterBar = (
    <div
      role="meter"
      aria-label="Uso de límite"
      aria-valuenow={metrics.creditPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2.5 w-full overflow-hidden rounded-chip y2-track"
    >
      <div
        className={cn(
          'h-full transition-all duration-250',
          CREDIT_BAR_CLASSES[metrics.creditTone],
        )}
        style={{ width: `${metrics.creditPercent}%` }}
      />
    </div>
  );

  return (
    <div
      aria-label="Resumen de la tarjeta"
      className="flex flex-col gap-5 lg:h-full lg:justify-between"
    >
      {metrics.isCreditCard ? (
        <>
          <div className="md:hidden flex flex-col justify-between gap-2 min-h-30">
            <div className="flex flex-col gap-1.5">
              <span className="small text-ink-2">Balance</span>
              <Money
                value={metrics.creditAvailable}
                currency={activeAccount.currency}
                size="l"
              />
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-baseline justify-between gap-2 small">
                <span className="text-ink-2 tabular-nums">
                  Límite{' '}
                  {formatMoney(metrics.creditLimit, {
                    currency: activeAccount.currency,
                  })}
                </span>
                <span
                  className={cn(
                    'tabular-nums font-semibold',
                    CREDIT_TEXT_CLASSES[metrics.creditTone],
                  )}
                >
                  {metrics.creditPercent}%
                </span>
              </div>
              {creditMeterBar}
            </div>
          </div>

          <div className="hidden md:flex flex-col justify-between gap-2 min-h-30">
            <div className="flex flex-col gap-1.5">
              <span className="small text-ink-2">
                Gastado · {metrics.monthLabel}
              </span>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Money
                  value={metrics.monthSpend}
                  currency={activeAccount.currency}
                  size="l"
                />
                {metrics.savingsDeltaPct !== null &&
                metrics.savingsDeltaPct > 0 ? (
                  <AchievementBadge
                    label={`−${metrics.savingsDeltaPct}% vs ${metrics.prevMonthLabel}`}
                  />
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2 small">
                <span className="text-ink-2">
                  Disponible{' '}
                  <strong className="font-semibold text-ink tabular-nums">
                    {formatMoney(metrics.creditAvailable, {
                      currency: activeAccount.currency,
                    })}
                  </strong>{' '}
                  <span className="tabular-nums">
                    · Límite{' '}
                    {formatMoney(metrics.creditLimit, {
                      currency: activeAccount.currency,
                    })}
                  </span>
                </span>
                <span
                  className={cn(
                    'tabular-nums font-semibold',
                    CREDIT_TEXT_CLASSES[metrics.creditTone],
                  )}
                >
                  {metrics.creditPercent}%
                </span>
              </div>
              {creditMeterBar}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="md:hidden flex flex-col justify-between gap-2 min-h-30">
            <div className="flex flex-col gap-1.5">
              <span className="small text-ink-2">
                Entradas · {metrics.monthLabel}
              </span>
              <Money
                value={metrics.monthInflow}
                currency={activeAccount.currency}
                size="l"
                tone={metrics.monthInflow > 0 ? 'income' : 'muted'}
                sign={metrics.monthInflow > 0 ? 'positive' : 'none'}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 small">
                <span className="text-ink-2">
                  Salidas · {metrics.monthLabel}
                </span>
                <span className="tabular-nums font-medium text-ink">
                  {metrics.monthOutflow > 0
                    ? `− ${formatMoney(metrics.monthOutflow, {
                        currency: activeAccount.currency,
                      })}`
                    : formatMoney(0, { currency: activeAccount.currency })}
                </span>
              </div>
              <p className="small text-ink-2 truncate">{lastMovementText}</p>
            </div>
          </div>

          <div className="hidden md:flex flex-col justify-between gap-2.5 min-h-30">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="small text-ink-2">
                  Entradas · {metrics.monthLabel}
                </span>
                <Money
                  value={metrics.monthInflow}
                  currency={activeAccount.currency}
                  size="l"
                  tone={metrics.monthInflow > 0 ? 'income' : 'muted'}
                  sign={metrics.monthInflow > 0 ? 'positive' : 'none'}
                />
              </div>

              <div className="flex flex-col gap-1 min-w-0">
                <span className="small text-ink-2">
                  Salidas · {metrics.monthLabel}
                </span>
                <Money
                  value={metrics.monthOutflow}
                  currency={activeAccount.currency}
                  size="l"
                />
                {metrics.savingsDeltaPct !== null &&
                metrics.savingsDeltaPct > 0 ? (
                  <AchievementBadge
                    label={`−${metrics.savingsDeltaPct}% vs ${metrics.prevMonthLabel}`}
                    className="self-start mt-0.5"
                  />
                ) : null}
              </div>
            </div>

            <p className="small text-ink-2 truncate">{lastMovementText}</p>
          </div>
        </>
      )}

      <div className="flex flex-col border-t border-line pt-3.5 min-h-24 justify-start lg:min-h-22">
        {hasAttentionItems ? (
          <>
            <h3 className="label text-ink-2 pb-1.5">Requiere tu atención</h3>

            {metrics.uncategorizedCount > 0 && metrics.firstUncategorizedTx ? (
              <div className="flex min-h-10 items-center justify-between gap-3 py-1">
                <span className="body-strong text-ink">
                  Categorizar {metrics.uncategorizedCount}{' '}
                  {metrics.uncategorizedCount === 1
                    ? 'movimiento'
                    : 'movimientos'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const tx = metrics.firstUncategorizedTx;
                    if (!tx) return;
                    openModal('transaction', {
                      transactionId: tx.id,
                      accountId: tx.account_id,
                      initialData: tx,
                    });
                  }}
                  className="small text-action hover:underline cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
                >
                  Revisar
                </button>
              </div>
            ) : null}

            {metrics.showCutoffAlert && metrics.daysUntilCutoff !== null ? (
              <div
                className={cn(
                  'flex min-h-11 items-center justify-between gap-3 py-1.5',
                  metrics.uncategorizedCount > 0 && 'border-t border-line',
                )}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="body-strong text-ink truncate">
                    Corte tarjeta {activeAccount.name}
                  </span>
                  <span
                    className={cn(
                      'label',
                      isCutoffUrgent ? 'text-pending' : 'text-ink-2',
                    )}
                  >
                    Corta el día {metrics.cutoffDay} ·{' '}
                    {metrics.daysUntilCutoff === 0
                      ? 'corta hoy'
                      : `faltan ${metrics.daysUntilCutoff} ${metrics.daysUntilCutoff === 1 ? 'día' : 'días'}`}
                  </span>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <h3 className="label text-ink-2 pb-1.5">Estado</h3>
            <p className="small text-ink-2 py-1">
              Al día · todos tus movimientos tienen categoría
            </p>
          </>
        )}
      </div>
    </div>
  );
}
