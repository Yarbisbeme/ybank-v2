'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  filterSelectOptions,
  getNextEnabledIndex,
  type SearchSelectOption,
} from './search-select';

export interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  'aria-label'?: string;
  emptyText?: string;
  className?: string;
}

/** Accessible searchable combobox/listbox replacing legacy SearchableDropdown (U3). */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  disabled = false,
  invalid = false,
  id,
  'aria-label': ariaLabel,
  emptyText = 'Sin resultados',
  className,
}: SearchSelectProps) {
  const generatedId = useId();
  const inputId = id ?? `search-select-${generatedId}`;
  const listboxId = `${inputId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);
  const filteredOptions = filterSelectOptions(options, query);

  const resolvedActiveIndex =
    highlightedIndex >= 0 &&
    highlightedIndex < filteredOptions.length &&
    !filteredOptions[highlightedIndex]?.disabled
      ? highlightedIndex
      : getNextEnabledIndex(filteredOptions, -1, 'first');

  const activeOption =
    isOpen && resolvedActiveIndex >= 0
      ? filteredOptions[resolvedActiveIndex]
      : undefined;

  const openMenu = () => {
    if (disabled) {
      return;
    }
    setIsOpen(true);
    setQuery('');
    const selectedIdx = options.findIndex(
      (opt) => opt.id === value && !opt.disabled,
    );
    setHighlightedIndex(
      selectedIdx >= 0 ? selectedIdx : getNextEnabledIndex(options, -1, 'first'),
    );
  };

  const closeMenu = () => {
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
  };

  const selectOption = (optionId: string) => {
    onChange(optionId);
    closeMenu();
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          setHighlightedIndex(
            getNextEnabledIndex(filteredOptions, resolvedActiveIndex, 1),
          );
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          setHighlightedIndex(
            getNextEnabledIndex(filteredOptions, resolvedActiveIndex, -1),
          );
        }
        break;
      }
      case 'Home': {
        if (isOpen) {
          event.preventDefault();
          setHighlightedIndex(
            getNextEnabledIndex(filteredOptions, resolvedActiveIndex, 'first'),
          );
        }
        break;
      }
      case 'End': {
        if (isOpen) {
          event.preventDefault();
          setHighlightedIndex(
            getNextEnabledIndex(filteredOptions, resolvedActiveIndex, 'last'),
          );
        }
        break;
      }
      case 'Enter': {
        if (isOpen && activeOption && !activeOption.disabled) {
          event.preventDefault();
          selectOption(activeOption.id);
        }
        break;
      }
      case 'Escape': {
        if (isOpen) {
          event.preventDefault();
          closeMenu();
        }
        break;
      }
      case 'Tab': {
        if (isOpen) {
          closeMenu();
        }
        break;
      }
    }
  };

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      <div
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-control border bg-surface px-3 transition-colors duration-150 focus-within:border-action',
          invalid ? 'border-debit' : 'border-line-strong',
          disabled && 'opacity-50',
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder}
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={
            activeOption ? `${listboxId}-opt-${activeOption.id}` : undefined
          }
          aria-invalid={invalid || undefined}
          placeholder={isOpen && selectedOption ? selectedOption.label : placeholder}
          value={isOpen ? query : selectedOption?.label ?? ''}
          onFocus={openMenu}
          onChange={(e) => {
            if (!isOpen) {
              setIsOpen(true);
            }
            const nextQuery = e.target.value;
            setQuery(nextQuery);
            const nextFiltered = filterSelectOptions(options, nextQuery);
            setHighlightedIndex(getNextEnabledIndex(nextFiltered, -1, 'first'));
          }}
          onKeyDown={handleKeyDown}
          className="w-full min-w-0 bg-transparent border-none outline-none body text-ink placeholder:text-ink-3 focus:outline-none disabled:cursor-not-allowed truncate"
        />

        {!isOpen && selectedOption?.subLabel ? (
          <span className="small text-ink-2 shrink-0 whitespace-nowrap">
            {selectedOption.subLabel}
          </span>
        ) : null}

        <button
          type="button"
          disabled={disabled}
          tabIndex={-1}
          aria-label={isOpen ? 'Cerrar opciones' : 'Abrir opciones'}
          onClick={() => {
            if (isOpen) {
              closeMenu();
            } else {
              inputRef.current?.focus();
              openMenu();
            }
          }}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-chip text-ink-2 hover:bg-surface-sunk hover:text-ink transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={cn(
              'transition-transform duration-150',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </div>

      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel ?? placeholder}
          className="absolute left-0 top-full mt-1.5 w-full max-h-60 overflow-y-auto rounded-panel border border-line-strong bg-surface-raised py-1 shadow-overlay z-dropdown"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-3 text-center small text-ink-2">{emptyText}</li>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected = opt.id === value;
              const isHighlighted = index === resolvedActiveIndex;
              const isDisabled = Boolean(opt.disabled);

              return (
                <li
                  key={opt.id}
                  id={`${listboxId}-opt-${opt.id}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled || undefined}
                  onMouseEnter={() => {
                    if (!isDisabled) {
                      setHighlightedIndex(index);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!isDisabled) {
                      selectOption(opt.id);
                    }
                  }}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2 transition-colors duration-150',
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer',
                    isHighlighted && !isDisabled && 'bg-surface-sunk',
                    isSelected && 'text-action',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="body-strong text-ink truncate">
                      {opt.label}
                    </span>
                    {opt.subLabel ? (
                      <span className="small text-ink-2 shrink-0 whitespace-nowrap">
                        {opt.subLabel}
                      </span>
                    ) : null}
                  </div>
                  {isSelected ? (
                    <Check size={16} strokeWidth={2} className="text-action shrink-0" />
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
