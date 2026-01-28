import { cn } from "@/lib/utils";
import { Wifi } from "lucide-react"; // Para el icono contactless
import Image from "next/image";

// Importamos tu interfaz (asegúrate de ajustar la ruta)
import { Account } from "@/types/database.types"; 

interface CreditCardRealProps {
  account: Account;
  className?: string;
}

export function CreditCardReal({ account, className }: CreditCardRealProps) {
  // 1. Helpers de Formato
  const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // 2. Cálculos de Balance
  // Asumimos: 
  // - current_balance = Lo que has gastado (Deuda)
  // - credit_limit = El límite total del banco
  // - disponible = Límite - Lo gastado
  const totalBalance = account.current_balance; 
  
  // Si no hay límite definido, asumimos 0 para evitar NaN
  const creditLimit = account.credit_limit || 0;
  
  // En muchas BD de tarjetas: Balance positivo = Deuda. 
  // Si tu BD guarda deuda como negativo, usa Math.abs(). 
  // Aquí asumo que si debes 500, el balance es 500.
  const availableBalance = creditLimit - totalBalance;

  // 3. Determinar el Logo de la Red (Visa/Mastercard)
  const NetworkLogo = () => {
    // Si tienes el SVG local o remoto mejor. Aquí simulo un texto/icono
    if (account.network?.toLowerCase().includes("master")) {
        return (
            <div className="flex flex-col items-center justify-center font-bold text-white italic">
                <div className="flex">
                    <div className="w-6 h-6 rounded-full bg-red-500/90 mix-blend-screen -mr-3"></div>
                    <div className="w-6 h-6 rounded-full bg-yellow-500/90 mix-blend-screen"></div>
                </div>
                <span className="text-[8px] mt-0.5">mastercard</span>
            </div>
        )
    }
    // Default Visa (Como la imagen)
    return (
      <svg className="w-12 h-8 text-white fill-current" viewBox="0 0 32 10">
         <path d="M12.7.1L8.6 10H5.8L8.6 1.4h-2L4.6 10H1.8l1.9-8.6H.1L-.1.1h12.8zm2.4 9.9l2.2-9.9h2.6l-1.3 6.3c-.2.8-.2.9.3.9h.8c.2 0 .5-.1.8-.2l-.3 1.5c-1.2.5-2.2.6-3.1.6-1.7 0-2.6-.8-2-1.2zm8.5-7.4c.5 0 .9 0 1.2.1l-.3 1.4c-.2 0-.6-.1-1-.1-.6 0-1 .2-1.1.7l-.4 1.8 2.5 3.5h-2.9l-1-2.4-.4 1.7-.1.7h-2.6l1.7-8.1h2.7l.4 2.1c.3-.5.9-1.2 2.3-1.4z" />
      </svg>
    );
  };

  // 4. Estado (Activa/Inactiva)
  // Como tu interfaz no tiene campo 'status' explícito, asumimos 'is_active' de BD o simulamos
  // Si is_active no existe en tu tipo Account, puedes agregarlo o usar lógica.
  // Aquí asumo true por defecto.
  const isActive = true; 

  return (
    <div
      className={cn(
        "relative w-full max-w-[400px] aspect-[1.586/1] rounded-xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-300",
        className
      )}
    >
      {/* --- FONDO (Background) --- */}
      {/* Usamos un gradiente azul oscuro similar al de APAP */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#001540] via-[#002868] to-[#001030]"></div>
      
      {/* Textura de fondo (Líneas abstractas sutiles para realismo) */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>
      
      {/* --- CONTENIDO --- */}
      <div className="relative z-10 h-full flex flex-col justify-between p-5 text-white">
        
        {/* PARTE SUPERIOR */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            {/* Logo de la Institución */}
            {account.institution_id?.logo_url ? (
               <div className="relative h-8 w-24 mb-1">
                 <Image 
                   src={account.institution_id.logo_url} 
                   alt="Bank Logo" 
                   fill 
                   className="object-contain object-left invert brightness-0 grayscale" // Truco para volver blanco el logo si viene a color
                 />
               </div>
            ) : (
               // Fallback si no hay logo
               <span className="font-bold text-lg tracking-wider uppercase">{account.institution_id?.name || "Banco"}</span>
            )}
            
            {/* Nombre de la Tarjeta */}
            <span className="text-[10px] sm:text-xs font-medium tracking-wider uppercase text-blue-100/80">
              {account.name}
            </span>
          </div>

          {/* Tag de Estado (INACTIVA/ACTIVA) */}
          <div className={cn(
            "px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider uppercase",
            isActive 
              ? "border-green-400/50 text-green-400 bg-green-900/20" // Estilo Activa
              : "border-white/30 text-white/70 bg-white/5"           // Estilo Inactiva (Como la foto)
          )}>
            {isActive ? "Activa" : "Inactiva"}
          </div>
        </div>

        {/* PARTE CENTRAL (Número alineado a la derecha como la imagen) */}
        <div className="flex justify-end items-center mt-2">
            <div className="flex items-center gap-2 font-mono text-lg sm:text-xl tracking-widest text-white/90 drop-shadow-sm">
                <span className="text-[10px] align-middle mt-1 tracking-normal mr-2 opacity-50">
                    {/* Icono Contactless pequeño al lado del número si quieres */}
                    <Wifi className="w-4 h-4 rotate-90 inline-block" />
                </span>
                <span className="tracking-widest">•••• •••• ••••</span>
                <span>{account.last_4_digits || "0000"}</span>
            </div>
        </div>

        {/* PARTE INFERIOR (Balances) */}
        <div className="flex justify-between items-end mt-auto">
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 w-full max-w-[90%]">
            
            {/* Columna 1: Balance Total (Deuda) */}
            <div className="flex flex-col">
              <span className="text-[9px] text-blue-200/70 font-medium tracking-wide">
                Balance Total
              </span>
              <span className="text-sm font-bold tracking-tight">
                {formatMoney(totalBalance, account.currency)}
              </span>
              {/* Si quisieras simular la segunda moneda en 0.00 como la foto: */}
              {/* <span className="text-xs text-white/50">0.00 USD</span> */}
            </div>

            {/* Columna 2: Balance Disponible */}
            <div className="flex flex-col">
              <span className="text-[9px] text-blue-200/70 font-medium tracking-wide">
                Balance Disponible
              </span>
              <span className="text-sm font-bold tracking-tight">
                {formatMoney(availableBalance, account.currency)}
              </span>
            </div>

          </div>

          {/* Logo de la Red (Visa) en la esquina inferior derecha */}
          <div className="mb-0.5 opacity-90">
             <NetworkLogo />
          </div>

        </div>
      </div>
    </div>
  );
}