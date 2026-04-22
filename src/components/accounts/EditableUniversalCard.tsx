'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CreditCard, Wallet, Landmark, Receipt, Palette, ChevronDown, Coins, Activity, Building2, Search, X } from 'lucide-react';
import { EditCreateAccount, CustomPattern, AccountType, CurrencyCode, Institution } from '@/types';
import { ACCOUNT_TYPES } from '@/lib/utils'

interface EditableCardProps {
  data: EditCreateAccount;
  onChange: (field: keyof EditCreateAccount, value: any) => void;
  institutions?: Institution[]; 
}

export default function EditableUniversalCard({ data, onChange, institutions = [] }: EditableCardProps) {
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isBankMenuOpen, setIsBankMenuOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredInstitutions = useMemo(() => {
    if (!bankSearchQuery.trim()) return institutions;
    const lowerQuery = bankSearchQuery.toLowerCase();
    return institutions.filter(inst => inst.name.toLowerCase().includes(lowerQuery));
  }, [institutions, bankSearchQuery]);

  useEffect(() => {
    if (isBankMenuOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setBankSearchQuery(''); 
    }
  }, [isBankMenuOpen]);

  const isDarkText = data.custom_text_theme === 'dark';
  const textColor = isDarkText ? 'text-slate-900' : 'text-white';
  const secondaryOpacity = isDarkText ? 'text-slate-800/60' : 'text-white/70';
  const inputHoverClass = isDarkText ? 'hover:bg-black/5 focus:bg-white/20 focus:ring-slate-900/20' : 'hover:bg-white/10 focus:bg-black/20 focus:ring-white/30';

  const currentType = ACCOUNT_TYPES.find(t => t.id === data.type) || ACCOUNT_TYPES[0];
  const TypeIcon = currentType.icon;

  return (
    <div className="w-full max-w-[380px] mx-auto space-y-4 relative">
      
      {/* =========================================
          💳 LA TARJETA (IN-PLACE EDITING)
          ========================================= */}
      <div 
        // 💡 FIX 1: Añadido min-h-[220px] y flex flex-col para evitar desbordamientos si el texto es muy largo
        className={`@container relative z-40 w-full min-h-[220px] aspect-[1.586/1] rounded-[28px] overflow-visible shadow-2xl transition-colors duration-500 group flex flex-col ${textColor}`}
        style={{ backgroundColor: data.color }}
      >
        {/* === FONDOS Y PATRONES === */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden rounded-[28px]">
          {data.custom_pattern === 'waves' && (
            <>
              <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] rounded-full border border-white/10" />
              <div className="absolute top-[10%] left-[20%] w-[100%] h-[100%] rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-30" />
            </>
          )}
          {data.custom_pattern === 'geometric' && (
            <>
              <div className="absolute top-[10%] left-[5%] w-24 h-24 bg-white/10 rounded-xl rotate-[15deg] blur-[1px]" />
              <div className="absolute bottom-[15%] right-[15%] w-32 h-32 border border-white/20 rounded-2xl rotate-[35deg]" />
            </>
          )}
          {/* Añade los demás patrones aquí si los tienes... */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />
        </div>

        {/* === CONTENIDO INTERACTIVO === */}
        {/* 💡 FIX 2: Reducido el padding vertical (p-5) para que respire mejor en espacios reducidos */}
        <div className="relative z-10 h-full p-5 md:p-6 flex flex-col justify-between flex-1">
          
          <div className="flex justify-between items-start relative z-50">
            
            {/* SELECTOR DE BANCO */}
            <div className="relative w-full max-w-[65%]">
              <button 
                type="button"
                onClick={() => setIsBankMenuOpen(!isBankMenuOpen)}
                className={`flex items-center gap-2 rounded-2xl backdrop-blur-md border transition-all w-full text-left ${
                  data.institution?.logo_url ? 'p-1.5' : 'p-1.5 pr-3'
                } ${
                  isBankMenuOpen ? 'bg-white/30 border-white/40 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/20 hover:border-white/10'
                }`}
              >
                {data.institution?.logo_url ? (
                  <div className="flex items-center justify-between w-full px-2">
                    <img src={data.institution.logo_url} alt={data.institution.name} className="h-8 object-contain shrink-0" />
                    <ChevronDown size={14} className={`shrink-0 opacity-50 ml-2 transition-transform duration-300 ${isBankMenuOpen ? 'rotate-180' : ''}`} />
                  </div>
                ) : (
                  <>
                    <div className={`w-8 h-8 rounded-xl flex shrink-0 items-center justify-center font-bold border ${isDarkText ? 'bg-slate-900/5 border-slate-900/10' : 'bg-white/20 border-white/30 shadow-sm'}`}>
                      {data.institution?.name ? data.institution.name.charAt(0).toUpperCase() : <Building2 size={16} />}
                    </div>
                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] leading-tight line-clamp-1 flex-1`}>
                      {data.institution?.name || 'Buscar Banco'}
                    </span>
                    <ChevronDown size={14} className={`shrink-0 opacity-50 transition-transform duration-300 ${isBankMenuOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {/* PANEL DEL BUSCADOR */}
              {isBankMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsBankMenuOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-[280px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 origin-top-left flex flex-col max-h-[300px]">
                    <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                      <Search size={16} className="text-slate-400 shrink-0" />
                      <input 
                        ref={searchInputRef}
                        type="text"
                        value={bankSearchQuery}
                        onChange={(e) => setBankSearchQuery(e.target.value)}
                        placeholder="Buscar institución..."
                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0 placeholder:text-slate-400"
                      />
                      {bankSearchQuery && (
                        <button onClick={() => setBankSearchQuery('')} className="p-1 hover:bg-slate-200 rounded-full text-slate-400">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="p-1.5 flex-1 overflow-y-auto scrollbar-hide">
                      {filteredInstitutions.length > 0 ? (
                        filteredInstitutions.map((inst) => (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => {
                              onChange('institution', inst);
                              setIsBankMenuOpen(false);
                            }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all w-full text-left ${
                              data.institution?.id === inst.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            {inst.logo_url ? (
                              <img src={inst.logo_url} className="w-6 h-6 object-contain" />
                            ) : (
                              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-white" style={{ backgroundColor: inst.brand_color_primary || '#cbd5e1' }}>
                                {inst.name.charAt(0)}
                              </div>
                            )}
                            <span className="truncate">{inst.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="py-8 text-center px-4">
                          <p className="text-sm font-bold text-slate-400">No se encontraron bancos</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* SELECTOR DE TIPO */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                className={`flex items-center gap-1.5 p-2 rounded-2xl backdrop-blur-md border transition-all ${
                  isTypeMenuOpen ? 'bg-white/30 border-white/40 shadow-lg' : 'bg-white/10 border-white/10 hover:bg-white/20'
                }`}
              >
                <TypeIcon size={18} strokeWidth={2.5} />
                <ChevronDown size={14} className={`opacity-70 transition-transform duration-300 ${isTypeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTypeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTypeMenuOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 origin-top-right">
                    <div className="p-1.5 flex flex-col">
                      {ACCOUNT_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = data.type === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              onChange('type', type.id);
                              setIsTypeMenuOpen(false);
                            }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all w-full text-left ${
                              isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <Icon size={16} strokeWidth={isSelected ? 2.5 : 2} />
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* BODY: Nombre y Balance */}
          {/* 💡 FIX 3: Cambiado mb-6 a mb-3 para no empujar el footer hacia abajo */}
          <div className="mt-auto mb-3">
            <input 
              type="text"
              value={data.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="Ej. Ahorros Viaje"
              className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-1 bg-transparent border-none p-1 -ml-1 rounded outline-none ring-2 ring-transparent transition-all ${secondaryOpacity} ${inputHoverClass} w-full placeholder:text-current placeholder:opacity-50`}
            />
            
            <div className="flex items-baseline gap-1 relative z-40">
              <select 
                value={data.currency}
                onChange={(e) => onChange('currency', e.target.value as CurrencyCode)}
                className={`text-base font-medium bg-transparent border-none outline-none appearance-none cursor-pointer rounded p-1 -ml-1 ring-2 ring-transparent transition-all ${inputHoverClass}`}
              >
                <option value="DOP" className="text-black">DOP</option>
                <option value="USD" className="text-black">USD</option>
              </select>

              <input 
                type="number"
                step="0.01"
                value={data.current_balance || ''}
                onChange={(e) => onChange('current_balance', Number(e.target.value))}
                placeholder="0.00"
                className={`text-[40px] leading-none font-bold tracking-tight bg-transparent border-none p-1 rounded outline-none ring-2 ring-transparent transition-all ${inputHoverClass} w-full max-w-[200px] placeholder:text-current placeholder:opacity-30`}
              />
            </div>
          </div>

          {/* FOOTER: Últimos 4 dígitos y Red */}
          <div className="flex justify-between items-end">
            <div className="flex items-center relative z-40">
              {/* 💡 FIX 4: Reducido a solo 4 puntos para ahorrar espacio horizontal vital */}
              <span className={`text-[13px] font-mono tracking-[0.25em] ${secondaryOpacity} mr-1`}>••••</span>
              <input 
                type="text"
                maxLength={4}
                value={data.last_4_digits || ''}
                onChange={(e) => onChange('last_4_digits', e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className={`text-[13px] font-mono tracking-[0.25em] bg-transparent border-none p-1 rounded outline-none ring-2 ring-transparent transition-all ${secondaryOpacity} ${inputHoverClass} w-16 placeholder:text-current placeholder:opacity-50`}
              />
            </div>
            <span className="text-3xl font-black italic tracking-tighter leading-none opacity-90 relative z-0">VISA</span>
          </div>
        </div>
      </div>

      {/* =========================================
          🛠️ BARRA DE HERRAMIENTAS (DISEÑO)
          ========================================= */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-2xl shadow-sm relative z-30">
        
        {/* COLOR PICKER NATIVO OCULTO */}
        <div className="flex items-center px-3 border-r border-slate-200">
          <label 
            title="Cambiar color de la tarjeta"
            className="relative flex items-center justify-center w-8 h-8 rounded-full shadow-sm border-[3px] border-white cursor-pointer overflow-hidden transition-transform hover:scale-105 ring-1 ring-slate-200" 
            style={{ backgroundColor: data.color }}
          >
            <input 
              type="color" 
              value={data.color}
              onChange={(e) => onChange('color', e.target.value)}
              className="absolute inset-[-10px] w-12 h-12 opacity-0 cursor-pointer"
            />
          </label>
        </div>

        {/* Selector de Tema de Texto */}
        <button 
          type="button"
          onClick={() => onChange('custom_text_theme', isDarkText ? 'light' : 'dark')}
          className="flex-1 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5"
        >
          <Palette size={14} /> Tema: {isDarkText ? 'Oscuro' : 'Claro'}
        </button>

        {/* Selector de Patrón */}
        <select 
          value={data.custom_pattern}
          onChange={(e) => onChange('custom_pattern', e.target.value as CustomPattern)}
          className="text-xs font-bold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer max-w-[100px]"
        >
          <option value="solid">Sólido</option>
          <option value="waves">Olas</option>
          <option value="geometric">Geometría</option>
          <option value="mesh">Malla</option>
          <option value="lines">Líneas</option>
          <option value="dots">Puntos</option>
        </select>
      </div>

    </div>
  );
}