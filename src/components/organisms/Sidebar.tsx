'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Moon, Plus, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, IconButton, YMark } from '@/components/atoms';
import { NAV_ITEMS, isRouteActive } from './nav-items';

export interface SidebarUser {
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface SidebarProps {
  onNewTransaction: () => void;
  onSignOut: () => void;
  user?: SidebarUser;
  theme?: string;
  onToggleTheme?: () => void;
  className?: string;
}

/** Fixed 240px desktop navigation sidebar with single primary action and flat surface. */
export function Sidebar({
  onNewTransaction,
  onSignOut,
  user,
  theme,
  onToggleTheme,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'Y';

  return (
    <aside
      aria-label="Navegación principal"
      className={cn(
        'flex h-full w-60 shrink-0 flex-col border-r border-line bg-surface px-4 py-5',
        className,
      )}
    >
      <div className="flex items-center justify-between px-2 pb-6">
        <Link
          href="/dashboard"
          aria-label="YBank Inicio"
          className="inline-flex items-center rounded-control focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
        >
          <YMark lockup size={26} />
        </Link>

        {onToggleTheme ? (
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={
              theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
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
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isRouteActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
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

      <div className="py-4">
        <Button
          variant="primary"
          fullWidth
          leftIcon={<Plus size={16} strokeWidth={2} />}
          onClick={onNewTransaction}
        >
          Nuevo movimiento
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        {user ? (
          <div className="flex items-center gap-2.5 px-2 py-1">
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
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-tile border border-line bg-surface-sunk label text-ink"
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
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          fullWidth
          leftIcon={<LogOut size={16} strokeWidth={2} />}
          onClick={onSignOut}
          className="justify-start text-ink-2 hover:text-debit"
        >
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
