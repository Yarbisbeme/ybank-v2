'use client'

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  id: string;
  label: string;
  subLabel?: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export default function SearchableDropdown({ options, value, onChange, placeholder, disabled = false }: SearchableDropdownProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  // 💡 LA SOLUCIÓN: Limpiar al abrir, restaurar al cerrar
  useEffect(() => {
    if (isOpen) {
      // Cuando se abre, vaciamos el input para que el filtro muestre TODAS las opciones
      setInputValue('');
    } else {
      // Cuando se cierra, volvemos a poner el nombre de la opción seleccionada
      setInputValue(selectedOption ? selectedOption.label : '');
    }
  }, [isOpen, selectedOption]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(inputValue.toLowerCase()) || 
    (opt.subLabel && opt.subLabel.toLowerCase().includes(inputValue.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", disabled && "opacity-50 pointer-events-none")} ref={wrapperRef}>
      
      {/* EL INPUT PRINCIPAL */}
      <div className="w-full bg-transparent flex items-center justify-between cursor-text py-1">
        <div className="flex flex-row items-center min-w-0 w-full pr-2">
          <input
            type="text"
            disabled={disabled}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground font-bold p-0 focus:ring-0 truncate placeholder:font-medium placeholder:text-muted-foreground/50 disabled:cursor-not-allowed transition-colors"
            // 💡 UX EXTRA: Si está abierto, el placeholder muestra el nombre de la opción actual como guía
            placeholder={isOpen && selectedOption ? selectedOption.label : placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true); 
            }}
            onFocus={() => {
              setIsOpen(true);
              // Ya no necesitamos e.target.select() porque el texto se borra automáticamente
            }}
          />

          {/* EL SUB-LABEL A LA DERECHA */}
          {selectedOption && !isOpen && selectedOption.subLabel && (
            <span className="text-xs font-medium text-muted-foreground ml-3 whitespace-nowrap">
              {selectedOption.subLabel}
            </span>
          )}
        </div>
        
        {/* Flechita decorativa */}
        <button 
          type="button" 
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-surface-2 rounded-[6px] transition-colors flex-shrink-0"
          tabIndex={-1} 
        >
          <ChevronDown size={16} className={cn("text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
      </div>

      {/* MENÚ DESPLEGABLE */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-card border border-border shadow-2xl rounded-[8px] z-[9999] overflow-hidden flex flex-col max-h-60">
          <div className="overflow-y-auto py-1 scrollbar-hide">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center font-medium">No se encontraron resultados</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className="px-4 py-2.5 hover:bg-surface-2 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="flex-1 flex flex-row items-center justify-between min-w-0 pr-3">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary truncate pr-2 transition-colors">
                      {opt.label}
                    </span>
                    
                    {opt.subLabel && (
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>

                  {value === opt.id && <Check size={16} className="text-primary flex-shrink-0 ml-1" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}