import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  return { user };
}

// ── Types ────────────────────────────────────────────────────────────────────
type Status = "pendiente" | "en_transito" | "entregado";
type OpType =
  | "distribucion"
  | "puerto_pallets"
  | "puerto_contenedor_20"
  | "puerto_contenedor_40"
  | "puerto_isotanque"
  | "material_tecnico";
type ChecklistPhase = "pre_viaje" | "durante_viaje" | "post_viaje";

interface ChecklistItem {
  pregunta: string;
  completado: boolean;
}

interface Trip {
  id: string;
  numeroOrden: string;
  tipoOperacion: OpType;
  estado: Status;
  clienteNombre: string;
  vehiculoPatente: string;
  origen: string;
  destino: string;
  fechaPlanificada: string;
  hazmat: boolean;
  unNumber?: string;
  descripcionCarga?: string;
  entregasCompletadas?: number;
  entregasTotales?: number;
}

const OP_LABELS: Record<OpType, string> = {
  distribucion: "Distribución",
  puerto_pallets: "Puerto · Pallets",
  puerto_contenedor_20: "Puerto · Contenedor 20ft",
  puerto_contenedor_40: "Puerto · Contenedor 40ft",
  puerto_isotanque: "Puerto · Isotanque",
  material_tecnico: "Material Técnico",
};

const STATUS_LABELS: Record<Status, string> = {
  pendiente: "Pendiente",
  en_transito: "En Tránsito",
  entregado: "Entregado",
};

const STATUS_CLASSES: Record<Status, string> = {
  pendiente: "badge-pendiente",
  en_transito: "badge-transito",
  entregado: "badge-entregado",
};

const CHECKLIST_TEMPLATES: Record<ChecklistPhase, string[]> = {
  pre_viaje: [
    "¿Verificó nivel de aceite?",
    "¿Verificó nivel de agua?",
    "¿Verificó presión de neumáticos?",
    "¿Verificó luces delanteras y traseras?",
    "¿Cuenta con documentación de carga HAZMAT?",
    "¿Verificó estado de la carga/contenedor?",
    "¿Equipo de emergencia en buen estado?",
  ],
  durante_viaje: [
    "¿Estado de la carga sin novedades?",
    "¿Vehículo funcionando correctamente?",
  ],
  post_viaje: [
    "¿Carga entregada conforme?",
    "¿Documentación firmada por el receptor?",
    "¿Vehículo sin daños tras el viaje?",
    "¿Se registraron novedades durante el viaje?",
  ],
};

const PHASE_LABELS: Record<ChecklistPhase, string> = {
  pre_viaje: "Pre-Viaje",
  durante_viaje: "En Ruta",
  post_viaje: "Post-Viaje",
};

// Mock assigned trips — in production from GET /api/my-trips
const MOCK_TRIPS: Trip[] = [
  {
    id: "1",
    numeroOrden: "ORD-DEMO-0002",
    tipoOperacion: "puerto_contenedor_20",
    estado: "en_transito",
    clienteNombre: "BASF Argentina",
    vehiculoPatente: "ET-002-ET",
    origen: "Terminal Puerto BA",
    destino: "Planta Campana",
    fechaPlanificada: "2026-06-17",
    hazmat: true,
    unNumber: "UN1789",
    descripcionCarga: "Ácido clorhídrico — Clase 8 (Corrosivo)",
  },
  {
    id: "2",
    numeroOrden: "ORD-DEMO-0005",
    tipoOperacion: "distribucion",
    estado: "pendiente",
    clienteNombre: "Dow Chemical Argentina",
    vehiculoPatente: "ET-002-ET",
    origen: "Planta Zárate",
    destino: "Hoja de Ruta · 5 puntos",
    fechaPlanificada: "2026-06-18",
    hazmat: true,
    unNumber: "UN1830",
    descripcionCarga: "Ácido sulfúrico — Clase 8 (Corrosivo)",
    entregasCompletadas: 0,
    entregasTotales: 5,
  },
  {
    id: "3",
    numeroOrden: "ORD-DEMO-0009",
    tipoOperacion: "material_tecnico",
    estado: "pendiente",
    clienteNombre: "YPF S.A.",
    vehiculoPatente: "ET-002-ET",
    origen: "Depósito Central",
    destino: "Refinería La Plata",
    fechaPlanificada: "2026-06-19",
    hazmat: false,
    descripcionCarga: "Equipo técnico de bombeo",
  },
];

