'use client';

import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton, type CurrencyCode } from '@/components/atoms';
import { AmountInput } from './AmountInput';
import { TextInput } from './Field';
import { SearchSelect } from './SearchSelect';
import type { SearchSelectOption } from './search-select';

export interface SplitRowItem {
  id: string;
  name: string;
  categoryId: string;
  amount: string;
}

export interface SplitRowProps {
  item: SplitRowItem;
  categoryOptions: SearchSelectOption[];
  currency?: CurrencyCode;
  canRemove?: boolean;
  onChange: (patch: Partial<Omit<SplitRowItem, 'id'>>) => void;
  onRemove: () => void;
  onAmountEnter?: () => void;
  className?: string;
}

/** Single itemized receipt split row combining concept, category, and amount. */
export function SplitRow({
  item,
  categoryOptions,
  currency = 'DOP',
  canRemove = true,
  onChange,
  onRemove,
  onAmountEnter,
  className,
}: SplitRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-center py-2.5 border-b border-line last:border-b-0',
        className,
      )}
    >
      <div className="md:col-span-5">
        <TextInput
          value={item.name}
          placeholder="Ej. Leche, pan, café"
          aria-label="Concepto del ítem"
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="md:col-span-4">
        <SearchSelect
          options={categoryOptions}
          value={item.categoryId}
          placeholder="Categoría..."
          aria-label="Categoría del ítem"
          onChange={(categoryId) => onChange({ categoryId })}
        />
      </div>

      <div className="md:col-span-3 flex items-center gap-2">
        <AmountInput
          value={item.amount}
          currency={currency}
          aria-label="Importe del ítem"
          onChange={(amount) => onChange({ amount })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onAmountEnter) {
              e.preventDefault();
              onAmountEnter();
            }
          }}
          className="flex-1"
        />

        <IconButton
          variant="danger"
          size="sm"
          disabled={!canRemove}
          aria-label="Eliminar ítem"
          onClick={onRemove}
        >
          <Trash2 size={16} strokeWidth={2} />
        </IconButton>
      </div>
    </div>
  );
}
