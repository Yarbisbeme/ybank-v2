'use client'

import React from 'react';
import { CreditCard, Wallet, TrendingUp, Receipt, Coins } from 'lucide-react';

interface UniversalCardProps {
  account: any;
  institution: any;
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

const UniversalCard: React.FC<UniversalCardProps> = ({ account, institution }) => {
  const finalColor = account?.color || institution?.brand_color_primary || '#020617'; // slate-950 default
  const finalPattern = account?.custom_pattern || institution?.card_pattern || 'solid';
  const finalTextTheme = account?.custom_text_theme || institution?.text_theme || 'light';

  const isDarkText = finalTextTheme === 'dark';
  const textColor = isDarkText ? 'text-slate-900' : 'text-white';
  const secondaryOpacity = isDarkText ? 'opacity-60' : 'opacity-70';

  const getAccountInfo = () => {
    const type = (account?.type || '').toLowerCase();
    if (type.includes('credit') || type.includes('crédito') || type.includes('credito')) 
      return { icon: CreditCard, label: 'Crédito' };
    if (type.includes('saving') || type.includes('ahorro')) 
      return { icon: Wallet, label: 'Ahorro' };
    if (type.includes('investment') || type.includes('inversion')) 
      return { icon: TrendingUp, label: 'Inversión' };
    if (type.includes('cash') || type.includes('efectivo')) 
      return { icon: Coins, label: 'Efectivo' };
    return { icon: Receipt, label: 'Corriente' };
  };

  const { icon: TypeIcon, label: typeLabel } = getAccountInfo();

  return (
    <div 
      // 💡 YBANK Style: rounded-[16px] (Proporción tarjeta física real), borde sutil
      className={`relative w-full h-full rounded-[10px] overflow-hidden transition-all duration-500 group border ${isDarkText ? 'border-black/5' : 'border-white/10'} ${textColor}`}
      style={{ backgroundColor: finalColor }}
    >
      {/* 💡 YBANK Style: Redujimos la opacidad general de los patrones al 10% (Marca de agua) */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
        
        {/* --- 🌊 WAVES: Líneas más finas --- */}
        {finalPattern === 'waves' && (
          <>
            <div className="absolute -bottom-[40%] -right-[10%] w-[140%] h-[140%] rounded-full border-[8px] border-white/30" />
            <div className="absolute -bottom-[20%] -right-[0%] w-[100%] h-[100%] rounded-full border-[4px] border-white/40" />
          </>
        )}
        
        {/* --- 🧊 GEOMETRIC: Bordes más afilados --- */}
        {finalPattern === 'geometric' && (
          <>
            <div className="absolute top-[10%] left-[5%] w-24 h-24 bg-white/20 rounded-lg rotate-[15deg] backdrop-blur-sm border border-white/30" />
            <div className="absolute bottom-[10%] right-[10%] w-32 h-32 border-[2px] border-white/30 rounded-2xl rotate-[35deg]" />
            <div className="absolute top-[40%] right-[15%] w-16 h-16 border border-white/20 rounded-lg -rotate-12" />
          </>
        )}

        {/* --- 🌌 MESH --- */}
        {finalPattern === 'mesh' && (
          <>
            <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[80%] bg-white/40 rounded-full blur-[60px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[80%] bg-white/30 rounded-full blur-[50px]" />
          </>
        )}

        {/* --- 🏎️ LINES: Estilo código de barras / velocidad --- */}
        {finalPattern === 'lines' && (
          <div className="absolute inset-0 flex gap-8 -skew-x-[20deg] scale-150 -translate-x-12 opacity-80">
            <div className="w-16 h-full bg-gradient-to-b from-white/30 to-transparent" />
            <div className="w-8 h-full bg-gradient-to-b from-white/15 to-transparent" />
            <div className="w-32 h-full bg-gradient-to-b from-white/40 to-white/5" />
            <div className="w-4 h-full bg-gradient-to-b from-white/20 to-transparent" />
          </div>
        )}

        {/* --- 🔘 DOTS: Grid técnico --- */}
        {finalPattern === 'dots' && (
          <div 
            className="absolute inset-0 opacity-100"
            style={{
              backgroundImage: isDarkText 
                ? 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.4) 1px, transparent 0)' 
                : 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
              backgroundSize: '16px 16px'
            }}
          />
        )}
        
        {/* Viñeta sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
      </div>

      <div className="relative z-10 h-full p-5 lg:p-6 flex flex-col justify-between">
        
        {/* HEADER */}
        <div className="flex justify-between items-start relative z-50">
          <div className="h-8 lg:h-10 flex items-center justify-start">
            <BankLogo 
              logoUrl={institution?.logo_url} 
              bankName={institution?.name || 'Nodo Institucional'} 
              isDarkText={isDarkText}
              cardColor={finalColor} 
            />
          </div>

          <div className="relative group/tooltip">
            {/* 💡 YBANK Style: Icono en caja rígida (rounded-[6px]) */}
            <div className={`p-2 rounded-[6px] border transition-colors ${isDarkText ? 'bg-black/10 border-black/10' : 'bg-white/20 border-white/10'}`}>
              <TypeIcon size={16} className={secondaryOpacity} strokeWidth={2.5} />
            </div>
            <div className="absolute top-full mt-2 right-0 bg-slate-900 text-white text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-[4px] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap shadow-lg">
              {typeLabel}
            </div>
          </div>
        </div>

        {/* BALANCE */}
        <div className="mt-auto mb-4">
          <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${secondaryOpacity}`}>
            {account?.name || 'Balance Operativo'}
          </p>
          <div className="flex items-baseline gap-1.5">
            {/* 💡 YBANK Style: Tipografía Mono para divisas y números */}
            <span className="text-xs font-mono font-medium opacity-80">{account?.currency}</span>
            <p className="text-3xl lg:text-4xl font-mono font-bold tracking-tighter truncate drop-shadow-sm">
              {account?.current_balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <p className={`text-[11px] font-mono tracking-[0.25em] font-medium ${secondaryOpacity}`}>
              •••• {account?.last_4_digits || '0000'}
            </p>
          </div>
          <div className="flex flex-col items-end">
             {/* 💡 Texto más sobrio para la red (en vez de un VISA gigante en italic) */}
             <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
               {account?.type === 'credit_card' ? 'CREDIT' : 'DEBIT'}
             </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UniversalCard;