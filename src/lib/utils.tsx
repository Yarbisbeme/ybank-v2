import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Bell } from "lucide-react";
import { type NotificationProps } from "../types/types";
// Asegúrate de importar tu tipo desde donde lo tengas

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function handlerToast({ message, description, icon, type = "default", duration }: NotificationProps) {
  
  // Mapeo de iconos por defecto
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />,
    error: <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />,
    info: <Info className="h-4 w-4 text-neutral-500 mt-0.5" />,
    default: <Bell className="h-4 w-4 text-neutral-900 mt-0.5" />,
  };

  const selectedIcon = icon || icons[type as keyof typeof icons] || icons.default;

  // Ejecución
  // Nota: Shadcn/Sonner usa toast[type] directamente
  const toastFn = (type === 'default') ? toast : toast[type as keyof typeof toast];

  // @ts-ignore - TypeScript a veces se queja de la indexación dinámica del toast
  toastFn(message, {
    description,
    icon: selectedIcon,
    duration: duration || 4000,
  });
}