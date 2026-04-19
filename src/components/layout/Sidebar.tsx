"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowLeftRight, 
  Settings, 
  HelpCircle, 
  LogOut,
  Plus
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: CreditCard, label: 'Accounts', href: '/dashboard/accounts' },
  { icon: ArrowLeftRight, label: 'Transactions', href: '/dashboard/transactions' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full p-6">
      {/* BRANDING */}
      <div className="flex flex-row items-center my-2 pr-2"> 
        <img 
          src="/icons/logoY.svg" 
          alt="YBank" 
          className="w-[40px] h-auto object-contain"
        />
        <span className="text-black font-bold text-[30px] tracking-tighter mt-1">
            Bank
        </span>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-2 mt-8">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                isActive 
                ? 'bg-[#0052FF]/5 text-[#0052FF]' 
                : 'text-[#9A9FA5] hover:text-[#1A1D1F] hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button className="w-full bg-[#0052FF] text-white p-4 rounded-md font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
        <Plus size={20} />
        New Transaction
      </button>
      {/* BOTTOM NAV */}
      <div className="pt-6 border-t border-slate-100 space-y-2">
        <button className="flex items-center gap-4 px-4 py-3 w-full text-[#9A9FA5] font-bold text-sm hover:text-red-500 transition-colors">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}