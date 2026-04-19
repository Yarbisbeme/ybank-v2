"use client";
import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-20 bg-transparent flex items-center justify-between px-8 md:px-12">
      {/* SECONDARY NAV (Optional links from image) */}
      <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#9A9FA5]">
        <Link href="#" className="hover:text-[#1A1D1F]">Dashboard</Link>
      </div>

      {/* SEARCH & PROFILE */}
      <div className="flex items-center gap-6 flex-1 justify-end">
        {/* Search Bar */}
        <div className="relative hidden sm:block max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9FA5]" size={18} />
          <input 
            type="text" 
            placeholder="Search wealth assets..."
            className="w-full bg-[#F0F2F5] border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>

        {/* Icons */}
        <button className="relative p-2 text-[#1A1D1F] hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={22} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 border-2 border-white shadow-sm overflow-hidden">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="User" 
              className="w-full h-full object-cover"
            />
          </div>
          <ChevronDown size={16} className="text-[#9A9FA5]" />
        </div>
      </div>
    </header>
  );
}

// Helper Link (Si no usas Next.js Link)
function Link({ children, href, className }: any) {
  return <a href={href} className={className}>{children}</a>;
}