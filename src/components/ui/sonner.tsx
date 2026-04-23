"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      richColors
      icons={{
        success: <CircleCheckIcon className="h-4 w-4" />,
        info: <InfoIcon className="h-4 w-4" />,
        warning: <TriangleAlertIcon className="h-4 w-4" />,
        error: <OctagonXIcon className="h-4 w-4" />,
        loading: <Loader2Icon className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group border px-4 py-3 text-sm shadow-lg backdrop-blur-md",
          title: "font-semibold",
          description: "text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton:
            "bg-muted text-muted-foreground hover:bg-muted/80",
          success:
            "border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
          error:
            "border-red-500/30 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
          warning:
            "border-yellow-500/30 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100",
          info:
            "border-blue-500/30 bg-black text-blue-900 dark:bg-black dark:text-blue-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
