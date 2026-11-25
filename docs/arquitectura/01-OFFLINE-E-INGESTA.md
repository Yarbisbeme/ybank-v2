# 01 — Offline y origen de los datos (propuesta)

> Estado: **propuesta, pendiente de aprobación** · Fecha: 2026-11-25
> Depende de: `00-BASE.md`

## Decisiones ya tomadas

| Pregunta | Respuesta |
|---|---|
| Alcance | Producto público, pero para el autor y sus amigos (decenas de usuarios, no miles) |
| Hosting | Vercel |
| Offline | **Crear y leer.** Editar y borrar requieren conexión. |

---

## A. Offline: ¿SQLite?

### A.1 El problema real no es dónde guardar, es sincronizar

SQLite solo es almacenamiento. En el navegador sería SQLite en WASM (wa-sqlite / OPFS). Lo difícil no es guardar las filas en local, sino:
- bajar solo lo que cambió (cursor, filas borradas),
- subir lo creado sin duplicar si se corta la red,
- y migrar el esquema local cuando cambia el del servidor.

Escribir ese motor de sincronización a mano es justo el tipo de código que falla en silencio. **SQLite a mano queda descartado.**

### A.2 Opciones reales

| Opción | Qué es | Lectura offline | Creación offline | Costo / complejidad |
|---|---|---|---|---|
| **1. TanStack Query + bandeja de salida** (stack actual) | La caché persistida (IndexedDB) más mutaciones pausadas que se reintentan al volver la conexión | Lo que ya se vio y un conjunto descargado de los últimos N meses; los filtros offline se aplican en memoria | ✅ | Ninguna dependencia nueva |
| **2. PowerSync** | SQLite real en el navegador, sincronizado con Supabase (integración oficial); las subidas pasan por nuestro propio código | ✅ SQL completo offline: filtros, búsqueda, reportes | ✅ (la cola de subida viene incluida) | Servicio externo (cloud con plan gratuito o autohospedado), reglas de sincronización; reemplaza la capa de datos del cliente |
| 3. ElectricSQL / PGlite | Sincronización de lectura desde Postgres | ✅ | Hay que construirla | Requiere su propio servidor; más pesado |
| 4. SQLite/Dexie + sync propio | Construirlo nosotros | ✅ | ✅ | ❌ Reinventar sync |

### A.3 Recomendación: **Opción 1 ahora, con un contrato de servidor compatible con la Opción 2**

Como offline solo **creamos** (no editamos ni borramos datos que ya existen en el servidor), **no hay conflictos que resolver**. Una creación no puede chocar con nada. Para eso no hace falta un motor de sincronización.

Lo que sí hacemos desde el día 1, y sirve igual para ambas opciones:

1. **IDs generados en el cliente** (`crypto.randomUUID()`). La RPC `save_transaction` hace `INSERT … ON CONFLICT (id) DO NOTHING`, así que reintentar es seguro (idempotente).
2. **Columnas `updated_at` y `deleted_at`** en las tablas sincronizables. Permiten bajar cambios incrementales y saber qué se borró.
3. **El servidor es la fuente de verdad del saldo.** Offline, el cliente muestra un "saldo proyectado" = saldo confirmado ± transacciones pendientes, con un indicador visual.

**Cuándo pasar a PowerSync:** cuando necesites consultar todo el historial offline (reportes, búsquedas sin límite de fecha) o editar offline. Gracias a los puntos 1–3, el cambio queda contenido en la capa cliente.

### A.4 Reglas de la creación offline (lo que hay que pensar bien)

| Caso | Regla |
|---|---|
| Editar o borrar una transacción **todavía no sincronizada** | Permitido: se modifica la entrada en la cola. El servidor nunca la vio, así que no hay conflicto. |
| Editar o borrar una transacción **ya sincronizada** | Bloqueado offline (como pediste). |
| Tag o categoría creada offline y usada en una transacción offline | También lleva UUID del cliente; la cola respeta el orden (primero el tag, luego la transacción). |
| Transferencia entre monedas offline | Se usa la última tasa en caché marcada como **provisional**; el servidor fija la tasa definitiva al sincronizar. |
| **Duplicado con la ingesta**: registras un gasto a mano offline y luego llega el correo del banco | Este es el único conflicto real. La RPC de ingesta busca una transacción manual de la misma cuenta, mismo monto y fecha ±1 día sin `source_email_id`. Si la encuentra, **la vincula** en lugar de crear otra. Si hay ambigüedad, la marca como "posible duplicado" para que el usuario decida. |
| La sesión expira estando offline | La cola se conserva. Al volver a iniciar sesión se envía solo si el usuario es el mismo; si no, se descarta tras confirmar. |
| Varios dispositivos | Sin conflicto: solo se crean filas nuevas. |

---

## B. Origen de los datos: ¿API de Gmail o reenvío de correos?

### B.1 Problema con la API de Gmail en una app pública

`gmail.readonly` y `gmail.modify` son scopes **restringidos** de Google. Para un producto público:
- **Verificada**: requiere revisión y una auditoría de seguridad anual de un tercero (CASA), con costo y tiempo.
- **Sin verificar**: pantalla de advertencia "app no verificada" y tope de usuarios. En modo *Testing*, además, **los refresh tokens vencen a los 7 días**, lo que rompe la sincronización en segundo plano. *(Hay que confirmar los límites exactos en la consola de Google Cloud.)*
- Guardamos tokens con acceso al **buzón completo** de cada amigo, lo que implica cifrado, rotación, revocación (`invalid_grant`) y responsabilidad legal.

