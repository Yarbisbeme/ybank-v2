"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Bell, User as UserIcon, Menu, X, 
  LayoutDashboard, WalletCards, Settings, LogOut, Plus, PlusCircle
} from 'lucide-react';
import { NavbarProps } from '@/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlobalSearch from './GlobalSearch';
import { signOut } from '@/lib/actions/auth'; 
import Image from 'next/image';

export default function Navbar({ user, accounts = [], transactions = [], tags = [] }: NavbarProps) {
  
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [avatarError, setAvatarError] = useState(false); // 💡 Estado para el fallback de la imagen
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    accounts: false, transactions: false, tags: false
  });

  // Atajos de teclado para el buscador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Bloquear scroll al abrir el menú móvil
  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileMenuOpen]);

  const closeMenu = () => setIsMobileMenuOpen(false);

  // Lógica del buscador global
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { accounts: [], transactions: [], tags: [] };
    const query = searchQuery.toLowerCase();
    return {
      accounts: accounts.filter(acc => acc.name.toLowerCase().includes(query)),
      transactions: transactions.filter(tx =>
        tx.description.toLowerCase().includes(query) ||
        tx.category?.name.toLowerCase().includes(query)
      ),
      tags: tags.filter(tag => tag.name.toLowerCase().includes(query))
    };
  }, [searchQuery, accounts, transactions, tags]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      {/* 💡 CABECERA SUPERIOR */}
      {/* Borde suavizado a border-slate-100 */}
      <header className="sticky top-0 z-[60] h-16 bg-white/95 backdrop-blur-md flex items-center justify-between px-4 md:px-8 lg:px-12 border-b border-slate-100">

        <div className="flex items-center gap-3">
          
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="md:hidden flex flex-row items-center cursor-pointer"> 
            <Image 
              src="/icons/logoY.svg" 
              alt="YBank" 
              width={28}
              height={28}
              priority
              className="w-[28px] h-auto object-contain"
            />
            <span className="text-black font-bold text-[22px] tracking-tight ml-1.5 mt-0.5">
                Bank
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {/* 💡 Avatar Inteligente Desktop */}
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
              {user?.avatarUrl && !avatarError ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Perfil" 
                  className="w-full h-full object-cover" 
                  onError={() => setAvatarError(true)} 
                />
              ) : (
                <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
                {user?.name || 'Usuario'}
              </h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          
          <button onClick={() => setIsSearchOpen(true)} className="hidden md:flex relative items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 text-slate-500 hover:bg-slate-100 transition-all w-full max-w-[240px]">
            <Search size={16} />
            <span className="text-sm">Buscar...</span>
            <kbd className="ml-auto flex gap-1 opacity-70 text-[10px] font-medium font-mono"><span>⌘</span><span>K</span></kbd>
          </button>

          <button onClick={() => setIsSearchOpen(true)} className="flex md:hidden items-center justify-center w-9 h-9 rounded-md text-slate-700 hover:bg-slate-100 transition-colors">
            <Search size={18} />
          </button>
          
          <Link 
            href="/accounts?newAccount=true" 
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} /> Crear Cuenta
          </Link>

          <button className="flex items-center justify-center w-9 h-9 rounded-md text-slate-700 hover:bg-slate-100 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* 📱 MENÚ LATERAL MÓVIL */}
      {isMobileMenuOpen && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 z-[200] bg-slate-900/20 backdrop-blur-sm md:hidden transition-opacity" 
          onClick={closeMenu} 
        />
      )}

      {/* 💡 FIX 1: Usamos h-[100dvh] para anclarlo EXACTAMENTE al alto de la pantalla del celular */}
      <div className={`fixed top-0 left-0 z-[210] h-[100dvh] w-[85%] max-w-[320px] bg-white border-r border-slate-200 transform transition-transform duration-300 ease-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* 📦 BLOQUE 1: HEADER (Fijo arriba) - shrink-0 evita que se aplaste */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div className="flex flex-row items-center cursor-pointer" onClick={closeMenu}> 
            <Image 
              src="/icons/logoY.svg" 
              alt="YBank" 
              width={28}
              height={28}
              priority
              className="w-[28px] h-auto object-contain"
            />
            <span className="text-black font-bold text-[22px] tracking-tight ml-1.5 mt-0.5">
                Bank
            </span>
          </div>
          <button onClick={closeMenu} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 📦 BLOQUE 2: NAVEGACIÓN (Ocupa el centro, es el ÚNICO que hace scroll) */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <SidebarLink 
            href="/dashboard" 
            label="Inicio" 
            icon={LayoutDashboard} 
            isActive={pathname === '/dashboard'} 
            onClick={closeMenu} 
          />
          <SidebarLink 
            href="/accounts" 
            label="Mis Cuentas" 
            icon={WalletCards} 
            isActive={pathname === '/accounts'} 
            onClick={closeMenu} 
          />
          <SidebarLink 
            href="/settings" 
            label="Configuración" 
            icon={Settings} 
            isActive={pathname === '/settings'} 
            onClick={closeMenu} 
          />
        </nav>

        {/* 📦 BLOQUE 3: FOOTER Y PERFIL (Fijo abajo, siempre visible) */}
        <div className="p-5 border-t border-slate-100 flex flex-col gap-4 shrink-0 bg-white pb-safe">
          
          <div className="grid grid-cols-2 gap-3" onClick={closeMenu}>
            <Link 
              href={`${pathname}?newTx=true`} 
              className="flex items-center justify-center gap-2 bg-black text-white font-medium rounded-lg transition-transform active:scale-95 text-sm py-2.5 shadow-sm"
            >
              <PlusCircle size={16} /> Gasto
            </Link>
            <Link 
              href="/accounts?newAccount=true" 
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-50 transition-all active:scale-95 text-sm py-2.5 shadow-sm"
            >
              <Plus size={16} /> Cuenta
            </Link>
          </div>
          
          <div className="flex flex-row items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                {user?.avatarUrl && !avatarError ? (
                  <img 
                    src={user.avatarUrl} 
                    alt="Perfil" 
                    className="w-full h-full object-cover" 
                    onError={() => setAvatarError(true)} 
                  />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <h2 className="text-sm font-semibold text-slate-900 truncate leading-tight">{user?.name || 'Usuario'}</h2>
                <p className="text-[10px] text-slate-500 truncate leading-tight">{user?.email || 'Mi Perfil'}</p>
              </div>
            </div>

            <button 
              onClick={() => { closeMenu(); signOut(); }} 
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>

        </div>

      </div>

      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        query={searchQuery}
        setQuery={setSearchQuery}
        results={searchResults}
        expanded={expandedSections}
        onToggleSection={toggleSection}
      />
    </>
  );
}

/* =========================================================
   🧩 COMPONENTE DE NAVEGACIÓN: Minimalista y Corporativo
   ========================================================= */

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}

function SidebarLink({ href, label, icon: Icon, isActive, onClick }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-slate-100/70 text-slate-900 font-semibold shadow-sm border border-slate-200/50' 
          : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-800'} 
      `}
    >
      <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
      <span className={isActive ? 'text-slate-900' : 'text-slate-500'} >{label}</span>
    </Link>
  );
}