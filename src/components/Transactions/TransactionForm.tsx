'use client';

import { useState } from 'react';
import { SplitSquareHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Account, BaseItem, Category, Tag, TransactionFormData } from '@/types';
import {
  useDeleteTransaction,
  useSaveTag,
  useSaveTransaction,
} from '@/hooks/useCatalogs';
import { Button, IconButton } from '@/components/atoms';
import {
  AmountInput,
  DatePicker,
  Field,
  SearchSelect,
  Segmented,
  TagInput,
  TextInput,
} from '@/components/molecules';
import { ConfirmDialog } from '@/components/organisms';
import ExpenseSplitSection from './ExpenseSplitSection';

type TxFormType = 'expense' | 'income' | 'transfer';

export interface TransactionFormProps {
  accounts: Account[];
  tags: Tag[];
  categories: Category[];
  initialData?: TransactionFormData | null;
  defaultAccountId?: string | null;
  onSuccess: () => void;
}

const TX_TYPE_OPTIONS: { value: TxFormType; label: string }[] = [
  { value: 'expense', label: 'Salida' },
  { value: 'income', label: 'Entrada' },
  { value: 'transfer', label: 'Traspaso' },
];

function getSafeType(rawType?: string): TxFormType {
  const t = String(rawType || '').toLowerCase().trim();
  if (t === 'ingreso' || t === 'income') {
    return 'income';
  }
  if (t === 'transferencia' || t === 'transfer') {
    return 'transfer';
  }
  return 'expense';
}

function extractInitialTagIds(
  rawTags: TransactionFormData['tags'],
): string[] {
  if (!Array.isArray(rawTags)) {
    return [];
  }
  const ids: string[] = [];
  for (const entry of rawTags) {
    if (typeof entry === 'string') {
      ids.push(entry);
    } else if (entry?.tag?.id) {
      ids.push(entry.tag.id);
    }
  }
  return ids;
}

