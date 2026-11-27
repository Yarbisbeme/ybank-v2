# 03 — Impuesto a cheques y transferencias electrónicas (DGII)

> Estado: **§3.1 y §3.2 implementados (Fase 2.2, 2026-11-28)**; §3.3–§3.5 y §4 pendientes · Investigación: 2026-11-25
> Esto no es asesoría fiscal. Las reglas marcadas "por confirmar" se validan contra estados de cuenta reales antes de implementarlas.

## Estado de la implementación

| Parte | Estado | Dónde |
|---|---|---|
| Tasa versionada por fecha (0.15 % → 0.20 % desde 2026-07-03) | ✅ Fase 2.2 | `tax_rules`, `transfer_tax_rule()` · migración `20261128100000_tax_rules.sql` |
| Exenciones como datos (cuentas propias, billeteras externas) | ✅ Fase 2.2 | `tax_rule_exemptions` |
| Clasificación de cada transferencia (`transfer_kind`) | ✅ Fase 2.2, solo filas nuevas | `classify_transfer()`; filas anteriores quedan en `NULL` hasta §4 |
| Ítem DGII enlazado a su regla y con la tasa real en el nombre | ✅ Fase 2.2 | `transaction_items.tax_rule_id` |
| Impuesto redondeado a centavos | ✅ Fase 2.2 | trigger `handle_transaction_before_changes` |
| Verificación | ✅ `supabase/tests/tax_rules.test.sql` (32 checks) + E2E (transferencia propia sin impuesto) | |
| El banco manda sobre el cálculo (`tax_source`) — §3.3 | ❓ Con la ingesta de correos | |
| Impuesto fuera de `amount` y edición sin perderlo (B2) — §3.4 / §3.5 | ❓ Fase 2.3 (`save_transaction`) | |
| Corrección de datos históricos — §4 | ❓ Fase 2.5, con el dueño | |

Para cambiar la tasa en el futuro: una migración que cierre la regla vigente (`effective_to`) e inserte la nueva. Nunca editar una tasa ya aplicada.

## 1. Cómo funciona (fuentes al final)

| Aspecto | Lo que dicen las fuentes |
|---|---|
| Base legal | Art. 382 del Código Tributario; tasa modificada por la **Ley 30-26** (2026). |
| Tasa | **0.15 %** (1.5 por mil) hasta el 2 de julio de 2026; **0.20 %** (2 por mil) desde el **3 de julio de 2026**. La fecha de cada operación decide qué tasa aplica. |
| Quién lo cobra | El banco lo retiene y lo debita de la cuenta de origen como un cargo aparte. |
| **Exento: transferencias entre cuentas del mismo titular** | ✅ **Confirmado por varias fuentes** (ABA, ProUsuario, El Caribe, El Tiempo): en el mismo banco o entre bancos distintos (Resolución 26-2009, Norma General 04-19). **Condición:** el banco debe poder verificar que ambas cuentas son del mismo titular; si cobra igual, el usuario puede reclamar. Cuentas mancomunadas: exentas si se presenta constancia al banco. **Decisión:** exento por defecto; si el correo del banco muestra un cargo, manda el banco (§3.3). |
| Exento: otros | Retiros de efectivo del titular, pagos de impuestos, Seguridad Social y pensiones; consumos con tarjeta de crédito. |
| **Pago de tarjeta de crédito o préstamo propio** | ✅ **Grava**: lo confirmó el dueño del producto y coincide con las fuentes (el beneficiario final es el banco, no el titular). |
| PayPal | No es una transferencia bancaria local; el cargo depende de cómo se fondee. Hoy la app lo excluye. |
| Cambios futuros | Ya cambió una vez y en 2024 se sometió a consulta un borrador para eliminar exenciones administrativas. **Hay que asumir que la tasa y las exenciones van a volver a cambiar.** |

## 2. Qué hace hoy YBank y por qué está mal

- Tasa **fija en el código** (`0.0015` y `1.0015` en dos triggers). Las operaciones desde el 3 de julio deberían usar 0.20 %.
- Se aplica a **todas** las transferencias y pagos excepto PayPal. Pero las transferencias **entre cuentas propias están exentas**.

Datos actuales (conteo, sin montos):

| Clase | Antes del 2026-07-03 | Con 0.15 % cobrado | Desde el 2026-07-03 |
|---|---|---|---|
| Entre cuentas propias | 124 | **115 (probablemente cobrado de más)** | 0 |
| A terceros | 204 | 203 (correcto) | 1 (cobrado al 0.15 %, debería ser 0.20 %) |
| Pagos (tarjetas) | 8 | 5 (correcto; 3 sin impuesto, a revisar) | 0 |

**Impacto:** cada transferencia entre cuentas propias le restó a la cuenta de origen un 0.15 % que el banco no cobró, así que esos saldos están por debajo del real.

## 3. Diseño propuesto

### 3.1 La regla es un dato versionado, no código

```sql
create table tax_rules (
  id             uuid primary key default gen_random_uuid(),
  code           text not null,          -- 'DO_CHEQUES_TRANSFERS'
  rate           numeric(8,6) not null,  -- 0.001500, 0.002000
  effective_from date not null,
  effective_to   date,                   -- null = vigente
  legal_ref      text not null,          -- 'Ley 30-26, Art. 382 CT'
  exclude constraint no_overlap using gist (code with =, daterange(effective_from, effective_to) with &&)
);
-- Seed: 0.0015 hasta 2026-07-02; 0.0020 desde 2026-07-03.
```

Cuando la tasa vuelva a cambiar: **se inserta una fila**. Sin deploy ni cambios de código, y el historial se sigue calculando con la tasa correcta de su fecha.

