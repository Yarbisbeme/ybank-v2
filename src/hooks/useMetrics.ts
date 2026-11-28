'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/shared/supabase/browser';
import { metricsKeys } from '@/lib/metrics-keys';
import { dashboardWindow, toIsoDate, type SpendingRow } from '@/lib/spending';
import type { AccountMonthMetricsRow } from '@/components/accounts/account-detail';

/** Monthly metrics of one account, computed in Postgres over all of its movements. */
export function useAccountMonthMetrics(accountId: string | null | undefined) {
  const month = toIsoDate(new Date()).slice(0, 7);
  return useQuery({
    queryKey: metricsKeys.account(accountId ?? '', month),
    enabled: Boolean(accountId),
    queryFn: async (): Promise<AccountMonthMetricsRow | null> => {
      const { data, error } = await getSupabaseBrowserClient().rpc('account_month_metrics', {
        p_account_id: accountId,
      });
      if (error) throw new Error(error.message);
      const row = (data as AccountMonthMetricsRow[] | null)?.[0];
      return row ? normalizeNumbers(row) : null;
    },
  });
}

/** Spending per day/currency/category since the first day of last month (all dashboard figures). */
export function useDashboardSpending() {
  const window = dashboardWindow();
  const query = useQuery({
    queryKey: metricsKeys.spending(window.from, window.to),
    queryFn: async (): Promise<SpendingRow[]> => {
      const { data, error } = await getSupabaseBrowserClient().rpc('spending_by_day', {
        p_from: window.from,
        p_to: window.to,
      });
      if (error) throw new Error(error.message);
      return ((data as SpendingRow[] | null) ?? []).map((r) => ({ ...r, total: Number(r.total) || 0 }));
    },
  });
  return { ...query, window };
}

// numeric columns may arrive as strings depending on the driver; the UI wants numbers.
function normalizeNumbers(row: AccountMonthMetricsRow): AccountMonthMetricsRow {
  return {
    ...row,
    month_spend: Number(row.month_spend) || 0,
    month_count: Number(row.month_count) || 0,
    month_income: Number(row.month_income) || 0,
    month_inflow: Number(row.month_inflow) || 0,
    month_outflow: Number(row.month_outflow) || 0,
    prev_month_spend: Number(row.prev_month_spend) || 0,
    uncategorized_count: Number(row.uncategorized_count) || 0,
  };
}
