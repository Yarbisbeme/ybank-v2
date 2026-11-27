import { describe, expect, it } from 'vitest';
import type { Account, Institution, Transaction } from '@/types';
import {
  computeAccountBarModel,
  computeAccountMonthSummary,
  sortAccountsByPrimary,
} from './account-carousel';

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

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    category_id: null,
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

describe('sortAccountsByPrimary', () => {
  it('moves the primary account first and keeps remaining order', () => {
    const a1 = makeAccount({ id: 'a1' });
    const a2 = makeAccount({ id: 'a2' });
    const a3 = makeAccount({ id: 'a3' });
    expect(sortAccountsByPrimary([a1, a2, a3], 'a2').map((a) => a.id)).toEqual([
      'a2',
      'a1',
      'a3',
    ]);
  });

  it('returns the original array when primaryAccountId is missing or unmatched', () => {
    const a1 = makeAccount({ id: 'a1' });
    const a2 = makeAccount({ id: 'a2' });
    expect(sortAccountsByPrimary([a1, a2], null).map((a) => a.id)).toEqual([
      'a1',
      'a2',
    ]);
    expect(
      sortAccountsByPrimary([a1, a2], 'non-existent').map((a) => a.id),
    ).toEqual(['a1', 'a2']);
  });
});

describe('computeAccountMonthSummary', () => {
  it('sums expense amounts and counts movements for the target account in the reference month', () => {
    const ref = new Date('2026-11-27T12:00:00Z');
    const txs = [
      makeTx({ id: 't1', account_id: 'acc-1', type: 'expense', date: '2026-11-05', amount: 640 }),
      makeTx({ id: 't2', account_id: 'acc-1', type: 'expense', date: '2026-11-20', amount: -360 }),
      makeTx({ id: 't3', account_id: 'acc-1', type: 'income', date: '2026-11-10', amount: 5000 }),
      makeTx({ id: 't4', account_id: 'acc-1', type: 'expense', date: '2026-10-28', amount: 900 }),
      makeTx({ id: 't5', account_id: 'acc-2', type: 'expense', date: '2026-11-12', amount: 1200 }),
    ];
    expect(computeAccountMonthSummary(txs, 'acc-1', ref)).toEqual({
      monthSpend: 1000,
      monthCount: 2,
    });
  });
});

describe('computeAccountBarModel', () => {
  it('computes available limit, cutoff day, clamped utilization, and semantic tones', () => {
    const low = makeAccount({
      type: 'credit_card',
      name: 'Clásica',
      credit_limit: 10000,
      current_balance: -2000,
      cutoff_day: 15,
    });
    expect(computeAccountBarModel(low, { monthSpend: 0, monthCount: 0 })).toMatchObject({
      isCreditCard: true,
      creditAvailable: 8000,
      cutoffDay: 15,
      percent: 20,
      creditTone: 'credit',
      label: 'Uso de límite',
    });

    const mid = makeAccount({
      type: 'credit_card',
      name: 'Gold',
      credit_limit: 10000,
      current_balance: -4500,
    });
    expect(computeAccountBarModel(mid, { monthSpend: 0, monthCount: 0 })).toMatchObject({
      creditAvailable: 5500,
      cutoffDay: null,
      creditTone: 'pending',
    });

    const overLimit = makeAccount({
      type: 'credit_card',
      name: 'Infinite',
      credit_limit: 10000,
      current_balance: -15000,
    });
    expect(
      computeAccountBarModel(overLimit, { monthSpend: 0, monthCount: 0 }),
    ).toMatchObject({
      isCreditCard: true,
      creditUsed: 15000,
      creditAvailable: 0,
      percent: 100,
      creditTone: 'debit',
    });
  });

  it('returns non-redundant monthly summary for non-credit accounts', () => {
    const savings = makeAccount({ type: 'savings', name: 'Ahorro viaje' });
    expect(
      computeAccountBarModel(savings, { monthSpend: 1850, monthCount: 3 }),
    ).toEqual({
      label: 'Gastos este mes',
      isCreditCard: false,
      creditUsed: 0,
      creditLimit: 0,
      creditAvailable: 0,
      cutoffDay: null,
      monthSpend: 1850,
      monthCount: 3,
      percent: 0,
      creditTone: 'credit',
    });
  });
});
