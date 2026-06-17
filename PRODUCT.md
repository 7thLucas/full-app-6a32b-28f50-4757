# EterFleet TMS — Product Overview

## Product Identity
- **Name**: EterFleet TMS
- **Type**: Web + mobile-responsive Transportation Management System (TMS)
- **Industry**: Chemical products transport & logistics, Argentina
- **Fleet size**: ~35 trucks of various types/configurations

## Positioning
EterFleet TMS is a purpose-built TMS for Argentine chemical carriers managing three distinct operation lines — Distribución, Puerto, and Viajes de Material Técnico — with independent KPIs and dashboards per line, automated pre-invoicing, HAZMAT compliance fields, real-time tracking, and Tango Software data export. Replaces fragmented spreadsheets and manual billing with a single, role-aware platform designed for the regulatory and operational demands of chemical logistics.

## Target Users (Personas)

Five distinct user areas:

| Área / Rol | Acceso | Responsabilidades principales |
|-----------|--------|-------------------------------|
| **Gerencia** | Web — completo | Dashboards de KPIs por tipo de operación, costos, rentabilidad, ocupación de flota, rendimiento por chofer/camión |
| **Facturación / Prefacturación** | Web — completo | Generar prefacturas automáticas al cierre de viaje, revisar cálculos (flete, km, adicionales), exportar a Tango con mínima corrección manual |
| **Operaciones** | Web — completo | Asignar cargas y envíos a choferes y camiones, planificar viajes (hoja de ruta distribución, operaciones en puerto, material técnico), ver disponibilidad de flota |
| **Administración** | Web — completo | Gestión de datos maestros: choferes, camiones, tarifas, clientes, parámetros del sistema |
| **Chofer** | Mobile — Android / iOS | Ver órdenes de servicio asignadas, completar checklists de viaje (antes / durante / después del viaje), reportar novedades, solicitar órdenes de mantenimiento del camión |

RBAC: Admin (Gerencia + Administración), Operador (Operaciones + Facturación), Conductor (mobile only).

## Operation Types (always tracked and reported separately)

### 1. Distribucion
- Client delivers a pre-built route sheet (hoja de ruta)
- Trucks dispatch to multiple delivery points in a single run
- Records: route sheet ID, clients visited, deliveries completed, km traveled, elapsed time

### 2. Puerto
Three independent sub-categories — each with its own KPIs, reports, and pre-invoicing logic:
- Carga suelta consolidada en pallets
- Contenedores 20ft and 40ft (tracked separately)
- Isotanques

### 3. Viajes de Material Tecnico
- Special transport of technical equipment and materials
- Same automatic pre-invoicing flow as other operations
- Fully standalone category in all reports and KPIs

## Core Feature Set

### 1. Shipment & Load Management
- Order creation: client, origin, destination (including port terminals), assigned vehicle, assigned driver, planned date, actual date, status
- Status workflow: Pendiente -> En Transito -> Entregado
- Cargo type: Quimicos with hazard classification fields (peligrosidad, UN number, handling notes)
- Fleet registry: 35 vehicles with type variants tracked per vehicle

### 2. Basic Route Optimization
- Google Maps API integration for basic routing assistance
- Route sheet creation, entry, and assignment per trip

### 3. Real-Time Tracking
- Live vehicle position per active trip

### 4. Automatic Pre-Invoicing (Prefacturacion)
- Triggered automatically on trip completion
- Cost components: flete, peajes, combustible, adicionales (configurable)
- Rate logic: configurable by client, by km, by operation type, or by container type
- Output: detailed pre-invoice with line items, subtotals, and IVA
- EXPLICITLY EXCLUDES AFIP electronic invoicing — pre-invoicing only, no AFIP integration

### 5. Tango Software Export
- Format: Excel / CSV
- Required fields: cliente, comprobante, importe neto, IVA, total, descripcion de servicios, tipo de operacion
- Delivery: download button or send by email

### 6. KPI Dashboard (separate per operation type)
- Distribucion: shipments/day, shipments/week, avg km, avg delivery time, fleet occupancy %
- Puerto — per sub-category independently (pallets / contenedores 20ft / contenedores 40ft / isotanques): trips/day, trips/week, container-type breakdown, avg cost, fleet occupancy %
- Material Tecnico: trips/week, projected revenue
- Cross-type view: fleet utilization %, projected revenue, avg cost per operation type

### 7. User Management & Roles
- Mobile-first interface for Conductores: view assigned orders, complete trip checklists (pre-trip / en-route / post-trip), report operational incidents, submit truck maintenance requests

### 8. Excel Import (Inbound from Clients)
- Import hojas de ruta de distribucion from Excel
- Import cargas de puerto (pallets, contenedores, isotanques) from Excel
- Structured field mapping to internal order model

### 9. Data & Sync
- Optional Google Sheets synchronization

## Brand Tone
Professional, precise, industrial. Calm authority — reliability-first for a regulated, safety-critical sector. No unnecessary complexity in language or interface.

## Scope Boundaries
- YES: Pre-invoicing with full cost breakdown (flete, peajes, combustible, adicionales, IVA)
- YES: Tango Software export (Excel/CSV) with all required fields
- YES: Separate KPIs per operation type including all Puerto sub-categories
- YES: Mobile access for drivers
- YES: HAZMAT / chemical compliance fields
- YES: Google Sheets sync option
- NO: AFIP electronic invoicing (explicitly out of scope)
- NO: Full accounting / ERP functionality
