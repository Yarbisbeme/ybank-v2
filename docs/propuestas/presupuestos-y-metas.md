# Propuesta: Presupuestos globales y Metas de ahorro

> **Estado:** Propuesta futura (**no implementada**). Este documento registra decisiones de diseño y producto para una iteración posterior, una vez cerradas las bases atómicas de BD (doc 02) e ingesta (doc 06).

---

## 1. Contexto y problema detectado

Durante la auditoría visual de **«Tus tarjetas»** (`/dashboard`) se observó que el prototipo HTML mostraba una barra de progreso de gasto mensual debajo de cada tarjeta. Al llevarla a datos reales surgieron dos problemas claros:

1. **Datos inexistentes en BD:** Las cuentas de ahorro, corriente y efectivo no tienen un presupuesto asignado en el esquema actual, lo que forzaba una barra falsa al `100%` ante cualquier gasto.
2. **Semántica visual ambigua:** Una barra de 8 px debajo de un carrusel horizontal con el color de la tarjeta activa se percibe como un *scrollbar* del carrusel, no como un presupuesto.
3. **Modelo mental incorrecto:** Un presupuesto rara vez pertenece a una sola tarjeta. Una persona paga un viaje o los gastos del mes con varias cuentas (efectivo, débito y tarjeta de crédito) y en dos monedas (`DOP` y `USD`).

**Decisión aplicada hoy:** En «Tus tarjetas» solo se muestra barra de progreso semántica (`credit` / `pending` / `debit`) para **tarjetas de crédito con `credit_limit > 0`**. El resto de cuentas muestran un resumen numérico honesto del mes (`− DOP X · N movimientos` o `Sin gastos este mes`).

---

## 2. Propuesta de Feature Global: Presupuestos y Metas

En lugar de atar presupuestos a cada tarjeta, se propone introducir el módulo **`budgets`** (y **metas**) de forma transversal a todas las cuentas del usuario, con tres modalidades claras:

### 2.1 Presupuesto mensual (recurrente)
* **Alcance:** Global del mes o filtrado por una o varias **categorías** (ej. *Comida*, *Transporte*, *Entretenimiento*).
* **Moneda:** `DOP` o `USD` (con conversión coherente desde las transacciones del usuario en Postgres).
* **Uso:** Responder en segundos *"¿Cuánto me queda de Comida este mes?"* sin importar si pagué con tarjeta de crédito, débito o efectivo.

### 2.2 Presupuesto de proyecto o viaje (por etiquetas y/o fechas)
* **Alcance:** Basado en **`tags`** existentes (ej. `#viaje-samaná`, `#mudanza`, `#navidad`) con o sin ventana de fechas (`start_date` – `end_date`).
* **Ventaja:** Reutiliza la infraestructura de etiquetas que ya tiene YBank (`tags` + `transaction_tags`) para agrupar compras de vuelos, hotel, comida y gasolina aunque salgan de cuentas distintas y en fechas distintas.

### 2.3 Metas de ahorro (*Goals*)
* **Alcance:** Objetivo de monto (`target_amount`), fecha límite opcional y progreso calculado.
* **Dos modos posibles:**
  * **Por cuenta dedicada:** vinculada al saldo actual de una cuenta específica (ej. *"Fondo de emergencia"* en una cuenta de ahorro).
  * **Por aportes:** suma de transferencias/movimientos etiquetados hacia la meta dentro de una cuenta compartida.

---

## 3. Lineamientos de arquitectura (`AGENTS.md` / Docs 00–05)

Para respetar las reglas del proyecto y preparar futuras apps móviles:

1. **Cálculo en Postgres (`numeric`), cero lógica financiera en React:**
   * Las sumas consumidas, progreso y porcentaje de cada presupuesto o meta se calculan mediante vistas o funciones RPC en Supabase (`numeric`), nunca sumando con `parseFloat` en el frontend.
2. **Esquema en `supabase/migrations/` con RLS estricto:**
   * Tablas nuevas (`budgets`, `goals` o unificadas según complejidad) protegidas con políticas RLS por `auth.uid() = user_id`.
   * Mantener un costo de infraestructura de **$0** (sin cron jobs pagos ni servicios externos; las evaluaciones ocurren al consultar o mediante triggers ligeros si hace falta).
3. **Organización por feature (`src/features/budgets/`):**
   * Funciones puras de formateo/estado sin imports de Next/React/Supabase.
   * Server Actions solo para mutaciones (`createBudget`, `updateBudget`, `deleteBudget`); lecturas vía TanStack Query con factory de claves.

---

## 4. Integración UI/UX con YBank 2.0 («Control con juego»)

El sistema visual de YBank 2.0 ya cuenta con los bloques ideales para presentar este módulo cuando se implemente:

* **Bloque dedicado en Inicio / sección propia:** Presentar los presupuestos activos (máximo 2–3 destacados en Home) usando el molécula existente [`BudgetBar`](file:///e:/Yarbis/Personal/NextJs/ybank-v2-ui/src/components/molecules/BudgetBar.tsx).
* **Metas con lenguaje de agua (`LeafWave`):** Para metas de ahorro o viajes, usar [`LeafWave`](file:///e:/Yarbis/Personal/NextJs/ybank-v2-ui/src/components/atoms/LeafWave.tsx) para transmitir el progreso de llenado (*"se llenó el vaso"*).
* **Juego con propósito (`lime` y `AchievementBadge`):** El color `--lime` y el rebote solo se activan cuando el usuario **cumple** un presupuesto al cierre del mes o alcanza el `100%` de una meta (desbloqueando, por ejemplo, un acabado especial para sus tarjetas).
* **Regla de color en gastos:** El gasto dentro de un presupuesto se muestra en `ink`; `pending` advierte al acercarse al límite (`>= 80%`) y `debit` solo cuando se excede (`> 100%`).
