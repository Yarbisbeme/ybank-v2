import { cn } from '@/lib/utils';

export type LeafWaveTone = 'action' | 'lime' | 'credit' | 'ink' | 'current';
export type LeafWaveSize = 'sm' | 'md' | 'lg';

export interface LeafWaveProps {
  progress?: number;
  tone?: LeafWaveTone;
  animate?: boolean;
  size?: LeafWaveSize;
  label?: string;
  className?: string;
}

const TONE_CLASSES: Record<LeafWaveTone, string> = {
  action: 'text-action',
  lime: 'text-lime',
  credit: 'text-credit',
  ink: 'text-ink',
  current: 'text-current',
};

const SIZE_CLASSES: Record<LeafWaveSize, string> = {
  sm: 'h-3 w-6',
  md: 'h-8 w-20',
  lg: 'h-16 w-full',
};

/** Brand wave surface communicating fill level, sync progress, or long waits. */
export function LeafWave({
  progress = 60,
  tone = 'action',
  animate = true,
  size = 'md',
  label,
  className,
}: LeafWaveProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuenow={label ? clamped : undefined}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-hidden={label ? undefined : true}
      className={cn(
        'relative overflow-hidden rounded-control bg-surface-sunk',
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        className,
      )}
    >
      <div
        className="absolute inset-x-0 bottom-0 transition-all duration-250 ease-out"
        style={{ height: `${clamped}%` }}
      >
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 h-full w-[200%] flex flex-col justify-end',
            animate && 'animate-leaf-wave',
          )}
        >
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-3 shrink-0 block"
          >
            <path
              d="M0,70 C150,15 300,110 450,60 C600,10 750,110 900,60 C1050,15 1125,90 1200,70 L1200,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
          <div className="w-full flex-1 bg-current" />
        </div>
      </div>
    </div>
  );
}
