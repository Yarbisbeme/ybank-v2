'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import type {
  AccountType,
  CustomPattern,
  EditCreateAccount,
  Institution,
} from '@/types';
import { ACCOUNT_TYPES, cn } from '@/lib/utils';
import { useSaveAccount } from '@/hooks/useCatalogs';
import { Button, Switch } from '@/components/atoms';
import {
  AmountInput,
  Field,
  SearchSelect,
  Segmented,
  TextInput,
  sanitizeAmountInput,
} from '@/components/molecules';
import {
  CARD_PALETTE,
  YCard,
  getCardTextTone,
  mapDbPatternToCardShape,
} from '@/components/organisms';
import AccountDetailsPanel from './AccountDetailsPanel';

const PATTERN_OPTIONS: { id: CustomPattern; label: string }[] = [
  { id: 'solid', label: 'Sin trama' },
  { id: 'geometric', label: 'Geométrica' },
  { id: 'waves', label: 'Olas' },
  { id: 'dots', label: 'Puntos' },
  { id: 'curve', label: 'Curvas' },
  { id: 'lines', label: 'Líneas' },
  { id: 'mesh', label: 'Malla' },
];

const CURRENCY_OPTIONS: { value: 'DOP' | 'USD'; label: string }[] = [
  { value: 'DOP', label: 'DOP' },
  { value: 'USD', label: 'USD' },
];

export interface AccountFormWrapperProps {
  initialData?: EditCreateAccount;
  institutions: Institution[];
  onSuccess?: () => void;
}

