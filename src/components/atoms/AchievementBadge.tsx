import { cn } from '@/lib/utils';

export interface AchievementBadgeProps {
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

/** Static achievement badge; exclusive surface for the --lime accent token. */
export function AchievementBadge({
  label,
  icon,
  className,
}: AchievementBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-chip bg-lime text-lime-ink px-2 py-0.5 label',
        className,
      )}
    >
      {icon ? <span className="shrink-0 inline-flex">{icon}</span> : null}
      <span>{label}</span>
    </span>
  );
}
