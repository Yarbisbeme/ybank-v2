# TransactionFilterBar 🎛️

## 📖 Descripción General
El componente `TransactionFilterBar` es el centro de mandos para la manipulación y visualización de la telemetría financiera en el Dashboard. Es una barra flotante, altamente responsiva y animada que permite a los usuarios filtrar registros operativos en tiempo real y ejecutar acciones en lote (batch selection).

## ✨ Funcionalidades Principales (Features)

### 1. Filtrado Dimensional
* **Por Tipo de Operación:** Pestañas deslizables de selección rápida (`Global`, `Ingresos`, `Gastos`, `Traspasos`).
* **Por Clasificación (Categoría):** Menú desplegable inteligente que filtra las categorías disponibles según el *Tipo de Operación* activo (ej. si está en "Ingresos", solo muestra categorías de ingresos). Se oculta dinámicamente si el tipo es "Traspaso".
* **Por Rango de Fechas:** Integración con `YBankCalendarPicker` para seleccionar fechas precisas de inicio y cierre de los estados financieros.

### 2. Modos de Interfaz (UI Modes)
El componente muta dinámicamente según la intención del usuario para reducir la fatiga cognitiva, manteniendo un máximo de 2 botones visibles a la vez en la barra de acciones:
* **Modo Exploración (Default):** Muestra el botón `[Seleccionar]`. Si hay filtros activos, revela un botón sutil de `[Reset]`.
* **Modo Selección Masiva:** Oculta los filtros secundarios, transforma el botón principal en `[Todo / Deseleccionar]` y cambia el botón secundario a un estricto `[Cerrar]`.

### 3. Inteligencia de Contexto (Global vs. Nodo)
* El componente lee la URL (`?accountId=`) y el Store (`preferredAccountId`) para saber en qué contexto se encuentra.
* **Modo Nodo:** Si hay una cuenta activa, el botón "Seleccionar Todo" limitará la consulta de la base de datos estricta y únicamente a los registros de esa cuenta.
* **Modo Global:** Si la URL está limpia o dice `global`, el componente instruye al backend a traer el historial completo de todas las cuentas del usuario.

### 4. Resiliencia y UX
* **Prevención de Overflow:** Implementa `flex-wrap` y `overflow-x-hidden` para evitar el desplazamiento horizontal fantasma en pantallas pequeñas.
* **Feedback Visual:** Animaciones de entrada/salida impulsadas por `framer-motion` (`AnimatePresence`, `motion.div`) para expansiones de menús y transiciones de botones.
* **Manejo Offline:** Integración con estados de carga (`isFetchingAll`) y notificaciones (`sonner`) para prevenir interacciones duplicadas si la red falla.

## 🧠 Dependencias de Estado (Zustand Stores)
Este componente es el principal consumidor y despachador de los siguientes stores:
1.  **`useFilterStore`:** Modifica el estado global de los parámetros de búsqueda (`type`, `categoryId`, `startDate`, `endDate`).
2.  **`useSelectionStore`:** Gobierna la activación del modo de casillas de verificación y almacena el mapa de IDs seleccionados (`selectedTx`).
3.  **`useYBankStore`:** Provee el `preferredAccountId` para mantener sincronizada la fuente de la verdad con la tabla de transacciones subyacente.

## 💻 Ejemplo de Ubicación en el Layout
El componente está diseñado para vivir sobre la tabla de resultados, con un `z-index` elevado para sobreponer sus menús desplegables:

```tsx
<div className="flex flex-col gap-4">
  <TransactionFilterBar />
  <ClientTransactionTable />
</div>
```