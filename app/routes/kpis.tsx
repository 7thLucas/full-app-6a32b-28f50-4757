import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  return { user };
}

const monthlyData = [
  { mes: "Ene", distribucion: 28, puertoTotal: 15, material: 5, revenue: 1850000 },
  { mes: "Feb", distribucion: 32, puertoTotal: 18, material: 7, revenue: 2100000 },
  { mes: "Mar", distribucion: 35, puertoTotal: 22, material: 9, revenue: 2450000 },
  { mes: "Abr", distribucion: 29, puertoTotal: 19, material: 6, revenue: 2080000 },
  { mes: "May", distribucion: 38, puertoTotal: 24, material: 11, revenue: 2780000 },
  { mes: "Jun", distribucion: 42, puertoTotal: 28, material: 14, revenue: 3150000 },
];

const puertoBreakdown = [
  { name: "Pallets", value: 35, color: "#16A085" },
  { name: "Cont. 20ft", value: 28, color: "#1abc9c" },
  { name: "Cont. 40ft", value: 22, color: "#0e8471" },
  { name: "Isotanques", value: 15, color: "#0a6058" },
];

const revenueByOpData = [
  { tipo: "Distribución", revenue: 1200000, color: "#1B4F72" },
  { tipo: "Puerto", revenue: 980000, color: "#16A085" },
  { tipo: "Mat. Técnico", revenue: 420000, color: "#8E44AD" },
];

const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm" style={{ borderLeft: `3px solid ${accent ?? "#1B4F72"}` }}>
      <p className="text-[#5D6D7E] text-xs uppercase tracking-wide font-medium">{label}</p>
      <p className="text-[28px] font-semibold text-[#1B4F72] mt-1 leading-none">{value}</p>
      {sub && <p className="text-[#5D6D7E] text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function KpisPage() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <AppShell title="KPI Dashboards — Gerencia" user={user}>
      {/* Section: Distribución */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-[#1B4F72] rounded-full" />
          <h2 className="font-semibold text-[#0D1B2A] text-base">Distribución</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <KpiCard label="Envíos Hoy" value={3} sub="distribución" accent="#1B4F72" />
          <KpiCard label="Envíos Semana" value={17} sub="distribución" accent="#1B4F72" />
          <KpiCard label="Km Promedio" value="124 km" sub="por viaje" accent="#1B4F72" />
          <KpiCard label="Tiempo Prom." value="4.2 hs" sub="por viaje" accent="#1B4F72" />
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0D1B2A] mb-3">Envíos Distribución — Evolución Mensual</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FB" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#5D6D7E" }} />
              <YAxis tick={{ fontSize: 11, fill: "#5D6D7E" }} />
              <Tooltip contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 6, color: "#F4F6F7", fontSize: 11 }} />
              <Line type="monotone" dataKey="distribucion" name="Distribución" stroke="#1B4F72" strokeWidth={2} dot={{ fill: "#1B4F72", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section: Puerto */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-[#16A085] rounded-full" />
          <h2 className="font-semibold text-[#0D1B2A] text-base">Puerto</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <KpiCard label="Pallets Semana" value={8} sub="viajes puerto" accent="#16A085" />
          <KpiCard label="Cont. 20ft Semana" value={6} accent="#1abc9c" />
          <KpiCard label="Cont. 40ft Semana" value={5} accent="#0e8471" />
          <KpiCard label="Isotanques Semana" value={3} accent="#0a6058" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0D1B2A] mb-3">Puerto — Distribución por Subcategoría</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={puertoBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {puertoBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 6, color: "#F4F6F7", fontSize: 11 }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "#5D6D7E" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0D1B2A] mb-3">Puerto — Evolución Mensual (total)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FB" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#5D6D7E" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5D6D7E" }} />
                <Tooltip contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 6, color: "#F4F6F7", fontSize: 11 }} />
                <Bar dataKey="puertoTotal" name="Puerto Total" fill="#16A085" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Section: Material Técnico */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-[#8E44AD] rounded-full" />
          <h2 className="font-semibold text-[#0D1B2A] text-base">Material Técnico</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <KpiCard label="Viajes Semana" value={4} accent="#8E44AD" />
          <KpiCard label="Revenue Proyect." value={fmt(420000)} sub="mes actual" accent="#8E44AD" />
          <KpiCard label="Km Promedio" value="210 km" sub="por viaje" accent="#8E44AD" />
        </div>
      </section>

      {/* Section: Cross-type */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-[#E8702A] rounded-full" />
          <h2 className="font-semibold text-[#0D1B2A] text-base">Vista Consolidada</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <KpiCard label="Revenue Total (mes)" value={fmt(3150000)} accent="#E8702A" />
          <KpiCard label="Utilización Flota" value="14%" sub="5 de 35 unidades" accent="#E8702A" />
          <KpiCard label="Costo Prom./Viaje" value={fmt(48200)} accent="#E8702A" />
          <KpiCard label="Total Envíos (mes)" value={84} accent="#E8702A" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0D1B2A] mb-3">Revenue por Tipo de Operación</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueByOpData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#5D6D7E" }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                <YAxis type="category" dataKey="tipo" tick={{ fontSize: 11, fill: "#5D6D7E" }} width={80} />
                <Tooltip contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 6, color: "#F4F6F7", fontSize: 11 }} formatter={(v: any) => fmt(v)} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 2, 2, 0]}>
                  {revenueByOpData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0D1B2A] mb-3">Evolución Revenue Total — Últimos 6 meses</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FB" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#5D6D7E" }} />
                <YAxis tick={{ fontSize: 10, fill: "#5D6D7E" }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 6, color: "#F4F6F7", fontSize: 11 }} formatter={(v: any) => fmt(v)} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#E8702A" strokeWidth={2} dot={{ fill: "#E8702A", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
