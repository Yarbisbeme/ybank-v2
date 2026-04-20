'use client'

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import TransactionForm from './TransactionForm';
import { Account, Tag } from '@/types';

// 💡 1. Actualizamos la interfaz para incluir las categorías
// (Si tienes el tipo Category definido en @/types, impórtalo arriba. Si no, usa any[] por ahora)
interface TransactionModalProps {
  accounts: Account[];
  tags: Tag[]; 
  categories: any[]; // <-- AÑADIMOS ESTO
}

// 💡 2. Recibimos categories en los parámetros
export default function TransactionModal({ accounts, tags, categories }: TransactionModalProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isCreating = searchParams.get('newTx') === 'true';
  const editTxId = searchParams.get('editTx');
  const isOpen = isCreating || !!editTxId;

  const closeModal = () => {
    router.push(pathname, { scroll: false });
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
            className="relative w-full max-w-2xl bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden"
          >
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="pt-8 px-6 pb-2">
              <h2 className="text-xl font-bold text-slate-800">
                {editTxId ? 'Editar Transacción' : 'Nueva Transacción'}
              </h2>
            </div>

            <div className="max-h-[85vh] overflow-y-auto scrollbar-hide">
              <TransactionForm 
                accounts={accounts} 
                tags={tags}
                categories={categories} // 💡 3. LE PASAMOS LAS CATEGORÍAS AL FORMULARIO
                onSuccess={closeModal}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}