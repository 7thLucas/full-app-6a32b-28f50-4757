import { useEffect, useState, useCallback } from "react";

/**
 * Route-optimization panel for Distribución hojas de ruta.
 *
 * Shown as a modal from the distribution detail drawer ("Optimizar ruta").
 * Calls the /api/route-optimizer endpoints, compares the original vs optimized
 * stop order, shows total distance/time and the savings, and lets the operator
 * apply the optimized order to the route sheet.
 *
 * Gracefully handles the Google Maps API key being absent (shows a clear
 * Spanish message instead of crashing).
 */

const BRAND = "#1B4F72";

interface OptimizedStop {
  indiceOriginal: number;
  descripcion: string;
  direccion?: string;
  latitud: number;
  longitud: number;
  completado: boolean;
}

interface OptimizationResult {
  shipmentId: string;
  numeroOrden: string;
  deposito: { direccion: string; latitud: number; longitud: number };
  ordenOriginal: OptimizedStop[];
  ordenOptimizado: OptimizedStop[];
  original: { distanciaKm: number; minutos: number };
  optimizado: { distanciaKm: number; minutos: number };
  ahorro: { distanciaKm: number; minutos: number; porcentaje: number };
}

export interface RouteOptimizerModalProps {
  shipmentId: string;
  hojaRutaId: string;
  clienteNombre: string;
  // Whether this shipment id is a real persisted Mongo document. Demo/mock rows
  // can still open the panel to see the Google Maps status, but cannot persist.
  isPersisted?: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

function formatMinutes(min: number): string {
  if (min <= 0) return "0 min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function RouteOptimizerModal({
  shipmentId,
  hojaRutaId,
  clienteNombre,
  isPersisted = true,
  onClose,
  onApplied,
}: RouteOptimizerModalProps) {
  const [phase, setPhase] = useState<"checking" | "computing" | "result" | "no-key" | "error" | "applied">("checking");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [deposito, setDeposito] = useState("");
  const [savingDeposito, setSavingDeposito] = useState(false);
  const [applying, setApplying] = useState(false);

  const runOptimize = useCallback(async () => {
    setPhase("computing");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/route-optimizer/${shipmentId}/optimize`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (json?.code === "NO_KEY") {
        setPhase("no-key");
        return;
      }
      if (!res.ok || !json.success) {
        setErrorMsg(json.error ?? `Error ${res.status} al calcular la ruta`);
        setPhase("error");
        return;
      }
      setResult(json.data as OptimizationResult);
      setPhase("result");
    } catch (err: any) {
      setErrorMsg(err.message ?? "No se pudo conectar con el servicio de optimización");
      setPhase("error");
    }
  }, [shipmentId]);

  // On open: check key + load depot, then auto-run optimization if possible.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/route-optimizer/status", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        const dep = json?.data?.deposito?.direccion ?? "";
        setDeposito(dep);
        if (!json?.data?.googleMapsConfigurado) {
          setPhase("no-key");
          return;
        }
        if (!isPersisted) {
          // Mock/demo row: key is configured but there's nothing to optimize on the server.
          setErrorMsg(
            "Esta hoja de ruta es de demostración y no está guardada todavía. Importá o creá una hoja de ruta real para optimizar su recorrido.",
          );
          setPhase("error");
          return;
        }
        await runOptimize();
      } catch {
        if (!cancelled) {
          setErrorMsg("No se pudo verificar la configuración de Google Maps.");
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPersisted, runOptimize]);

  async function saveDeposito() {
    if (!deposito.trim()) return;
    setSavingDeposito(true);
    try {
      await fetch("/api/route-optimizer/deposito", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ direccion: deposito.trim() }),
      });
    } finally {
      setSavingDeposito(false);
    }
  }

  async function applyOptimized() {
    if (!result) return;
    setApplying(true);
    setErrorMsg("");
    try {
      const orden = result.ordenOptimizado.map((s) => s.indiceOriginal);
      const res = await fetch(`/api/route-optimizer/${shipmentId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orden,
          distanciaKm: result.optimizado.distanciaKm,
          minutos: result.optimizado.minutos,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setErrorMsg(json.error ?? "No se pudo aplicar el orden optimizado");
        return;
      }
      setPhase("applied");
      onApplied?.();
    } catch (err: any) {
      setErrorMsg(err.message ?? "No se pudo aplicar el orden optimizado");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#BDC3C7]" style={{ background: "#0D1B2A" }}>
          <div>
            <h2 className="font-semibold text-white text-sm">Optimizar ruta de distribución</h2>
            <p className="text-[#BDC3C7] text-xs mt-0.5">
              {hojaRutaId} · {clienteNombre}
            </p>
          </div>
          <button onClick={onClose} className="text-[#BDC3C7] hover:text-white" aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Depot config — always visible so it can be set when missing */}
          <div className="bg-[#F4F6F7] rounded-lg p-4">
            <label className="block text-[#0D1B2A] text-sm font-medium mb-1.5">Depósito de origen</label>
            <p className="text-xs text-[#5D6D7E] mb-2">
              Las rutas se optimizan partiendo y regresando a esta base. Editá la dirección si corresponde.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={deposito}
                onChange={(e) => setDeposito(e.target.value)}
                placeholder="Ej: Av. Mitre 500, Avellaneda, Buenos Aires"
                className="flex-1 px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
              />
              <button
                onClick={saveDeposito}
                disabled={savingDeposito || !deposito.trim()}
                className="px-3 py-2 border border-[#1B4F72] text-[#1B4F72] text-sm font-medium rounded hover:bg-[#EBF5FB] disabled:opacity-50 whitespace-nowrap"
              >
                {savingDeposito ? "Guardando…" : "Guardar base"}
              </button>
            </div>
          </div>

          {/* No key state */}
          {phase === "no-key" && (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#FEF3CD] flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B7791F" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <p className="text-[#0D1B2A] font-semibold text-sm mb-1">Google Maps no está configurado</p>
              <p className="text-[#5D6D7E] text-sm max-w-md mx-auto">
                Configurá tu clave de Google Maps (variable de entorno <span className="font-mono text-xs bg-[#F4F6F7] px-1 py-0.5 rounded">GOOGLE_MAPS_API_KEY</span>) para activar la optimización de rutas con Google Directions.
              </p>
            </div>
          )}

          {/* Computing */}
          {(phase === "checking" || phase === "computing") && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#5D6D7E] text-sm">
              <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              {phase === "checking" ? "Verificando configuración…" : "Calculando la ruta óptima con Google Maps…"}
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="text-center py-8">
              <p className="text-[#E74C3C] font-semibold text-sm mb-1">No se pudo optimizar la ruta</p>
              <p className="text-[#5D6D7E] text-sm max-w-md mx-auto mb-4">{errorMsg}</p>
              {isPersisted && (
                <button onClick={runOptimize} className="px-4 py-2 text-white text-sm font-semibold rounded hover:opacity-90" style={{ background: BRAND }}>
                  Reintentar
                </button>
              )}
            </div>
          )}

          {/* Result */}
          {phase === "result" && result && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-[#BDC3C7] rounded-lg p-3">
                  <p className="text-xs text-[#5D6D7E]">Orden original</p>
                  <p className="text-lg font-semibold text-[#0D1B2A]">{result.original.distanciaKm} km</p>
                  <p className="text-xs text-[#5D6D7E]">{formatMinutes(result.original.minutos)}</p>
                </div>
                <div className="bg-[#EBF5FB] border rounded-lg p-3" style={{ borderColor: BRAND }}>
                  <p className="text-xs" style={{ color: BRAND }}>Orden optimizado</p>
                  <p className="text-lg font-semibold" style={{ color: BRAND }}>{result.optimizado.distanciaKm} km</p>
                  <p className="text-xs text-[#5D6D7E]">{formatMinutes(result.optimizado.minutos)}</p>
                </div>
                <div className="bg-[#f0faf5] border border-[#27AE60] rounded-lg p-3">
                  <p className="text-xs text-[#1E8449]">Ahorro estimado</p>
                  <p className="text-lg font-semibold text-[#1E8449]">
                    {result.ahorro.distanciaKm > 0 ? `${result.ahorro.distanciaKm} km` : "0 km"}
                  </p>
                  <p className="text-xs text-[#5D6D7E]">
                    {formatMinutes(Math.max(0, result.ahorro.minutos))} · {result.ahorro.porcentaje > 0 ? `${result.ahorro.porcentaje}%` : "0%"}
                  </p>
                </div>
              </div>

              {result.ahorro.distanciaKm <= 0 && (
                <p className="text-xs text-[#5D6D7E] bg-[#F4F6F7] rounded p-2">
                  El orden actual ya es óptimo o muy cercano al óptimo. No se obtiene un ahorro significativo.
                </p>
              )}

              {/* Side-by-side orders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#5D6D7E] uppercase tracking-wide mb-2">Orden actual</p>
                  <ol className="space-y-1.5">
                    <li className="flex items-center gap-2 text-xs text-[#5D6D7E]">
                      <span className="w-5 h-5 rounded-full bg-[#0D1B2A] text-white flex items-center justify-center text-[10px] flex-shrink-0">D</span>
                      Depósito
                    </li>
                    {result.ordenOriginal.map((s, i) => (
                      <li key={`o-${i}`} className="flex items-center gap-2 text-sm text-[#0D1B2A]">
                        <span className="w-5 h-5 rounded-full bg-[#BDC3C7] text-white flex items-center justify-center text-[10px] flex-shrink-0">{i + 1}</span>
                        <span className="truncate">{s.descripcion}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: BRAND }}>Orden optimizado</p>
                  <ol className="space-y-1.5">
                    <li className="flex items-center gap-2 text-xs text-[#5D6D7E]">
                      <span className="w-5 h-5 rounded-full bg-[#0D1B2A] text-white flex items-center justify-center text-[10px] flex-shrink-0">D</span>
                      Depósito
                    </li>
                    {result.ordenOptimizado.map((s, i) => {
                      const moved = s.indiceOriginal !== i;
                      return (
                        <li key={`p-${i}`} className="flex items-center gap-2 text-sm text-[#0D1B2A]">
                          <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] flex-shrink-0" style={{ background: BRAND }}>{i + 1}</span>
                          <span className="truncate">{s.descripcion}</span>
                          {moved && (
                            <span className="text-[10px] text-[#E8702A] font-medium flex-shrink-0">
                              (era #{s.indiceOriginal + 1})
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>

              <p className="text-[11px] text-[#5D6D7E]">
                Distancias y tiempos calculados con Google Maps Directions. Origen y destino: {result.deposito.direccion}.
              </p>

              {errorMsg && <p className="text-sm text-[#E74C3C]">{errorMsg}</p>}
            </>
          )}

          {/* Applied */}
          {phase === "applied" && (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#f0faf5] flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <p className="text-[#1E8449] font-semibold text-sm">Orden optimizado aplicado a la hoja de ruta</p>
              <p className="text-[#5D6D7E] text-sm mt-1">Las paradas se reordenaron según el recorrido óptimo.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#BDC3C7] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-[#BDC3C7] text-[#5D6D7E] rounded text-sm hover:bg-[#F4F6F7]">
            {phase === "applied" ? "Cerrar" : "Cancelar"}
          </button>
          {phase === "result" && result && (
            <button
              onClick={applyOptimized}
              disabled={applying}
              className="px-4 py-2 text-white rounded text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              style={{ background: BRAND }}
            >
              {applying ? "Aplicando…" : "Aplicar orden optimizado"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
