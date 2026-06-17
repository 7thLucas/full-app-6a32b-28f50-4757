import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";
import { useEffect, useRef, useState, useCallback } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  return { user };
}

const REFRESH_MS = 30_000;
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
// Argentina logistics corridor (Buenos Aires) as the default viewport.
const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const DEFAULT_ZOOM = 9;

interface FleetPosition {
  id: string;
  numeroOrden: string;
  patente: string;
  chofer: string;
  tipoOperacion: string;
  tipoOperacionLabel: string;
  estado: string;
  estadoLabel: string;
  origen: string;
  destino: string;
  latitud: number;
  longitud: number;
  ultimaUbicacionAt: string | null;
}

// Marker tint by operation line — matches the rest of the app's palette.
const OP_COLOR: Record<string, string> = {
  "Distribución": "#1B4F72",
  "Puerto": "#16A085",
  "Material Técnico": "#8E44AD",
};

// ── Filter & manual-entry option lists ───────────────────────────────────────
// Granular operation types must mirror the OperationType enum in
// app/modules/tms/models/shipment.model.ts (do not invent new values).
const OP_GROUPS: Array<{ value: string; label: string; line: string }> = [
  { value: "distribucion", label: "Distribución", line: "Distribución" },
  { value: "puerto_pallets", label: "Puerto - Pallets", line: "Puerto" },
  { value: "puerto_contenedor_20", label: "Puerto - Contenedor 20'", line: "Puerto" },
  { value: "puerto_contenedor_40", label: "Puerto - Contenedor 40'", line: "Puerto" },
  { value: "puerto_isotanque", label: "Puerto - Isotanque", line: "Puerto" },
  { value: "material_tecnico", label: "Material Técnico", line: "Material Técnico" },
];

// Trip statuses mirror the ShipmentStatus enum exactly. The live map only ever
// shows trucks currently En Tránsito, but the filter is offered for parity with
// the model and for when manual entries broaden the dataset.
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_transito", label: "En Tránsito" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "Sin reporte";
  const date = new Date(iso);
  const diffMin = Math.round((Date.now() - date.getTime()) / 60_000);
  const rel = diffMin <= 0 ? "ahora" : diffMin < 60 ? `hace ${diffMin} min` : `hace ${Math.round(diffMin / 60)} h`;
  return `${date.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} (${rel})`;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

