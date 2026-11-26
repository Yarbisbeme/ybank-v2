import type { Account, Category, Tag, Transaction } from '@/types';

export interface CommandPaletteData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  tags: Tag[];
}

export type CommandItem =
  | { kind: 'account'; item: Account }
  | { kind: 'transaction'; item: Transaction }
  | { kind: 'category'; item: Category }
  | { kind: 'tag'; item: Tag };

export interface FilteredCommandResults extends CommandPaletteData {
  flatItems: CommandItem[];
  totalCount: number;
}

function normalizeQuery(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Accent-insensitive global search across accounts, transactions, categories, and tags. */
export function filterCommandItems(
  data: CommandPaletteData,
  rawQuery: string,
  limitPerSection = 5,
): FilteredCommandResults {
  const query = normalizeQuery(rawQuery);
  if (!query) {
    return {
      accounts: [],
      transactions: [],
      categories: [],
      tags: [],
      flatItems: [],
      totalCount: 0,
    };
  }

  const accounts = data.accounts
    .filter((acc) => {
      const name = normalizeQuery(acc.name);
      const bank = normalizeQuery(acc.institution?.name ?? '');
      const last4 = acc.last_4_digits ?? '';
      return name.includes(query) || bank.includes(query) || last4.includes(query);
    })
    .slice(0, limitPerSection);

  const transactions = data.transactions
    .filter((tx) => {
      const desc = normalizeQuery(tx.description ?? '');
      const cat = normalizeQuery(tx.category?.name ?? '');
      const acc = normalizeQuery(tx.account?.name ?? '');
      return desc.includes(query) || cat.includes(query) || acc.includes(query);
    })
    .slice(0, limitPerSection);

  const flatCategories = data.categories.flatMap((cat) => [
    cat,
    ...(cat.subcategories ?? []),
  ]);
  const seenCatIds = new Set<string>();
  const categories = flatCategories
    .filter((cat) => {
      if (seenCatIds.has(cat.id)) {
        return false;
      }
      seenCatIds.add(cat.id);
      return normalizeQuery(cat.name).includes(query);
    })
    .slice(0, limitPerSection);

  const tags = data.tags
    .filter((tag) => normalizeQuery(tag.name).includes(query))
    .slice(0, limitPerSection);

  const flatItems: CommandItem[] = [
    ...accounts.map((item): CommandItem => ({ kind: 'account', item })),
    ...transactions.map((item): CommandItem => ({ kind: 'transaction', item })),
    ...categories.map((item): CommandItem => ({ kind: 'category', item })),
    ...tags.map((item): CommandItem => ({ kind: 'tag', item })),
  ];

  return {
    accounts,
    transactions,
    categories,
    tags,
    flatItems,
    totalCount: flatItems.length,
  };
}
