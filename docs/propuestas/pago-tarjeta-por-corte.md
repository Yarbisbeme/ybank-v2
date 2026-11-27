# Propuesta: Cálculo de pago al corte de tarjetas de crédito

> **Estado:** Especificación lista para implementar en una rama dedicada (`feat/credit-card-statement`).  
> **Motivo:** En la UI actual de `/accounts` («Requiere tu atención»), la alerta temporal de tarjeta de crédito mostraba la deuda total acumulada (`creditUsed`) en lugar del monto real exigible según el ciclo de corte y pago.

---

## 1. Problema de producto y reglas financieras

En una tarjeta de crédito conviven **dos ciclos distintos** que no pueden mezclarse:

1. **Ciclo ya cortado (pago exigible actual):**
   * Incluye el balance acumulado hasta el último corte (`last_cutoff_date`, contemplando `initial_balance` y cualquier saldo arrastrado de ciclos previos), **menos** los pagos/abonos registrados después de ese corte.
2. **Ciclo en curso (post-corte):**
   * Compras y cargos con fecha posterior a `last_cutoff_date`.
   * Reducen el **Disponible** del límite hoy, pero **no forman parte del pago de este período**; pasarán al próximo estado de cuenta.

**Comportamiento esperado:**
* Si la tarjeta cortó el día 10 con `DOP 8,000` y entre el 11 y el 27 el usuario gastó `DOP 5,000`, el pago exigible sigue siendo `DOP 8,000` (no `DOP 13,000`).
* Si el usuario ya abonó `DOP 8,000` después del día 10, `statement_due` pasa a **`0`** y la alerta de pago desaparece automáticamente, aunque haya consumos nuevos en el ciclo actual.

---

## 2. Por qué debe vivir en Postgres (`AGENTS.md` §5)

1. **Paginación y filtros en cliente:** `useTransactionsList()` trabaja paginado y sujeto a los filtros activos; calcular saldos al corte en el frontend sobre el arreglo en memoria produciría montos incompletos o falsos.
2. **Reutilización Web + Móvil y aritmética exacta:** toda aritmética financiera debe ejecutarse en Postgres con tipo `numeric`, exponiendo un resultado consistente para Next.js y las futuras apps móviles.

---

## 3. Contrato Backend (Supabase / Postgres)

Crear una nueva migración en `supabase/migrations/` con una función RPC de solo lectura:

```sql
get_credit_card_statement_summary(p_account_id uuid DEFAULT NULL)
```

### Requisitos técnicos de la función
* **`SECURITY INVOKER`:** respeta RLS y filtra por el usuario autenticado (`auth.uid()`), más filtro opcional `p_account_id` si no es `NULL`.
* **Zona horaria local RD:** la fecha de referencia "hoy" debe calcularse como `(now() AT TIME ZONE 'America/Santo_Domingo')::date` (`AGENTS.md` §9).
* **Clamping de fechas de fin de mes:** si `cutoff_day` o `payoff_day` es `29`, `30` o `31`, ajustarlo al último día real del mes correspondiente (ej. `28`/`29` en febrero).
* **Aritmética en `numeric`:** cero redondeos flotantes.

### Esquema de salida por tarjeta activa (`type = 'credit_card'`)

| Campo | Tipo TS | Definición |
|---|---|---|
| `account_id` | `string` | ID de la tarjeta en `accounts`. |
| `last_cutoff_date` | `string` (`YYYY-MM-DD`) | Última fecha de corte `<= hoy`. |
| `next_cutoff_date` | `string` (`YYYY-MM-DD`) | Próxima fecha de corte `> last_cutoff_date`. |
| `payoff_date` | `string \| null` (`YYYY-MM-DD`) | Fecha límite de pago del ciclo de `last_cutoff_date` según `accounts.payoff_day` (`null` si no está configurado). |
| `days_until_cutoff` | `number` | Días calendario desde `hoy` hasta `next_cutoff_date`. |
| `days_until_payoff` | `number \| null` | Días calendario desde `hoy` hasta `payoff_date` (negativo si ya venció). |
| `statement_balance` | `number` | Deuda reconstruida al cierre de `last_cutoff_date` (`>= 0`, partiendo de `initial_balance` + movimientos `<= last_cutoff_date`). |
| `payments_since_cutoff` | `number` | Suma de pagos/abonos con `date > last_cutoff_date` (`>= 0`). |
| `statement_due` | `number` | `GREATEST(0, statement_balance - payments_since_cutoff)` — **monto real pendiente de pago del corte**. |
| `current_cycle_spend` | `number` | Consumos cargados con `date > last_cutoff_date` (próximo corte). |
| `is_overdue` | `boolean` | `statement_due > 0 AND payoff_date IS NOT NULL AND payoff_date < hoy`. |

