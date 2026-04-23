"use client";

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { TransactionFilters as FilterType } from '@/types/database.types';
import TransactionFilters from './TransactionFilter';

interface PageFilterBarProps {
  initialFilters: FilterType;
  categories: any[];
  tags: any[];
  accounts: any[];
}

export default function PageFilterBar({ initialFilters, categories, tags, accounts }: PageFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newFilters: FilterType) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex items-center gap-3">
      {/* 💡 Spinner sutil cuando el servidor está cargando la nueva data */}
      {isPending && (
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      )}
      
      <TransactionFilters 
        currentFilters={initialFilters} 
        onFilterChange={handleFilterChange}
        categories={categories}
        tags={tags}
        accounts={accounts}
      />
    </div>
  );
}