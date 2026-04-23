"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Bell, ChevronDown, CreditCard, Receipt, Tag as TagIcon, X, Command } from 'lucide-react';
import { Account, Transaction, Tag, NavbarProps } from '@/types'; 
import Link from 'next/link';
import GlobalSearch from './Navbar/GlobalSearch';


export default function Navbar({ user, accounts = [], transactions = [], tags = [] }: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    accounts: false, transactions: false, tags: false
  });

  // Manejo de Shortcuts
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

  // Reset al cerrar
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery('');
      setExpandedSections({ accounts: false, transactions: false, tags: false });
    }
  }, [isSearchOpen]);

  // Lógica de filtrado
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
      <header className="sticky top-0 z-[100] h-20 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 md:px-8 lg:px-12 border-b border-slate-200/50 shadow-sm">
        <div className="hidden md:flex flex-col">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Bienvenido de nuevo {user?.name}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-6 flex-1 justify-end">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="relative flex items-center gap-3 bg-slate-100/70 border border-transparent rounded-xl py-2 px-4 text-slate-400 hover:bg-slate-200/50 transition-all w-full max-w-[260px]"
          >
            <Search size={16} />
            <span className="text-sm font-medium">Buscar...</span>
            <kbd className="ml-auto flex gap-1 opacity-60 text-[10px] font-bold">
               <span>⌘</span><span>K</span>
            </kbd>
          </button>
          
          {/* Resto de iconos y perfil... */}
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