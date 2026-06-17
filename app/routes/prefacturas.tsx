import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";
import { useCallback, useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  return { user };
}

type PfStatus = "borrador" | "revisada" | "aprobada" | "exportada";
type Modo = "monto_fijo" | "por_dia";

const CONTENEDOR_OPS = ["puerto_contenedor_20", "puerto_contenedor_40"];

interface AdicionalAplicado {
  adicionalConfigId?: string;
  nombre: string;
  modo: Modo;
  tarifa: number;
  dias: number;
  subtotal: number;
}

interface AdicionalConfig {
  _id: string;
  nombre: string;
  tarifa: number;
  modo: Modo;
  activo: boolean;
}

interface Linea {
  descripcion: string;
  cantidad: number;
  unidad?: string;
  precioUnitario: number;
  subtotal: number;
  esAdicional?: boolean;
}

interface Prefactura {
  _id: string;
  numeroPrefactura: string;
  numeroOrdenRef?: string;
  clienteNombre?: string;
  clienteId: string;
  tipoOperacion: string;
  estado: PfStatus;
  fechaGeneracion: string;
  flete?: number;
  peajes?: number;
  combustible?: number;
  adicionales?: number;
  adicionalesDetalle?: AdicionalAplicado[];
  lineas?: Linea[];
  importeNeto: number;
  iva: number;
  total: number;
  ivaRate?: number;
  descripcionServicios?: string;
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
const OP_LABELS: Record<string, string> = {
  distribucion: "Distribución",
  puerto_pallets: "Puerto - Pallets",
  puerto_contenedor_20: "Puerto - Contenedor 20ft",
  puerto_contenedor_40: "Puerto - Contenedor 40ft",
  puerto_isotanque: "Puerto - Isotanque",
  material_tecnico: "Material Técnico",
};
const opLabel = (op: string) => OP_LABELS[op] ?? op;
const isContenedor = (op: string) => CONTENEDOR_OPS.includes(op);

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n ?? 0);

