import React from 'react';
import { Account } from '@/types';

interface ScotiaCardProps {
  account: Account;
}

const ScotiaCard: React.FC<ScotiaCardProps> = ({ account }) => {
  const { current_balance, currency, last_4_digits, name } = account;

  return (
    <div className="relative w-full max-w-[500px] h-[315px] rounded-[18px] overflow-hidden shadow-2xl bg-[#1a1a1a] font-sans group">
      
      {/* FONDO: Negro Mate con textura sutil */}
      <div className="absolute inset-0 z-0 bg-[#d11c3a]">
        {/* Degradado para dar profundidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#b3112c] via-[#d11c3a] to-[#8a0e22]"></div>
        {/* Textura sutil superpuesta */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')]"></div>
      </div>

      {/* LA CURVA PLATEADA (Característica de Scotia Wealth) */}
      <svg className="absolute inset-0 w-full h-full z-10 opacity-40" viewBox="0 0 500 315">
        <path 
          d="M120 0 C 130 100, 150 200, 250 315" 
          stroke="white" 
          strokeWidth="2" 
          fill="none" 
          className="drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]"
        />
      </svg>

      {/* CONTENIDO DE LA TARJETA */}
      <div className="relative z-20 h-full p-8 flex flex-col justify-between text-white ">
        
        {/* Superior: Branding */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <img 
              src="https://cizbokgdcvvapncempdu.supabase.co/storage/v1/object/public/static/logos/Scotiabank.png" 
              alt="Banreservas" 
              className="w-[260px] h-auto object-contain -mb-2"
              style={{
                filter: 'brightness(0) invert(1)'
              }}
            />
          </div>
          
          {/* Icono Contactless Plata */}
          <div className="text-gray-400 mt-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 8a10 10 0 0 1 0 8M8 6a14 14 0 0 1 0 12M11 4a18 18 0 0 1 0 16" />
            </svg>
          </div>
        </div>

        {/* Media: Chip e Información de Balance */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6">
            {/* Chip EMV Plateado Cepillado */}
            <div className="w-14 h-11 bg-gradient-to-br from-gray-300 via-gray-100 to-gray-400 rounded-lg border border-white/10 shadow-lg relative overflow-hidden">
               <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-1.5 opacity-20">
                  <div className="border-r border-b border-black"></div>
                  <div className="border-b border-black"></div>
                  <div className="border-r border-black"></div>
                  <div></div>
               </div>
            </div>

            {/* Datos de la cuenta (Personalizado para Dashboard) */}
            <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                 {name}
               </span>
               <div className="flex items-baseline gap-2">
                 <span className="text-sm font-medium text-gray-400">{currency}</span>
                 <p className="text-3xl font-bold tracking-tighter">
                   {current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                 </p>
               </div>
            </div>
          </div>
        </div>

        {/* Inferior: Visa Infinite */}
        <div className="flex justify-between items-end">
          <p className="text-sm font-mono tracking-[0.3em] text-gray-400">
            •••• •••• •••• {last_4_digits || '0000'}
          </p>
          
          <div className="flex justify-between items-end pb-2">
          
          <div className="flex flex-col items-center mr-2">
            <div className="flex -space-x-3.5">
              <div className="w-9 h-9 bg-[#eb001b] rounded-full opacity-95"></div>
              <div className="w-9 h-9 bg-[#f79e1b] rounded-full opacity-95"></div>
            </div>
            <span className="text-[9px] font-medium text-gray-500 tracking-tighter mt-1">mastercard</span>
          </div>
        </div>
        </div>
      </div>

      {/* Brillo de acabado de tarjeta de metal (Muy sutil) */}
      <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
    </div>
  );
};

export default ScotiaCard;