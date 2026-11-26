'use client';

import { useRef, useState } from 'react';
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

const CREST_PATH =
  'M0 80 C34.0 29.0 172.0 31.1 200 80 C234.0 131.0 372.0 128.9 400 80 C434.0 29.0 572.0 31.1 600 80 C634.0 131.0 772.0 128.9 800 80 V200 H0Z';

/** Accessible segmented radiogroup with inverted-ink active pill and brand leaf wave. */
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
  const [waveTick, setWaveTick] = useState(0);

  const selectValue = (next: T) => {
    if (next !== value) {
      setWaveTick((prev) => prev + 1);
    }
    onChange(next);
  };

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
      selectValue(options[nextIndex].value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-control bg-surface-sunk p-0.5',
        fullWidth && 'flex w-full',
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
            onClick={() => selectValue(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative overflow-hidden inline-flex items-center justify-center rounded-chip font-sans whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
              size === 'sm' ? 'h-7 px-2.5 small' : 'h-8 px-3 label',
              fullWidth && 'flex-1',
              isActive
                ? 'bg-ink text-canvas'
              : 'text-ink-2 hover:text-ink',
              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            )
      }
          >
            {
    isActive && waveTick > 0 ? (
      <span key={waveTick} aria-hidden="true" className="y2-seg-wave">
        <svg
          className="y2-seg-crest"
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
        >
          <path d={CREST_PATH} />
        </svg>
      </span>
    ) : null
  }
  <span className="relative z-10 inline-flex items-center gap-1.5">
    {opt.icon ? <span className="shrink-0 inline-flex">{opt.icon}</span> : null}
    <span>{opt.label}</span>
  </span>
          </button >
        );
})}
    </div >
  );
}
