'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calculator, X } from 'lucide-react';
import { TRANSACTIONS_PAGE_SIZE } from '@/lib/transaction-keys';
import { useAccounts, useTransactionsList } from '@/hooks/useCatalogs';
import { useFilterStore } from '@/store/useFilterStore';
import { useModalStore } from '@/store/useModalStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { useYBankStore } from '@/store/useYBankStore';
import { Button, IconButton, Money } from '@/components/atoms';
import { formatItemCount } from '@/components/molecules';
import { TransactionTable, type MoveRowData } from '@/components/organisms';

interface SelectedRowShape {
  id?: string;
  amount?: number | string;
  type?: string;
  is_split_child?: boolean;
}

export interface ClientTransactionTableProps {
  compactMobileLimit?: number;
}

/** Connects TransactionTable organism to React Query pagination, filters, and multi-selection summary. */
export default function ClientTransactionTable({
  compactMobileLimit,
}: ClientTransactionTableProps = {}) {
  const searchParams = useSearchParams();
  const openModal = useModalStore((state) => state.openModal);

  const {
    isSelectionMode,
    selectedTx,
    setSelectedTx,
    toggleSingleTx,
    setTotalItemsInView,
  } = useSelectionStore();

  const { preferredAccountId, currency } = useYBankStore();
  const urlAccountId = searchParams.get('accountId');
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();

  const activeAccountId = useMemo(
    () => urlAccountId || preferredAccountId || accounts[0]?.id || null,
    [urlAccountId, preferredAccountId, accounts],
  );

  const filters = useFilterStore();

  const filterSignature = JSON.stringify([
    urlAccountId,
    filters.type,
    filters.categoryId,
    filters.startDate,
    filters.endDate,
    filters.tagId,
    filters.search,
  ]);
  const [pageState, setPageState] = useState({
    signature: filterSignature,
    page: 1,
  });
  const currentPage =
    pageState.signature === filterSignature ? pageState.page : 1;
  const setCurrentPage = (page: number) =>
    setPageState({ signature: filterSignature, page });

  const {
    data,
    isLoading: isLoadingTx,
    isError,
    refetch,
  } = useTransactionsList(currentPage);

  const transactions = (data?.transactions ?? []) as MoveRowData[];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / TRANSACTIONS_PAGE_SIZE));
  const isQueryLoading =
    isLoadingTx || (isLoadingAccounts && accounts.length === 0);

  useEffect(() => {
    setTotalItemsInView(totalItems);
  }, [totalItems, setTotalItemsInView]);

  useEffect(() => {
    const state = useSelectionStore.getState();
    if (Object.keys(state.selectedTx).length > 0 || state.isSelectionMode) {
      state.clearSelection();
    }
  }, [filters.type, filters.categoryId, filters.startDate, filters.endDate]);

  const selectedIds = useMemo(
    () => new Set(Object.keys(selectedTx)),
    [selectedTx],
  );

  const selectionSummary = useMemo(() => {
    const values = Object.values(selectedTx) as SelectedRowShape[];
    if (values.length === 0) {
      return { count: 0, total: 0 };
    }

    const total = values.reduce((sum, tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.is_split_child) {
        return sum - amount;
      }
      if (tx.type === 'income') {
        return sum + amount;
      }
      if (tx.type === 'expense') {
        return sum - amount;
      }
      return sum;
    }, 0);

    return { count: values.length, total };
  }, [selectedTx]);

  const hasActiveFilters = Boolean(
    filters.type ||
      filters.categoryId ||
      filters.startDate ||
      filters.endDate ||
      filters.tagId ||
      filters.search,
  );

  const handleSelectTransaction = (tx: MoveRowData) => {
    if (tx.is_split_child || !tx.id) {
      return;
    }
    openModal('transaction', {
      transactionId: tx.id,
      accountId: tx.account_id,
      initialData: tx,
    });
  };

  const emptyTitle = hasActiveFilters
    ? 'Sin movimientos con esos filtros'
    : 'No hay movimientos registrados';
  const emptyDescription = hasActiveFilters
    ? 'Prueba limpiando los filtros o ampliando el rango de fechas.'
    : 'Registra tu primer ingreso, gasto o traspaso para verlo aquí.';
  const emptyAction = hasActiveFilters ? (
    <Button variant="secondary" onClick={filters.clearFilters}>
      Limpiar filtros
    </Button>
  ) : (
    <Button
      variant="primary"
      onClick={() => openModal('transaction')}
    >
      Registrar movimiento
    </Button>
  );

  const fullTable = (
    <TransactionTable
      transactions={transactions}
      activeAccountId={activeAccountId}
      isLoading={isQueryLoading}
      error={isError ? 'Revisa tu conexión e intenta de nuevo.' : null}
      onRetry={() => {
        void refetch();
      }}
      selectable={isSelectionMode}
      selectedIds={selectedIds}
      onToggleSelect={(tx) => {
        if (tx.id) {
          toggleSingleTx(tx);
        }
      }}
      onSelectTransaction={handleSelectTransaction}
      page={currentPage}
      totalPages={totalPages}
      totalCount={totalItems}
      onPageChange={setCurrentPage}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
    />
  );

  return (
    <div className="relative flex flex-col gap-4">
      {typeof compactMobileLimit === 'number' ? (
        <>
          <div className="hidden md:block">{fullTable}</div>
          <div className="md:hidden">
            <TransactionTable
              transactions={transactions.slice(0, compactMobileLimit)}
              activeAccountId={activeAccountId}
              isLoading={isQueryLoading}
              error={isError ? 'Revisa tu conexión e intenta de nuevo.' : null}
              onRetry={() => {
                void refetch();
              }}
              selectable={false}
              selectedIds={selectedIds}
              onSelectTransaction={handleSelectTransaction}
              page={1}
              totalPages={1}
              totalCount={Math.min(totalItems, compactMobileLimit)}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
              emptyAction={emptyAction}
            />
          </div>
        </>
      ) : (
        fullTable
      )}

      {isSelectionMode && selectionSummary.count > 0 ? (
        <div
          role="region"
          aria-label="Resumen de movimientos seleccionados"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-sticky flex items-center gap-3 rounded-panel border border-line-strong bg-surface-raised px-4 py-2.5 shadow-overlay"
        >
          <span className="inline-flex items-center gap-1.5 rounded-chip bg-surface-sunk px-2.5 py-1 label text-ink">
            <Calculator size={14} strokeWidth={2} className="text-ink-2" />
            {formatItemCount(selectionSummary.count)}
          </span>

          <div className="flex flex-col border-l border-line pl-3">
            <span className="nav text-ink-2">Total seleccionado</span>
            <Money
              value={selectionSummary.total}
              currency={currency}
              size="amount"
              sign="auto"
              tone={selectionSummary.total >= 0 ? 'income' : 'expense'}
            />
          </div>

          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Limpiar selección"
            onClick={() => setSelectedTx({})}
          >
            <X size={16} strokeWidth={2} />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}
