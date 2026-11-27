import { describe, expect, it } from 'vitest';
import { resolveMovePresentation, type MoveRowData } from './move-row';

describe('resolveMovePresentation', () => {
  it('formats expense with ink tone, negative sign, local date, and item count (U2)', () => {
    const tx: MoveRowData = {
      id: 'tx-1',
      type: 'expense',
      description: 'Compra supermercado',
      date: '2026-11-25T14:30:00Z',
      amount: 2450,
      account_id: 'acc-1',
      category: { name: 'Alimentación' },
      account: { name: 'Ahorro Popular', currency: 'DOP' },
      items: [
        { id: 'i1', name: 'Leche', unit_price: 120 },
        { id: 'i2', name: 'Pan', unit_price: 85 },
      ],
    };

    const result = resolveMovePresentation(tx, 'acc-1');
    expect(result.displayType).toBe('expense');
    expect(result.tone).toBe('expense');
    expect(result.sign).toBe('negative');
    expect(result.displayAmount).toBe(2450);
    expect(result.itemCountLabel).toBe('2 ítems');
    expect(result.subtitle).toBe('Alimentación');
    expect(result.formattedDate).toMatch(/^25 nov/i);
  });

  it('handles incoming vs outgoing transfers by activeAccountId', () => {
    const transfer: MoveRowData = {
      id: 'tx-2',
      type: 'transfer',
      description: 'Cambio a USD',
      date: '2026-11-25',
      amount: 6000,
      target_amount: 100,
      account_id: 'acc-dop',
      transfer_to_account_id: 'acc-usd',
      account: { id: 'acc-dop', name: 'Cuenta DOP', currency: 'DOP' },
      transfer_to_account: { id: 'acc-usd', name: 'Cuenta USD', currency: 'USD' },
    };

    const outgoing = resolveMovePresentation(transfer, 'acc-dop');
    expect(outgoing.displayType).toBe('expense');
    expect(outgoing.displayAmount).toBe(6000);
    expect(outgoing.displayCurrency).toBe('DOP');
    expect(outgoing.subtitle).toBe('Hacia Cuenta USD');

    const incoming = resolveMovePresentation(transfer, 'acc-usd');
    expect(incoming.displayType).toBe('income');
    expect(incoming.sign).toBe('positive');
    expect(incoming.tone).toBe('income');
    expect(incoming.displayAmount).toBe(100);
    expect(incoming.displayCurrency).toBe('USD');
    expect(incoming.subtitle).toBe('Desde Cuenta DOP');
  });

  it('treats split children as expenses without sub-items', () => {
    const child: MoveRowData = {
      id: 'tx-3',
      type: 'income',
      description: 'Detalle',
      date: '2026-11-25',
      amount: 350,
      account_id: 'acc-1',
      is_split_child: true,
      items: [{ id: 'ignored', name: 'X', unit_price: 350 }],
    };

    const result = resolveMovePresentation(child, 'acc-1');
    expect(result.displayType).toBe('expense');
    expect(result.items).toHaveLength(0);
    expect(result.itemCountLabel).toBeNull();
  });
});
