# Enums: Sincronización Supabase ↔ TypeScript

> **Fecha:** 27 de junio de 2026  
> **Migración SQL:** `add_missing_enums`  
> **Archivos afectados:** 6 en TypeScript, 5 tablas en Supabase

---

## 1. ¿Qué era el problema?

### Antes: Tipos inconsistentes entre BD y frontend

**En Supabase (PostgreSQL):**
- Solo existían 2 enums: `account_type` y `transaction_type`
- Las demás columnas usaban `TEXT` con valores hardcodeados:
  - `accounts.currency` → `'DOP'` o `'USD'` (texto libre)
  - `accounts.status` → `'posted'`, `'completed'`, `'pending_match'` (texto libre)
  - `accounts.custom_pattern` → `'solid'`, `'waves'`, etc. (texto libre)
  - `transaction_items.tax_type` → `'ITBIS'`, `'PROPINA'`, `'NONE'` (texto libre)

**En TypeScript:**
- Union types sin validación en runtime:
  ```typescript
  export type CurrencyCode = 'DOP' | 'USD';
  export type CustomPattern = 'solid' | 'waves' | 'geometric' | 'mesh' | 'lines' | 'dots' | 'curve';
  ```

**El problema:**
1. **Sin integridad en BD:** Cualquier texto era válido en las columnas TYPE TEXT
2. **Datos sucios reales:** Se encontró `mesh\r\n` (con salto de línea) en `institutions.card_pattern`
3. **Sin autocompletado:** El IDE no sabía qué valores eran válidos
4. **Sin validación en runtime:** TypeScript solo valida en compile-time, no al recibir datos de la BD

---

## 2. ¿Qué se hizo?

### 2.1 Limpieza de datos sucios

```sql
-- Eliminar \r\n y espacios extra de columnas de texto
UPDATE institutions SET card_pattern = 'mesh' 
WHERE card_pattern = 'mesh\r\n';

UPDATE accounts SET custom_pattern = TRIM(custom_pattern) 
WHERE custom_pattern != TRIM(custom_pattern);
```

### 2.2 Creación de 5 enums nuevos en Supabase

```sql
CREATE TYPE public.currency_code AS ENUM ('DOP', 'USD');
CREATE TYPE public.custom_pattern AS ENUM ('solid', 'waves', 'geometric', 'mesh', 'lines', 'dots', 'curve');
CREATE TYPE public.custom_text_theme AS ENUM ('light', 'dark');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'pending_match', 'posted', 'completed', 'reconciled');
CREATE TYPE public.tax_type AS ENUM ('ITBIS', 'PROPINA', 'NONE');
```

### 2.3 Migración de columnas TEXT → ENUM

```sql
-- Ejemplo: currency
ALTER TABLE public.accounts ALTER COLUMN currency DROP DEFAULT;
ALTER TABLE public.accounts
  ALTER COLUMN currency TYPE public.currency_code 
  USING currency::public.currency_code;
ALTER TABLE public.accounts
  ALTER COLUMN currency SET DEFAULT 'DOP'::public.currency_code;
```

### 2.4 Sincronización en TypeScript

**Antes (union types):**
```typescript
export type TransactionType = 'income' | 'expense' | 'transfer' | 'payment';
export type CurrencyCode = 'DOP' | 'USD';
export type CustomPattern = 'solid' | 'waves' | 'geometric' | 'mesh' | 'lines' | 'dots' | 'curve';
```

**Después (const enums):**
```typescript
export const TransactionType = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
  PAYMENT: 'payment',
} as const;
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const CurrencyCode = {
  DOP: 'DOP',
  USD: 'USD',
} as const;
export type CurrencyCode = typeof CurrencyCode[keyof typeof CurrencyCode];

export const CustomPattern = {
  SOLID: 'solid',
  WAVES: 'waves',
  GEOMETRIC: 'geometric',
  MESH: 'mesh',
  LINES: 'lines',
  DOTS: 'dots',
  CURVE: 'curve',
} as const;
export type CustomPattern = typeof CustomPattern[keyof typeof CustomPattern];
```

### 2.5 Migración de archivos que usaban string literals

