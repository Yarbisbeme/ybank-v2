'use client';

import { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardSpending } from '@/hooks/useMetrics';
import { categoryBreakdown } from '@/lib/spending';
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
  // Complete figures from Postgres (the table only holds one page of movements).
  const { data: spendingRows = [], isLoading, window: spendWindow } = useDashboardSpending();

  const currentMonthIndex = new Date().getMonth();
  const monthName = MONTHS_ES[currentMonthIndex] ?? 'este mes';

  const breakdown = useMemo(() => {
    const sorted = categoryBreakdown(spendingRows, spendWindow.monthStart, {
      currency,
      rate: preferredRate?.rate || 1,
    });

    const maxTotal = sorted[0]?.total || 1;
    return sorted.map((entry, idx) => ({
      ...entry,
      percent: Math.max(6, Math.round((entry.total / maxTotal) * 100)),
      isLead: idx === 0,
    }));
  }, [spendingRows, spendWindow.monthStart, currency, preferredRate]);

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