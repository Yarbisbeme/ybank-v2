import { describe, expect, it } from 'vitest';
import {
  filterSelectOptions,
  getNextEnabledIndex,
  type SearchSelectOption,
} from './search-select';

const OPTIONS: SearchSelectOption[] = [
  { id: '1', label: 'Alimentación', subLabel: 'Supermercado', keywords: ['comida', 'colmadón'] },
  { id: '2', label: 'Transporte', subLabel: 'Combustible', disabled: true },
  { id: '3', label: 'Educación', subLabel: 'Universidad' },
  { id: '4', label: 'Salud', subLabel: 'Farmacia', disabled: true },
];

describe('filterSelectOptions', () => {
  it('matches accent-insensitively across label, subLabel, and keywords', () => {
    expect(filterSelectOptions(OPTIONS, 'alimentacion').map((o) => o.id)).toEqual(['1']);
    expect(filterSelectOptions(OPTIONS, 'universidad').map((o) => o.id)).toEqual(['3']);
    expect(filterSelectOptions(OPTIONS, 'colmadon').map((o) => o.id)).toEqual(['1']);
  });

  it('returns all options when query is blank', () => {
    expect(filterSelectOptions(OPTIONS, '   ')).toHaveLength(4);
  });
});

describe('getNextEnabledIndex', () => {
  it('skips disabled options and wraps forward and backward', () => {
    expect(getNextEnabledIndex(OPTIONS, -1, 'first')).toBe(0);
    expect(getNextEnabledIndex(OPTIONS, -1, 'last')).toBe(2);
    expect(getNextEnabledIndex(OPTIONS, 0, 1)).toBe(2);
    expect(getNextEnabledIndex(OPTIONS, 2, 1)).toBe(0);
    expect(getNextEnabledIndex(OPTIONS, 0, -1)).toBe(2);
  });

  it('returns -1 when empty or all options are disabled', () => {
    expect(getNextEnabledIndex([], 0, 1)).toBe(-1);
    expect(
      getNextEnabledIndex(
        [
          { id: 'a', label: 'A', disabled: true },
          { id: 'b', label: 'B', disabled: true },
        ],
        -1,
        'first',
      ),
    ).toBe(-1);
  });
});
