import React from 'react';
import { Account } from '@/types';

interface BanreservasProps {
  account: Account;
}

const BanreservasCard: React.FC<BanreservasProps> = ({ account }) => {
  const { current_balance, currency, last_4_digits } = account;

  return (
    <div className="relative w-full max-w-[500px] h-[315px] rounded-[18px] overflow-hidden shadow-2xl bg-white font-sans transition-transform hover:scale-105 duration-500 border border-gray-200">
      
      {/* FONDO SVG - GEOMETRÍA DE FRANJAS */}
      <div className="absolute inset-0 z-0">
        <svg viewBox="0 0 500 315" preserveAspectRatio="none" className="w-full h-full">
          {/* 1. Franja Azul Profundo */}
          <path d="M0 0H200L350 315H0V0Z" fill="#00517D" />
          {/* 2. Franja Naranja Central */}
          <path d="M200 0H300L450 315H350L200 0Z" fill="#E28714" />
          {/* 3. Franja Celeste */}
          <path d="M0 150V315H150L0 150Z" fill="#00A1E1" />
        </svg>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="relative z-10 p-7 h-full flex flex-col justify-between">
        
        {/* FILA SUPERIOR: CHIP Y LOGO */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-center gap-3 mt-2 ml-2">
            {/* Chip EMV */}
            <div className="w-14 h-11 bg-gradient-to-br from-[#d4af37] via-[#f9eeba] to-[#b8860b] rounded-lg border border-black/10 shadow-sm relative">
              <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-1.5 opacity-30">
                <div className="border border-black/50 rounded-sm"></div>
                <div className="border border-black/50 rounded-sm"></div>
                <div className="border border-black/50 rounded-sm"></div>
                <div className="border border-black/50 rounded-sm"></div>
              </div>
            </div>
            {/* Icono Contactless */}
            <div className="text-white/80">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 8a10 10 0 0 1 0 8M8 6a14 14 0 0 1 0 12M11 4a18 18 0 0 1 0 16" />
              </svg>
            </div>
          </div>

          {/* Logo Banreservas */}
          <div className="flex flex-col items-end mt-2 pr-2"> 
            <img 
              src="https://cizbokgdcvvapncempdu.supabase.co/storage/v1/object/public/static/logos/IconBanreservas.png" 
              alt="Banreservas" 
              className="w-[90px] h-auto object-contain -my-4"
            />
            <span className="text-[#00517D] font-bold text-xs tracking-tighter mt-1">
                BANRESERVAS
            </span>
          </div>
        </div>

        {/* FILA CENTRAL: BALANCE Y DÍGITOS */}
        <div className="flex flex-col ml-2 mb-2">
          {/* Los primeros 3 bloques son blancos, el último es gris/naranja por contraste */}
          <div className="flex gap-4 text-white text-3xl font-bold tracking-widest leading-none drop-shadow-md">
            <span>****</span>
            <span>****</span>
            <span>****</span>
            <span className="text-[#00517D]/60">{last_4_digits || '0000'}</span>
          </div>
          
          <div className="flex items-center gap-6 mt-4">
            <span className="text-[10px] text-white/80 leading-tight font-bold">VÁLIDA<br/>HASTA</span>
            <span className="text-white text-2xl font-bold tracking-wider">04 / 28</span>
            <div className="ml-4 flex items-baseline gap-1">
              <span className="text-white/70 text-sm font-medium">{currency}</span>
              <span className="text-white text-2xl font-bold">
                {current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* FILA INFERIOR: MASTERCARD */}
        <div className="flex justify-between items-end pb-2">
          <span className="text-white/60 text-[10px] font-mono ml-2 uppercase tracking-widest">
            {account.type.replace('_', ' ')}
          </span>
          
          <div className="flex flex-col items-center mr-2">
            <div className="flex -space-x-3.5">
              <div className="w-9 h-9 bg-[#eb001b] rounded-full opacity-95"></div>
              <div className="w-9 h-9 bg-[#f79e1b] rounded-full opacity-95"></div>
            </div>
            <span className="text-[9px] font-medium text-gray-500 tracking-tighter mt-1">mastercard</span>
          </div>
        </div>
      </div>

      {/* Efecto de Brillo */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
    </div>
  );
};

export default BanreservasCard;