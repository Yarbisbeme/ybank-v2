// components/filters/FilterTab.tsx
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
        "relative px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-[6px] transition-all z-10",
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