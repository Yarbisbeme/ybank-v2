'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

/** Accessible segmented radiogroup with sunk track and crisp active surface. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  size = 'md',
  fullWidth = false,
  className,
}: SegmentedProps<T>) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const enabledIndices = options
      .map((opt, idx) => (!opt.disabled ? idx : -1))
      .filter((idx) => idx !== -1);

    if (enabledIndices.length === 0) {
      return;
    }

    const pos = enabledIndices.indexOf(currentIndex);
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = enabledIndices[(pos + 1) % enabledIndices.length];
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex =
        enabledIndices[(pos - 1 + enabledIndices.length) % enabledIndices.length];
    } else if (event.key === 'Home') {
      nextIndex = enabledIndices[0];
    } else if (event.key === 'End') {
      nextIndex = enabledIndices[enabledIndices.length - 1];
    }

    if (nextIndex !== undefined) {
      event.preventDefault();
      buttonRefs.current[nextIndex]?.focus();
      onChange(options[nextIndex].value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-tile border border-line bg-surface-sunk p-1',
        fullWidth && 'w-full',
        className,
      )}
    >
      {options.map((opt, index) => {
        const isActive = opt.value === value;
        const isDisabled = Boolean(opt.disabled);

        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-control font-sans whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
              size === 'sm' ? 'h-7 px-2.5 small' : 'h-8 px-3 label',
              fullWidth && 'flex-1',
              isActive
                ? 'bg-surface text-ink border border-line'
                : 'border border-transparent text-ink-2 hover:text-ink',
              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            )}
          >
            {opt.icon ? <span className="shrink-0 inline-flex">{opt.icon}</span> : null}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
