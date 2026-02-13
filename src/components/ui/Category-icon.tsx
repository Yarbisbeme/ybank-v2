'use client'; // Importante porque Iconify funciona en el cliente

import { Icon } from '@iconify/react';
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  iconName?: string | null;
  className?: string;
}

export function CategoryIcon({ iconName, className }: CategoryIconProps) {
  // Si no viene icono de la BD, mostramos uno genérico
  if (!iconName) {
    return <Icon icon="mdi:help-circle-outline" className={cn("w-5 h-5", className)} />;
  }

  const formattedIcon = iconName.replace('mdi-', 'mdi:');

  return (
    <Icon 
      icon={formattedIcon} 
      className={cn("w-5 h-5", className)} 
    />
  );
}