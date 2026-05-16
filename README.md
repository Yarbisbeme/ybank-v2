# yBank v2 🏦

**yBank v2** es una plataforma de gestión financiera personal diseñada bajo la filosofía "Zero Config". Su objetivo principal es automatizar la ingesta de datos financieros a través del procesamiento de correos electrónicos bancarios utilizando Inteligencia Artificial, eliminando la entrada manual de datos y proveyendo análisis contables avanzados en tiempo real.

---

## 1. Stack Tecnológico y Dependencias 🚀

Elegimos tecnologías modernas que priorizan el rendimiento, la seguridad de tipos, las micro-interacciones fluidas y la máxima precisión en el procesamiento de datos financieros.

### Core
* **Next.js 15 (App Router):** Estructura base del proyecto. Explotamos los Server Components para renderizado ultrarrápido y Server Actions para interactuar con el backend sin necesidad de desplegar una API REST tradicional.
* **TypeScript:** Lenguaje base. Tipado estricto en todo el flujo de datos para erradicar errores catastróficos en operaciones contables (como mutaciones accidentales o concatenaciones de strings con números).
* **Supabase:** Backend-as-a-Service (BaaS). Provee la base de datos relacional PostgreSQL, Autenticación JWT y políticas de seguridad RLS.
* **Tailwind CSS:** Framework de estilos por utilidades arquitectónicas. Garantiza consistencia en el diseño e interfaces altamente responsivas.

### Librerías Clave

| Librería | Propósito | Patrón Relacionado / Notas |
| :--- | :--- | :--- |
| `@supabase/ssr` | Gestión de sesiones, cookies y auth en Next.js Server Side. | Singleton (Cliente DB) |
| `framer-motion` | Animaciones de diseño, transiciones elásticas (`layout`) y micro-interacciones en modales y gráficos. | Declarative Animation |
| `zustand` | Store global ligero para estados de UI, filtros y persistencia local selectiva. | Global State Store |
|`@tanstack/react-query` | Gestión de estado asíncrono del servidor en caché. | Server-State Cache (Capa de Sincronización)|
| `lucide-react` | Iconografía vectorizada, consistente y optimizada. | Component Building Block |
| `sonner` | Sistema asíncrono de notificaciones tipo Toast. | UI Feedback |
| `date-fns` | Manipulación semántica de fechas y localización regional. | Utility |
| `googleapis` | Cliente oficial para la extracción de estados de cuenta vía Gmail API. | Adapter (Ingesta) |

---

## 2.📂 Arquitectura del Proyecto

El sistema se rige bajo una **Arquitectura en Capas (Layered Architecture)** adaptada al ecosistema de Next.js. Separamos rígidamente la presentación visual de las reglas de negocio globales de la aplicación.

#### Estructura de Directorios (src/)
```
src/
├── app/                  # [CAPA DE PRESENTACIÓN]
│   ├── (auth)/           # Rutas públicas (Login)
│   └── (dashboard)/      # Rutas protegidas (requieren sesión)
│       ├── dashboard/     
│       ├── accounts/      
│       └── settings/
│
├── components/           # [UI BUILDING BLOCKS]
│   ├── ui/               # Componentes base (Botones, Inputs) - Reutilizables
│   ├── Dashboard/
│   ├── Accounts/
│   └── Transactions/
│
├── services/             # [CAPA DE LÓGICA DE NEGOCIO] - EL CEREBRO 🧠
│   ├── banking/          # Reglas para crear cuentas, detectar bancos duplicados
│   ├── transactions/     # Lógica de inserción y categorización
│   ├── mail/             # Lógica de conexión con proveedores de correo
│   └── ai/               # Prompts y lógica de parsing de texto
│
├── lib/                  # [CAPA DE INFRAESTRUCTURA]
│   ├── supabase/         # Configuración de clientes (Server vs Browser)
│   └── actions/          # Server Actions (Punto de entrada al backend desde UI)
│   └── utils.ts          # Helpers puros
│
└── types/                # [DEFINICIONES DE DOMINIO]
    └── database.ts       # Tipos generados automáticamente desde SQL
```

## 3. Patrones de Diseño Implementados

### A. Adapter Pattern (Patrón Adaptador)
* **Problema:** Hoy extraemos datos de Gmail, pero mañana se integrará Outlook, Apple Mail o Webhooks crudos de SendGrid.
* **Solución:** Definimos contratos estrictos (`IMailProvider`). El núcleo de procesamiento de IA no sabe de qué servidor provienen los correos, solo consume un payload normalizado.
* *Ubicación:* `src/services/mail/adapters/`

