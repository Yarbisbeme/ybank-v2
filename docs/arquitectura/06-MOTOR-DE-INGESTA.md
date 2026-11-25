# 06 — Motor de ingesta y parser de correos bancarios

> Estado: **propuesta** · Fecha: 2026-11-25
> El parser es el **corazón de YBank**: casi todos los datos entran por aquí. Precisa más diseño que cualquier otra pieza.
> Refina `01 §B`, `04` y `05`.

## 1. El problema

- Cada banco usa su propio HTML (tablas anidadas, estilos inline, imágenes, texto oculto) y a veces solo texto plano.
- **Distintos términos para lo mismo**: "Consumo", "Compra aprobada", "Transacción realizada", "Débito a su cuenta"… todos significan *compra*.
- Formatos de número y fecha distintos (`RD$1,234.56`, `DOP 1.234,56`, `25/11/2026`, `11/25/2026`, `25 nov. 2026`).
- Los bancos **cambian las plantillas sin avisar**.
- Hay correos que no son transacciones (OTP, promociones, avisos) y deben ignorarse **sin perder** uno real.

### Qué falla en el v4.8 (n8n)

Una sola función con ~100 regex genéricas aplicadas al texto aplanado de **todos** los bancos. Una regla pensada para un banco puede capturar el dato equivocado en otro (ej. `(cuenta|tarjeta)…(\d{4})` toma los primeros 4 dígitos que encuentre). No hay tests, ni versión del parser guardada con cada resultado, ni forma de reprocesar. **El riesgo es el diseño, no el lugar donde corre.**

## 2. Principio rector: separar *dónde corre* de *qué hace*

```
┌─────────────────────────────────────────────────────────────────┐
│  @ybank/ingestion-core   (TypeScript puro, sin Node/Deno/DOM)   │
│  MIME → normalización → identificación → adaptador del banco →  │
│  BankEvent validado + confianza + trazas                        │
│  Testeado con un corpus de correos reales anonimizados          │
└───────────────▲───────────────▲───────────────▲─────────────────┘
                │               │               │
   Edge Function (tiempo     Script Node /     Vitest (CI)
   real, un correo)          GitHub Actions    
                             (importación histórica,
                              reprocesar en lote)
```

- **La librería es la pieza robusta**: determinista, sin E/S y 100 % testeable.
- **El host es reemplazable.** Hoy: Edge Function para tiempo real y GitHub Actions para lotes grandes, ambos gratis. Si algún día hace falta otro (un worker propio), se cambia el host sin tocar el parser.
- Dependencias **puras de JS** que corren igual en Deno, Node y Workers: `postal-mime` (MIME) y `htmlparser2` (HTML).

**Sobre la Edge Function como host:** procesar un correo es parsear unos KB de HTML, milisegundos de CPU, muy por debajo de los límites. Lo que sí sería frágil es **recibir y procesar en el mismo paso**: si el procesamiento falla, el correo se pierde. Por eso se desacoplan (§3).

## 3. Pipeline durable (recibir ≠ procesar)

```
Cloudflare Email Worker ──POST MIME crudo (HMAC)──► Edge Function `receive-email`
                                                     1. verifica firma + remitente
                                                     2. guarda el .eml en Storage (inmutable)
                                                     3. inserta inbound_emails (status=queued)
                                                     4. encola en pgmq
                                                     → responde 200 (rápido, sin parsear)

pg_cron (cada minuto) ──► Edge Function `process-emails`
                           lee un lote de la cola (pgmq, con visibility timeout)
                           → ingestion-core.parse(eml)
                           → RPC ingest_bank_transaction (idempotente por message_id)
                           → ack | reintento con backoff | dead-letter tras N intentos
```

- **pgmq (Supabase Queues)** es una cola durable dentro de Postgres: gratis, con reintentos y sin servicios extra.
- **Nada se pierde:** el correo crudo queda guardado antes de cualquier procesamiento.
- **Reprocesar es gratis:** cuando un adaptador mejora, se vuelven a encolar los `failed`/`needs_review`, o todo un banco o rango de fechas. Idempotente por `message_id`.

## 4. Etapas del parser (`ingestion-core`)

