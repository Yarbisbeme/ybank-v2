"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Server, 
  Settings, 
  LogOut,
  Loader2 // 💡 1. Importamos el spinner
} from 'lucide-react';
import { ButtonOla } from '../ui/ButtonOla';
import { useModalStore } from '@/store/useModalStore'; 
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from '@/lib/actions/auth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Consola', href: '/dashboard' },
  { icon: Server, label: 'Nodos', href: '/accounts' },
  { icon: Settings, label: 'Preferencias', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const openModal = useModalStore(state => state.openModal); 
  const queryClient = useQueryClient();

  // 💡 2. Estado para saber qué ruta está cargando en este milisegundo
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  // 💡 3. Cuando el 'pathname' cambia, significa que Next.js terminó de cargar la página.
  // En ese momento, apagamos cualquier spinner activo.
  useEffect(() => {
    setLoadingPath(null);
  }, [pathname]);

  const handleSecureLogout = async () => {
    queryClient.clear(); 
    await signOut(); 
  };

  return (
    <div className="flex flex-col h-full px-6 py-2 pb- bg-card border-r border-border transition-colors">
      
      <div className="flex flex-row items-center my-2 pr-2"> 
        <img 
          src="/icons/logoY.svg" 
          alt="YBank" 
          className="w-[30px] h-auto object-contain" 
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
          const isLoading = loadingPath === item.href; // Verificamos si este botón en específico está cargando

          return (
            <Link
              key={item.href}
              href={item.href}
              // 💡 4. Interceptamos el clic para activar la animación de inmediato
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault(); // Evita recargar si ya estamos en esa página
                } else {
                  setLoadingPath(item.href); // Enciende el spinner para esta ruta
                }
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all font-bold text-sm ${
                isActive 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-2 border border-transparent'
              } ${isLoading ? 'opacity-70 pointer-events-none' : ''}`} // Protege contra doble clic
            >
              {/* 💡 5. Renderizamos el Spinner o el Ícono normal dependiendo del estado */}
              {isLoading ? (
                <Loader2 size={18} strokeWidth={2.5} className="animate-spin text-primary" />
              ) : (
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mb-4">
        <ButtonOla 
          onClick={() => openModal('transaction')} 
          label="Nueva Operación"
        />
      </div>

      <div className="py-4 border-t border-border">
        <button 
          onClick={handleSecureLogout} 
          className="flex items-center gap-3 px-4 py-3 w-full rounded-[10px] text-muted-foreground font-bold text-sm hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} strokeWidth={2} />
          Cerrar Sesión
        </button>
      </div>
      
    </div>
  );
}