"use client";
import React, { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

interface UserProfile {
  name: string;
  role: string;
  avatarUrl?: string;
}

interface NavbarProps {
  user?: UserProfile;
}

export default function Navbar({ user }: NavbarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const userName = user?.name || 'Cargando...';
  const userRole = user?.role || 'User';
  const initial = userName.charAt(0).toUpperCase();

  const currentDate = new Date().toLocaleDateString('es-DO', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  }).toUpperCase();

  return (
    // 💡 EFECTO CRISTAL AQUÍ: bg-white/80, backdrop-blur-md, y un borde semitransparente
    <header className="sticky top-0 z-[100] h-20 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 md:px-8 lg:px-12 border-b border-slate-200/50 shadow-sm shadow-slate-100/50">
      
      {/* SALUDO DINÁMICO */}
      <div className="hidden md:flex flex-col">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Bienvenido de vuelta, {userName.split(' ')[0]}
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
          {currentDate}
        </p>
      </div>

      {/* SEARCH & PROFILE */}
      <div className="flex items-center gap-3 md:gap-6 flex-1 w-full md:w-auto md:justify-end">
        
        {/* BUSCADOR RESPONSIVO */}
        <div className="relative flex-1 sm:flex-none sm:w-full sm:max-w-[260px] transition-all duration-300">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            // 💡 Hacemos que el fondo del input también sea ligeramente translúcido
            className="w-full bg-slate-100/70 border border-transparent rounded-xl py-2 pl-9 pr-3 sm:pl-10 sm:pr-10 text-[13px] sm:text-sm font-medium focus:border-blue-500/30 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-700 placeholder:text-slate-400"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center">
            <kbd className="items-center justify-center px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-white rounded border border-slate-200 shadow-sm">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* NOTIFICACIONES */}
        <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 rounded-full transition-colors shrink-0">
          <Bell size={20} strokeWidth={2.5} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 border-2 border-white rounded-full z-10"></span>
        </button>

        {/* PERFIL */}
        <button className="flex items-center gap-2 md:gap-3 pl-3 md:pl-5 border-l border-slate-200/50 group text-left shrink-0 hover:bg-slate-50/50 p-2 -my-2 rounded-xl transition-colors">
          
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 shadow-sm">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={userName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer" 
              />
            ) : (
              <span className="text-xs md:text-sm font-bold text-slate-500">{initial}</span>
            )}
          </div>
          
          <div className="hidden md:block">
            <p className="text-[13px] font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
              {userName}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {userRole}
            </p>
          </div>
          
          <ChevronDown size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors hidden sm:block ml-1" />
        </button>
      </div>
    </header>
  );
}