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

export default function UniversalModal({ children, title, maxWidth = 'max-w-2xl', onClose }: UniversalModalProps) {
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

          {/* 💡 EL CAMBIO: overflow-visible para que el calendario respire */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "relative w-full bg-card shadow-2xl flex flex-col overflow-visible",
              "rounded-t-[20px] md:rounded-[12px] border border-border/50",
              "max-h-[95vh] md:max-h-[90vh]",
              maxWidth
            )}
          >
            {/* HEADER ESTILO TERMINAL */}
            {title && (
              <div className="pt-6 px-6 pb-4 border-b border-border shrink-0 flex justify-between items-center bg-surface-2/30">
                <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-foreground">
                  {title}
                </h2>
                <button 
                  onClick={handleClose} 
                  className="p-1.5 rounded-[6px] hover:bg-surface-2 text-muted-foreground transition-all active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="relative flex-1 overflow-y-auto scrollbar-hide overflow-x-visible">
              {children}
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}