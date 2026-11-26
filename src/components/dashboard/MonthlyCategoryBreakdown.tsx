'use client';

import { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import type { Transaction } from '@/types';
import { cn } from '@/lib/utils';
import { useTransactionsList } from '@/hooks/useCatalogs';
import { useYBankStore } from '@/store/useYBankStore';
import { Skeleton, formatMoney } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';

const MONTHS_ES = [
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

/** Top-5 current month category spending bars matching YBank 2.0 desktop-home. */
export default function MonthlyCategoryBreakdown() {
  const { currency, preferredRate } = useYBankStore();
  const { data: txData, isLoading } = useTransactionsList();

  const currentMonthIndex = new Date().getMonth();
  const monthName = MONTHS_ES[currentMonthIndex] ?? 'este mes';

  const breakdown = useMemo(() => {
    const transactions = (
      Array.isArray(txData) ? txData : txData?.transactions || []
    ) as Transaction[];
    const rate = preferredRate?.rate || 1;
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const byCategory = new Map<string, number>();

    for (const tx of transactions) {
      if (tx.type !== 'expense' || !tx.date) {
        continue;
      }
      const parsed = new Date(`${tx.date.slice(0, 10)}T00:00:00`);
      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getFullYear() !== curYear ||
        parsed.getMonth() !== curMonth
      ) {
        continue;
      }

      const accCurrency = tx.account?.currency ?? 'DOP';
      let amount = Math.abs(Number(tx.amount) || 0);
      if (currency === 'USD' && accCurrency === 'DOP') {
        amount = amount / rate;
      } else if (currency === 'DOP' && accCurrency === 'USD') {
        amount = amount * rate;
      }

      const categoryName = tx.category?.name || 'Otros gastos';
      byCategory.set(categoryName, (byCategory.get(categoryName) ?? 0) + amount);
    }

    const sorted = Array.from(byCategory.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const maxTotal = sorted[0]?.total || 1;
    return sorted.map((entry, idx) => ({
      ...entry,
      percent: Math.max(6, Math.round((entry.total / maxTotal) * 100)),
      isLead: idx === 0,
    }));
  }, [txData, currency, preferredRate]);

  if (isLoading) {
    return (
      <div className="rounded-panel border border-line bg-surface p-5 sm:p-6 flex flex-col gap-4">
        <Skeleton variant="line" className="w-48" label="Cargando gastos por categoría" />
        <Skeleton variant="tile" />
        <Skeleton variant="tile" />
        <Skeleton variant="tile" />
      </div>
    );
  }

  return (
    <section
      aria-label={`En qué se fue ${monthName}`}
      className="rounded-panel border border-line bg-surface p-5 sm:p-6 flex flex-col gap-4"
    >
      <h2 className="title text-ink">En qué se fue {monthName}</h2>

      {breakdown.length === 0 ? (
        <EmptyState
          icon={<PieChart size={22} strokeWidth={2} />}
          title="Sin gastos este mes"
          description="Cuando registres gastos verás aquí tus categorías principales."
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {breakdown.map((item) => (
            <div key={item.name} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 small">
                <span className="text-ink truncate">{item.name}</span>
                <span className="text-ink-2 tabular-nums shrink-0">
                  {formatMoney(item.total, { currency })}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-chip bg-surface-sunk">
                <div
                  className={cn(
                    'h-full rounded-chip transition-all duration-250',
                    item.isLead ? 'bg-ink' : 'bg-line-strong',
                  )}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}