export default function PrefacturasPage() {
  const { user } = useLoaderData<typeof loader>();
  const [prefacturas, setPrefacturas] = useState<Prefactura[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<PfStatus | "">("");
  const [detail, setDetail] = useState<Prefactura | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prefacturas?limit=200", { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        const items: Prefactura[] = (json.data.items ?? []).map((p: any) => ({
          ...p,
          fechaGeneracion: p.fechaGeneracion ? String(p.fechaGeneracion).slice(0, 10) : "",
        }));
        setPrefacturas(items);
      }
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = prefacturas.filter((p) => !filterStatus || p.estado === filterStatus);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExportTango = async () => {
    const ids = [...selected];
    const url = ids.length > 0 ? `/api/prefacturas/export/tango?ids=${ids.join(",")}` : "/api/prefacturas/export/tango";
    try {
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      if (!json.success) return;
      const rows = json.data as Record<string, unknown>[];
      if (rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      const csvRows = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
      ];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const dl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dl;
      a.download = `tango-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(dl);
      await load();
    } catch {
      /* noop */
    }
  };

  const totalAprobadas = prefacturas.filter((p) => p.estado === "aprobada" || p.estado === "revisada").reduce((s, p) => s + p.total, 0);
  const totalBorrador = prefacturas.filter((p) => p.estado === "borrador").reduce((s, p) => s + p.total, 0);

  return (
    <AppShell title="Prefacturación" user={user}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Aprobadas", value: formatCurrency(totalAprobadas), color: "#27AE60" },
          { label: "En Revisión", value: String(prefacturas.filter((p) => p.estado === "revisada").length), color: "#2980B9" },
          { label: "Borradores", value: formatCurrency(totalBorrador), color: "#F39C12" },
          { label: "Exportadas (mes)", value: String(prefacturas.filter((p) => p.estado === "exportada").length), color: "#8E44AD" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: `3px solid ${c.color}` }}>
            <p className="text-[#5D6D7E] text-xs mb-1">{c.label}</p>
            <p className="text-lg font-semibold text-[#0D1B2A]">{c.value}</p>
          </div>
        ))}
      </div>

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
          {selected.size > 0 && <span className="flex items-center text-xs text-[#5D6D7E]">{selected.size} seleccionada(s)</span>}
          <button
            onClick={handleExportTango}
            className="px-4 py-2 bg-[#16A085] text-white text-sm font-semibold rounded hover:bg-[#127d67] transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar a Tango (CSV)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0D1B2A] text-[#BDC3C7] text-xs">
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(filtered.map((p) => p._id)));
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
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-[#5D6D7E]">Cargando prefacturas…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-[#5D6D7E]">No hay prefacturas.</td></tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={p._id} className={`border-t border-[#BDC3C7] hover:bg-[#EBF5FB] ${idx % 2 === 0 ? "bg-white" : "bg-[#F4F6F7]"}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleSelect(p._id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3"><span className="font-mono text-[#1B4F72] font-medium text-xs">{p.numeroPrefactura}</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-[#5D6D7E]">{p.numeroOrdenRef ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#0D1B2A] max-w-[160px] truncate">{p.clienteNombre ?? p.clienteId}</td>
                    <td className="px-4 py-3 text-xs text-[#5D6D7E]">
                      {opLabel(p.tipoOperacion)}
                      {isContenedor(p.tipoOperacion) && (p.adicionales ?? 0) > 0 && (
                        <span className="ml-1 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#16A08522] text-[#16A085]">+adic.</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[p.estado]}`}>{STATUS_LABELS[p.estado]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#5D6D7E]">{p.fechaGeneracion}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#0D1B2A]">{formatCurrency(p.importeNeto)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#5D6D7E]">{formatCurrency(p.iva)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-[#0D1B2A]">{formatCurrency(p.total)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(p)} className="p-1.5 text-[#1B4F72] hover:bg-[#EBF5FB] rounded" title="Ver detalle">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <PrefacturaDetailModal
          prefactura={detail}
          onClose={() => setDetail(null)}
          onSaved={(updated) => {
            setPrefacturas((prev) => prev.map((p) => (p._id === updated._id ? { ...updated, fechaGeneracion: p.fechaGeneracion } : p)));
            setDetail({ ...updated, fechaGeneracion: detail.fechaGeneracion });
          }}
        />
      )}
    </AppShell>
  );
}

function PrefacturaDetailModal({
  prefactura: p,
  onClose,
  onSaved,
}: {
  prefactura: Prefactura;
  onClose: () => void;
  onSaved: (updated: Prefactura) => void;
}) {
  const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n ?? 0);
  const editable = isContenedor(p.tipoOperacion) && p.estado !== "exportada";

  const [adicionales, setAdicionales] = useState<AdicionalAplicado[]>(
    (p.adicionalesDetalle ?? []).map((a) => ({ ...a }))
  );
  const [catalog, setCatalog] = useState<AdicionalConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!editable) return;
    fetch("/api/adicionales?activo=true", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCatalog(j.data);
      })
      .catch(() => {});
  }, [editable]);

  const recalc = (a: AdicionalAplicado): AdicionalAplicado => {
    const dias = a.modo === "por_dia" ? Math.max(1, Math.floor(a.dias || 1)) : 1;
    return { ...a, dias, subtotal: a.modo === "por_dia" ? a.tarifa * dias : a.tarifa };
  };

  const addFromCatalog = (cfgId: string) => {
    const cfg = catalog.find((c) => c._id === cfgId);
    if (!cfg) return;
    setAdicionales((prev) => [
      ...prev,
      recalc({ adicionalConfigId: cfg._id, nombre: cfg.nombre, modo: cfg.modo, tarifa: cfg.tarifa, dias: 1, subtotal: cfg.tarifa }),
    ]);
  };

  const updateAt = (idx: number, patch: Partial<AdicionalAplicado>) => {
    setAdicionales((prev) => prev.map((a, i) => (i === idx ? recalc({ ...a, ...patch }) : a)));
  };
  const removeAt = (idx: number) => setAdicionales((prev) => prev.filter((_, i) => i !== idx));

  const adicionalesTotal = adicionales.reduce((s, a) => s + a.subtotal, 0);
  const base = (p.flete ?? 0) + (p.peajes ?? 0) + (p.combustible ?? 0);
  const previewNeto = base + adicionalesTotal;
  const ivaRate = p.ivaRate ?? 21;
  const previewIva = previewNeto * (ivaRate / 100);
  const previewTotal = previewNeto + previewIva;

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/prefacturas/${p._id}/adicionales`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adicionales: adicionales.map((a) => ({
            adicionalConfigId: a.adicionalConfigId,
            nombre: a.nombre,
            modo: a.modo,
            tarifa: a.tarifa,
            dias: a.dias,
          })),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setErr(json.error ?? "No se pudo guardar");
      } else {
        onSaved(json.data as Prefactura);
      }
    } catch {
      setErr("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#BDC3C7] sticky top-0 bg-white">
          <div>
            <h2 className="font-semibold text-[#0D1B2A] font-mono">{p.numeroPrefactura}</h2>
            <p className="text-xs text-[#5D6D7E]">Ref. {p.numeroOrdenRef ?? "—"}</p>
          </div>
          <button onClick={onClose} className="text-[#5D6D7E] hover:text-[#0D1B2A]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-[#5D6D7E] text-xs">Cliente</p><p className="font-medium text-[#0D1B2A]">{p.clienteNombre ?? p.clienteId}</p></div>
            <div><p className="text-[#5D6D7E] text-xs">Tipo de Operación</p><p className="font-medium text-[#0D1B2A]">{opLabel(p.tipoOperacion)}</p></div>
            <div><p className="text-[#5D6D7E] text-xs">Fecha Generación</p><p className="font-medium text-[#0D1B2A]">{p.fechaGeneracion}</p></div>
            <div><p className="text-[#5D6D7E] text-xs">Estado</p><p className="font-medium text-[#0D1B2A]">{STATUS_LABELS[p.estado]}</p></div>
          </div>

          {/* Adicionales — Puerto > Contenedores */}
          {isContenedor(p.tipoOperacion) && (
            <div className="border border-[#16A085] rounded p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#16A085]">Adicionales (post-viaje)</h3>
                {editable && (
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) addFromCatalog(e.target.value); e.target.value = ""; }}
                    className="text-xs px-2 py-1 border border-[#BDC3C7] rounded focus:outline-none focus:border-[#16A085]"
                  >
                    <option value="">+ Agregar adicional…</option>
                    {catalog.map((c) => (
                      <option key={c._id} value={c._id}>{c.nombre} ({c.modo === "por_dia" ? "por día" : "monto fijo"})</option>
                    ))}
                  </select>
                )}
              </div>

              {adicionales.length === 0 ? (
                <p className="text-xs text-[#5D6D7E]">Sin adicionales cargados.</p>
              ) : (
                <div className="space-y-2">
                  {adicionales.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs bg-[#F4F6F7] rounded p-2">
                      <span className="font-medium text-[#0D1B2A] flex-1 truncate">{a.nombre}</span>
                      {a.modo === "por_dia" ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[#5D6D7E]">{fmt(a.tarifa)}/día ×</span>
                          {editable ? (
                            <input
                              type="number"
                              min={1}
                              value={a.dias}
                              onChange={(e) => updateAt(idx, { dias: Number(e.target.value) })}
                              className="w-14 px-1 py-0.5 border border-[#BDC3C7] rounded text-center"
                            />
                          ) : (
                            <span>{a.dias}</span>
                          )}
                          <span className="text-[#5D6D7E]">días</span>
                        </div>
                      ) : (
                        <span className="text-[#5D6D7E]">monto fijo</span>
                      )}
                      <span className="font-mono font-semibold text-[#0D1B2A] w-24 text-right">{fmt(a.subtotal)}</span>
                      {editable && (
                        <button onClick={() => removeAt(idx)} className="text-[#C0392B] hover:bg-[#FDEDEC] rounded p-1" title="Quitar">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-semibold pt-1 border-t border-[#BDC3C7]">
                    <span className="text-[#16A085]">Total adicionales</span>
                    <span className="font-mono text-[#16A085]">{fmt(adicionalesTotal)}</span>
                  </div>
                </div>
              )}

              {editable && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  {err && <span className="text-xs text-[#C0392B] mr-auto">{err}</span>}
                  <button
                    onClick={save}
                    disabled={saving}
                    className="px-3 py-1.5 bg-[#16A085] text-white rounded text-xs font-semibold hover:bg-[#127d67] disabled:opacity-50"
                  >
                    {saving ? "Guardando…" : "Guardar adicionales"}
                  </button>
                </div>
              )}
              {!editable && p.estado === "exportada" && (
                <p className="text-xs text-[#5D6D7E]">Prefactura exportada — adicionales bloqueados.</p>
              )}
            </div>
          )}

          {/* Totales */}
          <div className="border border-[#BDC3C7] rounded p-4 space-y-2">
            {(p.flete ?? 0) > 0 && (<div className="flex justify-between text-sm"><span className="text-[#5D6D7E]">Flete</span><span className="font-mono">{fmt(p.flete ?? 0)}</span></div>)}
            {(p.peajes ?? 0) > 0 && (<div className="flex justify-between text-sm"><span className="text-[#5D6D7E]">Peajes</span><span className="font-mono">{fmt(p.peajes ?? 0)}</span></div>)}
            {(p.combustible ?? 0) > 0 && (<div className="flex justify-between text-sm"><span className="text-[#5D6D7E]">Combustible</span><span className="font-mono">{fmt(p.combustible ?? 0)}</span></div>)}
            {adicionalesTotal > 0 && (<div className="flex justify-between text-sm"><span className="text-[#5D6D7E]">Adicionales</span><span className="font-mono text-[#16A085]">{fmt(adicionalesTotal)}</span></div>)}
            <div className="flex justify-between text-sm border-t border-[#BDC3C7] pt-2"><span className="text-[#5D6D7E]">Importe Neto</span><span className="font-mono font-medium">{fmt(previewNeto)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#5D6D7E]">IVA ({ivaRate}%)</span><span className="font-mono text-[#5D6D7E]">{fmt(previewIva)}</span></div>
            <div className="flex justify-between text-base font-semibold border-t border-[#BDC3C7] pt-2"><span className="text-[#0D1B2A]">Total</span><span className="font-mono text-[#1B4F72]">{fmt(previewTotal)}</span></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#BDC3C7] flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 border border-[#BDC3C7] text-[#5D6D7E] rounded text-sm hover:bg-[#F4F6F7]">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
