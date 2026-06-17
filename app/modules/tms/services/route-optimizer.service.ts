import { ShipmentModel, OperationType } from "../models/shipment.model";
import { RouteSettingsModel } from "../models/route-settings.model";

/**
 * Route optimization for Distribución hojas de ruta.
 *
 * Uses the Google Maps Geocoding API (to resolve stop descriptions/addresses
 * into coordinates) and the Google Maps Directions API with waypoint
 * optimization (`optimize:true`) to compute the shortest stop sequence,
 * starting and ending at the company depot ("depósito de origen").
 *
 * The Google Maps key is read from GOOGLE_MAPS_API_KEY. When it is absent the
 * service returns a structured "needs key" result so the UI can show a clear
 * Spanish message instead of crashing.
 */

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";

// Bias geocoding toward the Argentine operating corridor for ambiguous names.
const GEOCODE_REGION = "ar";
const GEOCODE_COMPONENTS = "country:AR";

export interface OptimizedStop {
  indiceOriginal: number; // index of this stop in the original puntosRuta array
  descripcion: string;
  direccion?: string;
  latitud: number;
  longitud: number;
  completado: boolean;
}

export interface OptimizationResult {
  ok: true;
  shipmentId: string;
  numeroOrden: string;
  deposito: { direccion: string; latitud: number; longitud: number };
  ordenOriginal: OptimizedStop[];
  ordenOptimizado: OptimizedStop[];
  original: { distanciaKm: number; minutos: number };
  optimizado: { distanciaKm: number; minutos: number };
  ahorro: { distanciaKm: number; minutos: number; porcentaje: number };
}

export interface OptimizationError {
  ok: false;
  code: "NO_KEY" | "NOT_DISTRIBUTION" | "TOO_FEW_STOPS" | "GEOCODE_FAILED" | "DIRECTIONS_FAILED" | "NOT_FOUND";
  message: string; // Spanish, user-facing
  details?: string;
}

export type OptimizationOutcome = OptimizationResult | OptimizationError;

function getApiKey(): string | undefined {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  return key && key.trim() ? key.trim() : undefined;
}

export function hasGoogleMapsKey(): boolean {
  return Boolean(getApiKey());
}

async function geocode(address: string, key: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${GEOCODE_URL}?address=${encodeURIComponent(address)}&region=${GEOCODE_REGION}&components=${encodeURIComponent(GEOCODE_COMPONENTS)}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
  const json: any = await res.json();
  if (json.status === "OK" && json.results?.length) {
    const loc = json.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  if (json.status === "ZERO_RESULTS") return null;
  throw new Error(`Geocoding: ${json.status}${json.error_message ? ` — ${json.error_message}` : ""}`);
}

async function getDepot(key: string): Promise<{ direccion: string; latitud: number; longitud: number }> {
  let settings = await RouteSettingsModel.findOne({ clave: "default" });
  if (!settings) {
    settings = await RouteSettingsModel.create({ clave: "default" });
  }
  const direccion = settings.depositoDireccion || "Avellaneda, Buenos Aires, Argentina";

  // Reuse cached coordinates when present; otherwise geocode and cache.
  if (settings.depositoLatitud != null && settings.depositoLongitud != null) {
    return { direccion, latitud: settings.depositoLatitud, longitud: settings.depositoLongitud };
  }
  const geo = await geocode(direccion, key);
  if (!geo) {
    throw new Error(`No se pudo geolocalizar el depósito de origen "${direccion}".`);
  }
  settings.depositoLatitud = geo.lat;
  settings.depositoLongitud = geo.lng;
  await settings.save();
  return { direccion, latitud: geo.lat, longitud: geo.lng };
}

/**
 * Sum leg distances/durations from a Directions API route in a fixed leg order.
 */
function sumLegs(legs: any[]): { distanciaKm: number; minutos: number } {
  let meters = 0;
  let seconds = 0;
  for (const leg of legs) {
    meters += leg.distance?.value ?? 0;
    seconds += leg.duration?.value ?? 0;
  }
  return {
    distanciaKm: Math.round((meters / 1000) * 10) / 10,
    minutos: Math.round(seconds / 60),
  };
}

/**
 * Call the Directions API once. When `optimize` is true the waypoints get
 * "optimize:true" and the API returns `waypoint_order`.
 */
async function getDirections(
  origin: string,
  destination: string,
  waypoints: string[],
  optimize: boolean,
  key: string,
): Promise<{ totals: { distanciaKm: number; minutos: number }; waypointOrder: number[] }> {
  const wpParam = waypoints.length
    ? `&waypoints=${optimize ? "optimize:true|" : ""}${waypoints.map((w) => encodeURIComponent(w)).join("|")}`
    : "";
  const url = `${DIRECTIONS_URL}?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${wpParam}&region=${GEOCODE_REGION}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Directions HTTP ${res.status}`);
  const json: any = await res.json();
  if (json.status !== "OK" || !json.routes?.length) {
    throw new Error(`Directions: ${json.status}${json.error_message ? ` — ${json.error_message}` : ""}`);
  }
  const route = json.routes[0];
  return {
    totals: sumLegs(route.legs ?? []),
    waypointOrder: route.waypoint_order ?? waypoints.map((_, i) => i),
  };
}

function coordStr(lat: number, lng: number): string {
  return `${lat},${lng}`;
}

