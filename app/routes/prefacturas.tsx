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

type PfStatus = "borrador" | "revisada" | "aprobada" | "exportada";

interface Prefactura {
  id: string;
  numeroPrefactura: string;
  numeroOrdenRef: string;
  clienteNombre: string;
  tipoOperacion: string;
  estado: PfStatus;
  fechaGeneracion: string;
  importeNeto: number;
  iva: number;
  total: number;
}

const STATUS_LABELS: Record<PfStatus, string> = {
  borrador: "Borrador",
  revisada: "Revisada",
  aprobada: "Aprobada",
  exportada: "Exportada",
};

const STATUS_CLASSES: Record<PfStatus, string> = {
  borrador: "badge-pendiente",
  revisada: "badge-transito",
  aprobada: "badge-entregado",
  exportada: "bg-[#8E44AD22] text-[#8E44AD]",
};

const MOCK_PREFACTURAS: Prefactura[] = [
  { id: "1", numeroPrefactura: "PRF-DEMO-0001", numeroOrdenRef: "ORD-DEMO-0001", clienteNombre: "Dow Chemical Argentina S.A.", tipoOperacion: "Distribución", estado: "aprobada", fechaGeneracion: "2026-06-17", importeNeto: 45250, iva: 9502.5, total: 54752.5 },
  { id: "2", numeroPrefactura: "PRF-DEMO-0002", numeroOrdenRef: "ORD-DEMO-0006", clienteNombre: "Dow Chemical Argentina S.A.", tipoOperacion: "Distribución", estado: "borrador", fechaGeneracion: "2026-06-16", importeNeto: 89400, iva: 18774, total: 108174 },
  { id: "3", numeroPrefactura: "PRF-DEMO-0003", numeroOrdenRef: "ORD-DEMO-0008", clienteNombre: "BASF Argentina S.A.", tipoOperacion: "Puerto - Contenedor 20ft", estado: "revisada", fechaGeneracion: "2026-06-15", importeNeto: 125000, iva: 26250, total: 151250 },
  { id: "4", numeroPrefactura: "PRF-DEMO-0004", numeroOrdenRef: "ORD-DEMO-0010", clienteNombre: "YPF S.A.", tipoOperacion: "Distribución", estado: "exportada", fechaGeneracion: "2026-06-14", importeNeto: 67200, iva: 14112, total: 81312 },
  { id: "5", numeroPrefactura: "PRF-DEMO-0005", numeroOrdenRef: "ORD-DEMO-0013", clienteNombre: "Petronas Quimicos", tipoOperacion: "Material Técnico", estado: "aprobada", fechaGeneracion: "2026-06-14", importeNeto: 38500, iva: 8085, total: 46585 },
  { id: "6", numeroPrefactura: "PRF-DEMO-0006", numeroOrdenRef: "ORD-DEMO-0015", clienteNombre: "Bayer CropScience S.A.", tipoOperacion: "Puerto - Isotanque", estado: "borrador", fechaGeneracion: "2026-06-13", importeNeto: 95000, iva: 19950, total: 114950 },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);

