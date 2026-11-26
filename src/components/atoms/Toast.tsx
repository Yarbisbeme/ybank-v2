'use client';

import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { useTheme } from '@teispace/next-themes';
import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';
import { YMark } from './YMark';

/** YBank 2.0 inverted-ink toast host with lime achievement stripe and flat error frame. */
export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="bottom-center"
      icons={{
        success: <CheckCircle2 size={16} strokeWidth={2} className="text-lime shrink-0" />,
        info: <Info size={16} strokeWidth={2} className="text-action shrink-0" />,
        warning: <AlertTriangle size={16} strokeWidth={2} className="text-pending shrink-0" />,
        error: <XCircle size={16} strokeWidth={2} className="text-debit shrink-0" />,
        loading: <YMark size={16} animation="loop" tone="action" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
          'group flex items-center gap-3 border toast-ybank px-4 py-3.5 shadow-overlay rounded-panel w-full font-sans z-toast',
          title: 'body-strong text-current leading-tight',
          description: 'small opacity-80 mt-0.5',
          actionButton:
          'text-current underline underline-offset-4 label px-2 py-1 rounded-control transition-colors duration-150',
          cancelButton:
          'border border-current/25 text-current opacity-85 hover:opacity-100 label px-2.5 py-1 rounded-control transition-colors duration-150',
          success: 'toast-ybank-success pl-5',
          error: 'toast-ybank-error border',
          warning: 'border-pending',
          info: 'border-action',
        },
      }}
      {...props}
    />
  );
}

export { toast };