export const RouteOptimizerService = {
  hasGoogleMapsKey,

  async getSettings() {
    let settings = await RouteSettingsModel.findOne({ clave: "default" }).lean();
    if (!settings) {
      const created = await RouteSettingsModel.create({ clave: "default" });
      settings = created.toObject();
    }
    return settings;
  },

  async updateDeposito(direccion: string) {
    const settings = await RouteSettingsModel.findOneAndUpdate(
      { clave: "default" },
      // Clear cached coords so the new address gets re-geocoded next run.
      { depositoDireccion: direccion, depositoLatitud: undefined, depositoLongitud: undefined },
      { new: true, upsert: true },
    ).lean();
    return settings;
  },

  /**
   * Compute the optimized stop order for a Distribución shipment. Pure read —
   * does not persist any change to the shipment.
   */
  async optimize(shipmentId: string): Promise<OptimizationOutcome> {
    const key = getApiKey();
    if (!key) {
      return {
        ok: false,
        code: "NO_KEY",
        message:
          "Configurá tu clave de Google Maps (GOOGLE_MAPS_API_KEY) para activar la optimización de rutas.",
      };
    }

    const shipment = await ShipmentModel.findById(shipmentId).lean();
    if (!shipment) {
      return { ok: false, code: "NOT_FOUND", message: "No se encontró la hoja de ruta." };
    }
    if (shipment.tipoOperacion !== OperationType.Distribucion) {
      return {
        ok: false,
        code: "NOT_DISTRIBUTION",
        message: "La optimización de rutas solo aplica a viajes de Distribución.",
      };
    }

    const stops = (shipment.puntosRuta ?? []).map((p, i) => ({ ...p, indiceOriginal: i }));
    if (stops.length < 2) {
      return {
        ok: false,
        code: "TOO_FEW_STOPS",
        message: "La hoja de ruta necesita al menos 2 paradas para optimizar el recorrido.",
      };
    }

    try {
      const deposito = await getDepot(key);

      // Resolve coordinates for every stop (use cached coords / direccion / descripcion).
      const resolved: OptimizedStop[] = [];
      for (const s of stops) {
        let lat = s.latitud;
        let lng = s.longitud;
        if (lat == null || lng == null) {
          const query = s.direccion?.trim() || s.descripcion?.trim() || "";
          const geo = query ? await geocode(query, key) : null;
          if (!geo) {
            return {
              ok: false,
              code: "GEOCODE_FAILED",
              message: `No se pudo geolocalizar la parada "${s.descripcion}". Agregá una dirección más específica.`,
            };
          }
          lat = geo.lat;
          lng = geo.lng;
        }
        resolved.push({
          indiceOriginal: s.indiceOriginal,
          descripcion: s.descripcion,
          direccion: s.direccion,
          latitud: lat,
          longitud: lng,
          completado: Boolean(s.completado),
        });
      }

      const depotCoord = coordStr(deposito.latitud, deposito.longitud);
      const waypoints = resolved.map((s) => coordStr(s.latitud, s.longitud));

      // Original order: depot -> stops in given order -> depot (no optimization).
      const originalRun = await getDirections(depotCoord, depotCoord, waypoints, false, key);
      // Optimized order: depot -> optimized stops -> depot.
      const optimizedRun = await getDirections(depotCoord, depotCoord, waypoints, true, key);

      const ordenOptimizado = optimizedRun.waypointOrder.map((idx) => resolved[idx]);

      const original = originalRun.totals;
      const optimizado = optimizedRun.totals;
      const ahorroKm = Math.round((original.distanciaKm - optimizado.distanciaKm) * 10) / 10;
      const ahorroMin = original.minutos - optimizado.minutos;
      const porcentaje =
        original.distanciaKm > 0 ? Math.round((ahorroKm / original.distanciaKm) * 1000) / 10 : 0;

      return {
        ok: true,
        shipmentId: shipment._id.toString(),
        numeroOrden: shipment.numeroOrden,
        deposito,
        ordenOriginal: resolved,
        ordenOptimizado,
        original,
        optimizado,
        ahorro: { distanciaKm: ahorroKm, minutos: ahorroMin, porcentaje },
      };
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      const isDirections = msg.startsWith("Directions");
      return {
        ok: false,
        code: isDirections ? "DIRECTIONS_FAILED" : "GEOCODE_FAILED",
        message:
          "No se pudo calcular la ruta optimizada con Google Maps. Verificá la clave de API y que el servicio de Directions/Geocoding esté habilitado.",
        details: msg,
      };
    }
  },

  /**
   * Persist an optimized stop order onto the shipment's puntosRuta.
   * `orden` is the list of ORIGINAL indices in their new (optimized) sequence.
   */
  async applyOrder(
    shipmentId: string,
    orden: number[],
    totals?: { distanciaKm?: number; minutos?: number },
  ) {
    const shipment = await ShipmentModel.findById(shipmentId);
    if (!shipment) return null;

    const current = shipment.puntosRuta ?? [];
    if (!Array.isArray(orden) || orden.length !== current.length) {
      throw new Error("El orden recibido no coincide con la cantidad de paradas.");
    }

    const reordered = orden.map((origIdx, newIdx) => {
      const p: any = current[origIdx];
      if (!p) throw new Error("Índice de parada inválido en el orden optimizado.");
      return {
        descripcion: p.descripcion,
        completado: p.completado,
        direccion: p.direccion,
        latitud: p.latitud,
        longitud: p.longitud,
        orden: newIdx,
      };
    });

    shipment.puntosRuta = reordered as any;
    shipment.rutaOptimizada = true;
    if (totals?.distanciaKm != null) shipment.rutaOptimizadaKm = totals.distanciaKm;
    if (totals?.minutos != null) shipment.rutaOptimizadaMinutos = totals.minutos;
    shipment.rutaOptimizadaAt = new Date();
    if (totals?.distanciaKm != null) shipment.kmRecorridos = totals.distanciaKm;
    if (totals?.minutos != null) shipment.tiempoHoras = Math.round((totals.minutos / 60) * 10) / 10;

    await shipment.save();
    return shipment.toObject();
  },
};
