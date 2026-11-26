import { describe, expect, it } from 'vitest';
import type { Account, Category, Tag, Transaction } from '@/types';
import { filterCommandItems, type CommandPaletteData } from './command-palette';

const SAMPLE_DATA: CommandPaletteData = {
  accounts: [
    {
      id: 'acc-1',
      user_id: 'u1',
      institution_id: 'inst-1',
      name: 'Nómina Popular',
      type: 'savings',
      currency: 'DOP',
      color: '#1f4bff',
      custom_pattern: 'solid',
      custom_text_theme: 'light',
      current_balance: 35000,
      initial_balance: 35000,
      last_4_digits: '4288',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      institution: {
        id: 'inst-1',
        name: 'Banco Popular',
        logo_url: null,
        exchange_rate_adjustment: 0,
        exchange_rate_buy_adjustment: 0,
        created_at: '2026-01-01',
        brand_color_primary: '#1f4bff',
      },
    } as Account,
  ],
  transactions: [
    {
      id: 'tx-1',
      user_id: 'u1',
      account_id: 'acc-1',
      category_id: 'cat-1',
      transfer_to_account_id: null,
      type: 'expense',
      description: 'Supermercado Nacional',
      date: '2026-11-25',
      status: 'posted',
      payment_method: 'card',
      amount: 1850,
      created_at: '2026-11-25',
      category: { id: 'cat-1', name: 'Alimentación' } as Category,
    } as Transaction,
  ],
  categories: [
    {
      id: 'cat-1',
      user_id: null,
      parent_id: null,
      name: 'Alimentación',
      type: 'expense',
      icon: 'mdi-food',
      color: '#067647',
      created_at: '2026-01-01',
      subcategories: [
        {
          id: 'cat-2',
          user_id: null,
          parent_id: 'cat-1',
          name: 'Café y merienda',
          type: 'expense',
          icon: 'mdi-food',
          color: '#067647',
          created_at: '2026-01-01',
        },
      ],
    } as Category,
  ],
  tags: [{ id: 'tag-1', user_id: 'u1', name: 'Reembolsable' } as Tag],
};

describe('filterCommandItems', () => {
  it('returns empty results when query is blank', () => {
    const empty = filterCommandItems(SAMPLE_DATA, '   ');
    expect(empty.totalCount).toBe(0);
    expect(empty.flatItems).toEqual([]);
  });

  it('matches accent-insensitively across accounts, transactions, subcategories, and tags', () => {
    const byAccount = filterCommandItems(SAMPLE_DATA, 'nomina');
    expect(byAccount.accounts.map((a) => a.id)).toEqual(['acc-1']);

    const bySubcat = filterCommandItems(SAMPLE_DATA, 'cafe');
    expect(bySubcat.categories.map((c) => c.id)).toEqual(['cat-2']);

    const byTx = filterCommandItems(SAMPLE_DATA, 'nacional');
    expect(byTx.transactions.map((t) => t.id)).toEqual(['tx-1']);

    const byTag = filterCommandItems(SAMPLE_DATA, 'reembol');
    expect(byTag.tags.map((t) => t.id)).toEqual(['tag-1']);
  });
});
