'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setIsVisible(false);
    
    setTimeout(() => {
      onClose(); 
    }, 300); 
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0">
          
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" 
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full ${maxWidth} bg-white rounded-t-[32px] md:rounded-[22px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]`}
          >
            {title && (
              <div className="pt-8 px-8 pb-5 border-b border-slate-100 shrink-0 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}
            <div className="max-h-[85vh] overflow-y-auto scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}