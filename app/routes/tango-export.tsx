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

interface ExportRow {
  id: string;
  cliente: string;
  comprobante: string;
  importe_neto: number;
  iva: number;
  total: number;
  descripcion_servicios: string;
  tipo_operacion: string;
  fecha: string;
}

const MOCK_EXPORT_ROWS: ExportRow[] = [
  { id: "1", cliente: "Dow Chemical Argentina S.A.", comprobante: "PRF-DEMO-0001", importe_neto: 45250, iva: 9502.5, total: 54752.5, descripcion_servicios: "Transporte Distribución — ORD-DEMO-0001", tipo_operacion: "Distribución", fecha: "2026-06-17" },
  { id: "2", cliente: "Bayer CropScience S.A.", comprobante: "PRF-DEMO-0005", importe_neto: 38500, iva: 8085, total: 46585, descripcion_servicios: "Transporte Material Técnico — ORD-DEMO-0013", tipo_operacion: "Material Técnico", fecha: "2026-06-14" },
  { id: "3", cliente: "BASF Argentina S.A.", comprobante: "PRF-DEMO-0003", importe_neto: 125000, iva: 26250, total: 151250, descripcion_servicios: "Transporte Puerto Contenedor 20ft — ORD-DEMO-0008", tipo_operacion: "Puerto - Contenedor 20ft", fecha: "2026-06-15" },
];

const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);

export default function TangoExportPage() {
  const { user } = useLoaderData<typeof loader>();
  const [selected, setSelected] = useState<Set<string>>(new Set(MOCK_EXPORT_ROWS.map(r => r.id)));
  const [emailAddr, setEmailAddr] = useState("");
  const [exported, setExported] = useState(false);

  const selectedRows = MOCK_EXPORT_ROWS.filter(r => selected.has(r.id));
  const totalNeto = selectedRows.reduce((s, r) => s + r.importe_neto, 0);
  const totalIva = selectedRows.reduce((s, r) => s + r.iva, 0);
  const totalFinal = selectedRows.reduce((s, r) => s + r.total, 0);

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDownload = () => {
    const headers = ["cliente", "comprobante", "importe_neto", "iva", "total", "descripcion_servicios", "tipo_operacion"];
    const rows = selectedRows.map(r =>
      headers.map(h => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tango-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  return (
    <AppShell title="Exportar a Tango Software" user={user}>
      <div className="max-w-4xl">
        {/* Info banner */}
        <div className="bg-[#EBF5FB] border border-[#1B4F72] rounded-lg p-4 mb-6 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B4F72" strokeWidth="2" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <p className="text-[#1B4F72] font-semibold text-sm">Exportación a Tango Software</p>
            <p className="text-[#5D6D7E] text-xs mt-1">
              Este módulo genera el archivo CSV/Excel listo para importar en Tango. Incluye: cliente, comprobante, importe neto, IVA, total, descripción de servicios y tipo de operación. <strong>No incluye emisión de comprobante AFIP.</strong>
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-[#BDC3C7] flex items-center justify-between">
            <h2 className="font-semibold text-[#0D1B2A] text-sm">Prefacturas Aprobadas — Listas para exportar</h2>
            <span className="text-xs text-[#5D6D7E]">{selectedRows.length} seleccionada(s)</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F4F6F7] text-[#5D6D7E] text-xs border-b border-[#BDC3C7]">
                <th className="px-4 py-3 text-left">
                  <input type="checkbox"
                    checked={selected.size === MOCK_EXPORT_ROWS.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(MOCK_EXPORT_ROWS.map(r => r.id)) : new Set())}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Comprobante</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Tipo Operación</th>
                <th className="px-4 py-3 text-left font-medium">Descripción Servicios</th>
                <th className="px-4 py-3 text-right font-medium">Importe Neto</th>
                <th className="px-4 py-3 text-right font-medium">IVA</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_EXPORT_ROWS.map((r, idx) => (
                <tr key={r.id} className={`border-t border-[#BDC3C7] ${idx % 2 === 0 ? "bg-white" : "bg-[#F4F6F7]"} ${selected.has(r.id) ? "ring-1 ring-inset ring-[#1B4F72]" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1B4F72]">{r.comprobante}</td>
                  <td className="px-4 py-3 text-xs text-[#0D1B2A] max-w-[160px] truncate">{r.cliente}</td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E]">{r.tipo_operacion}</td>
                  <td className="px-4 py-3 text-xs text-[#5D6D7E] max-w-[200px] truncate">{r.descripcion_servicios}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{fmt(r.importe_neto)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[#5D6D7E]">{fmt(r.iva)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold">{fmt(r.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0D1B2A] text-white text-xs">
                <td colSpan={5} className="px-4 py-3 font-semibold">TOTALES ({selectedRows.length} registros)</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{fmt(totalNeto)}</td>
                <td className="px-4 py-3 text-right font-mono text-[#BDC3C7]">{fmt(totalIva)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-[#E8702A]">{fmt(totalFinal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Export actions */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="font-semibold text-[#0D1B2A] text-sm mb-4">Opciones de exportación</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-[#5D6D7E] text-xs mb-2">Descargar archivo CSV</p>
              <button
                onClick={handleDownload}
                disabled={selectedRows.length === 0}
                className="w-full py-2.5 bg-[#16A085] text-white text-sm font-semibold rounded hover:bg-[#127d67] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Descargar CSV ({selectedRows.length})
              </button>
            </div>
            <div className="flex-1">
              <p className="text-[#5D6D7E] text-xs mb-2">Enviar por email</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailAddr}
                  onChange={(e) => setEmailAddr(e.target.value)}
                  placeholder="destinatario@tango.com"
                  className="flex-1 px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
                />
                <button
                  disabled={!emailAddr || selectedRows.length === 0}
                  className="px-4 py-2 bg-[#1B4F72] text-white text-sm font-semibold rounded hover:bg-[#154060] disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
          {exported && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Archivo exportado correctamente. Las prefacturas han sido marcadas como "Exportadas".
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
