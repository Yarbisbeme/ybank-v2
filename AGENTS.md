# AGENTS.md — Reglas para agentes de IA en YBank

Este archivo es para cualquier agente que trabaje en el repo (Claude Code, Antigravity, Cursor, Copilot…). Si algo de aquí choca con una instrucción puntual del dueño, manda la del dueño. Si choca con tu costumbre, manda este archivo.

Las decisiones de arquitectura están en [`docs/arquitectura/`](docs/arquitectura/), numeradas del 00 al 08. **Léelas antes de proponer cambios de estructura.**

---

## 1. Qué es YBank

App de finanzas personales **sin fines de lucro** (el dueño y sus amigos), pública como proyecto de portfolio. Registra cuentas y transacciones en DOP/USD; la entrada principal será la ingesta automática de correos bancarios (en diseño, doc 06).

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (Postgres + Auth + RLS + Storage), TanStack Query (persistido en IndexedDB), Zustand, Zod 4, Tailwind 4, Vitest, Playwright.
- **Costo de infraestructura: $0.** No agregues servicios pagos (doc 05).
- **Habrá apps móviles:** la lógica de negocio no puede vivir en un frontend (doc 04).

## 2. Regla número uno: verificar, no afirmar

Gran parte del código existente **funciona a medias**. Nada de lo que ya existe se da por bueno porque tenga un nombre sugerente, salga en un `grep`, lo diga un comentario o un documento viejo.

- Para afirmar que algo funciona: **ejecútalo** (test, build, consulta a la BD, la app corriendo).
- Al reportar, distingue ✅ verificado (y cómo) de ❓ no verificado.
- `Proyecto.md`, `RoadMap.md` y los reportes de `docs/` fuera de `docs/arquitectura/` son **hipótesis**, no hechos.
- El estado verificado de cada flujo está en [`docs/arquitectura/07-AUDITORIA-FUNCIONAL.md`](docs/arquitectura/07-AUDITORIA-FUNCIONAL.md).

## 3. Flujo de trabajo (doc 08)

```
feature/* ──PR──► dev (staging.ybankapp.com, BD staging) ──PR release──► main (ybankapp.com, BD producción)
```

- **Rama nueva desde `dev`**, PR **hacia `dev`**. Nunca directo a `main` (salvo `hotfix/*` con producción rota).
- `main` y `dev` están protegidas: PR obligatorio y el check **`verify`** (CI) en verde. No intentes saltarlo.
- **No hagas merge de PRs:** fusionar es decisión del dueño.
- **No subas commits a una rama cuyo PR ya está abierto** sin avisar; si cambió el alcance, rama nueva.
- **No trabajes en la misma carpeta que otro agente.** Usa tu propio worktree: `git worktree add ../ybank-v2-<tarea> -b <rama> origin/dev`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `test:`), en inglés, explicando el **porqué**.

## 4. Comandos

```bash
npm run dev          # desarrollo (webpack, por next-pwa)
npm run typecheck    # tsc --noEmit
npm test             # Vitest (unitarios)
npm run lint         # ESLint (hoy con errores heredados; no agregues nuevos)
npm run build        # build de producción (valida variables de entorno)
npm run e2e          # Playwright contra Supabase LOCAL (ver §7)
npm run db:types     # regenera src/shared/supabase/database.types.ts desde el proyecto vinculado
```

**Antes de abrir un PR:** `typecheck`, `test` y `build` en verde. Si tocaste UI o flujos, verifica en la app (local o Preview), no solo en el código.

## 5. Arquitectura: reglas que no se negocian

- **El dinero es lo primero.** Toda escritura que afecte saldos debe ser **atómica** y vivir en la base de datos (funciones SQL/RPC y triggers), no en componentes ni en varias llamadas sueltas desde TypeScript. Hoy hay escrituras no atómicas en `src/lib/actions/transactions.ts`: no copies ese patrón (doc 02, Fase 2).
- **Aritmética de dinero en Postgres (`numeric`).** En TypeScript solo se formatea para mostrar; nada de `parseFloat`/`toFixed` para calcular saldos.
- **Sin lógica de negocio en el frontend.** Componentes y hooks: UI, validación de formularios y caché. Reglas de saldos, impuestos, tasas o ingesta: backend (doc 04).
- **Server Actions solo para mutaciones**, no para lecturas que llama `useQuery`.
- **Claves de caché de TanStack** siempre desde una factory (ej. `src/lib/transaction-keys.ts`), nunca a mano.
- **Variables de entorno** solo a través de `src/shared/config/env.ts` (`publicEnv`, `getServerEnv()`). No leas `process.env` directo en código nuevo.
- **Cliente de Supabase en el navegador:** `getSupabaseBrowserClient()` de `src/shared/supabase/browser.ts`.
- **Perfil:** nunca `select('*')` sobre `profiles`; usa `PROFILE_COLUMNS` (`src/lib/profile-columns.ts`). Todo lo que se selecciona llega al navegador y a IndexedDB.
- **Sin sobreingeniería.** No agregues capas, interfaces con una sola implementación, contenedores de DI, repositorios genéricos ni librerías nuevas sin una razón concreta y documentada (doc 00 §2.5).

## 6. Base de datos (Supabase)

