'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/atoms';
import { NAV_ITEMS, isRouteActive } from './nav-items';

export interface BottomNavProps {
  onNewTransaction: () => void;
  className?: string;
}

/** Mobile bottom navigation bar matching YBank 2.0 spacing and active ink state. */
export function BottomNav({ onNewTransaction, className }: BottomNavProps) {
  const pathname = usePathname();
  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2, 4);

  return (
    <nav
      aria-label="Navegación móvil"
      className={cn(
        'y2-vt-bottom-nav md:hidden fixed inset-x-0 bottom-0 z-sticky border-t border-line bg-surface px-2 pb-2 pt-1.5',
        className,
      )}
    >
      <div className="grid grid-cols-5 items-center gap-1">
        {leftItems.map((item) => {
          const active = isRouteActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-control py-1.5 nav transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                active ? 'text-ink font-semibold' : 'text-ink-2 hover:text-ink',
              )}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="truncate">{item.mobileLabel ?? item.label}</span>
            </Link>
          );
        })}

        <div className="flex items-center justify-center">
          <IconButton
            variant="primary"
            size="lg"
            aria-label="Registrar movimiento"
            onClick={onNewTransaction}
            className="h-13 w-13 rounded-tile"
          >
            <Plus size={22} strokeWidth={2.2} />
          </IconButton>
        </div>

        {rightItems.map((item) => {
          const active = isRouteActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-control py-1.5 nav transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                active ? 'text-ink font-semibold' : 'text-ink-2 hover:text-ink',
              )}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="truncate">{item.mobileLabel ?? item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
