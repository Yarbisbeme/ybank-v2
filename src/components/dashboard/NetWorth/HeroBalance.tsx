'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Account, Transaction } from '@/types';
import { useAccounts, useTransactionsList } from '@/hooks/useCatalogs';
import { useYBankStore } from '@/store/useYBankStore';
import {
  AchievementBadge,
  Money,
  Skeleton,
  YMark,
  formatMoney,
} from '@/components/atoms';
import { Segmented } from '@/components/molecules';
import { countsInReports } from '@/lib/reporting';

const CURRENCY_OPTIONS: { value: 'DOP' | 'USD'; label: string }[] = [
  { value: 'DOP', label: 'DOP' },
  { value: 'USD', label: 'USD' },
];

const DEBT_OPTIONS: { value: 'without' | 'with'; label: string }[] = [
  { value: 'without', label: 'Sin deudas' },
  { value: 'with', label: 'Con deudas' },
];

/** Protagonist balance panel matching YBank 2.0 desktop-home without truncation. */
export default function HeroBalance() {
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
    () =>
      (Array.isArray(queryData)
        ? queryData
        : queryData?.transactions || []) as Transaction[],
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

    const { displayBalance, oppositeBalance, oppositeCurrency, savingsCount, liquidCount } =
      useMemo(() => {
        const rate = preferredRate?.rate || 1;
        const otherCurrency: 'DOP' | 'USD' = currency === 'DOP' ? 'USD' : 'DOP';

        const convertToActiveCurrency = (acc: Account) => {
          const balance = Number(acc.current_balance) || 0;
          if (currency === 'USD') {
            return acc.currency === 'DOP' ? balance / rate : balance;
          }
          return acc.currency === 'USD' ? balance * rate : balance;
        };

        const nonCredit = accounts.filter((a: Account) => a.type !== 'credit_card');
        const available = nonCredit.reduce(
          (sum: number, a: Account) => sum + convertToActiveCurrency(a),
          0,
        );

        const debt = accounts
          .filter((a: Account) => a.type === 'credit_card')
          .reduce((sum: number, a: Account) => sum + convertToActiveCurrency(a), 0);

        const oppTotal = nonCredit
          .filter((a: Account) => a.currency === otherCurrency)
          .reduce(
            (sum: number, a: Account) => sum + (Number(a.current_balance) || 0),
            0,
          );

        return {
          displayBalance: includeCredit ? available - Math.abs(debt) : available,
          oppositeBalance: oppTotal,
          oppositeCurrency: otherCurrency,
          savingsCount: accounts.filter((a: Account) => a.type === 'savings').length,
          liquidCount: accounts.filter(
            (a: Account) => a.type === 'checking' || a.type === 'cash',
          ).length,
        };
      }, [accounts, currency, preferredRate, includeCredit]);

    const { monthExpenses, savingsDeltaPct } = useMemo(() => {
      const rate = preferredRate?.rate || 1;
      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = now.getMonth();
      const prevDate = new Date(curYear, curMonth - 1, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = prevDate.getMonth();

          let currentTotal = 0;
          let previousTotal = 0;

          for (const tx of transactions) {
            if (tx.type !== 'expense' || !tx.date || !countsInReports(tx)) {
              continue;
            }
          const parsed = new Date(`${tx.date.slice(0, 10)}T00:00:00`);
          if (Number.isNaN(parsed.getTime())) {
            continue;
          }
          const accCurrency = tx.account?.currency ?? 'DOP';
          let amount = Math.abs(Number(tx.amount) || 0);
          if (currency === 'USD' && accCurrency === 'DOP') {
            amount = amount / rate;
          } else if (currency === 'DOP' && accCurrency === 'USD') {
            amount = amount * rate;
          }

          if (parsed.getFullYear() === curYear && parsed.getMonth() === curMonth) {
            currentTotal += amount;
          } else if (
            parsed.getFullYear() === prevYear &&
            parsed.getMonth() === prevMonth
          ) {
            previousTotal += amount;
          }
        }

        const deltaPct =
          previousTotal > 0 && currentTotal < previousTotal
            ? Math.round(((previousTotal - currentTotal) / previousTotal) * 100)
            : null;

    return {
      monthExpenses: currentTotal,
      savingsDeltaPct: deltaPct,
    };
  }, [transactions, currency, preferredRate]);

  if (isLoadingAccs || isLoadingTx) {
    return (
      <div className="py-1 md:rounded-panel md:border md:border-line md:bg-surface md:p-6 flex flex-col gap-4 h-full">
        <Skeleton variant="line" className="w-40" label="Cargando balance" />
        <Skeleton variant="tile" className="h-14" />
        <Skeleton variant="line" className="w-56" />
      </div>
    );
  }

  return (
    <section
      aria-label="Balance general"
      className="h-full flex flex-col justify-between gap-2 md:gap-5 py-1 md:rounded-panel md:border md:border-line md:bg-surface md:p-6"
    >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="small md:body text-ink-2">
                {includeCredit ? 'Balance neto' : 'Tienes en total'}
              </span>
              {isCalculatingRate ? (
                <YMark size={14} animation="loop" tone="action" />
              ) : null}
            </div>

        <div className="flex flex-wrap items-center gap-2">
                <Segmented<'without' | 'with'>
                  aria-label="Incluir deudas"
                  size="sm"
                  options={DEBT_OPTIONS}
                  value={includeCredit ? 'with' : 'without'}
                  onChange={(val) => setIncludeCredit(val === 'with')}
                />

                <div className="hidden md:block">
                  <Segmented<'DOP' | 'USD'>
                    aria-label="Moneda de visualización"
                    size="sm"
                    options={CURRENCY_OPTIONS}
                    value={currency}
                    onChange={setCurrency}
                  />
                </div>
              </div>
            </div>

                <div className="flex flex-col md:flex-row md:flex-wrap md:items-baseline gap-x-4 gap-y-1">
                  <Money
                    value={displayBalance}
                    currency={currency}
                    size="hero"
                    tone={displayBalance < 0 ? 'debit' : 'default'}
                  />
                  <span className="small md:body text-ink-2 tabular-nums">
                    + {formatMoney(oppositeBalance, { currency: oppositeCurrency })} · {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
                  </span>
                </div>

                <div className="hidden md:flex flex-wrap items-center gap-x-10 gap-y-3 border-t border-line pt-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="label text-ink-2">Cuentas de ahorro</span>
                    <span className="title text-ink tabular-nums">{savingsCount}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="label text-ink-2">Corriente y efectivo</span>
                    <span className="title text-ink tabular-nums">{liquidCount}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="label text-ink-2">Este mes</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="title text-ink tabular-nums">
                        {monthExpenses > 0
                          ? formatMoney(-monthExpenses, { currency })
                          : formatMoney(0, { currency })}
                      </span>
                      {savingsDeltaPct !== null && savingsDeltaPct > 0 ? (
                        <AchievementBadge label={`−${savingsDeltaPct}% vs mes ant.`} />
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            );
}