### B. Service Layer Pattern (Patrón de Servicio)
* **Problema:** Acoplar consultas de base de datos (`supabase.from()`) directamente dentro de los componentes visuales destruye la reusabilidad y dificulta el mantenimiento.
* **Solución:** Los componentes de React jamás tocan la base de datos directamente para escribir registros. Invocan funciones puras de la capa de servicios que encapsulan las reglas de negocio y los triggers automáticos.
* *Ubicación:* `src/services/`

### C. Server Actions como Controladores (Mediator)
* **Problema:** Levantar endpoints API REST tradicionales (`/api/transactions`) para cada operación interna consume tiempo de desarrollo y fragmenta los tipos de datos.
* **Solución:** Usamos Server Actions marcadas con `'use server'`. Actúan como controladores estrictos: validan la sesión en el servidor, aplican parseos intermedios y llaman a los servicios de dominio correspondientes.

### D. Repository / Custom Hook Pattern (Capa de Abstracción de Datos)
* **Problema:** Si cada componente (`HeroBalance`, `AccountCarousel`, `ClientTransactionTable`) llama a `getAccounts()` por su cuenta usando `useEffect`, duplicarías las peticiones HTTP/Supabase a la red, crearías múltiples estados de carga independientes y saturarías el cliente.

* **Solución:** Centralizamos todas las consultas del servidor en Custom Hooks de TanStack Query. Estos hooks actúan como repositorios de datos en caché. Si tres componentes piden `useAccounts()` al mismo tiempo, TanStack Query hace una sola petición y le distribuye los datos instantáneamente a los tres, manteniendo la UI sincronizada.

    - **Ubicación:** `src/hooks/useCatalogs.ts`

    - **Mutaciones Optimistas:** Cuando creas un registro (ej: `useSaveTransaction`), el hook invalida automáticamente la caché (`queryClient.invalidateQueries`), forzando a la tabla y al balance a recalcularse con los datos frescos del servidor sin necesidad de recargar la página. 
---

## 4. Motor Cambiario Inteligente (Smart Rate Engine)

Una de las características core de yBank es su capacidad para operar de forma multi-moneda de manera transparente para el usuario, aplicando una arquitectura híbrida de sincronización de tasas.

### A. Spreads Bancarios Dinámicos
Los bancos tradicionales nunca venden ni compran divisas al precio oficial del mercado internacional. El backend calcula tasas personalizadas por cada institución financiera utilizando márgenes configurables (Spreads):

* **Tasa de Venta (Sell Rate):** Aplicada cuando el banco le vende dólares al usuario (ej: traspaso de cuenta de Pesos a Dólares).
    $$\text{Tasa Final} = \text{Tasa de Mercado} + \text{Margen de Venta del Banco}$$
* **Tasa de Compra (Buy Rate):** Aplicada cuando el banco le compra dólares al usuario (ej: abono en dólares a tarjeta en pesos).
    $$\text{Tasa Final} = \text{Tasa de Mercado} - \text{Margen de Compra del Banco}$$

### B. Flujo de Hidratación Reactiva del Balance
Para mitigar el parpadeo de interfaces y garantizar cálculos exactos basados en las preferencias del cliente, el componente `HeroBalance` implementa una sincronización reactiva al iniciar:

1.  **Detección de Contexto:** El componente consume las cuentas activas desde TanStack Query y evalúa cuál es el nodo contable de enfoque (la cuenta preferida por el usuario o la primera cuenta líquida disponible).
2.  **Sincronización:** Mediante un efecto controlado, se extrae el `institution_id` del banco enfocado y se dispara la acción global `updateRateContext(institutionId)`.
3.  **Conversión Elástica:** El store de Zustand despacha la llamada al Server Action `getSmartRate`, computa el spread real del banco y actualiza el estado. La UI reacciona recalculando los saldos consolidados bajo la siguiente lógica matemática en tiempo real:

$$\text{Balance de Cuenta} = \begin{cases} \frac{\text{Saldo}_{\text{DOP}}}{\text{Tasa Banco}}, & \text{si Moneda UI = USD y Moneda Cuenta = DOP} \\ \text{Saldo}_{\text{USD}} \times \text{Tasa Banco}, & \text{si Moneda UI = DOP y Moneda Cuenta = USD} \end{cases}$$

