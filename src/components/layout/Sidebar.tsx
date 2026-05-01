"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Server, 
  Settings, 
  LogOut,
} from 'lucide-react';
import { ButtonOla } from '../ui/ButtonOla';
import { useModalStore } from '@/store/useModalStore'; 

const menuItems = [
  { icon: LayoutDashboard, label: 'Consola', href: '/dashboard' },
  { icon: Server, label: 'Nodos', href: '/accounts' },
  { icon: Settings, label: 'Preferencias', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const openModal = useModalStore(state => state.openModal); 

  return (
    <div className="flex flex-col h-full p-6 bg-card border-r border-border transition-colors">
      
      <div className="flex flex-row items-center my-2 pr-2"> 
        <img 
          src="/icons/logoY.svg" 
          alt="YBank" 
          className="w-[30px] h-auto object-contain dark:invert" 
        />
        <span className="text-foreground font-bold text-[30px] tracking-tighter">
            Bank
        </span>
      </div>

      <nav className="flex-1 space-y-2 mt-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 px-4">
          Módulos Core
        </p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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

      <div className="mb-6">
        <ButtonOla 
          onClick={() => openModal('transaction')} 
          label="Nueva Operación"
        />
      </div>

      <div className="pt-6 border-t border-border">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-[10px] text-muted-foreground font-bold text-sm hover:text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut size={18} strokeWidth={2} />
          Cerrar Sesión
        </button>
      </div>
      
    </div>
  );
}