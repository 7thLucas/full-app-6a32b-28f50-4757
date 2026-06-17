import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";
import { useEffect, useState, useCallback } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  return { user };
}

type Modo = "monto_fijo" | "por_dia";

interface Adicional {
  _id: string;
  nombre: string;
  tarifa: number;
  modo: Modo;
  scope: string;
  descripcion?: string;
  activo: boolean;
  orden?: number;
}

const MODO_LABELS: Record<Modo, string> = {
  monto_fijo: "Monto fijo",
  por_dia: "Por día",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const emptyForm = { nombre: "", tarifa: 0, modo: "monto_fijo" as Modo, descripcion: "", activo: true };

export default function AdicionalesPage() {
  const { user } = useLoaderData<typeof loader>();
  const isAdmin = user.role === "admin";
  const [items, setItems] = useState<Adicional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Adicional | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/adicionales", { credentials: "include" });
      const json = await res.json();
      if (json.success) setItems(json.data);
      else setError(json.error ?? "Error al cargar adicionales");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (a: Adicional) => {
    setEditing(a);
    setForm({ nombre: a.nombre, tarifa: a.tarifa, modo: a.modo, descripcion: a.descripcion ?? "", activo: a.activo });
    setShowForm(true);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const url = editing ? `/api/adicionales/${editing._id}` : "/api/adicionales";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tarifa: Number(form.tarifa) }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "No se pudo guardar");
      } else {
        setShowForm(false);
        await load();
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: Adicional) => {
    if (!confirm(`¿Eliminar el adicional "${a.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/adicionales/${a._id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (json.success) await load();
      else setError(json.error ?? "No se pudo eliminar");
    } catch {
      setError("No se pudo conectar con el servidor");
    }
  };

  return (
    <AppShell title="Adicionales — Puerto / Contenedores" user={user}>
      <div className="max-w-4xl">
        <div className="bg-[#EBF5FB] border border-[#AED6F1] rounded-lg p-4 mb-6">
          <p className="text-sm text-[#1B4F72]">
            Cargos adicionales que se facturan luego del viaje, al devolverse el contenedor
            (Puerto &gt; Contenedores 20' / 40'). Definí cada tipo de cargo con su tarifa y
            modo de cobro. Los adicionales <strong>monto fijo</strong> cobran un importe único;
            los <strong>por día</strong> calculan tarifa × cantidad de días de devolución.
          </p>
        </div>

        {error && (
          <div className="bg-[#FDEDEC] border border-[#F5B7B1] text-[#C0392B] text-sm rounded p-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center mb-4">
          <h2 className="font-semibold text-[#0D1B2A] text-base">Tipos de adicional</h2>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="ml-auto px-4 py-2 bg-[#1B4F72] text-white text-sm font-semibold rounded hover:bg-[#15405c] transition-colors"
            >
              + Nuevo adicional
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0D1B2A] text-[#BDC3C7] text-xs">
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Modo de cobro</th>
                  <th className="px-4 py-3 text-right font-medium">Tarifa</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  {isAdmin && <th className="px-4 py-3 text-left font-medium">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-10 text-center text-[#5D6D7E]">Cargando…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-10 text-center text-[#5D6D7E]">No hay adicionales configurados.</td></tr>
                ) : (
                  items.map((a, idx) => (
                    <tr key={a._id} className={`border-t border-[#BDC3C7] ${idx % 2 === 0 ? "bg-white" : "bg-[#F4F6F7]"}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#0D1B2A]">{a.nombre}</p>
                        {a.descripcion && <p className="text-xs text-[#5D6D7E]">{a.descripcion}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-[#EBF5FB] text-[#1B4F72]">
                          {MODO_LABELS[a.modo]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#0D1B2A]">
                        {fmt(a.tarifa)}{a.modo === "por_dia" ? " / día" : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${a.activo ? "badge-entregado" : "badge-cancelado"}`}>
                          {a.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(a)} className="p-1.5 text-[#1B4F72] hover:bg-[#EBF5FB] rounded" title="Editar">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={() => remove(a)} className="p-1.5 text-[#C0392B] hover:bg-[#FDEDEC] rounded" title="Eliminar">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isAdmin && (
          <p className="mt-3 text-xs text-[#5D6D7E]">
            Sólo el rol Administración puede crear, editar o eliminar adicionales.
          </p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#BDC3C7]">
              <h2 className="font-semibold text-[#0D1B2A]">{editing ? "Editar adicional" : "Nuevo adicional"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#5D6D7E] hover:text-[#0D1B2A]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-[#5D6D7E] mb-1">Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
                  placeholder="Ej. Lavado"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5D6D7E] mb-1">Modo de cobro</label>
                <select
                  value={form.modo}
                  onChange={(e) => setForm((f) => ({ ...f, modo: e.target.value as Modo }))}
                  className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
                >
                  <option value="monto_fijo">Monto fijo</option>
                  <option value="por_dia">Por día (tarifa × días)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5D6D7E] mb-1">
                  Tarifa (ARS){form.modo === "por_dia" ? " por día" : ""}
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.tarifa}
                  onChange={(e) => setForm((f) => ({ ...f, tarifa: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5D6D7E] mb-1">Descripción (opcional)</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-[#BDC3C7] rounded text-sm focus:outline-none focus:border-[#1B4F72]"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-[#0D1B2A]">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                  className="rounded"
                />
                Activo
              </label>
            </div>
            <div className="px-6 py-4 border-t border-[#BDC3C7] flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#BDC3C7] text-[#5D6D7E] rounded text-sm hover:bg-[#F4F6F7]">
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={saving || !form.nombre.trim()}
                className="px-4 py-2 bg-[#1B4F72] text-white rounded text-sm font-semibold hover:bg-[#15405c] disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
