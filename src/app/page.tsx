"use client"

import {
  CircleCheck,
  Info,
  Loader2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

export const Toaster = (props: ToasterProps) => {
  const { theme = "light" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        className: `
          flex items-start gap-3
          rounded-none
          border border-neutral-200
          bg-white
          px-4 py-3
          text-sm text-neutral-800
          shadow-none
        `,
        descriptionClassName: `
          text-neutral-500
          text-xs
        `,
      }}
      icons={{
        success: <CircleCheck className="h-4 w-4 text-blue-600" />,
        info: <Info className="h-4 w-4 text-blue-600" />,
        warning: <AlertTriangle className="h-4 w-4 text-neutral-600" />,
        error: <XCircle className="h-4 w-4 text-neutral-900" />,
        loading: <Loader2 className="h-4 w-4 animate-spin text-blue-600" />,
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#171717",
          "--normal-border": "#e5e5e5",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
