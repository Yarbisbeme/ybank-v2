// src/components/dashboard/RecentActivityTable.tsx
import { Transaction } from '@/types';
import { ShoppingCart, Utensils, Briefcase, Plane, Activity } from 'lucide-react';

export default function RecentActivityTable({ transactions }: { transactions: any[] }) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr className="text-left">
            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity / Date</th>
            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Category</th>
            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</th>
            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{tx.description}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-5 text-center">
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">
                  {tx.category?.name || 'General'}
                </span>
              </td>
              <td className="px-8 py-5">
                <p className="text-sm text-slate-500 font-medium italic">{tx.account?.name}</p>
              </td>
              <td className={`px-8 py-5 text-right font-black ${tx.type === 'expense' ? 'text-slate-900' : 'text-emerald-500'}`}>
                {tx.type === 'expense' ? '-' : '+'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}