import React from 'react';
import { Account } from '@/types';
import { CreditCard, Wallet, Landmark, Receipt } from 'lucide-react';

interface LafiseCardProps {
  account: Account;
}

const LafiseCard: React.FC<LafiseCardProps> = ({ account }) => {
  const { current_balance, currency, last_4_digits, name, type } = account;

  // Lógica unificada para Icono y Etiqueta (Tooltip)
  const accountTypeStr = (type || '').toLowerCase();
  let typeLabel = 'Cuenta Corriente';
  let TypeIcon = Receipt;

  if (accountTypeStr.includes('credit') || accountTypeStr.includes('crédito') || accountTypeStr.includes('usd')) {
    typeLabel = 'Tarjeta de Crédito';
    TypeIcon = CreditCard;
  } else if (accountTypeStr.includes('saving') || accountTypeStr.includes('ahorro')) {
    typeLabel = 'Cuenta de Ahorros';
    TypeIcon = Wallet;
  } else if (accountTypeStr.includes('loan') || accountTypeStr.includes('préstamo')) {
    typeLabel = 'Préstamo Personal';
    TypeIcon = Landmark;
  }

  return (
    <div className="relative w-full h-full rounded-[24px] overflow-hidden shadow-2xl bg-[#002a54] font-sans">
      
      {/* FONDO: Ondas concéntricas */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] rounded-full border-[1px] border-white/10 opacity-30"></div>
        <div className="absolute top-[10%] left-[20%] w-[100%] h-[100%] rounded-full bg-gradient-to-br from-[#004b8d] to-transparent opacity-40"></div>
        <div className="absolute bottom-[-30%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[#00386b] opacity-60 shadow-2xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,102,204,0.3),transparent_70%)]"></div>
      </div>

      {/* CONTENIDO DE LA TARJETA */}
      <div className="relative z-10 h-full p-5 md:p-6 flex flex-col justify-between text-white">
        
        {/* SUPERIOR: Logo Izquierda, Icono Derecha */}
        {/* NOTA: Añadimos z-50 aquí para asegurar que el tooltip quede sobre otros textos */}
        <div className="flex justify-between items-start relative z-50">
          <div className="flex items-center">
            <img 
              src="https://cizbokgdcvvapncempdu.supabase.co/storage/v1/object/public/static/logos/lafise.png" 
              alt="Logo LAFISE" 
              className="w-20 md:w-24 h-auto object-contain brightness-0 invert opacity-90 pointer-events-none"
            />
          </div>

          {/* 🌟 MAGIA DEL TOOLTIP (Contenedor 'group') */}
          <div className="relative group flex flex-col items-end">
            {/* El botón/icono (ahora con cursor-help y efecto hover) */}
            <div className="flex items-center justify-center bg-white/5 backdrop-blur-md p-2 md:p-2.5 rounded-full border border-white/10 cursor-help transition-all duration-300 group-hover:bg-white/20 group-hover:border-white/30">
              <TypeIcon className="w-4 h-4 md:w-5 md:h-5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
            </div>
            
            {/* El Globo de Texto (Tooltip) */}
            <div className="absolute top-full mt-2 right-0 bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white text-[10px] md:text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xl opacity-0 invisible translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 whitespace-nowrap pointer-events-none">
              {typeLabel}
            </div>
          </div>
        </div>

        {/* MEDIA: Balance */}
        <div className="flex flex-col gap-2 md:gap-4 mt-auto mb-4 md:mb-6 pointer-events-none">
          <div className="flex justify-between gap-3 md:gap-5">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 font-medium mb-1 truncate">
                {name || 'Disponible'}
              </span>
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <span className="text-sm md:text-base font-medium opacity-80">{currency}</span>
                <p className="text-2xl md:text-4xl font-bold tracking-tight truncate">
                  {current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* INFERIOR: Números y Franquicia */}
        <div className="flex justify-between items-end pointer-events-none">
          <div className="flex flex-col">
            <p className="text-[11px] md:text-sm font-mono tracking-[0.15em] md:tracking-[0.25em] opacity-70">
              •••• •••• •••• {last_4_digits || '0000'}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-2xl md:text-3xl font-black italic tracking-tighter leading-none opacity-90">
              VISA
            </span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
    </div>
  );
};

export default LafiseCard;