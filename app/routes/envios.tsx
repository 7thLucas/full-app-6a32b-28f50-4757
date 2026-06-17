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

type Status = "pendiente" | "en_transito" | "entregado" | "cancelado";
type OpType =
  | "distribucion"
  | "puerto_pallets"
  | "puerto_contenedor_20"
  | "puerto_contenedor_40"
  | "puerto_isotanque"
  | "material_tecnico";

interface Shipment {
  id: string;
  numeroOrden: string;
  tipoOperacion: OpType;
  estado: Status;
  clienteNombre: string;
  vehiculoPatente: string;
  conductorNombre: string;
  origen: string;
  destino: string;
  fechaPlanificada: string;
  kmRecorridos: number;
  hazmat: boolean;
  prefacturaGenerada: boolean;
}

const OP_LABELS: Record<OpType, string> = {
  distribucion: "Distribución",
  puerto_pallets: "Puerto Pallets",
  puerto_contenedor_20: "Contenedor 20ft",
  puerto_contenedor_40: "Contenedor 40ft",
  puerto_isotanque: "Isotanque",
  material_tecnico: "Mat. Técnico",
};

const OP_COLORS: Record<OpType, string> = {
  distribucion: "#1B4F72",
  puerto_pallets: "#16A085",
  puerto_contenedor_20: "#1abc9c",
  puerto_contenedor_40: "#0e8471",
  puerto_isotanque: "#0a6058",
  material_tecnico: "#8E44AD",
};

