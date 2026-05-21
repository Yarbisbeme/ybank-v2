"use client"

import {
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
// 💡 Importamos solo useTheme de la librería corregida
import { useTheme } from "@teispace/next-themes" 
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      // 💡 Quitamos 'richColors' para tomar el control absoluto del diseño
      icons={{
        success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        info: <Info className="h-4 w-4 text-blue-500" />,
        warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        error: <XCircle className="h-4 w-4 text-rose-500" />,
        loading: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast: 
            "group flex items-start gap-3 border border-border/50 bg-background/80 backdrop-blur-xl px-4 py-3.5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] rounded-[12px] w-full font-sans",
          
          title: "text-[11px] font-black uppercase tracking-[0.15em] text-foreground leading-none mt-0.5",
          description: "text-[11px] font-medium text-muted-foreground mt-1.5",
          
          actionButton:
            "bg-foreground text-background hover:bg-foreground/90 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[6px] transition-all active:scale-95",
          cancelButton:
            "bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:bg-surface-3 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[6px] transition-all active:scale-95",
          
          success:
            "!border-emerald-500/30 !bg-emerald-500/5",
          error:
            "!border-rose-500/30 !bg-rose-500/5",
          warning:
            "!border-amber-500/30 !bg-amber-500/5",
          info:
            "!border-blue-500/30 !bg-blue-500/5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }