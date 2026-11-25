# YBank v2 — Base de arquitectura

> Documento fundacional. Define **qué tenemos, qué conservamos, qué cambiamos y por qué**.
> Toda decisión técnica posterior debe poder justificarse contra este documento o modificarlo explícitamente.
> Fecha: 2026-11-25 · Estado: **borrador para revisión**

---

## 0. Drivers de arquitectura (lo que manda)

Antes de elegir patrones hay que saber qué problema resuelven. Para YBank los drivers reales son:

| # | Driver | Consecuencia |
|---|---|---|
| D1 | **Es dinero.** Un saldo incorrecto es un bug grave, no un detalle visual. | Escrituras atómicas, idempotencia, aritmética en un solo lugar, auditabilidad. |
| D2 | **La entrada principal es automática** (correos bancarios), no manual. | Necesitamos procesos en segundo plano, reintentos, reprocesamiento y observabilidad. |
| D3 | **Los formatos de correo cambian** sin aviso y cada banco es distinto. | Los parsers deben ser aislados, testeables con fixtures y fáciles de agregar. |
| D4 | **Multi-moneda DOP/USD** con tasas por banco. | Una única fuente de verdad para conversión y tasas. |
| D5 | **PWA con lectura offline.** | Caché cliente persistente, pero con límites claros de qué se guarda. |
| D6 | **Escala real pequeña** (≈6 usuarios, ≈1.1k transacciones). Un solo desarrollador. | Monolito. Nada de microservicios, buses de eventos ni capas ceremoniales. |

**Regla de oro:** un patrón entra solo si ataca uno de estos drivers. Si no, es sobreingeniería.

---

## 1. Tecnologías

| Tecnología | Uso actual | Ventajas | Desventajas / problemas encontrados | Veredicto y mejora |
|---|---|---|---|---|
| **Next.js 16 (App Router)** | Framework full-stack | RSC, Server Actions, Route Handlers, despliegue trivial | Corre con `--webpack` forzado (por `next-pwa`); `middleware.ts` + `proxy.ts` duplicados rompen el build | ✅ **Mantener.** Usar solo `proxy.ts`. Evaluar salir de webpack cuando el PWA lo permita. |
| **Supabase** (Postgres, Auth, Storage, RLS) | BaaS completo | RLS real por usuario, Auth con Google, Postgres completo (funciones, triggers, pg_cron) | El esquema **no vive en el repo** (solo SQL sueltos); lógica invisible (¿quién actualiza `current_balance`?); tipos escritos a mano | ✅ **Mantener.** Versionar con **Supabase CLI** (`supabase/migrations`), `supabase gen types`, y usar **funciones Postgres (RPC)** para escrituras críticas. |
| **@supabase/ssr** | Clientes server/browser | Estándar oficial | El cliente browser se crea inline en componentes | ✅ Mantener. Tres fábricas únicas: `server`, `browser`, `admin` (service role, solo server). |
| **Server Actions** | **Lecturas y escrituras** | Tipado extremo a extremo, sin endpoints manuales | Se usan para **lecturas** desde `useQuery`: son POST, no cacheables y Next las **ejecuta en serie** por cliente → cuellos de botella invisibles | ⚠️ **Solo para mutaciones.** Lecturas del cliente vía **Route Handlers GET** (o RSC prefetch). |
| **TanStack Query v5 + persistencia IDB** | Caché cliente + offline | Optimistic updates, `offlineFirst`, ya bien aprovechado | Sin *query key factory* (keys a mano que ya no coinciden); hidratación SSR manual; persiste **todo** (incluidos tokens Gmail del perfil); `QueryProvider` devuelve `null` hasta restaurar → pantalla en blanco | ✅ **Mantener** con: key factory, `HydrationBoundary`, persistencia con lista blanca, *buster* por usuario/versión, render sin bloquear. |
| **Zustand 5** | Preferencias, filtros, modales, selección | Mínimo, sin boilerplate | `useYBankStore` llama a un Server Action (efectos de red dentro del store); filtros en store **y** `accountId` en URL = dos fuentes de verdad | ✅ Mantener **solo para estado de UI efímero**. Filtros → URL (`nuqs`). Datos del servidor → TanStack, nunca en Zustand. |
| **Zod 4** | Validación de inputs en algunas acciones | Estándar, v4 rápido | Cobertura parcial; acciones reciben `any` | ✅ Extender a **toda frontera**: env vars, inputs de acciones, respuestas de APIs externas, salida de parsers/IA. |
| **Tailwind v4 + shadcn + cva** | Estilos y UI | Productivo, consistente | 7 componentes de tarjeta por banco con estilos hardcodeados + `UniversalCard` | ✅ Mantener. Las tarjetas por banco deberían ser **datos** (tema en `institutions`), no componentes. |
| **framer-motion, lottie-react** | Animación | UI pulida (es un punto fuerte del proyecto) | Lottie pesa; se carga eagerly | ✅ Mantener; cargar Lottie con `dynamic()`. |
| **lucide-react + @iconify/react** | Íconos | — | Dos librerías; Iconify por defecto **descarga íconos de su API en runtime → falla offline** | ⚠️ Consolidar en **lucide** (o Iconify con íconos empaquetados offline). |
| **@ducanh2912/next-pwa** | Service worker | Funciona | Mantenimiento lento, ata a webpack, hostname de Supabase hardcodeado | ⚠️ Migrar a **Serwist** cuando toquemos PWA; hostname desde env. |
| **googleapis ^170** | (aún sin uso) Gmail | Oficial | Paquete enorme (todas las APIs de Google) | ⚠️ Usar **`@googleapis/gmail`** + `google-auth-library`, mucho más liviano. |
| **open.er-api.com** | Tasa USD→DOP | Gratis | Fallback `60.50` en `rates.ts` y `58.00` en `accounts.ts` (inconsistente); se llama en cada operación | ⚠️ Tabla `exchange_rates` con snapshot diario (cron). La transacción guarda la tasa usada (ya existe `exchange_rate`). Un solo fallback. |
| **Cypress** | E2E (vacío: visita youtube.com) | — | Pesado, 0 tests reales | ❌ **Reemplazar**: **Vitest** (dominio/parsers, el 80% del valor) + **Playwright** (2–3 flujos críticos). |
| **n8n** | Ingesta de correos | Visual, rápido de prototipar | SQL con interpolación de strings (inyección), UUIDs y nombre personal hardcodeados, máx. 100 correos, sin tests, lógica fuera del repo | ❌ **Eliminar.** Ingesta nativa en el proyecto (ver §2.4). |
| **Aritmética de dinero en JS** (`parseFloat`, `toFixed`) | Conversiones y montos | — | Floats IEEE-754; conversión FX duplicada en 3 lugares | ⚠️ El cálculo que afecta saldos vive en **Postgres (NUMERIC)**. JS solo formatea para mostrar. |

