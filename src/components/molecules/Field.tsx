import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Form field wrapper with sentence-case label, optional hint, and accessible error. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="label text-ink-2">
        {label}
        {required ? (
          <span className="text-debit ml-0.5" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="small text-debit">
          {error}
        </p>
      ) : hint ? (
        <p className="small text-ink-2">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** Flat YBank 2.0 text input with 1px hairline border and focus ring. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, invalid = false, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-10 w-full rounded-control bg-surface border px-3 body text-ink placeholder:text-ink-3 transition-colors duration-150 focus:border-action focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
          invalid ? 'border-debit' : 'border-line-strong',
          className,
        )}
        {...props}
      />
    );
  },
);

TextInput.displayName = 'TextInput';
