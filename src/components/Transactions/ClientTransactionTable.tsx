'use client'

import { useTransactionsList } from '@/hooks/useCatalogs'; 
import TransactionTable from './RecentActivityTable'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function ClientTransactionTable({ initialTransactions }: { initialTransactions: any[] }) {
  const { data: transactions = [], isFetching } = useTransactionsList(initialTransactions);

  return (
    <div className="relative min-h-[400px]"> {/* Altura mínima para evitar saltos bruscos */}
      
      {/* 💡 OVERLAY DE CARGA: Aparece suavemente sobre la tabla */}
      <AnimatePresence>
        {isFetching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-card/40 backdrop-blur-[2px] rounded-[12px] transition-all"
          >
            <div className="flex flex-col items-center gap-3 p-6 bg-card border border-border shadow-2xl rounded-[20px]">
              <div className="relative flex items-center justify-center">
                {/* Un spinner más elegante y central */}
                <Loader2 className="animate-spin text-primary" size={32} strokeWidth={2.5} />
                <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full blur-xl"></div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
                Sincronizando Nodos...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className={`transition-all duration-500 ${isFetching ? 'opacity-40 grayscale-[0.5] scale-[0.99]' : 'opacity-100 scale-100'}`}>
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  );
}