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
      
      {/* EL INPUT PRINCIPAL */}
      <div className="w-full bg-transparent flex items-center justify-between cursor-text py-1">
        
        {/* 💡 MEJORA: flex-row y items-center para que estén en la misma línea */}
        <div className="flex flex-row items-center min-w-0 w-full pr-2">
          
          <input
            type="text"
            // 💡 flex-1 hace que el input empuje al subLabel hacia la derecha
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 font-bold p-0 focus:ring-0 truncate placeholder:font-medium placeholder:text-slate-400"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true); 
            }}
            onFocus={(e) => {
              setIsOpen(true);
              e.target.select(); 
            }}
          />

          {/* 💡 EL SUB-LABEL A LA DERECHA */}
          {selectedOption && !isOpen && selectedOption.subLabel && (
            // whitespace-nowrap evita que el nombre del banco se rompa en dos líneas
            <span className="text-xs font-medium text-slate-400 ml-3 whitespace-nowrap">
              {selectedOption.subLabel}
            </span>
          )}

        </div>
        
        {/* Flechita decorativa */}
        <button 
          type="button" 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
          tabIndex={-1} 
        >
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* MENÚ DESPLEGABLE */}
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
                  {/* 💡 MEJORA EN LA LISTA: También ponemos label y subLabel en la misma línea */}
                  <div className="flex-1 flex flex-row items-center justify-between min-w-0 pr-3">
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 truncate pr-2">
                      {opt.label}
                    </span>
                    
                    {opt.subLabel && (
                      <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>

                  {value === opt.id && <Check size={16} className="text-blue-600 flex-shrink-0 ml-1" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}