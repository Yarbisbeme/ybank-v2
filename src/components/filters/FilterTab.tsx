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
        "relative flex flex-1 xl:flex-none items-center justify-center h-full px-1 sm:px-4 text-[11px] sm:text-[11px] font-black uppercase tracking-wider rounded-[6px] transition-all z-10 whitespace-nowrap overflow-hidden",
        active ? "text-background" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="absolute inset-0 bg-foreground shadow-sm rounded-[6px] -z-10 overflow-hidden"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        >
          <motion.div
            key={`wave-${label}`} 
            initial={{ y: '160%', opacity: 1 }}
            animate={{ y: '-30%', opacity: 0 }}
            transition={{
              y: { duration: 0.7, ease: 'backOut' }, 
              opacity: { duration: 0.3, delay: 0.5 }
            }}
            className="absolute inset-0 z-10 h-[200%] w-[200%] origin-bottom-left rotate-[-8deg] -translate-x-[20%]"
          >
            <WaveLayer color="#014ba0" className="opacity-70" /> 
            <WaveLayer color="#0179FE" className="opacity-100 translate-y-2" />
            <div className="absolute -bottom-[98%] left-0 h-full w-full bg-[#0179FE]" />
          </motion.div>
        </motion.div>
      )}
      
      <span className="relative z-30">{label}</span>
    </button>
  );
}

// ==========================================
// TUS COMPONENTES ORIGINALES POTENCIADOS
// ==========================================

function WaveLayer({
  color,
  className = "",
}: {
  color: string;
  className?: string;
}) {
  return (
    <div className={`absolute bottom-0 left-0 h-full w-[200%] ${className}`}>
      <WavePath color={color} />
    </div>
  );
}

function WavePath({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className="absolute bottom-0 h-[60px] w-full" 
    >
      <path
        d="M0,0 V20 Q300,110 600,20 T1200,20 V120 H0 Z"
        fill={color}
        transform="scale(1,-1) translate(0,-120)"
      />
    </svg>
  );
}