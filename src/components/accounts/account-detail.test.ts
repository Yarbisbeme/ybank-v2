import { describe, expect, it } from 'vitest';
import type { Account, Institution } from '@/types';
import {
  buildAccountDetailMetrics,
  computeDaysUntilCutoff,
  type AccountMonthMetricsRow,
} from './account-detail';

const MOCK_INSTITUTION: Institution = {
  id: 'inst-1',
  name: 'LAFISE',
  logo_url: null,
  exchange_rate_adjustment: 0,
  exchange_rate_buy_adjustment: 0,
  created_at: '2026-01-01T00:00:00Z',
  brand_color_primary: '#1f4bff',
};

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    user_id: 'user-1',
    institution_id: 'inst-1',
    name: 'Ahorro viaje',
    type: 'savings',
    currency: 'DOP',
    color: '#1f4bff',
    color_secondary: null,
    card_base: 'textured',
    card_shape_intensity: 1,
    card_finish: 'matte',
    network: null,
    custom_pattern: 'dots',
    custom_text_theme: 'light',
    current_balance: 10000,
    initial_balance: 10000,
    last_4_digits: '9287',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    institution: MOCK_INSTITUTION,
    ...overrides,
  };
}

function makeRow(overrides: Partial<AccountMonthMetricsRow> = {}): AccountMonthMetricsRow {
  return {
    month_start: '2026-11-01',
    month_spend: 0,
    month_count: 0,
    month_income: 0,
    month_inflow: 0,
    month_outflow: 0,
    prev_month_spend: 0,
    uncategorized_count: 0,
    first_uncategorized_id: null,
    last_description: null,
    last_date: null,
    ...overrides,
  };
}

describe('computeDaysUntilCutoff', () => {
  it('computes days remaining in the same month and rolls over cleanly to next month', () => {
    expect(computeDaysUntilCutoff(28, new Date(2026, 10, 25))).toBe(3);
    expect(computeDaysUntilCutoff(25, new Date(2026, 10, 25))).toBe(0);
    expect(computeDaysUntilCutoff(10, new Date(2026, 10, 27))).toBe(13);
    expect(computeDaysUntilCutoff(null, new Date(2026, 10, 27))).toBeNull();
  });
});

// The figures themselves are computed in Postgres (supabase/tests/metrics.test.sql);
// these tests cover the shaping done in the browser.
describe('buildAccountDetailMetrics', () => {
  it('passes the Postgres figures through and adds labels and the spend comparison', () => {
    const metrics = buildAccountDetailMetrics(
      makeAccount(),
      makeRow({
        month_spend: 1700,
        month_count: 3,
        month_income: 15000,
        month_inflow: 20800,
        month_outflow: 2200,
        prev_month_spend: 2000,
        uncategorized_count: 2,
        first_uncategorized_id: 'tx-9',
        last_description: '  Traspaso recibido ',
        last_date: '2026-11-28',
      }),
      new Date(2026, 10, 27),
    );
    expect(metrics.monthLabel).toBe('noviembre');
    expect(metrics.prevMonthLabel).toBe('octubre');
    expect(metrics.monthSpend).toBe(1700);
    expect(metrics.monthIncome).toBe(15000);
    expect(metrics.monthInflow).toBe(20800);
    expect(metrics.monthOutflow).toBe(2200);
    expect(metrics.prevMonthSpend).toBe(2000);
    expect(metrics.savingsDeltaPct).toBe(15);
    expect(metrics.uncategorizedCount).toBe(2);
    expect(metrics.firstUncategorizedId).toBe('tx-9');
    expect(metrics.lastTransaction).toEqual({ description: 'Traspaso recibido', dateLabel: '28 nov' });
  });

  it('shows empty figures while the metrics are not loaded yet', () => {
    const metrics = buildAccountDetailMetrics(makeAccount(), null, new Date(2026, 10, 27));
    expect(metrics.monthSpend).toBe(0);
    expect(metrics.lastTransaction).toBeNull();
    expect(metrics.firstUncategorizedId).toBeNull();
    expect(metrics.savingsDeltaPct).toBeNull();
  });

  it('activates cutoff alert when credit card has used balance and cutoff day', () => {
    const cc = makeAccount({
      type: 'credit_card',
      name: 'Infinite',
      credit_limit: 20000,
      current_balance: -4120,
      cutoff_day: 28,
    });
    const metrics = buildAccountDetailMetrics(cc, makeRow(), new Date(2026, 10, 25));
    expect(metrics.isCreditCard).toBe(true);
    expect(metrics.creditAvailable).toBe(15880);
    expect(metrics.daysUntilCutoff).toBe(3);
    expect(metrics.showCutoffAlert).toBe(true);
  });
});
