'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Hash, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryChip } from '@/components/atoms';

export interface TagOption {
  id: string;
  name: string;
}

export interface TagInputProps {
  availableTags: TagOption[];
  selectedTagIds: string[];
  onChange: (ids: string[]) => void;
  onCreateTag?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
}

/** Multi-tag combobox composed from CategoryChip atoms and an accessible suggestion list. */
export function TagInput({
  availableTags,
  selectedTagIds,
  onChange,
  onCreateTag,
  placeholder = 'Agregar etiquetas...',
  disabled = false,
  id,
  'aria-label': ariaLabel,
  className,
}: TagInputProps) {
  const generatedId = useId();
  const inputId = id ?? `tag-input-${generatedId}`;
  const listboxId = `${inputId}-listbox`;

  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTags = availableTags.filter((tag) =>
    selectedTagIds.includes(tag.id),
  );
  const trimmed = inputValue.trim();
  const normalizedQuery = trimmed.toLowerCase();

  const filteredTags = availableTags.filter(
    (tag) =>
      !selectedTagIds.includes(tag.id) &&
      tag.name.toLowerCase().includes(normalizedQuery),
  );

  const exactMatch = availableTags.find(
    (tag) => tag.name.toLowerCase() === normalizedQuery,
  );
  const canCreate = Boolean(onCreateTag && trimmed && !exactMatch);
  const totalOptions = filteredTags.length + (canCreate ? 1 : 0);
  const safeHighlight =
    highlightedIndex >= 0 && highlightedIndex < totalOptions
      ? highlightedIndex
      : totalOptions > 0
        ? 0
        : -1;

  const showDropdown = isOpen && totalOptions > 0 && !disabled;

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      onChange([...selectedTagIds, tagId]);
    }
    setInputValue('');
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const handleRemove = (tagId: string) => {
    onChange(selectedTagIds.filter((idValue) => idValue !== tagId));
  };

  const handleCreate = () => {
    if (!trimmed || !onCreateTag) {
      return;
    }
    onCreateTag(trimmed);
    setInputValue('');
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === 'ArrowDown' && totalOptions > 0) {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((safeHighlight + 1) % totalOptions);
      return;
    }

    if (event.key === 'ArrowUp' && totalOptions > 0) {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((safeHighlight - 1 + totalOptions) % totalOptions);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (event.key === 'Enter' || event.key === ',') {
      if (event.key === ',' && !trimmed) {
        return;
      }
      event.preventDefault();

      if (showDropdown && safeHighlight >= 0) {
        if (safeHighlight < filteredTags.length) {
          handleSelect(filteredTags[safeHighlight].id);
          return;
        }
        if (canCreate) {
          handleCreate();
          return;
        }
      }

      if (exactMatch && !selectedTagIds.includes(exactMatch.id)) {
        handleSelect(exactMatch.id);
      } else if (canCreate) {
        handleCreate();
      }
      return;
    }

    if (
      event.key === 'Backspace' &&
      !inputValue &&
      selectedTagIds.length > 0
    ) {
      onChange(selectedTagIds.slice(0, -1));
    }
  };

  const activeDescendant =
    showDropdown && safeHighlight >= 0
      ? `${listboxId}-opt-${safeHighlight}`
      : undefined;

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-control border border-line-strong bg-surface px-2.5 py-1.5 transition-colors duration-150 focus-within:border-action cursor-text',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {selectedTags.map((tag) => (
          <CategoryChip
            key={tag.id}
            label={tag.name}
            icon={<Hash size={12} strokeWidth={2} />}
            disabled={disabled}
            onRemove={disabled ? undefined : () => handleRemove(tag.id)}
          />
        ))}

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder}
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          value={inputValue}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-24 bg-transparent border-none outline-none body text-ink placeholder:text-ink-3 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {showDropdown ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Etiquetas sugeridas"
          className="absolute left-0 top-full mt-1.5 w-full max-h-48 overflow-y-auto rounded-panel border border-line-strong bg-surface-raised py-1 shadow-overlay z-dropdown"
        >
          {filteredTags.map((tag, index) => (
            <li
              key={tag.id}
              id={`${listboxId}-opt-${index}`}
              role="option"
              aria-selected={index === safeHighlight}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(tag.id);
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors duration-150',
                index === safeHighlight && 'bg-surface-sunk',
              )}
            >
              <Hash size={14} strokeWidth={2} className="text-ink-2 shrink-0" />
              <span className="body text-ink">{tag.name}</span>
            </li>
          ))}

          {canCreate ? (
            <li
              id={`${listboxId}-opt-${filteredTags.length}`}
              role="option"
              aria-selected={safeHighlight === filteredTags.length}
              onMouseEnter={() => setHighlightedIndex(filteredTags.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleCreate();
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 cursor-pointer border-t border-line text-action transition-colors duration-150',
                safeHighlight === filteredTags.length && 'bg-surface-sunk',
              )}
            >
              <Plus size={14} strokeWidth={2} className="shrink-0" />
              <span className="label">Crear etiqueta &ldquo;{trimmed}&rdquo;</span>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
