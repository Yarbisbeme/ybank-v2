# Parser v4.8 — Cambios para aplicar en N8N

**Nodo:** `Code in JavaScript2` (ID: `2181a14f-1b8f-4e4f-8057-3b228813929c`)
**Workflow:** Gastibiris (ID: `LKqMTcPD3Xp04DIs`)

## Instrucciones

1. Abrir N8N → Gastibiris → Nodo "Code in JavaScript2"
2. Reemplazar TODO el código con el contenido de `supabase/parser-v4.8.js`
3. Guardar y activar el workflow

## Test results

| Email | type | amount | source_4 | target_4 | source_type | target_type | description |
|-------|------|--------|----------|----------|-------------|-------------|-------------|
| APAP income | income | 5000 | null | 1391 | null | savings | Transferencia LBTR - Entrante |
| LAFISE transfer | transfer | 1739.7 | 0019 | null | null | null | Envío a Rosanna |
| LAFISE transfer | transfer | 5000 | 1391* | null | null | null | Envío a Yarbis |
| LAFISE payment | transfer | 4000 | 9287 | 0802 | savings | credit_card | Pago TC LAFISE |

*source_4=1391 es el last_4 de la cuenta destino (no hay info de source en el correo)

## Cambios v4.6 → v4.8

### FIX 1: esPagoTarjeta movida fuera de try (ReferenceError line 365)
Variable declarada antes del bloque try para acceso global.

### FIX 2: "presenta una transacción" eliminado de esGasto
Era demasiado amplio, matcheaba "realizar una transferencia" ( substring "transacci").

### FIX 3: esTransferencia excluye "entrante"
`pago al instante ... entrante` ahora se clasifica como income, no transfer.

### FIX 4: Orden if/else corregido
esIngreso se verifica ANTES que esTransferencia.

### FIX 5: Extracción específica para pago a TC
`esPagoTarjeta` usa patrones directos ("termina en" + "Desde tu cuenta") en vez de `extraer4` genérico.

### FIX 6: source_type no sobreescribe para pago a TC
`mGenerico` se desactiva cuando `esPagoTarjeta` es true.

### FIX 7: Descripción "motivo fue '...'" para LAFISE
Patrón `/motivo\s+fue\s+['"]([^'"]+)['"]/i`.

### FIX 8: Descripción APAP limitada
`tipo\s*:\s*(.{2,}?)\s+(?:Los|Fines|Las|Consult|En caso)` corta en "Los Pagos".

### FIX 9: No invertir source↔target si ya se invirtió
Guard `!esPagoTarjeta` en sección 11.
