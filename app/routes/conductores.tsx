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

interface Driver {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  licencia: string;
  licenciaVencimiento: string;
  telefono: string;
  email: string;
  activo: boolean;
  viajesActivos: number;
}

const MOCK_DRIVERS: Driver[] = [
  { id: "1", nombre: "Carlos", apellido: "Rodríguez", dni: "22.345.678", licencia: "C1-0001", licenciaVencimiento: "2027-03-15", telefono: "11-4001-0001", email: "carlos.rodriguez@eter.com.ar", activo: true, viajesActivos: 1 },
  { id: "2", nombre: "Jorge", apellido: "Martínez", dni: "24.567.890", licencia: "C1-0002", licenciaVencimiento: "2026-11-20", telefono: "11-4001-0002", email: "jorge.martinez@eter.com.ar", activo: true, viajesActivos: 1 },
  { id: "3", nombre: "Roberto", apellido: "González", dni: "26.789.012", licencia: "C1-0003", licenciaVencimiento: "2028-05-10", telefono: "11-4001-0003", email: "roberto.gonzalez@eter.com.ar", activo: true, viajesActivos: 0 },
  { id: "4", nombre: "Eduardo", apellido: "López", dni: "28.901.234", licencia: "C1-0004", licenciaVencimiento: "2027-08-30", telefono: "11-4001-0004", email: "eduardo.lopez@eter.com.ar", activo: true, viajesActivos: 0 },
  { id: "5", nombre: "Miguel", apellido: "Fernández", dni: "30.123.456", licencia: "C1-0005", licenciaVencimiento: "2026-12-05", telefono: "11-4001-0005", email: "miguel.fernandez@eter.com.ar", activo: true, viajesActivos: 1 },
  { id: "6", nombre: "Raúl", apellido: "Díaz", dni: "32.345.678", licencia: "C1-0006", licenciaVencimiento: "2027-02-14", telefono: "11-4001-0006", email: "raul.diaz@eter.com.ar", activo: true, viajesActivos: 0 },
];

function isLicenseSoonExpiring(dateStr: string): boolean {
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < 90;
}

export default function ConductoresPage() {
  const { user } = useLoaderData<typeof loader>();
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = MOCK_DRIVERS.filter((d) =>
    !search ||
    `${d.nombre} ${d.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
    d.dni.includes(search)
  );

  return (
    <AppShell title="Conductores" user={user}>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
        />
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-[#1B4F72] text-white text-sm font-semibold rounded hover:bg-[#154060] flex items-center gap-2"
        >
          + Agregar Conductor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0D1B2A] text-[#BDC3C7] text-xs">
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">DNI</th>
              <th className="px-4 py-3 text-left font-medium">Licencia</th>
              <th className="px-4 py-3 text-left font-medium">Venc. Licencia</th>
              <th className="px-4 py-3 text-left font-medium">Teléfono</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
              <th className="px-4 py-3 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, idx) => {
              const soonExpiring = isLicenseSoonExpiring(d.licenciaVencimiento);
              return (
                <tr key={d.id} className={`border-t border-[#BDC3C7] hover:bg-[#EBF5FB] ${idx % 2 === 0 ? "bg-white" : "bg-[#F4F6F7]"}`}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#0D1B2A]">{d.apellido}, {d.nombre}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#5D6D7E]">{d.dni}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#0D1B2A]">{d.licencia}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={soonExpiring ? "text-[#E8702A] font-semibold" : "text-[#5D6D7E]"}>
                      {d.licenciaVencimiento}
                      {soonExpiring && " ⚠"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{d.telefono}</td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{d.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${d.viajesActivos > 0 ? "badge-transito" : "badge-entregado"}`}>
                      {d.viajesActivos > 0 ? "En Viaje" : "Disponible"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 text-[#5D6D7E] hover:bg-[#EBF5FB] rounded" title="Editar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0D1B2A]">Nuevo Conductor</h2>
              <button onClick={() => setShowNewModal(false)} className="text-[#5D6D7E]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0D1B2A] text-sm mb-1">Nombre <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
                </div>
                <div>
                  <label className="block text-[#0D1B2A] text-sm mb-1">Apellido <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
                </div>
              </div>
              <div>
                <label className="block text-[#0D1B2A] text-sm mb-1">DNI <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0D1B2A] text-sm mb-1">Nro. Licencia</label>
                  <input type="text" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
                </div>
                <div>
                  <label className="block text-[#0D1B2A] text-sm mb-1">Venc. Licencia</label>
                  <input type="date" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
                </div>
              </div>
              <div>
                <label className="block text-[#0D1B2A] text-sm mb-1">Teléfono</label>
                <input type="tel" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div>
                <label className="block text-[#0D1B2A] text-sm mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
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
