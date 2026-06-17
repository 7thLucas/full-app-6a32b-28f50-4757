import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  return { user };
}

interface MaterialTrip {
  id: string;
  numeroOrden: string;
  clienteNombre: string;
  descripcionMaterial: string;
  origen: string;
  destino: string;
  vehiculoPatente: string;
  conductorNombre: string;
  fechaPlanificada: string;
  estado: "pendiente" | "en_transito" | "entregado";
  kmRecorridos: number;
  importeEstimado: number;
  prefacturaGenerada: boolean;
}

const MOCK_MATERIAL: MaterialTrip[] = [
  { id: "1", numeroOrden: "ORD-DEMO-0004", clienteNombre: "Petronas Quimicos Argentina", descripcionMaterial: "Bomba centrífuga industrial + accesorios de montaje", origen: "Planta La Plata", destino: "Terminal TRP Zárate", vehiculoPatente: "ET-004-ET", conductorNombre: "Eduardo López", fechaPlanificada: "2026-06-18", estado: "pendiente", kmRecorridos: 0, importeEstimado: 38500, prefacturaGenerada: false },
  { id: "2", numeroOrden: "ORD-DEMO-0020", clienteNombre: "YPF S.A.", descripcionMaterial: "Intercambiador de calor — traslado para mantenimiento", origen: "Refinería La Plata", destino: "Taller Especializado BA", vehiculoPatente: "ET-011-ET", conductorNombre: "Jorge Martínez", fechaPlanificada: "2026-06-17", estado: "en_transito", kmRecorridos: 55, importeEstimado: 42000, prefacturaGenerada: false },
  { id: "3", numeroOrden: "ORD-DEMO-0021", clienteNombre: "Dow Chemical Argentina", descripcionMaterial: "Reactores de laboratorio — traslado interzonal", origen: "Centro Técnico Zárate", destino: "Laboratorio Buenos Aires", vehiculoPatente: "ET-014-ET", conductorNombre: "Roberto González", fechaPlanificada: "2026-06-15", estado: "entregado", kmRecorridos: 120, importeEstimado: 55000, prefacturaGenerada: true },
];

const STATUS_CLASSES = { pendiente: "badge-pendiente", en_transito: "badge-transito", entregado: "badge-entregado" };
const STATUS_LABELS = { pendiente: "Pendiente", en_transito: "En Tránsito", entregado: "Entregado" };
const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function MaterialTecnicoPage() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <AppShell title="Operaciones — Material Técnico" user={user}>
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Viajes Semana", value: MOCK_MATERIAL.length, color: "#8E44AD" },
          { label: "En Tránsito", value: MOCK_MATERIAL.filter(t => t.estado === "en_transito").length, color: "#8E44AD" },
          { label: "Revenue Proyect.", value: fmt(MOCK_MATERIAL.reduce((s, t) => s + t.importeEstimado, 0)), color: "#8E44AD" },
          { label: "Prefacturas Pend.", value: MOCK_MATERIAL.filter(t => t.estado === "entregado" && !t.prefacturaGenerada).length, color: "#E8702A" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: `3px solid ${c.color}` }}>
            <p className="text-[#5D6D7E] text-xs">{c.label}</p>
            <p className="text-xl font-semibold mt-1" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button className="px-4 py-2 bg-[#8E44AD] text-white text-sm font-semibold rounded hover:bg-[#7d3c98] flex items-center gap-2">
          + Nuevo Viaje Material Técnico
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {MOCK_MATERIAL.map((t) => (
          <div key={t.id} className="bg-white rounded-lg p-5 shadow-sm" style={{ borderLeft: "3px solid #8E44AD" }}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono font-semibold text-[#8E44AD] text-sm">{t.numeroOrden}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[t.estado]}`}>
                    {STATUS_LABELS[t.estado]}
                  </span>
                  {t.prefacturaGenerada && (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-[#8E44AD22] text-[#8E44AD]">
                      Prefacturado
                    </span>
                  )}
                </div>
                <p className="font-semibold text-[#0D1B2A] text-sm">{t.clienteNombre}</p>
                <p className="text-[#5D6D7E] text-xs mt-1">{t.descripcionMaterial}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#5D6D7E]">
                  <span><strong className="text-[#0D1B2A]">Origen:</strong> {t.origen}</span>
                  <span><strong className="text-[#0D1B2A]">Destino:</strong> {t.destino}</span>
                  <span><strong className="text-[#0D1B2A]">Fecha:</strong> {t.fechaPlanificada}</span>
                  <span><strong className="text-[#0D1B2A]">Vehículo:</strong> <span className="font-mono">{t.vehiculoPatente}</span></span>
                  <span><strong className="text-[#0D1B2A]">Conductor:</strong> {t.conductorNombre}</span>
                  {t.kmRecorridos > 0 && <span><strong className="text-[#0D1B2A]">Km:</strong> {t.kmRecorridos}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#5D6D7E] text-xs">Importe estimado</p>
                <p className="font-mono font-semibold text-[#0D1B2A] text-base">{fmt(t.importeEstimado)}</p>
                <div className="flex gap-2 mt-2 justify-end">
                  <button className="p-1.5 text-[#5D6D7E] hover:bg-[#F4F6F7] rounded" title="Editar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  {t.estado === "entregado" && !t.prefacturaGenerada && (
                    <button className="px-2 py-1 text-xs font-semibold text-[#8E44AD] border border-[#8E44AD] rounded hover:bg-[#8E44AD] hover:text-white transition-colors">
                      Generar Prefactura
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
