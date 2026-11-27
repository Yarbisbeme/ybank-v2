'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, YMark } from '@/components/atoms';
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

/** Fixed 240px canvas sidebar with inverted-ink active item and bottom primary CTA. */
export function Sidebar({
  onNewTransaction,
  onSignOut,
  className,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navegación principal"
      className={cn(
        'flex h-full w-60 shrink-0 flex-col gap-7 border-r border-line bg-canvas px-4 py-6',
        className,
      )}
    >
        <div className="px-3">
          <Link
            href="/dashboard"
            aria-label="YBank Inicio"
            className="inline-flex items-center rounded-control focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
          >
            <YMark lockup size={30} />
          </Link>
        </div>

          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isRouteActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-control px-3 body-strong transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                    active
                        ? 'bg-ink text-canvas'
                        : 'text-ink-2 hover:bg-surface-sunk hover:text-ink',
                  )}
                >
                  <Icon size={18} strokeWidth={2} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

            <div className="mt-auto flex flex-col gap-2">
              <Button
                variant="primary"
                fullWidth
                leftIcon={<Plus size={18} strokeWidth={2.2} />}
                onClick={onNewTransaction}
              >
                Registrar movimiento
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={onSignOut}
                className="justify-start px-3 text-ink-2 hover:text-debit"
              >
                Cerrar sesión
              </Button>
            </div>
          </aside>
          );
}
