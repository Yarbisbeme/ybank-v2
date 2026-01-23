import { ReactNode } from "react";
import { toast } from "sonner";


export type Button = {
  logo: string;
  alt: string;
  cls?: string;
}

export type NotificationProps = {
    message: string;
    description?: string;
    icon?: ReactNode;
    type?: "success" | "error" | "info" | "warning" | "default";
    duration?: number;
}
