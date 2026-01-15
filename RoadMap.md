# 🗺️ Hoja de Ruta: yBank v2

## Objetivo

Construir un sistema de **finanzas personales automatizado ("Zero Config")** que ingiera correos bancarios, los procese con IA y genere un **dashboard financiero en tiempo real**.

---

## 🏗️ Fase 0: Cimientos y Arquitectura *(Completada ✅)*

**Objetivo:** Configurar el entorno base y definir las reglas de juego del proyecto.

### Alcances
- **Inicialización**
  - Next.js 15
  - TypeScript
  - Tailwind CSS v4

- **Base de Datos**
  - Configuración de Supabase
  - Diseño del schema SQL:
    - `institutions`
    - `accounts`
    - `transactions`

- **Estilos**
  - Configuración de `globals.css`
  - Variables de tema personalizadas
  - Sistema de Diseño yBank

- **Estructura de Carpetas**
  - Arquitectura modular:
    - `services/`
    - `actions/`
    - `components/`

- **UI Base**
  - Creación de la pantalla de Login (visual)

---

## 🔐 Fase 1: Identidad y Seguridad (Auth)

**Objetivo:** Permitir que el usuario inicie sesión y otorgue acceso a Gmail.

### Configuración Google Cloud
- Crear credenciales OAuth:
  - Client ID
  - Client Secret
- Habilitar **Gmail API**
- Agregar scopes:
  - `userinfo.email`
  - `gmail.readonly`

### Middleware de Protección
- Crear `src/middleware.ts`
- Proteger rutas:
  - `/dashboard`
- Gestión de cookies de sesión (Supabase)

### Server Actions de Auth
- Crear `src/actions/auth.ts`
- Función:
  - `loginWithGoogle()`
    - Inicia flujo OAuth
    - Solicita scopes necesarios

### Ruta de Callback
- Crear `src/app/auth/callback/route.ts`
- Recibir `code` de Google
- Intercambiar por sesión válida de Supabase

### Integración UI
- Conectar botón **"Iniciar con Google"**
- Archivo:
  - `sign-in/page.tsx`
- Uso de Server Actions

---

## 🧠 Fase 2: Lógica de Negocio (Service Layer)

**Objetivo:** Crear el cerebro del sistema, independiente de la UI.

### Tipado de Datos
- Asegurar que:
  - `src/types/database.types.ts`
- Refleje fielmente el schema SQL actual

### Banking Service (`src/services/banking/`)
- `getOrCreateInstitution(name)`
  - Busca banco por nombre
  - Si no existe, lo crea

- `getOrCreateAccount(userId, bankId, last4)`
  - Lógica de **Auto-Discovery**
  - Evita cuentas duplicadas

### Transaction Service (`src/services/transactions/`)
- `createTransaction(data)`
  - Inserta el gasto
  - Lo vincula a la cuenta correcta

---

## 📧 Fase 3: Conectividad (Gmail Integration)

**Objetivo:** Extraer correos crudos desde Gmail.

### Adaptador de Gmail
**Ruta:** `src/services/mail/adapters/gmail.ts`

- Implementar `GmailAdapter`
- Funciones:
  - `listEmails(query)`
    - Buscar correos bancarios
    - Ejemplo:  
      ```
      from:notificaciones@banco
      ```
  - `getEmailContent(id)`
    - Descargar mensaje
    - Decodificar Base64 → Texto

### Prueba de Conexión
- Botón temporal en Dashboard:
  - **"Test Gmail"**
- Imprimir en consola:
  - Asuntos de los últimos 5 correos

---

## 🤖 Fase 4: Inteligencia Artificial (Parsing & Auto-Discovery)

**Objetivo:** Convertir texto no estructurado en datos financieros confiables.

### Configuración IA
- Cliente IA en:
  - `src/lib/ai.ts`
- Proveedor:
  - OpenAI **o**
  - Google Gemini

### Ingeniería de Prompts
**Ruta:** `src/constants/prompts.ts`

- Instrucciones claras:
  - Extraer:
    - monto
    - comercio
    - últimos 4 dígitos
  - Salida:
    - JSON **estricto**

### Servicio de Parsing
**Ruta:** `src/services/ai/parser.ts`

- Función:
  - `parseEmailNode(rawText)`
    - Envía texto a IA
    - Valida JSON devuelto

### Orquestador (Sync Engine)
**Ruta:** `src/actions/sync.ts`

- Server Action:
  - `syncFinances()`

#### Flujo
1. Traer emails (Gmail Adapter)
2. Parsear contenido (AI Service)
3. Auto-Discovery:
   - Banco
   - Cuenta
4. Guardar transacción

---

## 📊 Fase 5: Visualización (Dashboard UI)

**Objetivo:** Mostrar la información de forma clara y atractiva.

### Layout del Dashboard
- Archivo:
  - `src/app/(dashboard)/layout.tsx`
- Componentes:
  - Sidebar
  - Navbar

### Componentes de Dominio
**Ruta:** `src/components/domain/`

- `StatCard`
  - Balance Total
- `TransactionRow`
  - Fila de movimientos
- `BankCard`
  - Tarjeta visual tipo crédito
  - Gradiente azul

### Página Principal
**Ruta:** `src/app/(dashboard)/page.tsx`

- Conexión a Supabase
- Mostrar transacciones reales
- Gráficas:
  - Gastos por categoría
  - Librería: **Recharts**

---

## 🚀 Fase 6: Pulido y Despliegue

### Manejo de Errores
- Fallos de IA
- Expiración del token de Gmail

### Automatización (Opcional)
- Cron Jobs con **Vercel Cron**
- Sincronización nocturna automática

### Despliegue
- Plataforma:
  - **Vercel**
