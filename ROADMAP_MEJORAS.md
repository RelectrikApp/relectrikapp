# Roadmap de mejoras – Relectrikapp

Documento maestro que organiza las mejoras recomendadas por prioridad. Incluye acciones obligatorias, nueva funcionalidad (Vista Calendario) y mejoras opcionales.

---

## 🔴 PRIORIDAD ALTA

### 1️⃣ Optimizar endpoint de métricas del dashboard

**Objetivo:** Reducir tiempo de respuesta del dashboard.

**Acción obligatoria:**

- Reestructurar **`/api/dashboard/metrics`**.
- Todas las consultas a base de datos deben ejecutarse **en paralelo**.
- No debe haber consultas Prisma ejecutándose en secuencia si son independientes.

**Archivos afectados:** `src/app/api/dashboard/metrics/route.ts`

---

### 2️⃣ Eliminar fetch interno en AI

**Objetivo:** Reducir latencia y evitar duplicación de lógica.

**Acción obligatoria:**

- En **`/api/ai/query`**, eliminar cualquier `fetch` hacia `/api/dashboard/metrics`.
- Extraer la lógica de métricas a un **servicio reutilizable en el servidor** (ej. `src/lib/services/dashboardMetrics.ts` o similar).
- AI debe consumir **directamente la lógica interna**, no hacer request HTTP.

**Archivos afectados:**  
`src/app/api/ai/query/route.ts`, nuevo módulo de servicio de métricas.

---

### 3️⃣ Agregar índices en base de datos

**Objetivo:** Mejorar rendimiento cuando crezca el volumen de datos.

**Acción obligatoria:**

Agregar índices en el schema de Prisma para:

| Modelo        | Campos / propósito                                      |
|---------------|---------------------------------------------------------|
| **WorkSession** | `isActive`, compuesto `(technicianId, isActive)`        |
| **Project**     | `status`, `completedDate`                              |
| **Invoice**     | `invoiceDate`, `paymentStatus`                          |

Después de editar `prisma/schema.prisma`, ejecutar migración:

```bash
npx prisma migrate dev --name add_performance_indexes
```

**Archivos afectados:** `prisma/schema.prisma`

---

### 4️⃣ Corregir parpadeo del mapa (MUY IMPORTANTE)

**Problema actual:**  
El mapa se re-renderiza cada 10 segundos por el polling; se desmonta/recrea y parpadea.

**Objetivo:** Eliminar parpadeo visual y re-render innecesario del mapa.

**Acción obligatoria:**

- El **mapa debe montarse UNA sola vez**.
- El **polling NO debe desmontar el mapa**.
- Solo deben **actualizarse los marcadores** (posiciones).
- No debe recrearse el componente Google Map en cada actualización.
- El estado del mapa (instancia de `google.maps.Map`) debe mantenerse estable entre actualizaciones de datos.

**Enfoque técnico sugerido:**

- Mantener la instancia del mapa en un `useRef` y crearla solo en el primer `useEffect` (cuando el script de Google Maps esté listo).
- El intervalo de polling debe actualizar únicamente el estado de `locations` (o equivalente).
- Un segundo `useEffect` que dependa de `locations` debe actualizar/crear/eliminar **solo los marcadores**, sin tocar el contenedor ni la instancia del mapa.

**Archivos afectados:** `src/app/dashboard/map/page.tsx`

---

## 🟡 PRIORIDAD MEDIA

### 5️⃣ Dashboard: cargar datos en paralelo

**Objetivo:** Reducir tiempo de carga inicial del dashboard.

**Acción requerida:**

- Actualmente **métricas** y **work-sessions** se cargan en secuencia en el cliente.
- Opción A: Cargar **ambos endpoints en paralelo** desde el cliente (dos `fetch` en paralelo, p. ej. con `Promise.all`).
- Opción B: Crear un **endpoint agregado** que devuelva métricas + work-sessions en una sola respuesta y llamar solo a ese endpoint.

**Archivos afectados:**  
`src/app/dashboard/page.tsx`, y opcionalmente nuevo `src/app/api/dashboard/...` si se elige endpoint agregado.

---

## 🟢 NUEVA FUNCIONALIDAD

