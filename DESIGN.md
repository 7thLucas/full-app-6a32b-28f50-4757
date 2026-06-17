# EterFleet TMS — Design Guidelines

## Brand Identity
- **App name**: EterFleet TMS
- **Industry**: Chemical logistics / heavy transport, Argentina
- **Tone**: Professional, precise, industrial. Calm authority. Reliability-first for a regulated, safety-critical sector.

## Color Palette

### Primary
- Deep Navy: #0D1B2A — primary backgrounds, sidebar, header bars
- Industrial Blue: #1B4F72 — primary interactive elements, active states, CTAs
- Safety Orange: #E8702A — alerts, HAZMAT indicators, critical status badges

### Secondary
- Steel Gray: #5D6D7E — secondary text, borders, disabled states
- Light Slate: #BDC3C7 — table borders, dividers, subtle backgrounds
- Off-White: #F4F6F7 — page backgrounds, card surfaces

### Status Colors
- Pendiente: #F39C12 (amber)
- En Transito: #2980B9 (blue)
- Entregado: #27AE60 (green)
- Cancelled/Alert: #E74C3C (red)

## Typography
- **Primary font**: Inter (clean, industrial, highly legible)
- **Headings**: Inter SemiBold 600 — dashboard titles, section headers
- **Body**: Inter Regular 400 — table data, form labels
- **Monospace**: JetBrains Mono — order IDs, UN numbers, invoice codes
- **Scale**: 12px (table cells) / 14px (body) / 16px (primary) / 20px (card titles) / 28px (dashboard KPI numbers)

## Elevation & Depth
- Cards: subtle shadow `box-shadow: 0 1px 4px rgba(0,0,0,0.12)` on Off-White background
- Sidebar: deep navy, no shadow (full-bleed dark panel)
- Modals: `0 8px 32px rgba(0,0,0,0.24)` with slight backdrop blur
- Tables: flat, no elevation — dividers only

## Component Guidelines

### Navigation
- Left sidebar (desktop), collapsible to icon-only mode
- Top bar: app name + active section breadcrumb + user avatar/role badge
- Mobile (Conductor): bottom tab bar — 4 tabs max (Mis Viajes, Checklist, Novedades, Mantenimiento)

### Tables / Data Grids
- Compact row height (36px desktop, 44px mobile)
- Alternating row tint: Off-White / very light blue tint (#EBF5FB)
- Sticky header
- Status column: colored badge pill (Pendiente / En Transito / Entregado)
- Action column: icon buttons (edit, view, assign) — no full-word buttons in rows

### KPI Cards (Dashboard)
- White card, 8px border radius
- Large number (28px SemiBold Industrial Blue)
- Label below in Steel Gray 12px
- Subtle left border accent: 3px solid in operation-type color
  - Distribucion: #1B4F72 (Industrial Blue)
  - Puerto: #16A085 (Teal)
  - Material Tecnico: #8E44AD (Purple)
  - Cross-type / Total: #E8702A (Safety Orange)

### Forms
- Label above input, consistent 8px gap
- Input border: 1px solid Light Slate, focus: 2px solid Industrial Blue
- Required field marker: red asterisk
- Hazmat section: Safety Orange left border on the field group + warning icon header

### Status Badges
- Pill shape, 4px border radius, 6px horizontal padding
- Background: tinted version of status color at 15% opacity
- Text: status color at 100%

### Buttons
- Primary: Industrial Blue fill, white text, 6px radius
- Secondary: white fill, Industrial Blue border + text
- Danger: Safety Orange fill, white text
- Ghost: transparent, Steel Gray text
- Height: 36px desktop / 44px mobile

### Mobile (Conductor App)
- Bottom navigation tabs
- Large tap targets (min 44px)
- Checklist items as swipeable cards
- Trip status prominently at top
- Orange badge for pending actions

## Layout Patterns

### Desktop
- 240px fixed sidebar (collapsible to 64px icon mode)
- Main content: max-width 1440px, 24px horizontal padding
- Dashboard: responsive CSS grid, 2-4 KPI cards per row
- Tables full-width with horizontal scroll on overflow

### Mobile
- Single column
- Sticky top bar with back navigation
- Bottom tab bar for Conductor role
- Collapsible sections for detail views

## Iconography
- Lucide Icons (consistent, clean, industrial feel)
- Truck icon for fleet/vehicles
- Container icon for Puerto operations
- Chemical/flask icon for HAZMAT fields
- Route/map pin icon for Distribucion

## Data Visualization
- Chart library: Recharts (React)
- KPI trend lines: thin, single-color line charts
- Fleet occupancy: horizontal bar chart, Industrial Blue fill
- Operation breakdown: donut chart, per-type colors
- No 3D charts, no decorative gradients on charts — flat, functional

## Spacing System
- Base unit: 4px
- Common spacings: 4, 8, 12, 16, 24, 32, 48px
- Card internal padding: 16px (mobile) / 24px (desktop)
- Section gaps: 24px

## Accessibility
- WCAG AA contrast minimum on all text
- Focus ring: 2px solid Industrial Blue, 2px offset
- Form errors: red text below input + icon

## Anti-References
- No consumer app aesthetics (no gradients, no rounded hero images)
- No pastel color schemes
- No cartoon iconography
- No full-page splash animations
- Interface should feel like professional enterprise software: dense, informative, trustworthy
