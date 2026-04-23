"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Bell, ChevronDown, CreditCard, Receipt, Tag as TagIcon, X, Command, User as UserIcon } from 'lucide-react';
import { Account, Transaction, Tag, NavbarProps } from '@/types';
import Link from 'next/link';
import GlobalSearch from './GlobalSearch';

export default function Navbar({ user, accounts = [], transactions = [], tags = [] }: NavbarProps) {
  // ... (tus estados y hooks se quedan igual)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    accounts: false, transactions: false, tags: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery('');
      setExpandedSections({ accounts: false, transactions: false, tags: false });
    }
  }, [isSearchOpen]);

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
      <header className="sticky top-0 z-[100] h-16 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 md:px-8 lg:px-12 border-b border-slate-200/50 shadow-sm">

        {/* === SECCIÓN IZQUIERDA: PERFIL Y SALUDO === */}
        <div className="flex items-center gap-4">

          {/* Avatar con Fallback */}
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0 bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || "Perfil"}
                className="w-full h-full object-cover"
              />
            ) : (
              // Si no hay foto, mostramos la primera letra del nombre
              <span>{user?.name?.charAt(0).toUpperCase() || <UserIcon size={20} />}</span>
            )}
          </div>

          {/* Textos */}
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none md:leading-tight">
              {/* 💡 En móvil solo dice "Yarbis", en PC dice "Bienvenido, Yarbis" */}
              <span className="hidden md:inline">Bienvenido, </span>{user?.name?.split(' ')[0] || 'Usuario'}
            </h1>
            <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </p>
          </div>
        </div>

        {/* === SECCIÓN DERECHA: BUSCADOR Y ACCIONES === */}
        <div className="flex items-center gap-6 flex-1 justify-end">
          {/* 🖥️ BUSCADOR DESKTOP (Full) */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex relative items-center gap-3 bg-slate-100/70 border border-transparent rounded-xl py-2 px-4 text-slate-400 hover:bg-slate-200/50 transition-all w-full max-w-[260px]"
          >
            <Search size={16} />
            <span className="text-sm font-medium">Buscar...</span>
            <kbd className="ml-auto flex gap-1 opacity-60 text-[10px] font-bold">
                <span>⌘</span><span>K</span>
            </kbd>
          </button>

          {/* 📱 BUSCADOR MÓVIL (Solo Icono circular) */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex md:hidden items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95"
          >
            <Search size={18} />
          </button>
          
          {/* NOTIFICACIONES (Mantenemos la consistencia visual) */}
          <button className="flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors relative active:scale-95">
            <Bell size={20} />
            {/* Puntito rojo simulando notificación no leída */}
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

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