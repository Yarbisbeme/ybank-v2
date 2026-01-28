import Image from "next/image";
import { cn } from "@/lib/utils";
import { Wifi, CreditCard, Wallet } from "lucide-react"; // Iconos necesarios

// 1. Tipos de cuenta que vienen de tu Base de Datos (PostgreSQL Enum)
export type AccountType = "savings" | "checking" | "credit_card" | "investment" | "cash";

// 2. Variantes de color
export type CardVariant = "black" | "blue" | "gold" | "platinum" | "green" | "corporate";

interface TransactionPreview {
  merchant: string;
  amount: number;
  category: string;
}

interface AuthCardProps {
  // Datos principales
  type: AccountType;        // CLAVE: Esto define el diseño
  bankName?: string;
  cardHolder?: string;
  last4?: string;           // Para cuentas: '1234'. Para tarjetas: '4288'
  expiry?: string | null;   // Puede venir null de la BD
  currency?: "DOP" | "USD" | "EUR";
  
  // Estilo
  variant?: CardVariant;
  className?: string;
  
  // Transacción (Opcional)
  recentTransaction?: TransactionPreview | null;
}

const VARIANTS: Record<CardVariant, string> = {
  black: "bg-gradient-to-br from-neutral-900 via-neutral-800 to-black border-white/10",
  blue: "bg-gradient-to-br from-blue-900 to-slate-900 border-blue-500/20",
  gold: "bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-800 border-yellow-500/30",
  platinum: "bg-gradient-to-br from-slate-400 via-slate-300 to-slate-500 border-white/40 text-black",
  green: "bg-gradient-to-br from-emerald-800 to-teal-900 border-emerald-500/20",
  corporate: "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600/30",
};

export function CardAccount ({
  type = "credit_card",
  bankName = "Bank",
  cardHolder = "TITULAR",
  last4 = "0000",
  expiry,
  currency = "DOP",
  variant = "black",
  className,
  recentTransaction,
}: AuthCardProps) {

  // --- LÓGICA DE FORMATO ---
  const isCredit = type === "credit_card";
  
  // Formateador de moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Etiquetas según el tipo
  const typeLabel = {
    savings: "Cuenta de Ahorros",
    checking: "Cuenta Corriente",
    credit_card: "Tarjeta de Crédito",
    investment: "Inversión",
    cash: "Efectivo"
  }[type];

  return (
    <div
      className={cn(
        "group relative w-full max-w-[380px] rounded-2xl transition-all duration-500 hover:scale-[1.02]",
        recentTransaction ? "mb-12" : "", 
        className
      )}
    >
      {/* --- CONTENEDOR PRINCIPAL --- */}
      <div
        className={cn(
          "relative z-10 flex aspect-[1.586/1] flex-col justify-between rounded-2xl p-6 shadow-2xl overflow-hidden border",
          VARIANTS[variant]
        )}
      >
        {/* EFECTOS DE FONDO (Común para ambos) */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

        {/* --- CABECERA --- */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-2">
            {/* Icono del Banco (Simulado) */}
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
               {
              }
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-white/90 uppercase truncate max-w-[140px] leading-none">
                {bankName}
              </span>
              {/* Moneda pequeña debajo del banco */}
              <span className="text-[10px] font-mono text-white/50 mt-1">{currency}</span>
            </div>
          </div>

          {/* Icono Contactless (Solo para Tarjetas) */}
          {isCredit && <Wifi className="w-6 h-6 text-white/40 rotate-90" />}
        </div>
        
        {/* --- CUERPO CENTRAL --- */}
        <div className="relative z-10">
          {isCredit ? (
            // DISEÑO TARJETA: Chip
            <div className="h-8 w-11 rounded bg-gradient-to-br from-yellow-200/20 to-yellow-600/20 border border-yellow-400/30 backdrop-blur-sm flex items-center justify-center overflow-hidden mb-4">
                 <div className="w-full h-px bg-yellow-400/30 absolute top-1/2"></div>
                 <div className="h-full w-px bg-yellow-400/30 absolute left-1/3"></div>
                 <div className="h-full w-px bg-yellow-400/30 absolute right-1/3"></div>
            </div>
          ) : (
             // DISEÑO CUENTA: Espacio vacío o etiqueta
             <div className="h-8 mb-4"></div> 
          )}

          {/* NÚMERO */}
          <div className="font-mono text-xl tracking-widest text-white/90 drop-shadow-md">
            {isCredit ? (
              // Formato Tarjeta: •••• •••• •••• 4288
              <div className="flex gap-3 sm:gap-4">
                <span className="text-white/40">••••</span>
                <span className="text-white/40">••••</span>
                <span className="text-white/40">••••</span>
                <span>{last4}</span>
              </div>
            ) : (
              // Formato Cuenta: CTA ••• 9921
              <div className="flex gap-2 items-center">
                 <span className="text-xs uppercase tracking-normal text-white/50 mr-2">Nº Cuenta</span>
                 <span className="text-white/40">•••</span>
                 <span>{last4}</span>
              </div>
            )}
          </div>
        </div>

        {/* --- PIE --- */}
        <div className="relative z-10 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/50 uppercase tracking-wider mb-0.5">
              {typeLabel}
            </span>
            <span className="font-mono text-xs text-white/90 uppercase tracking-wide truncate max-w-[160px]">
              {cardHolder}
            </span>
          </div>
          
          {/* Solo mostramos Expiración si es Tarjeta */}
          {isCredit && expiry ? (
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-white/50 uppercase tracking-wider mb-0.5">Vence</span>
              <span className="font-mono text-xs text-white/90">{expiry}</span>
            </div>
          ) : (
            // Si es cuenta, mostramos el Estado o nada
            <div className="flex flex-col items-end">
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                 <span className="text-[9px] text-emerald-400 font-medium uppercase tracking-wider">Activa</span>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* --- TRANSACCIÓN FLOTANTE (Igual para ambos) --- */}
      {recentTransaction && (
        <div className="absolute inset-x-0 bottom-0 z-0 flex justify-center translate-y-[65%] transition-transform duration-300 group-hover:translate-y-[75%]">
          <div className="w-[90%] rounded-xl border border-neutral-200 bg-white p-3 shadow-xl dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs uppercase dark:bg-blue-900/30 dark:text-blue-400">
                  {recentTransaction.merchant.substring(0, 2)}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white leading-tight truncate max-w-[110px]">
                    {recentTransaction.merchant}
                  </p>
                  <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                    {recentTransaction.category}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-red-500 tabular-nums">
                -{formatCurrency(recentTransaction.amount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}