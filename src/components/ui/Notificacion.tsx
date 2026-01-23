"use client"

import { Toaster as Sonner } from "sonner"
import { cn } from "@/lib/utils"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      richColors={false} // Desactivamos los colores nativos de la librería
      toastOptions={{
        classNames: {
          toast: cn(
            // === ESTRUCTURA BASE ===
            "group toast",
            "!bg-white !text-neutral-950 !border !border-neutral-200 !shadow-xl !rounded-2xl",
            "!flex !items-start !p-4 !gap-4 !w-full font-inter transition-all duration-300 hover:!shadow-2xl"
            
            // YA NO NECESITAS LAS LÍNEAS DE 'data-[type=...]' AQUÍ
            // El archivo globals.css se encarga de eso ahora.
          ),

          // === CONTENIDO ===
          content: "!flex !flex-col !gap-1 !w-full",
          
          // === TIPOGRAFÍA ===
          title: "!text-sm !font-bold !text-neutral-900 !leading-tight",
          description: "!text-xs !text-neutral-500 !font-medium !leading-relaxed",
          
          // === BOTONES ===
          actionButton: "!bg-neutral-900 !text-white !text-xs !font-semibold !px-3 !py-1.5 !rounded-md !mt-2 !self-start hover:!bg-neutral-800 transition-colors",
          cancelButton: "!bg-neutral-100 !text-neutral-600 !text-xs !font-semibold !px-3 !py-1.5 !rounded-md !mt-2 !self-start hover:!bg-neutral-200 transition-colors",
          
          // === ICONO ===
          icon: "!mt-0.5 !self-start",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }