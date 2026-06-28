# Auditoría Completa: YBank v2

> **Fecha:** 26 de junio de 2026
> **Propósito:** Auditoría consolidada de arquitectura, frontend, base de datos Supabase y workflow N8N Gastibiris.
> **Documentos fuente:** `analisis-completo-ybank-v2.md`, `supabase-audit-report.md`, `auditoria-gastibiris-n8n.md`

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura General](#3-arquitectura-general)
4. [Base de Datos Supabase](#4-base-de-datos-supabase)
5. [Frontend y Capa Cliente](#5-frontend-capa-y-cliente)
6. [Workflow N8N Gastibiris](#6-workflow-n8n-gastibiris)
7. [Matriz de Riesgos Consolidada](#7-matriz-de-riesgos-consolidada)
8. [Plan de Acción](#8-plan-de-acción)
9. [Conclusiones](#9-conclusiones)

---

## 1. Resumen Ejecutivo

**YBank v2** es una PWA de telemetría financiera personal con Next.js 16 App Router, Supabase, N8N y TanStack Query. Gestiona cuentas multi-moneda (DOP/USD), transacciones con desglose DGII-compatible, y un workflow N8N (Gastibiris) que automatiza la ingesta de correos bancarios desde Gmail.

### Estado General

| Aspecto | Estado |
|---------|--------|
| Core funcional (Auth, CRUD) | ✅ Completo |
| Offline-first (IndexedDB) | ✅ Implementado |
| PWA | ✅ Service Worker + manifest |
| UI/UX | ✅ Profesional (Framer Motion, glassmorphism) |
| Fase 3 (Gmail Parser) | ❌ `src/services/mail/parser.ts` vacío |
| Fase 4 (AI Pipeline) | ❌ Carpeta `/ai` no existe |
| Tests | ❌ 0% cobertura (Cypress solo youtube.com) |
| TypeScript strict | ⚠️ Uso extensivo de `any` |
| Hooks duplicados | ❌ `useSaveTransaction` × 2 |
| Middleware proxy.ts | ❌ No integrado en Next.js |
| Workflow N8N Gastibiris | ⚠️ Funcional pero con 4 issues críticos de seguridad |
| Seguridad Supabase | ⚠️ 11 issues de linter, 4 críticos |

---

## 2. Stack Tecnológico

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Next.js | 16.2.3 | Framework React (App Router) |
| React | 19.2.5 | UI Library |
| Supabase SSR | 0.8.0 | Auth + Database + Storage |
| TanStack React Query | 5.100.7 | Data fetching, caching, persistencia offline |
| Zustand | 5.0.12 | Estado UI cliente |
| Framer Motion | 12.38.0 | Animaciones |
| Tailwind CSS | 4 | Utility-first CSS |
| date-fns | 4.1.0 | Fechas |
| sonner | 2.0.7 | Notificaciones toast |
| idb-keyval | 6.2.2 | IndexedDB wrapper |
| next-pwa | 10.2.9 | PWA + Workbox |
| lucide-react | 0.562.0 | Iconos |
| N8N | — | Workflow automation (Gastibiris) |

---

## 3. Arquitectura General

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  src/app/ (pages)          │  src/components/ (UI)           │
├─────────────────────────────────────────────────────────────┤
│                      CLIENT STATE LAYER                       │
│  Zustand Stores (Filter, Modal, Selection, YBank)            │
│  TanStack Query Cache + IndexedDB Persister                  │
├─────────────────────────────────────────────────────────────┤
│                         HOOKS LAYER                           │
│  src/hooks/useCatalogs.ts (14 hooks)                         │
│  src/hooks/useTransactionsMutation.ts (DUPLICADO)            │
├─────────────────────────────────────────────────────────────┤
│                   SERVER ACTIONS LAYER                        │
│  src/lib/actions/ (auth, accounts, transactions, etc.)        │
├─────────────────────────────────────────────────────────────┤
│                        SERVICE LAYER                          │
│  src/services/rates.ts (Smart Rate)                           │
│  src/services/mail/parser.ts (VACÍO)                          │
├─────────────────────────────────────────────────────────────┤
│                         DATA LAYER                            │
│  Supabase (PostgreSQL + Auth + Storage)                       │
│  N8N Gastibiris (Workflow automation)                         │
│  External: open.er-api.com, Gmail API, Google OAuth           │
└─────────────────────────────────────────────────────────────┘
```

### Flujo SSR → Client Hydration

```
1. Root Layout (server) → sesión de cookies → ThemeProvider + QueryProvider
2. Dashboard Layout (server) → Promise.all(6 queries Supabase) → DashboardProviders
3. DashboardProviders (client):
   ├── QueryProvider (TanStack + IndexedDB persister)
   ├── DataHydrator (SSR → TanStack cache via setQueryData)
   ├── StoreInitializer (Zustand desde SSR)
   └── AuthWatcher (onAuthStateChange → SIGNED_OUT → limpia queryClient)
4. Componentes → hooks TanStack Query con cache hidratada
```

### Flujo Offline

```
Online:  useTransactionsList → fetch → cache IndexedDB
         useSaveTransaction → mutateAsync → server action → invalidateQueries

Offline: useTransactionsList → cache hit → muestra datos offline
         useSaveTransaction → check offline → postMessage('sync-queue')
         → Al volver online: service worker replay → sync → invalidateQueries
```

---

## 4. Base de Datos Supabase

### 4.1 Esquema (8 tablas)

| Tabla | Filas | Propósito |
|-------|-------|-----------|
| `institutions` | 15 | Bancos con colores, patrones, ajustes de tasa |
| `accounts` | 38 | Cuentas multi-moneda, multi-tipo |
| `categories` | — | Árbol jerárquico income/expense |
| `transactions` | 1,144 | Transacciones con match_key anti-duplicados |
| `tags` | 11 | Etiquetas |
| `transaction_tags` | 43 | Junción tags ↔ transacciones |
| `transaction_items` | 659 | Desglose DGII (cantidad, precio, ITBIS) |
| `profiles` | 6 | Preferencias + tokens Google OAuth |

### 4.2 RLS y Seguridad

| Tabla | RLS | Políticas |
|-------|-----|-----------|
| institutions | ✅ | SELECT público |
| accounts | ✅ | Solo cuentas del usuario |
| categories | ✅ | Del usuario o system |
| transactions | ✅ | Multi-nivel (user_id + a_search) |
| tags | ✅ | Solo tags del usuario |
| profiles | ✅ | Solo propio perfil |

### 4.3 Issues de Seguridad (11 detectados)

#### 🔴 Críticos

1. **function_search_path_mutable** — 6 funciones (`handle_auth_user_sync`, `handle_transaction_after_insert`, etc.) con `search_path` mutable → riesgo de SQL injection
2. **SECURITY DEFINER functions** — 6 funciones ejecutables por `anon`/`authenticated`, pueden escalar privilegios
3. **public_bucket_allows_listing** — Bucket `avatars` permite listar todos los archivos públicamente

#### 🟡 Altos

4. **auth_leaked_password_protection** — Protección HaveIBeenPwned deshabilitada
5. **Sin validación Zod** en server actions
6. **Sign-up bypass** — Redirige a onboarding sin verificar confirmación de email

#### 🔵 Medios

7. **Missing indexes** — Faltan índices en `transactions(user_id, date)`, `accounts(user_id, is_active)`, `transaction_items(transaction_id, category_id)`
8. **calculateNormalizedTotal sin paralelismo** — Itera secuencialmente
9. **Flattening duplicado** server + client
10. **QueryKey fragmentada** — Filtros como `''` en lugar de `undefined` crea múltiples keys
11. **console.log en producción**

---

## 5. Frontend y Capa Cliente

### 5.1 Server Actions (9 archivos)

| Archivo | Funciones | Estado |
|---------|-----------|--------|
| `auth.ts` | signUp, login, signInWithGoogle, completeOnboarding, signOut | ✅ |
| `accounts.ts` | CRUD cuentas + calculateNormalizedTotal | ✅ |
| `transactions.ts` | CRUD transacciones + filtros + flattening | ✅ (flattening duplicado) |
| `categories.ts` | getCategories | ✅ |
| `tags.ts` | createTag, getTags | ✅ |
| `institutions.ts` | getInstitutions | ✅ |
| `profile.ts` | getProfile, updateProfile | ✅ |
| `settings.ts` | updatePreferences | ⚠️ Mezcla password + currency |
| `storageService.ts` | uploadAvatar | ✅ |

### 5.2 Hooks (14, 2 archivos)

`useCatalogs.ts` (427 líneas):

| Hook | QueryKey | staleTime | Propósito |
|------|----------|-----------|-----------|
| useCategories | ['categories'] | ∞ | Árbol de categorías |
| useTags | ['tags'] | ∞ | Lista de tags |
| useInstitutions | ['institutions'] | ∞ | Lista de bancos |
| useAccounts | ['accounts'] | 30 min | Cuentas del usuario |
| useTransactionsList | ['transactions', type, categoryId, tagId, from, to, search, page] | 5 min | Tx paginadas con filtros |
| useTransactionById | ['transaction', id] | 30 min | Tx individual |
| useTransactionsByAccount | ['transactions', accountId] | 5 min | Tx por cuenta |
| useProfile | ['profile'] | ∞ | Perfil |
| useProfileNameImage | ['profile', 'name-image'] | ∞ | Nombre + avatar |
| useCurrency | — | — | Conversión DOP↔USD |
| useSaveTransaction | mutationFn | — | Crear/actualizar tx |
| useDeleteTransaction | mutationFn | — | Archivar tx |
| useSaveTag | mutationFn | — | Crear tag |
| useGlobalSearch | ['global-search', query] | 0 | Búsqueda global |

**🔴 `useTransactionsMutation.ts` (60 líneas) — DUPLICADO**: `useSaveTransaction` sin offline check ni `sanitizeDate`. Si un componente importa del archivo incorrecto, la protección offline se pierde.

### 5.3 Stores Zustand (4)

| Store | Persistencia | Slice |
|-------|-------------|-------|
| `useYBankStore` | ✅ localStorage | preferredCurrency, preferredAccountId, preferredRate, smartRate |
| `useFilterStore` | ❌ | type, categoryId, tagId, from, to, search |
| `useModalStore` | ❌ | isOpen, modalType, modalPayload |
| `useSelectionStore` | ❌ | selectedTx (Record<string, any>), selectMode |

### 5.4 Páginas (12)

| Ruta | Tipo | Estado |
|------|------|--------|
| `/` (landing) | Server | ✅ Hero + Bento grid |
| `/(auth)/sign-in` | Client | ✅ Email + Google OAuth |
| `/(auth)/sign-up` | Client | 🔴 Redirige a onboarding sin verificar confirmación email |
| `/(auth)/onboarding` | Server | ✅ Wizard multi-step |
| `/(auth)/auth/callback` | API | ✅ OAuth + guardado tokens Gmail |
| `/(dashboard)/dashboard` | Server | ✅ Balance, CreditHealth, transacciones |
| `/(dashboard)/accounts` | Server | ✅ Carousel 3D + detalles |
| `/(dashboard)/transactions` | Server | ✅ Ledger completo |
| `/(dashboard)/settings` | Server | ⚠️ Solo tab Preferencias visible |
| `/(dashboard)/layout` | Server | ✅ Auth check + SSR data |
| `/(auth)/sign-in/actions.ts` | Server | ✅ Server actions de sign-in |

### 5.5 Componentes Destacados (63 totales)

| Componente | Líneas | Propósito |
|-----------|--------|-----------|
| `UniversalCard.tsx` | 529 | 7 patrones bancarios, editable/read-only, color picker |
| `TransactionForm.tsx` | 280 | 3 tipos de tx, split gastos, tags, date picker |
| `AccountStageSelector.tsx` | 200 | Carrusel 3D con Framer Motion, drag gestures |
| `TransactionFilterBar.tsx` | 160 | Tabs Global/Income/Expense/Transfers, categoría, calendario |
| `CreditHealthBento.tsx` | 150 | ⚠️ Potencial loop infinito con preferredRate |
| `ClientTransactionTable.tsx` | 130 | ⚠️ Flattening duplicado (también en server) |
| `HeroBalance.tsx` | 120 | ⚠️ console.log en producción |
| `ExpenseSplitSection.tsx` | 100 | Validación split vs total |
| `TagInput.tsx` | 100 | Autocomplete con posicionamiento inteligente |
| `YBankCalendarPicker.tsx` | 100 | Portal-based, presets, responsive |

### 5.6 Issues de Frontend

#### 🔴 Críticos

1. **Hook duplicado** — `useSaveTransaction` en `useCatalogs.ts` (completo) y `useTransactionsMutation.ts` (sin offline check)
2. **Sign-up → onboarding roto** — Redirige sin verificar confirmación de email
3. **Proxy.ts no integrado** — Middleware offline-first nunca se ejecuta

#### 🟡 Altos

4. **Flattening duplicado** — `transactions.ts:122-156` (server) + `ClientTransactionTable.tsx:34-72` (client)
5. **Uso extensivo de `any`** — `TransactionForm.tsx`, `TransactionRow.tsx`, `ExpenseSplitSection.tsx`, `ClientTransactionTable.tsx`
6. **QueryKey hardcodeada** — `DashboardProviders.tsx:87`
7. **emptyInstitution con id:''** — Puede insertar `institution_id: ''` en BD
8. **Undefined crash** — `TransactionForm.tsx:63-66` — `.filter()` falla si `initialData` es undefined
9. **PWA crash potencial** — `PWAFooter.tsx` — `installPrompt.prompt()` sin try-catch
10. **Loop infinito** — `CreditHealthBento.tsx` con `isWaitingForRate`

#### 🟢 Medios

11. `console.log` en `HeroBalance.tsx`
12. Security/Notifications tabs comentados en settings
13. Font `IBM Plex Serif` declarado en CSS pero no importado
14. `CARD_COLORS` no usado en `constants/theme.ts`
15. `ACCOUNT_TYPE_CONFIG` duplicado entre `constants.ts` y `UniversalCard.tsx`

---

## 6. Workflow N8N Gastibiris

### 6.1 Ficha Técnica

| Métrica | Valor |
|---------|-------|
| **Workflow ID** | `LKqMTcPD3Xp04DIs` |
| **Estado** | Activo (`active: true`) |
| **MCP** | Disponible |
| **Nodos** | 22 |
| **Conexiones** | 30 |
| **Tipos de nodo** | Schedule Trigger, PostgreSQL, HTTP Request, Code, If, SplitInBatches, SplitOut, Merge |
| **APIs externas** | Gmail API, Google OAuth 2.0 |
| **Bancos soportados** | Lafise, Qik, Scotiabank, APAP, Banreservas, BHD, PayPal |
| **Parser** | Determinista v4.6 (regex) — sin IA |

### 6.2 Diagrama de Flujo

```
Schedule Trigger
    │
    ▼
[FASE 1: AUTENTICACIÓN]
    Obtener usuarios con tokens → Loop Over Items1 → If2 (token expirado?)
        ├── Sí → HTTP Request1 (refresh OAuth) → SQL query2 (actualizar BD)
        └── No ──────────────────────────────────→ Merge
    Merge → [FASE 2: EXTRACCIÓN]
    │
    ▼
[FASE 2: EXTRACCIÓN DE CORREOS]
    HTTP Request2 (buscar mensajes Gmail) → Split Out → If3 (hay mensajes?)
        ├── No → vuelve a Loop Over Items1
        └── Sí → SQL query (obtener cuentas) → PrepararCuentas
    │
    ▼
[FASE 3: PROCESAMIENTO]
    Loop Over Items2 (batch 50)
        → HTTP Request3 (get body)
        → ContenidoCorreo (Base64 → texto)
        → LoopCorreos → If1 (filtro anti-informativos)
            ├── Informativo → HTTP Request4 (marcar leído)
            └── Válido → Code in JS2 (Parser Determinista v4.6)
    │
    ▼
[FASE 4: PERSISTENCIA]
    Code in JS (mapeo categorías + clasificación)
        → If (is_valid?)
            ├── Sí → Buscar Usuario (PL/pgSQL upsert institución + cuenta + tx)
            │        → HTTP Request4 (marcar leído)
            └── No → HTTP Request4 (marcar leído sin persistir)
```

### 6.3 Análisis por Nodo

| # | Nodo | Tipo | Propósito | Estado |
|---|------|------|-----------|--------|
| 1 | Schedule Trigger | Trigger | Ejecución periódica | ✅ |
| 2 | Execute SQL query1 | PostgreSQL | Obtener usuarios con tokens | ✅ |
| 3 | Loop Over Items1 | SplitInBatches | Bucle de usuarios | ✅ |
| 4 | If2 | If | Validar expiración de token | ✅ |
| 5 | HTTP Request1 | HTTP | Refrescar token OAuth | 🔴 **Credenciales hardcodeadas** |
| 6 | Execute SQL query2 | PostgreSQL | Actualizar token en BD | ✅ |
| 7 | Merge | Merge | Combinar rutas refrescado/vigente | ⚠️ Sin modo definido |
| 8 | HTTP Request2 | HTTP | Buscar mensajes Gmail | ✅ |
| 9 | Split Out | SplitOut | Separar array messages | ✅ |
| 10 | If3 | If | Validar si hay mensajes | 🔴 **Bug: evalúa item incorrecto** |
| 11 | Execute SQL query | PostgreSQL | Obtener cuentas del usuario | ✅ |
| 12 | PrepararCuentas | Code | Formatear cuentas para parser | ⚠️ Referencia incorrecta a If3 |
| 13 | Loop Over Items2 | SplitInBatches | Bucle batch de correos (50) | ⚠️ **Bucle infinito potencial** |
| 14 | HTTP Request3 | HTTP | Obtener cuerpo del mensaje | ✅ |
| 15 | ContenidoCorreo | Code | Decodificar Base64 + limpiar HTML | ✅ |
| 16 | LoopCorreos | SplitInBatches | Bucle individual de correos | ✅ |
| 17 | If1 | If | Filtro anti-informativos | ⚠️ Solo 2 palabras clave |
| 18 | Code in JS2 | Code | Parser Determinista v4.6 | ✅ |
| 19 | Code in JS | Code | Mapeo categorías + clasificación | ⚠️ UUIDs hardcodeados |
| 20 | If | If | Validar transacción válida | ✅ |
| 21 | Buscar Usuario | PostgreSQL | PL/pgSQL upsert complejo | 🔴 **SQL injection potencial** |
| 22 | HTTP Request4 | HTTP | Marcar correo como leído | ✅ |

### 6.4 Issues de Seguridad N8N

#### 🔴 Críticos

1. **Credenciales Google OAuth hardcodeadas** — `client_id` y `client_secret` en texto plano en nodo HTTP Request1
2. **SQL injection potencial** — Variables N8N interpoladas directamente en PL/pgSQL del nodo `Buscar Usuario`
3. **UUIDs de categorías hardcodeados** — Si cambian en Supabase, el mapeo falla silenciosamente
4. **Bucle infinito potencial** — Loop Over Items2 → Loop Over Items1 → ... → Loop Over Items2 sin control de profundidad

#### 🟡 Altos

5. **If3 bug** — Evalúa `resultSizeEstimate` después de Split Out; cada item es `{ id, threadId }`, no la respuesta original
6. **Merge sin modo definido** — Comportamiento impredecible con múltiples usuarios
7. **Sin reintentos en APIs HTTP** — Gmail API sin retry policy
8. **Sin paginación en Gmail API** — Máximo 100 correos por ejecución
9. **PL/pgSQL monolítico** — Un nodo hace institución + cuenta + transacción; si falla, todo se pierde

#### 🟢 Medios

10. **Filtro If1 limitado** — Solo 2 palabras clave anti-informativos
11. **Sin logging de errores** en parser determinista
12. **Sin monitoreo ni alertas** de fallos
13. **Intervalo fijo** sin backoff adaptativo

---

## 7. Matriz de Riesgos Consolidada

| ID | Riesgo | Capa | Severidad | Impacto | Probabilidad |
|----|--------|------|-----------|---------|-------------|
| **R1** | Credenciales Google OAuth expuestas en N8N | N8N | 🔴 Crítico | Robo de credenciales, acceso no autorizado a Gmail | Alta |
| **R2** | SQL injection en PL/pgSQL de Gastibiris | N8N/BD | 🔴 Crítico | Ejecución de SQL arbitrario en Supabase | Alta |
| **R3** | Proxy.ts no integrado → rutas desprotegidas | Frontend | 🔴 Crítico | Usuarios sin sesión acceden al dashboard | Alta |
| **R4** | Hook duplicado → offline check omitido | Frontend | 🔴 Crítico | Operaciones offline sin protección de red | Alta |
| **R5** | If3 bug (resultSizeEstimate después de Split Out) | N8N | 🔴 Crítico | Filtro de correos nunca funciona | Alta |
| **R6** | Bucle infinito Loop Items2 → Loop Items1 | N8N | 🔴 Crítico | Workflow nunca termina, consumo infinito de recursos | Media |
| **R7** | Sign-up redirige a onboarding sin sesión | Frontend | 🔴 Crítico | Usuario queda atrapado sin poder continuar | Alta |
| **R8** | SECURITY DEFINER functions ejecutables por anon | BD | 🔴 Crítico | Escalada de privilegios en Supabase | Media |
| **R9** | function_search_path_mutable | BD | 🔴 Crítico | SQL injection potencial en funciones | Media |
| **R10** | Public bucket listing (avatars) | BD | 🟡 Alto | Fuga de avatars de usuarios | Alta |
| **R11** | auth_leaked_password_protection deshabilitado | BD | 🟡 Alto | Contraseñas comprometidas no detectadas | Media |
| **R12** | Server actions sin input validation | Frontend | 🟡 Alto | Inserción de datos inválidos en BD | Media |
| **R13** | UUIDs de categorías hardcodeados en N8N | N8N | 🟡 Alto | Mapeo roto si cambian en BD | Alta |
| **R14** | PL/pgSQL monolítico sin manejo de errores por paso | N8N | 🟡 Alto | Fallo total si un paso intermedio falla | Media |
| **R15** | Flattening duplicado server + client | Frontend | 🟡 Medio | Lógica inconsistente, bugs sutiles | Media |
| **R16** | Filtro If1 muy limitado (2 palabras clave) | N8N | 🟢 Medio | Falsos positivos en correos informativos | Alta |
| **R17** | console.log en producción | Frontend | 🟢 Bajo | Fuga de datos en consola | Alta |
| **R18** | Sin tests (0% cobertura) | Global | 🟡 Alto | Cualquier refactor es riesgoso | Alta |
| **R19** | Fases 3 (Gmail) y 4 (AI) sin implementar | Services | 🟡 Alto | Diferenciador del producto no implementado | Alta |

---

## 8. Plan de Acción

### Fase 0: Seguridad Inmediata (HOY)

| # | Acción | Responsable | Riesgo asociado |
|---|--------|------------|-----------------|
| 1 | Mover `client_id`/`client_secret` a credenciales N8N | N8N | R1 |
| 2 | Rotar Google OAuth `client_secret` (ya expuesto en JSON) | Google Cloud | R1 |
| 3 | Sanitizar variables SQL en nodo `Buscar Usuario` (usar parámetros) | N8N | R2 |
| 4 | Revocar EXECUTE de SECURITY DEFINER functions a anon/authenticated | Supabase | R8 |
| 5 | Fix `function_search_path_mutable` en 6 funciones | Supabase | R9 |
| 6 | Restringir bucket `avatars` (quitar SELECT público) | Supabase | R10 |

### Fase 1: Correcciones Críticas (1-3 días)

| # | Acción | Capa | Riesgo |
|---|--------|------|--------|
| 7 | Integrar `proxy.ts` en middleware de Next.js | Frontend | R3 |
| 8 | Eliminar `useTransactionsMutation.ts`, migrar imports a `useCatalogs.ts` | Frontend | R4 |
| 9 | Corregir If3: evaluar `resultSizeEstimate` antes de Split Out | N8N | R5 |
| 10 | Agregar control de profundidad en loops N8N | N8N | R6 |
| 11 | Fix sign-up: verificar email confirmation antes de redirect a onboarding | Frontend | R7 |
| 12 | Eliminar flattening duplicado en `ClientTransactionTable.tsx` | Frontend | R15 |
| 13 | Obtener categorías desde Supabase en lugar de hardcodear UUIDs | N8N | R13 |

### Fase 2: Mejoras de Calidad (1-2 semanas)

| # | Acción | Capa | Prioridad |
|---|--------|------|-----------|
| 14 | Reemplazar `any` con tipos concretos en componentes clave | Frontend | Alta |
| 15 | Agregar validación Zod en server actions | Frontend | Alta |
| 16 | Agregar Error Boundaries en dashboard layout | Frontend | Alta |
| 17 | Configurar Merge con modo `append` explícito en N8N | N8N | Alta |
| 18 | Agregar reintentos con backoff en HTTP requests N8N | N8N | Alta |
| 19 | Expandir filtro If1 con más palabras clave | N8N | Media |
| 20 | Agregar logging de errores en Parser Determinista | N8N | Media |
| 21 | Separar PL/pgSQL monolítico en nodos individuales | N8N | Alta |
| 22 | Agregar índices faltantes en Supabase | BD | Alta |
| 23 | Unificar `ACCOUNT_TYPE_CONFIG` | Frontend | Media |
| 24 | Eliminar `console.log` en producción | Frontend | Baja |

### Fase 3: Features Pendientes (Sprint 2-4)

| # | Acción | Capa | Prioridad |
|---|--------|------|-----------|
| 25 | Implementar `src/services/mail/parser.ts` (Fase 3) | Services | Alta |
| 26 | Implementar AI Pipeline (`src/services/ai/`) (Fase 4) | Services | Alta |
| 27 | Implementar refresh token flow Gmail (tokens ya guardados en profiles) | Frontend | Alta |
| 28 | Agregar paginación en Gmail API de N8N | N8N | Alta |
| 29 | Escribir tests Cypress (auth → dashboard → transacción) | Tests | Alta |
| 30 | Escribir tests unitarios para Parser Determinista | Tests | Media |
| 31 | Versionar workflow JSON de N8N en git | N8N | Media |
| 32 | Implementar monitoreo y alertas de fallos en N8N | N8N | Media |
| 33 | Agregar fallback IA para formatos de correo no reconocidos | N8N | Media |

### Fase 4: Optimización (Sprint 5+)

| # | Acción | Capa | Prioridad |
|---|--------|------|-----------|
| 34 | Skeleton loaders (HeroBalance, TransactionTable) | Frontend | Media |
| 35 | Virtual scrolling para TransactionTable (react-virtual) | Frontend | Media |
| 36 | Cachear `getSmartRate` con `React.cache()` | Frontend | Media |
| 37 | Suspense boundaries para modales y gráficos | Frontend | Media |
| 38 | Habilitar protección auth_leaked_password_protection | Supabase | Media |
| 39 | Configurar Schedule Trigger con backoff adaptativo | N8N | Baja |

---

## 9. Conclusiones

### Scorecard General

| Categoría | Puntaje | Evaluación |
|-----------|---------|------------|
| **Arquitectura** | 8/10 | SSR + TanStack + IndexedDB + Zustand: combinación moderna y correcta |
| **Frontend (UI/UX)** | 8/10 | Profesional, animado, responsive, componentes reutilizables |
| **Base de Datos** | 6/10 | Schema bien diseñado, RLS correcto, pero 11 issues de seguridad |
| **Workflow N8N Gastibiris** | 6/10 | Extremadamente funcional, pero 4 issues críticos de seguridad |
| **Testing** | 0/10 | Sin cobertura real |
| **TypeScript** | 5/10 | Uso extensivo de `any` invalida beneficios de TS |
| **Seguridad General** | 4/10 | Credenciales expuestas, SQL injection, funciones inseguras |
| **Total** | **5.3/10** | Base sólida, pero riesgos de seguridad severos |

### Resumen

**YBank v2 es un proyecto ambicioso con una base técnica sólida.** La arquitectura offline-first es correcta, la UI es profesional, y el workflow N8N Gastibiris automatiza correctamente la ingesta de correos bancarios con un parser determinista robusto (v4.6) que soporta 7+ bancos dominicanos.

Sin embargo, el proyecto tiene **7 issues críticos** que deben resolverse antes de considerar producción:

1. **🔴 Credenciales Google OAuth expuestas** en el JSON del workflow Gastibiris (HTTP Request1)
2. **🔴 SQL injection potencial** en PL/pgSQL del nodo `Buscar Usuario`
3. **🔴 Bug If3** — filtro de correos nunca evalúa correctamente tras Split Out
4. **🔴 Bucle infinito potencial** en conexiones Loop Over Items2 → Loop Over Items1
5. **🔴 Proxy.ts no integrado** — middleware offline-first no protege rutas
6. **🔴 Hook duplicado** — `useSaveTransaction` sin offline check en `useTransactionsMutation.ts`
7. **🔴 Sign-up → onboarding roto** — redirige sin verificar confirmación de email

Una vez resueltos estos issues, el proyecto requiere implementar las **Fases 3 (Gmail Parser)** y **4 (AI Pipeline)**, que son los verdaderos diferenciadores del producto. El código fuente ya tiene los tokens OAuth almacenados en `profiles` — solo falta el adapter.

### Próximos Pasos Inmediatos

```
DÍA 1:  Rotar client_secret Google OAuth + mover a credenciales N8N
        Sanitizar SQL en nodo Buscar Usuario
        Fix SECURITY DEFINER functions en Supabase
        Restringir bucket avatars

DÍA 2:  Integrar proxy.ts en Next.js middleware
        Eliminar hook duplicado
        Corregir If3 bug + agregar control de profundidad en loops
        Fix sign-up → onboarding redirect

DÍA 3:  Obtener categorías desde Supabase en N8N
        Eliminar flattening duplicado
        Agregar reintentos con backoff en HTTP requests N8N
```

---

*Documento consolidado a partir de `analisis-completo-ybank-v2.md`, `supabase-audit-report.md` y `auditoria-gastibiris-n8n.md`*
*Workflow N8N ID: LKqMTcPD3Xp04DIs*