/** Account create/edit form with live 5-layer YCard preview and palette customization. */
export default function AccountFormWrapper({
  initialData,
  institutions,
  onSuccess,
}: AccountFormWrapperProps) {
  const isEditing = Boolean(initialData?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: saveAccount } = useSaveAccount();

  const [accountData, setAccountData] = useState<EditCreateAccount>(() => {
    if (initialData) {
      return {
        ...initialData,
        color:
          initialData.color ||
          initialData.institution?.brand_color_primary ||
          CARD_PALETTE.tinta,
        custom_pattern:
          initialData.custom_pattern ||
          initialData.institution?.card_pattern ||
          'geometric',
        custom_text_theme:
          initialData.custom_text_theme ||
          initialData.institution?.text_theme ||
          'light',
      };
    }

    return {
      name: '',
      type: 'savings',
      currency: 'DOP',
      color: CARD_PALETTE.ultramar,
      custom_pattern: 'geometric',
      custom_text_theme: 'light',
      current_balance: 0,
      initial_balance: 0,
      last_4_digits: '',
      institution: null,
      institution_id: null,
      is_active: true,
    };
  });

  const [balanceInput, setBalanceInput] = useState(() => {
    const val = Math.abs(Number(initialData?.current_balance || 0));
    return val === 0 ? '' : String(val);
  });

  const handlePatch = (patch: Partial<EditCreateAccount>) => {
    setAccountData((prev) => ({ ...prev, ...patch }));
  };

  const handleTypeChange = (nextType: string) => {
    const typed = nextType as AccountType;
    const isPassive = typed === 'credit_card';
    const wasPassive = accountData.type === 'credit_card';

    const patch: Partial<EditCreateAccount> = { type: typed };
    if (typed === 'cash') {
      patch.institution_id = null;
      patch.institution = null;
      patch.last_4_digits = null;
      patch.expiry_date = null;
    }
    if (isPassive !== wasPassive) {
      patch.current_balance = 0;
      patch.initial_balance = 0;
      setBalanceInput('');
    }
    handlePatch(patch);
  };

  const handleBalanceChange = (raw: string) => {
    const sanitized = sanitizeAmountInput(raw);
    setBalanceInput(sanitized);
    const num = Number(sanitized) || 0;
    const signed = accountData.type === 'credit_card' ? -Math.abs(num) : num;
    handlePatch({ current_balance: signed, initial_balance: signed });
  };

  const handleExpiryChange = (raw: string) => {
    let digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
      const month = Math.min(Math.max(parseInt(digits.slice(0, 2), 10), 1), 12);
      digits = String(month).padStart(2, '0') + digits.slice(2);
    }
    const formatted =
      digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    handlePatch({ expiry_date: formatted });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (!accountData.name.trim()) {
      toast.error('El nombre de la cuenta es obligatorio.');
      return;
    }
    if (
      accountData.type !== 'cash' &&
      !accountData.institution_id &&
      !accountData.institution?.id
    ) {
      toast.error('Selecciona una institución financiera.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: accountData.id,
        name: accountData.name,
        type: accountData.type,
        currency: accountData.currency,
        initial_balance: accountData.initial_balance ?? 0,
        current_balance: accountData.current_balance ?? 0,
        institution_id:
          accountData.institution_id || accountData.institution?.id || '',
        last_4_digits: accountData.last_4_digits || undefined,
        credit_limit: accountData.credit_limit || undefined,
        is_active: accountData.is_active ?? true,
        color: accountData.color,
        custom_pattern: accountData.custom_pattern,
        custom_text_theme: accountData.custom_text_theme,
        expiry_date: accountData.expiry_date || undefined,
        cutoff_day: accountData.cutoff_day || undefined,
      };

      await saveAccount(payload);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al guardar la configuración';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = ACCOUNT_TYPES.map((item) => ({
    id: item.id,
    label: item.label,
  }));

  const institutionOptions = institutions.map((inst) => ({
    id: inst.id,
    label: inst.name,
  }));

  const isCash = accountData.type === 'cash';

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="rounded-panel border border-line bg-surface-sunk p-4 sm:p-5 flex flex-col gap-4">
        <div className="max-w-sm w-full mx-auto">
          <YCard
            name={accountData.name || 'Nueva cuenta'}
            balance={accountData.current_balance}
            currency={accountData.currency}
            accountType={accountData.type}
            bankName={accountData.institution?.name}
            bankLogoUrl={accountData.institution?.logo_url}
            last4={isCash ? null : accountData.last_4_digits}
            color={accountData.color}
            secondaryColor={accountData.institution?.brand_color_secondary}
            shape={mapDbPatternToCardShape(accountData.custom_pattern)}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <div className="flex flex-col gap-1.5">
            <span className="label text-ink-2">Color de la tarjeta</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CARD_PALETTE).map(([key, hex]) => {
                const isSelected =
                  accountData.color.toLowerCase() === hex.toLowerCase();
                const isDarkInk = getCardTextTone(hex) === 'dark';

                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Color ${key}`}
                    aria-pressed={isSelected}
                    style={{ backgroundColor: hex }}
                    onClick={() =>
                      handlePatch({
                        color: hex,
                        custom_text_theme: getCardTextTone(hex),
                      })
                    }
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-chip border transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                      isSelected ? 'border-ink scale-110' : 'border-line-strong',
                    )}
                  >
                    {isSelected ? (
                      <Check
                        size={14}
                        strokeWidth={2.5}
                        className={isDarkInk ? 'text-lime-ink' : 'text-white'}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="label text-ink-2">Trama</span>
            <div className="flex flex-wrap gap-1.5">
              {PATTERN_OPTIONS.map((pattern) => {
                const active = accountData.custom_pattern === pattern.id;
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handlePatch({ custom_pattern: pattern.id })}
                    className={cn(
                      'rounded-control border px-2.5 py-1 small transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                      active
                        ? 'border-action bg-action-wash text-action'
                        : 'border-line bg-surface text-ink-2 hover:text-ink',
                    )}
                  >
                    {pattern.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre de la cuenta" htmlFor="acc-name" required>
          <TextInput
            id="acc-name"
            value={accountData.name}
            placeholder="Ej. Nómina Popular"
            onChange={(e) => handlePatch({ name: e.target.value })}
          />
        </Field>

        <Field label="Tipo de cuenta" htmlFor="acc-type" required>
          <SearchSelect
            id="acc-type"
            options={typeOptions}
            value={accountData.type}
            onChange={handleTypeChange}
            placeholder="Seleccionar tipo..."
          />
        </Field>

        {!isCash ? (
          <Field label="Institución financiera" htmlFor="acc-institution" required>
            <SearchSelect
              id="acc-institution"
              options={institutionOptions}
              value={accountData.institution_id || accountData.institution?.id || ''}
              onChange={(instId) => {
                const chosen = institutions.find((i) => i.id === instId) ?? null;
                handlePatch({
                  institution_id: instId,
                  institution: chosen,
                });
              }}
              placeholder="Buscar banco..."
            />
          </Field>
        ) : null}

        <Field label="Moneda" htmlFor="acc-currency">
          <Segmented<'DOP' | 'USD'>
            aria-label="Moneda de la cuenta"
            options={CURRENCY_OPTIONS}
            value={accountData.currency}
            onChange={(currency) => handlePatch({ currency })}
            fullWidth
          />
        </Field>

        <Field
          label={isEditing ? 'Balance actual' : 'Balance inicial'}
          htmlFor="acc-balance"
        >
          <AmountInput
            id="acc-balance"
            currency={accountData.currency}
            value={balanceInput}
            placeholder="0.00"
            onChange={handleBalanceChange}
          />
        </Field>

        {!isCash ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Últimos 4 dígitos" htmlFor="acc-last4">
              <TextInput
                id="acc-last4"
                inputMode="numeric"
                maxLength={4}
                value={accountData.last_4_digits || ''}
                placeholder="4288"
                onChange={(e) =>
                  handlePatch({
                    last_4_digits: e.target.value.replace(/\D/g, ''),
                  })
                }
              />
            </Field>

            <Field label="Vencimiento" htmlFor="acc-expiry">
              <TextInput
                id="acc-expiry"
                inputMode="numeric"
                maxLength={5}
                value={accountData.expiry_date || ''}
                placeholder="MM/AA"
                onChange={(e) => handleExpiryChange(e.target.value)}
              />
            </Field>
          </div>
        ) : null}
      </div>

      <AccountDetailsPanel
        data={accountData}
        onChange={handlePatch}
        isEditing={isEditing}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-line pt-4">
        {isEditing ? (
          <div className="flex items-center justify-between gap-3 rounded-tile border border-line bg-surface-sunk px-3.5 py-2.5 sm:flex-1">
            <div>
              <p className="body-strong text-ink">Cuenta activa</p>
              <p className="small text-ink-2">Visible en balances y filtros.</p>
            </div>
            <Switch
              checked={Boolean(accountData.is_active ?? true)}
              onCheckedChange={(checked) => handlePatch({ is_active: checked })}
              aria-label="Activar o desactivar cuenta"
            />
          </div>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          loadingLabel="Guardando..."
          className={isEditing ? 'sm:w-56' : 'w-full'}
        >
          {isEditing ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </div>
    </form>
  );
}
