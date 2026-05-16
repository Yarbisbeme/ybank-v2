'use client'

import { useModalStore } from '@/store/useModalStore'
import TransactionModalWrapper from '@/components/Transactions/TransactionModalWrapper'
import AccountFormWrapper from '@/components/accounts/AccountFormWrapper'
import UniversalModal from '../ui/UniversalModal'

import { 
  useInstitutions, 
  useAccounts, 
  useTags, 
  useCategories 
} from '@/hooks/useCatalogs'

export default function ModalProvider() {
  const { isOpen, type, payload, closeModal } = useModalStore()
  const { data: institutions = [] } = useInstitutions()
  const { data: accounts = [] } = useAccounts()
  const { data: tags = [] } = useTags()
  const { data: categoriesTree = [] } = useCategories()

  if (!isOpen) return null;

  return (
    <>
      {type === 'transaction' && (
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
      )}
      
      {type === 'account' && (
        <UniversalModal 
          title={payload?.accountId ? 'Configuración de Nodo' : 'Nuevo Nodo Financiero'}
          onClose={closeModal}
        >
          <AccountFormWrapper 
            institutions={institutions}
            onSuccess={closeModal}
            initialData={payload?.accountId ? accounts.find(a => a.id === payload.accountId) : undefined} 
          />
        </UniversalModal>
      )}
    </>
  )
}