import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
// src/utils/card-mapper.tsx
import { Account } from '@/types';
import BancoBHDCard from '@/components/Tarjetas/BhdCard';
import BanreservasWorldElite from '@/components/Tarjetas/BanreservasWordElite';
import PopularCard from '@/components/Tarjetas/PopularCard';
import ApapCard from '@/components/Tarjetas/ApapCard';
import AccountCard from '@/components/Tarjetas/AccountCard';
import ScotiaCard from "@/components/Tarjetas/ScotiaCard";
import LafiseCard from "@/components/Tarjetas/LafiseCard";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getAccountComponent = (account: Account) => {
  // Pasamos a minúsculas para una comparación insensible a mayúsculas
  const name = account.name.toLowerCase();

  /**
   * Priorizamos por coincidencias de palabras clave.
   * Esto cubrirá casos como "Visa Popular (DOP)", "Ahorros BHD", etc.
   */

  if (name.includes('popular')) {
    return <PopularCard account={account} />;
  }

  if (name.includes('bhd')) {
    return <BancoBHDCard account={account} />;
  }

  if (name.includes('reservas') || name.includes('banreservas')) {
    return <BanreservasWorldElite account={account} />;
  }

  if (name.includes('apap')) {
    return <ApapCard account={account} />;
  }

  if (name.includes('scotiabank')) {
    return <ScotiaCard account={account} />;
  }

  if (name.includes('lafise')) {
    return <LafiseCard account={account} />;
  }
  // Si tienes tarjetas de Scotiabank o Lafise pero aún no el diseño premium,
  // la tarjeta genérica AccountCard hará el trabajo sucio.
  return <AccountCard account={account} />;
};