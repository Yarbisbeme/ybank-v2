# 07 — Auditoría funcional verificada (Fase 0.5)

> Fecha: 2026-11-25 · Estado: **en curso (parte 1 de N)**
> Método: la app en **build de producción** (`next build` + `next start`) contra **Supabase local** (`supabase start`, esquema de las migraciones + `seed.sql` con bancos y categorías). Un usuario de prueba nuevo. Los recorridos son tests de Playwright en `e2e/audit/`, y los saldos se comprueban **en la base de datos**, no solo en pantalla.
> Leyenda: ✅ funciona (verificado) · ⚠️ funciona a medias · ❌ roto · ❓ no verificado todavía

## Resultados

| # | Flujo | Estado | Evidencia |
|---|---|---|---|
| A1 | Landing carga sin errores de JS | ✅ | `01-landing` |
| A2 | Registro con email | ✅ | Usuario creado; redirige a `/onboarding` |
| A3 | **Onboarding de usuario registrado con email** | ❌ → ✅ **corregido** | El formulario enviaba `password: ''`; el esquema Zod (commit `fbc3085`, 27-jun) lo rechazaba y el botón quedaba en "Sincronizando..." para siempre. **Nadie que se registrara con email podía terminar el onboarding.** Corregido + test de regresión (`src/lib/validation.test.ts`). |
| A4 | Onboarding: reintento tras un error | ⚠️ | Cada intento crea **otra cuenta** (crear la cuenta y completar el perfil no es atómico). Se resuelve con una RPC atómica en la Fase 2. |
| A5 | Dashboard tras onboarding | ✅ | Capital, tarjetas, actividad semanal y lista coinciden con la BD |
| T1 | Crear gasto | ✅ | 25,000 → 23,500 en la BD; aparece en la lista con su categoría |
| T2 | Crear ingreso | ✅ | 23,500 → 26,500 |
| T3 | Crear traspaso entre cuentas propias | ⚠️ | Destino +1,000 ✅; origen −**1,001.50**: cobra un impuesto que por ley no aplica (doc 03) y a **0.15 %** aunque la fecha es posterior al 3-jul-2026 |
| T4 | Editar monto de un gasto | ✅ | Saldo ajustado exactamente por la diferencia |
| T5 | **Editar monto de un traspaso** | ❌ | B2 confirmado desde la UI: `amount` queda sin impuesto y los ítems automáticos pasan de 2 a **0** |
| T6 | Borrar gasto | ✅ | El saldo se restituye |
| T7 | Filtros por tipo (Ingresos / Gastos / Traspasos / Global) | ✅ | Cada pestaña muestra solo lo que corresponde |
| T8 | Etiqueta de un ingreso sin categoría | ⚠️ | Se muestra como "TRANSFERENCIA" |
| S1 | Cerrar sesión | ✅ | |
| S2 | Rutas protegidas sin sesión | ✅ | `/dashboard`, `/accounts`, `/transactions`, `/settings`, `/onboarding` → `/sign-in` |
| U1 | Cuenta creada como `savings` en el onboarding | ⚠️ | La tarjeta muestra "DEBIT" |
| U2 | Contador de ítems del traspaso | ⚠️ | Errata visible: "2 ÍT_EMS" |
| U3 | Desplegables (`SearchableDropdown`) | ⚠️ Accesibilidad | Las opciones son `div` con `onClick`: sin rol `option` y no se eligen con teclado |
| U4 | Landing | ⚠️ Contenido | Muestra un nombre real ("YARBIS BELTRE") en una tarjeta de ejemplo y textos de marketing de banco ("fondos asegurados", "Tarjetas físicas y virtuales ilimitadas", "API First") que no corresponden a lo que hace la app |
| D1 | Trigger de cuenta de efectivo inicial | ⚠️ | Busca la institución `'Efectivo'`, pero se llama `'Efectivo / Cartera'`. Funciona solo porque el UUID de respaldo coincide (verificado). |

## Pendiente de verificar (❓)

- Página **Nodos** (`/accounts`): crear, editar, archivar y personalizar una cuenta.
- **Preferencias** (`/settings`): perfil, avatar, moneda, tema.
- **Desglose de recibo** (split) y su filtrado por categoría.
- Filtros por categoría, fecha, etiqueta y búsqueda; **paginación** con más de 10 transacciones.
- **Búsqueda global** (⌘K).
- **Moneda USD**: cambio de moneda global, tasas y transferencias entre monedas desde la UI.
- Tarjetas de crédito y **Score Shield**.
- Login con **Google** (requiere configurar OAuth en local).
- **PWA**: instalación y **uso sin conexión**.
- Vista **móvil** (viewport pequeño).

## Cómo reproducir

```bash
npx supabase start                      # Supabase local + seed
# build y servidor apuntando a local (ver playwright.config.ts)
npx playwright test e2e/audit           # orden: 01 → 02 → 03
```
