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

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch("/api/fleet/active-positions", { credentials: "include" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Error al obtener posiciones");
      const positions: FleetPosition[] = json.data.positions ?? [];
      renderMarkers(positions);
      setCount(positions.length);
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
              No hay camiones en tránsito con ubicación reportada en este momento.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
