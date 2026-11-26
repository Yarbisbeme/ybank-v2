export interface SearchSelectOption {
  id: string;
  label: string;
  subLabel?: string;
  keywords?: string[];
  disabled?: boolean;
}

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Accent-insensitive substring filter across label, subLabel, and keywords. */
export function filterSelectOptions(
  options: SearchSelectOption[],
  query: string,
): SearchSelectOption[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return options;
  }

  return options.filter((opt) => {
    if (normalizeSearchText(opt.label).includes(normalized)) {
      return true;
    }
    if (opt.subLabel && normalizeSearchText(opt.subLabel).includes(normalized)) {
      return true;
    }
    if (opt.keywords?.some((kw) => normalizeSearchText(kw).includes(normalized))) {
      return true;
    }
    return false;
  });
}

/** Resolves the next non-disabled option index for keyboard navigation. */
export function getNextEnabledIndex(
  options: SearchSelectOption[],
  currentIndex: number,
  direction: 1 | -1 | 'first' | 'last',
): number {
  const count = options.length;
  if (count === 0) {
    return -1;
  }

  if (direction === 'first') {
    return options.findIndex((opt) => !opt.disabled);
  }

  if (direction === 'last') {
    for (let i = count - 1; i >= 0; i -= 1) {
      if (!options[i].disabled) {
        return i;
      }
    }
    return -1;
  }

  const start =
    currentIndex < 0 || currentIndex >= count
      ? direction === 1
        ? -1
        : 0
      : currentIndex;

  for (let step = 1; step <= count; step += 1) {
    const candidate = (start + direction * step + count * step) % count;
    if (!options[candidate].disabled) {
      return candidate;
    }
  }

  return -1;
}
