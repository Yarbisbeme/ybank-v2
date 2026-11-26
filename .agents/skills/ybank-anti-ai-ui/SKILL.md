---
name: ybank-anti-ai-ui
description: Guía completa del sistema de diseño YBank 2.0 ("Control con juego"), tokens (src/styles/tokens.css), arquitectura Atomic Design, modelo de tarjeta de 5 capas, identidad YMark/LeafWave y checklist anti-AI-UI para diseñar, refactorizar y verificar la interfaz de YBank v2.
---

# YBank 2.0 — Sistema de Diseño "Control con juego"

Guía operativa para portar y construir toda la interfaz de **YBank v2** bajo los principios de **YBank 2.0**: finanzas personales en DOP y USD para República Dominicana, con un dashboard neutro, plano y rápido donde **la tarjeta del usuario es la protagonista**.

---

## 1. Los 5 Principios

1. **Tu tarjeta es la estrella.** El color fuerte vive en las tarjetas del usuario (`card-*`). El resto de la UI es tinta y hueso, y la tarjeta activa tiñe suavemente su sección al 12% (`wash`).
2. **Control visible.** Cada pantalla responde una pregunta con una cifra protagonista (`money-xl`, `money-l`) y una oración directa: *"Te quedan DOP 1,850 para el finde."*
3. **Juego con propósito.** El rebote, `--lime` y los acabados desbloqueables premian acciones útiles (registrar, conciliar, cumplir meta). Nunca decoran sin sentido.
4. **Un solo carácter de forma.** Esquinas pequeñas y precisas (`radius-chip` 4px, `radius-control` 6px, `radius-tile` 8px, `radius-panel` 10px). La única forma especial es la tarjeta ISO (`radius-card` 14px, ratio `1.586:1`) y el sheet móvil (`radius-sheet` 16px).
5. **Habla como el usuario.** Español dominicano claro y cercano en *sentence case*. Palabras retiradas: `"nodo"`, `"telemetría"`, `"capital líquido"`.

---

## 2. Sistema de Tokens (`src/styles/tokens.css`)

Todos los tokens viven en `src/styles/tokens.css` y se mapean a Tailwind v4 en `src/app/globals.css` vía `@theme inline`. Soportan tanto `[data-theme="dark"]` como `.dark`.

### Colores Base y Semánticos
| Token | Light | Dark | Uso |
| :--- | :--- | :--- | :--- |
| `--canvas` | `#f4f3ef` | `#0e0e10` | Fondo general de pantalla |
| `--surface` | `#ffffff` | `#17171a` | Paneles, listas, inputs, barra |
| `--surface-raised` | `#ffffff` | `#202024` | Menús, bottom sheets y modales |
| `--surface-sunk` | `#eae8e2` | `#0a0a0c` | Pistas de `Segmented`, cajas de icono en filas, zonas hundidas |
| `--ink` / `--ink-2` / `--ink-3` | `#0e0e10` / `#5c5b57` / `#8c8b86` | `#f4f3ef` / `#a3a29c` / `#6e6d68` | Texto principal, secundario y placeholders (nunca usar `--ink-3` para texto legible) |
| `--line` / `--line-strong` | `rgba(14,14,16,0.10)` / `0.18` | `rgba(244,243,239,0.10)` / `0.20` | Filetes `1px` y bordes de inputs/botones |
| `--action` / `--action-press` / `--action-ink` / `--action-wash` | `#1f4bff` / `#1638cc` / `#ffffff` / `#e6ebff` | `#7c9bff` / `#a3b8ff` / `#0e0e10` / `#1a2140` | Una sola acción primaria por vista, enlaces y selección |
| `--lime` / `--lime-ink` | `#c6f432` / `#0e0e10` | `#c6f432` / `#0e0e10` | **Solo logros** (`AchievementBadge`, meta cumplida, flash de `YMark`). Nunca botón ni fondo |
| `--credit` / `--debit` / `--pending` | `#067647` / `#b42318` / `#b54708` | `#47cd89` / `#f97066` / `#fdb022` | Ingresos (`credit`), errores/rechazos/sobregiros (`debit`), atención/vencimientos (`pending`). **Gastos normales van en `--ink`** |

### Paleta de Tarjeta (`card-*`)
12 colores (`ultramar`, `tinta`, `coral`, `lima`, `menta`, `marino`, `vino`, `rosa`, `hueso`, `turquesa`, `uva`, `oro`). El texto sobre la tarjeta alterna automáticamente entre blanco y `--ink` según luminancia (`> 150 → ink`).

### Tipografía (`next/font/google` offline-ready)
- `--font-display`: **Bricolage Grotesque** (pesos `400`, `600`, `800`) — títulos y cifras (`money-xl` 64px, `display` 48px, `money-l` 40px, `money-card` 30px, `title-l` 28px, `title` 20px, `title-s` 16px).
- `--font-sans`: **Inter** (pesos `400`, `500`, `600`) — interfaz, tablas, etiquetas (`11px` nav, `12px` label, `13px` small, `15px` body/amount).
- `--font-mono`: **JetBrains Mono** (peso `500`) — números de tarjeta (`card-number`) e IDs.
- Todo monto usa `font-variant-numeric: tabular-nums` y formato `DOP 48,250.00` (signo `−` real en negativos).

