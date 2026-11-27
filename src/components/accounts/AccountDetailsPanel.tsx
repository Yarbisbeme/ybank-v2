'use client';

import type { EditCreateAccount } from '@/types';
import { AmountInput, Field, TextInput } from '@/components/molecules';

export interface AccountDetailsPanelProps {
  data: EditCreateAccount;
  onChange: (patch: Partial<EditCreateAccount>) => void;
  isEditing: boolean;
}

/** Supplementary credit card settings and read-only audit timestamps. */
export default function AccountDetailsPanel({
  data,
  onChange,
  isEditing,
}: AccountDetailsPanelProps) {
  const isCreditCard = data.type === 'credit_card';

  const handleCutoffChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits === '') {
      onChange({ cutoff_day: null });
      return;
    }
    const clamped = Math.min(Math.max(parseInt(digits, 10), 1), 31);
    onChange({ cutoff_day: clamped });
  };

  if (!isCreditCard && !(isEditing && data.created_at && data.updated_at)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {isCreditCard ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Límite de crédito" htmlFor="acc-credit-limit">
            <AmountInput
              id="acc-credit-limit"
              currency={data.currency}
              value={data.credit_limit ? String(data.credit_limit) : ''}
              placeholder="0.00"
              onChange={(val) =>
                onChange({ credit_limit: val ? Number(val) : null })
              }
            />
          </Field>

          <Field label="Día de corte (1–31)" htmlFor="acc-cutoff-day">
            <TextInput
              id="acc-cutoff-day"
              inputMode="numeric"
              maxLength={2}
              value={data.cutoff_day ? String(data.cutoff_day) : ''}
              placeholder="Ej. 15"
              onChange={(e) => handleCutoffChange(e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {isEditing && data.created_at && data.updated_at ? (
        <div className="grid grid-cols-2 gap-4 border-t border-line pt-3">
          <div>
            <p className="nav text-ink-2">Creada</p>
            <p className="small text-ink tabular-nums">
              {new Date(data.created_at).toLocaleDateString('es-DO')}
            </p>
          </div>
          <div>
            <p className="nav text-ink-2">Actualizada</p>
            <p className="small text-ink tabular-nums">
              {new Date(data.updated_at).toLocaleDateString('es-DO')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
