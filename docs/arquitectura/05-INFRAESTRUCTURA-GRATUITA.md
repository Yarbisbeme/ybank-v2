# 05 — Infraestructura a costo cero

> Estado: **propuesta** · Fecha: 2026-11-25
> Restricción: YBank no tiene fines de lucro (el autor y sus amigos). **El backend y la infraestructura deben costar $0.** Único gasto aceptado: el dominio `ybankapp.com` (≈ US$10–11/año, ya comprado).

## 1. Stack y planes gratuitos

| Pieza | Servicio (plan gratis) | Límites relevantes* | Uso esperado de YBank | Margen |
|---|---|---|---|---|
| Base de datos + Auth + API | **Supabase Free** | 500 MB de BD (≈ 50 MB usados al crear el proyecto), 5 GB/mes de egress, 50k usuarios activos al mes, **2 proyectos activos** | ≈ 1.1k transacciones hoy; decenas de usuarios | Años |
| Backend (ingesta, tasas, importación) | **Supabase Edge Functions** | 500k invocaciones/mes | Un correo bancario = 1 invocación | Muy amplio |
| Jobs programados | **pg_cron** (extensión de Postgres) | Corre dentro de la BD, sin costo aparte | Tasas diarias, reprocesos | — |
| Correo entrante | **Cloudflare Email Routing + Email Worker** | Recepción ilimitada; Worker gratis: 100k solicitudes/día y **10 ms de CPU por solicitud** | Decenas de correos al día | Amplio, **si el Worker no parsea** (ver §2.2) |
| Frontend web | **Vercel Hobby** | Gratis para uso personal y no comercial | Encaja con el proyecto | — |
| DNS + dominio | Cloudflare | DNS gratis; el dominio se paga a precio de costo | — | — |
| CI | **GitHub Actions** | Gratis en repos públicos; 2,000 min/mes en privados | Typecheck, tests y build por PR ≈ 3–5 min | Amplio |
| Tasa de cambio | open.er-api.com | Gratis, se actualiza a diario | 1 consulta al día (cron) | — |
| IA (opcional) | Gemini, capa gratuita | Cuotas por minuto/día | Solo como respaldo del parser | Opcional; se puede no usar |

\* Los límites salen de fuentes de terceros de 2026; confirmar en las páginas oficiales de precios antes de depender de un número exacto.

## 2. Los riesgos reales del plan gratuito y cómo se cubren

### 2.1 Supabase pausa los proyectos sin actividad
Un proyecto Free **se pausa tras ~7 días sin solicitudes a la API**. Pausado, los correos reenviados fallarían.
- La ingesta de correos ya genera actividad casi a diario.
- **Red de seguridad:** un workflow programado de GitHub Actions hace una consulta liviana a la API una vez al día (gratis).
- La Edge Function de ingesta **guarda primero el correo crudo** (inbox). Si algo falla, el Email Worker reintenta; nada se pierde en silencio.

### 2.2 Email Worker con 10 ms de CPU
Parsear MIME y aplicar reglas de bancos dentro del Worker puede exceder el límite gratuito.
- **El Worker no parsea**: valida remitente y firma, y reenvía el MIME crudo a la Edge Function (I/O, casi sin CPU).
- Todo el parsing ocurre en la Edge Function (límites mucho más amplios).

### 2.3 Supabase Free no tiene backups automáticos
Para datos financieros es inaceptable no tener respaldo.
- **Backup propio:** un workflow programado de GitHub Actions ejecuta `supabase db dump` (esquema + datos) a diario, **cifra el archivo** (age/GPG con una clave que solo tú tienes) y lo guarda como artefacto de un repo **privado** (retención de 90 días).
- **Ensayo de restauración** una vez al mes contra la base local: un backup que nunca se restauró no cuenta como backup.

### 2.4 Solo 2 proyectos activos
- `ybank-prod` (el actual) + **opcionalmente** `ybank-staging`.
- El desarrollo diario usa la **base local en Docker** (`supabase db start`), como ya hicimos con las pruebas. No consume proyectos.

### 2.5 Egress de 5 GB/mes
- Las lecturas pesadas pasan por vistas/RPC paginadas (Fase 2), no por traer tablas completas.
- La caché offline del cliente reduce las lecturas repetidas.
- Los avatares deberían servirse desde la caché del service worker: la regla existe en `next.config.ts`, pero ❓ no se verificó que funcione.

## 3. Apps móviles a costo cero

Las tiendas **no son gratis**: Apple Developer cuesta US$99/año y Google Play US$25 (pago único). Opciones:

| Opción | Costo | Notas |
|---|---|---|
| **PWA instalable** | $0 | Se instala en Android e iOS desde el navegador. La configuración PWA existe, pero ❓ no se ha probado instalarla ni usarla offline. **Recomendado como "app móvil" inicial, después de verificarla.** |
| Android APK fuera de la tienda (Expo, build local) | $0 | Los amigos lo instalan permitiendo "orígenes desconocidos". Las builds locales de Expo son gratis. |
| Google Play | US$25 una vez | Si se quiere la tienda en Android. |
| iOS nativo en App Store / TestFlight | US$99/año | **Fuera del presupuesto.** En iOS, la PWA es la vía gratuita. |

La arquitectura de `04-MULTI-FRONTEND` no cambia: el backend es el mismo para la PWA y para una futura app Expo.

## 4. Lo que queda descartado por costo

- Servidores propios / VPS, contenedores pagos, Redis, colas administradas.
- Supabase Pro (US$25/mes) mientras el plan gratuito alcance.
- Vercel Pro, Cloudflare Workers Paid.
- Servicios de correo entrante pagos (Postmark, etc.).
- IA paga para el parsing: el parser determinista es el camino principal.

## 5. Cuándo revisar esta decisión

- La BD supera ~350 MB (70 % del límite).
- El egress mensual supera ~3.5 GB.
- Más de ~100 usuarios activos, o alguien quiere que YBank deje de ser un proyecto personal.

Cada métrica se ve en el dashboard de uso de Supabase; conviene revisarlo una vez al mes.

## Fuentes

- [Supabase Free Tier Limits (2026) — Free Cloud Zone](https://freecloudzone.com/articles/supabase-free-tier-limits-2026/)
- [Supabase Free Tier Limits 2026 — Nayan Kyada](https://nayankyada.com/blog/supabase-pricing-2026-free-tier-limits-compute-costs-when-to-upgrade)
- [Supabase free plan limits — Reeve](https://reeve.page/blog/supabase-free-plan-limits)
- [Cloudflare Workers limits (docs en GitHub)](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/platform/limits.mdx)
- [Cloudflare Email Routing vs email hosting — Shipmail](https://shipmail.to/blog/cloudflare-email-routing-vs-email-hosting)