### Radios, Espaciado, Capas y Movimiento
- **Espaciado:** base `4px` (`--space-1: 4px` hasta `--space-16: 64px`).
- **Radios:** `chip` 4px, `control` 6px, `tile` 8px, `panel` 10px, `card` 14px, `sheet` 16px.
- **Z-index:** `--z-base: 0`, `--z-sticky: 20`, `--z-dropdown: 40`, `--z-drawer: 60`, `--z-modal: 80`, `--z-toast: 100`.
- **Movimiento:** `150ms` hover/focus, `250ms` entradas, curva única `cubic-bezier(.2,.8,.2,1)`. Respetar `prefers-reduced-motion`.

---

## 3. Identidad Visual (`YMark`, `LeafWave`, `YCard`)

- **`YMark`:** la **Y** de dos hojas crecientes (SVGs oficiales en `public/logos/ybank-y-*.svg`). Un solo color por fondo (nunca gradientes ni sombras). Lockup `Y` + `"Bank"` en `display` 800 pegados ópticamente (`margin-left: -0.08em`). Soporta animaciones `none`, `brote`, `logro` (destello `--lime` en la hoja pequeña) y `loop`.
- **`LeafWave`:** ola con la cresta de la hoja de la Y para comunicar "se llenó" (metas, sincronización, transición en `Segmented` y `Skeleton` de espera larga).
- **`YCard` (5 capas independientes):**
  1. **Base:** `plana` · `degradado` (dos colores) · `materia` (gradiente mismo color a 155°, highlight superior inset y `--shadow-card`).
  2. **Color:** paleta `card-*` o picker.
  3. **Forma:** `none` · `hojas` (marca) · `geo` · `dots` · `curve` · `waves` · `lines` · `malla`, en intensidades sutil (`0`), media (`1`) o fuerte (`2`).
  4. **Acabado:** `mate` · `metal` · `holo`.
  5. **Detalles:** nombre, banco (texto/logo, nunca copiar trade dress bancario), red (`VISA`, `Mastercard`, `""`), últimos 4 dígitos.

---

## 4. Arquitectura Atomic Design (`src/components/`)

Construidos a medida con TypeScript estricto y `lucide-react` (`strokeWidth={2}`, `16–22px`, inline sin cajas decorativas):

- **`atoms/`:** `YMark`, `Button`, `IconButton`, `Switch`, `Money`, `CategoryChip`, `AchievementBadge`, `Skeleton`, `LeafWave`, `Toast`
- **`molecules/`:** `Field`, `AmountInput`, `Segmented`, `SearchSelect` *(listbox/option + teclado)*, `DatePicker`, `TagInput`, `SplitRow`, `EmptyState`, `BudgetBar`
- **`organisms/`:**
  - Navegación/Overlays: `Sidebar` (240px desktop), `BottomNav` (móvil + botón central `+`), `MobileNavDrawer` (tablet `<lg`), `CommandPalette` (`⌘K`), `Sheet` (única superficie overlay, `Escape` + focus-trap)
  - Dominio: `YCard`, `CardStack`, `MoveRow`, `TransactionTable`, `FilterBar`, `HealthMeter`
  - Vistas/Formularios integrados a los hooks/actions existentes: módulos de `dashboard/`, `accounts/`, `transactions/`, `settings/`, `auth/`, `landing/`
- **`templates/`:** `DashboardShell`, `AuthShell`, `LandingTemplate`

> **Regla de integración:** En la navegación productiva conectar solo las rutas existentes reales (`/dashboard`, `/accounts`, `/transactions`, `/settings`) y mantener intactos `src/lib/actions/`, `src/hooks/`, `src/services/`, `src/shared/`, `src/store/` y `src/proxy.ts`.

---

## 5. Checklist de Verificación Pre-PR (UI/UX)

- [ ] **Tokens y fuentes:** `tokens.css` y `globals.css` cargan `Bricolage Grotesque`, `Inter` y `JetBrains Mono` vía `next/font/google`.
- [ ] **Anti-AI-UI:** Sin pills en botones/badges, sin glows/gradientes neón/glassmorphism, sin spinners de carga, sin card-dentro-de-card, sin labels en MAYÚSCULAS espaciadas, sin palabras retiradas (`nodo`, `telemetría`), sin datos/claims falsos.
- [ ] **Temas:** Contraste y filetes `1px` verificados en **Light** (`#f4f3ef`) y **Dark** (`#0e0e10`).
- [ ] **Responsive:** Móvil (`390px` con `BottomNav`), Tablet (`768px–1023px` sin hueco de navegación) y Desktop (`1280px+` con `Sidebar` 240px).
- [ ] **Accesibilidad:** `aria-label` en todo `IconButton`, `SearchSelect` con teclado + `listbox`/`option` (U3), `Sheet` con `Escape` + foco, `prefers-reduced-motion`, zoom móvil habilitado.
- [ ] **Defectos UI cerrados:** U1 (`savings` correcto), U2 (`ítems` sin errata), U3 (`SearchSelect`), U4 (Landing honesta sin PII).
- [ ] **Checks en verde:** `npm run typecheck`, `npm test`, `npm run lint` (sin nuevos errores/warnings) y `npm run build`.
