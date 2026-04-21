'use client'

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
}

export default function SearchableDropdown({ options, value, onChange, placeholder }: SearchableDropdownProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  // 💡 TRUCO 1: Sincronizar el texto del input con la opción seleccionada 
  // solo cuando el menú está cerrado.
  useEffect(() => {
    if (!isOpen) {
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
    <div className="relative w-full" ref={wrapperRef}>
      
      {/* EL INPUT PRINCIPAL (Actúa como botón y buscador al mismo tiempo) */}
      <div className="w-full bg-transparent flex items-center justify-between cursor-text py-1">
        <div className="flex flex-col min-w-0 w-full pr-2">
          
          {/* Mostramos el contexto (ej. "Dentro de Entretenimiento") pequeñito arriba si hay algo seleccionado */}
          {selectedOption && !isOpen && selectedOption.subLabel && (
            <span className="text-[10px] text-slate-400 truncate -mb-0.5">{selectedOption.subLabel}</span>
          )}
          
          <input
            type="text"
            className="w-full bg-transparent border-none outline-none text-sm text-slate-800 font-bold p-0 focus:ring-0 truncate placeholder:font-medium placeholder:text-slate-400"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true); // Se abre automáticamente en cuanto empiezas a escribir
            }}
            onFocus={(e) => {
              setIsOpen(true);
              e.target.select(); // 💡 TRUCO 2: Selecciona todo el texto al hacer clic
            }}
          />
        </div>
        
        {/* Flechita decorativa a la derecha */}
        <button 
          type="button" 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
          tabIndex={-1} // Evita que el Tab se detenga aquí
        >
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* MENÚ DESPLEGABLE LIMPIO (Ya sin el buscador extra) */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 shadow-xl rounded-2xl z-50 overflow-hidden flex flex-col max-h-60">
          <div className="overflow-y-auto py-1 scrollbar-hide">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">No se encontraron resultados</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 truncate">{opt.label}</span>
                    {opt.subLabel && <span className="text-[11px] text-slate-400 truncate">{opt.subLabel}</span>}
                  </div>
                  {value === opt.id && <Check size={16} className="text-blue-600 flex-shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}