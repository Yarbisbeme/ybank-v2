'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import type { Transaction } from '@/types';
import { cn } from '@/lib/utils';
import { Money, type CurrencyCode } from '@/components/atoms';
import { countsInReports } from '@/lib/reporting';

  export interface WeeklyActivityChartProps {
    transactions: Transaction[];
    currency?: CurrencyCode;
  }

  const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const emptySubscribe = () => () => { };

  function getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Flat 7-day spending bar chart anchored to the local RD Monday–Sunday week. */
  export function WeeklyActivityChart({
    transactions,
    currency = 'DOP',
  }: WeeklyActivityChartProps) {
    const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const weeklyData = useMemo(() => {
      if (!isHydrated) {
        return [];
      }

      const now = new Date();
      const todayStr = getLocalDateString(now);
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);

      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return getLocalDateString(d);
      });

          const stats = days.map((dayStr, index) => {
            const dayTxs = transactions.filter((tx) => {
              const txDateOnly = tx.date.split('T')[0].split(' ')[0];
              return txDateOnly === dayStr;
            });

              const expenseTxs = dayTxs.filter((tx) => {
                if (!countsInReports(tx)) return false;
                const isExpense = tx.type === 'expense';
                const isExternalTransfer =
                  tx.type === 'transfer' && !tx.transfer_to_account_id;
                return isExpense || isExternalTransfer;
              });

      const volume = expenseTxs.reduce(
                  (sum, tx) => sum + Math.abs(Number(tx.amount) || 0),
                  0,
                );

                return {
                  day: dayStr,
                  label: DAY_NAMES[index],
                  volume,
                  isToday: dayStr === todayStr,
                };
              });

    const maxVolume = Math.max(...stats.map((s) => s.volume), 1);

              return stats.map((stat) => ({
                ...stat,
                heightPercent: stat.volume > 0 ? Math.max((stat.volume / maxVolume) * 100, 14) : 10,
              }));
          }, [transactions, isHydrated]);

          if (!isHydrated || weeklyData.length === 0) {
            return <div className="h-36 w-full rounded-tile bg-surface-sunk" aria-hidden="true" />;
          }

          const todayIdx = Math.max(0, weeklyData.findIndex((d) => d.isToday));
          const selectedIdx = activeIndex !== null ? activeIndex : todayIdx;
          const activeDay = weeklyData[selectedIdx] ?? weeklyData[0];

          return (
    <div
      className="flex flex-col gap-3 w-full"
      onMouseLeave={() => setActiveIndex(null)}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="small text-ink-2">
          {activeDay.isToday ? 'Hoy' : activeDay.label}
        </span>
        <Money value={activeDay.volume} currency={currency} size="small" />
      </div>

      <div className="flex h-28 items-end gap-2">
        {weeklyData.map((data, index) => {
          const isSelected = selectedIdx === index;

          return (
            <div
              key={data.day}
              className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end"
            >
              <button
                type="button"
                aria-label={`${data.isToday ? 'Hoy' : data.label}: ${data.volume.toFixed(2)} ${currency}`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                style={{ height: `${data.heightPercent}%` }}
                className={cn(
                  'w-full rounded-chip transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                  data.isToday || isSelected
                    ? 'bg-action'
                    : 'bg-surface-sunk hover:bg-action-wash',
                )}
              />
              <span
                className={cn(
                  'nav',
                  data.isToday ? 'text-action' : 'text-ink-2',
                )}
              >
                {data.label}
              </span>
            </div>
          );
        })}
      </div>
    </div >
  );
  }

  export default WeeklyActivityChart;