**Tecnologías nuevas propuestas (mínimas):** Supabase CLI, Vitest, Playwright, `nuqs`, `@googleapis/gmail`. Nada más hasta que un driver lo pida.

**Descartadas a propósito:** tRPC (Route Handlers + Zod alcanzan), Redux, Prisma/Drizzle (dupliquen el modelo de Supabase y pierden RLS), NestJS/backend separado, Kafka/colas externas.

---

## 2. Arquitectura

### 2.1 Arquitectura actual

```
Navegador ──► Next.js (RSC + Server Actions) ──► Supabase (PostgREST + RLS) ◄── n8n (SQL crudo, service role)
     └── TanStack + IndexedDB                         └── triggers no versionados
```

- **Monolito Next.js organizado por tipo técnico**: `components/`, `hooks/`, `lib/actions/`, `services/`, `store/`, `types/`.
- **Sin capa de dominio**: las reglas de negocio están repartidas entre acciones, hooks y componentes.
- **Dos escritores con reglas distintas**: la app (Server Actions) y n8n (SQL propio).

### 2.2 Ventajas

- Un solo despliegue, un solo lenguaje, cero infraestructura propia.
- RLS como barrera real de seguridad por usuario (bien hecho).
- Estrategia offline-first pensada (no accidental).
- La idea de idempotencia por `source_email_id` + `pg_advisory_xact_lock` en la reconciliación es correcta.

### 2.3 Desventajas (por gravedad)

1. **Escrituras no atómicas sobre dinero.** `createTransaction` inserta padre → tags → items en llamadas separadas con "compensación" manual; `updateTransaction` borra tags/items y reinserta; `deleteTransaction` borra en 3 pasos. Un fallo intermedio deja datos inconsistentes. *(Viola D1.)*
2. **Dos caminos de escritura** (app y n8n) que deben producir el mismo resultado pero no comparten código. *(Viola D1, D2.)*
3. **Esquema y lógica de BD fuera del repo.** No sabemos desde el código quién mantiene `current_balance`. No se puede reproducir el entorno.
4. **Organización por tipo técnico.** Una feature (transacciones) está en 6 carpetas; `useCatalogs.ts` es un archivo "dios" con hooks de todas las entidades; `transactions.ts` mezcla consulta, reglas FX y persistencia.
5. **Reglas duplicadas**: conversión FX en `useCurrency`, `calculateNormalizedTotal`, `create/updateTransaction`; aplanamiento de desgloses en servidor y cliente; "morph" de transferencias en el hook.
6. **Lecturas vía Server Actions** (serializadas, sin caché HTTP) y el layout del dashboard consulta 5 recursos en **cada** navegación, para luego refetchear en cliente.
7. **Errores tragados**: el layout captura todo (incluido `redirect`) y devuelve datos vacíos; no se distingue "offline" de "error real".
8. **Sin procesamiento en segundo plano** propio.

