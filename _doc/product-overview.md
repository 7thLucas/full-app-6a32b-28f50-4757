# EterFleet TMS — Product Overview

## Product Identity
- **Name**: EterFleet TMS
- **Type**: Web + mobile-responsive Transportation Management System (TMS)
- **Industry**: Chemical products transport & logistics, Argentina
- **Fleet size**: ~35 trucks of various types/configurations

## Positioning
EterFleet TMS is a purpose-built TMS for Argentine chemical carriers managing three distinct operation lines — Distribución, Puerto, and Viajes de Material Técnico — with independent KPIs and dashboards per line, automated pre-invoicing, HAZMAT compliance fields, real-time tracking, and Tango Software data export. Replaces fragmented spreadsheets and manual billing with a single, role-aware platform designed for the regulatory and operational demands of chemical logistics.

## Target Users (Personas)

Five distinct user areas confirmed by the customer:

| Área / Rol | Acceso | Responsabilidades principales |
|-----------|--------|-------------------------------|
| **Gerencia** | Web — completo | Dashboards de KPIs por tipo de operación, costos, rentabilidad, ocupación de flota, rendimiento por chofer/camión |
| **Facturación / Prefacturación** | Web — completo | Generar prefacturas automáticas al cierre de viaje, revisar cálculos (flete, km, adicionales), exportar a Tango con mínima corrección manual |
| **Operaciones** | Web — completo | Asignar cargas y envíos a choferes y camiones, planificar viajes (hoja de ruta distribución, operaciones en puerto, material técnico), ver disponibilidad de flota |
| **Administración** | Web — completo | Gestión de datos maestros: choferes, camiones, tarifas, clientes, parámetros del sistema |
| **Chofer** | Mobile — Android / iOS | Ver órdenes de servicio asignadas, completar checklists de viaje (antes / durante / después del viaje), reportar novedades, solicitar órdenes de mantenimiento del camión |

*System RBAC maps these areas to three permission tiers: Admin (Gerencia + Administración), Operador (Operaciones + Facturación), Conductor (mobile only).*

## Operation Types *(always tracked and reported separately — never mixed)*

### 1. Distribución
- Client delivers a pre-built route sheet (hoja de ruta) to the company
- Trucks dispatch to multiple delivery points in a single run
- Records per trip: route sheet ID, clients visited, deliveries completed, km traveled, elapsed time

### 2. Puerto
Three independent sub-categories — each with its own KPIs, reports, and pre-invoicing logic:
- **Carga suelta consolidada en pallets**
- **Contenedores** — 20-foot and 40-foot tracked separately
- **Isotanques**

### 3. Viajes de Material Técnico
- Special transport of technical equipment and materials
- Subject to the same automatic pre-invoicing flow as other operations
- Maintained as a fully standalone category in all reports and KPIs

## Core Feature Set

### 1. Shipment & Load Management
- Order creation: client, origin, destination (including port terminals), assigned vehicle, assigned driver, planned date, actual date, status
- Status workflow: **Pendiente → En Tránsito → Entregado**
- Cargo type: Químicos with hazard classification fields (peligrosidad, UN number, handling notes) where applicable
- Fleet registry: 35 vehicles with type variants tracked per vehicle

### 2. Route Optimization (Distribución)
- Route sheet creation, entry, and assignment per trip
- **Optimización de rutas** for Distribución route sheets via Google Maps Directions API (waypoint optimization): reorders the stops (paradas) of a hoja de ruta for the shortest run, starting/ending from a settable **depósito de origen** (origin depot, persisted, editable)
- Results panel (Spanish, accessible from each Distribución hoja de ruta via an "Optimizar ruta" action): shows original order vs. optimized order side-by-side with move indicators, total km and estimated driving time, and the estimated km/time saved
- Operator can **apply** the optimized order to the route sheet (persisted) with one click, or keep the manual order
- Requires a Google Maps API key (`GOOGLE_MAPS_API_KEY`); when the key is absent the feature degrades gracefully with a clear Spanish prompt instead of failing. All Google calls are server-side

