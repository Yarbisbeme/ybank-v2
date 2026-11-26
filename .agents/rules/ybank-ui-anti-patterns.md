---
trigger: always_on
---

# Regla UI/UX — Estándar Anti-Patrones IA YBank 2.0 ("Control con juego")

Toda modificación de interfaz en YBank v2 debe seguir estrictamente el sistema de diseño **YBank 2.0 ("Control con juego")**: software financiero personal plano, nítido, directo y con personalidad propia nacida del usuario (su tarjeta) y de la marca (la Y de dos hojas). Queda estrictamente prohibido generar UI genérica con estética "AI slop".

---

## 1. Patrones Prohibidos (Anti-AI-UI)

1. **Botones, tags y badges en forma de píldora:**
   - Prohibido `rounded-full` en botones, chips, tags o badges. Usar la escala estricta: `--radius-chip` (`4px`), `--radius-control` (`6px`), `--radius-tile` (`8px`), `--radius-panel` (`10px`).
2. **El mismo radio grande en todo:**
   - Cada nivel jerárquico tiene su radio específico (`4 / 6 / 8 / 10 / 14 / 16`). `--radius-card` (`14px`) es exclusivo de la tarjeta ISO (`1.586:1`).
3. **Puntos de color decorativos o badges falsos de "live":**
   - Prohibidos los puntos de color parpadeantes (`animate-ping`) o "Systems Normal" sin telemetría real. Usar palabras claras y un icono si hace falta: `"Conciliado"`, `"Pendiente · hoy"`.
4. **Spinners genéricos y puntos de carga:**
   - Prohibidos los spinners/loading dots en vistas de carga. Usar `<Skeleton>` con la forma real del contenido o la ola `LeafWave` llenando la tarjeta para esperas largas.
5. **Gradientes neón, glassmorphism y glows:**
   - Prohibidos los gradientes púrpura-azul neón, `backdrop-blur-xl` decorativos, esferas difuminadas (`blur-[80px]`, `blur-3xl`), sombras de color (`shadow-blue-500/40`) y `bg-clip-text text-transparent`. Usar colores sólidos; la textura vive únicamente en la tarjeta del usuario.
6. **Card dentro de card y cajas alrededor de todo:**
   - Prohibido anidar cajas con sombras o bordes gruesos en todo. Separar con espacio y un filete de 1px (`--line`).
7. **Bordes gruesos de color en un costado de una tarjeta:**
   - Prohibidos los `border-l-4` decorativos. Usar un encabezado de sección claro.
8. **Icono en cajita redondeada encima de cada título:**
   - Prohibido el cliché de Bento con icono dentro de círculo/cuadro arriba de cada título. Usar iconos inline (`16–22px`, trazo `2px`) o ningún icono.
9. **Inter como fuente de marca y labels en MAYÚSCULAS espaciadas:**
   - `Bricolage Grotesque` (`--font-display`) lleva la personalidad en títulos y cifras; `Inter` (`--font-sans`) es solo para texto de interfaz. Etiquetas en *sentence case* (`--text-label`), no `MAYÚSCULAS ESPACIADAS`.
10. **Tres tarjetas de métricas idénticas con flechas verdes:**
    - Prohibido el cliché de 3 KPI cards iguales. Mostrar **una cifra protagonista** (`money-xl` / `money-l`) y una oración útil en palabras claras.
11. **Copy genérico de startup, datos falsos o jerga retirada:**
    - Prohibido usar "John Doe", "AWS", "API First", "fondos asegurados", "tarjetas físicas y virtuales ilimitadas", "Seguridad Bancaria E2E", nombres reales de usuarios (defecto U4) o términos retirados (`"nodo"`, `"telemetría"`, `"capital líquido"`). Usar datos dominicanos realistas y voz directa.
12. **Atajos nativos, botones placeholder y animaciones teatrales:**
    - Prohibido `window.confirm()`, `window.alert()`, `window.prompt()` (usar `Sheet` / `ConfirmDialog`), botones placeholder tipo `PasskeyButton` en flujos principales, y animaciones 3D gratuitas (`rotateY`/`rotateX` en auth).
13. **Valores arbitrarios en JSX:**
    - Prohibido usar `text-[7px]–text-[10px]`, `rounded-[Npx]`, `z-[9999]` o colores HEX crudos fuera de `tokens.css` y de las propiedades configurables de la tarjeta del usuario (`YCard`).

---

## 2. Estándares Obligatorios de YBank 2.0

1. **Alcance estricto de UI:**
   - Nunca alterar lógica de negocio en `src/lib/actions/`, `src/hooks/`, `src/services/`, `src/shared/`, `src/store/` ni `src/proxy.ts`.
2. **Fuente única de verdad (`src/styles/tokens.css`):**
   - Base neutra plana: `--canvas` hueso (`#f4f3ef`) en claro / tinta (`#0e0e10`) en oscuro; `--surface` (`#ffffff` / `#17171a`) separada por `--line` (`1px`), sin sombras en paneles, filas ni botones (solo la tarjeta y los overlays flotan).
3. **Disciplina de color y dinero:**
   - `--action` ultramar (`#1f4bff` claro / `#7c9bff` oscuro con texto tinta): **una sola acción primaria por vista**.
   - `--lime` (`#c6f432`): **exclusivamente para logros** (`AchievementBadge`, meta cumplida, acabado desbloqueado). Nunca un botón, fondo ni enlace.
   - Ingresos en `--credit`. **Gastos normales en `--ink`** (nunca en rojo); `--debit` solo para errores, rechazos o sobregiros; `--pending` para vencimientos próximos o atención.
   - Formato de dinero: moneda primero (`DOP 48,250.00`), separadores `en-US`, signo explícito en movimientos (`+ DOP ...`, `− DOP ...` con signo menos real) y `font-variant-numeric: tabular-nums`.
4. **Arquitectura Atomic Design propia:**
   - Organizar componentes en `src/components/atoms/`, `molecules/`, `organisms/` y `templates/`, propios y composables sin lock-in de frameworks UI pesados.
5. **Accesibilidad real (WCAG AA) y movimiento:**
   - Todo `IconButton` requiere `aria-label`.
   - Controles interactivos con elementos nativos y roles ARIA correctos (`button`, `dialog`, `listbox`, `option`). Prohibido `<div onClick>` sin teclado.
   - `SearchSelect` con navegación completa por teclado (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`) y roles ARIA — corrige U3.
   - `Sheet` con cierre por `Escape`, manejo de foco / focus-trap y retorno de foco.
   - Respetar `prefers-reduced-motion`, mantener scrollbars visibles y viewport móvil con zoom habilitado.
6. **Correcciones UI verificadas obligatorias:**
   - **U1:** Cuenta `savings` debe etiquetarse correctamente (no mostrar `DEBIT`).
   - **U2:** Corregir errata `"2 ÍT_EMS"` → `"2 ítems"`.
   - **U3:** `SearchSelect` accesible por teclado y lector de pantalla.
   - **U4:** Landing sin PII ni claims falsos de entidad bancaria; narrativa honesta del producto real.
   - **Tablet (`768px–1023px`, breakpoint `md`):** Garantizar navegación accesible en todo el ancho de pantalla (sin hueco entre `md` y `lg`).
