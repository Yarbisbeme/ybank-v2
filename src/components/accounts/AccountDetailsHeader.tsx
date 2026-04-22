'use client'

import { Account } from '@/types';
import { AnimatedNumber } from '../dashboard/NetWorth/AnimatedNumber';
import { Share2, Edit, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AccountDetailsHeader({ account }: { account: Account }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-4 space-y-2">
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
          Current Balance
        </p>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
          <span className="text-blue-600 text-3xl mr-1">$</span>
          <AnimatedNumber value={Number(account.current_balance)} />
          <span className="text-sm text-slate-400 ml-2 uppercase">{account.currency}</span>
        </h1>
        <p className="text-slate-400 font-medium text-sm">
          •••• •••• •••• {account.last_4_digits}
        </p>
      </div>

      {/* Botones de Acción Rápida */}
      <div className="flex justify-center gap-4">
        
        {/* Botón ADD */}
        <Link 
          href={`?accountId=${account.id}&newTx=true`} 
          scroll={false}
        >
          <ActionButton icon={<Plus size={20} />} label="Add" />
        </Link>
        
        {/* Botón EDIT */}
        <Link 
          href={`?accountId=${account.id}&editAccountId=${account.id}`}
          scroll={false}
        >
          <ActionButton icon={<Edit size={20} />} label="Edit" />
        </Link>
        
        <div onClick={() => console.log('Share clicked')}>
          <ActionButton icon={<Share2 size={20} />} label="Share" />
        </div>

      </div>
    </div>
  );
}

// 💡 FIX 3: Cambiamos <button> a <div> para que Next.js no dé errores de hidratación
function ActionButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer">
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
        {label}
      </span>
    </div>
  );
}