"use client";

import { toast } from "sonner";
import { Fingerprint, ArrowRight } from "lucide-react";

export function PasskeyButton() {

  return (
    <button 
        onClick={() => {
            toast.info("Funcionalidad en desarrollo", {
                description: "El acceso biométrico (Passkey) estará disponible en la v1.0.",
            })}
        } // <- Conectamos la función aquí
        type="button" // Importante: type="button" para que no intente enviar formulario
        className="group relative flex w-full items-center justify-center gap-3 bg-black px-4 py-4 text-white shadow-lg transition-all duration-300 hover:shadow-blue-500/20 hover:-translate-y-0.5 active:scale-95"
    >
        <Fingerprint className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-blue-400" />
        <span className="font-semibold tracking-wide transition-colors group-hover:text-blue-400">Continuar con Passkey</span>
        <div className="absolute right-6 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
        <ArrowRight className="h-4 w-4 text-blue-400" />
        </div>
    </button>
  );
}