/** Create/edit transaction form composed from YBank 2.0 molecules and ConfirmDialog. */
export default function TransactionForm({
  accounts,
  tags,
  categories,
  initialData,
  defaultAccountId,
  onSuccess,
}: TransactionFormProps) {
  const isEditing = Boolean(initialData?.id);

  const { mutate: createTagOptimistic } = useSaveTag();
  const { mutate: saveTx, isPending: isSubmitting } = useSaveTransaction();
  const { mutate: deleteTx, isPending: isDeleting } = useDeleteTransaction();

  const [type, setType] = useState<TxFormType>(getSafeType(initialData?.type));
  const initialAmount =
    initialData?.type === 'transfer'
      ? initialData.target_amount || initialData.amount
      : initialData?.amount;

  const [amount, setAmount] = useState(
    initialAmount !== undefined ? String(initialAmount) : '',
  );
  const [accountId, setAccountId] = useState(
    initialData?.account_id || defaultAccountId || '',
  );
  const [note, setNote] = useState(
    initialData?.description || initialData?.note || '',
  );
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(
    initialData?.transfer_to_account_id || '',
  );

  const [isSplit, setIsSplit] = useState(
    initialData?.type === 'expense' &&
      Boolean(initialData?.items && initialData.items.length > 0),
  );
  const [items, setItems] = useState<BaseItem[]>(() =>
    initialData?.type === 'expense' &&
    initialData?.items &&
    initialData.items.length > 0
      ? initialData.items.map((item) => ({
          ...item,
          _id: item._id ?? item.id ?? crypto.randomUUID(),
        }))
      : [
          {
            _id: crypto.randomUUID(),
            name: '',
            unit_price: '',
            quantity: 1,
            category_id: '',
          },
        ],
  );

  const [date, setDate] = useState(() => {
    if (initialData?.date) {
      return initialData.date.split('T')[0].split(' ')[0];
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [availableTags, setAvailableTags] = useState<Tag[]>(tags);
  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    extractInitialTagIds(initialData?.tags),
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleTypeChange = (nextType: TxFormType) => {
    setType(nextType);
    if (nextType !== 'expense') {
      setIsSplit(false);
    }
  };

  const selectedAccount = accounts.find((acc) => acc.id === accountId);
  const activeCurrency = selectedAccount?.currency ?? 'DOP';

  const accountOptions = accounts.map((acc) => ({
    id: acc.id,
    label: acc.name,
    subLabel: acc.institution?.name || 'Efectivo',
  }));

  const activeCategories = categories.filter((c) => c.type === type);
  const categoryOptions = activeCategories.map((c) => {
    const parentName = c.parent_id
      ? activeCategories.find((p) => p.id === c.parent_id)?.name
      : undefined;
    return {
      id: c.id,
      label: c.name,
      subLabel: parentName ?? 'Principal',
    };
  });

  const handleCustomTagCreate = (newTagName: string) => {
    createTagOptimistic(newTagName, {
      onSuccess: (response) => {
        const created = response.data as Tag | undefined;
        if (!created) {
          return;
        }
        setSelectedTags((prev) => [...prev, created.id]);
        setAvailableTags((prev) => [...prev, created]);
      },
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (type === 'expense' && isSplit) {
      const splitTotal = items.reduce(
        (sum, item) => sum + Number(item.unit_price || 0),
        0,
      );
      if (Math.abs(splitTotal - Number(amount)) > 0.01) {
        toast.error('La suma del desglose no coincide con el monto total.');
        return;
      }
      if (items.some((item) => !item.category_id)) {
        toast.error('Todos los ítems del desglose deben tener una categoría.');
        return;
      }
    }

    const payload: Record<string, unknown> = {
      id: initialData?.id,
      type,
      accountId: accountId || null,
      date,
      note,
      tagIds: selectedTags,
      amount: parseFloat(amount) || 0,
    };

    if (type === 'transfer') {
      payload.destinationAccountId = destinationAccountId || null;
      payload.categoryId = null;
      payload.items = [];
    } else {
      payload.destinationAccountId = null;
      payload.categoryId =
        type === 'expense' && isSplit ? null : categoryId || null;
      payload.items =
        type === 'expense' && isSplit
          ? items.map((item) => {
              const price = parseFloat(String(item.unit_price)) || 0;
              const qty = Number(item.quantity) || 1;
              return {
                ...item,
                unit_price: price,
                quantity: qty,
                total_price: price * qty,
              };
            })
          : [];
    }

    saveTx(payload, { onSuccess: () => onSuccess() });
  };

  const handleConfirmDelete = () => {
    if (!initialData?.id) {
      return;
    }
    deleteTx(initialData.id, {
      onSuccess: () => {
        setIsDeleteConfirmOpen(false);
        onSuccess();
      },
    });
  };

  return (
    <>
      <form id="tx-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Segmented<TxFormType>
          aria-label="Tipo de movimiento"
          options={TX_TYPE_OPTIONS}
          value={type}
          onChange={handleTypeChange}
          fullWidth
        />

        <Field
          label={type === 'expense' && isSplit ? 'Monto desglosado' : 'Importe'}
          htmlFor="tx-amount"
          required
        >
          <AmountInput
            id="tx-amount"
            size="lg"
            currency={activeCurrency}
            value={amount}
            disabled={type === 'expense' && isSplit}
            placeholder="0.00"
            onChange={setAmount}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label={type === 'transfer' ? 'Cuenta origen' : 'Cuenta'}
            htmlFor="tx-account"
            required
          >
            <SearchSelect
              id="tx-account"
              options={accountOptions}
              value={accountId}
              onChange={setAccountId}
              placeholder="Seleccionar cuenta..."
            />
          </Field>

          {type === 'transfer' ? (
            <Field label="Cuenta destino" htmlFor="tx-destination" required>
              <SearchSelect
                id="tx-destination"
                options={accountOptions.filter((acc) => acc.id !== accountId)}
                value={destinationAccountId}
                onChange={setDestinationAccountId}
                placeholder="Seleccionar destino..."
              />
            </Field>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="tx-category" className="label text-ink-2">
                  Categoría
                </label>
                {type === 'expense' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<SplitSquareHorizontal size={14} strokeWidth={2} />}
                    onClick={() => setIsSplit((prev) => !prev)}
                    className="h-6 px-2 text-action"
                  >
                    {isSplit ? 'Cerrar desglose' : 'Desglosar recibo'}
                  </Button>
                ) : null}
              </div>

              {!isSplit ? (
                <SearchSelect
                  id="tx-category"
                  options={categoryOptions}
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="Buscar categoría..."
                />
              ) : (
                <div className="flex h-10 items-center rounded-control border border-action bg-action-wash px-3 small text-action">
                  Las categorías se asignan por ítem abajo.
                </div>
              )}
            </div>
          )}

          <Field label="Fecha" htmlFor="tx-date">
            <DatePicker
              id="tx-date"
              mode="single"
              value={date}
              onChange={(next) => {
                if (next) {
                  setDate(next);
                }
              }}
            />
          </Field>

          <Field label="Etiquetas" htmlFor="tx-tags">
            <TagInput
              id="tx-tags"
              availableTags={availableTags}
              selectedTagIds={selectedTags}
              onChange={setSelectedTags}
              onCreateTag={handleCustomTagCreate}
            />
          </Field>

          <Field
            label="Descripción"
            htmlFor="tx-note"
            className="md:col-span-2"
          >
            <TextInput
              id="tx-note"
              value={note}
              placeholder="Nota u observación..."
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </div>

        {type === 'expense' && isSplit ? (
          <ExpenseSplitSection
            items={items}
            setItems={setItems}
            categoryOptions={categoryOptions}
            amount={amount}
            currency={activeCurrency}
          />
        ) : null}

        <div className="flex items-center gap-3 border-t border-line pt-4">
          {isEditing ? (
            <IconButton
              variant="danger"
              size="lg"
              aria-label="Eliminar movimiento"
              title="Eliminar"
              disabled={isSubmitting || isDeleting}
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              <Trash2 size={18} strokeWidth={2} />
            </IconButton>
          ) : null}

          <Button
            type="submit"
            form="tx-form"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingLabel="Guardando..."
            disabled={isDeleting}
          >
            {isEditing ? 'Guardar cambios' : 'Registrar movimiento'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar movimiento"
        description="Esta acción eliminará el movimiento de forma permanente y ajustará el saldo de la cuenta."
        confirmLabel="Eliminar"
        tone="danger"
        loading={isDeleting}
      />
    </>
  );
}