// ── Icons ────────────────────────────────────────────────────────────────────
const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const WrenchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function ConductorMobileView() {
  const { user } = useLoaderData<typeof loader>();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [activePhase, setActivePhase] = useState<ChecklistPhase | null>(null);
  const [checklistState, setChecklistState] = useState<ChecklistItem[]>([]);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function openChecklist(phase: ChecklistPhase) {
    setActivePhase(phase);
    setChecklistState(CHECKLIST_TEMPLATES[phase].map((q) => ({ pregunta: q, completado: false })));
  }

  function toggleItem(idx: number) {
    setChecklistState((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, completado: !it.completado } : it))
    );
  }

  const allChecked = checklistState.length > 0 && checklistState.every((i) => i.completado);

  // ── Checklist screen ──────────────────────────────────────────────────────
  if (selectedTrip && activePhase) {
    return (
      <div className="min-h-screen bg-[#F4F6F7] flex flex-col">
        <MobileHeader
          title={`Checklist ${PHASE_LABELS[activePhase]}`}
          onBack={() => setActivePhase(null)}
        />
        <div className="flex-1 overflow-y-auto p-4 pb-28">
          <div className="bg-white rounded-lg p-3 mb-4 shadow-sm">
            <p className="text-xs text-[#5D6D7E]">{selectedTrip.numeroOrden}</p>
            <p className="text-sm font-semibold text-[#0D1B2A]">{selectedTrip.clienteNombre}</p>
          </div>
          <div className="space-y-2">
            {checklistState.map((item, idx) => (
              <button
                key={idx}
                onClick={() => toggleItem(idx)}
                className={`w-full flex items-center gap-3 p-4 rounded-lg text-left transition-colors ${
                  item.completado ? "bg-[#EAFAF1] border border-[#27AE60]" : "bg-white border border-[#BDC3C7]"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    item.completado ? "bg-[#27AE60] text-white" : "bg-[#F4F6F7] text-transparent border border-[#BDC3C7]"
                  }`}
                >
                  <CheckIcon />
                </span>
                <span className={`text-sm ${item.completado ? "text-[#0D1B2A] font-medium" : "text-[#5D6D7E]"}`}>
                  {item.pregunta}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#BDC3C7]">
          <button
            disabled={!allChecked}
            onClick={() => {
              showToast(`Checklist ${PHASE_LABELS[activePhase]} completado`);
              setActivePhase(null);
            }}
            className={`w-full py-3 rounded-lg text-sm font-semibold ${
              allChecked ? "bg-[#1B4F72] text-white" : "bg-[#BDC3C7] text-white"
            }`}
          >
            {allChecked ? "Confirmar Checklist" : `Faltan ${checklistState.filter((i) => !i.completado).length} ítems`}
          </button>
        </div>
        {toast && <Toast message={toast} />}
      </div>
    );
  }

  // ── Trip detail screen ────────────────────────────────────────────────────
  if (selectedTrip) {
    return (
      <div className="min-h-screen bg-[#F4F6F7] flex flex-col">
        <MobileHeader title="Orden de Servicio" onBack={() => setSelectedTrip(null)} />
        <div className="flex-1 overflow-y-auto p-4 pb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-semibold text-[#0D1B2A]">{selectedTrip.numeroOrden}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[selectedTrip.estado]}`}>
                {STATUS_LABELS[selectedTrip.estado]}
              </span>
            </div>
            <p className="text-xs text-[#1B4F72] font-medium mb-3">{OP_LABELS[selectedTrip.tipoOperacion]}</p>
            <p className="text-base font-semibold text-[#0D1B2A] mb-3">{selectedTrip.clienteNombre}</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-[#5D6D7E]">
                <span className="text-[#27AE60] mt-0.5"><MapPinIcon /></span>
                <div><span className="text-[10px] uppercase tracking-wide text-[#5D6D7E]">Origen</span><p className="text-[#0D1B2A]">{selectedTrip.origen}</p></div>
              </div>
              <div className="flex items-start gap-2 text-[#5D6D7E]">
                <span className="text-[#C0392B] mt-0.5"><MapPinIcon /></span>
                <div><span className="text-[10px] uppercase tracking-wide text-[#5D6D7E]">Destino</span><p className="text-[#0D1B2A]">{selectedTrip.destino}</p></div>
              </div>
              <div className="flex items-center gap-2 pt-1 text-[#5D6D7E]">
                <TruckIcon />
                <span className="text-[#0D1B2A] font-mono">{selectedTrip.vehiculoPatente}</span>
                <span className="text-xs">· {selectedTrip.fechaPlanificada}</span>
              </div>
            </div>

            {selectedTrip.descripcionCarga && (
              <div className="mt-3 pt-3 border-t border-[#EBEDEF]">
                <span className="text-[10px] uppercase tracking-wide text-[#5D6D7E]">Carga</span>
                <p className="text-sm text-[#0D1B2A]">{selectedTrip.descripcionCarga}</p>
              </div>
            )}

            {selectedTrip.hazmat && (
              <div className="mt-3 flex items-center gap-2 bg-[#FEF5E7] border border-[#E8702A] rounded p-2">
                <span className="text-[#E8702A]"><AlertIcon /></span>
                <div>
                  <span className="text-xs font-semibold text-[#B9651E]">Carga Peligrosa (HAZMAT)</span>
                  {selectedTrip.unNumber && <p className="text-xs text-[#B9651E] font-mono">{selectedTrip.unNumber}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Checklists */}
          <p className="text-xs font-semibold uppercase tracking-widest text-[#5D6D7E] mb-2 px-1">Checklists de Viaje</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(["pre_viaje", "durante_viaje", "post_viaje"] as ChecklistPhase[]).map((phase) => (
              <button
                key={phase}
                onClick={() => openChecklist(phase)}
                className="bg-white border border-[#BDC3C7] rounded-lg p-3 text-center hover:border-[#1B4F72]"
              >
                <p className="text-xs font-semibold text-[#0D1B2A]">{PHASE_LABELS[phase]}</p>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => setIncidentOpen(true)}
              className="w-full flex items-center gap-3 bg-white border border-[#BDC3C7] rounded-lg p-4 text-left hover:border-[#E8702A]"
            >
              <span className="text-[#E8702A]"><AlertIcon /></span>
              <span className="text-sm font-medium text-[#0D1B2A]">Reportar Novedad / Incidente</span>
            </button>
            <button
              onClick={() => setMaintenanceOpen(true)}
              className="w-full flex items-center gap-3 bg-white border border-[#BDC3C7] rounded-lg p-4 text-left hover:border-[#1B4F72]"
            >
              <span className="text-[#1B4F72]"><WrenchIcon /></span>
              <span className="text-sm font-medium text-[#0D1B2A]">Solicitar Mantenimiento</span>
            </button>
            {selectedTrip.estado === "pendiente" && (
              <button
                onClick={() => { showToast("Viaje iniciado"); setSelectedTrip(null); }}
                className="w-full py-3 bg-[#1B4F72] text-white rounded-lg text-sm font-semibold mt-2"
              >
                Iniciar Viaje
              </button>
            )}
            {selectedTrip.estado === "en_transito" && (
              <button
                onClick={() => { showToast("Viaje marcado como entregado"); setSelectedTrip(null); }}
                className="w-full py-3 bg-[#27AE60] text-white rounded-lg text-sm font-semibold mt-2"
              >
                Finalizar Viaje
              </button>
            )}
          </div>
        </div>

        {incidentOpen && (
          <ReportSheet
            title="Reportar Novedad"
            placeholder="Describa la novedad o incidente ocurrido durante el viaje..."
            confirmLabel="Enviar Reporte"
            onClose={() => setIncidentOpen(false)}
            onConfirm={() => { setIncidentOpen(false); showToast("Novedad reportada a Operaciones"); }}
          />
        )}
        {maintenanceOpen && (
          <ReportSheet
            title="Solicitar Mantenimiento"
            placeholder="Describa la falla o el mantenimiento requerido del camión..."
            confirmLabel="Enviar Solicitud"
            onClose={() => setMaintenanceOpen(false)}
            onConfirm={() => { setMaintenanceOpen(false); showToast("Solicitud de mantenimiento enviada"); }}
          />
        )}
        {toast && <Toast message={toast} />}
      </div>
    );
  }

  // ── Trip list (home) screen ───────────────────────────────────────────────
  const activeTrips = MOCK_TRIPS.filter((t) => t.estado !== "entregado");

  return (
    <div className="min-h-screen bg-[#F4F6F7] flex flex-col">
      {/* Header */}
      <header className="bg-[#0D1B2A] px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1B4F72] rounded flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">EterFleet</p>
            <p className="text-[#5D6D7E] text-[10px]">Portal Conductor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#BDC3C7] text-xs">{user.username}</span>
          <form action="/auth/logout" method="post">
            <button type="submit" className="text-[#5D6D7E] hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </form>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-[#0D1B2A]">Mis Órdenes de Servicio</h1>
          <p className="text-sm text-[#5D6D7E]">{activeTrips.length} viaje(s) asignado(s)</p>
        </div>

        {activeTrips.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-[#5D6D7E] text-sm">
            No tiene viajes asignados.
          </div>
        ) : (
          <div className="space-y-3">
            {activeTrips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => setSelectedTrip(trip)}
                className="w-full bg-white rounded-lg p-4 shadow-sm text-left active:bg-[#EBF5FB]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-semibold text-[#0D1B2A]">{trip.numeroOrden}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[trip.estado]}`}>
                    {STATUS_LABELS[trip.estado]}
                  </span>
                </div>
                <p className="text-xs text-[#1B4F72] font-medium mb-1">{OP_LABELS[trip.tipoOperacion]}</p>
                <p className="text-sm font-semibold text-[#0D1B2A] mb-2">{trip.clienteNombre}</p>
                <div className="flex items-center gap-2 text-xs text-[#5D6D7E]">
                  <MapPinIcon />
                  <span className="truncate">{trip.origen} → {trip.destino}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-[#5D6D7E]"><TruckIcon /> {trip.vehiculoPatente}</span>
                  {trip.hazmat && (
                    <span className="flex items-center gap-1 text-xs text-[#E8702A] font-medium">
                      <AlertIcon /> HAZMAT
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {toast && <Toast message={toast} />}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MobileHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="bg-[#0D1B2A] px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
      <button onClick={onBack} className="text-white">
        <BackIcon />
      </button>
      <h1 className="text-white text-sm font-semibold">{title}</h1>
    </header>
  );
}

function ReportSheet({
  title,
  placeholder,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  placeholder: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-[#0D1B2A] mb-3">{title}</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-3 py-2 border border-[#BDC3C7] rounded-lg text-sm focus:outline-none focus:border-[#1B4F72] resize-none mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-[#BDC3C7] text-[#5D6D7E] rounded-lg text-sm font-medium">
            Cancelar
          </button>
          <button
            disabled={!text.trim()}
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold text-white ${
              text.trim() ? "bg-[#1B4F72]" : "bg-[#BDC3C7]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#0D1B2A] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
      <span className="text-[#27AE60]"><CheckIcon /></span>
      {message}
    </div>
  );
}