### 3.2 Si aplica o no depende de la operación, no del texto de la descripción

Cada transferencia se clasifica:

| `transfer_kind` | ¿Grava? | Cómo se decide |
|---|---|---|
| `own_accounts` | No | Origen y destino son cuentas del usuario en YBank |
| `third_party` | Sí | Destino fuera de YBank o de otra persona |
| `own_credit_card_payment` | **Sí** (confirmado) | Pago a una tarjeta del usuario |
| `external_wallet` (PayPal, etc.) | No | Plataforma no bancaria |

Las exenciones viven en una tabla pequeña (`tax_rule_exemptions(code, transfer_kind)`) para poder cambiarlas igual que la tasa.

### 3.3 Lo que diga el banco tiene prioridad sobre lo que calculemos

1. **Transacción ingerida por correo:** si el correo trae el cargo del impuesto, se usa **ese monto** (el banco es la fuente de verdad) y queda `tax_source = 'bank'`.
2. **Si no lo trae,** o la transacción es manual: se calcula con `tax_rules` (tasa vigente en la fecha + exención por clase) y queda `tax_source = 'computed'`.
3. **El usuario puede corregirlo** a mano (`tax_source = 'manual'`).

### 3.4 El impuesto es una fila explícita, no un monto inflado

Hoy el impuesto se mezcla dentro de `amount` (`amount × 1.0015`) y se reconstruye dividiendo, lo que causó B1 y B2. En el diseño nuevo:
- `amount` = lo que se transfirió.
- El impuesto es un `transaction_item` propio con `tax_rule_id`, `rate` y `tax_source`.
- El saldo de origen descuenta `amount + impuesto`; el de destino suma `target_amount`.

Así el cálculo queda auditable ("se cobró 0.20 % según la regla X") y editar una transferencia recalcula el impuesto sin perder nada.

### 3.5 Dónde vive

En la RPC `save_transaction` / `ingest_bank_transaction` (Fase 2). **Una sola implementación** que usan la web, las apps móviles y la ingesta. Los triggers solo mantienen saldos.

## 4. Corrección de datos históricos

No se corrige nada automáticamente. Pasos:
1. ~~Confirmar las reglas~~ Hecho: entre cuentas propias exento, pago de tarjeta propia grava. Antes de aplicar la corrección, comparar el saldo recalculado de 2–3 cuentas con el saldo real del banco para detectar excepciones (un banco que haya cobrado igual).
2. Migración de datos que reclasifique cada transferencia, recalcule el impuesto con `tax_rules` y deje un registro de auditoría (valor anterior → nuevo).
3. `recalculate_account_balance()` para recomponer saldos y comparar con el saldo real del banco antes de aplicarla.

## Fuentes

- [ABA — De 0.15 % a 0.20 %](https://aba.org.do/articulos-perspectivas/impuesto-cheques-transferencias-electronicas-republica-dominicana/)
- [El Dinero — El 0.2 % ya está en vigor, ¿cuándo no aplica?](https://eldinero.com.do/371045/reforma-fiscal-el-0-2-por-transferencia-bancaria-ya-esta-en-vigor-cuando-no-aplica/)
- [Revista Mercado — Bancos explican el nuevo impuesto](https://revistamercado.do/money-invest/daily-news/cuanto-pagaras-por-una-transferencia-bancos-explican-como-funciona-el-nuevo-impuesto-de-0-20/)
- [De Último Minuto — Cuándo no aplica el 0.20 %](https://deultimominuto.net/economia/impuesto-a-las-transferencias/)
- [El Caribe — Calendario de la Ley 30-26](https://www.elcaribe.com.do/panorama/dinero/calendario-entrada-vigencia-cambios-impositivos-ley-30-26/)
- [DGII — Resolución 26-2009](https://dgii.gov.do/legislacion/resoluciones/Documents/Resolucion26-2009.pdf)
- [DGII Ayuda — CA2342 exenciones](https://ayuda.dgii.gov.do/conversations/incentivos-exenciones-y-leyes-especiales/ca2342-existe-alguna-exencin-para-el-pago-del-impuesto-a-la-emisin-de-cheques-y-pagos-por-transferencias-electrnicas/5f3c17698cd858ce879c42d8)
- [DGII Ayuda — Cobro entre instrumentos de un mismo cliente](https://ayuda.dgii.gov.do/conversations/discusiones/cobro-015-en-movimientos-entre-instrumentos-de-un-mismo-cliente/64014bec7a695d65a1605eae)
- [Hahn Ceara — Boletín NG 04-2019](https://hahnceara.do/wp-content/uploads/NG-04-2019-Remisi%C3%B3n-Informaci%C3%B3n-Impuesto-Cheques-y-Transferencias-Electr%C3%B3nicas.pdf)
- [Hoy — Borrador de norma para que todos paguen](https://hoy.com.do/norma-para-que-todos-paguen-impuesto-a-cheques/)
- [ProUsuario — El 0.15 %: lo que debes saber](https://prousuario.gob.do/educacion-financiera/blog/el-015-lo-que-debes-saber-sobre-este-impuesto/)
- [El Tiempo — Transferencias entre tus propias cuentas no pagan el impuesto](https://eltiempo.com.do/economia/transferencias-entre-tus-propias-cuentas-no-pagan-el-impuesto-del-0-15/)
- [El Caribe — Quiénes pagan el 0.15 % y quiénes quedan exentos](https://www.elcaribe.com.do/panorama/dinero/quienes-pagan-el-0-15-en-las-transferencias-y-quienes-quedan-exentos/)
