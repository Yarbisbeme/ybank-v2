'use client';

import { useRef, useState } from 'react';
import { CreditCard, Hash, Search, Tag as TagIcon } from 'lucide-react';
import { cn, getCategoryIcon, getNodeIcon } from '@/lib/utils';
import type { Account, Category, Tag, Transaction } from '@/types';
import { CategoryChip, Money, Skeleton } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { Sheet } from './Sheet';
import {
  filterCommandItems,
  type CommandItem,
  type CommandPaletteData,
} from './command-palette';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  results: CommandPaletteData;
  onSelectAccount: (account: Account) => void;
  onSelectTransaction: (transaction: Transaction) => void;
  onSelectCategory: (category: Category) => void;
  onSelectTag: (tag: Tag) => void;
  isLoading?: boolean;
}

/** Global Cmd/Ctrl+K command palette built on Sheet with keyboard navigation. */
export function CommandPalette({
  open,
  onClose,
  query,
  onQueryChange,
  results,
  onSelectAccount,
  onSelectTransaction,
  onSelectCategory,
  onSelectTag,
  isLoading = false,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filtered = filterCommandItems(results, query);
  const { flatItems } = filtered;
  const safeIndex =
    flatItems.length > 0
      ? Math.max(0, Math.min(highlightedIndex, flatItems.length - 1))
      : -1;

  const activateItem = (entry: CommandItem) => {
    switch (entry.kind) {
      case 'account':
        onSelectAccount(entry.item);
        break;
      case 'transaction':
        onSelectTransaction(entry.item);
        break;
      case 'category':
        onSelectCategory(entry.item);
        break;
      case 'tag':
        onSelectTag(entry.item);
        break;
    }
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatItems.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((safeIndex + 1) % flatItems.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((safeIndex - 1 + flatItems.length) % flatItems.length);
    } else if (event.key === 'Enter' && safeIndex >= 0) {
      event.preventDefault();
      activateItem(flatItems[safeIndex]);
    }
  };

  let runningIndex = 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Buscar en YBank"
      size="lg"
      side="center"
      initialFocusRef={inputRef}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 rounded-control border border-line-strong bg-surface px-3 h-11 focus-within:border-action">
          <Search size={18} strokeWidth={2} className="text-ink-2 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Busca cuentas, movimientos, categorías o etiquetas..."
            aria-label="Buscar en YBank"
            onChange={(e) => {
              onQueryChange(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none body text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton variant="tile" label="Buscando resultados" />
            <Skeleton variant="tile" />
            <Skeleton variant="tile" />
          </div>
        ) : query.trim() === '' ? (
          <EmptyState
            icon={<Search size={22} strokeWidth={2} />}
            title="Encuentra cualquier movimiento o cuenta"
            description="Escribe un nombre, comercio, categoría o etiqueta."
          />
        ) : filtered.totalCount === 0 ? (
          <EmptyState
            icon={<Search size={22} strokeWidth={2} />}
            title="Sin resultados"
            description={`No encontramos coincidencias para "${query.trim()}".`}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {filtered.accounts.length > 0 ? (
              <CommandSection title="Cuentas">
                {filtered.accounts.map((acc) => {
                  const idx = runningIndex++;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => activateItem({ kind: 'account', item: acc })}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-control px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer',
                        safeIndex === idx ? 'bg-surface-sunk' : 'hover:bg-surface-sunk',
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-tile bg-surface-sunk text-ink-2">
                          {getNodeIcon(acc.type, 16) ?? <CreditCard size={16} strokeWidth={2} />}
                        </span>
                        <div className="min-w-0">
                          <p className="body-strong text-ink truncate">{acc.name}</p>
                          <p className="small text-ink-2 truncate">
                            {acc.currency}
                            {acc.last_4_digits ? ` · •••• ${acc.last_4_digits}` : ''}
                          </p>
                        </div>
                      </div>
                      <Money value={acc.current_balance} currency={acc.currency} size="amount" />
                    </button>
                  );
                })}
              </CommandSection>
            ) : null}

            {filtered.transactions.length > 0 ? (
              <CommandSection title="Movimientos">
                {filtered.transactions.map((tx) => {
                  const idx = runningIndex++;
                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense';
                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => activateItem({ kind: 'transaction', item: tx })}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-control px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer',
                        safeIndex === idx ? 'bg-surface-sunk' : 'hover:bg-surface-sunk',
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-tile bg-surface-sunk text-ink-2">
                          {getCategoryIcon(tx.category?.icon)}
                        </span>
                        <div className="min-w-0">
                          <p className="body-strong text-ink truncate">
                            {tx.description || 'Movimiento'}
                          </p>
                          <p className="small text-ink-2 truncate">
                            {tx.category?.name ?? 'Sin categoría'} · {tx.date.split('T')[0]}
                          </p>
                        </div>
                      </div>
                      <Money
                        value={tx.amount}
                        currency={tx.account?.currency ?? 'DOP'}
                        tone={isIncome ? 'income' : isExpense ? 'expense' : 'default'}
                        sign={isIncome ? 'positive' : isExpense ? 'negative' : 'none'}
                      />
                    </button>
                  );
                })}
              </CommandSection>
            ) : null}

            {filtered.categories.length > 0 ? (
              <CommandSection title="Categorías">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filtered.categories.map((cat) => {
                    const idx = runningIndex++;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onClick={() => activateItem({ kind: 'category', item: cat })}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-control border border-line px-3 py-2 text-left transition-colors duration-150 cursor-pointer',
                          safeIndex === idx ? 'bg-surface-sunk border-line-strong' : 'hover:bg-surface-sunk',
                        )}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-ink-2 shrink-0">
                            {getCategoryIcon(cat.icon)}
                          </span>
                          <span className="small text-ink truncate">{cat.name}</span>
                        </span>
                        <span className="nav text-action shrink-0">Filtrar</span>
                      </button>
                    );
                  })}
                </div>
              </CommandSection>
            ) : null}

            {filtered.tags.length > 0 ? (
              <CommandSection title="Etiquetas">
                <div className="flex flex-wrap gap-2">
                  {filtered.tags.map((tag) => {
                    const idx = runningIndex++;
                    return (
                      <CategoryChip
                        key={tag.id}
                        label={tag.name}
                        icon={<Hash size={12} strokeWidth={2} />}
                        active={safeIndex === idx}
                        onClick={() => activateItem({ kind: 'tag', item: tag })}
                      />
                    );
                  })}
                </div>
              </CommandSection>
            ) : null}
          </div>
        )}

        <div className="hidden md:flex items-center justify-between border-t border-line pt-3 small text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <TagIcon size={14} strokeWidth={2} />
            Usa las flechas y Enter para abrir
          </span>
          <span>Esc para cerrar</span>
        </div>
      </div>
    </Sheet>
  );
}

function CommandSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="label text-ink-2 px-1">{title}</h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}
