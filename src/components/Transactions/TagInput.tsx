'use client'

import { useState, useRef, KeyboardEvent } from 'react';
import { Tag, X, Plus, Search } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Filtramos los tags para la vista
  const selectedTags = availableTags.filter(t => selectedTagIds.includes(t.id));
  
  // Tags para el dropdown (excluye los ya seleccionados y filtra por el texto escrito)
  const filteredTags = availableTags.filter(tag => 
    !selectedTagIds.includes(tag.id) && 
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const exactMatchExists = availableTags.find(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  // 2. Manejadores de eventos
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
        // Si escribió algo que ya existe, lo seleccionamos
        handleSelect(exactMatchExists.id);
      } else if (!exactMatchExists) {
        // Si no existe, creamos uno nuevo
        onCustomTagCreate(trimmed);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTagIds.length > 0) {
      // 💡 UX Pro: Si el input está vacío y presiona borrar, elimina el último tag
      const newIds = [...selectedTagIds];
      newIds.pop();
      onChange(newIds);
    }
  };

  return (
    <div className="relative w-full">
      
      {/* CAJA PRINCIPAL (Input + Chips) */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className={`min-h-[48px] p-2 bg-slate-50/50 border rounded-2xl flex flex-wrap gap-2 items-center transition-all cursor-text ${
          isFocused ? 'border-blue-500 ring-1 ring-blue-500 bg-white' : 'border-slate-200'
        }`}
      >
        <Tag size={16} className="text-slate-400 ml-1" />
        
        {/* Tags Seleccionados (Chips) */}
        {selectedTags.map(tag => (
          <span 
            key={tag.id}
            className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-xl text-xs font-bold shadow-sm"
          >
            #{tag.name}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(tag.id);
              }}
              className="hover:bg-blue-200 p-0.5 rounded-full transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Input Real */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)} // Delay para permitir el clic en el menú
          placeholder={selectedTags.length === 0 ? "Buscar o crear etiqueta..." : ""}
          className="flex-1 bg-transparent border-none outline-none min-w-[120px] text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0 p-1"
        />
      </div>

      {/* DROPDOWN (Buscador) */}
      {isFocused && (inputValue || filteredTags.length > 0) && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl z-50 overflow-hidden max-h-56 overflow-y-auto py-1">
          
          {/* Opciones filtradas */}
          {filteredTags.map(tag => (
            <div
              key={tag.id}
              // 💡 Usamos onMouseDown en lugar de onClick para que se dispare ANTES que el onBlur del input
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(tag.id);
              }}
              className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-sm text-slate-700 font-medium transition-colors"
            >
              <Search size={14} className="text-slate-400" />
              {tag.name}
            </div>
          ))}

          {/* Opción de Crear Nuevo (si no hay coincidencia exacta) */}
          {inputValue.trim() && !exactMatchExists && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                onCustomTagCreate(inputValue.trim());
                setInputValue('');
              }}
              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-sm text-blue-600 font-bold transition-colors border-t border-slate-50"
            >
              <Plus size={16} />
              Crear etiqueta "{inputValue.trim()}"
            </div>
          )}

          {/* Mensaje si todo está seleccionado y no escribe nada */}
          {filteredTags.length === 0 && !inputValue.trim() && (
            <div className="px-4 py-3 text-sm text-slate-400 text-center italic">
              No hay más etiquetas disponibles.
            </div>
          )}
        </div>
      )}
    </div>
  );
}