'use client';

import { useEffect, useState } from 'react';
import type { Account, CategoryTree, Tag, TransactionFormData } from '@/types';
import { getTransactionById } from '@/lib/actions/transactions';
import { Skeleton } from '@/components/atoms';
import { Sheet } from '@/components/organisms';
import TransactionDetailView from './TransactionDetailView';
import TransactionForm from './TransactionForm';

export interface TransactionModalWrapperProps {
  transactionId?: string | null;
  defaultAccountId?: string | null;
  initialData?: TransactionFormData | null;
  forceEditMode?: boolean;
  accounts: Account[];
  tags: Tag[];
  categoriesTree: CategoryTree[];
  onClose: () => void;
}

/** Modal host switching between loading skeleton, split detail view, and transaction form. */
export default function TransactionModalWrapper({
  transactionId,
  defaultAccountId,
  initialData: passedInitialData,
  forceEditMode = false,
  accounts,
  tags,
  categoriesTree,
  onClose,
}: TransactionModalWrapperProps) {
  const [fetchedState, setFetchedState] = useState<{
    id: string;
    data: TransactionFormData | null;
  } | null>(null);
  const [isForcedEdit, setIsForcedEdit] = useState(forceEditMode);

  useEffect(() => {
    if (passedInitialData || !transactionId) {
      return;
    }

    let cancelled = false;
    getTransactionById(transactionId)
      .then((res) => {
        if (!cancelled) {
          setFetchedState({
            id: transactionId,
            data: (res as TransactionFormData | null) ?? null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedState({ id: transactionId, data: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [transactionId, passedInitialData]);

  const data =
    passedInitialData ??
    (fetchedState && fetchedState.id === transactionId ? fetchedState.data : null);
  const isLoading =
    !passedInitialData &&
    Boolean(transactionId) &&
    fetchedState?.id !== transactionId;

  const flatCategories = categoriesTree.flatMap((c) => [
    c,
    ...(c.subcategories ?? []),
  ]);

  const hasSplitItems =
    Boolean(data?.items && data.items.length > 0) && !isForcedEdit;

  const title = isLoading
    ? 'Cargando...'
    : !data
      ? 'Nuevo movimiento'
      : hasSplitItems
        ? 'Detalle del movimiento'
        : 'Editar movimiento';

  return (
    <Sheet open onClose={onClose} title={title} size="lg">
      {isLoading ? (
        <div className="flex flex-col gap-3 py-4">
          <Skeleton variant="tile" label="Cargando movimiento" />
          <Skeleton variant="panel" />
          <Skeleton variant="tile" />
        </div>
      ) : hasSplitItems && data ? (
        <TransactionDetailView
          transaction={data}
          accounts={accounts}
          onEditRequest={() => setIsForcedEdit(true)}
        />
      ) : (
        <TransactionForm
          accounts={accounts}
          tags={tags}
          categories={flatCategories}
          initialData={data}
          defaultAccountId={defaultAccountId}
          onSuccess={onClose}
        />
      )}
    </Sheet>
  );
}
