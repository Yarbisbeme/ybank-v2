// src/components/Transactions/TransactionsDrawer.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import TransactionTable from '@/components/Transactions/RecentActivityTable'; // Asumo que este es tu componente de tabla/lista

export default function TransactionsDrawer({ transactions }: { transactions: any[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectamos si es móvil para no afectar el diseño en PC
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🖥️ EN COMPUTADORA: Renderizamos una lista normal al final de la página
  if (!isMobile) {
    return (
      <section className="w-full max-w-5xl mx-auto px-6 mt-12 pb-12">
        <h2 className="text-xl font-black italic mb-6 text-slate-800">Actividad Reciente</h2>
        <TransactionTable transactions={transactions} />
      </section>
    );
  }

  // 📱 EN MÓVIL: Renderizamos la Gaveta Interactiva
  return (
    <>
      {/* Fondo oscuro opcional cuando se expande a pantalla completa */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-slate-900/20 z-[80] backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.div
        // 💡 z-[90] lo pone por encima de todo menos del Navbar y los Modales Universales
        // 💡 h-[calc(100dvh-4rem)] hace que ocupe exactamente toda la pantalla menos los 64px (4rem) del Navbar
        className="fixed bottom-0 left-0 w-full bg-white z-[90] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col h-[calc(100dvh-4rem)]"
        
        // FÍSICA DE ANIMACIÓN:
        // Si está cerrado, asoma solo 85px desde el fondo. Si está abierto, sube hasta Y: 0.
        initial={{ y: "calc(100% - 85px)" }} 
        animate={{ y: isExpanded ? 0 : "calc(100% - 85px)" }}
        transition={{ type: "spring", damping: 25, stiffness: 250 }}
        
        // Habilitamos el arrastre (swipe)
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          // Si el usuario arrastra hacia abajo con fuerza, lo cerramos
          if (info.offset.y > 50 && info.velocity.y > 0) setIsExpanded(false); 
          // Si arrastra hacia arriba con fuerza, lo expandimos al 100%
          if (info.offset.y < -50 && info.velocity.y < 0) setIsExpanded(true); 
        }}
      >
        {/* === ÁREA TÁCTIL (Píldora y Título) === */}
        <div
          className="w-full pt-4 pb-4 flex flex-col items-center cursor-grab active:cursor-grabbing shrink-0 bg-white rounded-t-[32px]"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Píldora gris clásica de iOS */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-3" />
          
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {isExpanded ? 'Ocultar Actividad' : 'Ver Actividad'}
            </span>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronUp size={16} strokeWidth={3} />
            </motion.div>
          </div>
        </div>

        {/* === CONTENIDO (Las Transacciones) === */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20 scrollbar-hide">
          <TransactionTable transactions={transactions} />
        </div>
      </motion.div>
    </>
  );
}