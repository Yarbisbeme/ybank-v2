import { z } from 'zod'

export function getFirstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Dato inválido'
}

export const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().min(1, 'El nombre es requerido').max(100),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

// Card style values stored in the DB (English; Spanish labels live in the UI).
// Single source for the UI pickers; mirrored by CHECK constraints in
// supabase/migrations/20261127100600_accounts_card_style.sql.
export const CARD_BASES = ['flat', 'gradient', 'textured'] as const
export const CARD_FINISHES = ['matte', 'metal', 'holo'] as const
export const CARD_NETWORKS = ['visa', 'mastercard'] as const
export const CARD_SHAPE_INTENSITIES = [0, 1, 2] as const
export type CardBaseValue = (typeof CARD_BASES)[number]
export type CardFinishValue = (typeof CARD_FINISHES)[number]
export type CardNetworkValue = (typeof CARD_NETWORKS)[number]
export type CardShapeIntensityValue = (typeof CARD_SHAPE_INTENSITIES)[number]

const accountFieldsSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50),
  institution_id: z.string().uuid().nullable().optional(),
  type: z.enum(['checking', 'savings', 'credit_card', 'investment', 'cash']),
  currency: z.enum(['DOP', 'USD']),
  initial_balance: z.number().finite(),
  last_4_digits: z.string().regex(/^\d{0,4}$/, 'Deben ser 0-4 dígitos').optional(),
  credit_limit: z.number().positive('El límite debe ser mayor que 0').finite().optional(),
  // Credit cards: what is left of the limit. The DB derives the debt (available - limit).
  available_balance: z.number().finite().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color HEX inválido').optional(),
  color_secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color HEX inválido').nullable().optional(),
  custom_pattern: z.enum(['solid', 'waves', 'geometric', 'mesh', 'lines', 'dots', 'curve']).optional(),
  custom_text_theme: z.enum(['light', 'dark']).optional(),
  card_base: z.enum(CARD_BASES).optional(),
  card_shape_intensity: z.number().int().min(0).max(2).optional(),
  card_finish: z.enum(CARD_FINISHES).optional(),
  network: z.enum(CARD_NETWORKS).nullable().optional(),
  expiry_date: z.string().optional(),
  cutoff_day: z.coerce.number().int().min(1).max(31).optional(),
  is_active: z.boolean(),
})

export const CREDIT_LIMIT_REQUIRED = 'El límite de crédito es obligatorio para tarjetas de crédito'

// A credit card without a limit cannot show what is left, so the limit is required.
export const createAccountSchema = accountFieldsSchema.superRefine((v, ctx) => {
  if (v.type === 'credit_card' && !v.credit_limit) {
    ctx.addIssue({ code: 'custom', path: ['credit_limit'], message: CREDIT_LIMIT_REQUIRED })
  }
})

// Balances are not account fields once the account exists: the initial balance is fixed and
// the current balance is changed through set_account_balance() (an "Ajuste de saldo").
// The limit rule needs the stored account, so updateAccount checks it.
export const updateAccountSchema = accountFieldsSchema
  .omit({ initial_balance: true })
  .partial()
  .extend({ current_balance: z.number().finite().optional() })

export const transactionItemSchema = z.object({
  name: z.string().optional(),
  unit_price: z.coerce.number().finite().nonnegative(),
  quantity: z.coerce.number().int().positive().optional(),
  category_id: z.string().uuid().nullable().optional(),
})

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer', 'payment']),
  amount: z.coerce.number().positive('El monto debe ser positivo').finite(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha inválida (YYYY-MM-DD)'),
  note: z.string().max(500).optional(),
  accountId: z.string().uuid('Cuenta inválida'),
  categoryId: z.string().uuid().nullable().optional(),
  destinationAccountId: z.string().uuid().nullable().optional(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'mobile_pay', 'check', 'direct_debit', 'other']).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  items: z.array(transactionItemSchema).optional(),
})

export const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer', 'payment']).optional(),
  amount: z.coerce.number().positive().finite().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  note: z.string().max(500).optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  destinationAccountId: z.string().uuid().nullable().optional(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'mobile_pay', 'check', 'direct_debit', 'other']).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  items: z.array(transactionItemSchema).optional(),
})

export const completeOnboardingSchema = z.object({
  fullName: z.string().min(1, 'El nombre es requerido').max(100),
  // Email sign-ups skip the password step and the form sends ''. Treat it as "not provided".
  password: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  ),
  currency: z.enum(['DOP', 'USD']),
  primaryAccountId: z.string().uuid().optional(),
})
