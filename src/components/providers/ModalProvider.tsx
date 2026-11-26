'use client';

import {
  useAccounts,
  useCategories,
  useInstitutions,
  useTags,
} from '@/hooks/useCatalogs';
import { useModalStore } from '@/store/useModalStore';
import AccountFormWrapper from '@/components/accounts/AccountFormWrapper';
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper';
import { Sheet } from '@/components/organisms';

export default function ModalProvider() {
  const { isOpen, type, payload, closeModal } = useModalStore();
  const { data: institutions = [] } = useInstitutions();
  const { data: accounts = [] } = useAccounts();
  const { data: tags = [] } = useTags();
  const { data: categoriesTree = [] } = useCategories();

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {type === 'transaction' ? (
        <TransactionModalWrapper
          key={`${payload?.transactionId}-${payload?.forceEditMode}`}
          transactionId={payload?.transactionId}
          defaultAccountId={payload?.accountId}
          initialData={payload?.initialData}
          forceEditMode={payload?.forceEditMode}
          accounts={accounts}
          tags={tags}
          categoriesTree={categoriesTree}
          onClose={closeModal}
        />
      ) : null}

      <Sheet
        open={type === 'account'}
        onClose={closeModal}
        title={payload?.accountId ? 'Editar cuenta' : 'Nueva cuenta'}
        size="lg"
      >
        {type === 'account' ? (
          <AccountFormWrapper
            institutions={institutions}
            onSuccess={closeModal}
            initialData={
              payload?.accountId
                ? accounts.find((acc) => acc.id === payload.accountId)
                : undefined
            }
          />
        ) : null}
      </Sheet>
    </>
  );
}
