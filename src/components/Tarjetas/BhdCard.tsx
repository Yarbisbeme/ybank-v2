import React from 'react';
import { Account } from '@/types';

interface BancoBHDCardProps {
  account: Account;
}

const BancoBHDCardHorizontal: React.FC<BancoBHDCardProps> = ({ account }) => {
  const { current_balance, currency, last_4_digits, type } = account;

  return (
    /* Eliminamos el min-h-screen y centrado fijo para el grid */
    <div className="relative w-full max-w-[500px] h-[315px] rounded-[24px] overflow-hidden shadow-2xl bg-[#004a2d] text-white font-sans border border-white/10 group transition-transform hover:scale-105 duration-500">
      
      {/* Capa de textura de metal cepillado */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(90deg, transparent 45%, rgba(255,255,255,0.1) 50%, transparent 55%)', backgroundSize: '4px 100%' }}>
      </div>

      {/* Patrón Geométrico de Fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1a5d3d] to-[#00361f]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[100%] bg-[#125034] rotate-[15deg] transform-gpu opacity-60"></div>
        <div className="absolute top-[20%] left-[-10%] w-[120%] h-[80%] bg-[#0d4129] -rotate-[10deg] transform-gpu opacity-80 shadow-inner"></div>
      </div>

      {/* Contenido Principal */}
      <div className="relative z-10 flex flex-col justify-between h-full p-9">
        
        {/* Superior: Logo y Chip */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start leading-none">
            <h1 className="text-5xl font-bold tracking-tighter opacity-95">BHD</h1>
            <p className="text-[10px] font-semibold tracking-[0.2em] mt-1 opacity-70 uppercase">
              {type.replace('_', ' ')}
            </p>
          </div>

          {/* Chip EMV Simulado (Plateado para BHD) */}
          <div className="w-12 h-10 bg-gradient-to-br from-gray-300 via-gray-100 to-gray-400 rounded-md border border-white/20 shadow-inner">
             <div className="grid grid-cols-2 gap-1 p-1 h-full opacity-20">
                <div className="border-r border-b border-black"></div>
                <div className="border-b border-black"></div>
                <div className="border-r border-black"></div>
                <div></div>
             </div>
          </div>
        </div>

        {/* Centro: Balance Dinámico */}
        <div className="flex flex-col items-start">
          <p className="text-xs opacity-60 uppercase tracking-widest font-bold mb-1">Balance Actual</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-medium opacity-80">{currency}</span>
            <p className="text-4xl font-bold tracking-tight">
              {current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Inferior: Número y Contactless */}
        <div className="flex justify-between items-end">
          <p className="text-lg font-mono tracking-[0.3em] opacity-80">
            •••• •••• •••• {last_4_digits || '0000'}
          </p>
          
          <div className="opacity-60">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8a10 10 0 0 1 0 8" />
              <path d="M8 6a14 14 0 0 1 0 12" />
              <path d="M11 4a18 18 0 0 1 0 16" />
            </svg>
          </div>
        </div>
      </div>

      {/* Muesca Lateral (Touch Card Notch) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-20 w-4 bg-[#00000022] rounded-l-full flex items-center justify-center border-l border-white/10">
      </div>

      {/* Brillo Metálico Diagonal */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default BancoBHDCardHorizontal;