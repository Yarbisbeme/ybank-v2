"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Bell, ChevronDown, CreditCard, Receipt, Tag as TagIcon, X, Command } from 'lucide-react';
import { Account, Transaction, Tag } from '@/types'; // Asumiendo que tienes estos tipos
import Link from 'next/link';

interface NavbarProps {
  user?: { name: string; role: string; avatarUrl?: string };
  accounts?: Account[];
  transactions?: Transaction[];
  tags?: Tag[];
}

export default function Navbar({ user, accounts = [], transactions = [], tags = [] }: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 💡 Atajo de teclado ⌘K o Ctrl+K
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

  // 🔍 Lógica de búsqueda filtrada
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

  const userName = user?.name || 'Cargando...';
  const initial = userName.charAt(0).toUpperCase();
  const currentDate = new Date().toLocaleDateString('es-DO', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  }).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-[100] h-20 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 md:px-8 lg:px-12 border-b border-slate-200/50 shadow-sm">
        <div className="hidden md:flex flex-col">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Bienvenido de vuelta, {userName.split(' ')[0]}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{currentDate}</p>
        </div>

        <div className="flex items-center gap-3 md:gap-6 flex-1 w-full md:w-auto md:justify-end">
          {/* TRIGGER DEL BUSCADOR */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="relative flex-1 sm:flex-none sm:w-full sm:max-w-[260px] flex items-center gap-3 bg-slate-100/70 border border-transparent rounded-xl py-2 px-4 text-slate-400 hover:bg-slate-200/50 transition-all text-left"
          >
            <Search size={16} />
            <span className="text-sm font-medium">Buscar algo...</span>
            <div className="ml-auto hidden sm:flex items-center gap-1 opacity-60">
               <kbd className="text-[10px] font-bold">⌘</kbd>
               <kbd className="text-[10px] font-bold">K</kbd>
            </div>
          </button>

          <button className="relative p-2 text-slate-400 hover:text-slate-700 transition-colors">
            <Bell size={20} strokeWidth={2.5} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 border-2 border-white rounded-full"></span>
          </button>

          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-200 overflow-hidden">
             {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs font-bold">{initial}</span>}
          </div>
        </div>
      </header>

      {/* 🖥️ MODAL DE BÚSQUEDA GLOBAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
          {/* Overlay */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsSearchOpen(false)} />
          
          {/* Search Card */}
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="text-blue-500" size={20} />
              <input 
                autoFocus
                type="text"
                placeholder="Escribe para buscar cuentas, transacciones o tags..."
                className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-800 placeholder:text-slate-400 pl-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 scrollbar-hide">
              {searchQuery.trim() === '' ? (
                <div className="py-12 text-center">
                  <Command size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 font-medium">Busca por nombre de banco, descripción o etiqueta</p>
                </div>
              ) : (
                <>
                  {/* SECCIÓN CUENTAS */}
                  {searchResults.accounts.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Cuentas</h3>
                      <div className="space-y-1">
                        {searchResults.accounts.map(acc => (
                          <Link 
                            key={acc.id} 
                            href={`/accounts?accountId=${acc.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-blue-50/50 cursor-pointer transition-colors group border border-transparent hover:border-blue-100"
                          >
                            <div key={acc.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><CreditCard size={18} /></div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">{acc.name}</p>
                                <p className="text-[10px] font-medium text-slate-400 uppercase">{acc.currency} • ****{acc.last_4_digits}</p>
                              </div>
                              <p className="text-sm font-black text-slate-700">${acc.current_balance.toLocaleString()}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN TRANSACCIONES */}
                  {searchResults.transactions.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Transacciones Recientes</h3>
                      <div className="space-y-1">
                        {searchResults.transactions.slice(0, 5).map(tx => (
                          <div key={tx.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors">
                            <div className="p-2 bg-slate-100 text-slate-500 rounded-xl"><Receipt size={18} /></div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-bold text-slate-800 truncate">{tx.description}</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                            <p className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-800'}`}>
                              {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN TAGS */}
                  {searchResults.tags.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Etiquetas</h3>
                      <div className="flex flex-wrap gap-2 px-2">
                        {searchResults.tags.map(tag => (
                          <button key={tag.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 rounded-full text-xs font-bold text-slate-600 transition-colors">
                            <TagIcon size={12} /> {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EMPTY STATE */}
                  {searchResults.accounts.length === 0 && searchResults.transactions.length === 0 && searchResults.tags.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-slate-400 font-medium">No encontramos nada relacionado con "{searchQuery}"</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Footer con Tips */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-4 justify-center">
               <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><kbd className="bg-white border px-1 rounded">ESC</kbd> para cerrar</span>
               <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><kbd className="bg-white border px-1 rounded">↵</kbd> para navegar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}