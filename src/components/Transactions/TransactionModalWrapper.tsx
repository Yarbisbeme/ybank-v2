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
  initialData?: any; // 💡 Recibimos la data instantánea
  accounts: Account[];
  tags: Tag[];
  categoriesTree: CategoryTree[];
  onClose: () => void;
}

export default function TransactionModalWrapper({ 
  transactionId, 
  defaultAccountId,
  initialData: passedInitialData, // 💡 Lo renombramos para uso interno
  accounts, 
  tags, 
  categoriesTree,
  onClose
}: TransactionModalProps) {
  
  // Si nos pasan la data, la usamos. Si no, empezamos en null.
  const [data, setData] = useState<any>(passedInitialData || null);
  // Si no tenemos data pero sí un ID, mostramos carga. Si ya hay data, NO cargamos.
  const [isLoading, setIsLoading] = useState(!passedInitialData && !!transactionId);

  useEffect(() => {
    // Solo buscamos en la BD si nos pasaron un ID pero NO nos pasaron el objeto inicial
    // (Por ejemplo, si abrimos el modal desde una URL compartida en el futuro)
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

  const flatCategories = categoriesTree.flatMap(c => [c, ...(c.subcategories || [])]);
  const hasSplitItems = data?.items && data.items.length > 0;

  return (
    <UniversalModal 
      title={
        isLoading ? "Cargando..." :
        !data ? "Nueva Transacción" : 
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
          transaction={data} 
          categories={flatCategories} 
          accounts={accounts}
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