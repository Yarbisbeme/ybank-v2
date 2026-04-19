import React from 'react';
import { Account } from '@/types';

interface PopularCardProps {
  account: Account;
}

const PopularCard: React.FC<PopularCardProps> = ({ account }) => {
  const { current_balance, currency, last_4_digits, type, name } = account;

  return (
    <div className="relative w-full max-w-[500px] h-[315px] rounded-[22px] overflow-hidden shadow-2xl transition-all duration-500 border border-white/20 group font-sans">
      
      {/* FONDO: Gradiente de Marca Popular */}
      <div className="absolute inset-0 z-0 bg-[#0047cc]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 0% 0%, rgba(0, 150, 255, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(0, 50, 150, 0.8) 0%, transparent 50%),
            linear-gradient(135deg, #0056fb 0%, #003da6 100%)
          `
        }}>
      </div>

      {/* CUBOS GEOMÉTRICOS: Ajustados para mayor elegancia */}
      <div className="absolute inset-0 z-10 opacity-40">
        <div className="absolute top-[10%] left-[5%] w-24 h-24 bg-white/10 rounded-xl rotate-[15deg] blur-sm"></div>
        <div className="absolute top-[20%] left-[25%] w-12 h-12 bg-[#00cfff]/30 rounded-lg -rotate-[10deg]"></div>
        <div className="absolute bottom-[15%] right-[20%] w-32 h-32 bg-white/5 rounded-2xl rotate-[35deg]"></div>
        {/* Cubo con borde */}
        <div className="absolute top-[40%] right-[10%] w-16 h-16 border border-white/20 rounded-lg rotate-[25deg]"></div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="relative z-20 h-full p-8 flex flex-col justify-between text-white">
        
        {/* FILA SUPERIOR: Chip y Logo Real */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {/* Chip EMV Premium */}
            <div className="w-14 h-11 bg-gradient-to-br from-[#e2e2e2] via-[#fdfdfd] to-[#bebebe] rounded-lg border border-white/30 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-3 gap-0.5 p-1.5 opacity-20">
                <div className="border border-black/40 rounded-sm"></div>
                <div className="border border-black/40 rounded-sm"></div>
                <div className="border border-black/40 rounded-sm"></div>
                <div className="border border-black/40 rounded-sm"></div>
                <div className="border border-black/40 rounded-sm"></div>
                <div className="border border-black/40 rounded-sm"></div>
              </div>
            </div>
            {/* Contactless */}
            <svg className="w-7 h-7 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 8a10 10 0 0 1 0 8M8 6a14 14 0 0 1 0 12M11 4a18 18 0 0 1 0 16" />
            </svg>
          </div>

          {/* CONTENEDOR LOGO POPULAR */}
          <div className="flex flex-col items-end">
             <div className="w-[100px] h-auto p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl">
               <img 
                 src="https://cizbokgdcvvapncempdu.supabase.co/storage/v1/object/public/static/logos/IconPopular.png" 
                 alt="Banco Popular" 
                 className="w-full h-auto" // Forzamos el logo a ser blanco puro
               />
             </div>
             <span className="text-[9px] font-bold tracking-[0.3em] mt-2 opacity-60 uppercase">
                {name || 'Personal'}
             </span>
          </div>
        </div>

        {/* CENTRO: Balance Destacado */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 font-bold">Balance Disponible</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-light opacity-80">{currency}</span>
            <p className="text-4xl font-bold tracking-tight drop-shadow-md">
              {current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* INFERIOR: Visa y Números */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <p className="text-lg font-mono tracking-[0.25em] text-white/90 drop-shadow-sm">
              •••• •••• •••• {last_4_digits || '0000'}
            </p>
          </div>

          <div className="flex flex-col items-end text-right">
            <span className="text-4xl font-black tracking-tighter italic leading-none opacity-95">
              VISA
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-70 mt-1">
              {type === 'credit_card' ? 'Platinum' : 'Débito'}
            </span>
          </div>
        </div>
      </div>

      {/* EFECTO DE LUZ: Brillo metálico dinámico */}
      <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent group-hover:via-white/20 transition-all duration-700"></div>
      
      {/* Sombra interna para profundidad */}
      <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]"></div>
    </div>
  );
};

export default PopularCard;