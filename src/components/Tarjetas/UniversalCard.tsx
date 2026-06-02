'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Search, CirclePile , X, Palette, Wallet, Star, LayoutTemplate, Waves, SquareDashedBottom, Grid3X3, AlignJustify, Grip } from 'lucide-react';
import { CustomPattern, Institution } from '@/types';
import { ACCOUNT_TYPES, cn } from '@/lib/utils';
import YbankColorPicker from '../ui/YbankColorPicker';
import { motion, AnimatePresence } from 'framer-motion';


// Definiciones y Helpers (Mantenemos tus configuraciones intactas)
const YBANK_PALETTE_ACCOUNT = [
  '#09090b', '#1e293b', '#172554', '#2563eb', '#059669', 
  '#e11d48', '#d97706', '#7c3aed', '#0891b2', '#4c1d95',
];

const ACCOUNT_TYPE_CONFIG: Record<string, { requiresInstitution: boolean; showCardDetails: boolean; isPassive: boolean; label: string }> = {
  'credit_card': { requiresInstitution: true, showCardDetails: true, isPassive: true, label: 'CRÉDITO' },
  'savings': { requiresInstitution: true, showCardDetails: true, isPassive: false, label: 'AHORRO' },
  'checking': { requiresInstitution: true, showCardDetails: true, isPassive: false, label: 'CORRIENTE' },
  'cash': { requiresInstitution: false, showCardDetails: false, isPassive: false, label: 'EFECTIVO' },
};

const formatNumberOnly = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

// 💡 CALCULADOR DE CONTRASTE (Traído de tu UniversalCard original)
const isColorDark = (color: string) => {
  if (!color) return true; 
  const hex = color.replace('#', '');
  if (hex.length !== 6) return true; 
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq < 128; 
};

interface UniversalCardProps {
  account: any; // o EditCreateAccount
  institution?: any;
  isEditable?: boolean; // Determina si muestra inputs o texto plano
  isFavorite?: boolean;
  onToggleFavorite?: (accountId: string, e: React.MouseEvent) => void;
  onChange?: (field: string | Record<string, any>, value?: any) => void;
  institutionsList?: Institution[]; 
}

const PATTERN_OPTIONS: { id: CustomPattern, label: string, icon: React.ElementType }[] = [
  { id: 'solid', label: 'Sólido', icon: LayoutTemplate },
  { id: 'waves', label: 'Olas', icon: Waves },
  { id: 'geometric', label: 'Geometría', icon: SquareDashedBottom },
  { id: 'mesh', label: 'Malla', icon: Grid3X3 },
  { id: 'lines', label: 'Líneas', icon: AlignJustify },
  { id: 'dots', label: 'Puntos', icon: Grip },
  { id: 'curve', label: 'Curve', icon: CirclePile },
];

