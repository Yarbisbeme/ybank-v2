import { Account } from "@/types/database.types";
import { CreditCard, Wallet, Banknote, Landmark, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils"; // Tu utilidad de clases

// Mapeo de iconos según el tipo de cuenta
const typeIcons = {
  checking: Landmark,
  savings: Wallet,
  credit_card: CreditCard,
  cash: Banknote,
  investment: TrendingUp,
};

// Formateador de moneda (DOP/USD)
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

export function AccountCard({ account }: { account: Account }) {
  const Icon = typeIcons[account.type] || Wallet;
  
  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
      style={{ 
        // Usamos el color de la DB, o un gradiente negro por defecto
        background: account.color 
          ? `linear-gradient(135deg, ${account.color} 0%, ${account.color}dd 100%)` 
          : 'linear-gradient(135deg, #1f2937 0%, #000000 100%)'
      }}
    >
      {/* Círculos decorativos de fondo */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-black/10 blur-xl" />

      <div className="relative z-10 flex flex-col justify-between h-full gap-8">
        {/* Cabecera: Icono y Banco */}
        <div className="flex items-start justify-between">
          <div className="rounded-full bg-white/20 p-2.5 backdrop-blur-sm">
            {
                account.institution_id?.logo_url && (
                    <img src={account.institution_id.logo_url} alt="Logo del banco" className="h-5 w-5" />
                )
            }
          </div>
          {account.institution_id && (
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
              {account.institution_id.name}
            </span>
          )}
        </div>

        {/* Cuerpo: Saldo y Nombre */}
        <div>
          <p className="text-sm font-medium text-white/70 mb-1">
            {account.name}
          </p>
          <h3 className="text-2xl font-bold tracking-tight">
            {formatCurrency(account.current_balance, account.currency)}
          </h3>
        </div>
      </div>
    </div>
  );
}