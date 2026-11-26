'use client';

import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { useTheme } from '@teispace/next-themes';
import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';
import { YMark } from './YMark';

/** YBank 2.0 flat toast host without glassmorphism or spinners. */
export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="bottom-center"
      icons={{
        success: <CheckCircle2 size={16} strokeWidth={2} className="text-credit" />,
        info: <Info size={16} strokeWidth={2} className="text-action" />,
        warning: <AlertTriangle size={16} strokeWidth={2} className="text-pending" />,
        error: <XCircle size={16} strokeWidth={2} className="text-debit" />,
        loading: <YMark size={16} animation="loop" tone="action" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group flex items-start gap-3 border border-line-strong bg-surface-raised text-ink px-4 py-3.5 shadow-overlay rounded-panel w-full font-sans z-toast',
          title: 'body-strong text-ink leading-tight',
          description: 'small text-ink-2 mt-1',
          actionButton:
            'bg-action text-action-ink hover:bg-action-press label px-3 py-1.5 rounded-control transition-colors duration-150',
          cancelButton:
            'bg-surface-sunk border border-line-strong text-ink-2 hover:text-ink label px-3 py-1.5 rounded-control transition-colors duration-150',
          success: 'border-credit',
          error: 'border-debit',
          warning: 'border-pending',
          info: 'border-action',
        },
      }}
      {...props}
    />
  );
}

export { toast };
