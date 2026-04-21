'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import TransactionForm from './TransactionForm';
import { Account, Tag } from '@/types';
import { getTransactionById } from '@/lib/actions/transactions';

interface TransactionModalProps {
  accounts: Account[];
  tags: Tag[]; 
  categories: any[];
}

export default function TransactionModal({ accounts, tags, categories }: TransactionModalProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isCreating = searchParams.get('newTx') === 'true';
  const editTxId = searchParams.get('editTx');
  const isOpen = isCreating || !!editTxId;

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    const fetchTx = async () => {
      if (editTxId) {
        setIsLoadingData(true);
        try {
          const tx = await getTransactionById(editTxId);
          if (tx) {
            // 💡 NORMALIZACIÓN AGRESIVA
            const safeType = tx.type?.toLowerCase().includes('in') ? 'income' 
                          : tx.type?.toLowerCase().includes('tra') ? 'transfer' 
                          : 'expense';

            setInitialData({
              id: tx.id,
              type: safeType, // 👈 Esto manda sobre cualquier cosa en la URL
              amount: tx.amount,
              date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
              note: tx.description || tx.note || '',
              accountId: tx.account_id,       
              categoryId: tx.category_id,     
              destinationAccountId: tx.destination_account_id, 
              tagIds: tx.tags?.map((t: any) => t.id) || [], 
            });
          }
        } catch (error) {
          console.error("Error:", error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    if (isOpen) fetchTx();
  }, [editTxId, isOpen]);

  const closeModal = () => {
    router.push(pathname, { scroll: false });
    setTimeout(() => setInitialData(null), 300); 
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 lg:left-64 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="pt-8 px-6 pb-4 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {editTxId ? 'Editar Transacción' : 'Nueva Transacción'}
              </h2>
            </div>

            <div className="max-h-[85vh] overflow-y-auto scrollbar-hide">
              {isLoadingData ? (
                <div className="w-full h-64 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 font-bold text-slate-400 animate-pulse">Cargando datos...</p>
                </div>
              ) : (
                initialData && (
                  <TransactionForm 
                    // 💡 CLAVE: Usamos el ID de la transacción como KEY. 
                    // Esto obliga a React a borrar el formulario viejo y crear uno nuevo.
                    key={`edit-${initialData.id}`} 
                    initialData={initialData} 
                    accounts={accounts} 
                    tags={tags}
                    categories={categories} 
                    onSuccess={closeModal}
                  />
                )
              )}
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}