### Reglas de movimientos para reconstruir `statement_balance` y `payments_since_cutoff`
* **Cargas a la tarjeta (`expense` y `transfer` salientes desde la tarjeta):** aumentan deuda.
* **Pagos/abonos a la tarjeta:**
  * Transferencias recibidas (`transfer_to_account_id = card.id`): usar `COALESCE(target_amount, amount)` para soportar pagos desde cuentas en otra moneda (ej. `USD` → `DOP`).
  * Movimientos de tipo `income` o `payment` acreditados directamente a `card.id`.
* **Sub-transacciones:** respetar las mismas reglas del ledger para no duplicar montos entre padres e hijos (`is_split_child`).

---

## 4. Qué necesita el Frontend para integrarlo

1. **Tipos de esquema (`npm run db:types` + [`src/types/index.ts`](../../src/types/index.ts)):**
   * Exponer `payoff_day?: number | null` en la interfaz `Account` (la columna ya existe en Supabase según `database.types.ts`).
2. **Cache key factory y hook (sin Server Actions para lecturas — `AGENTS.md` §5):**
   * Crear una factory (ej. `src/lib/credit-statement-keys.ts` o extender una dedicada) y un hook `useCreditCardStatements()` que llame a `getSupabaseBrowserClient().rpc('get_credit_card_statement_summary')`.
   * Invalidar la clave cuando se cree, edite o elimine una transacción o cuando se edite una tarjeta (`cutoff_day` / `payoff_day` / `credit_limit`).
3. **Formulario de tarjeta (`AccountModal`):**
   * Agregar el campo **Día límite de pago** (`payoff_day`, entero 1–31) junto a **Día de corte** (`cutoff_day`) cuando `type === 'credit_card'`.
4. **UI en [`AccountInsightSection.tsx`](../../src/components/accounts/AccountInsightSection.tsx) («Requiere tu atención»):**
   * **Si `statement_due > 0`:** mostrar `Pago al corte ({last_cutoff_date})`, subtítulo con `payoff_date` (`Vence el X · faltan N días` en `--pending` si `days_until_payoff <= 5`, o `Vencido hace N días` en `--debit` si `is_overdue`) y el monto **`statement_due`**.
   * **Si `statement_due === 0`:** omitir alerta de pago (pasar a `Estado · Al día`, opcionalmente indicando `Próximo corte el {next_cutoff_date}`).
5. **Reutilización opcional en `/dashboard` ([`CreditHealthBento.tsx`](../../src/components/dashboard/CreditHealthBento.tsx)):**
   * Reemplazar la aproximación cliente `30 - today + day` por `days_until_cutoff` / `days_until_payoff` provenientes del mismo hook.

---

## 5. Criterios de verificación antes de abrir PR

* [ ] Pruebas SQL en `supabase/tests/` contra Supabase local verificando:
  * Consumos previos al corte vs. posteriores al corte (`current_cycle_spend` aislado de `statement_due`).
  * Pago parcial y pago total después del corte (incluyendo transferencia `USD` → `DOP` usando `target_amount`).
  * Deuda arrastrada desde `initial_balance` y ciclos previos.
  * Meses de 28/29/30 días (febrero / abril) y corte el día actual (`last_cutoff_date = hoy`).
  * Aislamiento RLS entre usuarios.
* [ ] `npm run typecheck`, `npm test` y `npm run build` en verde.
