# Análisis Completo: YBank v2

> **Fecha:** 26 de junio de 2026
> **Propósito:** Documentación exhaustiva de la arquitectura, componentes, flujos de datos, riesgos y plan de acción del proyecto YBank v2.

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura Técnica](#2-arquitectura-técnica)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Mapa de Capas y Dependencias](#4-mapa-de-capas-y-dependencias)
5. [Data Flow Completo](#5-data-flow-completo)
6. [Inventario de Archivos](#6-inventario-de-archivos)
   - 6.1 [Páginas](#61-páginas)
   - 6.2 [Server Actions](#62-server-actions)
   - 6.3 [Services](#63-services)
   - 6.4 [Hooks](#64-hooks)
   - 6.5 [Stores Zustand](#65-stores-zustand)
   - 6.6 [Componentes UI](#66-componentes-ui)
   - 6.7 [Providers](#67-providers)
   - 6.8 [Configuración](#68-configuración)
7. [Análisis Crítico por Capa](#7-análisis-crítico-por-capa)
   - 7.1 [Server Actions](#71-server-actions)
   - 7.2 [Services](#72-services)
   - 7.3 [Hooks](#73-hooks)
   - 7.4 [Stores Zustand](#74-stores-zustand)
   - 7.5 [Componentes UI](#75-componentes-ui)
   - 7.6 [Páginas](#76-páginas)
   - 7.7 [Configuración y Estilos](#77-configuración-y-estilos)
8. [Matriz de Riesgos](#8-matriz-de-riesgos)
9. [Árbol de Decisiones Técnicas](#9-árbol-de-decisiones-técnicas)
10. [Plan de Acción Recomendado](#10-plan-de-acción-recomendado)
11. [Métricas del Proyecto](#11-métricas-del-proyecto)
12. [Conclusión](#12-conclusión)

---

## 1. Resumen Ejecutivo

**YBank v2** es una aplicación PWA de telemetría financiera personal construida con Next.js 16 App Router. Gestiona cuentas multi-moneda (DOP/USD), transacciones con desglose por ítems (DGII-compatible), y un motor inteligente de tasas de cambio. Sigue una arquitectura **layered** con Server Actions, TanStack Query + IndexedDB para offline-first, y Zustand para estado UI.

### Estado General

| Aspecto | Estado |
|---------|--------|
| Core funcional | ✅ Completo (Auth, CRUD transacciones/cuentas, filtros) |
| Offline-first | ✅ Implementado (IndexedDB persister, networkMode offlineFirst) |
| PWA | ✅ Service Worker + manifest |
| Diseño UI/UX | ✅ Profesional (Framer Motion, glassmorphism, responsive) |
| Fase 3 (Gmail) | ❌ **No implementado** (parser.ts vacío) |
| Fase 4 (AI) | ❌ **No implementado** (carpeta /ai no existe) |
| Tests | ❌ **0% cobertura** (Cypress solo tiene youtube.com) |
| TypeScript strict | ⚠️ Parcial (uso extensivo de `any`) |
| Hooks duplicados | ❌ **Bug crítico** (useSaveTransaction ×2) |
| Middleware | ❌ **Proxy.ts no integrado** |

---

## 2. Arquitectura Técnica

### 2.1 Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                               │
│  src/app/ (pages)            │  src/components/ (UI)                │
├─────────────────────────────────────────────────────────────────────┤
│                      CLIENT STATE LAYER                             │
│  Zustand Stores (Filter, Modal, Selection, YBank)                  │
│  TanStack Query Cache + IndexedDB Persister                        │
├─────────────────────────────────────────────────────────────────────┤
│                         HOOKS LAYER                                 │
│  src/hooks/                                                        │
│  - useCatalogs.ts (14 hooks: useAccounts, useTransactionsList,     │
│    useProfile, useSaveTransaction, useDeleteTransaction, etc.)      │
│  - useTransactionsMutation.ts (useSaveTransaction DUPLICADO)       │
├─────────────────────────────────────────────────────────────────────┤
│                   SERVER ACTIONS LAYER (Controllers)                │
│  src/lib/actions/                                                   │
│  - auth.ts, accounts.ts, transactions.ts, categories.ts, tags.ts,  │
│    institutions.ts, profile.ts, settings.ts, storageService.ts      │
│  → 'use server' functions that call Supabase directly               │
├─────────────────────────────────────────────────────────────────────┤
│                        SERVICE LAYER                                │
│  src/services/                                                      │
│  - rates.ts (Smart Rate con spreads bancarios)                     │
│  - mail/parser.ts (VACÍO - Fase 3 pendiente)                       │
├─────────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                                  │
│  Supabase (PostgreSQL + Auth + Storage)                             │
│  External: open.er-api.com (tasas de cambio)                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Stack Tecnológico

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Next.js | 16.2.3 | Framework React (App Router) |
| React | 19.2.5 | UI Library |
| Supabase SSR | 0.8.0 | Auth + Database + Storage |
| TanStack React Query | 5.100.7 | Data fetching, caching, persistencia offline |
| Zustand | 5.0.12 | Estado UI cliente (filtros, modal, selección, preferencias) |
| Framer Motion | 12.38.0 | Animaciones declarativas |
| Tailwind CSS | 4 | Utility-first CSS |
| date-fns | 4.1.0 | Manipulación de fechas |
| sonner | 2.0.7 | Notificaciones toast |
| idb-keyval | 6.2.2 | IndexedDB wrapper para TanStack Persister |
| next-pwa | 10.2.9 | PWA + Workbox Service Worker |
| lucide-react | 0.562.0 | Iconos SVG |
| @supabase/supabase-js | 2.49.0 | Cliente Supabase |

---

## 4. Mapa de Capas y Dependencias

### Flujo de Datos General

```
[Usuario] → [Página Server (RSC)]
              │
              ├── createSupabaseClient() ← cookies()
              │
              ├── Promise.all([
              │     getAccounts(), getTransactions(), getTags(),
              │     getCategories(), getInstitutions(), getProfile()
              │   ])
              │
              └── [DashboardProviders (Client)]
                    ├── QueryProvider (TanStack + IndexedDB persister)
                    ├── AuthWatcher (onAuthStateChange → SIGNED_OUT)
                    ├── DataHydrator (setQueryData SSR → TanStack)
                    ├── StoreInitializer (preferredAccountId → Zustand)
                    └── ModalProvider (renderiza modals)
                          │
                          └── [Página renderizada]
                                ├── HeroBalance (NetWorth + SmartRate)
                                ├── CreditHealthBento
                                ├── AccountCarousel
                                ├── TransactionFilterBar
                                └── ClientTransactionTable
                                      └── [useTransactionsList (TanStack)]

[Actions del usuario]
      │
      ├── Click "Nueva Transacción"
      │     → useModalStore.openModal('transaction')
      │     → ModalProvider renderiza TransactionModalWrapper
      │     → TransactionForm con categorías/tags/cuentas desde cache
      │     → Submit: useSaveTransaction.mutateAsync(data)
      │         → server action 'createTransaction'
      │         → TanStack invalidateQueries → refetch
      │
      ├── Cambiar filtro
      │     → useFilterStore.setFilters({ type, category, ... })
      │     → useTransactionsList reactivo (queryKey cambia)
      │     → TanStack fetch new data (o cache hit)
      │
      └── Toggle moneda USD/DOP
            → useYBankStore.setPreferredCurrency()
            → useCurrency hook recalcula montos
```

---

## 5. Data Flow Completo

### SSR → Client Hydration

```
1. Root Layout (server)
   → createClient(): obtiene sesión de cookies
   → Renderiza children + ThemeProvider + QueryProvider

2. Dashboard Layout (server)
   → Promise.all(6 queries a Supabase)
   → Renderiza DashboardProviders con data serializada

3. DashboardProviders (client)
   → QueryProvider: new QueryClient + IndexedDB persister
   → DataHydrator: inyecta SSR data a TanStack cache via setQueryData
   → StoreInitializer: setea preferredAccountId en Zustand
   → AuthWatcher: escucha SIGNED_OUT, limpia queryClient

4. Componentes (client)
   → useAccounts: usa TanStack cache (hydrated de SSR)
   → useTransactionsList: queryKey incluye filters → fetch
   → useCurrency: convierte DOP ↔ USD según preferredCurrency
```

### Offline Data Flow

```
[Online]
  useTransactionsList(params) → fetch → cache en IndexedDB
  useSaveTransaction(data) → mutateAsync → server action → invalidateQueries

[Offline]
  useTransactionsList(params) → cache hit → muestra datos offline
  useSaveTransaction(data) → check offline → app.postMessage('sync-queue')
    → Al volver online: service worker replay → sync → invalidateQueries
```

---

## 6. Inventario de Archivos

### 6.1 Páginas (12)

| Archivo | Tipo | Propósito | Dependencias |
|---------|------|-----------|-------------|
| `src/app/page.tsx` | Landing | Hero + Bento grid + footer | Logo, TextReveal, WaveLayer, AuthCard |
| `src/app/layout.tsx` | Root | Providers globales, font, SW | ThemeProvider, QueryProvider, Toaster |
| `src/app/(auth)/sign-in/page.tsx` | Login | Email + Google OAuth + Passkey | AuthCard, PassKeyButton, ButtonOla |
| `src/app/(auth)/sign-up/page.tsx` | Registro | Form registro + Google OAuth | AuthCard, ButtonOla |
| `src/app/(auth)/onboarding/page.tsx` | Server | Wizard multi-step post-auth | OnboardingForm |
| `src/app/(auth)/sign-in/actions.ts` | Server | Server actions de sign-in | auth.ts actions |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard | Balance + Credit + Transacciones | HeroBalance, CreditHealthBento, AccountCarousel, TransactionFilterBar, ClientTransactionTable |
| `src/app/(dashboard)/accounts/page.tsx` | Cuentas | Carousel 3D + Detalles | AccountStageSelector, AccountDetailsHeader, ClientTransactionTable |
| `src/app/(dashboard)/transactions/page.tsx` | Ledger | Historial completo | PageFilterBar, ClientTransactionTable |
| `src/app/(dashboard)/settings/page.tsx` | Config | Preferencias | PreferencesSection |
| `src/app/(dashboard)/layout.tsx` | Server | Auth check + SSR data fetch | DashboardProviders |
| `src/app/auth/callback/route.ts` | API | OAuth callback + token Gmail | createSupabaseAdminClient |

### 6.2 Server Actions (9)

| Archivo | Funciones | Propósito |
|---------|-----------|-----------|
| `src/lib/actions/auth.ts` | `signUp`, `login`, `signInWithGoogle`, `completeOnboarding`, `signOut` | Autenticación |
| `src/lib/actions/accounts.ts` | `createAccount`, `updateAccount`, `archiveAccount`, `getAccounts`, `countAccounts`, `calculateNormalizedTotal` | CRUD cuentas |
| `src/lib/actions/transactions.ts` | `createTransaction`, `updateTransaction`, `getTransactions`, `getTransactionsByAccount`, `getTransactionById`, `deleteTransaction`, `archiveTransaction` | CRUD transacciones con desglose, filtros, flattening por categoría |
| `src/lib/actions/categories.ts` | `getCategories` | Árbol de categorías globales |
| `src/lib/actions/tags.ts` | `createTag`, `getTags` | CRUD etiquetas |
| `src/lib/actions/institutions.ts` | `getInstitutions` | Lista de bancos |
| `src/lib/actions/profile.ts` | `getProfile`, `updateProfile` | Perfil de usuario |
| `src/lib/actions/settings.ts` | `updatePreferences` | Preferencias de usuario |
| `src/lib/actions/storageService.ts` | `uploadAvatar` | Upload a Supabase Storage |

### 6.3 Services (2)

| Archivo | Líneas | Estado | Propósito |
|---------|--------|--------|-----------|
| `src/services/rates.ts` | 70 | ✅ **Funcional** | Smart Rate con spreads bancarios desde open.er-api.com |
| `src/services/mail/parser.ts` | 0 | ❌ **VACÍO** | Fase 3 - Parser de correos bancarios |

#### Detalle de `rates.ts`

```
getSmartRate(amountDOP, institutionId)
  ├── fetch('https://open.er-api.com/v6/latest/USD') con next.revalidate: 3600
  ├── Fallback rate: 60.50 DOP/USD si API falla
  ├── Promise.all(fetch + getSpreadByInstitution(institutionId))
  │     └── getSpreadByInstitution: SELECT buy_margin, sell_margin FROM spreads
  ├── buyPrice = rate * (1 - buy_margin)
  ├── sellPrice = rate * (1 + sell_margin)
  └── Return { baseRate, buyPrice, sellPrice, institutionSpread }
```

### 6.4 Hooks (2 archivos, 14 hooks)

#### `src/hooks/useCatalogs.ts` (427 líneas) — Hook principal

| Hook | QueryKey | staleTime | gcTime | Descripción |
|------|----------|-----------|--------|-------------|
| `useCategories` | `['categories']` | Infinity | Infinity | Árbol completo de categorías (nunca se revalida) |
| `useTags` | `['tags']` | Infinity | 30 min | Lista de tags |
| `useInstitutions` | `['institutions']` | Infinity | 30 min | Lista de bancos |
| `useAccounts` | `['accounts']` | 30 min | 30 min | Cuentas del usuario |
| `useTransactionsList` | `['transactions', type, categoryId, tagId, from, to, search, page]` | 5 min | 30 min | Transacciones paginadas con filtros |
| `useTransactionById` | `['transaction', id]` | 30 min | 30 min | Transacción individual |
| `useTransactionsByAccount` | `['transactions', accountId]` | 5 min | 30 min | Tx por cuenta |
| `useProfile` | `['profile']` | Infinity | 30 min | Perfil del usuario |
| `useProfileNameImage` | `['profile', 'name-image']` | Infinity | 30 min | Nombre + avatar (reducido) |
| `useCurrency` | N/A (hook de cálculo) | N/A | N/A | Conversión DOP↔USD con preferredRate |
| `useSaveTransaction` | mutationFn | N/A | N/A | Crear/actualizar transacción |
| `useDeleteTransaction` | mutationFn | N/A | N/A | Archivar transacción |
| `useSaveTag` | mutationFn | N/A | N/A | Crear tag |
| `useGlobalSearch` | `['global-search', query]` | 0 | 30 min | Búsqueda global (pageSize: 5) |

#### `src/hooks/useTransactionsMutation.ts` (60 líneas) — **DUPLICADO**

| Hook | Diferencia con useCatalogs.ts |
|------|-------------------------------|
| `useSaveTransaction` | NO tiene check de `navigator.onLine`, NO tiene `sanitizeDate`, implementación simplificada |

### 6.5 Stores Zustand (4)

| Store | Archivo | Persistencia | Slice |
|-------|---------|--------------|-------|
| `useYBankStore` | `src/store/useYBankStore.ts` | ✅ localStorage | `preferredCurrency`, `preferredAccountId`, `preferredRate`, `smartRate` |
| `useFilterStore` | `src/store/useFilterStore.ts` | ❌ No | `type`, `categoryId`, `tagId`, `from`, `to`, `search` |
| `useModalStore` | `src/store/useModalStore.ts` | ❌ No | `isOpen`, `modalType`, `modalPayload` |
| `useSelectionStore` | `src/store/useSelectionStore.ts` | ❌ No | `selectedTx` (Record<string, any>), `selectMode` |

#### Detalle de Stores

**useYBankStore** (persistida):
```typescript
interface YBankState {
  preferredCurrency: 'DOP' | 'USD'
  preferredAccountId: string | null
  preferredRate: number
  smartRate: SmartRateResult | null
  // Acciones
  setPreferredCurrency: (currency: 'DOP' | 'USD') => void
  setPreferredAccountId: (id: string | null) => void
  setSmartRate: (rate: SmartRateResult) => void
}
```

**useFilterStore** (no persistida):
```typescript
interface FilterState {
  type: string           // 'all' | 'income' | 'expense' | 'transfer'
  categoryId: string
  tagId: string
  from: string           // ISO date string
  to: string
  search: string
  // Acciones
  setFilters: (filters: Partial<FilterState>) => void
  setSearchQuery: (query: string) => void
  setFilter: (key: keyof FilterState, value: string) => void
  clearFilters: () => void
}
```

**useModalStore** (no persistida):
```typescript
interface ModalState {
  isOpen: boolean
  modalType: string | null
  modalPayload: any
  openModal: (type: ModalType, payload?: any) => void
  closeModal: () => void
}
```

**useSelectionStore** (no persistida):
```typescript
interface SelectionState {
  selectedTx: Record<string, any>
  selectMode: boolean
  toggleTx: (txId: string, transaction?: any) => void
  selectAll: (transactions: Transaction[]) => void
  clearSelection: () => void
  getSelectedCount: () => number
  getSelectedTxList: () => string[]
  selectModeToggle: () => void
}
```

### 6.6 Componentes UI

#### Layout (5)

| Componente | Archivo | Líneas | Propósito |
|-----------|---------|--------|-----------|
| Navbar | `src/components/layout/Navbar.tsx` | ~60 | Barra superior con logo + search + avatar |
| Sidebar | `src/components/layout/Sidebar.tsx` | ~80 | Navegación lateral con iconos |
| SidebarLink | `src/components/layout/Navbar/SidebarLink.tsx` | ~30 | Link individual del sidebar |
| GlobalSearch | `src/components/layout/Navbar/GlobalSearch.tsx` | ~80 | Búsqueda global con SearchableDropdown |
| PWAFooter | `src/components/layout/PWAFooter.tsx` | ~70 | Footer mobile con botón instalar PWA |

#### Dashboard (8)

| Componente | Archivo | Líneas | Propósito |
|-----------|---------|--------|-----------|
| HeroBalance | `src/components/dashboard/NetWorth/HeroBalance.tsx` | ~120 | Hero con patrimonio neto, toggle DOP/USD, weekly chart, smart rate sync |
| NetWorthCard | `src/components/dashboard/NetWorth/NetWorthCard.tsx` | ~30 | Card individual de net worth |
| NetWorthDesktop | `src/components/dashboard/NetWorth/NetWorthDesktop.tsx` | ~40 | Layout desktop del net worth |
| NetWorthMobile | `src/components/dashboard/NetWorth/NetWorthMobile.tsx` | ~30 | Layout mobile del net worth |
| AnimatedNumber | `src/components/dashboard/NetWorth/AnimatedNumber.tsx` | ~20 | Número con animación de conteo |
| WeeklyActivityChart | `src/components/dashboard/NetWorth/WeeklyActivityChart.tsx` | ~90 | Gráfico de actividad semanal |
| CreditHealthBento | `src/components/dashboard/CreditHealthBento.tsx` | ~150 | Panel salud crediticia multi-moneda |
| OnboardingForm | `src/components/dashboard/OnboardingForm.tsx` | ~60 | Wizard multi-step de onboarding |

#### Accounts (8)

| Componente | Archivo | Líneas | Propósito |
|-----------|---------|--------|-----------|
| AccountCarousel | `src/components/Accounts/AccountCarousel.tsx` | ~120 | Carrusel 3D de cuentas |
| AccountStageSelector | `src/components/Accounts/AccountStageSelector.tsx` | ~200 | Selector con stage de cuentas |
| AccountDetailsHeader | `src/components/Accounts/AccountDetailsHeader.tsx` | ~80 | Header con info de cuenta |
| AccountDetailsPanel | `src/components/Accounts/AccountDetailsPanel.tsx` | ~60 | Panel de detalles de cuenta |
| AccountFormWrapper | `src/components/Accounts/AccountFormWrapper.tsx` | ~80 | Formulario crear/editar cuenta |
| DesktopAccounts | `src/components/Accounts/DesktopAccounts.tsx` | ~80 | Vista desktop de cuentas |
| MobileWalletCard | `src/components/Accounts/MobileWalletCard.tsx` | ~40 | Card mobile de wallet |
| TransactionsList | `src/components/Accounts/TransactionsList.tsx` | ~40 | Lista de transacciones por cuenta |

#### Transactions (12)

| Componente | Archivo | Líneas | Propósito |
|-----------|---------|--------|-----------|
| TransactionFilterBar | `src/components/Transactions/TransactionFilterBar.tsx` | ~160 | Barra de filtros con tabs (Global/Income/Expense/Transfers) + categoría + calendario |
| ClientTransactionTable | `src/components/Transactions/ClientTransactionTable.tsx` | ~130 | Contenedor cliente que aplica filtros post-fetch y maneja selección batch |
| TransactionTable | `src/components/Transactions/TransactionTable.tsx` | ~60 | Tabla de transacciones server |
| TransactionRow | `src/components/Transactions/TransactionRow.tsx` | ~70 | Fila individual con icono de categoría |
| TransactionForm | `src/components/Transactions/TransactionForm.tsx` | ~280 | Formulario completo: tipo, monto, categoría, cuenta, fecha, tags, split |
| TransactionFilter | `src/components/Transactions/TransactionFilter.tsx` | ~40 | Filtro individual |
| PageFilterBar | `src/components/Transactions/PageFilterBar.tsx` | ~40 | Barra de filtros para página de transacciones |
| TransactionDetailView | `src/components/Transactions/TransactionDetailView.tsx` | ~80 | Vista detalle de transacción |
| TransactionModalWrapper | `src/components/Transactions/TransactionModalWrapper.tsx` | ~30 | Wrapper del modal de transacción |
| ExpenseSplitSection | `src/components/Transactions/ExpenseSplitSection.tsx` | ~100 | Sección de split de gastos con validación |
| SubTransactionEditForm | `src/components/Transactions/SubTransactionEditForm.tsx` | ~80 | Edición individual de split |
| TagInput | `src/components/Transactions/TagInput.tsx` | ~100 | Input de tags con autocomplete y posicionamiento inteligente |

#### Tarjetas Bancarias (8)

| Componente | Archivo | Líneas | Propósito |
|-----------|---------|--------|-----------|
| UniversalCard | `src/components/Tarjetas/UniversalCard.tsx` | ~529 | Componente genérico: editable/read-only, 7 patrones, selector banco, color picker |
| AccountCard | `src/components/Tarjetas/AccountCard.tsx` | ~40 | Card wrapper |
| ApapCard | `src/components/Tarjetas/ApapCard.tsx` | ~60 | Diseño APAP |
| BancoBHDCard | `src/components/Tarjetas/BancoBHDCard.tsx` | ~60 | Diseño BHD |
| BanreservasWordElite | `src/components/Tarjetas/BanreservasWordElite.tsx` | ~60 | Diseño Banreservas |
| LafiseCard | `src/components/Tarjetas/LafiseCard.tsx` | ~60 | Diseño Lafise |
| PopularCard | `src/components/Tarjetas/PopularCard.tsx` | ~60 | Diseño Popular |
| ScotiaCard | `src/components/Tarjetas/ScotiaCard.tsx` | ~60 | Diseño Scotiabank |

#### Filtros y UI (3 + varios)

| Componente | Archivo | Líneas | Propósito |
|-----------|---------|--------|-----------|
| FilterTab | `src/components/ui/FilterTab.tsx` | ~30 | Tab animado para filtros |
| YBankCalendarPicker | `src/components/ui/YBankCalendarPicker.tsx` | ~100 | Date picker con presets, portal-based, responsive |
| Switch | `src/components/ui/Switch.tsx` | ~30 | Toggle switch |
| UniversalModal | `src/components/ui/UniversalModal.tsx` | ~80 | Modal portal-based con drag-to-close |
| SearchableDropdown | `src/components/ui/SearchableDropdown.tsx` | ~80 | Dropdown con búsqueda |
| AuthCard | `src/components/ui/AuthCard.tsx` | ~40 | Card para páginas de auth |
| ButtonOla | `src/components/ui/ButtonOla.tsx` | ~20 | Botón con efecto wave |
| Logo | `src/components/ui/Logo.tsx` | ~20 | Logo SVG animado |
| PassKeyButton | `src/components/ui/PassKeyButton.tsx` | ~40 | Botón WebAuthn |
| TextReveal | `src/components/ui/TextReveal.tsx` | ~20 | Texto con animación reveal |
| TituloHover | `src/components/ui/TituloHover.tsx` | ~20 | Título con efecto hover |
| WaveLayer | `src/components/ui/WaveLayer.tsx` | ~40 | Capa decorativa wave SVG |

#### Settings (4)

| Componente | Archivo | Líneas | Propósito |
|-----------|---------|--------|-----------|
| SettingsHeader | `src/components/Settings/SettingsHeader.tsx` | ~20 | Header de settings |
| PreferencesSection | `src/components/Settings/PreferencesSection.tsx` | ~40 | Preferencias de moneda y cuenta |
| SecuritySection | `src/components/Settings/SecuritySection.tsx` | ~30 | **COMENTADO - no visible** |
| NotificationsSection | `src/components/Settings/NotificationsSection.tsx` | ~30 | **COMENTADO - no visible** |

### 6.7 Providers (4)

| Provider | Archivo | Propósito |
|----------|---------|-----------|
| QueryProvider | `src/components/providers/QueryProvider.tsx` | Cliente TanStack Query + IndexedDB persister + DevTools |
| DashboardProviders | `src/components/providers/DashboardProviders.tsx` | Orquestador: AuthWatcher + DataHydrator + StoreInitializer + ModalProvider |
| ModalProvider | `src/components/providers/ModalProvider.tsx` | Escucha useModalStore y renderiza modals |
| StoreInitializer | `src/components/providers/StoreInitializer.tsx` | Hidrata Zustand desde SSR |
| ThemeProvider | `src/components/providers/ThemeProvider.tsx` | Tema claro/oscuro |

### 6.8 Configuración

| Archivo | Propósito |
|---------|-----------|
| `package.json` | Dependencias del proyecto |
| `next.config.ts` | Config Next.js: PWA (Workbox), remotePatterns Supabase Storage |
| `tsconfig.json` | TypeScript: path aliases `@/*`, jsx preserve |
| `src/app/globals.css` | Sistema de diseño: variables CSS, temas, animaciones, glassmorphism |
| `src/middleware.ts` | Middleware Next.js (protección de rutas) |
| `src/proxy.ts` | **HUÉRFANO**: Middleware offline-first basado en cookies - no integrado |
| `src/lib/supabase/client.ts` | Cliente Supabase browser |
| `src/lib/supabase/server.ts` | Cliente Supabase server |
| `src/lib/supabase/admin.ts` | Cliente Supabase admin (service_role) |
| `src/constants/constants.ts` | Constantes: accountTypes, categoryLabels, currencyConfig |
| `src/constants/theme.ts` | Tema: CARD_COLORS (no usado), gradient backgrounds |

---

## 7. Análisis Crítico por Capa

### 7.1 Server Actions

#### ✅ Fortalezas

1. **Separación clara de responsabilidades**: 1 archivo por entidad (accounts, transactions, auth, etc.)
2. **Manejo de errores consistente**: Patrón `{ success, error }` en todas las acciones
3. **Serialización correcta**: `JSON.parse(JSON.stringify())` evita hydration mismatches
4. **Directiva 'use server'**: Todas las funciones correctamente marcadas
5. **Query dinámica**: `getTransactions` construye SQL condicionalmente según filtros
6. **Flattening por categoría**: Lógica en servidor para aplanar transacciones según su jerarquía de categorías (DGII)

#### ⚠️ Debilidades

1. **Duplicación de flattening**: `transactions.ts:122-156` aplana por categoría en servidor, y `ClientTransactionTable.tsx:34-72` vuelve a aplanar en cliente → riesgo de inconsistencia
2. **Sin validación de entrada**: `createAccount`, `createTransaction` no validan datos (falta Zod/schema)
3. **`calculateNormalizedTotal` sin paralelismo**: Itera secuencialmente en lugar de usar `Promise.all` → lento con muchas cuentas
4. **Uso extensivo de `any`**: `transactions.ts` inputs sin tipo
5. **`updatePreferences` mezcla responsabilidades**: Cambia password + actualiza currency en una sola acción
6. **`archiveAccount` pobre**: Solo devuelve `{ id }` en lugar de actualizar caché

### 7.2 Services

#### ✅ `rates.ts` — Bien diseñado

| Aspecto | Estado |
|---------|--------|
| Cache externo | ✅ `next.revalidate: 3600` (1 hora) |
| Fallback rate | ✅ `60.50 DOP/USD` si API falla |
| Spreads bancarios | ✅ Select desde BD con buy/sell margins |
| Paralelismo | ✅ `Promise.all` para fetch + DB query |
| Tipado | ✅ `SmartRateResult` con tipos correctos |
| Server-side | ✅ Ejecutado en servidor (seguridad API key) |

#### ❌ `mail/parser.ts` — Completamente vacío

```
0 líneas → Sin implementación de Fase 3
No hay estructura de directorios para /mail/adapters/
No hay GmailAdapter, no hay Worker, no hay Parser
```

### 7.3 Hooks

#### ✅ Fortalezas

1. **TanStack Query bien configurado**:
   - `networkMode: 'offlineFirst'` para operación offline
   - `staleTime` + `gcTime` por tipo de dato (Infinity para catálogos, 5 min para transacciones)
2. **Optimistic updates**: `useSaveTransaction` y `useDeleteTransaction` actualizan caché antes de respuesta del servidor
3. **QueryKey granular**: `useTransactionsList` incluye todos los filtros → caché segmentada
4. **`useCurrency`**: Lógica de conversión multi-moneda con preferredRate desde store

#### ⚠️ Debilidades

1. **🔴 HOOK DUPLICADO CRÍTICO**: `useSaveTransaction` existe en dos archivos:
   - `useCatalogs.ts` (completo: offline check + sanitizeDate)
   - `useTransactionsMutation.ts` (simplificado: sin offline check)
   - **Riesgo**: Si un componente importa del archivo incorrecto, la protección offline se pierde
2. **QueryKey incluye filtros vacíos**: `useTransactionsList` usa `''` en lugar de `undefined` → diferentes queryKeys por cada cambio de filtro (más requests de red)
3. **Offline mode limitado**: Solo usa caché de página 1 → pierde datos de otras páginas
4. **`useGlobalSearch` costoso**: Llama a `getTransactions` con `pageSize: 5` pero la query BD hace joins múltiples
5. **`useSaveTag` optimistic duplicado**: Puede generar tags duplicados si se llama dos veces

### 7.4 Stores Zustand

#### ✅ Fortalezas

1. **Persistencia selectiva**: `useYBankStore` con `persist` + `partialize` guarda solo lo necesario
2. **Batch updates**: `useFilterStore.setFilters()` actualiza múltiples filtros en un solo set
3. **Selección eficiente**: `useSelectionStore.toggleTx()` con `Record<string, any>` para O(1) lookup
4. **StoreInitializer**: Inyecta datos SSR sin hydration mismatch

#### ⚠️ Debilidades

1. **`preferredAccountId` frágil**: Depende de localStorage — si se borra, se pierde la preferencia
2. **Type safety roto**: `useModalStore.closeModal()` castea `type as any`
3. **`selectedTx` sin tipo**: `Record<string, any>` en lugar de `Record<string, Transaction>`
4. **Sin devtools**: No hay middleware de debugging para desarrollo

### 7.5 Componentes UI

#### ✅ Fortalezas

1. **`UniversalCard.tsx` (529 líneas)**: Componente extremadamente completo:
   - Modo editable y read-only
   - 7 patrones visuales (cada banco con su marca)
   - Selector de banco con búsqueda
   - Color picker para personalización
   - Cálculo automático de contraste para texto
   - Balance editing inline
   
2. **`TransactionForm.tsx`**: Maneja 3 tipos de transacción:
   - Expense: con split de gastos + precios unitarios
   - Income: monto + categoría
   - Transfer: cuentas origen/destino + multi-moneda
   - Date picker, tag input con autocomplete
   
3. **`YBankCalendarPicker.tsx`**: Portal-based con positioning dinámico:
   - Presets (Today, This Week, This Month, This Year)
   - Responsive: bottom sheet en mobile
   - Keyboard navigation

4. **`ExpenseSplitSection.tsx`**: Validación de split vs total + sugerencia automática de precio

5. **`TagInput.tsx`**: Posicionamiento inteligente (abre hacia arriba si falta espacio), portal-based

6. **`UniversalModal.tsx`**: Drag-to-close (solo desde handle), portal, animación spring

7. **`AccountStageSelector.tsx`**: Carrusel 3D con Framer Motion, drag gestures, favoritos

8. **`HeroBalance.tsx`**: Balance multi-moneda, toggle neto/líquido, weekly chart, smart rate sync

#### ⚠️ Debilidades

1. **🔴 Uso excesivo de `any`**:
   - `TransactionForm.tsx:25-30`: Props iniciales sin tipo
   - `ClientTransactionTable.tsx:40-72`: Transaction items sin tipo
   - `TransactionRow.tsx:9`: Prop `tx` como `any`
   - `ExpenseSplitSection.tsx:8-10`: `items/setItems` sin tipo
   
2. **Potencial loop infinito**: `CreditHealthBento.tsx` — `isWaitingForRate` puede causar re-renders infinitos si `preferredRate` nunca llega

3. **Debug residual**: `HeroBalance.tsx:23-24` — `console.log` en producción

4. **QueryKey hardcodeada**: `DashboardProviders.tsx:87` — `['transactions', '', '', '', '', '', 1]` es frágil

5. **ID vacío**: `AccountFormWrapper.tsx` — `emptyInstitution` con `id: ''` puede insertar `institution_id: ''` en BD

6. **Undefined crash**: `TransactionForm.tsx:63-66` — `initialData.items.filter()` falla si `initialData` es `undefined`

7. **PWA crash potencial**: `PWAFooter.tsx` — `installPrompt.prompt()` lanza error si `beforeinstallprompt` no se disparó

### 7.6 Páginas

#### ✅ Fortalezas

1. **Server Component layout con SSR data fetching**: Dashboard layout obtiene datos en server y los hidrata
2. **Auth callback con tokens Gmail**: Almacena refresh_token en profiles para integración futura
3. **Cleanup de filtros**: `transactions/page.tsx` — `clearFilters()` al desmontar componente

#### ⚠️ Debilidades

1. **🔴 Sign-up → onboarding redirect roto**: `sign-up/page.tsx:54` — redirige a `/onboarding` inmediatamente tras `signUpWithEmail`, pero Supabase requiere confirmación de email. El onboarding falla por falta de sesión.
2. **Dead code**: `settings/page.tsx` — SecuritySection y NotificationsSection están **comentados**
3. **Un solo tab visible**: `settings/page.tsx:27` — Solo "Preferencias" visible
4. **ID vacío en URL**: `accounts/page.tsx` — `initialAccountId` puede ser `""` string vacío

### 7.7 Configuración y Estilos

#### ✅ Fortalezas

1. **Sistema de variables CSS**: `:root` + `.dark` + `@theme inline` bien definido
2. **Responsive**: Mobile-first con breakpoints consistentes
3. **PWA completo**: Workbox runtime caching, service worker, manifest
4. **Font system**: Inter (texto) + JetBrains Mono (monoespaciado)

#### ⚠️ Debilidades

1. **Font no importado**: `globals.css:12` — `--font-ibm-plex-serif` declarado pero **nunca importado** en layout.tsx (solo Inter y JetBrains Mono están importados)
2. **Dark variant redundante**: `globals.css:4` — Dark variant personalizado, Tailwind v4 ya soporta `@variant dark` nativamente
3. **Constantes duplicadas**: `ACCOUNT_TYPE_CONFIG` en `constants/constants.ts` y `UniversalCard.tsx:17-22` difieren en campos (`showCreditLimits` vs `isPassive`)
4. **`CARD_COLORS` no usado**: `constants/theme.ts` define gradients que no se usan en ningún componente
5. **Proxy huérfano**: `proxy.ts` no integrado como middleware en `next.config.ts`

---

## 8. Matriz de Riesgos

| ID | Riesgo | Severidad | Impacto | Probabilidad | Solución |
|----|--------|-----------|---------|-------------|----------|
| **R1** | Proxy.ts no integrado → rutas desprotegidas | 🔴 **Crítico** | Usuarios sin sesión acceden al dashboard | Alta | Integrar en next.config.ts como middleware |
| **R2** | Hook duplicado → offline check omitido | 🔴 **Crítico** | Operaciones offline sin protección de red | Alta | Eliminar `useTransactionsMutation.ts`, migrar imports |
| **R3** | Sign-up redirige a onboarding sin sesión | 🔴 **Crítico** | Usuario queda atrapado sin poder continuar | Alta | Esperar confirmación email o saltar onboarding |
| **R4** | Server actions sin input validation | 🟡 **Alto** | Inyección de datos inválidos en BD | Media | Agregar validación con Zod |
| **R5** | QueryKey frágil en DataHydrator | 🟡 **Alto** | Cache miss en SSR, datos no sincronizados | Baja | Usar queryKey factory consistente |
| **R6** | emptyInstitution con id:'' | 🟡 **Alto** | Relaciones rotas en BD | Media | Validar institution_id antes de insertar |
| **R7** | Token Gmail expirado (3600s) sin refresh | 🟡 **Alto** | Gmail integration fails silently | Alta | Implementar refresh token flow |
| **R8** | Flattening duplicado server+client | 🟡 **Medio** | Lógica inconsistente, bugs sutiles | Media | Elegir server-side y desactivar client-side |
| **R9** | console.log en producción | 🟢 **Bajo** | Fuga de datos en consola | Alta | Reemplazar con logger condicional |
| **R10** | Constantes duplicadas | 🟢 **Bajo** | Comportamiento inconsistente entre componentes | Media | Unificar en constants.ts |
| **R11** | Loop infinito CreditHealthBento | 🟡 **Alto** | UI congelada, CPU alta | Baja | Agregar guard clause para preferredRate null |
| **R12** | PWA installPrompt crash | 🟡 **Medio** | Error en consola en Safari/Firefox | Alta | Envolver en try-catch |

---

## 9. Árbol de Decisiones Técnicas

### Decisiones Acertadas ✅

| Decisión | Razón |
|----------|-------|
| **Server Actions + TanStack Query** | Evita API Routes redundantes, caché en cliente, SSR hydration |
| **IndexedDB persister** | Offline-first real, datos persisten entre sesiones |
| **Zustand + persist** | Estado UI rápido sin re-renders masivos del árbol Query |
| **Portal-based modals/calendar** | Control de z-index, overflow management, positioning preciso |
| **JSON.parse(JSON.stringify())** | Evita hydration mismatches y circular references |
| **'use server' en servicios** | Smart Rate ejecutado en servidor (seguridad API key) |
| **QueryKey granular con filtros** | Caché segmentada → menos re-fetches |
| **Optimistic updates** | UI responde instantáneamente, luego sincroniza |
| **Framer Motion** | Animaciones declarativas, performantes, spring physics |
| **Monorepo stores** | 4 stores pequeñas > 1 store gigante (menos re-renders) |

### Decisiones Cuestionables ⚠️

| Decisión | Problema |
|----------|----------|
| **Flattening de transacciones ×2 (server + client)** | Duplicación, posible inconsistencia, mantenimiento doble |
| **Hook duplicado (useSaveTransaction ×2)** | Bug waiting to happen - un componente podría importar el incorrecto |
| **console.log en producción** | Debug residual que fuga datos |
| **Constants duplicados** | Mantenimiento difícil, comportamiento inconsistente |
| **Font no importado declarado en CSS** | Sin efecto, peso muerto |
| **Security/Notifications tabs comentados** | Dead code que confunde |
| **CARD_COLORS sin usar** | Código muerto en constants/theme.ts |
| **'any' generalizado** | TypeScript pierde su propósito |

---

## 10. Plan de Acción Recomendado

### Fase 1: Correcciones Críticas (Ahora)

```
1.  Unificar hooks: eliminar useTransactionsMutation.ts
    → Verificar imports en TransactionForm.tsx y TransactionModalWrapper.tsx
    → Asegurar que todos apunten a useCatalogs.ts

2.  Integrar proxy.ts como middleware de Next.js
    → next.config.ts → { middleware: 'src/proxy.ts' }
    → O fusionar con src/middleware.ts

3.  Fix sign-up → onboarding redirect:
    → En sign-up/page.tsx:
      - Verificar si email confirmation está habilitado
      - Si sí: mostrar "confirma tu email" en lugar de redirect
      - Si no: redirect a /onboarding

4.  Eliminar flattening duplicado:
    → Elegir server-side (más robusto, evita data transfer extra)
    → Eliminar flattening en ClientTransactionTable.tsx:34-72
    → Asegurar que la respuesta del server ya viene aplanada

5.  Input validation en server actions:
    → Agregar validación básica (Zod opcional pero recomendado)
    → Al menos: required fields, tipos correctos, strings no vacíos
```

### Fase 2: Mejoras de Calidad (Sprint 1)

```
6.  TypeScript strict: reemplazar `any` en:
    → TransactionForm.tsx (props, items)
    → TransactionRow.tsx (tx prop)
    → ClientTransactionTable.tsx (transaction items)
    → ExpenseSplitSection.tsx (items/setItems)

7.  Agregar Error Boundaries en dashboard layout
    → ErrorBoundary client component
    → Envolver HeroBalance, AccountCarousel, ClientTransactionTable

8.  Reemplazar console.log con logger condicional
    → createLogger("debug") que solo imprime en desarrollo
    → process.env.NODE_ENV === 'development'

9.  Unificar ACCOUNT_TYPE_CONFIG
    → Elegir una fuente (constants.ts o UniversalCard.tsx)
    → Eliminar la otra, actualizar imports

10. Crear React Query Key Factory
    → Evitar queryKeys hardcodeadas (['transactions', '', '', '', '', '', 1])
    → Factory function: transactionKeys.all(), transactionKeys.list(filters)
```

### Fase 3: Features Pendientes (Sprint 2)

```
11. Implementar GmailAdapter (Fase 3)
    → Estructura:
      src/services/mail/
      ├── adapters/
      │   └── gmail.ts      (GmailAdapter con Gmail API)
      ├── parser.ts          (Parser de correos bancarios)
      └── types.ts           (MailMessage, ParsedTransaction, etc.)
    
    → Funcionalidad:
      - Autenticación Gmail OAuth (tokens ya guardados en profiles)
      - Fetch de correos bancarios (categorizados por remitente)
      - Parseo de extraídos bancarios (subject, body patterns)
      - Creación automática de transacciones pendientes

12. Implementar AI Pipeline (Fase 4)
    → Estructura:
      src/services/ai/
      ├── client.ts          (AI client - OpenAI/Anthropic)
      ├── prompts.ts         (Prompts para clasificación)
      ├── parser.ts          (Parser de respuesta AI)
      └── types.ts           (AIClassificationResult, etc.)
    
    → Funcionalidad:
      - Clasificación automática de transacciones por categoría
      - Sugerencia de tags basada en descripción y monto
      - Detección de patrones de gasto recurrentes
      - Categorización batch de transacciones sin categoría

13. Escribir tests E2E
    → Cypress:
      - Flujo: landing → sign-in → dashboard → crear transacción → filtrar
      - Flujo: sign-up → onboarding → primera cuenta
      - Flujo offline: crear transacción sin red → sync cuando vuelve
    → Vitest (unit tests):
      - Server actions (mocked Supabase)
      - Servicios (rates.ts con fetch mocked)
      - Hooks (renderHook de TanStack)
```

### Fase 4: Optimización (Sprint 3)

```
14. Agregar skeleton loaders
    → HeroBalanceSkeleton, TransactionTableSkeleton
    → AccountCarouselSkeleton

15. Implementar virtual scrolling para TransactionTable
    → react-window o @tanstack/react-virtual
    → Tabla con 1000+ transacciones sin lag

16. Cachear getSmartRate en servidor
    → React.cache() o memoización
    → Evitar múltiples llamadas a open.er-api.com en同一 render

17. Suspense boundaries
    → Lazy loading de modales (TransactionModalWrapper)
    → Lazy loading de gráficos (WeeklyActivityChart)

18. Consolidar formatCurrency
    → Elegir implementación única (utils vs useCurrency hook)
    → Misma lógica de formato en toda la app
```

---

## 11. Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Total archivos fuente** | ~158 |
| **Líneas de código (estimado)** | ~15,000+ |
| **Componentes React** | 63 |
| **Server Actions** | 9 |
| **Hooks** | 14 (2 duplicados) |
| **Páginas/Rutas** | 8 |
| **Stores Zustand** | 4 |
| **Stores con persistencia** | 1 |
| **Services implementados** | 1 de 3 |
| **Testing coverage** | 0% |
| **PWA score** | Alta |
| **Offline support** | ✅ Completo |
| **TypeScript strict** | Parcial (uso extensivo de `any`) |
| **Errores de lint** | 0 (no configurado) |
| **Dependencias totales** | ~30 directas |
| **Bancos soportados** | 7 (Popular, BHD, Banreservas, Lafise, APAP, Scotia, General) |
| **Categorías de transacciones** | Árbol jerárquico global |
| **Monedas soportadas** | DOP, USD |

---

## 12. Conclusión

**YBank v2 es un proyecto ambicioso con una base técnica sólida.** La arquitectura offline-first es correcta, el sistema de filtros es robusto, y la UI es profesional (animaciones, responsive, modales portal-based, carruseles 3D).

### Lo mejor del proyecto

- **Arquitectura**: SSR + TanStack + IndexedDB es una combinación moderna y efectiva
- **UI/UX**: Framer Motion, glassmorphism, animaciones wave, diseño responsivo
- **Offline-first**: Persistencia a IndexedDB, optimistic updates, networkMode offlineFirst
- **Componentes reutilizables**: UniversalCard, UniversalModal, SearchableDropdown, FilterTab
- **Smart Rate**: Motor de tasas con spreads bancarios, cache de 1h, fallback

### Lo peor del proyecto

1. **🔴 4 issues críticos**: hooks duplicados, middleware no integrado, onboarding roto, flattening duplicado
2. **❌ Fases 3 y 4 sin implementar**: Gmail + AI son las funcionalidades core que diferencian YBank de un simple ledger
3. **⚠️ TypeScript laxo**: `any` en componentes clave invalida los beneficios de TS
4. **⚠️ Sin tests**: Cero cobertura, cualquier refactor es riesgoso
5. **⚠️ Código muerto**: Security/Notifications tabs, CARD_COLORS, font no importado

### Recomendación inmediata

Abordar los **4 issues críticos de la Fase 1** antes de continuar con nuevas funcionalidades. Luego, priorizar la **Fase 3 (Gmail)** ya que es el diferenciador principal del producto y ya tienen los tokens OAuth almacenados en la BD (solo falta el adapter).