### B.2 Alternativa: reenvío automático a una dirección de ingesta

Cada usuario recibe una dirección única (ej. `u-7f3k9q@in.<dominio>`) y crea en Gmail un filtro que reenvía **solo los correos de sus bancos**. Un servicio de correo entrante (Cloudflare Email Routing + Worker, o el inbound de Postmark/Resend) los entrega a un webhook en Vercel.

| | API de Gmail | Reenvío |
|---|---|---|
| Verificación de Google | Necesaria (o advertencias y límites) | **No aplica** |
| Tokens que guardar | Refresh token del buzón completo | **Ninguno** |
| Privacidad | Acceso a todo el correo | Solo los correos bancarios |
| Latencia | Cron (Vercel Hobby: 1 vez al día) o Pub/Sub | **Inmediata (push)** |
| Proveedores | Solo Gmail | Gmail, Outlook, iCloud… |
| Historial previo | Se puede importar | No automático (importación opcional, ver abajo) |
| Configuración por usuario | Un clic (OAuth) | Crear un filtro + confirmar el reenvío (guiado desde la app) |
| Riesgo propio | Tokens filtrados | Correos falsos enviados a la dirección: se mitiga con una dirección secreta rotable + verificación DKIM del dominio del banco + allowlist de remitentes |

**Detalle práctico:** Gmail envía un código de confirmación a la dirección de reenvío. Nuestro webhook lo recibe y la app se lo muestra al usuario, así que el alta se hace sin salir de YBank.

**Recomendación:** **reenvío como canal principal.** La API de Gmail queda, opcionalmente, solo para una **importación histórica única** (o se descarta).

Con esto, el resto del pipeline de `00-BASE §2.4` no cambia: el correo entra a `inbound_emails` → se clasifica, se parsea y se ingiere con idempotencia. Solo cambia la puerta de entrada (un adaptador distinto).

### B.3 Frecuencia de sincronización (pregunta 4)

- **Con reenvío:** no hay frecuencia; cada correo llega por push en segundos. Se agrega un job diario (Vercel Cron, permitido en Hobby) para **reprocesar** los `inbound_emails` fallidos con la versión más reciente de los parsers.
- **Si se elige la API de Gmail:** Vercel Hobby solo permite cron diario. Usar `pg_cron` + `pg_net` de Supabase para llamar a `/api/cron/sync` cada 15 min, más sincronizar al abrir la app y con un botón manual. Sincronización incremental con `historyId`.

---

## Decisiones

1. ✅ Offline: **Opción 1 (TanStack + bandeja de salida)** con contrato compatible con PowerSync.
2. ✅ Ingesta: **reenvío de correos** como canal principal + **importación histórica única** vía API de Gmail.
3. ✅ Dominio comprado en Cloudflare (2026-11-25). App en el dominio raíz; ingesta en el subdominio `in.` vía Cloudflare Email Routing + Worker (C2). Ver C.

---

## C. Dirección de ingesta sin dominio propio

`*.vercel.app` **no sirve**: recibir correo requiere registros MX en el DNS del dominio, y el DNS de `vercel.app` es de Vercel.

| Opción | Costo | Pros | Contras |
|---|---|---|---|
| **C1. Gmail dedicado + Apps Script** (`ybank.in+<token>@gmail.com`) | $0 | Sin dominio; Apps Script corre como dueño de la cuenta (no requiere verificación OAuth); disparador cada 1–5 min; puede enviar el MIME crudo (`getRawContent`) al webhook para verificar DKIM | Latencia de 1–5 min; correos de todos los usuarios en un buzón; cuotas de Apps Script; un solo punto de falla |
| **C2. Dominio barato en Cloudflare Registrar** + Email Routing + Worker | Precio de costo, sin margen (.com ≈ US$10–11/año, verificar) | Solución limpia, push inmediato, gratis más allá del dominio | Costo anual |
| C3. Subdominio gratuito (eu.org, is-a.dev…) o dirección de un proveedor inbound | $0 | Sin costo | Aprobación lenta o reglas de uso; dependencia de terceros para un producto financiero; límites de planes gratuitos |

Ojo con los TLD "baratos" (.xyz, .online, .site): suelen costar US$1–2 el primer año y US$15–40 al renovar.

**Disponibilidad verificada por RDAP (2026-11-25):**
- Registrados: `ybank.com`, `.net`, `.org`, `.app`, `.xyz`, `myybank.com`.
- No registrados: `ybankapp.com`, `getybank.com`, `useybank.com`, `ybankrd.com`, `ybank.dev`, `ybank.money`, `ybank.finance`, `ybank.cash`, `ybank.lat`.
- Sin RDAP, no verificables así: `.io`, `.me`, `.co`, `.do`.

**Candidato recomendado:** `ybankapp.com` (.com al costo en Cloudflare, mismo precio al renovar).

**Diseño:** la entrada es un adaptador (`InboundEmailSource`): Apps Script y Cloudflare Worker hacen `POST` del MIME crudo al mismo webhook firmado (HMAC). Cambiar de C1 a C2 no toca el pipeline. **Costo del cambio:** cada usuario debe actualizar la dirección de su filtro, por eso conviene decidir antes de invitar amigos.