function loadStylesheet(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function buildPopupHtml(p: FleetPosition): string {
  const color = OP_COLOR[p.tipoOperacionLabel] ?? "#1B4F72";
  return `
    <div style="min-width:220px;font-family:inherit">
      <div style="font-weight:700;font-size:14px;color:#0D1B2A;font-family:monospace">${escapeHtml(p.patente)}</div>
      <div style="font-size:11px;color:#5D6D7E;margin-bottom:8px">${escapeHtml(p.numeroOrden)}</div>
      <table style="font-size:12px;color:#0D1B2A;border-collapse:collapse">
        <tr><td style="color:#5D6D7E;padding:2px 8px 2px 0">Chofer</td><td style="font-weight:600">${escapeHtml(p.chofer)}</td></tr>
        <tr><td style="color:#5D6D7E;padding:2px 8px 2px 0">Operación</td><td><span style="display:inline-block;padding:1px 6px;border-radius:4px;background:${color}1a;color:${color};font-weight:600">${escapeHtml(p.tipoOperacionLabel)}</span></td></tr>
        <tr><td style="color:#5D6D7E;padding:2px 8px 2px 0">Estado</td><td style="font-weight:600">${escapeHtml(p.estadoLabel)}</td></tr>
        <tr><td style="color:#5D6D7E;padding:2px 8px 2px 0">Ruta</td><td>${escapeHtml(p.origen)} → ${escapeHtml(p.destino)}</td></tr>
        <tr><td style="color:#5D6D7E;padding:2px 8px 2px 0">Últ. ubicación</td><td>${escapeHtml(formatTimestamp(p.ultimaUbicacionAt))}</td></tr>
      </table>
    </div>`;
}

export default function SeguimientoPage() {
  const { user } = useLoaderData<typeof loader>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const leafletRef = useRef<any>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [count, setCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Latest fetched positions kept in a ref so the refresh interval and the
  // filter changes can both re-render markers without re-running the effect.
  const positionsRef = useRef<FleetPosition[]>([]);
  const [filterOp, setFilterOp] = useState<string>(""); // granular OperationType value or "" (Todos)
  const [filterStatus, setFilterStatus] = useState<string>(""); // ShipmentStatus value or "" (Todos)
  const [showManualModal, setShowManualModal] = useState(false);

  const buildIcon = useCallback((p: FleetPosition) => {
    const L = leafletRef.current;
    const color = OP_COLOR[p.tipoOperacionLabel] ?? "#1B4F72";
    return L.divIcon({
      className: "fleet-marker",
      html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center">
        <div style="transform:rotate(45deg);width:8px;height:8px;border-radius:50%;background:white"></div>
      </div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -24],
    });
  }, []);

  const renderMarkers = useCallback(
    (positions: FleetPosition[]) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;

      const seen = new Set<string>();
      for (const p of positions) {
        seen.add(p.id);
        const existing = markersRef.current.get(p.id);
        if (existing) {
          existing.setLatLng([p.latitud, p.longitud]);
          existing.setIcon(buildIcon(p));
          existing.setPopupContent(buildPopupHtml(p));
        } else {
          const marker = L.marker([p.latitud, p.longitud], { icon: buildIcon(p) })
            .addTo(map)
            .bindPopup(buildPopupHtml(p));
          markersRef.current.set(p.id, marker);
        }
      }

      // Drop markers for trucks no longer active.
      for (const [id, marker] of markersRef.current.entries()) {
        if (!seen.has(id)) {
          map.removeLayer(marker);
          markersRef.current.delete(id);
        }
      }
    },
    [buildIcon],
  );

  // Narrows the marker set by the active operation-type and trip-status
  // dropdowns. An empty filter ("Todos") matches everything.
  const applyFilters = useCallback(
    (positions: FleetPosition[]) =>
      positions.filter((p) => {
        if (filterOp && p.tipoOperacion !== filterOp) return false;
        if (filterStatus && p.estado !== filterStatus) return false;
        return true;
      }),
    [filterOp, filterStatus],
  );

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch("/api/fleet/active-positions", { credentials: "include" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Error al obtener posiciones");
      const positions: FleetPosition[] = json.data.positions ?? [];
      positionsRef.current = positions;
      const visible = applyFilters(positions);
      renderMarkers(visible);
      setCount(visible.length);
      setLastRefresh(new Date());
      setStatus("ready");
    } catch (err: any) {
      // Keep existing markers on a transient refresh failure; only surface
      // the error if the map never loaded successfully.
      setErrorMsg(err.message ?? "Error al actualizar posiciones");
      setStatus((prev) => (prev === "ready" ? "ready" : "error"));
    }
  }, [renderMarkers]);

  // Initialise Leaflet (CDN, no API key required — fallback map approach).
  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    (async () => {
      try {
        loadStylesheet(LEAFLET_CSS);
        await loadScript(LEAFLET_JS);
        if (cancelled) return;

        const L = (window as any).L;
        leafletRef.current = L;
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;

        await fetchPositions();
        intervalId = setInterval(fetchPositions, REFRESH_MS);
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err.message ?? "No se pudo inicializar el mapa");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
    };
  }, [fetchPositions]);

  // Re-render markers immediately when the user changes a filter, using the
  // last fetched positions (no need to wait for the next 30s refresh).
  useEffect(() => {
    if (!mapRef.current) return;
    const visible = applyFilters(positionsRef.current);
    renderMarkers(visible);
    setCount(visible.length);
  }, [applyFilters, renderMarkers]);

  return (
    <AppShell title="Seguimiento de Flota en Tiempo Real" user={user}>
      <div className="flex flex-col gap-4">
        {/* Status / legend bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#27AE60] opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#27AE60]" />
            </span>
            <span className="text-sm font-semibold text-[#0D1B2A]">{count} camiones activos</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-[#BDC3C7]" />
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#5D6D7E]">
            {Object.entries(OP_COLOR).map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
          <div className="sm:ml-auto text-xs text-[#5D6D7E]">
            {lastRefresh
              ? `Actualizado ${lastRefresh.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · refresco cada ${REFRESH_MS / 1000}s`
              : "Cargando posiciones…"}
          </div>
        </div>

        {/* Filters + manual-entry controls */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 bg-white rounded-lg px-4 py-3 shadow-sm">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[#5D6D7E] text-xs mb-1">Tipo de operación</label>
            <select
              value={filterOp}
              onChange={(e) => setFilterOp(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm text-[#0D1B2A] focus:outline-none focus:border-[#1B4F72] focus:ring-1 focus:ring-[#1B4F72]"
            >
              <option value="">Todos</option>
              {OP_GROUPS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[#5D6D7E] text-xs mb-1">Estado del viaje</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm text-[#0D1B2A] focus:outline-none focus:border-[#1B4F72] focus:ring-1 focus:ring-[#1B4F72]"
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2 bg-[#1B4F72] text-white text-sm font-semibold rounded hover:bg-[#154060] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span className="text-base leading-none">+</span>
            Cargar manualmente
          </button>
        </div>

        {/* Map */}
        <div className="relative bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: 420 }}>
          <div ref={mapContainerRef} className="absolute inset-0 z-0" style={{ height: "100%", width: "100%" }} />

          {status === "loading" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F4F6F7]/80">
              <div className="flex flex-col items-center gap-2 text-[#5D6D7E] text-sm">
                <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Inicializando mapa…
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F4F6F7]/90">
              <div className="text-center px-6">
                <p className="text-[#E74C3C] font-semibold text-sm mb-1">No se pudo cargar el mapa</p>
                <p className="text-[#5D6D7E] text-xs mb-3">{errorMsg}</p>
                <button
                  onClick={() => {
                    setStatus("loading");
                    fetchPositions();
                  }}
                  className="px-3 py-1.5 bg-[#1B4F72] text-white text-xs font-semibold rounded hover:bg-[#154060]"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {status === "ready" && count === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-lg shadow-md text-xs text-[#5D6D7E]">
              {filterOp || filterStatus
                ? "Ningún camión coincide con los filtros aplicados."
                : "No hay camiones en tránsito con ubicación reportada en este momento."}
            </div>
          )}
        </div>
      </div>

      {showManualModal && (
        <ManualEntryModal
          onClose={() => setShowManualModal(false)}
          onSaved={() => {
            setShowManualModal(false);
            // Pull fresh positions so the new/updated marker appears at once.
            fetchPositions();
          }}
        />
      )}
    </AppShell>
  );
}

// Default center coords used when an operator doesn't override the position —
// keeps the manual marker inside the Buenos Aires operating corridor.
const MANUAL_DEFAULT_LAT = DEFAULT_CENTER[0];
const MANUAL_DEFAULT_LNG = DEFAULT_CENTER[1];

interface ManualForm {
  vehiculoPatente: string;
  conductorNombre: string;
  tipoOperacion: string;
  estado: string;
  origen: string;
  destino: string;
  latitud: string;
  longitud: string;
  observaciones: string;
}

const EMPTY_MANUAL_FORM: ManualForm = {
  vehiculoPatente: "",
  conductorNombre: "",
  tipoOperacion: "distribucion",
  estado: "en_transito",
  origen: "",
  destino: "",
  latitud: "",
  longitud: "",
  observaciones: "",
};

function ManualEntryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ManualForm>(EMPTY_MANUAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const isPuerto = form.tipoOperacion.startsWith("puerto_");
  const update = (key: keyof ManualForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit() {
    setError("");
    if (!form.vehiculoPatente.trim()) {
      setError("La patente/camión es obligatoria.");
      return;
    }
    setSaving(true);
    try {
      // Persist through the existing shipment ("viaje") API. The fleet map only
      // shows trucks En Tránsito with coordinates, so we default both so the
      // manual marker is visible immediately.
      const lat = form.latitud.trim() ? Number(form.latitud) : MANUAL_DEFAULT_LAT;
      const lng = form.longitud.trim() ? Number(form.longitud) : MANUAL_DEFAULT_LNG;
      const payload = {
        tipoOperacion: form.tipoOperacion,
        estado: form.estado,
        vehiculoPatente: form.vehiculoPatente.trim(),
        conductorNombre: form.conductorNombre.trim() || undefined,
        origen: form.origen.trim() || "Carga manual",
        destino: form.destino.trim() || "Carga manual",
        // clienteId is required by the model; manual entries flag the source.
        clienteId: "manual",
        clienteNombre: "Carga manual",
        fechaPlanificada: new Date().toISOString(),
        latitud: Number.isFinite(lat) ? lat : MANUAL_DEFAULT_LAT,
        longitud: Number.isFinite(lng) ? lng : MANUAL_DEFAULT_LNG,
        ultimaUbicacionAt: new Date().toISOString(),
        observaciones: form.observaciones.trim() || undefined,
        importadoDe: "carga-manual",
      };

      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? `Error ${res.status} al guardar el registro`);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "No se pudo guardar el registro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#BDC3C7]">
          <h2 className="font-semibold text-[#0D1B2A]">Nuevo registro manual</h2>
          <button onClick={onClose} className="text-[#5D6D7E] hover:text-[#0D1B2A]" aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-[#5D6D7E]">
            Cargá manualmente un viaje cuando no haya datos automáticos disponibles. Para que el camión
            aparezca en el mapa, el estado debe ser <strong>En Tránsito</strong> y debe tener ubicación
            (si no la indicás, se usa el centro del corredor de Buenos Aires).
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Patente / Camión <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.vehiculoPatente}
                onChange={(e) => update("vehiculoPatente", e.target.value)}
                placeholder="Ej: ET-001-ET"
                className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm font-mono focus:outline-none focus:border-[#1B4F72]"
              />
            </div>
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Chofer</label>
              <input
                type="text"
                value={form.conductorNombre}
                onChange={(e) => update("conductorNombre", e.target.value)}
                placeholder="Ej: Carlos Rodríguez"
                className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Tipo de operación <span className="text-red-500">*</span></label>
              <select
                value={form.tipoOperacion}
                onChange={(e) => update("tipoOperacion", e.target.value)}
                className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
              >
                {OP_GROUPS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {isPuerto && (
                <p className="text-[10px] text-[#16A085] mt-1">Sub-categoría de Puerto seleccionada.</p>
              )}
            </div>
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Estado del viaje <span className="text-red-500">*</span></label>
              <select
                value={form.estado}
                onChange={(e) => update("estado", e.target.value)}
                className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Origen</label>
              <input
                type="text"
                value={form.origen}
                onChange={(e) => update("origen", e.target.value)}
                placeholder="Ej: Planta Zárate"
                className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
              />
            </div>
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Destino</label>
              <input
                type="text"
                value={form.destino}
                onChange={(e) => update("destino", e.target.value)}
                placeholder="Ej: Terminal TRP"
                className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Latitud (última posición)</label>
              <input
                type="number"
                step="any"
                value={form.latitud}
                onChange={(e) => update("latitud", e.target.value)}
                placeholder={String(MANUAL_DEFAULT_LAT)}
                className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm font-mono focus:outline-none focus:border-[#1B4F72]"
              />
            </div>
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Longitud (última posición)</label>
              <input
                type="number"
                step="any"
                value={form.longitud}
                onChange={(e) => update("longitud", e.target.value)}
                placeholder={String(MANUAL_DEFAULT_LNG)}
                className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm font-mono focus:outline-none focus:border-[#1B4F72]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#0D1B2A] text-sm mb-1.5">Notas</label>
            <textarea
              rows={2}
              value={form.observaciones}
              onChange={(e) => update("observaciones", e.target.value)}
              placeholder="Observaciones del viaje cargado manualmente..."
              className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72] resize-none"
            />
          </div>

          {error && <p className="text-sm text-[#E74C3C]">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-[#BDC3C7] flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-[#BDC3C7] text-[#5D6D7E] rounded text-sm hover:bg-[#F4F6F7] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-[#1B4F72] text-white rounded text-sm font-semibold hover:bg-[#154060] disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar registro"}
          </button>
        </div>
      </div>
    </div>
  );
}