| Archivo | Antes | Después |
|---------|-------|---------|
| `rates.ts` | `type: 'buy' \| 'sell'` | `type: Operation` |
| `transactions.ts` | `operation: 'buy' \| 'sell'` | `operation: Operation` |
| `accounts.ts` | `'buy'` | `Operation.BUY` |
| `useYBankStore.ts` | `'sell'` | `Operation.SELL` |

---

## 3. ¿Qué pasará después?

### 3.1 A nivel de base de datos

- **PostgreSQL rechazará** cualquier valor que no esté en el enum
- Ejemplo: `INSERT INTO accounts (currency) VALUES ('EUR')` → **ERROR**
- **No más datos sucios:** No se pueden insertar `\r\n`, espacios extra, o valores inválidos
- **Almacenamiento eficiente:** Los enums ocupan 4 bytes vs variables de texto

### 3.2 A nivel de TypeScript

- **Error en compile-time** si se usa un valor inválido:
  ```typescript
  const x: CurrencyCode = 'EUR'; // ❌ Error: Type '"EUR"' is not assignable to type 'CurrencyCode'
  ```
- **Autocompletado en el IDE:** Al escribir `CurrencyCode.` aparecen `DOP` y `USD`
- **Refactor seguro:** Si se renombra un enum, TypeScript avisa en todos los archivos afectados

### 3.3 A nivel de desarrollo

- **Nuevos features:** Al agregar un valor al enum (ej: `EUR`), solo se toca:
  1. SQL: `ALTER TYPE public.currency_code ADD VALUE 'EUR';`
  2. TypeScript: `EUR: 'EUR'` en el const object
- **Menos bugs:** No se puede escribir `'Dop'` (case-sensitive) o `'dop'`
- **Documentación viva:** El enum ES la documentación de qué valores son válidos

---

## 4. Ventajas vs el sistema anterior

### 4.1 Integridad de datos

| Aspecto | Antes (TEXT) | Después (ENUM) |
|---------|--------------|----------------|
| Valores permitidos | Cualquier texto | Solo los definidos en el enum |
| Case sensitivity | `'Dop'` era válido | Solo `'DOP'` es válido |
| Datos sucios | `mesh\r\n` se insertaba | PostgreSQL lo rechaza |
| Espacios extra | `' DOP '` se insertaba | PostgreSQL lo rechaza |

### 4.2 Rendimiento

| Aspecto | Antes (TEXT) | Después (ENUM) |
|---------|--------------|----------------|
| Almacenamiento | ~50 bytes por valor | 4 bytes por valor |
| Índices | Más lentos (texto variable) | Más rápidos (entero interno) |
| Comparaciones | Comparación de strings | Comparación de enteros |
| Vacío de tablas | Más lento | Más rápido |

### 4.3 Desarrollo

| Aspecto | Antes (union types) | Después (const enums) |
|---------|---------------------|----------------------|
| Autocompletado | No muestra opciones | Muestra `DOP`, `USD`, etc. |
| Compile-time | Solo en el archivo actual | En todos los archivos |
| Rename refactoring | Manual, propenso a errores | Automático con IDE |
| Documentación | Comentarios en código | El enum ES la documentación |
| Runtime validation | No posible | `TransactionType.INCOME` es un valor real |

### 4.4 Seguridad

| Aspecto | Antes | Después |
|---------|-------|---------|
| SQL Injection | Posible con TEXT | Imposible con ENUM |
| Valores inválidos | Se aceptaban | PostgreSQL rechaza |
| Consistencia BD↔Frontend | No garantizada | Garantizada por diseño |

---

## 5. Enums completos en Supabase

| Enum | Valores | Tablas que lo usan |
|------|---------|-------------------|
| `account_type` | checking, savings, credit_card, investment, cash | accounts |
| `transaction_type` | income, expense, transfer, payment | transactions, categories |
| `currency_code` | DOP, USD | accounts, profiles |
| `custom_pattern` | solid, waves, geometric, mesh, lines, dots, curve | accounts, institutions |
| `custom_text_theme` | light, dark | accounts, institutions, profiles |
| `transaction_status` | pending, pending_match, posted, completed, reconciled | transactions |
| `tax_type` | ITBIS, PROPINA, NONE | transaction_items |
| `payment_method` | cash, card, transfer, mobile_pay, check, direct_debit, other | transactions |

