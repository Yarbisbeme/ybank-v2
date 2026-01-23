import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Bell } from "lucide-react";
// Asegúrate de importar tu tipo desde donde lo tengas
import { type NotificationProps } from "@/types/types"; 

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handlerToast({ message, description, icon, type, duration }: NotificationProps) {
  
  const toastConfig = {
    success: {
      fn: toast.success,
      icon: icon || <CheckCircle2 className="h-4 w-4 text-blue-600" />,
      description: description,
      duration: duration || 3000
    },
    error: {
      fn: toast.error,
      icon: icon || <AlertCircle className="h-4 w-4 text-red-500" />,
      description: description || "Ha ocurrido un error inesperado.",
      duration: duration || 4000
    },
    info: {
      fn: toast.info,
      icon: icon || <Info className="h-4 w-4 text-neutral-500" />,
      description: description,
      duration: duration || 3000
    },
    warning: {
      fn: toast.warning,
      icon: icon || <AlertTriangle className="h-4 w-4 text-amber-500" />,
      description: description || "Atención requerida.",
      duration: duration || 3000
    },
    default: {
      fn: toast.message,
      icon: icon || <Bell className="h-4 w-4 text-neutral-900" />,
      description: description,
      duration: duration || 3000
    },
  };

  const selected = toastConfig[type as keyof typeof toastConfig] || toastConfig.default;

  selected.fn(message, {
    description: selected.description,
    icon: selected.icon,
    duration: selected.duration
  });
}