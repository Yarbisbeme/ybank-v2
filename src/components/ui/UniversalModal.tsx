// src/components/ui/UniversalModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface UniversalModalProps {
  children: React.ReactNode;
  returnPath: string;
  title?: string; // 💡 Lo hacemos opcional por si algún modal no necesita título
}

export default function UniversalModal({ children, returnPath, title }: UniversalModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // 1. Efecto de entrada animada
  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // 💡 Esperamos a que la animación de cierre termine antes de limpiar la URL
    setTimeout(() => {
      router.push(returnPath, { scroll: false });
    }, 300); 
  };

  return (
    <AnimatePresence>
      {isOpen && (
        // 💡 items-end pega el modal al fondo en móvil. md:items-center lo centra en PC.
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4">
          
          {/* === BACKDROP (Fondo Oscuro) === */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" 
          />

          {/* === CONTENEDOR DEL MODAL === */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            // 💡 rounded-t-[32px] en móvil, max-h-[95vh] para dejar un pequeño borde arriba
            className="relative w-full max-w-2xl bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]"
          >
            {/* Botón de Cerrar Interno (Igual a tu imagen) */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Cabecera Opcional */}
            {title && (
              <div className="pt-6 px-6 pb-4 border-b border-slate-100 shrink-0">
                <h2 className="text-xl font-bold text-slate-800">
                  {title}
                </h2>
              </div>
            )}

            {/* Contenido (Scrolleable y oculta la barra de scroll visualmente) */}
            <div className="max-h-[85vh] overflow-y-auto scrollbar-hide pb-8">
              {children}
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}