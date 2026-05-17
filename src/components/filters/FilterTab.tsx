'use client'

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FilterTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

export default function FilterTab({ active, onClick, label }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-1 items-center justify-center h-full px-2 sm:px-4 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-[6px] transition-all z-10 whitespace-nowrap",
        active ? "text-background" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="absolute inset-0 bg-foreground shadow-sm rounded-[6px] -z-10"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      {label}
    </button>
  );
}