# 04 — Arquitectura para varios frontends (web + móvil)

> Estado: **propuesta** · Fecha: 2026-11-25
> Modifica `00-BASE §2.4`: el backend deja de vivir dentro de la app Next.js.

## 1. Requisito

YBank tendrá en algún momento apps móviles (nativas o híbridas) además de la web. Todos los clientes deben ver **exactamente los mismos datos y las mismas reglas** (saldos, impuesto, ingesta), sin duplicar lógica.

## 2. Problema con el plan anterior

En `00-BASE` las mutaciones vivían en **Server Actions de Next.js** y la ingesta en Route Handlers de Next. Ninguna de las dos cosas sirve para una app móvil:
- Las Server Actions **solo las puede llamar la web**.
- Una app móvil que dependa de endpoints de la app web acopla el backend al ciclo de despliegue del frontend web.

## 3. Arquitectura propuesta: el backend es Supabase; los frontends son clientes iguales

```
                ┌───────────── Clientes (iguales entre sí) ─────────────┐
                │  Web (Next.js)      Móvil (Expo / React Native)  …    │
                └──────────┬───────────────────────┬────────────────────┘
                           │ supabase-js (Auth + RLS)                    
                           ▼                                             
┌──────────────────────────────── Backend (carpeta supabase/) ─────────────────────────┐
│  Postgres                                                                             │
│   • Tablas + RLS            → lecturas directas desde cualquier cliente              │
│   • RPC (funciones SQL)     → TODAS las escrituras con reglas de negocio             │
│       save_transaction, delete_transaction, ingest_bank_transaction, …               │
│   • tax_rules, exchange_rates (datos versionados)                                     │
│   • pg_cron                 → jobs programados                                        │
│  Edge Functions (TypeScript)                                                          │
│   • ingest-email   ← webhook del Cloudflare Email Worker                              │
│   • fx-rates       ← pg_cron diario                                                   │
│   • gmail-import   ← importación histórica única                                      │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### Reglas

1. **Toda regla de negocio que afecte datos vive en el backend**: RPC (si es transaccional y sobre datos propios) o Edge Function (si necesita secretos o servicios externos). Nunca en un frontend.
2. **Los frontends solo hacen**: UI, validación de formularios (con los mismos esquemas Zod), caché y estado offline.
3. **En la web, las Server Actions quedan como adaptadores finos** (llaman a la RPC) o desaparecen y la web llama a la RPC directamente como el móvil. Decisión: **la web usa el mismo camino que el móvil** (supabase-js → RPC), así hay un solo contrato que probar.
4. **Lecturas**: directas a tablas/vistas con RLS. Las lecturas complejas (filtro por categoría con desgloses, paginación con total) pasan a **vistas o RPC de lectura**, para no reimplementarlas en cada cliente.

### Por qué Supabase y no un backend propio (NestJS, etc.)

- Supabase ya es multi-cliente: Auth, RLS, API REST generada y SDKs para web, React Native, Swift y Kotlin.
- Un backend propio duplicaría Auth y la API sin agregar capacidad que hoy falte (driver D6: un dev, decenas de usuarios).
- Si algún día hace falta, las RPC y las Edge Functions son la frontera: se pueden mover detrás de otro servicio sin cambiar los clientes.

### Por qué las Edge Functions y no Route Handlers de Next para la ingesta

| | Route Handlers en Vercel | Supabase Edge Functions |
|---|---|---|
| Acoplado al frontend web | Sí (mismo deploy) | **No** |
| Cron | Vercel Hobby: 1 vez al día | **pg_cron**: cualquier frecuencia |
| Cerca de la BD | No | Sí |
| Lenguaje | TypeScript (Node) | TypeScript (Deno, admite paquetes npm) |

## 4. Contrato estable (crítico para móvil)

Una app móvil no se actualiza al instante: siempre habrá versiones viejas instaladas. Por eso:
- **Cambios aditivos**: columnas nuevas opcionales, parámetros nuevos con valor por defecto.
- **Cambios incompatibles = RPC nueva** (`save_transaction_v2`); la anterior se mantiene hasta que ninguna versión instalada la use.
- Los tipos (`supabase gen types`) y los esquemas Zod son **el contrato**, compartidos por todos los clientes.
- Tests de las RPC en SQL (`supabase/tests/`): el contrato se prueba una vez, no por cliente.

## 5. Código compartido entre frontends

**Ahora:** un solo repo, sin monorepo. Se escribe el código para que mudarlo sea mecánico:
- `src/shared/` y los `domain/` de cada feature: **sin imports de Next.js ni del DOM**.
- Esquemas Zod, tipos de BD, claves de caché y formateo de dinero/fechas en módulos puros.

**Cuando empiece la app móvil** (no antes), monorepo con npm workspaces (+ Turborepo si hace falta):

```
apps/
  web/          # Next.js
  mobile/       # Expo (React Native)
packages/
  core/         # Zod, tipos de BD, dominio puro (dinero, fechas, impuesto para mostrar)
  data/         # hooks de TanStack Query + clientes Supabase compartidos
supabase/       # backend: migraciones, RPC, Edge Functions, tests
```

**Recomendación de stack móvil:** **Expo (React Native)**. Reutiliza TypeScript, React, TanStack Query, Zod y supabase-js; un solo código para iOS y Android. Nativo puro (Swift/Kotlin) solo si una necesidad concreta lo exige.

## 6. Impacto en decisiones anteriores

| Decisión | Cambio |
|---|---|
| Offline (01 §A) | Igual. En móvil: TanStack persistido en MMKV/AsyncStorage. La compatibilidad con PowerSync (que tiene SDK para React Native) gana valor. |
| Ingesta (01 §B) | El webhook va a una **Edge Function**, no a Vercel. |
| Estructura por features (00 §2.4) | Se mantiene en la web; `server/actions.ts` pasa a ser opcional (adaptador). La lógica va a RPC/Edge Functions. |
| Fase 2 | Las RPC de escritura son el núcleo de la arquitectura, no solo un arreglo de atomicidad. |