| # | Etapa | Qué hace | Por qué |
|---|---|---|---|
| 1 | **Decodificar MIME** | charset, quoted-printable, base64, multipart recursivo; elige `text/html` y conserva `text/plain` | Los bancos mezclan formatos |
| 2 | **Normalizar documento** | HTML → **estructura**, no texto plano: celdas de tabla → pares `etiqueta: valor`, sin texto oculto/estilos; Unicode NFKC, `&nbsp;`, espacios | Las tablas de etiqueta/valor son lo más estable de un correo bancario; aplanar todo destruye esa estructura |
| 3 | **Identificar banco y plantilla** | dominio del remitente + DKIM `d=` + huella de plantilla (frases ancla) → `bank_id` + `template_id` | Cada plantilla tiene su adaptador; nada de reglas globales |
| 4 | **Adaptador del banco** (Strategy) | reglas **por plantilla**: extrae campos crudos de la estructura | Un banco nuevo o una plantilla nueva = archivo nuevo; no rompe a los demás |
| 5 | **Vocabulario canónico** | diccionario por banco: términos → `event_type` (`purchase`, `transfer_out`, `transfer_in`, `card_payment`, `reversal`, `fee`, `informative`) | Resuelve "distintos términos para lo mismo" en un solo lugar, como dato |
| 6 | **Normalizar valores** | montos (`1,234.56` vs `1.234,56`, `RD$`/`US$`/`DOP`/`USD`), fechas (formato declarado por plantilla, meses en español), zona horaria RD | Funciones puras con tests de propiedades |
| 7 | **Validar** | Zod `BankEvent` + invariantes (monto > 0, moneda válida, últimos 4 dígitos con formato válido) | Nunca sale un evento malformado |
| 8 | **Puntuar confianza** | cada campo con su origen; confianza alta solo si los campos obligatorios salieron de reglas fuertes de la plantilla | Decide si se registra solo o va a revisión |

**Salida:** `ParseResult = { status: 'parsed' | 'ignored' | 'needs_review' | 'unknown_template', event?, confidence, parserVersion, trace[] }`. El `trace` explica qué regla extrajo cada campo, para depurar sin adivinar.

## 5. Calidad: cómo se vuelve "totalmente robusto"

1. **Corpus de correos reales** por banco y por plantilla, **anonimizados** (nombres, números de cuenta y referencias reemplazados por valores ficticios con el mismo formato). Cada uno trae su `BankEvent` esperado.
   - Un script de anonimización convierte un `.eml` real en fixture.
   - **Datos reales nunca entran al repo**, ni siquiera si es privado.
2. **Golden tests en CI:** cualquier cambio en un adaptador corre todo el corpus. Si cambia la salida de un correo que ya funcionaba, el CI falla.
3. **Tests de propiedades** para montos y fechas (miles de entradas generadas).
4. **Versión del parser guardada** en cada transacción ingerida (`parser_version`, `template_id`).
5. **Detección de cambios de plantilla:** si un remitente bancario conocido produce `unknown_template` o baja confianza, se alerta (inbox de revisión + contador en la UI). Ese correo se convierte en un fixture nuevo.
6. **Cola de revisión en la UI:** lo que no tiene confianza alta **no se registra solo**. El usuario lo confirma o corrige en un clic, y la corrección se guarda como fixture candidato.
7. **Nunca se descarta en silencio:** `ignored` también guarda el motivo (OTP, promoción…) y es auditable.

## 6. IA: solo como asistente, nunca como fuente de verdad

- Opcional, en la capa gratuita de Gemini.
- Solo para correos `unknown_template`: **propone** campos que van a la cola de revisión con la etiqueta "sugerido por IA".
- Nunca registra transacciones sola y nunca reemplaza a un adaptador. Si una plantilla se repite, se escribe su adaptador.

## 7. Migración desde v4.8

- El v4.8 es **conocimiento valioso** (10 bancos, casos borde como reversos, pagos de TC, PayPal), no código para portar tal cual.
- Por cada banco: tomar sus reglas del v4.8, convertirlas en un adaptador por plantilla y escribir fixtures que cubran los casos que el v4.8 ya resolvía.
- Orden sugerido: primero los bancos con más volumen en tus datos.
- **Necesario para empezar:** muestras reales de cada banco (2–5 por tipo de correo). La importación histórica de Gmail (o exportar `.eml` a mano) es la fuente.

## 8. Ubicación en el código

Ahora (repo único): `src/features/ingestion/core/` con la regla de no importar nada de Next/Node/Deno (la verifica un test o una regla de lint).
Con el monorepo (cuando llegue la app móvil): pasa a `packages/ingestion-core`.

```
ingestion/core/
  mime/            decode.ts
  document/        normalize.ts (HTML → estructura)
  values/          money.ts, dates.ts            (+ tests de propiedades)
  banks/
    registry.ts    lista de adaptadores
    banreservas/   identify.ts, templates/*.ts, vocabulary.ts
    popular/ …
  schema.ts        BankEvent (Zod)
  parse.ts         orquesta las etapas
fixtures/          *.eml anonimizados + *.expected.json
```
