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
import { Button, Switch, formatMoney } from '@/components/atoms';
import { availableCredit, cardDebt } from '@/lib/credit-card';
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
  getAccountCardStyle,
  getCardBackgroundStyle,
  getCardHoloStyle,
  getCardTextTone,
  getCardTextureStyle,
  hexToWash,
  mapDbPatternToCardShape,
  toDbCardStyle,
  type CardBase,
  type CardFinish,
  type CardNetwork,
} from '@/components/organisms';
import AccountDetailsPanel from './AccountDetailsPanel';

type EditorTab = 'datos' | 'base' | 'color' | 'forma' | 'acabado';

const EDITOR_TABS: { id: EditorTab; label: string }[] = [
  { id: 'datos', label: 'Datos' },
  { id: 'base', label: 'Base' },
  { id: 'color', label: 'Color' },
  { id: 'forma', label: 'Forma' },
  { id: 'acabado', label: 'Acabado' },
];

const BASE_OPTIONS: { id: CardBase; label: string; hint: string }[] = [
  { id: 'plana', label: 'Plana', hint: 'Color sólido limpio para copiar tu tarjeta física' },
  { id: 'degradado', label: 'Degradado', hint: 'Transición suave entre dos tonos' },
  { id: 'materia', label: 'Materia', hint: 'Relieve sutil y luz interactiva al mover el cursor' },
];

const PATTERN_OPTIONS: { id: CustomPattern; label: string }[] = [
  { id: 'solid', label: 'Ninguna' },
  { id: 'geometric', label: 'Geometría' },
  { id: 'dots', label: 'Puntos' },
  { id: 'curve', label: 'Curvas' },
  { id: 'waves', label: 'Olas' },
  { id: 'lines', label: 'Líneas' },
  { id: 'mesh', label: 'Malla' },
];

const INTENSITY_OPTIONS: { value: 0 | 1 | 2; label: string }[] = [
  { value: 0, label: 'Sutil' },
  { value: 1, label: 'Media' },
  { value: 2, label: 'Fuerte' },
];

const FINISH_OPTIONS: { id: CardFinish; label: string; status: string }[] = [
  { id: 'mate', label: 'Mate', status: 'Disponible' },
  { id: 'metal', label: 'Metálico', status: 'Vista previa · al registrarte 30 días' },
  { id: 'holo', label: 'Holográfico', status: 'Vista previa · al cumplir 1 presupuesto' },
];

