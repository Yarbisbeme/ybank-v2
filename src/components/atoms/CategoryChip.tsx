import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CategoryChipProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

/** Compact category or tag chip with chip-level radius and optional native actions. */
export function CategoryChip({
  label,
  icon,
  active = false,
  onClick,
  onRemove,
  disabled = false,
  className,
}: CategoryChipProps) {
  const baseClasses = cn(
    'inline-flex items-center gap-1.5 rounded-chip border px-2 py-1 label transition-colors duration-150',
    active
      ? 'border-action bg-action-wash text-action'
      : 'border-line bg-surface-sunk text-ink',
    disabled && 'opacity-50',
    className,
  );

  if (onClick && !onRemove) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        className={cn(
          baseClasses,
          !disabled && 'cursor-pointer hover:border-line-strong',
          'focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
        )}
      >
        {icon ? <span className="shrink-0 inline-flex">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <span className={baseClasses}>
      {icon ? <span className="shrink-0 inline-flex">{icon}</span> : null}
      <span className="truncate">{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Quitar ${label}`}
          className="inline-flex h-4 w-4 items-center justify-center rounded-chip text-ink-2 hover:bg-surface hover:text-ink transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-1"
        >
          <X size={12} strokeWidth={2} />
        </button>
      ) : null}
    </span>
  );
}
