import * as LucideIcons from 'lucide-react';
import React from 'react';

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
}

export const IconRenderer = ({ name, size = 18, className = "" }: IconRendererProps) => {
  // 💡 TRUCO DE TYPESCRIPT: Forzamos (cast) a que lo entienda como un Componente de React
  const IconComponent = (LucideIcons as any)[name] as React.ElementType;

  if (!IconComponent) {
    return <LucideIcons.HelpCircle size={size} className={className} />;
  }

  return <IconComponent size={size} className={className} />;
};