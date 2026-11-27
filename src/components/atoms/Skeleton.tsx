import { cn } from '@/lib/utils';

export type SkeletonVariant = 'line' | 'tile' | 'panel' | 'card';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  label?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  line: 'h-4 w-full rounded-chip',
  tile: 'h-12 w-full rounded-tile',
  panel: 'h-32 w-full rounded-panel',
  card: 'w-full aspect-iso-card rounded-card',
};

/** Content-shaped loading placeholder replacing generic spinners. */
export function Skeleton({
  variant = 'line',
  label,
  className,
}: SkeletonProps) {
  return (
    <div
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'bg-surface-sunk animate-skeleton',
        VARIANT_CLASSES[variant],
        className,
      )}
    />
  );
}