### 6️⃣ Technician Connection Times – Vista Calendario

**Requerimiento funcional:**

Cuando el usuario haga clic en **“Technician Connection Times”** (o en un enlace dedicado desde esa sección), debe abrirse una **vista mensual** con:

**Vista requerida:**

- **Selector de mes** (formato YYYY-MM).
- **Lista de todos los técnicos**.
- Para cada técnico:
  - **Total de horas trabajadas en el mes**.
  - **Desglose día por día** (horas por fecha).
- Visualización clara: **tipo calendario** o **tabla mensual** (días del mes en columnas/filas, técnicos en filas/columnas según diseño).

**Backend requerido:**

- Crear endpoint:
  - **`GET /api/dashboard/technician-connection-times?month=YYYY-MM`**
- Respuesta debe incluir:
  - Lista de técnicos (id, nombre, email u otros campos necesarios).
  - Total de horas trabajadas en el mes por técnico.
  - Horas trabajadas **por día** dentro del mes seleccionado (por técnico).
- Cálculo basado en **WorkSession** (`startTime`, `endTime` o duración derivada).
- No requiere polling: son **datos históricos**; se cargan al elegir mes o al entrar a la vista.

**Archivos a crear/modificar:**

- Nuevo: `src/app/api/dashboard/technician-connection-times/route.ts`
- Nuevo: página/vista en dashboard, ej. `src/app/dashboard/technician-connection-times/page.tsx` (o modal/drawer si se prefiere).
- Modificar: en la sección “Technician connection times” del dashboard, añadir enlace o botón que abra esta vista (ej. “Ver calendario mensual” o “Vista calendario”).

**Consideraciones:**

- Tratar sesiones que cruzan medianoche o que están solo parcialmente en el mes (solo contar la porción dentro del mes).
- Definir zona horaria (ej. servidor UTC o timezone del negocio) para cortes de día.

---

## 🟡 MEJORA OPCIONAL

### 7️⃣ Evaluar uso de sistema de caché para polling

**Objetivo:** Evitar múltiples requests innecesarios, manejar mejor el polling y reducir carga en backend.

**Acción:**

- Evaluar implementación de **SWR** o **React Query** (TanStack Query) en:
  - Dashboard (métricas y work-sessions).
  - Tech home (sesión actual y proyectos asignados).
  - Mapa (live locations).
- Beneficios esperados:
  - Deduplicación de requests.
  - Cache y revalidación configurable.
  - Menos re-renders y mejor UX si se combina con la corrección del parpadeo del mapa.

**No es obligatorio** para el roadmap actual; se puede abordar después de cerrar los ítems de prioridad alta y la nueva funcionalidad.

---

## Resumen de prioridades

| # | Ítem                               | Prioridad | Tipo        |
|---|------------------------------------|-----------|-------------|
| 1 | Métricas en paralelo               | 🔴 Alta   | Optimización |
| 2 | AI sin fetch interno               | 🔴 Alta   | Optimización |
| 3 | Índices en BD                      | 🔴 Alta   | Optimización |
| 4 | Parpadeo del mapa                  | 🔴 Alta   | Corrección   |
| 5 | Dashboard datos en paralelo        | 🟡 Media  | Optimización |
| 6 | Vista Calendario Connection Times  | 🟢 Nueva  | Funcionalidad |
| 7 | SWR / React Query (polling)       | 🟡 Opcional | Mejora     |

---

## Orden sugerido de implementación

1. **Fase 1 – Backend y datos**  
   - 1️⃣ Métricas en paralelo.  
   - 2️⃣ Servicio de métricas + AI sin fetch.  
   - 3️⃣ Índices en BD y migración.

2. **Fase 2 – UX crítica**  
   - 4️⃣ Corregir parpadeo del mapa.  
   - 5️⃣ Carga en paralelo en el dashboard (cliente o endpoint agregado).

3. **Fase 3 – Nueva funcionalidad**  
   - 6️⃣ Endpoint technician-connection-times + Vista Calendario en el dashboard.

4. **Fase 4 – Opcional**  
   - 7️⃣ Evaluar e introducir SWR o React Query donde aplique.

---

*Documento generado como roadmap único. Actualizar este archivo al completar cada ítem.*
