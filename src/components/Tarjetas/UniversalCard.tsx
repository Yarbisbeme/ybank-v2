'use client'

import React from 'react';
import { CreditCard, Wallet, TrendingUp, Receipt, Coins } from 'lucide-react';

interface UniversalCardProps {
  account: any;
  institution: any;
}

// 💡 FUNCIÓN NUEVA: Calcula si el color de la tarjeta es oscuro o claro
const isColorDark = (color: string) => {
  if (!color) return true; // Asumimos oscuro por defecto
  
  const hex = color.replace('#', '');
  if (hex.length !== 6) return true; // Fallback si no es HEX válido

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Fórmula YIQ para calcular el brillo (Luminance)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  return yiq < 128; // Si es menor a 128, es un color oscuro
};

const BankLogo = ({ 
  logoUrl, 
  bankName, 
  isDarkText,
  cardColor // 💡 RECIBIMOS EL COLOR DE LA TARJETA
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
      <div className="flex items-center gap-[clamp(8px,2cqw,12px)] lg:gap-3 max-w-full">
        <div 
          className={`flex-shrink-0 flex items-center justify-center w-[clamp(32px,8cqw,36px)] h-[clamp(32px,8cqw,36px)] lg:w-10 lg:h-10 rounded-[clamp(8px,2cqw,12px)] lg:rounded-xl font-bold text-[clamp(14px,4cqw,16px)] lg:text-base backdrop-blur-sm border shadow-sm ${
            isDarkText 
              ? 'bg-slate-900/5 border-slate-900/10 text-slate-800' 
              : 'bg-white/10 border-white/20 text-white shadow-white/5'
          }`}
        >
          {initial}
        </div>
        <span 
          className={`text-[clamp(11px,2.5cqw,12px)] lg:text-xs font-bold uppercase tracking-[0.25em] leading-tight line-clamp-2 ${
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
    if (lowerName.includes('banreservas')) return 'scale-[1.8] @[300px]:scale-[2.2] lg:scale-[1.7] -ml-[clamp(16px,4cqw,24px)] lg:-ml-5';
    if (lowerName.includes('scotiabank')) return 'scale-[1.8] @[300px]:scale-[1.6] lg:scale-[1.3]';
    if (lowerName.includes('efectivo') || lowerName.includes('cartera')) return 'scale-[1.7] @[300px]:scale-[1.6] lg:scale-[1.5] -ml-1';
    return 'scale-100'; 
  };

  const needsMonochromeFilter = lowerName.includes('efectivo') || lowerName.includes('cartera');

  // 💡 LÓGICA INTELIGENTE:
  // Si la tarjeta es Oscura -> Logo Blanco
  // Si la tarjeta es Clara -> Logo Negro
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
  const finalColor = account?.color || institution?.brand_color_primary || '#1e293b';
  const finalPattern = account?.custom_pattern || institution?.card_pattern || 'solid';
  const finalTextTheme = account?.custom_text_theme || institution?.text_theme || 'light';

  const isDarkText = finalTextTheme === 'dark';
  const textColor = isDarkText ? 'text-slate-900' : 'text-white';
  const secondaryOpacity = isDarkText ? 'opacity-50' : 'opacity-80';

  const getAccountInfo = () => {
    const type = (account?.type || '').toLowerCase();
    if (type.includes('credit') || type.includes('crédito') || type.includes('credito')) 
      return { icon: CreditCard, label: 'Tarjeta de Crédito' };
    if (type.includes('saving') || type.includes('ahorro')) 
      return { icon: Wallet, label: 'Cuenta de Ahorros' };
    if (type.includes('investment') || type.includes('inversion') || type.includes('inversión')) 
      return { icon: TrendingUp, label: 'Inversión' };
    if (type.includes('cash') || type.includes('efectivo')) 
      return { icon: Coins, label: 'Efectivo' };
    return { icon: Receipt, label: 'Cuenta Corriente' };
  };

  const { icon: TypeIcon, label: typeLabel } = getAccountInfo();

  return (
    <div 
      className={`@container relative w-full h-full rounded-[clamp(20px,5cqw,28px)] lg:rounded-[28px] overflow-hidden shadow-xl transition-all duration-500 group ${textColor}`}
      style={{ backgroundColor: finalColor }}
    >
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
        {finalPattern === 'waves' && (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] rounded-full border border-white/10" />
            <div className="absolute top-[10%] left-[20%] w-[100%] h-[100%] rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-30" />
          </>
        )}
        
        {finalPattern === 'geometric' && (
          <>
            <div className="absolute top-[10%] left-[5%] w-[clamp(60px,20cqw,96px)] lg:w-24 lg:h-24 h-[clamp(60px,20cqw,96px)] bg-white/10 rounded-xl rotate-[15deg] blur-[1px]" />
            <div className="absolute bottom-[15%] right-[15%] w-[clamp(80px,25cqw,128px)] lg:w-32 lg:h-32 h-[clamp(80px,25cqw,128px)] border border-white/20 rounded-2xl rotate-[35deg]" />
            <div className="absolute top-[40%] right-[10%] w-[clamp(40px,12cqw,64px)] lg:w-16 lg:h-16 h-[clamp(40px,12cqw,64px)] border border-white/10 rounded-lg -rotate-12" />
          </>
        )}

        {finalPattern === 'mesh' && (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-white/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-black/10 rounded-full blur-3xl" />
            <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-white/10 rounded-full blur-2xl" />
          </>
        )}

        {finalPattern === 'lines' && (
          <div className="absolute inset-0 flex gap-[clamp(10px,3cqw,24px)] lg:gap-6 -skew-x-12 opacity-30 scale-150 -translate-x-10">
            <div className="w-[clamp(40px,10cqw,64px)] lg:w-16 h-full bg-white/10" />
            <div className="w-[clamp(20px,5cqw,32px)] lg:w-8 h-full bg-white/5" />
            <div className="w-[clamp(80px,20cqw,128px)] lg:w-32 h-full bg-white/10" />
            <div className="w-[clamp(10px,2cqw,16px)] lg:w-4 h-full bg-white/20" />
            <div className="w-[clamp(30px,8cqw,48px)] lg:w-12 h-full bg-white/5" />
          </div>
        )}

        {finalPattern === 'dots' && (
          <div 
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: isDarkText 
                ? 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.15) 1px, transparent 0)' 
                : 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '16px 16px'
            }}
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />
      </div>

      <div className="relative z-10 h-full p-[clamp(20px,5cqw,28px)] lg:p-7 flex flex-col justify-between">
        
        <div className="flex justify-between items-start relative z-50">
          <div className="w-[clamp(80px,25cqw,128px)] h-[clamp(32px,8cqw,48px)] lg:w-32 lg:h-12 flex items-center justify-start">
            <BankLogo 
              logoUrl={institution?.logo_url} 
              bankName={institution?.name || 'Bank'} 
              isDarkText={isDarkText}
              cardColor={finalColor} // 💡 LE PASAMOS EL COLOR A LA FUNCIÓN
            />
          </div>

          <div className="relative group/tooltip">
            <div className="p-[clamp(8px,2cqw,10px)] lg:p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 cursor-help hover:bg-white/20 transition-colors">
              <TypeIcon size={20} className={`${secondaryOpacity} w-[clamp(16px,4cqw,18px)] h-[clamp(16px,4cqw,18px)] lg:w-[22px] lg:h-[22px]`} strokeWidth={2.5} />
            </div>
            <div className="absolute top-full mt-2 right-0 bg-slate-900/95 backdrop-blur-xl text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap shadow-2xl">
              {typeLabel}
            </div>
          </div>
        </div>

        <div className="mt-auto mb-[clamp(16px,4cqw,24px)] lg:mb-6">
          <p className={`text-[clamp(10px,2cqw,12px)] lg:text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5 lg:mb-1.5 ${secondaryOpacity}`}>
            {account?.name || 'Balance Total'}
          </p>
          <div className="flex items-baseline gap-[clamp(6px,1cqw,8px)] lg:gap-2">
            <span className="text-[clamp(14px,3cqw,18px)] lg:text-base font-medium opacity-80">{account?.currency}</span>
            <p className="text-[clamp(28px,6cqw,36px)] lg:text-[40px] lg:leading-none font-bold tracking-tight truncate drop-shadow-sm">
              {account?.current_balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <p className={`text-[clamp(12px,2.5cqw,14px)] lg:text-[13px] font-mono tracking-[0.25em] ${secondaryOpacity}`}>
              •••• {account?.last_4_digits || '0000'}
            </p>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[clamp(24px,5cqw,30px)] lg:text-3xl font-black italic tracking-tighter leading-none opacity-90">VISA</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  );
};

export default UniversalCard;