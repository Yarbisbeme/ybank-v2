'use client';

// 💡 1. Importamos useDragControls
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UniversalModalProps {
  children: React.ReactNode;
  title?: string; 
  maxWidth?: string;
  onClose: () => void;
}

export default function UniversalModal({ children, title, maxWidth = 'max-w-4xl', onClose }: UniversalModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // 💡 2. Instanciamos el controlador de arrastre
  const dragControls = useDragControls();

  useEffect(() => { 
    setIsVisible(true); 
  }, []);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(); 
    }, 300); 
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4">
          
          {/* Backdrop con Blur YBANK */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} 
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-pointer" 
          />

          {/* CONTENEDOR PRINCIPAL */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            
            // 💡 3. CONFIGURACIÓN DE ARRASTRE RESTRINGIDO
            drag="y"
            dragControls={dragControls} // Conectamos el controlador
            dragListener={false} // ¡ESTA ES LA MAGIA! Apaga el drag en el cuerpo del modal
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}

            className={cn(
              "relative w-full shadow-2xl flex flex-col overflow-hidden bg-background",
              "rounded-t-[20px] md:rounded-[12px] border border-border/50",
              "max-h-[95vh] md:max-h-[90vh]",
              maxWidth
            )}
          >
            {/* 💡 4. ZONA EXCLUSIVA DE ARRASTRE (Handle + Header) */}
            <div 
              className="w-full shrink-0 touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)} // Encendemos el motor de arrastre SOLO aquí
            >
              {/* HANDLE (Solo Móvil) */}
              <div className="md:hidden flex justify-center pt-3 pb-1 relative z-[60]">
                <div className="w-12 h-1.5 rounded-full bg-border" />
              </div>

              {/* HEADER ESTILO TERMINAL */}
              {title && (
                <div className="pt-2 md:pt-6 px-6 pb-4 flex justify-between items-center bg-transparent relative z-50">
                  <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground drop-shadow-md">
                    {title}
                  </h2>
                  <button 
                    onClick={handleClose} 
                    // 💡 Detenemos la propagación para que al dar clic en la X no se mueva el modal
                    onPointerDown={(e) => e.stopPropagation()} 
                    className="p-1.5 rounded-[6px] bg-surface-2/50 hover:bg-surface-2 text-foreground backdrop-blur-md transition-all active:scale-90 shadow-sm border border-border/50"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex-1 overflow-y-auto scrollbar-hide z-10">
              {children}
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}