export default function UniversalCard({ 
  account, 
  institution, 
  isEditable = false, 
  isFavorite = false,
  onToggleFavorite,
  onChange,
  institutionsList = []
}: UniversalCardProps) {

  // ==========================================
  // ESTADO Y LÓGICA (Solo se usan si isEditable es true)
  // ==========================================
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isBankMenuOpen, setIsBankMenuOpen] = useState(false);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false); 
  const [isPatternMenuOpen, setIsPatternMenuOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [balanceInput, setBalanceInput] = useState(() => {
    const val = Math.abs(Number(account?.current_balance || 0));
    return formatNumberOnly(val);
  });

  const config = ACCOUNT_TYPE_CONFIG[account?.type || 'savings'] || ACCOUNT_TYPE_CONFIG['savings'];

  useEffect(() => {
    if (!isEditable) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsBankMenuOpen(false);
        setIsTypeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditable]);

  useEffect(() => {
    if (isBankMenuOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setBankSearchQuery(''); 
    }
  }, [isBankMenuOpen]);

  const filteredInstitutions = useMemo(() => {
    if (!bankSearchQuery.trim()) return institutionsList;
    const lowerQuery = bankSearchQuery.toLowerCase();
    return institutionsList.filter(inst => inst.name.toLowerCase().includes(lowerQuery));
  }, [institutionsList, bankSearchQuery]);

  // Handlers de Edición
  const handleTypeChange = (newType: string) => {
    if (!onChange) return;
    const newConfig = ACCOUNT_TYPE_CONFIG[newType] || ACCOUNT_TYPE_CONFIG['savings'];
    onChange('type', newType);

    if (!newConfig.requiresInstitution) {
      onChange('institution_id', null);
      onChange('institution', undefined);
    }
    if (!newConfig.showCardDetails) {
      onChange('last_4_digits', null);
      onChange('expiry_date', null);
    }
    if (config.isPassive !== newConfig.isPassive) {
      onChange('current_balance', 0);
      onChange('initial_balance', 0);
      setBalanceInput(formatNumberOnly(0));
    }
    setIsTypeMenuOpen(false);
  };


  const handleBalanceChangeLocal = (rawValue: string) => {
    setBalanceInput(rawValue);
    if (!onChange) return;
    
    if (rawValue === '') {
      onChange({ current_balance: 0, initial_balance: 0 });
      return;
    }
    
    const num = Number(rawValue);
    if (!isNaN(num)) {
      const finalValue = config.isPassive ? -num : num;
      onChange({ current_balance: finalValue, initial_balance: finalValue });
    }
  };

  const handleExpiryChange = (value: string) => {
    if (!onChange) return;
    let v = value.replace(/\D/g, '');
    if (v.length > 4) v = v.slice(0, 4);
    if (v.length >= 2) {
      let month = parseInt(v.slice(0, 2));
      if (month > 12) month = 12;
      if (month < 1) month = 1;
      v = month.toString().padStart(2, '0') + v.slice(2);
    }
    if (v.length > 2) {
      v = `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    onChange('expiry_date', v);
  };

  // ==========================================
  // ESTILOS COMUNES Y RENDERIZADO VISUAL
  // ==========================================
  
  // El color y texto final dependen de si estamos editando o solo leyendo
  const activeInstitution = isEditable ? account?.institution : institution;
  const finalColor = account?.color || activeInstitution?.brand_color_primary || '#09090b';
  const finalPattern = account?.custom_pattern || activeInstitution?.card_pattern || 'geometric';
  const finalTextTheme = account?.custom_text_theme || activeInstitution?.text_theme || 'light';
  
  const isDarkText = finalTextTheme === 'dark';
  const textColor = isDarkText ? 'text-slate-900' : 'text-white';
  const secondaryOpacity = isDarkText ? 'text-slate-800/60' : 'text-white/70';
  const inputHoverClass = isDarkText ? 'hover:bg-black/5 focus:bg-white/20 focus:ring-slate-900/20' : 'hover:bg-white/10 focus:bg-black/20 focus:ring-white/30';
  
  const currentType = ACCOUNT_TYPES.find(t => t.id === account?.type) || ACCOUNT_TYPES[0];
  const currentPatternConfig = PATTERN_OPTIONS.find(p => p.id === finalPattern) || PATTERN_OPTIONS[2];
  const CurrentPatternIcon = currentPatternConfig.icon;
  const TypeIcon = currentType?.icon || Wallet;

  return (
    <div ref={isEditable ? containerRef : null} className={`w-full mx-auto space-y-4 relative ${isEditable ? 'max-w-5xl' : 'h-full group'}`}>
      
      {/* 💳 CONTENEDOR PRINCIPAL DE LA TARJETA */}
      <div 
        className={cn(
          "relative w-full rounded-[10px] shadow-2xl transition-all duration-500 flex flex-col border",
          isEditable ? `min-h-[220px] aspect-[1.586/1] ${isColorMenuOpen ? 'z-30' : 'z-50'}` : "h-full",
          isDarkText ? 'border-black/5' : 'border-white/10',
          textColor
        )}
        style={{ backgroundColor: finalColor }}
      >
        {/* ==================== FONDOS Y PATRONES ==================== */}
        <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden mix-blend-overlay opacity-80`}>
          
          {/* --- 🌊 WAVES --- */}
          {finalPattern === 'waves' && (
            <div className={`absolute inset-0 mix-blend-overlay opacity-100`}>
              <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] rounded-full border border-white/40" />
              <div className="absolute top-[10%] left-[20%] w-[100%] h-[100%] rounded-full bg-gradient-to-br from-white/60 to-transparent opacity-40" />
            </div>
          )}
          
          {/* --- 🧊 GEOMETRIC --- */}
          {finalPattern === 'geometric' && (
            <div className={`absolute inset-0 mix-blend-overlay opacity-80`}>
              <div className={`absolute w-24 h-24 rotate-[15deg] top-[10%] left-[5%] bg-white/20 rounded-xl blur-[1px]`} />
              <div className={`absolute w-32 h-32 border rotate-[35deg] bottom-[15%] right-[15%] border-white/40 rounded-2xl`} />
              {!isEditable && <div className="absolute top-[40%] right-[20%] w-12 h-12 border border-white/50 rounded-md -rotate-12" />}
            </div>
          )}
          
          {/* --- 🌌 MESH --- */}
          {finalPattern === 'mesh' && !isEditable && (
             <div className="absolute inset-0 mix-blend-overlay opacity-80">
               <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[80%] bg-white rounded-full blur-[60px]" />
               <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[80%] bg-white/60 rounded-full blur-[50px]" />
               <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] bg-black/20 rounded-full blur-[40px]" /> 
             </div>
          )}

          {/* --- 🏎️ LINES --- */}
          {finalPattern === 'lines' && (
            <div className={`absolute inset-0 flex gap-4 -skew-x-[25deg] scale-150 -translate-x-12 mix-blend-overlay opacity-30`}>
              <div className="w-12 h-full bg-gradient-to-b from-white to-transparent" />
              <div className="w-4 h-full bg-white/60" />
              <div className="w-24 h-full bg-gradient-to-t from-white to-white/10" />
              <div className="w-2 h-full bg-white/40" />
              <div className="w-16 h-full bg-gradient-to-b from-white/80 to-transparent" />
            </div>
          )}

          {/* --- 🔘 DOTS --- */}
          {finalPattern === 'dots' && (
            <div 
              className={`absolute inset-0 mix-blend-overlay opacity-20`}
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />
          )}

          {/* --- 🔘 curve --- */}
          {finalPattern === 'curve' &&(
            <div className={`absolute inset-0 mix-blend-overlay opacity-60`}>
              <div className="absolute -bottom-[60%] -right-[20%] w-[150%] h-[150%] rounded-full border-[2px] border-white" />
              <div className="absolute -bottom-[40%] -right-[10%] w-[120%] h-[120%] rounded-full border-[1px] border-white/50" />
              <div className="absolute -bottom-[20%] right-[0%] w-[90%] h-[90%] rounded-full border-[0.5px] border-white/30" />
            </div>
          )}
          
          {/* Viñeta sutil */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />
        </div>

        {/* ==================== CONTENIDO INTERNO ==================== */}
        <div className={`relative z-10 h-full flex flex-col justify-between flex-1 ${isEditable ? 'p-5 md:p-6' : 'p-5 lg:p-6'}`}>
          
          {/* HEADER: Institución y Tipo / Favorito */}
          <div className="flex justify-between items-start relative z-50">
            
            {/* IZQUIERDA: Lógica Banco Editable vs Estático */}
            {isEditable ? (
              config.requiresInstitution ? (
                // 💡 MODO EDICIÓN: Selector de Banco
                <div className="relative w-full max-w-[65%]">
                  <button 
                    type="button"
                    onClick={() => { setIsBankMenuOpen(!isBankMenuOpen); setIsTypeMenuOpen(false); setIsColorMenuOpen(false); }}
                    className={`flex items-center gap-2 rounded-2xl backdrop-blur-md border transition-all w-full text-left ${
                      activeInstitution?.logo_url ? 'p-1.5' : 'p-1.5 pr-3'
                    } ${isBankMenuOpen ? 'bg-white/30 border-white/40 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/20 hover:border-white/10'}`}
                  >
                    {activeInstitution?.logo_url ? (
                      <div className="flex items-center justify-between w-full px-2">
                        <img src={activeInstitution.logo_url} alt={activeInstitution.name} className="h-8 object-contain shrink-0" />
                        <ChevronDown size={14} className={`shrink-0 opacity-50 ml-2 transition-transform duration-300 ${isBankMenuOpen ? 'rotate-180' : ''}`} />
                      </div>
                    ) : (
                      <>
                        <div className={`w-8 h-8 rounded-xl flex shrink-0 items-center justify-center font-bold border ${isDarkText ? 'bg-slate-900/5 border-slate-900/10' : 'bg-white/20 border-white/30 shadow-sm'}`}>
                          {activeInstitution?.name ? activeInstitution.name.charAt(0).toUpperCase() : <Building2 size={16} />}
                        </div>
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] leading-tight line-clamp-1 flex-1">
                          {activeInstitution?.name || 'Buscar Banco'}
                        </span>
                        <ChevronDown size={14} className={`shrink-0 opacity-50 transition-transform duration-300 ${isBankMenuOpen ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                  {/* Dropdown de Bancos (Solo se abre en Edición) */}
                  {isBankMenuOpen && (
                     <div className="absolute top-full left-0 mt-2 w-[280px] bg-card backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden z-[70] animate-in fade-in flex flex-col max-h-[300px]">
                        {/* Buscador de bancos y lista */}
                        <div className="p-3 border-b border-border flex items-center gap-2 bg-surface-2/50">
                          <Search size={16} className="text-muted-foreground shrink-0" />
                          <input 
                            ref={searchInputRef} type="text" value={bankSearchQuery} onChange={(e) => setBankSearchQuery(e.target.value)}
                            placeholder="Buscar..." className="w-full bg-transparent text-sm font-bold text-foreground outline-none pl-2"
                          />
                        </div>
                        <div className="p-1.5 flex-1 overflow-y-auto scrollbar-hide">
                          {filteredInstitutions.map((inst) => (
                            <button key={inst.id} type="button" onClick={() => { onChange?.('institution_id', inst.id); onChange?.('institution', inst); setIsBankMenuOpen(false); }}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-bold w-full text-left ${activeInstitution?.id === inst.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'}`}
                            >
                               {inst.logo_url ? <img src={inst.logo_url} className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 rounded flex items-center justify-center text-white" style={{ background: inst.brand_color_primary || '#000' }}>{inst.name.charAt(0)}</div>}
                               <span>{inst.name}</span>
                            </button>
                          ))}
                        </div>
                     </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-2 px-4 backdrop-blur-md border border-white/10">
                   <span className="text-xs font-bold uppercase tracking-widest opacity-90">Billetera Física</span>
                </div>
              )
            ) : (
              // 💡 MODO ESTÁTICO: Renderizado simple de Logo
              <div className="h-8 lg:h-10 flex items-center justify-start pointer-events-none">
                {activeInstitution?.logo_url ? (
                  <img 
                    src={activeInstitution.logo_url} alt={activeInstitution.name} 
                    className={`max-w-full max-h-full object-contain object-left ${isColorDark(finalColor) && (activeInstitution.name.toLowerCase().includes('efectivo') || activeInstitution.name.toLowerCase().includes('cartera')) ? 'brightness-0 invert' : ''}`}
                  />
                ) : (
                   <div className="flex items-center gap-2">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${isDarkText ? 'bg-black/5 border-black/10' : 'bg-white/10 border-white/20'}`}>
                       {activeInstitution?.name ? activeInstitution.name.charAt(0) : 'B'}
                     </div>
                     <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{activeInstitution?.name || 'Nodo'}</span>
                   </div>
                )}
              </div>
            )}

            {/* DERECHA: Tipo (Edición) o Botón Favorito (Estático) */}
            {isEditable ? (
              <div className="relative">
                <button type="button" onClick={() => { setIsTypeMenuOpen(!isTypeMenuOpen); setIsBankMenuOpen(false); setIsColorMenuOpen(false); }}
                  className={`flex items-center gap-1.5 p-2 rounded-2xl backdrop-blur-md border transition-all ${isTypeMenuOpen ? 'bg-white/30 border-white/40 shadow-lg' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
                >
                  <TypeIcon size={18} strokeWidth={2.5} />
                  <ChevronDown size={14} className={`opacity-70 transition-transform ${isTypeMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTypeMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-card backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-1.5 z-[70] flex flex-col">
                    {ACCOUNT_TYPES.map(type => (
                      <button key={type.id} type="button" onClick={() => handleTypeChange(type.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-wider w-full text-left ${account?.type === type.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface-2'}`}>
                        <type.icon size={14} strokeWidth={account?.type === type.id ? 3 : 2} /> {ACCOUNT_TYPE_CONFIG[type.id]?.label || type.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
               <div className="relative group/tooltip">
                 <button onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(account?.id, e); }}
                   className={`p-2 rounded-[6px] border transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${isFavorite ? 'bg-amber-400 border-amber-400/50 text-slate-900' : isDarkText ? 'bg-black/5 border-black/10 hover:bg-black/10' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                 >
                   <Star size={16} className={isFavorite ? 'fill-current' : 'opacity-70 group-hover/tooltip:opacity-100'} strokeWidth={isFavorite ? 2 : 2.5} />
                 </button>
               </div>
            )}
          </div>

          {/* MIDDLE: Balance y Moneda */}
          <div className={`mt-auto ${isEditable ? 'mb-3' : 'mb-4 pointer-events-none'}`}>
             {isEditable ? (
               <>
                 <input 
                   type="text" value={account?.name || ''} onChange={(e) => onChange?.('name', e.target.value)} placeholder="Ej. Ahorros Viaje"
                   className={`text-[11px] bg-white/10 rounded-sm font-bold uppercase tracking-[0.2em] mb-1 bg-transparent border-none p-1 -ml-1 rounded outline-none ring-2 ring-transparent transition-all ${secondaryOpacity} ${inputHoverClass} w-full`}
                 />
                 <div className="flex items-baseline gap-1 relative z-10">
                   <select value={account?.currency} onChange={(e) => onChange?.('currency', e.target.value)}
                     className={`text-base bg-white/10 rounded-sm font-medium bg-transparent border-none outline-none appearance-none cursor-pointer rounded p-1 -ml-1 ring-2 ring-transparent transition-all ${inputHoverClass}`}
                   >
                     <option value="DOP" className="text-black">DOP</option>
                     <option value="USD" className="text-black">USD</option>
                   </select>
                   <input 
                     type="text" inputMode="decimal" value={balanceInput}
                     onFocus={() => { const val = Math.abs(Number(account?.current_balance || 0)); setBalanceInput(val === 0 ? '' : String(val)); }}
                     onBlur={() => { const val = Math.abs(Number(account?.current_balance || 0)); setBalanceInput(formatNumberOnly(val)); }}
                     onChange={(e) => {
                       let raw = e.target.value.replace(/[^0-9.]/g, '');
                       const parts = raw.split('.');
                       if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
                       handleBalanceChangeLocal(raw);
                     }}
                     placeholder="0.00"
                     className={`text-[40px] bg-white/10 leading-none font-bold tracking-tight bg-transparent border-none p-1 rounded outline-none ring-2 ring-transparent transition-all ${inputHoverClass} w-full max-w-[200px]`}
                   />
                 </div>
               </>
             ) : (
               <>
                 <p className={`text-label mb-1 ${secondaryOpacity}`}>{account?.name || 'Balance Operativo'}</p>
                 <div className="flex items-baseline gap-1.5">
                   <span className="text-mono font-medium opacity-80">{account?.currency}</span>
                   <p className="text-3xl lg:text-4xl text-mono font-bold tracking-tighter truncate drop-shadow-sm">
                     {account?.current_balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                   </p>
                 </div>
               </>
             )}
          </div>

          {/* FOOTER: Expiración y 4 Dígitos */}
          <div className={`flex justify-between items-end relative z-10 ${!isEditable ? 'pointer-events-none' : ''}`}>
             {config.showCardDetails ? (
               <div className="flex flex-col">
                 <span className={`text-[8px] font-bold uppercase tracking-[0.1em] ${secondaryOpacity}`}>NÚMERO</span>
                 {isEditable ? (
                   <input type="text" maxLength={4} placeholder="0000" value={account?.last_4_digits || ''} onChange={(e) => onChange?.('last_4_digits', e.target.value.replace(/\D/g, ''))} className={`text-[11px] pl-2 bg-white/10 font-mono bg-transparent border-none p-0 w-12 outline-none ${inputHoverClass}`} />
                 ) : (
                   <p className={`text-mono tracking-[0.25em] font-medium mt-1 ${secondaryOpacity}`}>•••• {account?.last_4_digits || '0000'}</p>
                 )}
               </div>
             ) : <div />}

             <div className="flex flex-col items-end">
                {isEditable ? (
                  <div className="flex flex-col items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${secondaryOpacity}`}>EXP</span>
                    <input type="text" placeholder="MM/YY" maxLength={5} value={account?.expiry_date || ''} onChange={(e) => handleExpiryChange(e.target.value)} className={`text-[11px] pl-2 font-mono bg-white/10 border-none p-0 w-12 outline-none ${inputHoverClass}`} />
                  </div>
                ) : (
                  <span className={`text-label ${secondaryOpacity}`}>
                    {account?.type === 'credit_card' ? 'CREDIT' : 'DEBIT'}
                  </span>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* =========================================
          🛠️ BARRA DE HERRAMIENTAS (SOLO EDICIÓN)
          ========================================= */}
      {isEditable && onChange && (
        <div className={`flex items-center justify-between bg-surface-2 border border-border p-2 rounded-[10px] shadow-sm relative backdrop-blur-md transition-all ${isColorMenuOpen || isPatternMenuOpen ? 'z-50' : 'z-40'}`}>
          
          {/* 1. SELECTOR DE COLOR */}
          <div className="relative border-r border-border/50 px-2 flex items-center">
            <button type="button" onClick={() => { setIsColorMenuOpen(true); setIsBankMenuOpen(false); setIsTypeMenuOpen(false); setIsPatternMenuOpen(false); }}
              className="w-8 h-8 rounded-full shadow-sm border-[3px] border-card cursor-pointer overflow-hidden transition-transform hover:scale-105 ring-1 ring-border" 
              style={{ backgroundColor: finalColor }} title="Personalizar color"
            />
            <YbankColorPicker isOpen={isColorMenuOpen} color={finalColor} onChange={(newColor) => onChange('color', newColor)} onClose={() => setIsColorMenuOpen(false)} />
          </div>

          {/* 2. SELECTOR DE TEMA */}
          <button type="button" onClick={() => { onChange('custom_text_theme', isDarkText ? 'light' : 'dark'); setIsPatternMenuOpen(false); }}
            className="flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 border-r border-border/50"
          >
            <Palette size={14} /> Tema: {isDarkText ? 'Oscuro' : 'Claro'}
          </button>

          {/* 3. 💡 NUEVO SELECTOR DE PATRÓN ESTILO YBANK */}
          <div className="relative px-2">
            <button 
              type="button" 
              onClick={() => { setIsPatternMenuOpen(!isPatternMenuOpen); setIsBankMenuOpen(false); setIsTypeMenuOpen(false); setIsColorMenuOpen(false); }}
              className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <CurrentPatternIcon size={14} />
              <span className="w-16 text-left truncate">{currentPatternConfig.label}</span>
              <ChevronDown size={12} className={`opacity-50 transition-transform ${isPatternMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menú Desplegable Animado */}
            <AnimatePresence>
              {isPatternMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute bottom-full right-0 mb-2 w-40 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[70] p-1.5 flex flex-col"
                >
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 py-1.5 mb-1 border-b border-border/50">
                    Estilo de Fondo
                  </p>
                  {PATTERN_OPTIONS.map(pattern => {
                    const isSelected = finalPattern === pattern.id;
                    const Icon = pattern.icon;
                    return (
                      <button 
                        key={pattern.id} 
                        type="button" 
                        onClick={() => { onChange('custom_pattern', pattern.id); setIsPatternMenuOpen(false); }} 
                        className={`flex items-center gap-3 px-2.5 py-2 rounded-[8px] text-[10px] font-bold uppercase tracking-wider w-full text-left transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                        }`}
                      >
                        <Icon size={14} strokeWidth={isSelected ? 2.5 : 2} /> 
                        {pattern.label}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}
    </div>
  );
}