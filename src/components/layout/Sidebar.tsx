"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Server, // 💡 Cambio visual: Representa mejor el concepto de "Nodos"
  Settings, 
  LogOut,
} from 'lucide-react';
import { ButtonOla } from '../ui/ButtonOla';

const menuItems = [
  { icon: LayoutDashboard, label: 'Consola', href: '/dashboard' },
  { icon: Server, label: 'Nodos', href: '/accounts' },
  { icon: Settings, label: 'Preferencias', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    // 💡 YBANK Style: bg-card y border-border para que fluya con el Dark Mode
    <div className="flex flex-col h-full p-6 bg-card border-r border-border transition-colors">
      
      {/* BRANDING */}
      <div className="flex flex-row items-center my-2 pr-2"> 
        <img 
          src="/icons/logoY.svg" 
          alt="YBank" 
          // 💡 Si tu logo tiene versión blanca para dark mode, ideal manejarlo aquí o vía CSS filter
          className="w-[30px] h-auto object-contain dark:invert" 
        />
        <span className="text-foreground font-bold text-[30px] tracking-tighter">
            Bank
        </span>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-2 mt-10">
        {/* 💡 Etiqueta técnica forense para agrupar módulos */}
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 px-4">
          Módulos Core
        </p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              // 💡 YBANK Style: rounded-[10px] y variables de color dinámicas
              className={`flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all font-bold text-sm ${
                isActive 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-2 border border-transparent'
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      {/* NUEVA TRANSACCIÓN */}
      {/* Mantenemos tu componente ButtonOla, pero ajustamos el label a la jerga */}
      <div className="mb-6">
        <ButtonOla 
          href={`${pathname}?newTx=true`} 
          label="Nueva Operación"
        />
      </div>

      {/* BOTTOM NAV */}
      <div className="pt-6 border-t border-border">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-[10px] text-muted-foreground font-bold text-sm hover:text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut size={18} strokeWidth={2} />
          Cerrar Sesión
        </button>
      </div>
      
    </div>
  );
}