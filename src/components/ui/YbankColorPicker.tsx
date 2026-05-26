'use client'

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Check, X, Hash } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface YbankColorPickerProps {
  color: string;
  isOpen: boolean;
  onChange: (color: string) => void;
  onClose: () => void;
}

const YBANK_PALETTE = [
  '#09090b', '#dc2626', '#2563EB', '#166534', '#f59e0b', '#9ca3af', '#f5f5f4'
];

// --- MATEMÁTICA DE COLOR (Con escudos anti-errores) ---
const hexToHsv = (hex?: string) => {
  const safeHex = hex || '#09090b'; // 🛡️ Evita el error 'replace of undefined'
  let r = 0, g = 0, b = 0;
  const cleanHex = safeHex.replace('#', '');
  if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = (h: number, s: number, v: number) => {
  h /= 360; s /= 100; v /= 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export default function YbankColorPicker({ color, isOpen, onChange, onClose }: YbankColorPickerProps) {
  const safeInitialColor = color || '#09090b';

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // 💡 Lógica JS como el Calendario
  const [hsv, setHsv] = useState(hexToHsv(safeInitialColor));
  const [hexInput, setHexInput] = useState(safeInitialColor.toUpperCase());
  const areaRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentColorHex = hsvToHex(hsv.h, hsv.s, hsv.v);

  useEffect(() => {
    if (hexInput !== currentColorHex) {
      setHexInput(currentColorHex);
      onChange(currentColorHex);
    }
  }, [currentColorHex]);

  useEffect(() => {
    if (isOpen) {
      const safeColor = color || '#09090b';
      setHsv(hexToHsv(safeColor));
      setHexInput(safeColor.toUpperCase());
    }
  }, [isOpen, color]);

  const handleAreaDrag = (e: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const s = Math.round((x / rect.width) * 100);
    const v = Math.round(100 - (y / rect.height) * 100);
    setHsv(prev => ({ ...prev, s, v }));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging.current) handleAreaDrag(e);
    };
    const onUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setHexInput(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setHsv(hexToHsv(val));
      onChange(val);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const labelClasses = "text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5 block";
  const inputContainerClasses = "flex items-center w-full bg-surface-2 border border-border rounded-[8px] px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all";

  const ColorPickerUI = (
    <div className="flex flex-col w-full">
      {/* 1. CUADRO DE SATURACIÓN */}
      <div className="mb-5">
        <label className={labelClasses}>Saturación y Brillo</label>
        <div 
          ref={areaRef}
          onMouseDown={(e) => { isDragging.current = true; handleAreaDrag(e); }}
          onTouchStart={(e) => { isDragging.current = true; handleAreaDrag(e); }}
          className="relative w-full h-[180px] md:h-36 rounded-[10px] cursor-crosshair overflow-hidden border border-border shadow-sm select-none touch-none"
          style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }} />
          <div 
            className="absolute w-5 h-5 md:w-4 md:h-4 rounded-full border-[2.5px] border-white shadow-sm transform -translate-x-2.5 -translate-y-2.5 md:-translate-x-2 md:-translate-y-2 pointer-events-none"
            style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: currentColorHex }}
          />
        </div>
      </div>

      {/* 2. SLIDER DE TONO */}
      <div className="mb-6">
        <label className={labelClasses}>Tono Base (Hue)</label>
        <input 
          type="range" min="0" max="360" 
          value={hsv.h} 
          onChange={(e) => setHsv(prev => ({ ...prev, h: Number(e.target.value) }))}
          className="w-full h-4 md:h-3 rounded-full appearance-none cursor-pointer border border-border shadow-inner
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 md:[&::-webkit-slider-thumb]:w-4.5 md:[&::-webkit-slider-thumb]:h-4.5 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
            [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:shadow-md"
          style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
        />
      </div>

      {/* 3. INPUTS HEX & PREVIEW */}
      <div className="flex gap-4 mb-6 border-b border-border/50 pb-6">
        <div className="flex-1">
          <label className={labelClasses}>Muestra</label>
          <div className="w-full h-[42px] rounded-[10px] border border-border shadow-sm" style={{ backgroundColor: currentColorHex }} />
        </div>
        <div className="flex-[2]">
          <label className={labelClasses}>Código HEX</label>
          <div className={cn(inputContainerClasses, "h-[42px]")}>
            <Hash size={14} className="text-muted-foreground mr-2 shrink-0" />
            <input 
              type="text" 
              maxLength={7}
              value={hexInput.replace('#', '')}
              onChange={handleHexInputChange}
              className="bg-transparent border-none outline-none w-full uppercase font-mono text-[14px] md:text-[12px] font-bold text-foreground tracking-wider"
            />
          </div>
        </div>
      </div>

      {/* 4. PALETA YBANK */}
      <div className="mb-6">
        <label className={labelClasses}>Paleta Corporativa</label>
        <div className="flex justify-between gap-2.5">
          {YBANK_PALETTE.map(preset => (
            <button
              key={preset}
              onClick={() => setHsv(hexToHsv(preset))}
              className={cn(
                "flex-1 aspect-square rounded-[8px] border flex items-center justify-center transition-transform hover:scale-110",
                currentColorHex === preset.toUpperCase() ? "border-primary shadow-md scale-110 ring-2 ring-primary/20" : "border-border shadow-sm"
              )}
              style={{ backgroundColor: preset }}
            >
              {currentColorHex === preset.toUpperCase() && <Check size={16} className={preset === '#f5f5f4' ? 'text-black' : 'text-white'} />}
            </button>
          ))}
        </div>
      </div>

      {/* 5. BOTÓN DE CONFIRMACIÓN */}
      <button 
        onClick={onClose}
        className="w-full flex items-center justify-center gap-2 py-4 md:py-3.5 rounded-[12px] md:rounded-[10px] bg-foreground text-background text-[12px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] shadow-lg mt-auto"
      >
        <Check size={16} /> Confirmar Color
      </button>
    </div>
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        isMobile ? (
          /* === VISTA MÓVIL (BOTTOM SHEET) === */
          <div className="fixed inset-0 z-[99999] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }} // 💡 Permite arrastrar hacia abajo libremente
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={handleDragEnd}
              className="relative w-full bg-background rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden border-t border-border/50 p-5 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pb-6 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-border" />
              </div>
              {ColorPickerUI}
            </motion.div>
          </div>
        ) : (
          /* === VISTA DESKTOP (MODAL CENTRAL) === */
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose} 
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-pointer" 
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-sm shadow-2xl flex flex-col overflow-hidden bg-background rounded-[16px] border border-border/50 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">
                  Configurar Color
                </p>
                <button onClick={onClose} className="p-1.5 rounded-md bg-surface-2/50 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors border border-border/50">
                  <X size={16} />
                </button>
              </div>
              {ColorPickerUI}
            </motion.div>
          </div>
        )
      )}
    </AnimatePresence>,
    document.body
  );
}