const NETWORK_OPTIONS: { value: CardNetwork; label: string }[] = [
  { value: 'VISA', label: 'VISA' },
  { value: 'Mastercard', label: 'Mastercard' },
  { value: '', label: 'Ninguna' },
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

/** Five-tab YBank 2.0 card designer ("Datos · Base · Color · Forma · Acabado"). */
export default function AccountFormWrapper({
  initialData,
  institutions,
  onSuccess,
}: AccountFormWrapperProps) {
  const isEditing = Boolean(initialData?.id);
  const [activeTab, setActiveTab] = useState<EditorTab>('datos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: saveAccount } = useSaveAccount();

  // Seeded from the stored account so editing starts from what was saved;
  // a new card gets the same defaults as the database columns.
  const [initialStyle] = useState(() => getAccountCardStyle(initialData ?? {}));
  const [cardBase, setCardBase] = useState<CardBase>(initialStyle.base);
  const [secondaryColor, setSecondaryColor] = useState<string>(
    initialStyle.secondaryColor ?? CARD_PALETTE.tinta,
  );
  const [shapeIntensity, setShapeIntensity] = useState<0 | 1 | 2>(
    initialStyle.shapeIntensity,
  );
  const [cardFinish, setCardFinish] = useState<CardFinish>(initialStyle.finish);
  const [network, setNetwork] = useState<CardNetwork>(initialStyle.network);

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
  // Credit cards are edited by what is left; the debt follows (available - limit).
  const [availableInput, setAvailableInput] = useState(() => {
    const available = availableCredit(Number(initialData?.current_balance || 0), initialData?.credit_limit);
    return available === null ? '' : String(available);
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
      setAvailableInput(isPassive && accountData.credit_limit ? String(accountData.credit_limit) : '');
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

  // Changing only the limit keeps the debt: what is left moves with it.
  const handleLimitChange = (raw: string) => {
    const limit = Number(sanitizeAmountInput(raw)) || null;
    handlePatch({ credit_limit: limit });
    const available = availableCredit(Number(accountData.current_balance || 0), limit);
    setAvailableInput(available === null ? '' : String(available));
  };

  const handleAvailableChange = (raw: string) => {
    const sanitized = sanitizeAmountInput(raw);
    setAvailableInput(sanitized);
    const limit = Number(accountData.credit_limit) || 0;
    if (limit > 0) {
      const balance = (Number(sanitized) || 0) - limit;
      handlePatch({ current_balance: balance, initial_balance: balance });
    }
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
      setActiveTab('datos');
      return;
    }
    if (
      accountData.type !== 'cash' &&
      !accountData.institution_id &&
      !accountData.institution?.id
    ) {
      toast.error('Selecciona una institución financiera.');
      setActiveTab('datos');
      return;
    }

    if (accountData.type === 'credit_card' && !(Number(accountData.credit_limit) > 0)) {
      toast.error('Ingresa el límite de crédito de la tarjeta.');
      setActiveTab('datos');
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
        available_balance:
          accountData.type === 'credit_card' && availableInput !== ''
            ? Number(availableInput)
            : undefined,
        is_active: accountData.is_active ?? true,
        color: accountData.color,
        custom_pattern: accountData.custom_pattern,
        custom_text_theme: accountData.custom_text_theme,
        expiry_date: accountData.expiry_date || undefined,
        cutoff_day: accountData.cutoff_day || undefined,
        ...toDbCardStyle(
          {
            base: cardBase,
            secondaryColor,
            shapeIntensity,
            finish: cardFinish,
            network,
          },
          { isCash: accountData.type === 'cash' },
        ),
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
  const stageHint =
    cardFinish !== 'mate'
      ? `Vista previa · ${FINISH_OPTIONS.find((f) => f.id === cardFinish)?.status.toLowerCase() ?? ''}`
      : cardBase === 'plana'
        ? 'Plana: ideal para copiar tu tarjeta física'
        : 'Pasa el cursor para ver cómo le da la luz';

  return (
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div
              style={{ backgroundColor: hexToWash(accountData.color, 0.14) }}
              className="rounded-panel p-5 flex flex-col items-center gap-3 transition-colors duration-250"
            >
              <div className="max-w-sm w-full">
                <YCard
                  name={accountData.name || 'Nueva tarjeta'}
                  balance={accountData.current_balance}
                  creditLimit={accountData.credit_limit}
                  currency={accountData.currency}
                  accountType={accountData.type}
                  bankName={accountData.institution?.name}
                  bankLogoUrl={accountData.institution?.logo_url}
                  last4={isCash ? '0000' : accountData.last_4_digits}
                  network={network}
                  base={cardBase}
                  color={accountData.color}
                  secondaryColor={secondaryColor}
                  shape={mapDbPatternToCardShape(accountData.custom_pattern)}
                  shapeIntensity={shapeIntensity}
                  finish={cardFinish}
                />
              </div>
              <p className="small text-ink-2 text-center">{stageHint}</p>
            </div>

                  <div
                    role="tablist"
                    aria-label="Opciones de diseño de tarjeta"
                    className="flex items-center gap-1 overflow-x-auto border-b border-line pb-2.5"
                  >
                    {EDITOR_TABS.map((tab) => {
                      const selected = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            'h-8.5 px-3.5 rounded-control small whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                            selected
                              ? 'bg-ink text-canvas'
                              : 'text-ink-2 hover:bg-surface-sunk hover:text-ink',
                          )}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {activeTab === 'datos' ? (
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Nombre de la tarjeta" htmlFor="acc-name" required>
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

                        {accountData.type === 'credit_card' ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Límite de crédito *" htmlFor="acc-credit-limit">
                                <AmountInput
                                  id="acc-credit-limit"
                                  currency={accountData.currency}
                                  value={accountData.credit_limit ? String(accountData.credit_limit) : ''}
                                  placeholder="0.00"
                                  onChange={handleLimitChange}
                                />
                              </Field>
                              <Field label="Balance disponible" htmlFor="acc-available">
                                <AmountInput
                                  id="acc-available"
                                  currency={accountData.currency}
                                  value={availableInput}
                                  placeholder="0.00"
                                  onChange={handleAvailableChange}
                                />
                              </Field>
                            </div>
                            <p className="small text-ink-2 tabular-nums" aria-live="polite">
                              {Number(accountData.credit_limit) > 0
                                ? `Deuda: ${formatMoney(cardDebt(Number(accountData.current_balance || 0)), { currency: accountData.currency })}`
                                : 'Ingresa el límite para calcular cuánto te queda.'}
                            </p>
                          </div>
                        ) : (
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
                        )}

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

                      {!isCash ? (
                        <div className="flex flex-col gap-1.5">
                          <span className="label text-ink-2">Red de la tarjeta</span>
                          <div className="grid grid-cols-3 gap-2">
                            {NETWORK_OPTIONS.map((opt) => {
                              const active = network === opt.value;
                              return (
                                <button
                                  key={opt.label}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() => setNetwork(opt.value)}
                                  className={cn(
                                    'h-10 rounded-control border small transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                                    active
                                      ? 'border-ink bg-ink text-canvas'
                                      : 'border-line-strong bg-surface text-ink hover:bg-surface-sunk',
                                  )}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <AccountDetailsPanel
                        data={accountData}
                        onChange={handlePatch}
                        isEditing={isEditing}
                      />
                    </div>
                  ) : null}

                  {activeTab === 'base' ? (
                    <div className="flex flex-col gap-3">
                      <p className="label text-ink-2">Cómo se construye la superficie</p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {BASE_OPTIONS.map((opt) => {
                          const selected = cardBase === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => setCardBase(opt.id)}
                              className={cn(
                                'flex h-24 flex-col items-center justify-center gap-2 rounded-tile bg-surface p-2 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                                selected
                                  ? 'border-2 border-ink'
                                  : 'border border-line hover:border-line-strong',
                              )}
                            >
                              <span
                                style={getCardBackgroundStyle({
                                  base: opt.id,
                                  color: accountData.color,
                                  secondaryColor,
                                })}
                                className={cn(
                                  'h-9 w-14 rounded-control',
                                  opt.id === 'materia' && 'y2-card-materia-shadow',
                                )}
                              />
                              <span className="label text-ink">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="small text-ink-2">
                        {BASE_OPTIONS.find((b) => b.id === cardBase)?.hint}
                      </p>
                    </div>
                  ) : null}

                  {activeTab === 'color' ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="label text-ink-2">Color principal</span>
                        <div className="grid grid-cols-6 gap-2.5">
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
                                  'aspect-square flex items-center justify-center rounded-control transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                                  isSelected
                                    ? 'border-2 border-ink scale-105'
                                    : 'border border-line-strong',
                                )}
                              >
                                {isSelected ? (
                                  <Check
                                    size={16}
                                    strokeWidth={2.5}
                                    className={isDarkInk ? 'text-lime-ink' : 'text-white'}
                                  />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                          {cardBase === 'degradado' ? (
                            <div className="flex flex-col gap-2">
                              <span className="label text-ink-2">Segundo color del degradado</span>
                              <div className="grid grid-cols-6 gap-2.5">
                                {Object.entries(CARD_PALETTE).map(([key, hex]) => {
                                  const isSelected =
                                    secondaryColor.toLowerCase() === hex.toLowerCase();
                                  const isDarkInk = getCardTextTone(hex) === 'dark';

                                  return (
                                    <button
                                      key={`sec-${key}`}
                                      type="button"
                                      aria-label={`Segundo color ${key}`}
                                      aria-pressed={isSelected}
                                      style={{ backgroundColor: hex }}
                                      onClick={() => setSecondaryColor(hex)}
                                      className={cn(
                                        'aspect-square flex items-center justify-center rounded-control transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                                        isSelected
                                          ? 'border-2 border-ink scale-105'
                                          : 'border border-line-strong',
                                      )}
                                    >
                                      {isSelected ? (
                                        <Check
                                          size={16}
                                          strokeWidth={2.5}
                                          className={isDarkInk ? 'text-lime-ink' : 'text-white'}
                                        />
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>
      ) : null}

                        {activeTab === 'forma' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="label text-ink-2">Forma encima del color</span>
            <div className="grid grid-cols-4 gap-2">
              {PATTERN_OPTIONS.map((pattern) => {
                const active = accountData.custom_pattern === pattern.id;
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handlePatch({ custom_pattern: pattern.id })}
                    className={cn(
                      'h-16 rounded-tile bg-surface label transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                      active
                        ? 'border-2 border-ink text-ink'
                        : 'border border-line text-ink-2 hover:text-ink',
                    )}
                  >
                    {pattern.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="label text-ink-2">Intensidad</span>
            <div className="grid grid-cols-3 gap-2">
              {INTENSITY_OPTIONS.map((lvl) => {
                const active = shapeIntensity === lvl.value;
                return (
                  <button
                    key={lvl.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setShapeIntensity(lvl.value)}
                    className={cn(
                      'h-10 rounded-control border small transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                      active
                        ? 'border-ink bg-ink text-canvas'
                        : 'border-line-strong bg-surface text-ink hover:bg-surface-sunk',
                    )}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
                  ) : null}

                    {activeTab === 'acabado' ? (
                      <div className="flex flex-col gap-2.5">
                        <p className="label text-ink-2">Se aplica sobre cualquier base y forma</p>
                        {FINISH_OPTIONS.map((fin) => {
                          const active = cardFinish === fin.id;
                          const swatchStyle =
                            fin.id === 'holo'
                              ? getCardHoloStyle(35, 30)
                              : {
                                ...getCardBackgroundStyle({
                                  base: 'materia',
                                  color: accountData.color,
                                  finish: fin.id,
                                }),
                                ...getCardTextureStyle(fin.id),
                              };

                          return (
                            <button
                              key={fin.id}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setCardFinish(fin.id)}
                              className={cn(
                                'flex items-center gap-3 rounded-tile bg-surface p-3 text-left transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2',
                                active
                                  ? 'border-2 border-ink'
                                  : 'border border-line hover:border-line-strong',
                              )}
                            >
                              <span
                                style={swatchStyle}
                                className="h-8 w-12 shrink-0 rounded-control border border-line"
                              />
                              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="body-strong text-ink">{fin.label}</span>
                                  <span
                                    className={cn(
                                      'small',
                                      fin.id === 'mate' ? 'text-credit' : 'text-pending',
                                    )}
                                  >
                                    {fin.status}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

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
