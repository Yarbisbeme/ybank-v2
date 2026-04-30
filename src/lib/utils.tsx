import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
// src/utils/card-mapper.tsx
import { Account, AccountType } from '@/types';
import BancoBHDCard from '@/components/Tarjetas/BhdCard';
import BanreservasWorldElite from '@/components/Tarjetas/BanreservasWordElite';
import PopularCard from '@/components/Tarjetas/PopularCard';
import ApapCard from '@/components/Tarjetas/ApapCard';
import AccountCard from '@/components/Tarjetas/AccountCard';
import ScotiaCard from "@/components/Tarjetas/ScotiaCard";
import LafiseCard from "@/components/Tarjetas/LafiseCard";

import { 
  Activity,
  Banknote, Home, Utensils, Car, Film, HeartPulse, GraduationCap, 
  UserSquare2, Smartphone, Dog, LineChart, ShoppingBag, Plane,
  Briefcase, Gift, Receipt, Building, Zap, Wifi, Wrench, 
  ShoppingCart, ForkKnife, Bike, Fuel, CarTaxiFront, PenTool, Train, 
  MonitorPlay, Popcorn, Martini, Pill, Stethoscope, ShieldCheck, 
  Dumbbell, Scissors, Brush, Sparkles, MonitorSmartphone, Laptop, 
  Bone, Stethoscope as Vet, CircleDashed, Landmark, Percent, FileText,
  Shield, Shirt, Armchair, PlaneTakeoff, Bed, Bus, Tag,
  Wallet,
  CreditCard,
  Coins,
  TrendingUp // 💡 Aseguramos de usar TrendingUp para inversiones
} from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getAccountComponent = (account: Account) => {
  const name = account.name.toLowerCase();

  if (name.includes('popular')) return <PopularCard account={account} />;
  if (name.includes('bhd')) return <BancoBHDCard account={account} />;
  if (name.includes('reservas') || name.includes('banreservas')) return <BanreservasWorldElite account={account} />;
  if (name.includes('apap')) return <ApapCard account={account} />;
  if (name.includes('scotiabank')) return <ScotiaCard account={account} />;
  if (name.includes('lafise')) return <LafiseCard account={account} />;

  return <AccountCard account={account} />;
};

export const getTransactionStyles = (type: string) => {
    switch (type.toLowerCase()) {
      case 'income':
        return {
          amountColor: 'text-emerald-500', 
          amountPrefix: '+',
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-50'
        };
      case 'expense':
        return {
          amountColor: 'text-slate-800', 
          amountPrefix: '-',
          iconColor: 'text-slate-500',
          iconBg: 'bg-slate-100/80'
        };
      case 'transfer':
      default:
        return {
          amountColor: 'text-slate-800',
          amountPrefix: '',
          iconColor: 'text-slate-500',
          iconBg: 'bg-slate-100/80'
        };
    }
  };