### 2.4 Arquitectura propuesta: **monolito modular por features**

No es un rewrite de stack; es **reorganizar responsabilidades**. Tres ideas, nada más:

**(a) El código se organiza por feature (vertical slices).**

```
src/
  app/                       # Rutas. Solo composición: lee params, llama a la feature, renderiza.
    (auth)/  (dashboard)/
    api/                     # Route Handlers: lecturas GET + webhooks/cron de ingesta
  features/
    transactions/
      domain/                # Funciones PURAS: reglas, cálculos, tipos. Sin Supabase/Next/React.
      server/
        queries.ts           # Lecturas (server-only)
        actions.ts           # 'use server' — mutaciones, validan con Zod y llaman a RPC
      client/
        keys.ts              # Query key factory
        hooks.ts             # useTransactions, useSaveTransaction…
      components/
      schemas.ts             # Zod compartido cliente/servidor
      index.ts               # API pública de la feature
    accounts/  categories/  tags/  profile/  fx/
    ingestion/               # Todo lo de correos (ver (c))
  shared/
    ui/                      # Componentes genéricos (shadcn)
    supabase/                # server.ts · browser.ts · admin.ts
    config/env.ts            # Env validado con Zod
    lib/                     # Result, fechas, formato
supabase/
  migrations/                # Única fuente de verdad del esquema
  tests/                     # (opcional) pgTAP para RPCs críticas
```

**Reglas de dependencia (las únicas que hacemos cumplir):**
- `app → features → shared`. Nunca al revés.
- Una feature importa otra **solo por su `index.ts`**.
- `domain/` no importa nada de infraestructura → se testea con Vitest sin mocks.

**(b) La base de datos es dueña de las invariantes del dinero.**

- Toda escritura que afecte saldos pasa por **una función Postgres** (`save_transaction(jsonb)`, `delete_transaction(uuid)`, `ingest_bank_transaction(jsonb)`) que corre en **una sola transacción**, con `SECURITY INVOKER` (respeta RLS) cuando la llama el usuario.
- El saldo se mantiene en BD (trigger versionado) + función `recalculate_account_balance(uuid)` para auditoría/reparación.
- La app manual y la ingesta automática **usan la misma función** → un solo camino de escritura.

> Por qué aquí y no en TypeScript: `supabase-js` no tiene transacciones. Simular *Unit of Work* en TS sería frágil y más código. Postgres ya lo resuelve.

**(c) La ingesta es un pipeline con bandeja de entrada (inbox).**

```
Trigger (cron | botón "Sincronizar")
  → GmailConnector.fetchSince(cursor)       # paginado, MIME recursivo, backoff
  → inbound_emails (upsert por message_id)  # se guarda el correo crudo + estado
  → classify → parse (parser por banco) → normalize (Zod: BankEvent)
  → categorize
  → ingest_bank_transaction(event)          # RPC idempotente
  → estado del inbound_email = processed | ignored | failed (+ motivo)
```

El beneficio clave de guardar el correo crudo: **cuando un parser mejora, se reprocesan los fallidos sin volver a Gmail**. Eso ataca D2 y D3 directamente.

### 2.5 Lo que **no** vamos a hacer

| Tentación típica | Por qué no |
|---|---|
| Clean/Hexagonal completa (puertos para todo, casos de uso como clases, contenedor DI) | Con una BD y un dev, cada interfaz tendría una sola implementación. Ceremonia sin beneficio. Aplicamos la idea solo donde hay valor: `domain/` puro e `ingestion` con conector abstracto. |
| Microservicios / backend NestJS aparte | D6. Un worker separado solo si el hosting no soporta jobs (ver preguntas). |
| CQRS / Event Sourcing / bus de eventos | El historial de transacciones ya es nuestro "log". Agregar eventos duplica el modelo. |
| Repositorio genérico `Repository<T>` / `BaseService` | Supabase ya es la abstracción. Los `queries.ts` por feature encapsulan sin interfaces vacías. |
| Escritura offline con cola y resolución de conflictos | Muy caro y riesgoso con dinero; el dato principal llega por correo, no a mano. **Offline = solo lectura** (salvo que decidas lo contrario). |

