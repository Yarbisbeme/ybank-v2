'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import TransactionTable from '@/components/dashboard/RecentActivityTable';

export default function TransactionsDrawer({ transactions }: { transactions: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectamos si es móvil para no afectar el diseño de escritorio
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🖥️ EN ESCRITORIO: Renderizamos normal, sin modal
  if (!isMobile) {
    return (
      <section className="w-full px-6 mt-12 pb-12">
        <h2 className="text-xl font-black italic mb-4 text-slate-800">Recent Activity</h2>
        <TransactionTable transactions={transactions} />
      </section>
    );
  }

  // 📱 EN MÓVIL: Renderizamos el Bottom Sheet interactivo
  return (
    <>
      <AnimatePresence>
        {/* Fondo oscuro desenfocado cuando el modal está abierto */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/20 z-[80] backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* La Gaveta (Bottom Sheet) */}
      <motion.div
        className="fixed bottom-0 left-0 w-full bg-white z-[90] rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col"
        // 💡 Si está cerrado, asoma 85px. Si está abierto, sube hasta Y: 0.
        initial={{ y: "calc(100% - 85px)" }} 
        animate={{ y: isOpen ? 0 : "calc(100% - 85px)" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          // Si arrastra hacia abajo con fuerza, cerramos. Si arrastra hacia arriba, abrimos.
          if (info.offset.y > 50) setIsOpen(false); 
          if (info.offset.y < -50) setIsOpen(true); 
        }}
        style={{ height: "85dvh" }} // Ocupa el 85% de la pantalla al abrirse
      >
        {/* Área de agarre (Drag Handle) */}
        <div
          className="w-full pt-4 pb-4 flex flex-col items-center cursor-grab active:cursor-grabbing shrink-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-3" />
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {isOpen ? 'Ocultar Actividad' : 'Ver Actividad'}
            </span>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
              <ChevronUp size={16} strokeWidth={3} />
            </motion.div>
          </div>
        </div>

        {/* Contenido (Tabla scrolleable) */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 scrollbar-hide">
          <TransactionTable transactions={transactions} />
        </div>
      </motion.div>
    </>
  );
}