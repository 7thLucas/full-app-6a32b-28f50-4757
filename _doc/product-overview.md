# TMS Logística Química — Product Overview

## Product Identity
- **Working name**: TMS Logística Química *(name subject to user confirmation)*
- **Type**: Web + mobile-responsive Transportation Management System (TMS)
- **Industry**: Chemical products transport & logistics, Argentina
- **Fleet size**: ~35 trucks of various types/configurations

## Positioning
A purpose-built TMS for Argentine chemical carriers managing three distinct operation lines — Distribución, Puerto, and Viajes de Material Técnico — with independent KPIs and dashboards per line, automated pre-invoicing, HAZMAT compliance fields, real-time tracking, and Tango Software data export. Replaces fragmented spreadsheets and manual billing with a single, role-aware platform designed for the regulatory and operational demands of chemical logistics.

## Target Users (Personas)

| Role | Access | Primary responsibilities |
|------|--------|--------------------------|
| **Admin** | Full — web | Configure fare tables, review KPI dashboards, generate Tango exports, manage users and system settings |
| **Operador** | Full — web | Create and manage orders, assign vehicles & drivers, monitor trip status across all operation types |
| **Conductor** | Mobile-optimized | Receive route sheets, confirm delivery stops, update real-time trip status |

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

### 2. Basic Route Optimization
- Google Maps API integration for basic routing assistance
- Route sheet creation, entry, and assignment per trip

### 3. Real-Time Tracking
- Live vehicle position per active trip

### 4. Automatic Pre-Invoicing (Prefacturación)
- Triggered automatically on trip completion
- Cost components: flete, peajes, combustible, adicionales (configurable)
- Rate logic: configurable by client, by km, by operation type, or by container type
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
- Roles: Admin, Operador, Conductor — role-based access control
- Mobile-optimized interface for Conductores
- Secure access for hazardous materials environment

### 8. Data & Sync
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
