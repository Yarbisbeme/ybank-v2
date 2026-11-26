import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'empty' | 'error';
  className?: string;
}

/** Explicit empty or error state without decorative boxes or nested cards. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  tone = 'empty',
  className,
}: EmptyStateProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-10 px-6 text-center',
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex',
            tone === 'error' ? 'text-debit' : 'text-ink-2',
          )}
        >
          {icon}
        </span>
      ) : null}

      <div className="flex flex-col gap-1">
        <h3 className="title-s text-ink">{title}</h3>
        {description ? (
          <p className="small text-ink-2 max-w-sm">{description}</p>
        ) : null}
      </div>

      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
