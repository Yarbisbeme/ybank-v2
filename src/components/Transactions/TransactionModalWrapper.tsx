// src/components/Transactions/TransactionModalWrapper.tsx
import { getAccounts } from '@/lib/actions/accounts';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';
import { getTransactionById } from '@/lib/actions/transactions';
import UniversalModal from '@/components/ui/UniversalModal';
import TransactionForm from './TransactionForm';

export default async function TransactionModalWrapper({ editTxId }: { editTxId?: string }) {
  // 💡 1. Cargamos TODO en paralelo desde el servidor (cero spinners de carga en el cliente)
  const [accounts, categoriesTree, tags, tx] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTags(),
    editTxId ? getTransactionById(editTxId) : Promise.resolve(null)
  ]);

  const flatCategories = categoriesTree.flatMap(c => [c, ...(c.subcategories || [])]);

  // 💡 2. Normalizamos la data exactamente como lo hacías antes, pero en el backend
  let initialData = null;
  if (tx) {
    const safeType = tx.type?.toLowerCase().includes('in') ? 'income' 
                   : tx.type?.toLowerCase().includes('tra') ? 'transfer' 
                   : 'expense';

    initialData = {
      id: tx.id,
      type: safeType,
      amount: tx.amount,
      date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
      note: tx.description || tx.note || '',
      accountId: tx.account_id,       
      categoryId: tx.category_id,     
      destinationAccountId: tx.destination_account_id, 
      tagIds: tx.tags?.map((t: any) => t.id) || [], 
    };
  }

  return (
    <UniversalModal 
      returnPath="/accounts" 
      title={initialData ? 'Editar Transacción' : 'Nueva Transacción'}
    >
      <TransactionForm 
        initialData={initialData} 
        accounts={accounts || []} 
        tags={tags || []} 
        categories={flatCategories || []} 
      />
    </UniversalModal>
  );
}