---

## 3. Prácticas

### 3.1 Lo que se hace bien (conservar)
- RLS en todas las tablas.
- Validación Zod en mutaciones principales.
- Soft delete de cuentas (`is_active`).
- Optimistic updates con rollback.
- Idempotencia por `source_email_id`.

### 3.2 Problemas

| Práctica | Problema | Mejora |
|---|---|---|
| Secretos | `client_secret` de Google versionado; tokens Gmail en texto plano y enviados al navegador | Rotar secret; tokens en tabla `gmail_connections` cifrada, solo accesible con service role; `profiles` nunca con `select('*')`. |
| Tipado | 93 `any`; tipos de BD escritos a mano | `supabase gen types` + `strict` real; `no-explicit-any` como error en código nuevo. |
| Esquema | SQL sueltos, no reproducible | Migraciones con Supabase CLI. Primer paso: `supabase db pull` para capturar el estado actual. |
| Tests | 0 | Vitest para `domain/` y parsers (fixtures de correos reales anonimizados), Playwright para login → dashboard → crear transacción. |
| Errores | Mezcla de `throw` y `{success, error}`; `catch` vacíos; `console.error` como único log | **Un contrato**: acciones devuelven `Result<T>` (unión discriminada); lecturas lanzan y las maneja TanStack/`error.tsx`. Nada de `catch` vacío. |
| Consultas PostgREST | Filtros armados por interpolación (`.or(\`account_id.eq.${accountId}\`)`) con valores de la URL; `ilike` sin escapar; filtro por categoría arma un `OR` con cientos de IDs; `total` incorrecto al filtrar por categoría | Validar UUIDs con Zod antes de usar; filtros complejos como **vista o RPC SQL**; paginación y conteo en la BD. |
| Fechas | `sanitizeDate` y `T23:59:59.999Z` sobre columna `DATE`; zona horaria implícita | Regla: `date` es fecha local de RD (`America/Santo_Domingo`), se manipula como string `YYYY-MM-DD`; timestamps en UTC. Utilidades en un solo módulo. |
| Serialización | `JSON.parse(JSON.stringify(...))` en todas las acciones | Innecesario con datos de PostgREST; eliminar. |
| Configuración | URL de producción y hostname de Supabase hardcodeados; `.env.example` con errores | `shared/config/env.ts` validado con Zod al arrancar. |
| Calidad de repo | Lint con 120 errores, sin CI, commits genéricos ("Refactor code structure…"), varios documentos de auditoría generados por IA, comentarios narrativos con emojis ("💡 FIX CRÍTICO") | CI (typecheck + lint + test + build) en cada PR; Conventional Commits; comentarios explican **por qué**, no narran; `docs/` solo con documentos vigentes (ADRs cortos). |
| Idioma | Español e inglés mezclados en código | **Código en inglés, textos de UI en español.** |

---

## 4. Patrones de diseño

### 4.1 Patrones presentes hoy

| Patrón | Dónde | Evaluación |
|---|---|---|
| Server Actions como fachada/BFF | `lib/actions/*` | ✅ Correcto para **mutaciones**. ❌ Para lecturas (ver §1). |
| Optimistic UI | `useSaveTransaction`, `useDeleteTransaction` | ✅ Conservar. |
| Provider / Context | `DashboardProviders`, `QueryProvider` | ✅ Conservar; ❌ `DataHydrator` manual → reemplazar por `HydrationBoundary`. |
| Store global (Zustand) | `store/*` | ✅ Para UI. ❌ Con efectos de red adentro. |
| Compensación manual (mini-saga) | `createTransaction` borra el padre si fallan los items | ❌ Reemplazar por transacción de BD. |
| Lock + clave de idempotencia | SQL de reconciliación n8n | ✅ La idea se conserva dentro de la RPC. |
| Componente por banco | `Tarjetas/BhdCard`, `ScotiaCard`… + `UniversalCard` | ❌ Duplicación. Tema de tarjeta como **dato** de `institutions`, un solo componente. |
| "God module" | `useCatalogs.ts`, `transactions.ts` | ❌ Dividir por feature y responsabilidad. |

### 4.2 Patrones que adoptamos (y el driver que justifica cada uno)

