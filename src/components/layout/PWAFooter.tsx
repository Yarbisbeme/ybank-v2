'use client';

import { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAFooter() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está instalada (modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // 2. Capturar el evento de instalación
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <footer className="w-full py-6 px-4 border-t border-border bg-card/50 backdrop-blur-md mt-auto">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Info de la Compañía */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
            <Terminal size={14} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              YBank Engine <span className="text-muted-foreground ml-1">v2.0</span>
            </p>
            <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
              © 2026 • Powered by <span className="text-blue-600 font-bold">YBM ORG</span>
            </p>
          </div>
        </div>

        {/* Botón PWA Dinámico */}
        <AnimatePresence>
          {!isStandalone && installPrompt && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-500/10 group"
            >
              <Download size={14} className="group-hover:bounce" />
              Instalar App Nativa
            </motion.button>
          )}
        </AnimatePresence>

        {/* Badge de Estado (Solo se ve si ya es PWA) */}
        {isStandalone && (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
              Nativa Encrypted Mode
            </span>
          </div>
        )}

      </div>
    </footer>
  );
}