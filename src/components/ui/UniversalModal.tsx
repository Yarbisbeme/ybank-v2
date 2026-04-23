// src/components/ui/UniversalModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; // 💡 Importamos los 3 mosqueteros de la URL
import { motion, AnimatePresence } from 'framer-motion';

interface UniversalModalProps {
  children: React.ReactNode;
  title?: string; 
}

export default function UniversalModal({ children, title }: UniversalModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // 1. Abre el modal al montarse
  useEffect(() => {
    setIsOpen(true);
  }, []);

  // 💡 2. FIX DE SEGURIDAD: Si la URL cambia mientras está abierto, forzamos que se mantenga visible
  useEffect(() => {
    setIsOpen(true);
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    
    setTimeout(() => {
      // 💡 3. LIMPIEZA QUIRÚRGICA: Clonamos la URL actual y borramos SOLO los activadores de modales
      const params = new URLSearchParams(searchParams.toString());
      params.delete('newTx');
      params.delete('editTx');
      params.delete('newAccount');
      params.delete('editAccountId');
      
      // Construimos la nueva URL limpia (preservando accountId, filtros, etc.)
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl, { scroll: false });
    }, 300); 
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4">
          
          {/* === BACKDROP === */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" 
          />

          {/* === CONTENEDOR === */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]"
          >
            {title && (
              <div className="pt-8 px-6 pb-4 border-b border-slate-100 shrink-0">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
              </div>
            )}
            <div className="max-h-[85vh] overflow-y-auto scrollbar-hide pb-8">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}