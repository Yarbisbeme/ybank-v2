'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => { 
    setIsVisible(true); 
  }, []);

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

          {/* 💡 CONTENEDOR PRINCIPAL */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "relative w-full shadow-2xl flex flex-col overflow-hidden bg-background",
              "rounded-t-[20px] md:rounded-[12px] border border-border/50",
              "max-h-[95vh] md:max-h-[90vh]",
              maxWidth
            )}
            // 💡 TRUCO NINJA: Si el calendario se abre (usualmente inyecta un popup global), 
            // no se verá cortado porque el calendario debería usar React Portals. 
            // Si tu calendario no usa Portals, me avisas y usamos un truco con padding.
          >
            {/* HEADER ESTILO TERMINAL */}
            {title && (
              // 💡 FIX: Quitamos el "absolute top-0..." y agregamos "relative"
              // Esto empujará el contenido hacia abajo correctamente sin encimarse.
              <div className="pt-6 px-6 pb-2 shrink-0 flex justify-between items-center bg-transparent relative z-50">
                <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground drop-shadow-md">
                  {title}
                </h2>
                <button 
                  onClick={handleClose} 
                  className="p-1.5 rounded-[6px] bg-surface-2/50 hover:bg-surface-2 text-foreground backdrop-blur-md transition-all active:scale-90 shadow-sm border border-border/50"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* CONTENEDOR DEL HIJO */}
            <div className="relative flex-1 overflow-y-auto scrollbar-hide">
              {children}
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}