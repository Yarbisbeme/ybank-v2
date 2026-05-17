"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Bell, Menu, X, 
  LayoutDashboard, Server, Settings, LogOut, Plus, PlusCircle,
  Loader2
} from 'lucide-react';
import { NavbarProps } from '@/types';
import { useModalStore } from '@/store/useModalStore'; 
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlobalSearch from './GlobalSearch';
import { signOut } from '@/lib/actions/auth'; 
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';

export default function Navbar({ user, accounts = [], transactions = [], tags = [], categories = [] }: NavbarProps) {
  
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [avatarError, setAvatarError] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const openModal = useModalStore(state => state.openModal);
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    accounts: false, transactions: false, tags: false, categories: false
  });

  const [loadingPath, setLoadingPath] = useState<string | null>(null);

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

  useEffect(() => {
    setLoadingPath(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileMenuOpen]);

  const closeMenu = () => setIsMobileMenuOpen(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { accounts: [], transactions: [], tags: [], categories: [] };
    
    // 💡 1. Normalizamos el texto del usuario: pasamos a minúsculas y ELIMINAMOS TILDES
    const query = searchQuery
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Función auxiliar para limpiar tildes de los textos de la BD
    const cleanText = (text: string) => 
      text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 💡 2. Aplanamos el árbol de categorías para que busque tanto en padres como en subcategorías
    const allFlatCategories = categories.flatMap(cat => {
      // Retornamos la categoría padre junto con todas sus subcategorías (si existen)
      return [cat, ...(cat.subcategories || [])];
    });

    // 💡 3. Eliminamos duplicados por ID (por si acaso una subcategoría vino duplicada)
    const uniqueCategories = allFlatCategories.filter(
      (cat, index, self) => self.findIndex(c => c.id === cat.id) === index
    );

    return {
      accounts: accounts.filter(acc => cleanText(acc.name).includes(query)),
      
      transactions: transactions.filter(tx =>
        cleanText(tx.description || '').includes(query) ||
        (tx.category?.name && cleanText(tx.category.name).includes(query))
      ),
      
      tags: tags.filter(tag => cleanText(tag.name).includes(query)),
      
      categories: uniqueCategories.filter(cat => cleanText(cat.name).includes(query))
    };
  }, [searchQuery, accounts, transactions, tags, categories]);
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSecureLogout = async () => {
    closeMenu(); 
    queryClient.clear()
    await signOut(); 
  };

  const handleNavigationClick = (e: React.MouseEvent, targetPath: string) => {
    if (pathname === targetPath) {
      e.preventDefault();
      closeMenu();
    } else {
      setLoadingPath(targetPath);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-[60] h-16 bg-card/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 lg:px-12 border-b border-border transition-colors">

        {/* ... (Todo el header principal se queda exactamente igual) ... */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-foreground hover:bg-surface-2 rounded-[6px] transition-colors"
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>
          
          <div className="md:hidden flex flex-row items-center cursor-pointer"> 
            <Image 
              src="/icons/logoY.svg" alt="YBank" width={24} height={24} priority
              className="w-[26px] h-auto object-contain dark:invert"
            />
            <span className="text-foreground font-bold text-[24px] tracking-tighter">Bank</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] overflow-hidden border border-border bg-surface-2 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {user?.avatarUrl && !avatarError ? (
                <img src={user.avatarUrl} alt="Perfil" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
              ) : (
                <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-xs font-bold text-foreground tracking-tight leading-none">{user?.name || 'Operador'}</h1>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: '2-digit', month: 'short' }).replace(',', '')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <button onClick={() => setIsSearchOpen(true)} className="hidden md:flex relative items-center gap-2 bg-surface-2 border border-border rounded-[8px] py-1.5 px-3 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all w-full max-w-[220px]">
            <Search size={14} />
            <span className="text-xs font-medium">Búsqueda Global...</span>
            <kbd className="ml-auto flex gap-1 items-center bg-card border border-border px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold font-mono">
              <span>⌘</span><span>K</span>
            </kbd>
          </button>

          <button onClick={() => setIsSearchOpen(true)} className="flex md:hidden items-center justify-center w-8 h-8 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">
            <Search size={18} strokeWidth={2.5} />
          </button>
          
          <button 
            onClick={() => openModal('account')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-foreground text-background rounded-[8px] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} /> Nuevo Nodo
          </button>

          <button className="flex items-center justify-center w-8 h-8 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors relative">
            <Bell size={18} strokeWidth={2.5} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-card"></span>
          </button>
        </div>
      </header>

      {/* BACKDROP DEL MENÚ MÓVIL */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm md:hidden transition-opacity" 
          onClick={closeMenu} 
        />
      )}

      {/* MENÚ MÓVIL */}
      <div className={`fixed top-0 left-0 z-[210] h-[100dvh] w-[85%] max-w-[320px] bg-card border-r border-border transform transition-transform duration-300 ease-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex flex-row items-center cursor-pointer" onClick={closeMenu}> 
            <Image src="/icons/logoY.svg" alt="YBank" width={24} height={24} priority className="w-[26px] h-auto object-contain dark:invert" />
            <span className="text-foreground font-bold text-[24px] tracking-tighter">Bank</span>
          </div>
          <button onClick={closeMenu} className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-[6px] transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 px-4">
            Módulos Core
          </p>
          <SidebarLink 
            href="/dashboard" label="Consola" icon={LayoutDashboard} 
            isActive={pathname === '/dashboard'} 
            isLoading={loadingPath === '/dashboard'}
            onClick={(e) => handleNavigationClick(e, '/dashboard')} 
          />
          <SidebarLink 
            href="/accounts" label="Nodos" icon={Server} 
            isActive={pathname === '/accounts'} 
            isLoading={loadingPath === '/accounts'}
            onClick={(e) => handleNavigationClick(e, '/accounts')} 
          />
          <SidebarLink 
            href="/settings" label="Preferencias" icon={Settings} 
            isActive={pathname === '/settings'} 
            isLoading={loadingPath === '/settings'}
            onClick={(e) => handleNavigationClick(e, '/settings')} 
          />
        </nav>

        <div className="p-5 border-t border-border flex flex-col gap-4 shrink-0 bg-card pb-safe">
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => { closeMenu(); openModal('transaction'); }} 
              className="flex items-center justify-center gap-2 bg-foreground text-background font-bold rounded-[10px] transition-transform active:scale-95 text-xs py-2.5 shadow-sm"
            >
              <PlusCircle size={14} /> Operación
            </button>
            
            <button 
              onClick={() => { closeMenu(); openModal('account'); }} 
              className="flex items-center justify-center gap-2 bg-surface-2 border border-border text-foreground font-bold rounded-[10px] hover:border-primary/50 transition-all active:scale-95 text-xs py-2.5"
            >
              <Plus size={14} /> Nodo
            </button>
          </div>
          
          <div className="flex flex-row items-center justify-between bg-surface-2 p-3 rounded-[10px] border border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-[8px] overflow-hidden border border-border bg-card flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {user?.avatarUrl && !avatarError ? (
                  <img src={user.avatarUrl} alt="Perfil" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase() || 'O'}</span>
                )}
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <h2 className="text-xs font-bold text-foreground truncate leading-tight">{user?.name || 'Operador'}</h2>
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground truncate leading-tight mt-0.5">{user?.email || 'SYSTEM_ADMIN'}</p>
              </div>
            </div>

            <button 
              onClick={handleSecureLogout} 
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[6px] transition-colors shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut size={16} strokeWidth={2.5} />
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

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isLoading: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function SidebarLink({ href, label, icon: Icon, isActive, isLoading, onClick }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all duration-200 font-bold text-sm
        ${isActive 
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
          : 'text-muted-foreground hover:text-foreground hover:bg-surface-2 border border-transparent'} 
        ${isLoading ? 'opacity-70 pointer-events-none' : ''}
      `}
    >
      {isLoading ? (
        <Loader2 size={18} strokeWidth={2.5} className="animate-spin text-primary" />
      ) : (
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      )}
      <span>{label}</span>
    </Link>
  );
}