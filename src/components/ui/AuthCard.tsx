import type { CardType } from "@/types/database.types";
import Image from "next/image"

const CARD_STYLES: Record<CardType, string> = {
  credit: "from-[var(--color-primary-700)] to-[var(--color-primary-500)]",
  debit: "from-gray-800 to-gray-700",
  virtual: "from-indigo-700 to-purple-700",
}


export function AuthCard(  ) {
  return (
    <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl border border-white/40 bg-linear-to-br from-gray-900 to-blue-800 shadow-2xl transition-transform duration-500 hover:scale-105 hover:rotate-1">
        
        {/* Brillo decorativo */}
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-800/30 blur-2xl"></div>
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-blue-500/30 blur-2xl"></div>

        {/* Contenido Tarjeta */}
        <div className="relative flex h-full flex-col justify-between p-6">
            <div className="flex justify-between items-start">
                <div className="h-8 w-10 rounded bg-white/10 backdrop-blur-sm"></div>
                <span className="font-mono text-xs text-white/50">✦ WORLD ELITE</span>
            </div>
            <div className="space-y-1">
                <div className="font-mono text-sm tracking-widest text-white/80">
                    •••• •••• •••• 4288
                </div>
                <div className="flex justify-between">
                    <span className="text-xs text-white/40">NAME SURNAME</span>
                    <span className="text-xs text-white/40">09/29</span>
                </div>
            </div>
        </div>
    </div>
  )
}
