import { describe, expect, it } from 'vitest';
import type { Account, Institution } from '@/types';
import {
  computeAccountDetailMetrics,
  computeDaysUntilCutoff,
  type AccountDetailTransaction,
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

function makeTx(
  overrides: Partial<AccountDetailTransaction> = {},
): AccountDetailTransaction {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    category_id: 'cat-1',
    transfer_to_account_id: null,
    type: 'expense',
    description: 'Colmado',
    date: '2026-11-15',
    status: 'completed',
    payment_method: 'card',
    amount: 500,
    created_at: '2026-11-15T12:00:00Z',
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

describe('computeAccountDetailMetrics', () => {
  it('computes monthly income, spend comparison, last movement, and uncategorized items', () => {
    const ref = new Date(2026, 10, 27); // Nov 27, 2026
    const acc = makeAccount();
    const txs = [
      makeTx({ id: 't1', description: 'Supermercado', date: '2026-11-05', amount: 1700, category_id: 'cat-food' }),
      makeTx({ id: 't2', description: 'Quincena', type: 'income', date: '2026-11-18', amount: 15000, category_id: 'cat-salary' }),
      makeTx({ id: 't3', description: 'Retiro', date: '2026-11-22', amount: 0, category_id: null }),
      makeTx({ id: 't4', date: '2026-11-11', type: 'transfer', amount: 500, category_id: null }),
      makeTx({ id: 't5', date: '2026-10-15', amount: 2000, category_id: 'cat-food' }),
      makeTx({
        id: 't6',
        account_id: 'acc-other',
        transfer_to_account_id: 'acc-1',
        type: 'transfer',
        description: 'Traspaso recibido',
        date: '2026-11-28',
        amount: 100,
        target_amount: 5800,
        category_id: null,
      }),
    ];

    const metrics = computeAccountDetailMetrics(acc, txs, ref);
    expect(metrics.monthLabel).toBe('noviembre');
    expect(metrics.prevMonthLabel).toBe('octubre');
    expect(metrics.monthSpend).toBe(1700);
    expect(metrics.monthIncome).toBe(15000);
    expect(metrics.monthInflow).toBe(20800);
    expect(metrics.monthOutflow).toBe(2200);
    expect(metrics.prevMonthSpend).toBe(2000);
    expect(metrics.savingsDeltaPct).toBe(15);
    expect(metrics.lastTransaction).toEqual({
      description: 'Traspaso recibido',
      dateLabel: '28 nov',
    });
    expect(metrics.uncategorizedCount).toBe(1);
    expect(metrics.firstUncategorizedTx?.id).toBe('t3');
    expect(metrics.showCutoffAlert).toBe(false);
  });

  it('leaves balance adjustments out of flows and of the uncategorized count', () => {
    const ref = new Date(2026, 10, 27);
    const txs = [
      makeTx({ id: 't1', date: '2026-11-05', amount: 100, category_id: 'cat-food' }),
      makeTx({ id: 'adj-down', date: '2026-11-27', amount: 170, category_id: null, description: 'Ajuste de saldo', is_balance_adjustment: true }),
      makeTx({ id: 'adj-up', type: 'income', date: '2026-11-27', amount: 50, category_id: null, description: 'Ajuste de saldo', is_balance_adjustment: true }),
    ];
    const metrics = computeAccountDetailMetrics(makeAccount(), txs, ref);
    expect(metrics.monthSpend).toBe(100);
    expect(metrics.monthIncome).toBe(0);
    expect(metrics.monthInflow).toBe(0);
    expect(metrics.monthOutflow).toBe(100);
    expect(metrics.uncategorizedCount).toBe(0);
    // Still the latest movement shown on the account: it explains the balance change.
    expect(metrics.lastTransaction?.description).toBe('Ajuste de saldo');
  });

  it('activates cutoff alert when credit card has used balance and cutoff day', () => {
    const ref = new Date(2026, 10, 25);
    const cc = makeAccount({
      type: 'credit_card',
      name: 'Infinite',
      credit_limit: 20000,
      current_balance: -4120,
      cutoff_day: 28,
    });

    const metrics = computeAccountDetailMetrics(cc, [], ref);
    expect(metrics.isCreditCard).toBe(true);
    expect(metrics.creditAvailable).toBe(15880);
    expect(metrics.daysUntilCutoff).toBe(3);
    expect(metrics.showCutoffAlert).toBe(true);
    expect(metrics.lastTransaction).toBeNull();
  });

  it('handles split transactions and split children when counting uncategorized items', () => {
    const ref = new Date(2026, 10, 27);
    const acc = makeAccount();
    const txs: AccountDetailTransaction[] = [
      makeTx({
        id: 'split-categorized',
        description: 'Desglosado completo',
        category_id: null,
        items: [
          { id: 'i1', category: { name: 'Supermercado' } },
          { id: 'i2', category_id: 'cat-home', category: null },
        ],
      }),
      makeTx({
        id: 'split-child',
        description: 'Sub-item sin padre',
        category_id: null,
        is_split_child: true,
      }),
      makeTx({
        id: 'split-missing-cat',
        description: 'Desglosado incompleto',
        category_id: null,
        items: [
          { id: 'i3', category: { name: 'Comida' } },
          { id: 'i4', category_id: null, category: null },
        ],
      }),
    ];

    const metrics = computeAccountDetailMetrics(acc, txs, ref);
    expect(metrics.uncategorizedCount).toBe(1);
    expect(metrics.firstUncategorizedTx?.id).toBe('split-missing-cat');
  });

  // Regression: on /accounts the list hook rewrites transfers as income/expense for
  // the table. Metrics read that rewritten type, so incoming transfers vanished from
  // "Entradas" and outgoing ones counted as spending and as uncategorized.
  it('uses the stored type of transfers rewritten by the account-scoped list', () => {
    const ref = new Date(2026, 10, 27);
    const acc = makeAccount();
    const txs = [
      makeTx({
        id: 'in',
        account_id: 'acc-other',
        transfer_to_account_id: 'acc-1',
        type: 'income',
        original_type: 'transfer',
        amount: 3000,
        target_amount: 3000,
        category_id: null,
        date: '2026-11-20',
      }),
      makeTx({
        id: 'out',
        account_id: 'acc-1',
        transfer_to_account_id: 'acc-other',
        type: 'expense',
        original_type: 'transfer',
        amount: 800,
        category_id: null,
        date: '2026-11-21',
      }),
      makeTx({ id: 'spend', amount: 200, date: '2026-11-22' }),
    ];

    const metrics = computeAccountDetailMetrics(acc, txs, ref);
    expect(metrics.monthInflow).toBe(3000);
    expect(metrics.monthIncome).toBe(0);
    expect(metrics.monthOutflow).toBe(1000);
    expect(metrics.monthSpend).toBe(200);
    expect(metrics.uncategorizedCount).toBe(0);
  });
});
