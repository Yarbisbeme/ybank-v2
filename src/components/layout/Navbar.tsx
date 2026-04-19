"use client";
import React, { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

// 💡 1. Definimos los props para recibir la data real de tu base de datos / sesión
interface UserProfile {
  name: string;
  role: string;
  avatarUrl?: string; // Aquí llegará la URL de Google
}

interface NavbarProps {
  user?: UserProfile;
}

export default function Navbar({ user }: NavbarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // 💡 2. Fallbacks de seguridad mientras carga la sesión
  const userName = user?.name || 'Cargando...';
  const userRole = user?.role || 'User';
  const initial = userName.charAt(0).toUpperCase();

  // 💡 3. Fecha estrictamente dinámica
  const currentDate = new Date().toLocaleDateString('es-DO', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  }).toUpperCase();

  return (
    <header className="sticky top-0 z-40 h-20 bg-[#FAFBFC] flex items-center justify-between px-8 md:px-12">
      
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
      <div className="flex items-center gap-4 md:gap-6 flex-1 justify-end">
        
        {/* BUSCADOR: Diseño más limpio, sin sombras exageradas */}
        <div className="relative hidden sm:block w-full max-w-[260px] transition-all duration-300">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar transacciones..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full bg-slate-200/50 border border-transparent rounded-xl py-2 pl-10 pr-10 text-sm font-medium focus:border-blue-500/30 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-700 placeholder:text-slate-400"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-white rounded border border-slate-200">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* NOTIFICACIONES: Más sutil */}
        <button className="relative p-2 text-slate-400 hover:text-slate-700 transition-colors">
          <Bell size={20} strokeWidth={2.5} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 border-2 border-[#FAFBFC] rounded-full z-10"></span>
        </button>

        {/* 🌟 PERFIL DINÁMICO Y ELEGANTE */}
        <button className="flex items-center gap-3 pl-4 md:pl-5 border-l border-slate-200 group text-left">
          
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={userName} 
                className="w-full h-full object-cover"
                // ⚠️ CRUCIAL: Sin esto, los navegadores bloquean las imágenes de Google por CORS (Error 403)
                referrerPolicy="no-referrer" 
              />
            ) : (
              <span className="text-sm font-bold text-slate-500">{initial}</span>
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