// ClientTransactionTable.tsx
'use client'

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTransactionsList } from '@/hooks/useCatalogs';
import TransactionTable from './TransactionTable'; // Asegúrate de que el nombre importe el correcto
import { useSearchParams } from 'next/navigation';

export default function ClientTransactionTable() {
  // 💡 1. Estado para controlar la página actual
  const [currentPage, setCurrentPage] = useState(1);
  
  // 💡 2. Obtenemos el ID de la cuenta activa desde la URL (si existe)
  const searchParams = useSearchParams();
  const activeAccountId = searchParams.get('accountId');

  // 💡 3. Le pasamos la página al hook de TanStack Query
  const { data, isLoading, isFetching } = useTransactionsList(currentPage);

  // Extraemos las transacciones y el total desde el objeto 'data'
  const transactions = data?.transactions || [];
  const totalItems = data?.total || 0;

  return (
    <div className={`relative transition-opacity duration-300 ${isFetching && !isLoading ? 'opacity-80' : 'opacity-100'}`}>
      
      {/* 💡 4. Pasamos todas las props necesarias a la tabla */}
      <TransactionTable 
        transactions={transactions} 
        activeAccountId={activeAccountId} // Pasamos el contexto
        currentPage={currentPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage} // Permitimos que la tabla cambie la página
      />

      {/* Indicador sutil superior cuando cambia de página */}
      {isFetching && !isLoading && (
         <div className="absolute top-2 right-2 flex items-center justify-center p-1 bg-surface-2 rounded-full shadow-sm">
            <RefreshCw size={14} className="animate-spin text-blue-500" />
         </div>
      )}

      {isLoading && (
        <p className="flex justify-center items-center gap-2 text-center text-[9px] font-bold uppercase tracking-widest text-primary animate-pulse mt-4 py-8">
          <RefreshCw size={12} className="animate-spin" />
          Cargando Telemetría...
        </p>
      )}
    </div>
  );
}