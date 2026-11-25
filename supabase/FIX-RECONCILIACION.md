# Fix de Reconciliación — Parser + Categorizer + SQL

## Problema

3 correos generaron transacciones incorrectas:
1. **LAFISE → Yarbis**: type=transfer, balance -5007.50 (cuenta auto-creada incorrecta)
2. **LAFISE → Rosanna**: type=transfer, match_key residual
3. **APAP ← BCRD**: type=transfer en vez de income, balance -5007.50 en vez de +5000

## Archivos actualizados

| Archivo | Nodo | Fixes |
|---------|------|-------|
| `parser-v4.8.js` | Code in JavaScript2 | Fix 1+2: regex esTransferencia |
| `categorizer-updated.js` | Code in JavaScript | Fix pending_match |
| `query-reconciliacion-updated.sql` | Buscar Usuario | Fix 3+4: source search + match_key |

## Fixes aplicados

### Fix 1: esTransferencia excluye LBTR+entrante

```javascript
// ANTES:
const esTransferencia =
  /\b(?:ach|lbtr|transfiriendo\s+fondos)\b/i.test(texto) ||  // ← lbtr matcheaba siempre

// DESPUÉS:
const esTransferencia =
  (/\b(?:ach|lbtr|transfiriendo\s+fondos)\b/i.test(texto) && !/entrante/i.test(texto)) ||
```

### Fix 2: APAP income clasificado correctamente

| Test | Antes | Después |
|------|-------|---------|
| APAP "LBTR entrante" | type=transfer | type=income ✅ |
| Balance | -5007.50 | +5000 ✅ |
| Tax 0.15% | aplicado ❌ | no aplicado ✅ |

### Fix 3: SQL busca source por nombre de banco

```sql
-- ANTES: Solo buscaba por last_4, luego por banco+tipo
-- DESPUÉS: Busca por last_4, luego por banco+currency+is_active

IF v_source_id IS NULL THEN
    SELECT id INTO v_source_id FROM public.accounts
    WHERE user_id = var_user_id
      AND (name ILIKE '%' || var_bank || '%' OR var_bank ILIKE '%' || name || '%')
      AND currency = var_src_curr::currency_code
      AND is_active = true
    LIMIT 1;
END IF;
```

**Impacto**: LAFISE → Rosanna ya no auto-crea "Ahorros LAFISE (0019)". Usa la cuenta real del usuario.

### Fix 4: SQL limpia match_key en INSERT

```sql
-- ANTES: Siempre guardaba match_key
'{{ match_key }}'

-- DESPUÉS: Solo guarda si status=pending_match
CASE
    WHEN var_status = 'pending_match' THEN '{{ match_key }}'
    ELSE NULL
END
```

**Impacto**: Las transacciones completas no tienen match_key residual.

## Flujo corregido

```
LAFISE → Yarbis (5000):
  Parser: type=transfer, src=null, tgt=null
  Categorizer: esTercero=true (cuenta destinatario no está en BD)
  Status: completed
  SQL: Busca source por nombre "LAFISE" → encuentra cuenta real del usuario
  INSERT: match_key=NULL (status=completed)

APAP ← BCRD (5000):
  Parser: type=income, tgt=1391 ✅ (fix 1+2)
  Status: completed
  SQL: Busca match_key "5000-DOP-2026-07-01"
       → No encuentra (match_key=NULL en LAFISE)
       → INSERT nueva transacción income
  Trigger: +5000 al balance APAP ✅
```

## Test results

```
APAP Income:     type=income,  tgt_4=1391, desc="Transacción APAP" ✅
LAFISE Transfer: type=transfer, src_4=0019, desc="Envío a Rosanna" ✅
LAFISE Payment:  type=transfer, src_4=9287, tgt_4=0802, desc="Pago TC LAFISE" ✅
APAP Expense:    type=expense, desc="PedidosYa" ✅
```

## Instrucciones

1. **Code in JavaScript2** → pegar `parser-v4.8.js`
2. **Code in JavaScript** → pegar `categorizer-updated.js`
3. **Buscar Usuario** → pegar `query-reconciliacion-updated.sql`
4. **Limpiar datos incorrectos** (opcional):
```sql
-- Eliminar cuenta auto-creada incorrecta
DELETE FROM accounts WHERE id = '033c6fc9-d2fe-4f66-a37a-7660545dc5e2';
-- Eliminar transacción APAP con type incorrecto
DELETE FROM transactions WHERE id = '9b7dfe90-12c2-401b-baa7-c2fb167c5d0d';
-- Corregir balance APAP (1391)
UPDATE accounts SET current_balance = 0 WHERE id = '78bb438f-90c3-4871-81cd-77999b764f8d';
```
