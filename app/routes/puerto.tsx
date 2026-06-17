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

type PuertoSubType = "puerto_pallets" | "puerto_contenedor_20" | "puerto_contenedor_40" | "puerto_isotanque";

const SUB_TABS: { key: PuertoSubType; label: string; color: string }[] = [
  { key: "puerto_pallets", label: "Pallets", color: "#16A085" },
  { key: "puerto_contenedor_20", label: "Contenedor 20ft", color: "#1abc9c" },
  { key: "puerto_contenedor_40", label: "Contenedor 40ft", color: "#0e8471" },
  { key: "puerto_isotanque", label: "Isotanques", color: "#0a6058" },
];

interface PuertoTrip {
  id: string;
  numeroOrden: string;
  subtipo: PuertoSubType;
  clienteNombre: string;
  terminal: string;
  destino: string;
  vehiculoPatente: string;
  conductorNombre: string;
  fechaPlanificada: string;
  estado: "pendiente" | "en_transito" | "entregado";
  cantidadPallets?: number;
  numeroContenedor?: string;
  hazmat: boolean;
  importeEstimado: number;
}

const MOCK_PUERTO: PuertoTrip[] = [
  { id: "1", numeroOrden: "ORD-DEMO-0002", subtipo: "puerto_contenedor_20", clienteNombre: "BASF Argentina", terminal: "Terminal Buenos Aires", destino: "Planta Campana", vehiculoPatente: "ET-002-ET", conductorNombre: "Jorge Martínez", fechaPlanificada: "2026-06-17", estado: "en_transito", numeroContenedor: "BASC-2024001", hazmat: true, importeEstimado: 125000 },
  { id: "2", numeroOrden: "ORD-DEMO-0003", subtipo: "puerto_pallets", clienteNombre: "YPF S.A.", terminal: "Dock Sud", destino: "Puerto Quequén", vehiculoPatente: "ET-003-ET", conductorNombre: "Roberto González", fechaPlanificada: "2026-06-18", estado: "pendiente", cantidadPallets: 24, hazmat: false, importeEstimado: 68000 },
  { id: "3", numeroOrden: "ORD-DEMO-0005", subtipo: "puerto_isotanque", clienteNombre: "Bayer CropScience", terminal: "Terminal Puerto BA", destino: "Planta Zárate", vehiculoPatente: "ET-005-ET", conductorNombre: "Miguel Fernández", fechaPlanificada: "2026-06-17", estado: "en_transito", hazmat: true, importeEstimado: 95000 },
  { id: "4", numeroOrden: "ORD-DEMO-0007", subtipo: "puerto_contenedor_40", clienteNombre: "BASF Argentina", terminal: "Puerto Quequén", destino: "Planta Campana", vehiculoPatente: "ET-007-ET", conductorNombre: "Carlos Rodríguez", fechaPlanificada: "2026-06-19", estado: "pendiente", numeroContenedor: "BASQ-4024001", hazmat: true, importeEstimado: 145000 },
  { id: "5", numeroOrden: "ORD-DEMO-0011", subtipo: "puerto_pallets", clienteNombre: "Dow Chemical", terminal: "Terminal TRP", destino: "Depósito Luján", vehiculoPatente: "ET-009-ET", conductorNombre: "Raúl Díaz", fechaPlanificada: "2026-06-16", estado: "entregado", cantidadPallets: 18, hazmat: false, importeEstimado: 52000 },
];

const STATUS_CLASSES = { pendiente: "badge-pendiente", en_transito: "badge-transito", entregado: "badge-entregado" };
const STATUS_LABELS = { pendiente: "Pendiente", en_transito: "En Tránsito", entregado: "Entregado" };
const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function PuertoPage() {
  const { user } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<PuertoSubType>("puerto_pallets");

  const filtered = MOCK_PUERTO.filter((t) => t.subtipo === activeTab);
  const activeTabConfig = SUB_TABS.find((t) => t.key === activeTab)!;

  return (
    <AppShell title="Operaciones — Puerto" user={user}>
      {/* Sub-type tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SUB_TABS.map((tab) => {
          const count = MOCK_PUERTO.filter((t) => t.subtipo === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-white"
                  : "bg-white text-[#5D6D7E] hover:bg-[#EBF5FB] border border-[#BDC3C7]"
              }`}
              style={activeTab === tab.key ? { background: tab.color } : {}}
            >
              {tab.label}
              <span
                className="text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                style={activeTab === tab.key ? { background: "rgba(255,255,255,0.3)" } : { background: tab.color + "22", color: tab.color }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* KPI row for active sub-type */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Viajes Hoy", value: filtered.filter(t => t.fechaPlanificada === "2026-06-17").length },
          { label: "En Tránsito", value: filtered.filter(t => t.estado === "en_transito").length },
          { label: "Pendientes", value: filtered.filter(t => t.estado === "pendiente").length },
          { label: "Entregados (hoy)", value: filtered.filter(t => t.estado === "entregado").length },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: `3px solid ${activeTabConfig.color}` }}>
            <p className="text-[#5D6D7E] text-xs">{c.label}</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: activeTabConfig.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <button className="px-4 py-2 border border-[#BDC3C7] text-[#5D6D7E] text-sm rounded hover:bg-[#F4F6F7] flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Importar desde Excel
        </button>
        <button
          className="ml-auto px-4 py-2 text-white text-sm font-semibold rounded hover:opacity-90 flex items-center gap-2"
          style={{ background: activeTabConfig.color }}
        >
          + Nueva Operación Puerto
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#BDC3C7] text-xs" style={{ background: "#0D1B2A" }}>
                <th className="px-4 py-3 text-left font-medium">Orden</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Terminal</th>
                <th className="px-4 py-3 text-left font-medium">Destino</th>
                <th className="px-4 py-3 text-left font-medium">Vehículo / Conductor</th>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                {activeTab !== "puerto_pallets" && <th className="px-4 py-3 text-left font-medium">Nro. Contenedor</th>}
                {activeTab === "puerto_pallets" && <th className="px-4 py-3 text-left font-medium">Pallets</th>}
                <th className="px-4 py-3 text-left font-medium">HAZMAT</th>
                <th className="px-4 py-3 text-right font-medium">Importe Est.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => (
                <tr key={t.id} className={`border-t border-[#BDC3C7] hover:bg-[#EBF5FB] ${idx % 2 === 0 ? "bg-white" : "bg-[#F4F6F7]"}`}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: activeTabConfig.color }}>{t.numeroOrden}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[t.estado]}`}>
                      {STATUS_LABELS[t.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#0D1B2A] max-w-[140px] truncate">{t.clienteNombre}</td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{t.terminal}</td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{t.destino}</td>
                  <td className="px-4 py-3 text-xs text-[#0D1B2A]">
                    <span className="font-mono">{t.vehiculoPatente}</span>
                    <span className="text-[#5D6D7E] block">{t.conductorNombre}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{t.fechaPlanificada}</td>
                  {activeTab !== "puerto_pallets" && (
                    <td className="px-4 py-3 font-mono text-xs text-[#0D1B2A]">{t.numeroContenedor ?? "—"}</td>
                  )}
                  {activeTab === "puerto_pallets" && (
                    <td className="px-4 py-3 text-xs text-[#0D1B2A] font-semibold">{t.cantidadPallets ?? "—"}</td>
                  )}
                  <td className="px-4 py-3">
                    {t.hazmat && <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-[#E8702A22] text-[#E8702A]">⚠ HAZMAT</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-[#0D1B2A]">{fmt(t.importeEstimado)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-[#5D6D7E] text-sm">No hay operaciones en esta subcategoría.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
