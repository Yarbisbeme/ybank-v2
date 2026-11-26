'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import type { Account } from '@/types';
import { useAccounts, useTransactionsList } from '@/hooks/useCatalogs';
import { useYBankStore } from '@/store/useYBankStore';
import { Money, Skeleton, Switch, YMark } from '@/components/atoms';
import { Segmented } from '@/components/molecules';
import { WeeklyActivityChart } from './WeeklyActivityChart';

const CURRENCY_OPTIONS: { value: 'DOP' | 'USD'; label: string }[] = [
  { value: 'DOP', label: 'DOP' },
  { value: 'USD', label: 'USD' },
];

/** Protagonist balance card with currency switcher, optional credit debt toggle, and 7-day activity. */
export default function HeroBalance() {
  const switchId = useId();
  const {
    currency,
    preferredRate,
    isCalculatingRate,
    setCurrency,
    updateRateContext,
  } = useYBankStore();
  const [includeCredit, setIncludeCredit] = useState(false);

  const { data: accounts = [], isLoading: isLoadingAccs } = useAccounts();
  const { data: queryData, isLoading: isLoadingTx } = useTransactionsList();

  const transactions = useMemo(
    () => (Array.isArray(queryData) ? queryData : queryData?.transactions || []),
    [queryData],
  );

  useEffect(() => {
    if (isLoadingAccs || accounts.length === 0) {
      return;
    }

    const focusAccount =
      accounts.find(
        (a: Account) => a.id === useYBankStore.getState().preferredAccountId,
      ) ||
      accounts.find((a: Account) => a.type !== 'credit_card') ||
      accounts[0];

    const institutionId = focusAccount?.institution_id;

    if (
      institutionId &&
      preferredRate?.institutionName !== focusAccount?.institution?.name
    ) {
      updateRateContext(institutionId);
    }
  }, [accounts, isLoadingAccs, preferredRate, updateRateContext]);

  const displayBalance = useMemo(() => {
    const rate = preferredRate?.rate || 1;

    const convertToActiveCurrency = (acc: Account) => {
      const balance = Number(acc.current_balance) || 0;
      if (currency === 'USD') {
        return acc.currency === 'DOP' ? balance / rate : balance;
      }
      return acc.currency === 'USD' ? balance * rate : balance;
    };

    const available = accounts
      .filter((a: Account) => a.type !== 'credit_card')
      .reduce((sum: number, a: Account) => sum + convertToActiveCurrency(a), 0);

    const debt = accounts
      .filter((a: Account) => a.type === 'credit_card')
      .reduce((sum: number, a: Account) => sum + convertToActiveCurrency(a), 0);

    return includeCredit ? available - Math.abs(debt) : available;
  }, [accounts, currency, preferredRate, includeCredit]);

  if (isLoadingAccs || isLoadingTx) {
    return (
      <div className="rounded-panel border border-line bg-surface p-6 flex flex-col gap-5 h-full">
        <Skeleton variant="line" className="w-40" label="Cargando balance" />
        <Skeleton variant="tile" className="h-14" />
        <Skeleton variant="line" className="w-56" />
      </div>
    );
  }

  return (
    <section
      aria-label="Balance general"
      className="h-full rounded-panel border border-line bg-surface p-5 sm:p-6 flex flex-col md:flex-row gap-6 md:gap-8"
    >
      <div className="flex flex-1 flex-col justify-between gap-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="label text-ink-2">
              {includeCredit ? 'Balance neto' : 'Balance disponible'}
            </span>
            {isCalculatingRate ? (
              <YMark size={14} animation="loop" tone="action" />
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor={switchId} className="small text-ink-2 cursor-pointer">
              Incluir deuda
            </label>
            <Switch
              id={switchId}
              checked={includeCredit}
              onCheckedChange={setIncludeCredit}
              aria-label="Incluir deuda de tarjetas de crédito"
            />
          </div>
        </div>

        <div className="min-w-0">
          <Money
            value={displayBalance}
            currency={currency}
            size="xl"
            tone={displayBalance < 0 ? 'debit' : 'default'}
            className="block truncate"
          />
          <p className="small text-ink-2 mt-2">
            {accounts.length === 0
              ? 'Agrega una cuenta para ver tu balance consolidado.'
              : includeCredit
                ? 'Incluye el saldo utilizado en tus tarjetas de crédito.'
                : 'Suma de tus cuentas de ahorro, corriente y efectivo.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Segmented<'DOP' | 'USD'>
            aria-label="Moneda de visualización"
            size="sm"
            options={CURRENCY_OPTIONS}
            value={currency}
            onChange={setCurrency}
          />

          {currency === 'USD' && preferredRate ? (
            <span className="rounded-chip bg-surface-sunk px-2.5 py-1 small text-ink-2 tabular-nums">
              1 USD = {preferredRate.rate} DOP · {preferredRate.institutionName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="hidden md:flex w-64 shrink-0 flex-col justify-between border-l border-line pl-6">
        <p className="label text-ink-2">Gastos de la semana</p>
        <WeeklyActivityChart transactions={transactions} currency={currency} />
      </div>
    </section>
  );
}
