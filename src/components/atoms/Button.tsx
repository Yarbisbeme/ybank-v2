import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LeafWave } from './LeafWave';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-control font-sans whitespace-nowrap transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-action text-action-ink hover:bg-action-press',
        secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-sunk',
        ghost: 'bg-transparent text-ink-2 hover:bg-surface-sunk hover:text-ink',
        danger: 'bg-debit text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 small',
        md: 'h-10 px-4 body-strong',
        lg: 'h-12 px-5 body-strong',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/** Flat YBank 2.0 action button with one primary ultramar action per view. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      loadingLabel,
      leftIcon,
      rightIcon,
      disabled,
      type = 'button',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = Boolean(disabled || loading);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {loading ? (
          <>
            <LeafWave
              size="sm"
              progress={65}
              tone={variant === 'primary' || variant === 'danger' ? 'current' : 'action'}
              className="w-5 shrink-0"
            />
            <span>{loadingLabel ?? children}</span>
          </>
        ) : (
          <>
            {leftIcon ? <span className="shrink-0 inline-flex">{leftIcon}</span> : null}
            <span>{children}</span>
            {rightIcon ? <span className="shrink-0 inline-flex">{rightIcon}</span> : null}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
