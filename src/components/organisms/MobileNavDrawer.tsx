'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Moon, Plus, Sun, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, IconButton, YMark } from '@/components/atoms';
import { NAV_ITEMS, isRouteActive } from './nav-items';
import type { SidebarUser } from './Sidebar';

export interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
  onNewAccount: () => void;
  onSignOut: () => void;
  user?: SidebarUser;
  theme?: string;
  onToggleTheme?: () => void;
}

/** Slide-over navigation drawer bridging tablet (<lg) and mobile navigation. */
export function MobileNavDrawer({
  open,
  onClose,
  onNewTransaction,
  onNewAccount,
  onSignOut,
  user,
  theme,
  onToggleTheme,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
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

    drawerRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'Y';

  return createPortal(
    <div className="fixed inset-0 z-drawer flex lg:hidden">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/50"
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        tabIndex={-1}
        className="relative z-drawer flex h-full w-72 max-w-full flex-col border-r border-line-strong bg-surface shadow-overlay focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <YMark lockup size={24} />
          <div className="flex items-center gap-1">
            {onToggleTheme ? (
              <IconButton
                variant="ghost"
                size="sm"
                aria-label={
                  theme === 'dark'
                    ? 'Cambiar a tema claro'
                    : 'Cambiar a tema oscuro'
                }
                onClick={onToggleTheme}
              >
                {theme === 'dark' ? (
                  <Sun size={16} strokeWidth={2} />
                ) : (
                  <Moon size={16} strokeWidth={2} />
                )}
              </IconButton>
            ) : null}
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Cerrar menú"
              onClick={onClose}
            >
              <X size={18} strokeWidth={2} />
            </IconButton>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isRouteActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-control px-3 py-2.5 body-strong transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                  active
                    ? 'bg-action-wash text-action'
                    : 'text-ink-2 hover:bg-surface-sunk hover:text-ink',
                )}
              >
                <Icon size={18} strokeWidth={2} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 border-t border-line p-4">
          <Button
            variant="primary"
            fullWidth
            leftIcon={<Plus size={16} strokeWidth={2} />}
            onClick={() => {
              onClose();
              onNewTransaction();
            }}
          >
            Nuevo movimiento
          </Button>
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<Plus size={16} strokeWidth={2} />}
            onClick={() => {
              onClose();
              onNewAccount();
            }}
          >
            Nueva cuenta
          </Button>

          {user ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-tile border border-line bg-surface-sunk px-3 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={32}
                    height={32}
                    unoptimized
                    className="h-8 w-8 shrink-0 rounded-tile border border-line object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-tile border border-line bg-surface label text-ink"
                  >
                    {initial}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="small text-ink truncate">{user.name}</p>
                  {user.email ? (
                    <p className="nav text-ink-2 truncate">{user.email}</p>
                  ) : null}
                </div>
              </div>

              <IconButton
                variant="danger"
                size="sm"
                aria-label="Cerrar sesión"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
              >
                <LogOut size={16} strokeWidth={2} />
              </IconButton>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              leftIcon={<LogOut size={16} strokeWidth={2} />}
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="justify-start text-ink-2 hover:text-debit"
            >
              Cerrar sesión
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