export const getCategoryIcon = (iconName: string | undefined | null) => {
    if (!iconName) return <Tag size={18} strokeWidth={2.5} />;
    
    const name = iconName.toLowerCase();
    
    // Categorías Principales
    if (name === 'mdi-cash') return <Banknote size={18} strokeWidth={2.5} />;
    if (name === 'mdi-home') return <Home size={18} strokeWidth={2.5} />;
    if (name === 'mdi-food') return <Utensils size={18} strokeWidth={2.5} />;
    if (name === 'mdi-car') return <Car size={18} strokeWidth={2.5} />;
    if (name === 'mdi-movie') return <Film size={18} strokeWidth={2.5} />;
    if (name === 'mdi-heart-pulse') return <HeartPulse size={18} strokeWidth={2.5} />;
    if (name === 'mdi-school') return <GraduationCap size={18} strokeWidth={2.5} />;
    if (name === 'mdi-face-man-shimmer') return <UserSquare2 size={18} strokeWidth={2.5} />;
    if (name === 'mdi-cellphone') return <Smartphone size={18} strokeWidth={2.5} />;
    if (name === 'mdi-paw') return <Dog size={18} strokeWidth={2.5} />;
    if (name === 'mdi-finance') return <LineChart size={18} strokeWidth={2.5} />;
    if (name === 'mdi-shopping') return <ShoppingBag size={18} strokeWidth={2.5} />;
    if (name === 'mdi-airplane') return <Plane size={18} strokeWidth={2.5} />;

    // Subcategorías
    if (name === 'mdi-briefcase-account') return <Briefcase size={18} strokeWidth={2.5} />;
    if (name === 'mdi-gift' || name === 'mdi-gift-open') return <Gift size={18} strokeWidth={2.5} />;
    if (name === 'mdi-cash-refund') return <Receipt size={18} strokeWidth={2.5} />;
    if (name === 'mdi-home-city') return <Building size={18} strokeWidth={2.5} />;
    if (name === 'mdi-lightning-bolt') return <Zap size={18} strokeWidth={2.5} />;
    if (name === 'mdi-wifi') return <Wifi size={18} strokeWidth={2.5} />;
    if (name === 'mdi-hammer-wrench' || name === 'mdi-car-wrench') return <Wrench size={18} strokeWidth={2.5} />;
    if (name === 'mdi-cart') return <ShoppingCart size={18} strokeWidth={2.5} />;
    if (name === 'mdi-silverware-fork-knife') return <ForkKnife size={18} strokeWidth={2.5} />;
    if (name === 'mdi-moped') return <Bike size={18} strokeWidth={2.5} />;
    if (name === 'mdi-gas-station') return <Fuel size={18} strokeWidth={2.5} />;
    if (name === 'mdi-taxi') return <CarTaxiFront size={18} strokeWidth={2.5} />;
    if (name === 'mdi-train-car') return <Train size={18} strokeWidth={2.5} />;
    if (name === 'mdi-youtube-subscription') return <MonitorPlay size={18} strokeWidth={2.5} />;
    if (name === 'mdi-popcorn') return <Popcorn size={18} strokeWidth={2.5} />;
    if (name === 'mdi-glass-cocktail') return <Martini size={18} strokeWidth={2.5} />;
    if (name === 'mdi-pill') return <Pill size={18} strokeWidth={2.5} />;
    if (name === 'mdi-doctor') return <Stethoscope size={18} strokeWidth={2.5} />;
    if (name === 'mdi-shield-check') return <ShieldCheck size={18} strokeWidth={2.5} />;
    if (name === 'mdi-dumbbell') return <Dumbbell size={18} strokeWidth={2.5} />;
    if (name === 'mdi-tooth') return <Activity size={18} strokeWidth={2.5} />;
    if (name === 'mdi-certificate' || name === 'mdi-book-open-page-variant') return <FileText size={18} strokeWidth={2.5} />;
    if (name === 'mdi-content-cut') return <Scissors size={18} strokeWidth={2.5} />;
    if (name === 'mdi-lipstick') return <Brush size={18} strokeWidth={2.5} />;
    if (name === 'mdi-spa') return <Sparkles size={18} strokeWidth={2.5} />;
    if (name === 'mdi-cellphone-check') return <MonitorSmartphone size={18} strokeWidth={2.5} />;
    if (name === 'mdi-cloud') return <LineChart size={18} strokeWidth={2.5} />;
    if (name === 'mdi-laptop') return <Laptop size={18} strokeWidth={2.5} />;
    if (name === 'mdi-bone') return <Bone size={18} strokeWidth={2.5} />;
    if (name === 'mdi-medical-bag') return <Vet size={18} strokeWidth={2.5} />;
    if (name === 'mdi-tennis-ball') return <CircleDashed size={18} strokeWidth={2.5} />;
    if (name === 'mdi-bank-minus') return <Landmark size={18} strokeWidth={2.5} />;
    if (name === 'mdi-percent') return <Percent size={18} strokeWidth={2.5} />;
    if (name === 'mdi-file-document') return <FileText size={18} strokeWidth={2.5} />;
    if (name === 'mdi-shield-car') return <Shield size={18} strokeWidth={2.5} />;
    if (name === 'mdi-tshirt-crew') return <Shirt size={18} strokeWidth={2.5} />;
    if (name === 'mdi-sofa') return <Armchair size={18} strokeWidth={2.5} />;
    if (name === 'mdi-airplane-takeoff') return <PlaneTakeoff size={18} strokeWidth={2.5} />;
    if (name === 'mdi-bed') return <Bed size={18} strokeWidth={2.5} />;
    if (name === 'mdi-bus-side') return <Bus size={18} strokeWidth={2.5} />;
    if (name === 'mdi-tag') return <Tag size={18} strokeWidth={2.5} />;

    return <Activity size={18} strokeWidth={2.5} />;
  };

// ============================================================================
// 💡 NUEVO: Función utilitaria unificada para obtener íconos de nodos/cuentas
// ============================================================================
export const getNodeIcon = (type: string | undefined | null, size: number = 16) => {
  if (!type) return <Landmark size={size} strokeWidth={2.5} />;
  
  const normalizedType = type.toLowerCase();
  
  if (normalizedType.includes('credit') || normalizedType.includes('crédito')) {
    return <CreditCard size={size} strokeWidth={2.5} />;
  }
  if (normalizedType.includes('saving') || normalizedType.includes('ahorro')) {
    return <Wallet size={size} strokeWidth={2.5} />;
  }
  if (normalizedType.includes('investment') || normalizedType.includes('inversion')) {
    return <TrendingUp size={size} strokeWidth={2.5} />; // Cambiado a TrendingUp
  }
  if (normalizedType.includes('cash') || normalizedType.includes('efectivo')) {
    return <Coins size={size} strokeWidth={2.5} />;
  }
  if (normalizedType.includes('checking') || normalizedType.includes('corriente')) {
    return <Receipt size={size} strokeWidth={2.5} />;
  }
  
  return <Landmark size={size} strokeWidth={2.5} />;
};

export const ACCOUNT_TYPES: { id: AccountType; label: string; icon: React.ElementType }[] = [
  { id: 'savings', label: 'Ahorros', icon: Wallet },
  { id: 'checking', label: 'Corriente', icon: Receipt },
  { id: 'credit_card', label: 'Crédito', icon: CreditCard },
  { id: 'cash', label: 'Efectivo', icon: Coins },
  { id: 'investment', label: 'Inversión', icon: TrendingUp }, // 💡 Alineado con getNodeIcon
];