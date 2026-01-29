import { getAccounts } from "@/actions/tables/accounts";
import { Plus } from "lucide-react";

// 1. Función auxiliar para elegir el color de la tarjeta automáticamente
// Esto hace que la UI se vea variada sin que tengas que guardar el color en la BD necesariamente.
const getCardVariant = (type: string, currency: string) => {
  if (type === "credit_card") {
    return currency === "USD" ? "black" : "gold"; // Crédito USD = Negra, Crédito DOP = Dorada
  }
  if (type === "savings") return "blue";     // Ahorros = Azul
  if (type === "checking") return "green";   // Corriente = Verde
  if (type === "investment") return "platinum"; 
  return "corporate"; // Default
};

export default async function AccountsPage() {
  const { data: accounts, success } = await getAccounts();

  // NOTA: Aquí deberías traer el nombre del usuario real desde tu auth()
  const USER_NAME = "YARBIS BELTRE"; 

  return (
    <div className="space-y-6">
      
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Mis Cuentas</h1>
          <p className="text-neutral-500">Gestiona tus tarjetas y efectivo.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
          <Plus className="h-4 w-4" />
          Nueva Cuenta
        </button>
      </div>

      {/* Grid de Cuentas */}
      {success && accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
        </div>
      ) : (
        // Estado Vacío
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
          <div className="bg-neutral-100 p-4 rounded-full mb-4">
            <Plus className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900">No tienes cuentas</h3>
          <p className="text-neutral-500 text-sm max-w-xs text-center mt-1">
            Agrega tu primera cuenta bancaria, tarjeta o efectivo para empezar.
          </p>
        </div>
      )}
    </div>
  );
}