const STATUS_LABELS: Record<Status, string> = {
  pendiente: "Pendiente",
  en_transito: "En Tránsito",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_CLASSES: Record<Status, string> = {
  pendiente: "badge-pendiente",
  en_transito: "badge-transito",
  entregado: "badge-entregado",
  cancelado: "badge-cancelado",
};

// Mock data
const MOCK_SHIPMENTS: Shipment[] = [
  { id: "1", numeroOrden: "ORD-DEMO-0001", tipoOperacion: "distribucion", estado: "entregado", clienteNombre: "Dow Chemical Argentina", vehiculoPatente: "ET-001-ET", conductorNombre: "Carlos Rodríguez", origen: "Planta Zárate", destino: "Cliente BA Centro", fechaPlanificada: "2026-06-17", kmRecorridos: 87, hazmat: true, prefacturaGenerada: true },
  { id: "2", numeroOrden: "ORD-DEMO-0002", tipoOperacion: "puerto_contenedor_20", estado: "en_transito", clienteNombre: "BASF Argentina", vehiculoPatente: "ET-002-ET", conductorNombre: "Jorge Martínez", origen: "Terminal Puerto BA", destino: "Planta Campana", fechaPlanificada: "2026-06-17", kmRecorridos: 115, hazmat: true, prefacturaGenerada: false },
  { id: "3", numeroOrden: "ORD-DEMO-0003", tipoOperacion: "puerto_pallets", estado: "pendiente", clienteNombre: "YPF S.A.", vehiculoPatente: "ET-003-ET", conductorNombre: "Roberto González", origen: "Dock Sud", destino: "Puerto Quequén", fechaPlanificada: "2026-06-18", kmRecorridos: 0, hazmat: false, prefacturaGenerada: false },
  { id: "4", numeroOrden: "ORD-DEMO-0004", tipoOperacion: "material_tecnico", estado: "pendiente", clienteNombre: "Petronas Quimicos", vehiculoPatente: "ET-004-ET", conductorNombre: "Eduardo López", origen: "Planta La Plata", destino: "Terminal TRP", fechaPlanificada: "2026-06-18", kmRecorridos: 0, hazmat: false, prefacturaGenerada: false },
  { id: "5", numeroOrden: "ORD-DEMO-0005", tipoOperacion: "puerto_isotanque", estado: "en_transito", clienteNombre: "Bayer CropScience", vehiculoPatente: "ET-005-ET", conductorNombre: "Miguel Fernández", origen: "Terminal Puerto BA", destino: "Planta Zárate", fechaPlanificada: "2026-06-17", kmRecorridos: 65, hazmat: true, prefacturaGenerada: false },
  { id: "6", numeroOrden: "ORD-DEMO-0006", tipoOperacion: "distribucion", estado: "entregado", clienteNombre: "Dow Chemical Argentina", vehiculoPatente: "ET-006-ET", conductorNombre: "Raúl Díaz", origen: "Planta Zárate", destino: "Depósito Luján", fechaPlanificada: "2026-06-16", kmRecorridos: 220, hazmat: true, prefacturaGenerada: true },
  { id: "7", numeroOrden: "ORD-DEMO-0007", tipoOperacion: "puerto_contenedor_40", estado: "pendiente", clienteNombre: "BASF Argentina", vehiculoPatente: "ET-007-ET", conductorNombre: "Carlos Rodríguez", origen: "Puerto Quequén", destino: "Planta Campana", fechaPlanificada: "2026-06-19", kmRecorridos: 0, hazmat: true, prefacturaGenerada: false },
];

function StatusBadge({ estado }: { estado: Status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[estado]}`}>
      {STATUS_LABELS[estado]}
    </span>
  );
}

function OpBadge({ tipo }: { tipo: OpType }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: OP_COLORS[tipo] + "22", color: OP_COLORS[tipo] }}
    >
      {OP_LABELS[tipo]}
    </span>
  );
}

export default function EnviosPage() {
  const { user } = useLoaderData<typeof loader>();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "">("");
  const [filterOp, setFilterOp] = useState<OpType | "">("");
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = MOCK_SHIPMENTS.filter((s) => {
    if (search && !s.numeroOrden.toLowerCase().includes(search.toLowerCase()) && !s.clienteNombre.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && s.estado !== filterStatus) return false;
    if (filterOp && s.tipoOperacion !== filterOp) return false;
    return true;
  });

  return (
    <AppShell title="Gestión de Envíos" user={user}>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por orden o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm text-[#0D1B2A] placeholder-[#5D6D7E] focus:outline-none focus:border-[#1B4F72] focus:ring-1 focus:ring-[#1B4F72]"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Status | "")}
          className="px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm text-[#0D1B2A] focus:outline-none focus:border-[#1B4F72]"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_transito">En Tránsito</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select
          value={filterOp}
          onChange={(e) => setFilterOp(e.target.value as OpType | "")}
          className="px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm text-[#0D1B2A] focus:outline-none focus:border-[#1B4F72]"
        >
          <option value="">Todas las operaciones</option>
          <option value="distribucion">Distribución</option>
          <option value="puerto_pallets">Puerto Pallets</option>
          <option value="puerto_contenedor_20">Contenedor 20ft</option>
          <option value="puerto_contenedor_40">Contenedor 40ft</option>
          <option value="puerto_isotanque">Isotanque</option>
          <option value="material_tecnico">Material Técnico</option>
        </select>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-[#1B4F72] text-white text-sm font-semibold rounded hover:bg-[#154060] transition-colors flex items-center gap-2"
        >
          <span>+</span>
          Nuevo Envío
        </button>
      </div>

      {/* Count */}
      <p className="text-xs text-[#5D6D7E] mb-3">{filtered.length} envío(s) encontrado(s)</p>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0D1B2A] text-[#BDC3C7] text-xs">
                <th className="px-4 py-3 text-left font-medium">Orden</th>
                <th className="px-4 py-3 text-left font-medium">Operación</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Vehículo</th>
                <th className="px-4 py-3 text-left font-medium">Conductor</th>
                <th className="px-4 py-3 text-left font-medium">Origen → Destino</th>
                <th className="px-4 py-3 text-left font-medium">Fecha Plan.</th>
                <th className="px-4 py-3 text-left font-medium">Km</th>
                <th className="px-4 py-3 text-left font-medium">HAZMAT</th>
                <th className="px-4 py-3 text-left font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr
                  key={s.id}
                  className={`border-t border-[#BDC3C7] hover:bg-[#EBF5FB] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-[#F4F6F7]"}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-[#1B4F72] font-medium text-xs">{s.numeroOrden}</span>
                  </td>
                  <td className="px-4 py-3">
                    <OpBadge tipo={s.tipoOperacion} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge estado={s.estado} />
                  </td>
                  <td className="px-4 py-3 text-[#0D1B2A] text-xs max-w-[140px] truncate">{s.clienteNombre}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[#0D1B2A]">{s.vehiculoPatente}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#0D1B2A]">{s.conductorNombre}</td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E] max-w-[180px]">
                    <span className="truncate block">{s.origen}</span>
                    <span className="text-[#BDC3C7]">→ {s.destino}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{s.fechaPlanificada}</td>
                  <td className="px-4 py-3 text-xs text-[#0D1B2A]">{s.kmRecorridos > 0 ? `${s.kmRecorridos} km` : "—"}</td>
                  <td className="px-4 py-3">
                    {s.hazmat && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#E8702A22] text-[#E8702A]">
                        ⚠ HAZMAT
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-[#1B4F72] hover:bg-[#EBF5FB] rounded" title="Ver detalle">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="p-1.5 text-[#5D6D7E] hover:bg-[#EBF5FB] rounded" title="Editar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {s.estado === "pendiente" && (
                        <button className="p-1.5 text-[#16A085] hover:bg-[#EBF5FB] rounded" title="Iniciar viaje">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-[#5D6D7E] text-sm">
                    No se encontraron envíos con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Shipment Modal */}
      {showNewModal && (
        <NewShipmentModal onClose={() => setShowNewModal(false)} />
      )}
    </AppShell>
  );
}

function NewShipmentModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#BDC3C7]">
          <h2 className="font-semibold text-[#0D1B2A]">Nuevo Envío</h2>
          <button onClick={onClose} className="text-[#5D6D7E] hover:text-[#0D1B2A]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Tipo de Operación <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]">
                <option value="">Seleccionar...</option>
                <option value="distribucion">Distribución</option>
                <option value="puerto_pallets">Puerto - Pallets</option>
                <option value="puerto_contenedor_20">Puerto - Contenedor 20ft</option>
                <option value="puerto_contenedor_40">Puerto - Contenedor 40ft</option>
                <option value="puerto_isotanque">Puerto - Isotanque</option>
                <option value="material_tecnico">Material Técnico</option>
              </select>
            </div>
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Cliente <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]">
                <option value="">Seleccionar cliente...</option>
                <option>Dow Chemical Argentina S.A.</option>
                <option>BASF Argentina S.A.</option>
                <option>YPF S.A.</option>
                <option>Petronas Quimicos Argentina</option>
                <option>Bayer CropScience S.A.</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Origen <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Ej: Planta Zárate" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
            </div>
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Destino <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Ej: Terminal TRP" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Vehículo</label>
              <select className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]">
                <option value="">Seleccionar vehículo...</option>
                {Array.from({ length: 35 }, (_, i) => (
                  <option key={i} value={`ET-${String(i + 1).padStart(3, "0")}-ET`}>
                    ET-{String(i + 1).padStart(3, "0")}-ET
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#0D1B2A] text-sm mb-1.5">Conductor</label>
              <select className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]">
                <option value="">Seleccionar conductor...</option>
                <option>Carlos Rodríguez</option>
                <option>Jorge Martínez</option>
                <option>Roberto González</option>
                <option>Eduardo López</option>
                <option>Miguel Fernández</option>
                <option>Raúl Díaz</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[#0D1B2A] text-sm mb-1.5">Fecha Planificada <span className="text-red-500">*</span></label>
            <input type="date" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
          </div>

          {/* HAZMAT section */}
          <div className="hazmat-section pt-2">
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8702A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span className="text-[#E8702A] text-sm font-semibold">Información HAZMAT</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[#0D1B2A] text-xs mb-1">Clase de Peligro</label>
                <select className="w-full px-2 py-1.5 border border-[#BDC3C7] rounded text-xs focus:outline-none focus:border-[#1B4F72]">
                  <option value="N/A">N/A</option>
                  <option value="1">Clase 1 — Explosivos</option>
                  <option value="2">Clase 2 — Gases</option>
                  <option value="3">Clase 3 — Líquidos inflamables</option>
                  <option value="4">Clase 4 — Sólidos inflamables</option>
                  <option value="5">Clase 5 — Sustancias oxidantes</option>
                  <option value="6">Clase 6 — Sustancias tóxicas</option>
                  <option value="8">Clase 8 — Sustancias corrosivas</option>
                  <option value="9">Clase 9 — Varios</option>
                </select>
              </div>
              <div>
                <label className="block text-[#0D1B2A] text-xs mb-1">Número UN</label>
                <input type="text" placeholder="Ej: UN 1203" className="w-full px-2 py-1.5 border border-[#BDC3C7] rounded text-xs font-mono focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div>
                <label className="block text-[#0D1B2A] text-xs mb-1">Nombre Propio</label>
                <input type="text" placeholder="Ej: Gasolina" className="w-full px-2 py-1.5 border border-[#BDC3C7] rounded text-xs focus:outline-none focus:border-[#1B4F72]" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#0D1B2A] text-sm mb-1.5">Descripción de Carga</label>
            <textarea rows={2} className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72] resize-none" placeholder="Descripción de la mercadería..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#BDC3C7] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-[#BDC3C7] text-[#5D6D7E] rounded text-sm hover:bg-[#F4F6F7]">
            Cancelar
          </button>
          <button className="px-4 py-2 bg-[#1B4F72] text-white rounded text-sm font-semibold hover:bg-[#154060]">
            Crear Envío
          </button>
        </div>
      </div>
    </div>
  );
}
