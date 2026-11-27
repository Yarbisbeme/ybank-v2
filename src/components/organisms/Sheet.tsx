'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, IconButton } from '@/components/atoms';

export type SheetSize = 'sm' | 'md' | 'lg';
export type SheetSide = 'center' | 'right' | 'bottom';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: SheetSize;
  side?: SheetSide;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const SIZE_CLASSES: Record<SheetSize, string> = {
  sm: 'md:max-w-md',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Single YBank 2.0 overlay surface for dialogs, forms, and confirmations.
 * Supports Escape dismissal, focus trapping, and focus restoration.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  size = 'md',
  side = 'center',
  initialFocusRef,
  children,
  footer,
  className,
}: SheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTarget =
      initialFocusRef?.current ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
      panelRef.current;
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) {
        return;
      }

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const containerClasses =
    side === 'right'
      ? 'items-end md:items-stretch justify-end'
      : side === 'bottom'
        ? 'items-end justify-center'
        : 'items-end md:items-center justify-center md:p-4';

  const panelClasses =
    side === 'right'
      ? 'w-full h-full md:max-w-lg rounded-t-sheet md:rounded-none md:border-l'
      : side === 'bottom'
        ? 'w-full max-h-[90vh] rounded-t-sheet md:rounded-panel md:mb-4'
        : 'w-full max-h-[92vh] rounded-t-sheet md:rounded-panel';

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-modal flex',
        containerClasses,
      )}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/50"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-modal flex flex-col border border-line-strong bg-surface-raised text-ink shadow-overlay overflow-hidden focus:outline-none',
          panelClasses,
          side !== 'right' && SIZE_CLASSES[size],
          className,
        )}
      >
        <div className="flex justify-center pt-2.5 pb-1 md:hidden shrink-0" aria-hidden="true">
          <div className="h-1 w-10 rounded-chip bg-line-strong" />
        </div>

        {(title || description) ? (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 shrink-0">
            <div className="min-w-0">
              {title ? (
                <h2 id={titleId} className="title text-ink">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="small text-ink-2 mt-1">
                  {description}
                </p>
              ) : null}
            </div>

            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Cerrar"
              onClick={onClose}
            >
              <X size={18} strokeWidth={2} />
            </IconButton>
          </div>
        ) : (
          <div className="flex justify-end px-4 pt-3 shrink-0">
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Cerrar"
              onClick={onClose}
            >
              <X size={18} strokeWidth={2} />
            </IconButton>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3.5 shrink-0">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
}

/** Accessible confirmation dialog replacing native window.confirm(). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" disabled={loading} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="body text-ink-2">{description}</p>
    </Sheet>
  );
}
