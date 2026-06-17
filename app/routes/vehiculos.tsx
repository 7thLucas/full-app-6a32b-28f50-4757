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

type VehicleStatus = "disponible" | "en_viaje" | "mantenimiento" | "inactivo";
type VehicleType = "camion" | "semi_remolque" | "cisterna" | "isotanque" | "chasis" | "otro";

interface Vehicle {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: VehicleType;
  estado: VehicleStatus;
  capacidadTon: number;
}

const TYPE_LABELS: Record<VehicleType, string> = {
  camion: "Camión",
  semi_remolque: "Semi-remolque",
  cisterna: "Cisterna",
  isotanque: "Isotanque",
  chasis: "Chasis",
  otro: "Otro",
};

const STATUS_LABELS: Record<VehicleStatus, string> = {
  disponible: "Disponible",
  en_viaje: "En Viaje",
  mantenimiento: "Mantenimiento",
  inactivo: "Inactivo",
};

const STATUS_CLASSES: Record<VehicleStatus, string> = {
  disponible: "badge-entregado",
  en_viaje: "badge-transito",
  mantenimiento: "badge-pendiente",
  inactivo: "badge-cancelado",
};

// Generate mock 35 vehicles
const MOCK_VEHICLES: Vehicle[] = Array.from({ length: 35 }, (_, i) => {
  const tipos: VehicleType[] = ["camion", "semi_remolque", "cisterna", "isotanque", "chasis"];
  const marcas = ["Mercedes-Benz", "Scania", "Volvo", "Iveco", "MAN"];
  const statuses: VehicleStatus[] = ["disponible", "disponible", "disponible", "en_viaje", "mantenimiento"];
  return {
    id: String(i + 1),
    patente: `ET-${String(i + 1).padStart(3, "0")}-ET`,
    marca: marcas[i % marcas.length],
    modelo: `Actros ${2000 + (i % 5)}`,
    anio: 2015 + (i % 9),
    tipo: tipos[i % tipos.length],
    estado: i < 5 ? "en_viaje" : i < 7 ? "mantenimiento" : "disponible",
    capacidadTon: 20 + (i % 10),
  };
});

export default function VehiculosPage() {
  const { user } = useLoaderData<typeof loader>();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | "">("");
  const [filterType, setFilterType] = useState<VehicleType | "">("");
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = MOCK_VEHICLES.filter((v) => {
    if (search && !v.patente.toLowerCase().includes(search.toLowerCase()) && !v.marca.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && v.estado !== filterStatus) return false;
    if (filterType && v.tipo !== filterType) return false;
    return true;
  });

  const countByStatus = (s: VehicleStatus) => MOCK_VEHICLES.filter((v) => v.estado === s).length;

  return (
    <AppShell title="Gestión de Flota — Vehículos" user={user}>
      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(["disponible", "en_viaje", "mantenimiento", "inactivo"] as VehicleStatus[]).map((s) => (
          <div
            key={s}
            className="bg-white rounded-lg px-4 py-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            style={{ borderLeft: `3px solid ${s === "disponible" ? "#27AE60" : s === "en_viaje" ? "#2980B9" : s === "mantenimiento" ? "#F39C12" : "#E74C3C"}` }}
            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
          >
            <p className="text-[#5D6D7E] text-xs">{STATUS_LABELS[s]}</p>
            <p className="text-2xl font-semibold text-[#0D1B2A]">{countByStatus(s)}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por patente o marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as VehicleStatus | "")}
          className="px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
        >
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="en_viaje">En Viaje</option>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as VehicleType | "")}
          className="px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-[#1B4F72] text-white text-sm font-semibold rounded hover:bg-[#154060] flex items-center gap-2"
        >
          + Agregar Vehículo
        </button>
      </div>

      <p className="text-xs text-[#5D6D7E] mb-3">{filtered.length} de {MOCK_VEHICLES.length} vehículos</p>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0D1B2A] text-[#BDC3C7] text-xs">
                <th className="px-4 py-3 text-left font-medium">Patente</th>
                <th className="px-4 py-3 text-left font-medium">Marca / Modelo</th>
                <th className="px-4 py-3 text-left font-medium">Año</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Cap. (ton)</th>
                <th className="px-4 py-3 text-left font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, idx) => (
                <tr key={v.id} className={`border-t border-[#BDC3C7] hover:bg-[#EBF5FB] ${idx % 2 === 0 ? "bg-white" : "bg-[#F4F6F7]"}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-[#0D1B2A]">{v.patente}</span>
                  </td>
                  <td className="px-4 py-3 text-[#0D1B2A] text-xs">
                    <span className="font-medium">{v.marca}</span>
                    <span className="text-[#5D6D7E] ml-1">{v.modelo}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{v.anio}</td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{TYPE_LABELS[v.tipo]}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[v.estado]}`}>
                      {STATUS_LABELS[v.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#0D1B2A]">{v.capacidadTon}t</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 text-[#5D6D7E] hover:bg-[#EBF5FB] rounded" title="Editar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0D1B2A]">Nuevo Vehículo</h2>
              <button onClick={() => setShowNewModal(false)} className="text-[#5D6D7E] hover:text-[#0D1B2A]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Patente", type: "text", placeholder: "Ej: ET-036-ET" },
                { label: "Marca", type: "text", placeholder: "Ej: Mercedes-Benz" },
                { label: "Modelo", type: "text", placeholder: "Ej: Actros 2660" },
                { label: "Año", type: "number", placeholder: "Ej: 2022" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-[#0D1B2A] text-sm mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
                </div>
              ))}
              <div>
                <label className="block text-[#0D1B2A] text-sm mb-1">Tipo</label>
                <select className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 border border-[#BDC3C7] text-[#5D6D7E] rounded text-sm">Cancelar</button>
              <button className="px-4 py-2 bg-[#1B4F72] text-white rounded text-sm font-semibold hover:bg-[#154060]">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
