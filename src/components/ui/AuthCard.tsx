import Image from "next/image";
import { cn } from "@/lib/utils"; // Asegúrate de tener clsx/tailwind-merge o usa string template

// 1. Tipos definidos para robustez
export type CardType = "credit" | "debit" | "virtual";

interface AuthCardProps {
  type?: CardType;
  last4?: string;
  name?: string;
  expiry?: string;
  className?: string;
  showTransaction?: boolean;
}

// 2. Estilos mapeados para fácil configuración
const CARD_STYLES: Record<CardType, string> = {
  credit: "bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#000000] border-white/10",
  debit: "bg-gradient-to-br from-neutral-800 to-neutral-900 border-white/5",
  virtual: "bg-gradient-to-br from-blue-900 to-slate-900 border-blue-500/20",
};

export function AuthCard({
  type = "credit",
  last4 = "4288",
  name = "JONATHAN DOE",
  expiry = "09/29",
  className,
  showTransaction = true,
}: AuthCardProps) {
  return (
      <div
        className={cn(
          "group relative w-full max-w-120 rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-blue-900/20",
          className
        )}
      >
      {/* --- TARJETA --- */}
      {/* aspect-[1.586/1] es el estándar ISO de tarjetas de crédito */}
        <div
          className={cn(
            "relative z-10 flex aspect-[1.586/1] flex-col justify-between rounded-2xl p-6 shadow-lg overflow-hidden",
            CARD_STYLES[type]
          )}
        >

        {/* Textura de Ruido (Noise) para realismo */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        {/* Brillos ambientales */}
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

        {/* CABECERA: Chip y Tipo */}
        <div className="relative z-10 flex justify-between items-start">
          {/* Logo  */}
          <div className="flex row items-center">
            <Image src="/icons/logoY.svg" width={24} height={24} alt="Logo"/>
            <span className="text-lg tracking-widest text-white/80">Bank</span>
          </div>

          {/* Contactless Icon */}
          <div className="flex flex-col items-end">
             <span className="font-mono text-[8px] tracking-widest text-white/40 uppercase">
                {type}
             </span>
             <svg className="w-5 h-5 text-white/30 mt-1 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
             </svg>
          </div>
        </div>
        
        <div className="h-6 w-9 rounded mt-1 bg-linear-to-br from-yellow-200/20 to-yellow-600/20 border border-yellow-400/30 backdrop-blur-sm flex items-center justify-center overflow-hidden">
             <div className="w-full h-px bg-yellow-400/30 absolute top-1/2"></div>
             <div className="h-full w-px bg-yellow-400/30 absolute left-1/3"></div>
             <div className="h-full w-px bg-yellow-400/30 absolute right-1/3"></div>
        </div>
        {/* CUERPO: Número */}
        <div className="relative z-10 mt-auto mb-2">
          <div className="font-mono text-lg sm:text-lg tracking-widest text-white/90 drop-shadow-md">
            •••• •••• •••• {last4}
          </div>
        </div>

        {/* PIE: Nombre y Fecha */}
        <div className="relative z-10 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[7px] text-white/40 uppercase tracking-wider mb-0.5">Card Holder</span>
            <span className="font-mono text-xs sm:text-xs text-white/70 uppercase tracking-wide">{name}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[7px] text-white/40 uppercase tracking-wider mb-0.5">Expires</span>
             <span className="font-mono text-xs sm:text-xs text-white/70">{expiry}</span>
          </div>
        </div>
      </div>

      {/* --- PANEL DE TRANSACCIÓN (Estilo "Wallet") --- */}
      {showTransaction && (
        <div className="absolute inset-x-0 z-20 flex justify-center -mt-3">
          <div
            className="
              w-[88%]
              rounded-xl
              border border-neutral-200
              bg-white
              p-4
              shadow-xl
              transition-colors
              hover:bg-neutral-50
            "
          >
            <div className="flex items-center justify-between ">
              <div className="flex items-center gap-3 ">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 shadow-sm">
                  AWS
                </div>
                <div className="flex flex-col">
                  <p className="text-[12px] font-bold text-neutral-900 leading-tight">
                    Amazon Web <br /> Services
                  </p>
                  <p className="text-[9px] font-medium text-neutral-400">
                    Infraestructura • Reciente
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-neutral-900 tabular-nums">
                -$240.00
              </span>
            </div>
          </div>
        </div>
      )}
     
    </div>
  );
}