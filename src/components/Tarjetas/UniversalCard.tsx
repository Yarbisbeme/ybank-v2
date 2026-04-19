'use client'

import React from 'react';
import { CreditCard, Wallet, Landmark, Receipt } from 'lucide-react';

interface UniversalCardProps {
  account: any;
  institution: any;
}

const BankLogo = ({ 
  logoUrl, 
  bankName, 
  isDarkText 
}: { 
  logoUrl: string, 
  bankName: string, 
  isDarkText: boolean 
}) => {
  const [imgError, setImgError] = React.useState(false);

  if (!logoUrl || imgError) {
    const initial = bankName ? bankName.charAt(0).toUpperCase() : 'B';

    return (
      // 💡 Añadimos lg:gap-3 para desktop
      <div className="flex items-center gap-[clamp(6px,2cqw,12px)] lg:gap-3 max-w-full">
        <div 
          // 💡 Tamaños fijos grandes para desktop: lg:w-10 lg:h-10 lg:text-base lg:rounded-xl
          className={`flex-shrink-0 flex items-center justify-center w-[clamp(24px,8cqw,36px)] h-[clamp(24px,8cqw,36px)] lg:w-10 lg:h-10 rounded-[clamp(6px,2cqw,12px)] lg:rounded-xl font-bold text-[clamp(12px,4cqw,16px)] lg:text-base backdrop-blur-sm border shadow-sm ${
            isDarkText 
              ? 'bg-slate-900/5 border-slate-900/10 text-slate-800' 
              : 'bg-white/10 border-white/20 text-white shadow-white/5'
          }`}
        >
          {initial}
        </div>
        
        <span 
          // 💡 Tamaño fijo de texto para desktop: lg:text-xs
          className={`text-[clamp(9px,2.5cqw,12px)] lg:text-xs font-bold uppercase tracking-[0.25em] leading-tight line-clamp-2 ${
            isDarkText ? 'text-slate-800' : 'text-white/90'
          }`}
        >
          {bankName}
        </span>
      </div>
    );
  }

  const getLogoScale = () => {
    const name = bankName?.toLowerCase() || '';
    // 💡 Ajustamos la escala específica en Desktop (lg:) para que no desborde
    if (name.includes('banreservas')) return 'scale-[1.8] @[300px]:scale-[2.2] lg:scale-[1.7] -ml-[clamp(12px,4cqw,24px)] lg:-ml-5';
    if (name.includes('scotiabank')) return 'scale-[1.8] @[300px]:scale-[1.6] lg:scale-[1.3]';
    return 'scale-100'; 
  };

  return (
    <img 
      src={logoUrl} 
      alt={bankName} 
      onError={() => setImgError(true)}
      className={`max-w-full max-h-full object-contain object-left transition-all duration-300 origin-left ${getLogoScale()}`}
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
    if (type.includes('credit')) return { icon: CreditCard, label: 'Tarjeta de Crédito' };
    if (type.includes('saving')) return { icon: Wallet, label: 'Cuenta de Ahorros' };
    if (type.includes('loan')) return { icon: Landmark, label: 'Préstamo' };
    return { icon: Receipt, label: 'Cuenta Corriente' };
  };

  const { icon: TypeIcon, label: typeLabel } = getAccountInfo();

  return (
    <div 
      // 💡 Aseguramos el radio de borde en desktop lg:rounded-[28px]
      className={`@container relative w-full h-full rounded-[clamp(16px,5cqw,28px)] lg:rounded-[28px] overflow-hidden shadow-xl transition-all duration-500 group ${textColor}`}
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

      {/* 💡 PADDING DE DESKTOP: Fijado en lg:p-7 para garantizar márgenes amplios */}
      <div className="relative z-10 h-full p-[clamp(16px,5cqw,28px)] lg:p-7 flex flex-col justify-between">
        
        <div className="flex justify-between items-start relative z-50">
          {/* 💡 ESPACIO PARA LOGO: Fijado en desktop a un tamaño estándar */}
          <div className="w-[clamp(60px,25cqw,128px)] h-[clamp(24px,8cqw,48px)] lg:w-32 lg:h-12 flex items-center justify-start">
            <BankLogo 
              logoUrl={institution?.logo_url} 
              bankName={institution?.name || 'Bank'} 
              isDarkText={isDarkText}
            />
          </div>

          <div className="relative group/tooltip">
            <div className="p-[clamp(6px,2cqw,10px)] lg:p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 cursor-help hover:bg-white/20 transition-colors">
              <TypeIcon size={20} className={`${secondaryOpacity} w-[clamp(14px,4cqw,18px)] h-[clamp(14px,4cqw,18px)] lg:w-[22px] lg:h-[22px]`} strokeWidth={2.5} />
            </div>
            <div className="absolute top-full mt-2 right-0 bg-slate-900/95 backdrop-blur-xl text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap shadow-2xl">
              {typeLabel}
            </div>
          </div>
        </div>

        {/* 💡 CONTENEDOR BALANCE: Margen inferior fijo lg:mb-6 */}
        <div className="mt-auto mb-[clamp(12px,4cqw,24px)] lg:mb-6">
          <p className={`text-[clamp(8px,2cqw,12px)] lg:text-[11px] font-bold uppercase tracking-[0.2em] mb-1 lg:mb-1.5 ${secondaryOpacity}`}>
            {account?.name || 'Balance Total'}
          </p>
          <div className="flex items-baseline gap-[clamp(4px,1cqw,8px)] lg:gap-2">
            <span className="text-[clamp(12px,3cqw,18px)] lg:text-base font-medium opacity-80">{account?.currency}</span>
            {/* 💡 BALANCE: Tamaño super imponente en desktop (lg:text-[40px]) */}
            <p className="text-[clamp(20px,6cqw,36px)] lg:text-[40px] lg:leading-none font-bold tracking-tight truncate drop-shadow-sm">
              {account?.current_balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            {/* 💡 TARJETA NUM: Tamaño definido en desktop (lg:text-[13px]) */}
            <p className={`text-[clamp(10px,2.5cqw,14px)] lg:text-[13px] font-mono tracking-[0.25em] ${secondaryOpacity}`}>
              •••• {account?.last_4_digits || '0000'}
            </p>
          </div>
          <div className="flex flex-col items-end">
             {/* 💡 VISA: Tamaño definido en desktop (lg:text-3xl) */}
             <span className="text-[clamp(18px,5cqw,30px)] lg:text-3xl font-black italic tracking-tighter leading-none opacity-90">VISA</span>
             {account?.type === 'credit' && (
               <span className="text-[clamp(7px,1.5cqw,10px)] lg:text-[10px] font-bold uppercase tracking-widest opacity-60 mt-0.5 lg:mt-1">Platinum</span>
             )}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  );
};

export default UniversalCard;