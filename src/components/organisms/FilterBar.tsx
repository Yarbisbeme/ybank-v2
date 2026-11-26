'use client';

import { RotateCcw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms';
import {
  DatePicker,
  SearchSelect,
  Segmented,
  TextInput,
  type DateRangeValue,
  type SearchSelectOption,
} from '@/components/molecules';

export type FilterTypeOption = 'expense' | 'income' | 'transfer' | null;

export interface FilterBarProps {
  type: FilterTypeOption;
  onTypeChange: (type: FilterTypeOption) => void;
  categoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  categoryOptions: SearchSelectOption[];
  startDate: string | null;
  endDate: string | null;
  onDateRangeChange: (range: DateRangeValue) => void;
  search?: string;
  onSearchChange?: (query: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  extraActions?: React.ReactNode;
  className?: string;
}

type SegmentedFilterValue = 'all' | 'income' | 'expense' | 'transfer';

const TYPE_OPTIONS: { value: SegmentedFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' },
  { value: 'transfer', label: 'Traspasos' },
];

/** Flat transaction FilterBar composed from Segmented, SearchSelect, and DatePicker. */
export function FilterBar({
  type,
  onTypeChange,
  categoryId,
  onCategoryChange,
  categoryOptions,
  startDate,
  endDate,
  onDateRangeChange,
  search,
  onSearchChange,
  onClearFilters,
  hasActiveFilters,
  extraActions,
  className,
}: FilterBarProps) {
  const segmentedValue: SegmentedFilterValue = type ?? 'all';
  const categorySelectOptions: SearchSelectOption[] = [
    { id: '', label: 'Todas las categorías' },
    ...categoryOptions,
  ];

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-panel border border-line bg-surface p-3 sm:p-4',
        className,
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <Segmented<SegmentedFilterValue>
          aria-label="Filtrar por tipo de movimiento"
          options={TYPE_OPTIONS}
          value={segmentedValue}
          onChange={(next) =>
            onTypeChange(next === 'all' ? null : next)
          }
        />

        {onSearchChange ? (
          <div className="relative flex-1 lg:max-w-xs">
            <Search
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2"
            />
            <TextInput
              value={search ?? ''}
              placeholder="Buscar descripción..."
              aria-label="Buscar movimientos"
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        {type !== 'transfer' ? (
          <div className="sm:w-64">
            <SearchSelect
              options={categorySelectOptions}
              value={categoryId ?? ''}
              placeholder="Categoría..."
              aria-label="Filtrar por categoría"
              onChange={(val) => onCategoryChange(val || null)}
            />
          </div>
        ) : null}

        <div className="sm:w-64">
          <DatePicker
            mode="range"
            startDate={startDate}
            endDate={endDate}
            placeholder="Rango de fechas"
            aria-label="Filtrar por rango de fechas"
            onRangeChange={onDateRangeChange}
          />
        </div>

        <div className="flex items-center justify-end gap-2 sm:ml-auto">
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw size={14} strokeWidth={2} />}
              onClick={onClearFilters}
            >
              Limpiar
            </Button>
          ) : null}
          {extraActions}
        </div>
      </div>
    </div>
  );
}
