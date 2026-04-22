
import React from 'react';
import { Account } from '@/types';

interface ScotiaCardProps {
  account: Account;
}

const ScotiaCard: React.FC<ScotiaCardProps> = ({ account }) => {
  const { current_balance, currency, last_4_digits, name } = account;

  return (
    <div className="relative w-full max-w-[500px] h-[315px] rounded-[18px] overflow-hidden shadow-2xl bg-[#1a1a1a] transition-transform hover:scale-105 duration-500 font-sans group">
      
      {/* FONDO: Negro Mate con textura sutil */}
      <div className="absolute inset-0 z-0 bg-neutral-900">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* CONTENIDO DE LA TARJETA */}
      <div className="relative z-20 h-full p-8 flex flex-col justify-between text-white ">
        
        {/* Superior: Branding */}
        <div className="flex justify-between items-start">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-60 uppercase tracking-widest font-bold mb-1">{account.type}</p>
              <h3 className="text-lg font-bold">{account.name}</h3>
            </div>
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
          
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black italic tracking-tighter text-gray-200">
              VISA
            </span>
            <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-gray-400 mt-1">
              Infinite
            </span>
          </div>
        </div>
      </div>

      {/* Brillo de acabado de tarjeta de metal (Muy sutil) */}
      <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
    </div>
  );
};

export default ScotiaCard;