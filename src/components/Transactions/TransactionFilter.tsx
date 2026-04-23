"use client";

import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { TransactionFilters as FilterType } from '@/types/database.types';

// Asumimos que tienes estos tipos definidos en tu proyecto
interface Category { id: string; name: string; }
interface Tag { id: string; name: string; }
interface Account { id: string; name: string; }

interface TransactionFiltersProps {
  currentFilters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  categories: Category[]; 
  tags: Tag[];
  accounts: Account[];
}

export default function TransactionFilters({ 
  currentFilters, 
  onFilterChange,
  categories,
  tags,
  accounts
}: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterType, value: any) => {
    onFilterChange({ ...currentFilters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ 
      type: null, 
      categoryId: null, 
      tagId: null, 
      accountId: null, 
      startDate: null, 
      endDate: null 
    });
    setIsOpen(false);
  };

  const hasActiveFilters = Object.values(currentFilters).some(val => val !== null && val !== undefined && val !== '');

  return (
    <div className="relative">
      {/* Botón Principal */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
          hasActiveFilters || isOpen 
            ? 'bg-slate-900 text-white border-slate-900' 
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <Filter size={16} strokeWidth={2.5} />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-50 animate-in fade-in slide-in-from-top-2">
          
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-sm font-black text-slate-900">Filter Transactions</h4>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors">
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-5">
            
            {/* 1. Tipo */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Type</p>
              <div className="flex gap-2">
                {(['income', 'expense', 'transfer'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateFilter('type', currentFilters.type === type ? null : type)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                      currentFilters.type === type 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Rango de Fechas */}
             <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date Range</p>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="date" 
                  value={currentFilters.startDate || ''}
                  onChange={(e) => updateFilter('startDate', e.target.value || null)}
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <input 
                  type="date" 
                  value={currentFilters.endDate || ''}
                  onChange={(e) => updateFilter('endDate', e.target.value || null)}
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 3. Cuenta */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Account</p>
              <select
                value={currentFilters.accountId || ''}
                onChange={(e) => updateFilter('accountId', e.target.value || null)}
                className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                <option value="">All Accounts</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            {/* 4. Categoría */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</p>
              <select
                value={currentFilters.categoryId || ''}
                onChange={(e) => updateFilter('categoryId', e.target.value || null)}
                className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* 5. Tag */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tag</p>
              <select
                value={currentFilters.tagId || ''}
                onChange={(e) => updateFilter('tagId', e.target.value || null)}
                className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}