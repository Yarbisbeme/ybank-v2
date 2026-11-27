'use client';

import { AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import type { BaseItem } from '@/types';
import { Button, Money, formatMoney, type CurrencyCode } from '@/components/atoms';
import {
  SplitRow,
  computeSplitSummary,
  formatItemCount,
  type SearchSelectOption,
} from '@/components/molecules';

export interface ExpenseSplitSectionProps {
  items: BaseItem[];
  setItems: React.Dispatch<React.SetStateAction<BaseItem[]>>;
  categoryOptions: SearchSelectOption[];
  amount: string;
  currency?: CurrencyCode;
}

/** Itemized receipt split section composed from SplitRow molecules. */
export default function ExpenseSplitSection({
  items,
  setItems,
  categoryOptions,
  amount,
  currency = 'DOP',
}: ExpenseSplitSectionProps) {
  const summary = computeSplitSummary(
    amount,
    items.map((item) => item.unit_price ?? 0),
  );

  const addItem = () => {
    const suggested = summary.remaining > 0 ? summary.remaining.toFixed(2) : '';
    setItems((prev) => [
      ...prev,
      {
        _id: crypto.randomUUID(),
        name: '',
        unit_price: suggested,
        quantity: 1,
        category_id: '',
      },
    ]);
  };

  const removeItem = (targetId: string) => {
    if (items.length <= 1) {
      return;
    }
    setItems((prev) =>
      prev.filter((item, idx) => (item._id ?? item.id ?? String(idx)) !== targetId),
    );
  };

  const updateItem = (
    targetId: string,
    patch: Partial<{ name: string; categoryId: string; amount: string }>,
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        const currentId = item._id ?? item.id ?? String(idx);
        if (currentId !== targetId) {
          return item;
        }
        return {
          ...item,
          ...(patch.name !== undefined && { name: patch.name }),
          ...(patch.categoryId !== undefined && { category_id: patch.categoryId }),
          ...(patch.amount !== undefined && { unit_price: patch.amount }),
        };
      }),
    );
  };

  const differenceLabel =
    summary.remaining > 0
      ? `Faltan ${formatMoney(summary.remaining, { currency })}`
      : `Sobran ${formatMoney(Math.abs(summary.remaining), { currency })}`;

  return (
    <div className="flex flex-col gap-3 rounded-panel border border-line bg-surface-sunk p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="label text-ink-2">Desglose de recibo</span>
        <span className="small text-ink-2 tabular-nums">
          {formatItemCount(items.length)}
        </span>
      </div>

      <div className="rounded-panel border border-line bg-surface px-3">
        {items.map((item, index) => {
          const itemId = item._id ?? item.id ?? String(index);
          return (
            <SplitRow
              key={itemId}
              item={{
                id: itemId,
                name: item.name ?? '',
                categoryId: item.category_id ?? '',
                amount:
                  item.unit_price !== undefined ? String(item.unit_price) : '',
              }}
              categoryOptions={categoryOptions}
              currency={currency}
              canRemove={items.length > 1}
              onChange={(patch) => updateItem(itemId, patch)}
              onRemove={() => removeItem(itemId)}
              onAmountEnter={index === items.length - 1 ? addItem : undefined}
            />
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus size={14} strokeWidth={2} />}
          onClick={addItem}
        >
          Añadir ítem
        </Button>

        <div className="flex flex-wrap items-center gap-3 rounded-tile border border-line bg-surface px-3 py-2">
          <div className="flex flex-col">
            <span className="nav text-ink-2">Desglosado</span>
            <Money
              value={summary.totalSplit}
              currency={currency}
              size="small"
              tone={summary.isBalanced ? 'income' : 'default'}
            />
          </div>

          <div className="h-6 w-px bg-line" aria-hidden="true" />

          <div className="flex flex-col">
            <span className="nav text-ink-2">Objetivo</span>
            <Money
              value={summary.totalTarget}
              currency={currency}
              size="small"
              tone="muted"
            />
          </div>

          <div className="h-6 w-px bg-line" aria-hidden="true" />

          {summary.isBalanced ? (
            <span className="inline-flex items-center gap-1 small text-credit">
              <CheckCircle2 size={14} strokeWidth={2} />
              Cuadra
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 small text-debit">
              <AlertCircle size={14} strokeWidth={2} />
              {differenceLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
