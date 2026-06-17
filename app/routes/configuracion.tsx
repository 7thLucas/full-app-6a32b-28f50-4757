import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";
import { useConfigurables } from "~/modules/configurables";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  return { user };
}

export default function ConfiguracionPage() {
  const { user } = useLoaderData<typeof loader>();
  const { config, loading } = useConfigurables();

  return (
    <AppShell title="Configuración del Sistema" user={user}>
      <div className="max-w-3xl space-y-6">
        {/* App Identity */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-[#0D1B2A] text-base mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-[#1B4F72] rounded-full" />
            Identidad de la Aplicación
          </h2>
          {loading ? (
            <div className="text-[#5D6D7E] text-sm">Cargando configuración...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: "Nombre de la App", value: config?.appName },
                { label: "Empresa", value: (config as any)?.companyName },
                { label: "Tagline", value: (config as any)?.tagline },
                { label: "Tamaño de Flota", value: (config as any)?.fleetSize ? `${(config as any).fleetSize} vehículos` : undefined },
                { label: "Moneda", value: (config as any)?.defaultCurrency },
                { label: "IVA Rate", value: (config as any)?.ivaRate ? `${(config as any).ivaRate}%` : undefined },
                { label: "Email Tango Export", value: (config as any)?.tangoExportEmail || "No configurado" },
              ].map((f) => (
                <div key={f.label} className="border border-[#BDC3C7] rounded p-3">
                  <p className="text-[#5D6D7E] text-xs mb-0.5">{f.label}</p>
                  <p className="font-medium text-[#0D1B2A]">{f.value ?? "—"}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Brand Colors */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-[#0D1B2A] text-base mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-[#E8702A] rounded-full" />
            Colores de Marca
          </h2>
          <div className="flex gap-4">
            {[
              { label: "Primario (Industrial Blue)", color: config?.brandColor?.primary ?? "#1B4F72" },
              { label: "Secundario (Deep Navy)", color: config?.brandColor?.secondary ?? "#0D1B2A" },
              { label: "Acento (Safety Orange)", color: config?.brandColor?.accent ?? "#E8702A" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg shadow-sm" style={{ background: c.color }} />
                <div>
                  <p className="text-xs text-[#5D6D7E]">{c.label}</p>
                  <p className="font-mono text-xs font-semibold text-[#0D1B2A]">{c.color}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature flags */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-[#0D1B2A] text-base mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-[#16A085] rounded-full" />
            Módulos Activos
          </h2>
          <div className="space-y-3">
            {[
              { label: "Distribución", key: "showDistribucion", desc: "Operaciones de hoja de ruta distribución" },
              { label: "Puerto (todos los subtipos)", key: "showPuerto", desc: "Pallets, contenedores 20ft/40ft, isotanques" },
              { label: "Material Técnico", key: "showMaterialTecnico", desc: "Viajes de material y equipo técnico" },
              { label: "Google Maps", key: "enableGoogleMaps", desc: "Integración de mapas para routing" },
              { label: "Google Sheets Sync", key: "enableGoogleSheets", desc: "Sincronización opcional con Google Sheets" },
            ].map((f) => {
              const enabled = (config as any)?.[f.key] ?? false;
              return (
                <div key={f.key} className="flex items-center justify-between p-3 border border-[#BDC3C7] rounded">
                  <div>
                    <p className="text-sm font-medium text-[#0D1B2A]">{f.label}</p>
                    <p className="text-xs text-[#5D6D7E]">{f.desc}</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${enabled ? "badge-entregado" : "badge-cancelado"}`}>
                    {enabled ? "Activo" : "Inactivo"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-[#5D6D7E]">
            Para modificar estos parámetros, utilice el panel de configuración del sistema de gestión.
          </p>
        </section>

        {/* Tango fields reference */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-[#0D1B2A] text-base mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-[#8E44AD] rounded-full" />
            Campos Requeridos Tango Export
          </h2>
          <div className="bg-[#F4F6F7] rounded p-4">
            <p className="text-xs text-[#5D6D7E] mb-2 font-semibold">Columnas generadas en el CSV de exportación:</p>
            <div className="flex flex-wrap gap-2">
              {["cliente", "comprobante", "importe_neto", "iva", "total", "adicionales", "detalle_adicionales", "descripcion_servicios", "tipo_operacion"].map((col) => (
                <span key={col} className="font-mono text-xs bg-[#0D1B2A] text-[#BDC3C7] px-2 py-1 rounded">
                  {col}
                </span>
              ))}
            </div>
            <p className="text-xs text-[#E8702A] mt-3 font-medium">
              ⚠ Sin integración AFIP — pre-facturación interna únicamente.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
