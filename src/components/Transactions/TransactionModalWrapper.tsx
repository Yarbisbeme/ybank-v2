import { getTransactionById } from '@/lib/actions/transactions';
import { getAccounts } from '@/lib/actions/accounts';
import { getTags } from '@/lib/actions/tags';
import { getCategories } from '@/lib/actions/categories';
import TransactionForm from './TransactionForm';
import TransactionDetailView from './TransactionDetailView'; // 💡 1. Importamos el nuevo Recibo
import UniversalModal from '../ui/UniversalModal';

export default async function TransactionModalWrapper({ editTxId }: { editTxId?: string }) {
  
  // Obtenemos todos los datos necesarios en paralelo
  const [accounts, tags, categoriesTree, initialData] = await Promise.all([
    getAccounts(),
    getTags(),
    getCategories(),
    editTxId ? getTransactionById(editTxId) : Promise.resolve(null)
  ]);

  const flatCategories = categoriesTree.flatMap(c => [c, ...(c.subcategories || [])]);
  
  // 💡 2. Detectamos si la transacción es un desglose
  const hasSplitItems = initialData?.items && initialData.items.length > 0;

  return (
    <UniversalModal 
      // 💡 3. Título dinámico
      title={
        !initialData ? "Nueva Transacción" : 
        hasSplitItems ? "Detalle del Gasto" : "Editar Transacción"
      }
    >
      {/* 💡 4. EL ENRUTADOR INTERNO DEL MODAL */}
      {hasSplitItems ? (
        // Si tiene hijos, mostramos el Recibo de Lectura / Micro-edición
        <TransactionDetailView 
          transaction={initialData} 
          categories={flatCategories} 
          accounts={accounts}
        />
      ) : (
        // Si no tiene hijos (o es nueva), mostramos el formulario completo
        <TransactionForm 
          accounts={accounts} 
          tags={tags} 
          categories={flatCategories} 
          initialData={initialData} 
        />
      )}
    </UniversalModal>
  );
}