### 3. Real-Time Tracking
- Live vehicle position per active trip
- **Live fleet map**: interactive map view showing every active truck as a marker at its last reported location, auto-refreshing every ~30s. Each marker popup shows patente, chofer asignado, tipo de operación, estado del viaje (Pendiente / En Tránsito / Entregado / Cancelado) y última ubicación reportada
- **Map filters**: dropdown filters narrow the visible markers in real time — by **tipo de operación** (Distribución / Puerto, with Pallets, Contenedor 20', Contenedor 40' e Isotanque expuestos por separado / Material Técnico) and by **estado del viaje** (Pendiente / En Tránsito / Entregado / Cancelado), each with an "Todos" option. Filtering re-renders markers instantly without waiting for the auto-refresh, and the active-truck count reflects the filtered set
- **Manual entry modal**: a "Cargar manualmente" button opens a pop-up dialog to create or complete a trip/fleet entry by hand when automatic data isn't available (patente/camión, chofer, tipo de operación con sub-categoría de Puerto, estado, origen/destino, ubicación y notas); on save the new marker appears on the map
- Map accessible to Operaciones and Gerencia (RBAC-gated); Google Maps when an API key is configured, OpenStreetMap fallback otherwise

### 4. Automatic Pre-Invoicing (Prefacturación)
- Triggered automatically on trip completion
- Cost components: flete, peajes, combustible, adicionales (configurable)
- Rate logic: configurable by client, by km, by operation type, or by container type
- **Configurable container additional charges (adicionales de contenedor)** — post-trip charges billed after the container is returned, scoped specifically to **Puerto → Contenedores**:
  - Admin/Administración manages a catalog of adicionales (nombre, tarifa, modo de cobro), seeded with editable defaults: **Lavado** (washing after return), **Devolución** (return charge), and **Por día de devolución** (per-day return charge)
  - Two billing modes: **monto fijo** (flat) and **por día** (per-day, amount × días de devolución, derived from devolución dates when available)
  - In a Contenedores prefactura the operator picks the applicable adicionales; they are computed server-side, summed automatically into the total facturable, and carried into the Tango export. Adicionales surface only for Contenedor prefacturas and are locked once a prefactura is exported
- Output: detailed pre-invoice with line items, subtotals, and IVA
- **Explicitly excludes AFIP electronic invoicing** — pre-invoicing only, no AFIP integration

### 5. Tango Software Export
- Format: Excel / CSV
- Required fields: cliente, comprobante, importe neto, IVA, total, descripción de servicios, tipo de operación
- Delivery options: download button or send by email

### 6. KPI Dashboard (separate per operation type)
- **Distribución**: shipments/day, shipments/week, avg km, avg delivery time, fleet occupancy %
- **Puerto — per sub-category independently** (pallets / contenedores 20' / contenedores 40' / isotanques):
  trips/day, trips/week, container-type breakdown, avg cost, fleet occupancy %
- **Material Técnico**: trips/week, projected revenue
- **Cross-type view**: fleet utilization %, projected revenue, avg cost per operation type

### 7. User Management & Roles
- Five user areas mapped to three RBAC tiers: Admin (Gerencia + Administración), Operador (Operaciones + Facturación), Conductor (mobile only)
- Mobile-first interface for Conductores (Android / iOS): view assigned orders, complete trip checklists (pre-trip / en-route / post-trip), report operational incidents, submit truck maintenance requests
- Secure access for hazardous materials environment

### 8. Excel Import (Inbound from Clients)
- Importar hojas de ruta de distribución desde Excel enviadas por el cliente
- Importar cargas de puerto (pallets, contenedores, isotanques) desde Excel
- Structured field mapping to internal order model on import

### 9. Data & Sync
- Primary database (application-owned)
- Optional Google Sheets synchronization

## Technical & Strategic Principles
- Web-first, fully mobile-responsive
- HAZMAT compliance: data model includes hazard classification fields on every shipment
- Scalable for fleet growth and additional clients
- Simplified, operator-friendly UI — not ERP complexity
- No AFIP integration — pre-invoicing only (explicit product boundary)

## Brand Tone
Professional, precise, industrial. Calm authority — reliability-first for a regulated, safety-critical sector. No unnecessary complexity in language or interface.

## Scope Boundaries
- ✅ Pre-invoicing with full cost breakdown (flete, peajes, combustible, adicionales, IVA)
- ✅ Tango Software export (Excel/CSV) with all required fields
- ✅ Separate KPIs per operation type including all Puerto sub-categories
- ✅ Mobile access for drivers
- ✅ HAZMAT / chemical compliance fields
- ✅ Google Sheets sync option
- ❌ AFIP electronic invoicing (explicitly out of scope)
- ❌ Full accounting / ERP functionality
