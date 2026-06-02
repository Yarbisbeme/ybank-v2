'use client'

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Tag as TagIcon, X, Plus, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface TagType {
  id: string;
  name: string;
}

interface TagInputProps {
  availableTags: TagType[];
  selectedTagIds: string[];
  onChange: (newIds: string[]) => void;
  onCustomTagCreate: (tagName: string) => void;
}

export default function TagInput({ 
  availableTags, 
  selectedTagIds, 
  onChange,
  onCustomTagCreate 
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  
  // 💡 1. Nuevos estados para el motor inteligente
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [openUpwards, setOpenUpwards] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 💡 2. EL MOTOR DE POSICIONAMIENTO EN TIEMPO REAL
  useEffect(() => {
    if (!isFocused) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const bounding = containerRef.current.getBoundingClientRect();
        setRect(bounding);

        // Cuando el teclado se abre en móvil, window.innerHeight se reduce drásticamente.
        // Si el espacio debajo del input es menor a 220px, abrimos el menú hacia ARRIBA.
        const spaceBelow = window.innerHeight - bounding.bottom;
        setOpenUpwards(spaceBelow < 220); 
      }
    };

    // Calculamos inmediatamente
    updatePosition();

    // 💡 3. Escuchamos el Scroll y el Teclado (Resize)
    // El 'true' al final es VITAL: permite escuchar el scroll DENTRO del modal
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isFocused, inputValue]); // Actualiza también si escribes algo nuevo

  const selectedTags = availableTags.filter(t => selectedTagIds.includes(t.id));
  
  const filteredTags = availableTags.filter(tag => 
    !selectedTagIds.includes(tag.id) && 
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const exactMatchExists = availableTags.find(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  const handleSelect = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      onChange([...selectedTagIds, tagId]);
    }
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleRemove = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;

      if (exactMatchExists && !selectedTagIds.includes(exactMatchExists.id)) {
        handleSelect(exactMatchExists.id);
      } else if (!exactMatchExists) {
        onCustomTagCreate(trimmed);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTagIds.length > 0) {
      const newIds = [...selectedTagIds];
      newIds.pop();
      onChange(newIds);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      
      <div 
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "min-h-[30px] p-1.5 bg-transparent flex flex-wrap gap-1.5 items-center transition-all cursor-text",
          "border-b border-border/60 focus-within:border-primary/50"
        )}
      >
        <AnimatePresence>
          {selectedTags.map(tag => (
            <motion.span 
              key={tag.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border border-primary/20"
            >
              <Hash size={10} className="opacity-70" />
              {tag.name}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(tag.id);
                }}
                className="hover:bg-primary/20 ml-1 p-0.5 rounded-sm transition-colors"
              >
                <X size={10} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder={selectedTags.length === 0 ? "ASIGNAR ETIQUETAS..." : ""}
          className="flex-1 bg-transparent border-none outline-none min-w-[80px] text-[11px] font-medium text-foreground placeholder:text-muted-foreground/40 focus:ring-0 p-0 uppercase tracking-widest"
        />
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {isFocused && (inputValue || filteredTags.length > 0) && rect && (
            <motion.div 
              // 💡 4. Animamos desde abajo si se abre hacia arriba, o desde arriba si se abre hacia abajo
              initial={{ opacity: 0, y: openUpwards ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: openUpwards ? 10 : -10 }}
              className={cn(
                "fixed bg-card border border-border shadow-2xl z-[9999] overflow-hidden max-h-48 overflow-y-auto py-1",
                // Redondeamos la esquina contraria a la que toca el input
                openUpwards ? "rounded-t-[8px] rounded-b-[4px]" : "rounded-b-[8px] rounded-t-[4px]"
              )}
              style={{
                left: rect.left,
                width: rect.width,
                // 💡 5. LA MAGIA MATEMÁTICA: Pegar arriba o abajo dependiendo del espacio
                ...(openUpwards 
                  ? { bottom: window.innerHeight - rect.top + 4 } 
                  : { top: rect.bottom + 4 }
                )
              }}
            >
              {filteredTags.map(tag => (
                <div
                  key={tag.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(tag.id);
                  }}
                  className="px-3 py-2 hover:bg-surface-2 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Hash size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-tight">{tag.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">SELECCIONAR</span>
                </div>
              ))}

              {inputValue.trim() && !exactMatchExists && (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onCustomTagCreate(inputValue.trim());
                    setInputValue('');
                  }}
                  className="px-3 py-2 hover:bg-primary/5 cursor-pointer flex items-center gap-2 border-t border-border/50"
                >
                  <Plus size={14} className="text-primary" />
                  <span className="text-[11px] font-black text-primary uppercase tracking-widest">
                    CREAR ETIQUETA: "{inputValue.trim()}"
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body 
      )}
    </div>
  );
}