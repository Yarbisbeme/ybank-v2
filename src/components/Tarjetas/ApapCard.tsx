// src/components/Tarjetas/ApapCard.tsx
import React from 'react';
import { Account } from '@/types'; // Importamos tu tipo de cuenta real

interface ApapCardProps {
  account: Account;
}

const ApapCard: React.FC<ApapCardProps> = ({ account }) => {
  // Desestructuramos las propiedades reales de la cuenta
  const { name, current_balance, currency, last_4_digits, type } = account;

  return (
    /* W-full y max-w-[500px] para que encaje perfectamente en el grid de tu dashboard */
    <div className="relative w-full max-w-[500px] h-[315px] rounded-[22px] overflow-hidden shadow-2xl bg-[#ceab4d] border border-black/5 transition-transform hover:scale-105 duration-500 font-sans group">
      
      {/* FONDO GEOMÉTRICO (Círculo y rombo sutiles - Símbolo de APAP) */}
      <div className="absolute right-[-40px] top-[-20px] w-[380px] h-[380px] pointer-events-none flex items-center justify-center">
        <div className="w-full h-full rounded-full border-[10px] border-black/5 flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.05)]">
          {/* Rombo interior rotado 45° */}
          <div className="w-[65%] h-[65%] border-[10px] border-black/5 rotate-45 shadow-[inset_0_0_30px_rgba(0,0,0,0.03)]"></div>
        </div>
      </div>

      {/* CONTENIDO DE LA TARJETA (Z-Index alto) */}
      <div className="relative z-10 p-9 h-full flex flex-col justify-between text-white">
        
        {/* SUPERIOR: Logo y Nombre de Cuenta */}
        <div className="flex items-start gap-4">
          {/* Isotipo desde Supabase con fondo sutil */}
          <div className="bg-white/10 p-1 rounded-sm shadow-sm backdrop-blur-sm">
            <img 
              src="https://cizbokgdcvvapncempdu.supabase.co/storage/v1/object/public/static/logos/IconApap.png" 
              alt="Logo APAP" 
              className="w-[65px] h-auto object-contain"
            />
          </div>
          
          <div className="flex flex-col mt-1">
            <h2 className="text-2xl font-black tracking-tight leading-none uppercase drop-shadow-sm">
              {/* Mostramos el nombre dinámico de la cuenta */}
              {name.includes('APAP') ? name.replace('APAP', '').trim() || 'Asociación Popular' : name}
            </h2>
            <p className="text-[10px] font-bold tracking-[0.05em] leading-none mt-1 uppercase opacity-90">
              Asociación Popular de Ahorros y Préstamos
            </p>
          </div>
        </div>

        {/* MEDIA: Chip, Contactless y Balance */}
        <div className="flex flex-col gap-4">

          {/* Balance Actual Dinámico */}
          <div className="flex flex-col items-start ml-2 mb-2">
             <span className="text-xs opacity-60 uppercase tracking-widest font-bold mb-1">Balance Actual</span>
             <div className="flex items-baseline gap-2.5">
               <span className="text-lg font-medium opacity-80">{currency}</span>
               <p className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                 {current_balance.toLocaleString('en-US', { 
                   minimumFractionDigits: 2, 
                   maximumFractionDigits: 2 
                 })}
               </p>
             </div>
          </div>
        </div>

        {/* INFERIOR: Visa, Números y Tipo */}
        <div className="flex justify-between items-end relative">
          <div className="flex flex-col ml-2">
            {/* Números Troquelados Sutiles (blancos con tracking amplio) */}
            <p className="text-sm font-mono tracking-[0.25em] text-white/90 mb-2 drop-shadow-sm">
              •••• •••• •••• {last_4_digits || '0000'}
            </p>
            <div className="flex items-center gap-3 opacity-70">
              <span className="text-[7px] text-white font-bold leading-[1.1] uppercase">Good<br/>Thru</span>
              <span className="text-sm text-white font-bold">12/28</span>
            </div>
          </div>

          {/* Logo VISA - Muy grande y blanco sólido */}
          <div className="flex flex-col items-end pr-2">
            <span className="text-white text-6xl font-black italic tracking-tighter leading-none drop-shadow-sm">
              VISA
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 mt-1">
              {/* Dinámico: Crédito/Débito */}
              {type === 'credit_card' ? 'Crédito' : 'Débito'}
            </span>
          </div>
        </div>

      </div>

      {/* Acabado Mate sutil (Sombra interna) */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.08)] bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
    </div>
  );
};

export default ApapCard;