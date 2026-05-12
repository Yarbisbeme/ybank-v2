'use client'

import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTransactionsList, useAccounts } from '@/hooks/useCatalogs';
import TransactionTable from './TransactionTable'; 
import { useSearchParams } from 'next/navigation';

export default function ClientTransactionTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  
  // 1. Intentamos leer el ID de la URL
  const urlAccountId = searchParams.get('accountId');

  // 2. Traemos las cuentas desde la caché local IndexedDB (0ms si está offline)
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  
  const activeAccountId = useMemo(() => {
    if (urlAccountId) return urlAccountId;
    if (accounts.length > 0) return accounts[0].id;
    return null;
  }, [urlAccountId, accounts]);

  // 4. El hook de TanStack Query se ejecuta siempre con un ID garantizado
  const { data, isLoading: isLoadingTx, isFetching } = useTransactionsList(currentPage);

  const transactions = data?.transactions || [];
  const totalItems = data?.total || 0;

  // Combinamos los estados de carga
  const isQueryLoading = isLoadingTx || isLoadingAccounts || !activeAccountId;

  return (
    <div className={`relative transition-opacity duration-300 ${isFetching && !isQueryLoading ? 'opacity-80' : 'opacity-100'}`}>
      
      {isQueryLoading ? (
        <p className="flex justify-center items-center gap-2 text-center text-[9px] font-bold uppercase tracking-widest text-primary animate-pulse mt-4 py-8">
          <RefreshCw size={12} className="animate-spin" />
          Sincronizando Telemetría...
        </p>
      ) : (
        <TransactionTable 
          transactions={transactions} 
          activeAccountId={activeAccountId} 
          currentPage={currentPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage} 
        />
      )}

      {/* Indicador de actualización en segundo plano */}
      {isFetching && !isQueryLoading && (
         <div className="absolute top-2 right-2 flex items-center justify-center p-1 bg-surface-2 rounded-full shadow-sm">
            <RefreshCw size={14} className="animate-spin text-blue-500" />
         </div>
      )}
    </div>
  );
}