# YBank Intelligence: Documentación de Arquitectura Offline-First

## 1. Visión General
Esta fase del proyecto marca la transición de YBank de una aplicación web tradicional a una **PWA (Progressive Web App) de alto rendimiento**. El objetivo principal es garantizar que la telemetría financiera del usuario esté disponible en cualquier momento y lugar, independientemente de la calidad de su conexión a internet.

## 2. ¿Qué estamos haciendo? (Fase 1: Motor de Persistencia)
Hemos rediseñado el motor de datos (`QueryClient`) para implementar una **Capa de Persistencia Asíncrona**. 

### Componentes Clave:
* **TanStack Query (v5):** Actúa como el gestor de estado del servidor.
* **IndexedDB:** Una base de datos NoSQL integrada en el navegador que permite almacenar grandes volúmenes de datos de forma estructurada.
* **idb-keyval:** Una interfaz ligera para interactuar con IndexedDB sin la complejidad de la API nativa.
* **AsyncStoragePersister:** Un puente que sincroniza automáticamente el estado de la memoria RAM con el disco duro del dispositivo.

## 3. ¿Por qué lo estamos haciendo?
En el desarrollo de aplicaciones financieras modernas, la percepción de velocidad y la confiabilidad son fundamentales. 

1.  **Resiliencia Offline:** Un usuario de YBank debe poder consultar su balance en el metro, en un avión o en zonas de baja cobertura. Sin persistencia, la app mostraría una pantalla de carga infinita o un error 404.
2.  **Carga Instantánea (Optimistic Loading):** Al abrir la app, los datos se recuperan de `IndexedDB` en milisegundos. El usuario ve información de inmediato mientras la app verifica en segundo plano si hay cambios en Supabase.
3.  **Reducción de Costos y Carga en el Servidor:** Al confiar en una caché local robusta, reducimos drásticamente la cantidad de peticiones innecesarias a la base de datos de Supabase.

## 4. Arquitectura de Flujo de Datos
El flujo de información ahora sigue un patrón circular diseñado para la velocidad:

1.  **Petición:** El componente solicita datos a través de un Custom Hook (ej. `useAccounts`).
2.  **Caché (RAM):** TanStack Query revisa si el dato está en memoria.
3.  **Persistencia (Disco):** Si no está en RAM (ej. se cerró el navegador), se busca en `IndexedDB`.
4.  **Sincronización (Red):** Si hay internet, se consulta a Supabase para actualizar la información "stale" (vieja) y se guarda la nueva versión en disco y RAM simultáneamente.

## 5. Ventajas Estratégicas

| Ventaja | Impacto para el Usuario | Impacto para el Desarrollador |
| :--- | :--- | :--- |
| **Latencia Cero** | La app se siente "nativa" y extremadamente fluida. | Menos lógica de "loading" compleja en los componentes. |
| **Soporte Offline** | Acceso total a históricos de transacciones sin internet. | Estructura preparada para sincronización futura (Background Sync). |
| **Persistencia de Sesión** | Los datos sobreviven a recargas o cierres de pestaña. | Estado global consistente en todo el ecosistema de la app. |
| **Escalabilidad** | Capacidad de manejar miles de registros localmente. | Uso eficiente de IndexedDB sobre el limitado localStorage. |

## 6. Glosario Técnico de la Implementación
* **`staleTime`:** El tiempo durante el cual los datos en caché se consideran frescos (evita peticiones duplicadas).
* **`gcTime` (Garbage Collection):** Cuánto tiempo permanecen los datos en disco antes de ser eliminados si no se usan.
* **`Hydration`:** El proceso de rellenar la memoria de la aplicación con los datos guardados en IndexedDB al iniciar.

---
**Estado del Proyecto:** Fase 1 Completada - Motor Offline Activo.
**Próximo Paso:** Fase 2 - Optimización de Hooks y Mutaciones Optimistas.