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

interface Client {
  id: string;
  razonSocial: string;
  cuit: string;
  ciudad: string;
  provincia: string;
  telefono: string;
  email: string;
  contacto: string;
  tarifaBaseKm: number;
  activo: boolean;
  totalEnvios: number;
}

const MOCK_CLIENTS: Client[] = [
  { id: "1", razonSocial: "Dow Chemical Argentina S.A.", cuit: "30-50000001-1", ciudad: "Buenos Aires", provincia: "Buenos Aires", telefono: "11-4800-1000", email: "logistica@dow.com.ar", contacto: "Ing. María García", tarifaBaseKm: 380, activo: true, totalEnvios: 42 },
  { id: "2", razonSocial: "BASF Argentina S.A.", cuit: "30-50000002-2", ciudad: "Zárate", provincia: "Buenos Aires", telefono: "11-4800-2000", email: "supply@basf.com.ar", contacto: "Sr. Juan Pérez", tarifaBaseKm: 350, activo: true, totalEnvios: 31 },
  { id: "3", razonSocial: "YPF S.A.", cuit: "30-50000003-3", ciudad: "La Plata", provincia: "Buenos Aires", telefono: "11-4800-3000", email: "logistica@ypf.com.ar", contacto: "Lic. Ana López", tarifaBaseKm: 400, activo: true, totalEnvios: 28 },
  { id: "4", razonSocial: "Petronas Quimicos Argentina", cuit: "30-50000004-4", ciudad: "Ensenada", provincia: "Buenos Aires", telefono: "11-4800-4000", email: "ops@petronas.com.ar", contacto: "Mr. Aziz Rahman", tarifaBaseKm: 360, activo: true, totalEnvios: 19 },
  { id: "5", razonSocial: "Bayer CropScience S.A.", cuit: "30-50000005-5", ciudad: "Buenos Aires", provincia: "Buenos Aires", telefono: "11-4800-5000", email: "transport@bayer.com.ar", contacto: "Dra. Paula Moreno", tarifaBaseKm: 370, activo: true, totalEnvios: 15 },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

export default function ClientesPage() {
  const { user } = useLoaderData<typeof loader>();
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = MOCK_CLIENTS.filter((c) =>
    !search ||
    c.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
    c.cuit.includes(search)
  );

  return (
    <AppShell title="Administración — Clientes" user={user}>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por razón social o CUIT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
        />
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-[#1B4F72] text-white text-sm font-semibold rounded hover:bg-[#154060] flex items-center gap-2"
        >
          + Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0D1B2A] text-[#BDC3C7] text-xs">
              <th className="px-4 py-3 text-left font-medium">Razón Social</th>
              <th className="px-4 py-3 text-left font-medium">CUIT</th>
              <th className="px-4 py-3 text-left font-medium">Ciudad</th>
              <th className="px-4 py-3 text-left font-medium">Contacto</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Tarifa/km</th>
              <th className="px-4 py-3 text-left font-medium">Envíos</th>
              <th className="px-4 py-3 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => (
              <tr key={c.id} className={`border-t border-[#BDC3C7] hover:bg-[#EBF5FB] ${idx % 2 === 0 ? "bg-white" : "bg-[#F4F6F7]"}`}>
                <td className="px-4 py-3 font-medium text-[#0D1B2A] text-xs">{c.razonSocial}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#5D6D7E]">{c.cuit}</td>
                <td className="px-4 py-3 text-xs text-[#5D6D7E]">{c.ciudad}, {c.provincia}</td>
                <td className="px-4 py-3 text-xs text-[#0D1B2A]">{c.contacto}</td>
                <td className="px-4 py-3 text-xs text-[#5D6D7E]">{c.email}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#0D1B2A]">{formatCurrency(c.tarifaBaseKm)}</td>
                <td className="px-4 py-3 text-xs text-[#1B4F72] font-semibold">{c.totalEnvios}</td>
                <td className="px-4 py-3">
                  <button className="p-1.5 text-[#5D6D7E] hover:bg-[#EBF5FB] rounded" title="Editar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0D1B2A]">Nuevo Cliente</h2>
              <button onClick={() => setShowNewModal(false)} className="text-[#5D6D7E]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[#0D1B2A] text-sm mb-1">Razón Social <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div>
                <label className="block text-[#0D1B2A] text-sm mb-1">CUIT</label>
                <input type="text" placeholder="Ej: 30-12345678-1" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm font-mono focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0D1B2A] text-sm mb-1">Ciudad</label>
                  <input type="text" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
                </div>
                <div>
                  <label className="block text-[#0D1B2A] text-sm mb-1">Provincia</label>
                  <input type="text" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
                </div>
              </div>
              <div>
                <label className="block text-[#0D1B2A] text-sm mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
              </div>
              <div>
                <label className="block text-[#0D1B2A] text-sm mb-1">Tarifa base (ARS/km)</label>
                <input type="number" placeholder="Ej: 350" className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]" />
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
