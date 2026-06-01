'use client'

import React from 'react';
import { Star } from 'lucide-react'; // 💡 Cambiamos los iconos por Star

interface UniversalCardProps {
  account: any;
  institution: any;
  isFavorite?: boolean;
  onToggleFavorite?: (accountId: string, e: React.MouseEvent) => void;
}

// Calcula si el color de la tarjeta es oscuro o claro
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

const BankLogo = ({ 
  logoUrl, 
  bankName, 
  isDarkText,
  cardColor 
}: { 
  logoUrl: string, 
  bankName: string, 
  isDarkText: boolean,
  cardColor: string 
}) => {
  const [imgError, setImgError] = React.useState(false);

  if (!logoUrl || imgError) {
    const initial = bankName ? bankName.charAt(0).toUpperCase() : 'B';

    return (
      <div className="flex items-center gap-2 max-w-full">
        <div 
          className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-[28px] font-mono font-bold text-xs border ${
            isDarkText 
              ? 'bg-black/5 border-black/10 text-slate-800' 
              : 'bg-white/10 border-white/20 text-white'
          }`}
        >
          {initial}
        </div>
        <span 
          className={`text-[9px] font-bold uppercase tracking-[0.2em] leading-tight line-clamp-2 ${
            isDarkText ? 'text-slate-800' : 'text-white/90'
          }`}
        >
          {bankName}
        </span>
      </div>
    );
  }

  const lowerName = bankName?.toLowerCase() || '';

  const getLogoScale = () => {
    if (lowerName.includes('banreservas')) return 'scale-[2] -ml-4';
    if (lowerName.includes('efectivo') || lowerName.includes('cartera')) return 'scale-[1.8] -ml-1';
    return 'scale-100'; 
  };

  const needsMonochromeFilter = lowerName.includes('efectivo') || lowerName.includes('cartera');
  const isDarkCard = isColorDark(cardColor);
  const themeFilter = needsMonochromeFilter 
    ? (isDarkCard ? 'brightness-0 invert opacity-100' : 'brightness-0 opacity-80')
    : ''; 

  return (
    <img 
      src={logoUrl} 
      alt={bankName} 
      onError={() => setImgError(true)}
      className={`max-w-full max-h-full object-contain object-left transition-all duration-300 origin-left ${getLogoScale()} ${themeFilter}`}
    />
  );
};

const UniversalCard: React.FC<UniversalCardProps> = ({ 
  account, 
  institution, 
  isFavorite = false, // 💡 Lo recibimos como prop (por defecto false)
  onToggleFavorite 
}) => {
  const finalColor = account?.color || institution?.brand_color_primary || '#020617'; 
  const finalPattern = account?.custom_pattern || institution?.card_pattern || 'solid';
  const finalTextTheme = account?.custom_text_theme || institution?.text_theme || 'light';

  const isDarkText = finalTextTheme === 'dark';
  const textColor = isDarkText ? 'text-slate-900' : 'text-white';
  const secondaryOpacity = isDarkText ? 'opacity-60' : 'opacity-70';

  return (
    <div 
      className={`relative w-full h-full rounded-[10px] overflow-hidden transition-all duration-500 group border ${isDarkText ? 'border-black/5' : 'border-white/10'} ${textColor}`}
      style={{ backgroundColor: finalColor }}
    >
      <div className="absolute inset-0 z-0 mix-blend-overlay opacity-80 pointer-events-none overflow-hidden">
        
        {/* --- 🌊 WAVES --- */}
        {finalPattern === 'waves' && (
          <div className="absolute inset-0 mix-blend-overlay opacity-30">
            <div className="absolute -bottom-[60%] -right-[20%] w-[150%] h-[150%] rounded-full border-[2px] border-white" />
            <div className="absolute -bottom-[40%] -right-[10%] w-[120%] h-[120%] rounded-full border-[1px] border-white/50" />
            <div className="absolute -bottom-[20%] right-[0%] w-[90%] h-[90%] rounded-full border-[0.5px] border-white/30" />
          </div>
        )}
        
        {/* --- 🧊 GEOMETRIC --- */}
        {finalPattern === 'geometric' && (
          <div className="absolute inset-0 mix-blend-overlay opacity-25">
            <div className="absolute top-[15%] left-[5%] w-24 h-24 bg-white/20 rounded-lg rotate-[15deg] backdrop-blur-sm" />
            <div className="absolute bottom-[10%] right-[10%] w-32 h-32 border-[1.5px] border-white rounded-2xl rotate-[35deg]" />
            <div className="absolute top-[40%] right-[20%] w-12 h-12 border border-white/50 rounded-md -rotate-12" />
          </div>
        )}

        {/* --- 🌌 MESH --- */}
        {finalPattern === 'mesh' && (
          <div className="absolute inset-0 mix-blend-overlay opacity-40">
            <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[80%] bg-white rounded-full blur-[60px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[80%] bg-white/60 rounded-full blur-[50px]" />
            <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] bg-black/20 rounded-full blur-[40px]" /> 
          </div>
        )}

        {/* --- 🏎️ LINES --- */}
        {finalPattern === 'lines' && (
          <div className="absolute inset-0 flex gap-4 -skew-x-[25deg] scale-150 -translate-x-12 mix-blend-overlay opacity-20">
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
            className="absolute inset-0 mix-blend-overlay opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '12px 12px'
            }}
          />
        )}
        
        {/* Viñeta sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
      </div>

      <div className="relative z-10 h-full p-5 lg:p-6 flex flex-col justify-between">
        
        {/* HEADER */}
        <div className="flex justify-between items-start relative z-50">
          <div className="h-8 lg:h-10 flex items-center justify-start pointer-events-none">
            <BankLogo 
              logoUrl={institution?.logo_url} 
              bankName={institution?.name || 'Nodo Institucional'} 
              isDarkText={isDarkText}
              cardColor={finalColor} 
            />
          </div>

          <div className="relative group/tooltip">
            {/* 💡 YBANK Style: Botón interactivo de Favorito */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Evita que el click se propague si la tarjeta entera es un link/botón
                if (onToggleFavorite) onToggleFavorite(account?.id, e);
              }}
              className={`p-2 rounded-[6px] border transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center ${
                isFavorite 
                  ? 'bg-amber-400 border-amber-400/50 shadow-sm text-slate-900' 
                  : isDarkText 
                    ? 'bg-black/5 border-black/10 hover:bg-black/10 text-slate-800' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
              }`}
            >
              <Star 
                size={16} 
                className={`transition-all duration-300 ${isFavorite ? 'fill-current' : 'opacity-70 group-hover/tooltip:opacity-100'}`} 
                strokeWidth={isFavorite ? 2 : 2.5} 
              />
            </button>
            <div className="absolute top-full mt-2 right-0 bg-slate-900 text-white text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-[4px] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap shadow-lg z-50">
              {isFavorite ? 'Cuenta Favorita' : 'Marcar como favorita'}
            </div>
          </div>
        </div>

        {/* BALANCE */}
        <div className="mt-auto mb-4 pointer-events-none">
          <p className={`text-label mb-1 ${secondaryOpacity}`}>
            {account?.name || 'Balance Operativo'}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-mono font-medium opacity-80">{account?.currency}</span>
            <p className="text-3xl lg:text-4xl text-mono font-bold tracking-tighter truncate drop-shadow-sm">
              {account?.current_balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-end pointer-events-none">
          <div className="flex flex-col">
            <p className={`text-mono tracking-[0.25em] font-medium ${secondaryOpacity}`}>
              •••• {account?.last_4_digits || '0000'}
            </p>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-label opacity-60">
               {account?.type === 'credit_card' ? 'CREDIT' : 'DEBIT'}
             </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UniversalCard;