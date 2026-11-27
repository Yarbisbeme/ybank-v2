import {
  ArrowLeftRight,
  CreditCard,
  Home,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
}

/** Productive application routes exposed across Sidebar, BottomNav, and MobileNavDrawer. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/accounts', label: 'Cuentas', mobileLabel: 'Tarjetas', icon: CreditCard },
  { href: '/transactions', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/settings', label: 'Ajustes', mobileLabel: 'Tú', icon: Settings },
];

export function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
