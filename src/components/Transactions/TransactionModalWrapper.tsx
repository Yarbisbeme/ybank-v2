'use client'

import { useEffect, useState } from 'react';
import { getTransactionById } from '@/lib/actions/transactions';
import TransactionForm from './TransactionForm';
import TransactionDetailView from './TransactionDetailView'; 
import UniversalModal from '../ui/UniversalModal';
import { Account, Tag, CategoryTree } from '@/types';
import { Loader2 } from 'lucide-react';

interface TransactionModalProps {
  transactionId?: string | null;
  defaultAccountId?: string | null;
  accounts: Account[];
  tags: Tag[];
  categoriesTree: CategoryTree[];
  onClose: () => void; // 💡 Para cerrar el modal desde aquí
}

export default function TransactionModalWrapper({ 
  transactionId, 
  defaultAccountId,
  accounts, 
  tags, 
  categoriesTree,
  onClose
}: TransactionModalProps) {
  
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!!transactionId);

  // 💡 Carga de datos optimizada en el cliente
  useEffect(() => {
    if (transactionId) {
      getTransactionById(transactionId).then(data => {
        setInitialData(data);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [transactionId]);

  const flatCategories = categoriesTree.flatMap(c => [c, ...(c.subcategories || [])]);
  const hasSplitItems = initialData?.items && initialData.items.length > 0;

  return (
    <UniversalModal 
      title={
        isLoading ? "Cargando..." :
        !initialData ? "Nueva Transacción" : 
        hasSplitItems ? "Detalle del Gasto" : "Editar Transacción"
      }
      onClose={onClose}
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
        </div>
      ) : hasSplitItems ? (
        <TransactionDetailView 
          transaction={initialData} 
          categories={flatCategories} 
          accounts={accounts}
        />
      ) : (
        <TransactionForm 
          accounts={accounts} 
          tags={tags} 
          categories={flatCategories} 
          initialData={initialData} 
          defaultAccountId={defaultAccountId} 
          onSuccess={onClose} 
        />
      )}
    </UniversalModal>
  );
}