import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center shrink-0 rounded-control transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
  {
    variants: {
      variant: {
        ghost: 'bg-transparent text-ink-2 hover:bg-surface-sunk hover:text-ink',
        surface: 'bg-surface text-ink border border-line-strong hover:bg-surface-sunk',
        primary: 'bg-action text-action-ink hover:bg-action-press',
        danger: 'bg-transparent text-ink-2 hover:bg-surface-sunk hover:text-debit',
      },
      size: {
        sm: 'h-8 w-8',
        md: 'h-9 w-9',
        lg: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
);

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'>,
    VariantProps<typeof iconButtonVariants> {
  'aria-label': string;
}

/** Accessible icon-only button; requires an explicit aria-label. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, type = 'button', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