| Entorno | Proyecto | Ref |
|---|---|---|
| Producción | `YbankTest` | `cizbokgdcvvapncempdu` |
| Staging | `ybank-staging` | `xmnpqgcrinwuydamrshu` |

- **El esquema vive en `supabase/migrations/`.** Todo cambio de BD es una migración nueva; nunca SQL pegado en el dashboard, nunca editar una migración ya aplicada.
- **Orden:** local → staging (`npx supabase db push --remote=xmnpqgcrinwuydamrshu`) → producción en el release.
- **Nunca escribas en producción sin autorización explícita del dueño.** Consultas de diagnóstico: `npx supabase db query --remote --read-only "…"`, preferiblemente agregadas (conteos, no montos ni datos de personas).
- Pruebas de triggers/políticas: `supabase/tests/*.sql`, contra la BD **local**.
- `supabase/seed.sql`: solo datos de referencia (bancos, categorías del sistema). Nunca datos de usuarios.

## 7. Tests

- **Unitarios (Vitest):** junto al código (`*.test.ts`). Todo bug corregido lleva su test de regresión.
- **E2E (Playwright):** `e2e/`, siempre contra **Supabase local** (`npx supabase start`), nunca contra producción. `npm run e2e` compila la app apuntando a Supabase local y la levanta en :3100 (`E2E_SKIP_BUILD=1` reusa el último build; `E2E_EVIDENCE=1` guarda capturas). Corre también en CI (job `e2e`).
  - **No hace falta `supabase db reset` entre corridas:** cada corrida crea su propio usuario `audit+…@ybank.test` y `e2e/global-setup.ts` borra los de corridas anteriores (los de más de 30 minutos).
  - **Varios agentes a la vez:** comparten el Supabase local. Si el puerto 3100 está ocupado por la corrida de otro agente, usa otro (`E2E_PORT=3200`); nunca mates su servidor. No hagas `db reset` mientras otro agente corre pruebas.
  - **Esperas:** nunca `waitForTimeout`. Espera al estado real (`expectBalance`, `expect.poll`, `toBeVisible`).
  - **Bugs conocidos:** como test aparte con `test.fail('KNOWN BUG …')`. Al arreglar el bug ese test se pone rojo: borra el `.fail`.
- Cuando verifiques saldos, compruébalos **en la BD**, no solo en pantalla (ver `e2e/audit/helpers.ts`).

## 8. Seguridad y privacidad (el repo es PÚBLICO)

- **Nunca** subas secretos: claves, tokens, `.env*`, exportaciones de n8n, `docs/Gastibiris.json` (ignorado).
- **Nunca** subas datos financieros reales: números de cuenta o tarjeta, montos o descripciones de transacciones reales, **correos bancarios** (ni "anonimizados a medias"). Los fixtures del parser se anonimizan con valores ficticios del mismo formato.
- Variables `NEXT_PUBLIC_*` = públicas por diseño. Todo lo secreto, sin ese prefijo y marcado como *Secret* en Vercel.
- La seguridad real son las políticas **RLS**; cualquier tabla nueva necesita RLS y políticas por dueño.
- GitHub tiene *push protection*: si bloquea un push por un secreto, **no lo saltes**; saca el secreto del historial antes de subir.

### Licencia (AGPL-3.0-or-later)
- El código es software libre bajo [`LICENSE`](LICENSE). No agregues código copiado de fuentes con licencias incompatibles (código propietario o sin licencia). Dependencias MIT, ISC, BSD y Apache-2.0 son compatibles.
- **Sección 13:** la app debe ofrecer a sus usuarios un enlace visible al código fuente (por ejemplo "Código fuente" en el pie o en Preferencias → Acerca de). No lo quites en un rediseño.

## 9. Convenciones de código

- **Código, nombres y commits en inglés. Textos de UI en español** (República Dominicana).
- Comentarios: explican **por qué**, no narran lo que hace la línea. Sin emojis ni "💡 FIX".
- TypeScript estricto: no agregues `any` (hay ~90 heredados; no sumes).
- Fechas: `date` es fecha local de RD (`America/Santo_Domingo`) como `YYYY-MM-DD`; timestamps en UTC.
- Organización objetivo por *feature* (`src/features/<feature>/…`, doc 00 §2.4). Código nuevo de dominio: funciones puras sin imports de Next/React/Supabase.

## 10. UI / UX

- Componentes base en `src/components/ui` (shadcn + Tailwind 4 + `cva`).
- Accesibilidad: controles interactivos con su rol (`button`, `option`…), operables con teclado. Hoy `SearchableDropdown` no lo es (auditoría U3).
- Estados vacíos y de error explícitos: nunca un spinner que pueda quedar girando para siempre (ver arreglos en `CreditHealthBento` y `ClientTransactionTable`).
- La app no es un banco: nada de textos que lo sugieran ("fondos asegurados", "tarjetas físicas").
- Iconos: preferir `lucide-react` (Iconify descarga iconos en runtime y falla offline).

## 11. Qué NO hacer

- No hacer merge de PRs ni push a `main`/`dev`.
- No escribir en la BD de producción ni cambiar configuración de Vercel/Supabase/Google sin autorización.
- No reintroducir n8n ni dependencias pagas.
- No reescribir historial de ramas compartidas.
- No dar por terminado algo sin haberlo ejecutado.