| Patrón | Aplicación concreta | Driver |
|---|---|---|
| **Monolito modular / vertical slices** | Estructura `features/*` | D6, mantenibilidad |
| **Transaction Script en Postgres** | RPC `save_transaction`, `ingest_bank_transaction` | D1 |
| **Strategy + Registry** | Un parser por banco: `{ id, matches(email), parse(email): BankEvent \| null }`, registrados en una lista. Nuevo banco = un archivo + fixtures, sin tocar el resto. | D3 |
| **Pipeline de funciones puras** | classify → parse → normalize → categorize | D2, D3 (testeable por etapa) |
| **Inbox + Idempotency Key** | Tabla `inbound_emails` + `source_email_id` único | D2 |
| **Adapter solo en fronteras externas reales** | `EmailProvider` (Gmail hoy), `RateProvider`, `LlmFallback` (opcional) | D2, D4 — se pueden simular en tests y cambiar de proveedor |
| **Query Key Factory** | `transactionKeys.list(filters)` | Elimina el bug actual de keys desalineadas |
| **Result type** | `type Result<T> = { ok: true; data: T } \| { ok: false; error: AppError }` en acciones | Errores explícitos a través de la frontera RSC |
| **Fixture / golden tests** | Correos reales anonimizados → `BankEvent` esperado | D3 |

### 4.3 SOLID aplicado (sin dogma)

- **S** — Dividir `useCatalogs.ts` y `transactions.ts`; cada archivo con una razón para cambiar (consulta, mutación, regla).
- **O** — Registro de parsers: se extiende agregando, no modificando.
- **L** — Todos los parsers cumplen el mismo contrato: nunca lanzan; devuelven `BankEvent` válido o `null` + motivo.
- **I** — Componentes reciben solo lo que usan (no el `Account` completo); hooks con APIs pequeñas.
- **D** — `domain/` y la ingesta dependen de abstracciones **solo** donde hay sustitución real (proveedor de correo, tasas, IA). Supabase **no** se abstrae: es una decisión estratégica, no un detalle.

---

## 5. ¿Rehacer el proyecto?

**Recomendación: no reescribir desde cero; refactor incremental (*strangler*) sobre el mismo repo.**

- La UI es el activo más valioso y está bien lograda → se conserva y se migra a `features/` por partes.
- Lo que sí se **reescribe**: la capa de datos (acciones/hooks), el camino de escritura (RPCs + migraciones) y la ingesta (nueva).
- Cada paso deja la app funcionando y desplegable.

**Orden propuesto:**

| Fase | Contenido | Resultado |
|---|---|---|
| **0. Fundaciones** | `supabase db pull` → migraciones; tipos generados; `env.ts`; Vitest/Playwright; CI; reglas de lint | Repo reproducible y verificable |
| **1. Seguridad y estabilidad** | Build, proxy, secretos, tokens fuera de `profiles`, `redirect`, `'use server'`, bugs de carga | App sana |
| **2. Camino de escritura** | RPCs atómicas para transacciones, trigger de saldo versionado, `recalculate_account_balance` | Invariantes del dinero garantizadas |
| **3. Reorganización por features** | Mover `transactions` primero (la más compleja), luego `accounts`, etc. Key factory, Result, lecturas por GET | Base mantenible |
| **4. Ingesta nativa** | `features/ingestion`: conector Gmail, inbox, parsers (port de v4.8 con fixtures), categorizador dinámico, RPC de ingesta, cron | Adiós n8n |
| **5. UI de sincronización y pulido** | Estado de Gmail, logs, reprocesar, métricas correctas | Producto completo |

---

## 6. Decisiones abiertas (bloquean partes del diseño)

> Actualización 2026-11-25: las preguntas 1–4 ya tienen respuesta y propuesta en `01-OFFLINE-E-INGESTA.md`.

1. **Alcance de usuarios:** ¿uso personal / pocos invitados, o producto público? El scope `gmail.modify` es **restringido** para Google: una app pública requiere verificación y auditoría de seguridad (CASA). En uso personal se queda en modo *testing* con usuarios de prueba. Esto también define si vale la pena `gmail.readonly` (menos permisos) + etiquetas.
2. **Hosting:** Vercel Hobby / Pro / VPS. Define el disparador de la ingesta (Vercel Cron, `pg_cron` de Supabase llamando a un endpoint, o worker en VPS) y los límites de tiempo de ejecución.
3. **Offline:** ¿solo lectura (recomendado) o también registrar transacciones sin conexión?
4. **Frecuencia de sincronización:** ¿cada 15–30 min es suficiente o se necesita casi tiempo real (Gmail Push vía Pub/Sub)?
5. **Pendiente de verificar en Supabase:** qué triggers/funciones existen hoy (en especial el que mantiene `current_balance`). Se resuelve en la Fase 0 con `supabase db pull`.
