# 02 — Hallazgos en la base de datos (esquema real)

> Fuente: `supabase/migrations/20261125000000_baseline.sql`, volcado de producción del 2026-11-25.
> Los conteos salen de consultas agregadas de solo lectura (sin montos ni datos personales).

## Cómo se mantiene el saldo hoy

`trg_transactions_balance_before` (BEFORE INSERT/UPDATE/DELETE en `transactions`) ejecuta `handle_transaction_before_changes()`:

1. **Deshacer** el efecto de `OLD` sobre `accounts.current_balance` (en UPDATE/DELETE).
2. **Impuesto 0.15 %:** en INSERT de `transfer`/`payment` (o cuando el tipo cambia a uno de ellos), sin PayPal: `target_amount := amount` y `amount := amount × 1.0015`.
3. **Aplicar** el efecto de `NEW`.

`trg_transactions_items_after` (solo AFTER INSERT) crea los ítems automáticos "Monto Transferido" y "Comisión DGII (0.15%)".

La idea (saldo mantenido en BD dentro de la misma transacción) es correcta y se conserva. Los problemas están en los detalles.

## Bugs

| # | Gravedad | Bug | Evidencia |
|---|---|---|---|
| B1 | 🔴 Latente | **Transferencias entre monedas acreditan el monto equivocado.** La app calcula `target_amount` con la tasa (ej. 100 USD → 6,050 DOP), pero el trigger lo sobrescribe con `target_amount := NEW.amount`: la cuenta en DOP recibiría 100. | Hoy hay **0** transferencias entre monedas (ninguna tiene `exchange_rate`), así que no hay saldos dañados todavía. Se activa con la primera. |
| B2 | 🔴 | **Editar una transferencia pierde el impuesto y los ítems automáticos.** En UPDATE con el tipo sin cambiar, la fase 2 no corre: `amount` queda con el valor que manda la app (sin el 0.15 %). Además, la app borra todos los `transaction_items` y el trigger AFTER no corre en UPDATE (aunque su código contempla ese caso), así que no se regeneran. | Código de `updateTransaction` + trigger. 9 transferencias propias y 2 a terceros ya tienen `target_amount = amount` (sin impuesto); probablemente sean ediciones. |
| B3 | 🟠 | **`payment` se trata distinto al crear que al editar.** `createTransaction` borra `transfer_to_account_id` para todo lo que no sea `transfer`; `updateTransaction` trata `payment` como transferencia. | `src/lib/actions/transactions.ts` |
| B4 | 🟠 Seguridad | **Cualquier usuario autenticado puede sobrescribir o borrar el avatar de otro.** Las políticas de `storage.objects` solo verifican `bucket_id = 'avatars'`, no que la carpeta sea del usuario. | Políticas "Auth Update", "Permitir eliminar avatars", etc. |
| B5 | 🟡 Seguridad | Una transacción puede apuntar con `transfer_to_account_id` a una cuenta de otro usuario (solo hay FK, sin verificación de dueño). RLS impide modificar ese saldo, pero el dato queda inconsistente. | `transactions_transfer_to_account_id_fkey` |

## Regla de negocio a validar (no es un bug de código)

**El 0.15 % se aplica a todas las transferencias y pagos excepto PayPal.** Hoy está aplicado en:
- 115 de 124 transferencias **entre cuentas propias**,
- 203 de 205 transferencias **a terceros** (sin cuenta destino),
- 5 de 8 **pagos** (tarjetas de crédito).

Hay que confirmar contra la norma de la DGII y los estados de cuenta reales a qué operaciones aplica: entre cuentas propias del mismo banco, interbancarias, pagos de tarjeta propia. **Aplicarlo de más descuadra el saldo frente al banco.** La regla debe vivir en un solo lugar y ser configurable por tipo de operación (o detectarse desde el correo, que suele traer el cargo).

## Deuda del esquema

| Tema | Detalle | Impacto |
|---|---|---|
| **Sin `updated_at` ni `deleted_at` en `transactions`** | El reporte de auditoría de junio decía que existían; no es así. | Bloquea la sincronización incremental del plan offline (`01 §A.3`). Se agrega en la Fase 2. |
| Políticas RLS duplicadas | `accounts`, `tags`, `transactions` y `categories` tienen 2–4 políticas permisivas que se solapan (algunas sin `TO authenticated`). | Difícil de auditar. Consolidar en una por operación. |
| Valores hardcodeados en triggers | UUID de respaldo de la institución "Efectivo"; categoría DGII buscada por nombre (`'Impuestos / DGII'`). | Frágil ante renombres. |
| Índices | Faltan `transactions(user_id, date desc)`, `transactions(transfer_to_account_id)`, `transaction_items(transaction_id)`, `transaction_items(category_id)`. | Rendimiento al crecer. |
| Sin `seed.sql` | Instituciones y categorías del sistema solo existen en producción. | Una base local arranca vacía. |

## Qué se corrige y dónde

- **Fase 1 (seguridad):** B4 y B5.
- **Fase 2 (camino de escritura):** B1, B2 y B3 se resuelven juntos. Una RPC `save_transaction` calcula montos, impuesto y tasa **una sola vez**; los triggers quedan solo para el saldo (deshacer/aplicar), sin modificar montos. Se agregan `updated_at`/`deleted_at`, se consolidan las políticas, se crean los índices y una función `recalculate_account_balance(uuid)` para verificar que los saldos actuales cuadren con el historial.
- Antes de cambiar la regla del 0.15 %: decisión explícita del dueño del producto.
