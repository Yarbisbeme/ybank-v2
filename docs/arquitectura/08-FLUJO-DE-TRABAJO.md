# 08 — Flujo de trabajo: ramas, entornos y despliegue

> Estado: **propuesta** · Fecha: 2026-11-25
> Motivo: el PR #16 llegó a producción probado solo en un Preview que usa la **BD de producción** y una URL distinta de la real. Pasaron dos fallos (bucle de redirecciones y `www` vs. dominio sin `www`) que un staging equivalente a producción habría detectado.

## 1. Lo que importa no es el nombre de la rama, sino el entorno

Una rama `dev` sin un entorno propio no protege nada: solo agrega un paso. La protección real viene de:
1. **Un entorno de staging igual a producción** (dominio propio, configuración de Auth real), **con su propia base de datos**, para que las pruebas no toquen datos reales.
2. **Compuertas automáticas**: nada entra a `dev` ni a `main` sin CI en verde.
3. **Una verificación explícita** en staging antes de promover a producción.

## 2. Flujo propuesto

```
feature/*  ──PR──►  dev  ──PR "release"──►  main
   │                 │                        │
   │ Preview         │ Staging                │ Producción
   │ (Vercel)        │ staging.ybankapp.com   │ ybankapp.com
   │ BD: staging     │ BD: ybank-staging      │ BD: ybank-prod
   └─ CI             └─ CI + checklist        └─ CI
```

| Rama | Entorno | Base de datos | Entra por |
|---|---|---|---|
| `feature/*`, `fix/*` | Preview de Vercel (`*.vercel.app`) | **staging** | — |
| `dev` | **Staging**: `staging.ybankapp.com` | **staging** | PR desde `feature/*`, con CI en verde |
| `main` | **Producción**: `ybankapp.com` | **producción** | PR "release" desde `dev`, con CI en verde + checklist de staging |
| `hotfix/*` | Preview → producción | — | PR directo a `main` **solo** si producción está rota; después se fusiona `main` → `dev` |

### Base de datos
- **Supabase Free permite 2 proyectos**: `ybank-prod` (el actual) + `ybank-staging` (nuevo). Costo $0 (doc 05).
- Las migraciones se aplican **primero a staging** y, al promover a `main`, a producción. El mismo archivo en los dos.
- Staging se carga con `seed.sql` (bancos y categorías) + usuarios de prueba. **Nunca datos reales.**
- Las migraciones a producción las aplica un paso explícito del release, no un push accidental.

### Variables de entorno en Vercel
| Entorno de Vercel | Rama | `NEXT_PUBLIC_SUPABASE_*` |
|---|---|---|
| Production | `main` | proyecto **prod** |
| Preview (rama `dev`, dominio `staging.ybankapp.com`) | `dev` | proyecto **staging** |
| Preview (resto de ramas) | `feature/*` | proyecto **staging** |

Vercel permite asignar variables por rama en el entorno Preview, así que `dev` y las features comparten la BD de staging.

## 3. Compuertas (GitHub → Settings → Branches → reglas)

**`main` y `dev`:**
- Exigir Pull Request (sin push directo).
- Exigir el check **CI** en verde.
- Exigir la rama actualizada antes de fusionar.
- Prohibir force-push y borrado.

**CI** (`.github/workflows/ci.yml`) corre en cada PR hacia `dev` y `main`: tipos, tests, build y, cuando esté limpio, lint obligatorio.

## 4. Checklist de release (`dev` → `main`)

Antes de fusionar el PR de release, verificado en **staging.ybankapp.com**:
- [ ] Login con Google y con email (en ventana de incógnito)
- [ ] Registro + onboarding
- [ ] Crear, editar y borrar una transacción; el saldo cuadra
- [ ] Sesión vencida → login sin bucles
- [ ] Migraciones nuevas aplicadas en staging sin errores
- [ ] E2E de `e2e/audit` en verde contra staging (cuando se automatice)

Después de fusionar: aplicar migraciones a producción y repetir login y dashboard en `ybankapp.com`.

## 5. Por qué no "Git Flow" completo

Git Flow agrega ramas `release/*` y `hotfix/*` permanentes, versionado y back-merges que, para un solo desarrollador, cuestan más de lo que protegen. Este flujo toma lo que sí aporta (staging separado, compuertas, hotfix explícito) y deja el resto.

## 6. Estado actual y transición

- `origin/dev` está 26 commits atrás de `main` y **no tiene commits propios** (verificado) → se actualiza a `main` sin perder nada (fast-forward).
- `fix/auth-redirect-loop` corrige un fallo **activo en producción** (login con Google roto) → califica como **hotfix**: PR directo a `main` y luego `main` → `dev`.
- Desde ese punto, todo lo nuevo sale de `dev` y vuelve a `dev`.

## 7. Proyectos (verificado 2026-11-25)

| Entorno | Proyecto Supabase | Ref | Región |
|---|---|---|---|
| Producción | `YbankTest` (renombrar a `ybank-prod`) | `cizbokgdcvvapncempdu` | us-west-2 |
| Staging | `ybank-staging` | `xmnpqgcrinwuydamrshu` | us-west-2 |

- Staging recibió las 4 migraciones + `seed.sql`. Comparado con producción mediante una consulta de solo lectura: 8 tablas, 27 políticas, 5 triggers, 15 bancos, 58 categorías y el bucket `avatars`, todo igual.
- **Diferencia conocida:** staging tiene `rls_auto_enable` + el event trigger `ensure_rls` (Supabase lo crea en proyectos nuevos: activa RLS en cada tabla nueva de `public`). Producción no lo tiene. Pendiente: migración que lo agregue a producción, pasando primero por staging.
- Comandos contra staging sin cambiar el proyecto vinculado: `npx supabase db push --remote=xmnpqgcrinwuydamrshu`.

## 8. Primera verificación de staging (2026-11-25, manual)

- [x] Login con Google en `staging.ybankapp.com` (tras agregar el callback de staging al cliente OAuth)
- [x] Registro + onboarding en staging
- [x] Login con email en staging
- [x] Login con Google en producción (`ybankapp.com`, incógnito), tras el hotfix #17

Notas: staging está protegido por *Vercel Authentication* (hay que tener sesión en Vercel). El cliente OAuth de Google tiene dos URIs de redirección: la del callback de Supabase de producción y la de staging.
