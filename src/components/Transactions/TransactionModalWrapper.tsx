'use client'

import { useEffect, useState } from 'react';
import { getTransactionById } from '@/lib/actions/transactions';
import TransactionForm from './TransactionForm';
import TransactionDetailView from './TransactionDetailView'; 
import UniversalModal from '../ui/UniversalModal';
import { Account, Tag, CategoryTree } from '@/types';
import { Loader2 } from 'lucide-react';

export default function TransactionModalWrapper({ 
  transactionId, 
  defaultAccountId,
  initialData: passedInitialData,
  accounts, 
  tags, 
  categoriesTree,
  onClose
}: any) {
  
  const [data, setData] = useState<any>(passedInitialData || null);
  const [isLoading, setIsLoading] = useState(!passedInitialData && !!transactionId);

  // 💡 1. ESTADO LOCAL: Controla si estamos forzando la vista de edición
  const [isForcedEdit, setIsForcedEdit] = useState(false);

  useEffect(() => {
    if (!passedInitialData && transactionId) {
      setIsLoading(true);
      getTransactionById(transactionId).then(res => {
        setData(res);
        setIsLoading(false);
      });
    } else {
      setData(passedInitialData);
      setIsLoading(false);
    }
  }, [transactionId, passedInitialData]);

  const flatCategories = categoriesTree.flatMap((c: any) => [c, ...(c.subcategories || [])]);
  
  // 💡 2. LA MAGIA: Si el usuario activó la edición manual, apagamos hasSplitItems
  const hasSplitItems = data?.items && data.items.length > 0 && !isForcedEdit;

  return (
    <UniversalModal 
      title={
        isLoading ? "Cargando..." :
        !data ? "Nueva Transacción" : 
        hasSplitItems ? "Detalle de la Operación" : "Editar Transacción"
      }
      onClose={onClose}
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
        </div>
      ) : hasSplitItems ? (
        <TransactionDetailView 
          transaction={data} 
          categories={flatCategories} 
          accounts={accounts}
          // 💡 3. Le pasamos una función que enciende el modo edición
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
    </UniversalModal>
  );
}