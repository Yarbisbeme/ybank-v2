'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface UniversalModalProps {
  children: React.ReactNode;
  title?: string; 
  maxWidth?: string; // 💡 1. Agregamos esta propiedad
}

export default function UniversalModal({ children, title, maxWidth = 'max-w-2xl' }: UniversalModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { setIsOpen(true); }, []);
  useEffect(() => { setIsOpen(true); }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('newTx');
      params.delete('editTx');
      params.delete('newAccount');
      params.delete('editAccountId');
      
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl, { scroll: false });
    }, 300); 
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-6">
          
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" 
          />

          {/* 💡 2. Usamos la variable maxWidth. Si no le pasan nada, usa max-w-2xl por defecto */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full ${maxWidth} bg-white rounded-t-[32px] md:rounded-[22px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]`}
          >
            {title && (
              <div className="pt-8 px-8 pb-5 border-b border-slate-100 shrink-0">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
              </div>
            )}
            <div className="max-h-[85vh] overflow-y-auto scrollbar-hide pb-8 px-2 md:px-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}