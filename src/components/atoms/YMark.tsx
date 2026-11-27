import { cn } from '@/lib/utils';

export type YMarkTone = 'action' | 'ink' | 'white' | 'current';
export type YMarkAnimation = 'none' | 'brote' | 'logro' | 'loop';

export interface YMarkProps {
  tone?: YMarkTone;
  animation?: YMarkAnimation;
  lockup?: boolean;
  size?: number;
  decorative?: boolean;
  className?: string;
}

const TONE_CLASSES: Record<YMarkTone, string> = {
  action: 'text-action',
  ink: 'text-ink',
  white: 'text-white',
  current: 'text-current',
};

const ANIMATION_CLASSES: Record<YMarkAnimation, string> = {
  none: '',
  brote: 'animate-ymark-brote',
  logro: 'animate-ymark-logro',
  loop: 'animate-ymark-loop',
};

/** Official two-leaf YBank mark and optional "YBank" wordmark lockup. */
export function YMark({
  tone = 'action',
  animation = 'none',
  lockup = false,
  size = 28,
  decorative = true,
  className,
}: YMarkProps) {
  const width = Math.round((size * 230) / 305);

  const svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="640 215 230 305"
      width={width}
      height={size}
      aria-hidden={lockup ? true : decorative ? true : undefined}
      role={lockup || decorative ? undefined : 'img'}
      aria-label={lockup || decorative ? undefined : 'YBank'}
      className={cn(
        'shrink-0',
        TONE_CLASSES[tone],
        ANIMATION_CLASSES[animation],
        !lockup && className,
      )}
    >
      <path
        fill="currentColor"
        d="M794.0 223.0 C945.6 309.2 812.3 573.2 653.0 495.0 C779.6 445.3 798.8 347.3 794.0 223.0Z"
      />
      <g transform="rotate(-15 700 350)" className="ymark-leaf-small">
        <path
          fill="currentColor"
          d="M651.0 223.0 C640.3 321.5 731.3 334.4 696.0 430.0 C803.7 374.2 754.0 245.0 651.0 223.0Z"
        />
      </g>
    </svg>
  );

  if (!lockup) {
    return svg;
  }

  return (
    <span
      className={cn('inline-flex items-baseline select-none', className)}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'YBank'}
    >
      {svg}
      <span
        className={cn(
          'ymark-word font-display font-extrabold tracking-tight leading-none',
          tone === 'white' ? 'text-white' : 'text-ink',
        )}
        style={{ fontSize: Math.round(size * 0.85) }}
      >
        Bank
      </span>
    </span>
  );
}
