'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckSquare, MousePointerSquareDashed, Square, X } from 'lucide-react';
import { toast } from 'sonner';
import { getTransactions } from '@/lib/actions/transactions';
import { useCategories, useTransactionsList } from '@/hooks/useCatalogs';
import { useFilterStore } from '@/store/useFilterStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { Button } from '@/components/atoms';
import type { SearchSelectOption } from '@/components/molecules';
import { FilterBar, type MoveRowData } from '@/components/organisms';

export interface TransactionFilterBarProps {
  bare?: boolean;
  title?: string;
}

/** Connects FilterBar organism to Zustand filter/selection stores and full-account selection. */
export default function TransactionFilterBar({
  bare = false,
  title,
}: TransactionFilterBarProps = {}) {
  const searchParams = useSearchParams();
  const {
    type,
    categoryId,
    startDate,
    endDate,
    search,
    setFilter,
    clearFilters,
  } = useFilterStore();
  const { data: categoriesTree = [] } = useCategories();
  const { data: txData, isLoading: isLoadingTx } = useTransactionsList();

  const {
    isSelectionMode,
    setIsSelectionMode,
    selectedTx,
    setSelectedTx,
    clearSelection,
    totalItemsInView,
  } = useSelectionStore();
  const [isFetchingAll, setIsFetchingAll] = useState(false);

  const urlAccountId = searchParams.get('accountId');
  const activeAccountId =
    !urlAccountId || urlAccountId === 'global' ? null : urlAccountId;

  const categoryOptions: SearchSelectOption[] = useMemo(() => {
    const result: SearchSelectOption[] = [];
    for (const parent of categoriesTree) {
      const matchesParent = !type || type === 'transfer' || parent.type === type;
      if (matchesParent) {
        result.push({ id: parent.id, label: parent.name });
      }
      for (const child of parent.subcategories ?? []) {
        const matchesChild = !type || type === 'transfer' || child.type === type;
        if (matchesChild) {
          result.push({
            id: child.id,
            label: child.name,
            subLabel: parent.name,
          });
        }
      }
    }
    return result;
  }, [categoriesTree, type]);

  const hasActiveFilters = Boolean(
    type || categoryId || startDate || endDate || search,
  );
  const totalCount = txData?.total ?? totalItemsInView;
  const hideControls =
    bare && !isLoadingTx && totalCount === 0 && !hasActiveFilters;
  const isAllSelected =
    totalItemsInView > 0 &&
    Object.keys(selectedTx).length === totalItemsInView;

  const handleSelectAllInAccount = async () => {
    if (isFetchingAll) {
      return;
    }

    if (isAllSelected) {
      clearSelection();
      setIsSelectionMode(false);
      return;
    }

    setIsFetchingAll(true);
    try {
      const activeFilters = {
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(search && { search }),
      };

      const res = await getTransactions({
        accountId: activeAccountId || undefined,
        pageSize: 5000,
        page: 1,
        filters: activeFilters,
      });

      const nextMap: Record<string, MoveRowData> = {};
      for (const tx of (res.transactions ?? []) as MoveRowData[]) {
        if (tx.id) {
          nextMap[tx.id] = tx;
        }
      }
      setSelectedTx(nextMap);
    } catch {
      toast.error('Necesitas conexión para cargar todos los movimientos filtrados.');
    } finally {
      setIsFetchingAll(false);
    }
  };

  const selectionControls = !isSelectionMode ? (
    <Button
      variant={bare ? 'ghost' : 'secondary'}
      size="sm"
      leftIcon={<MousePointerSquareDashed size={14} strokeWidth={2} />}
      aria-label="Seleccionar movimientos"
      onClick={() => setIsSelectionMode(true)}
    >
      {bare ? <span className="hidden sm:inline">Seleccionar</span> : 'Seleccionar'}
    </Button>
  ) : (
    <div className="flex items-center gap-2">
      <Button
        variant={isAllSelected ? 'danger' : 'secondary'}
        size="sm"
        loading={isFetchingAll}
        loadingLabel="Cargando..."
        leftIcon={
          isAllSelected ? (
            <Square size={14} strokeWidth={2} />
          ) : (
            <CheckSquare size={14} strokeWidth={2} />
          )
        }
        onClick={() => {
          void handleSelectAllInAccount();
        }}
      >
        {isAllSelected ? 'Deseleccionar' : 'Seleccionar todo'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<X size={14} strokeWidth={2} />}
        onClick={() => {
          clearSelection();
          setIsSelectionMode(false);
        }}
      >
        Cancelar
      </Button>
    </div>
  );

  return (
    <FilterBar
      type={type}
      onTypeChange={(next) => setFilter('type', next)}
      categoryId={categoryId}
      onCategoryChange={(next) => setFilter('categoryId', next)}
      categoryOptions={categoryOptions}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={(range) => {
        setFilter('startDate', range.startDate);
        setFilter('endDate', range.endDate);
      }}
      search={search ?? ''}
      onSearchChange={(q) => setFilter('search', q.trim() ? q : null)}
      onClearFilters={clearFilters}
      hasActiveFilters={hasActiveFilters}
      extraActions={selectionControls}
      title={title}
      hideControls={hideControls}
      bare={bare}
    />
  );
}
