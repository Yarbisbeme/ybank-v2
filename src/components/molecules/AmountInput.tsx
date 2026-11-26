'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { CurrencyCode } from '@/components/atoms';
import { sanitizeAmountInput } from './amount-input';

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: CurrencyCode;
  onCurrencyChange?: (currency: CurrencyCode) => void;
  variant?: 'field' | 'hero';
  size?: 'md' | 'lg';
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  className?: string;
}

/** Tabular monetary input with field box or centered open hero typography. */
export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  (
    {
      value,
      onChange,
      currency = 'DOP',
      onCurrencyChange,
      variant = 'field',
      size = 'md',
      id,
      placeholder = '0.00',
      invalid = false,
      disabled = false,
      'aria-label': ariaLabel,
      onKeyDown,
      className,
    },
    ref,
  ) => {
    const nextCurrency: CurrencyCode = currency === 'DOP' ? 'USD' : 'DOP';

    if (variant === 'hero') {
      return (
        <div
          className={cn(
            'flex flex-col items-center py-3',
            disabled && 'opacity-50',
            className,
          )}
        >
          <div
            className={cn(
              'inline-flex items-baseline justify-center gap-2 border-b pb-2 transition-colors duration-150',
              invalid ? 'border-debit' : 'border-line focus-within:border-action',
            )}
          >
            {onCurrencyChange ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onCurrencyChange(nextCurrency)}
                aria-label={`Cambiar moneda a ${nextCurrency}`}
                className="title-s text-action hover:text-action-press shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2 rounded-chip"
              >
                {currency}
              </button>
            ) : (
              <span className="title-s text-ink-2 shrink-0 select-none">
                {currency}
              </span>
            )}

            <input
              ref={ref}
              id={id}
              type="text"
              inputMode="decimal"
              value={value}
              disabled={disabled}
              placeholder={placeholder}
              aria-label={ariaLabel}
              aria-invalid={invalid || undefined}
              onKeyDown={onKeyDown}
              onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
              className="amount-hero-input w-48 sm:w-64 bg-transparent border-none outline-none text-center text-ink placeholder:text-ink-3 focus:outline-none disabled:cursor-not-allowed"
            />
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex items-center rounded-control bg-surface border transition-colors duration-150 focus-within:border-action',
          size === 'lg' ? 'h-12 px-3.5' : 'h-11 px-3',
          invalid ? 'border-debit' : 'border-line-strong',
          disabled && 'opacity-50',
          className,
        )}
      >
        {onCurrencyChange ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onCurrencyChange(nextCurrency)}
            aria-label={`Cambiar moneda a ${nextCurrency}`}
            className="label text-action hover:text-action-press pr-2.5 mr-2.5 border-r border-line shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2 rounded-chip"
          >
            {currency}
          </button>
        ) : (
          <span className="label text-ink-2 pr-2.5 mr-2.5 border-r border-line shrink-0 select-none">
            {currency}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          onKeyDown={onKeyDown}
          onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
          className={cn(
            'w-full bg-transparent border-none outline-none tabular-nums text-ink placeholder:text-ink-3 focus:outline-none disabled:cursor-not-allowed',
            size === 'lg' ? 'money-card' : 'amount',
          )}
        />
      </div>
    );
  },
);

AmountInput.displayName = 'AmountInput';