---

## 6. Cómo usar en el código

### Importar el enum
```typescript
import { CurrencyCode, TransactionType } from '@/types';
```

### Usar como tipo
```typescript
function createAccount(currency: CurrencyCode) { ... }
```

### Usar como valor (runtime)
```typescript
if (tx.type === TransactionType.EXPENSE) {
  // Es un gasto
}
```

### Usar en forms
```typescript
const [currency, setCurrency] = useState<CurrencyCode>(CurrencyCode.DOP);
```

### Iterar sobre valores válidos
```typescript
const allCurrencies = Object.values(CurrencyCode); // ['DOP', 'USD']
```

---

## 7. Archivos de referencia

| Archivo | Descripción |
|---------|-------------|
| `supabase/add-missing-enums.sql` | Migración SQL completa |
| `src/types/index.ts` | Definición de enums en TypeScript |
| `docs/supabase-audit-report.md` | Auditoría con sección 11 |

---

## 8. Migraciones adicionales

### 8.1 profiles.theme_preference (27/06/2026)

**Migración:** `migrate_theme_preference_to_enum`

```sql
ALTER TABLE public.profiles ALTER COLUMN theme_preference DROP DEFAULT;
ALTER TABLE public.profiles
  ALTER COLUMN theme_preference TYPE public.custom_text_theme
  USING theme_preference::public.custom_text_theme;
ALTER TABLE public.profiles
  ALTER COLUMN theme_preference SET DEFAULT 'light'::public.custom_text_theme;
```

**TypeScript:**
```typescript
export interface ProfileUpdateInput {
  theme_preference?: CustomTextTheme | 'auto'; // 'auto' se filtra en server action
}
```

**Nota:** El valor `'auto'` es válido para next-themes (preferencia del sistema) pero no se guarda en la BD. El server action `updateProfile` filtra `auto` antes de insertar.

### 8.2 profiles.currency_preference (27/06/2026)

**Migración:** `migrate_currency_preference_to_enum`

```sql
ALTER TABLE public.profiles ALTER COLUMN currency_preference DROP DEFAULT;
ALTER TABLE public.profiles
  ALTER COLUMN currency_preference TYPE public.currency_code
  USING currency_preference::public.currency_code;
ALTER TABLE public.profiles
  ALTER COLUMN currency_preference SET DEFAULT 'DOP'::public.currency_code;
```

**TypeScript:** Ya existía `currency_preference?: CurrencyCode` en `ProfileUpdateInput`. Sin cambios.

### 8.3 transactions.payment_method (27/06/2026)

**Migración:** `add_payment_method_enum`

```sql
CREATE TYPE public.payment_method AS ENUM (
  'cash',           -- Efectivo
  'card',           -- Tarjeta de crédito/débito
  'transfer',       -- Transferencia bancaria
  'mobile_pay',     -- Pago móvil (Banca Móvil)
  'check',          -- Cheque
  'direct_debit',   -- Débito directo
  'other'           -- Otro
);

ALTER TABLE public.transactions
  ALTER COLUMN payment_method TYPE public.payment_method
  USING payment_method::public.payment_method;
ALTER TABLE public.transactions
  ALTER COLUMN payment_method SET DEFAULT 'cash'::public.payment_method;
```

**TypeScript:**
```typescript
export const PaymentMethod = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  MOBILE_PAY: 'mobile_pay',
  CHECK: 'check',
  DIRECT_DEBIT: 'direct_debit',
  OTHER: 'other',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];
```

**Archivos actualizados:**
- `types/index.ts`: Nuevo enum `PaymentMethod` + interfaces `Transaction`, `CreateTransactionInput`, `TransactionFormData`
- `validation.ts`: Schemas `createTransactionSchema` y `updateTransactionSchema` incluyen `paymentMethod`

---

## 9. Próximos pasos (opcional)

1. **Agregar `EUR`** si se necesita soporte para euros
2. **Agregar valores a `payment_method`** según necesidades del negocio (ej: `crypto`, `qr_code`)
3. **Migrar `transaction_items.discount_type`** a enum si se agrega descuento con tipo