---

## 5. Buenas Prácticas y Reglas de Desarrollo de Ingeniería

### 📆 Regla de Oro para el Manejo de Fechas (UTC Drift Bypass)
Al inicializar fechas en JavaScript utilizando cadenas puras en formato `YYYY-MM-DD`, los motores de los navegadores asumen por defecto la medianoche del huso horario UTC (Londres). Esto provoca desfases de días enteros al restar las zonas horarias locales (ej: UTC-4 en República Dominicana).

* **Prohibido:** Usar `new Date(tx.date)` de manera directa para renderizar textos en pantalla.
* **Obligatorio:** Parsear la cadena de forma manual separando sus componentes temporales antes de instanciar el objeto, forzando al navegador a construir el objeto bajo el tiempo local de la máquina:
    ```typescript
    const [year, month, day] = tx.date.split('T')[0].split('-');
    const safeDate = new Date(Number(year), Number(month) - 1, Number(day));
    ```

### 📱 Reglas de Layout y Resiliencia en UI/UX
1.  **Prevención de Saltos Estructurales (Layout Shifts):** Componentes interactivos que intercambian textos de diferentes longitudes (ej: *Capital Líquido* vs *Patrimonio Neto Total*) deben poseer alturas y anchos controlados con la directiva `layout` de `framer-motion`. Esto transforma los saltos secos del DOM en transiciones elásticas premium de tipo spring.
2.  **Integridad de Datos Financieros:** Los montos de balance y estados de cuenta jamás deben esconderse detrás de puntos suspensivos (`truncate`). Si un texto largo amenaza con romper el viewport, el breakpoint responsivo debe configurarse rígidamente para romper el layout en filas verticales en lugar de mutilar la cifra:
    ```tsx
    {/* Correcto: Cambiar a flex-row solo en pantallas verdaderamente anchas */}
    <div className="flex flex-col lg:flex-row gap-8">
    ```
3.  **Evitar Zonas Muertas de Visibilidad (Breakpoint Gaps):** Al ocultar componentes móviles y mostrar versiones de escritorio, los interruptores de Tailwind deben cruzarse estrictamente en el mismo breakpoint para evitar limbos visuales en tamaños de pantallas intermedios (como tabletas en modo horizontal).
    * *Móvil:* `block md:hidden`
    * *Desktop:* `hidden md:block` (en lugar de `lg:block`).
4.  **Cálculo de Rejillas Dinámicas por Porcentaje:** Al diseñar carruseles con scroll `snap` nativo donde el número de tarjetas varíe según el breakpoint, computa los anchos restando el impacto exacto de los canales (`gap`) del contenedor:
    ```tsx
    /* 2 Tarjetas en pantallas medianas (1 gap de 20px), 3 Tarjetas en pantallas grandes (2 gaps de 20px) */
    className="w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)]"
    ```
5.  **Interacciones Controladas por Estado:** Elementos altamente dinámicos (como barras informativas de gráficos Tooltips) no deben depender exclusivamente del selector `:hover` de CSS si otra sección de la interfaz puede forzar un estado prioritario. Rastrear la interacción vía estado de React (`hoveredIndex`) garantiza sincronización absoluta e intencional.

---

## 🛠️ Configuración del Entorno de Desarrollo Local

1.  **Variables de Entorno:** Clona el archivo `.env.example` bajo el nombre `.env.local` e ingresa las credenciales criptográficas de desarrollo:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
    ```
2.  **Instalación de Dependencias:**
    ```bash
    npm install
    ```
3.  **Lanzamiento del Servidor Local:**
    ```bash
    npm run dev
    ```

---

## 📝 Roadmap del Sistema

* [x] Inicialización del proyecto, arquitectura base de carpetas y tipado estricto.
* [x] Configuración del Cliente Supabase SSR (Servidor, Cliente y Middleware de Rutas).
* [x] Implementación de Autenticación Segura Oauth2 con Google.
* [x] Desarrollo del Motor Cambiario Dinámico (*Smart Rate Engine*) por Institución Financiera.
* [x] Implementación de Sistemas de Selección Masiva y Modos Operativos en Lote.
* [ ] Integración del Worker de Ingesta Automatizada para Gmail API.
* [ ] Desarrollo del Pipeline de Parsing con IA para extracción de metadata de correos bancarios.
* [ ] Generación automatizada de reportes analíticos consolidados.