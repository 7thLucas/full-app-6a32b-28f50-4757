import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  return { user };
}

interface HojaRuta {
  id: string;
  hojaRutaId: string;
  numeroOrden: string;
  clienteNombre: string;
  vehiculoPatente: string;
  conductorNombre: string;
  fechaPlanificada: string;
  entregasCompletadas: number;
  entregasTotales: number;
  kmRecorridos: number;
  tiempoHoras: number;
  estado: "pendiente" | "en_transito" | "entregado";
  puntosRuta: { descripcion: string; completado: boolean }[];
}

const MOCK_DISTRIBUCION: HojaRuta[] = [
  {
    id: "1",
    hojaRutaId: "HR-2026-0041",
    numeroOrden: "ORD-DEMO-0001",
    clienteNombre: "Dow Chemical Argentina S.A.",
    vehiculoPatente: "ET-001-ET",
    conductorNombre: "Carlos Rodríguez",
    fechaPlanificada: "2026-06-17",
    entregasCompletadas: 5,
    entregasTotales: 5,
    kmRecorridos: 87,
    tiempoHoras: 4.5,
    estado: "entregado",
    puntosRuta: [
      { descripcion: "Punto A — San Martín", completado: true },
      { descripcion: "Punto B — Tres de Febrero", completado: true },
      { descripcion: "Punto C — Villa del Parque", completado: true },
      { descripcion: "Punto D — Caballito", completado: true },
      { descripcion: "Punto E — San Telmo", completado: true },
    ],
  },
  {
    id: "2",
    hojaRutaId: "HR-2026-0042",
    numeroOrden: "ORD-DEMO-0009",
    clienteNombre: "BASF Argentina S.A.",
    vehiculoPatente: "ET-008-ET",
    conductorNombre: "Roberto González",
    fechaPlanificada: "2026-06-17",
    entregasCompletadas: 2,
    entregasTotales: 4,
    kmRecorridos: 45,
    tiempoHoras: 2,
    estado: "en_transito",
    puntosRuta: [
      { descripcion: "Punto A — Tigre", completado: true },
      { descripcion: "Punto B — San Fernando", completado: true },
      { descripcion: "Punto C — San Isidro", completado: false },
      { descripcion: "Punto D — Vicente López", completado: false },
    ],
  },
  {
    id: "3",
    hojaRutaId: "HR-2026-0043",
    numeroOrden: "ORD-DEMO-0018",
    clienteNombre: "YPF S.A.",
    vehiculoPatente: "ET-012-ET",
    conductorNombre: "Eduardo López",
    fechaPlanificada: "2026-06-18",
    entregasCompletadas: 0,
    entregasTotales: 6,
    kmRecorridos: 0,
    tiempoHoras: 0,
    estado: "pendiente",
    puntosRuta: [
      { descripcion: "Punto A — La Plata", completado: false },
      { descripcion: "Punto B — Berazategui", completado: false },
      { descripcion: "Punto C — Quilmes", completado: false },
      { descripcion: "Punto D — Avellaneda", completado: false },
      { descripcion: "Punto E — Lanús", completado: false },
      { descripcion: "Punto F — Lomas de Zamora", completado: false },
    ],
  },
];

const STATUS_LABELS = { pendiente: "Pendiente", en_transito: "En Tránsito", entregado: "Entregado" };
const STATUS_CLASSES = {
  pendiente: "badge-pendiente",
  en_transito: "badge-transito",
  entregado: "badge-entregado",
};