export default function PrefacturasPage() {
  const { user } = useLoaderData<typeof loader>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<PfStatus | "">("");
  const [detail, setDetail] = useState<Prefactura | null>(null);

  const filtered = MOCK_PREFACTURAS.filter((p) => !filterStatus || p.estado === filterStatus);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExportTango = () => {
    const rows = filtered
      .filter((p) => selected.size === 0 || selected.has(p.id))
      .filter((p) => p.estado === "aprobada" || p.estado === "revisada")
      .map((p) => ({
        cliente: p.clienteNombre,
        comprobante: p.numeroPrefactura,
        importe_neto: p.importeNeto,
        iva: p.iva,
        total: p.total,
        descripcion_servicios: `Servicio de transporte — ${p.tipoOperacion} — ${p.numeroOrdenRef}`,
        tipo_operacion: p.tipoOperacion,
      }));

    // Build CSV
    const headers = ["cliente", "comprobante", "importe_neto", "iva", "total", "descripcion_servicios", "tipo_operacion"];
    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tango-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalAprobadas = MOCK_PREFACTURAS.filter((p) => p.estado === "aprobada" || p.estado === "revisada").reduce((s, p) => s + p.total, 0);
  const totalBorrador = MOCK_PREFACTURAS.filter((p) => p.estado === "borrador").reduce((s, p) => s + p.total, 0);

  return (
    <AppShell title="Prefacturación" user={user}>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Aprobadas", value: formatCurrency(totalAprobadas), color: "#27AE60" },
          { label: "En Revisión", value: String(MOCK_PREFACTURAS.filter(p => p.estado === "revisada").length), color: "#2980B9" },
          { label: "Borradores", value: formatCurrency(totalBorrador), color: "#F39C12" },
          { label: "Exportadas (mes)", value: String(MOCK_PREFACTURAS.filter(p => p.estado === "exportada").length), color: "#8E44AD" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: `3px solid ${c.color}` }}>
            <p className="text-[#5D6D7E] text-xs mb-1">{c.label}</p>
            <p className="text-lg font-semibold text-[#0D1B2A]">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as PfStatus | "")}
          className="px-3 py-2 bg-white border border-[#BDC3C7] rounded text-sm text-[#0D1B2A] focus:outline-none focus:border-[#1B4F72]"
        >
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="revisada">Revisada</option>
          <option value="aprobada">Aprobada</option>
          <option value="exportada">Exportada</option>
        </select>
        <div className="ml-auto flex gap-2">
          {selected.size > 0 && (
            <span className="flex items-center text-xs text-[#5D6D7E]">{selected.size} seleccionada(s)</span>
          )}
          <button
            onClick={handleExportTango}
            className="px-4 py-2 bg-[#16A085] text-white text-sm font-semibold rounded hover:bg-[#127d67] transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar a Tango (CSV)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0D1B2A] text-[#BDC3C7] text-xs">
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(filtered.map((p) => p.id)));
                      else setSelected(new Set());
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Nro. Prefactura</th>
                <th className="px-4 py-3 text-left font-medium">Orden Ref.</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Tipo Op.</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-right font-medium">Importe Neto</th>
                <th className="px-4 py-3 text-right font-medium">IVA 21%</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} className={`border-t border-[#BDC3C7] hover:bg-[#EBF5FB] ${idx % 2 === 0 ? "bg-white" : "bg-[#F4F6F7]"}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[#1B4F72] font-medium text-xs">{p.numeroPrefactura}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#5D6D7E]">{p.numeroOrdenRef}</td>
                  <td className="px-4 py-3 text-xs text-[#0D1B2A] max-w-[160px] truncate">{p.clienteNombre}</td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{p.tipoOperacion}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[p.estado]}`}>
                      {STATUS_LABELS[p.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{p.fechaGeneracion}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[#0D1B2A]">{formatCurrency(p.importeNeto)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[#5D6D7E]">{formatCurrency(p.iva)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-[#0D1B2A]">{formatCurrency(p.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetail(p)} className="p-1.5 text-[#1B4F72] hover:bg-[#EBF5FB] rounded" title="Ver detalle">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      {(p.estado === "borrador" || p.estado === "revisada") && (
                        <button className="p-1.5 text-[#27AE60] hover:bg-[#EBF5FB] rounded" title="Aprobar">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && <PrefacturaDetailModal prefactura={detail} onClose={() => setDetail(null)} />}
    </AppShell>
  );
}

function PrefacturaDetailModal({ prefactura: p, onClose }: { prefactura: Prefactura; onClose: () => void }) {
  const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#BDC3C7]">
          <div>
            <h2 className="font-semibold text-[#0D1B2A] font-mono">{p.numeroPrefactura}</h2>
            <p className="text-xs text-[#5D6D7E]">Ref. {p.numeroOrdenRef}</p>
          </div>
          <button onClick={onClose} className="text-[#5D6D7E] hover:text-[#0D1B2A]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#5D6D7E] text-xs">Cliente</p>
              <p className="font-medium text-[#0D1B2A]">{p.clienteNombre}</p>
            </div>
            <div>
              <p className="text-[#5D6D7E] text-xs">Tipo de Operación</p>
              <p className="font-medium text-[#0D1B2A]">{p.tipoOperacion}</p>
            </div>
            <div>
              <p className="text-[#5D6D7E] text-xs">Fecha Generación</p>
              <p className="font-medium text-[#0D1B2A]">{p.fechaGeneracion}</p>
            </div>
            <div>
              <p className="text-[#5D6D7E] text-xs">Estado</p>
              <p className="font-medium text-[#0D1B2A]">{p.estado}</p>
            </div>
          </div>
          <div className="border border-[#BDC3C7] rounded p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#5D6D7E]">Importe Neto</span>
              <span className="font-mono font-medium">{fmt(p.importeNeto)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#5D6D7E]">IVA (21%)</span>
              <span className="font-mono text-[#5D6D7E]">{fmt(p.iva)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t border-[#BDC3C7] pt-2">
              <span className="text-[#0D1B2A]">Total</span>
              <span className="font-mono text-[#1B4F72]">{fmt(p.total)}</span>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#BDC3C7] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-[#BDC3C7] text-[#5D6D7E] rounded text-sm hover:bg-[#F4F6F7]">
            Cerrar
          </button>
          {p.estado !== "exportada" && (
            <button className="px-4 py-2 bg-[#16A085] text-white rounded text-sm font-semibold hover:bg-[#127d67]">
              Exportar Tango
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