export default function DistribucionPage() {
  const { user } = useLoaderData<typeof loader>();
  const [selected, setSelected] = useState<HojaRuta | null>(null);
  const [showImport, setShowImport] = useState(false);

  return (
    <AppShell title="Operaciones — Distribución" user={user}>
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Hojas de Ruta Hoy", value: 2, accent: "#1B4F72" },
          { label: "Entregas Completadas", value: "7/9", accent: "#27AE60" },
          { label: "Km Promedio", value: "66 km", accent: "#1B4F72" },
          { label: "En Tránsito", value: 1, accent: "#2980B9" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: `3px solid ${c.accent}` }}>
            <p className="text-[#5D6D7E] text-xs">{c.label}</p>
            <p className="text-2xl font-semibold text-[#1B4F72] mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setShowImport(true)}
          className="px-4 py-2 border border-[#1B4F72] text-[#1B4F72] text-sm font-semibold rounded hover:bg-[#EBF5FB] flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Importar Hoja de Ruta (Excel)
        </button>
        <button className="px-4 py-2 bg-[#1B4F72] text-white text-sm font-semibold rounded hover:bg-[#154060] flex items-center gap-2 ml-auto">
          + Nueva Hoja de Ruta
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {MOCK_DISTRIBUCION.map((hr) => (
          <div
            key={hr.id}
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            style={{ borderLeft: `3px solid #1B4F72` }}
            onClick={() => setSelected(hr)}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-semibold text-[#1B4F72] text-sm">{hr.hojaRutaId}</span>
                  <span className="font-mono text-xs text-[#5D6D7E]">{hr.numeroOrden}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[hr.estado]}`}>
                    {STATUS_LABELS[hr.estado]}
                  </span>
                </div>
                <p className="text-[#0D1B2A] text-sm font-medium">{hr.clienteNombre}</p>
                <p className="text-[#5D6D7E] text-xs mt-0.5">
                  {hr.vehiculoPatente} · {hr.conductorNombre} · {hr.fechaPlanificada}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-[#5D6D7E]">Entregas</p>
                  <p className="font-semibold text-[#0D1B2A]">{hr.entregasCompletadas}/{hr.entregasTotales}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#5D6D7E]">Km</p>
                  <p className="font-semibold text-[#0D1B2A]">{hr.kmRecorridos > 0 ? `${hr.kmRecorridos}` : "—"}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#5D6D7E]">Tiempo</p>
                  <p className="font-semibold text-[#0D1B2A]">{hr.tiempoHoras > 0 ? `${hr.tiempoHoras}h` : "—"}</p>
                </div>
                {/* Progress bar */}
                <div className="w-24">
                  <div className="h-1.5 bg-[#EBF5FB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1B4F72] rounded-full"
                      style={{ width: `${(hr.entregasCompletadas / hr.entregasTotales) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#5D6D7E] text-right mt-0.5">
                    {Math.round((hr.entregasCompletadas / hr.entregasTotales) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white w-full sm:w-96 sm:h-full sm:max-h-screen overflow-y-auto rounded-t-lg sm:rounded-none shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#BDC3C7] bg-[#0D1B2A]">
              <div>
                <p className="font-mono font-semibold text-white text-sm">{selected.hojaRutaId}</p>
                <p className="text-[#BDC3C7] text-xs">{selected.clienteNombre}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#BDC3C7] hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Vehículo", value: selected.vehiculoPatente },
                  { label: "Conductor", value: selected.conductorNombre },
                  { label: "Fecha", value: selected.fechaPlanificada },
                  { label: "Estado", value: STATUS_LABELS[selected.estado] },
                  { label: "Km Recorridos", value: selected.kmRecorridos > 0 ? `${selected.kmRecorridos} km` : "—" },
                  { label: "Tiempo", value: selected.tiempoHoras > 0 ? `${selected.tiempoHoras}h` : "—" },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[#5D6D7E] text-xs">{f.label}</p>
                    <p className="font-medium text-[#0D1B2A]">{f.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="font-semibold text-[#0D1B2A] text-sm mb-3">Puntos de Ruta ({selected.entregasCompletadas}/{selected.entregasTotales})</p>
                <div className="space-y-2">
                  {selected.puntosRuta.map((p, idx) => (
                    <div key={idx} className={`flex items-center gap-3 p-2 rounded text-sm ${p.completado ? "bg-[#f0faf5]" : "bg-[#F4F6F7]"}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${p.completado ? "bg-[#27AE60]" : "border-2 border-[#BDC3C7]"}`}>
                        {p.completado && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span className={p.completado ? "text-[#27AE60]" : "text-[#0D1B2A]"}>{p.descripcion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0D1B2A]">Importar Hoja de Ruta (Excel)</h2>
              <button onClick={() => setShowImport(false)} className="text-[#5D6D7E]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="border-2 border-dashed border-[#BDC3C7] rounded-lg p-8 text-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5D6D7E" strokeWidth="1.5" className="mx-auto mb-3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p className="text-sm text-[#5D6D7E] mb-2">Arrastre el archivo Excel aquí</p>
              <p className="text-xs text-[#BDC3C7] mb-3">o</p>
              <button className="px-4 py-2 bg-[#EBF5FB] text-[#1B4F72] text-sm font-medium rounded border border-[#1B4F72] hover:bg-[#1B4F72] hover:text-white transition-colors">
                Seleccionar archivo
              </button>
              <p className="text-xs text-[#BDC3C7] mt-3">.xlsx, .xls — máx. 10MB</p>
            </div>
            <p className="text-xs text-[#5D6D7E] mb-4">
              Columnas esperadas: hoja_ruta_id, cliente, origen, destino_1...destino_N, fecha_planificada, vehiculo (opcional), conductor (opcional)
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowImport(false)} className="px-4 py-2 border border-[#BDC3C7] text-[#5D6D7E] rounded text-sm">Cancelar</button>
              <button className="px-4 py-2 bg-[#1B4F72] text-white rounded text-sm font-semibold hover:bg-[#154060]">Importar</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
