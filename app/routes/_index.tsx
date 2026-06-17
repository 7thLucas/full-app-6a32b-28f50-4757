import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AppShell } from "~/components/layout/AppShell";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (!user) return redirect("/auth/login");
  return { user };
}

// Mock dashboard data — in production comes from /api/dashboard/overview
const mockKpis = {
  totalVehiculos: 35,
  vehiculosDisponibles: 28,
  vehiculosEnViaje: 5,
  fleetOccupancy: 14,
  totalConductores: 6,
  enviosHoy: 3,
  enviosSemana: 17,
  enTransitoCount: 5,
  pendientesCount: 8,
  prefacturasPendientes: 4,
};

const weeklyTrendData = [
  { day: "Lun", distribucion: 3, puerto: 2, material: 1 },
  { day: "Mar", distribucion: 4, puerto: 1, material: 2 },
  { day: "Mie", distribucion: 2, puerto: 3, material: 0 },
  { day: "Jue", distribucion: 5, puerto: 2, material: 1 },
  { day: "Vie", distribucion: 3, puerto: 4, material: 2 },
  { day: "Sab", distribucion: 1, puerto: 1, material: 0 },
  { day: "Dom", distribucion: 0, puerto: 0, material: 0 },
];

const opBreakdownData = [
  { name: "Distribución", value: 45, color: "#1B4F72" },
  { name: "Puerto Pallets", value: 20, color: "#16A085" },
  { name: "Contenedores", value: 22, color: "#1abc9c" },
  { name: "Isotanques", value: 8, color: "#0e8471" },
  { name: "Mat. Técnico", value: 5, color: "#8E44AD" },
];

const fleetOccupancyData = [
  { label: "En Viaje", value: 5, color: "#1B4F72" },
  { label: "Disponible", value: 28, color: "#27AE60" },
  { label: "Mantenimiento", value: 2, color: "#F39C12" },
];

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="bg-white rounded-lg p-5 shadow-sm"
      style={{ borderLeft: `3px solid ${accent ?? "#1B4F72"}` }}
    >
      <p className="text-[#5D6D7E] text-xs uppercase tracking-wide font-medium">{label}</p>
      <p className="text-[28px] font-semibold text-[#1B4F72] mt-1 leading-none">{value}</p>
      {sub && <p className="text-[#5D6D7E] text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <AppShell title="Dashboard — Vista General" user={user}>
      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Flota Total" value={mockKpis.totalVehiculos} sub={`${mockKpis.vehiculosDisponibles} disponibles`} accent="#1B4F72" />
        <KpiCard label="En Tránsito" value={mockKpis.enTransitoCount} sub="envíos activos" accent="#2980B9" />
        <KpiCard label="Pendientes" value={mockKpis.pendientesCount} sub="por asignar" accent="#F39C12" />
        <KpiCard label="Envíos Semana" value={mockKpis.enviosSemana} sub={`${mockKpis.enviosHoy} hoy`} accent="#16A085" />
        <KpiCard label="Prefacturas" value={mockKpis.prefacturasPendientes} sub="en revisión" accent="#E8702A" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Weekly trend */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-[#0D1B2A] font-semibold text-sm mb-4">Envíos por Tipo — Última Semana</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyTrendData} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FB" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5D6D7E" }} />
              <YAxis tick={{ fontSize: 11, fill: "#5D6D7E" }} />
              <Tooltip
                contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 6, color: "#F4F6F7", fontSize: 12 }}
              />
              <Bar dataKey="distribucion" name="Distribución" fill="#1B4F72" radius={[2, 2, 0, 0]} />
              <Bar dataKey="puerto" name="Puerto" fill="#16A085" radius={[2, 2, 0, 0]} />
              <Bar dataKey="material" name="Mat. Técnico" fill="#8E44AD" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Operation breakdown donut */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-[#0D1B2A] font-semibold text-sm mb-4">Distribución por Operación</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={opBreakdownData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                {opBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 6, color: "#F4F6F7", fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {opBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-[#5D6D7E] truncate">{item.name}</span>
                <span className="ml-auto font-semibold text-[#0D1B2A]">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fleet occupancy */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-[#0D1B2A] font-semibold text-sm mb-4">Ocupación de Flota</h2>
          <div className="space-y-3">
            {fleetOccupancyData.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#5D6D7E]">{item.label}</span>
                  <span className="font-semibold text-[#0D1B2A]">{item.value} unidades</span>
                </div>
                <div className="h-5 bg-[#F4F6F7] rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${(item.value / 35) * 100}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#5D6D7E]">
            Ocupación total: <span className="font-semibold text-[#1B4F72]">{mockKpis.fleetOccupancy}%</span>
          </p>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-[#0D1B2A] font-semibold text-sm mb-4">Actividad Reciente</h2>
          <div className="space-y-3">
            {[
              { orden: "ORD-DEMO-0001", accion: "Entregado", tipo: "Distribución", hora: "hace 10 min", color: "#27AE60" },
              { orden: "ORD-DEMO-0007", accion: "En Tránsito", tipo: "Puerto - Contenedor 20ft", hora: "hace 28 min", color: "#2980B9" },
              { orden: "ORD-DEMO-0012", accion: "Prefactura generada", tipo: "Material Técnico", hora: "hace 45 min", color: "#8E44AD" },
              { orden: "ORD-DEMO-0003", accion: "Asignado", tipo: "Puerto - Pallets", hora: "hace 1h", color: "#F39C12" },
              { orden: "ORD-DEMO-0015", accion: "Creado", tipo: "Puerto - Isotanque", hora: "hace 2h", color: "#5D6D7E" },
            ].map((item) => (
              <div key={item.orden} className="flex items-start gap-3 text-xs">
                <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: item.color }} />
                <div className="min-w-0">
                  <span className="font-mono text-[#1B4F72] font-medium">{item.orden}</span>
                  <span className="text-[#5D6D7E] mx-1">—</span>
                  <span style={{ color: item.color }} className="font-medium">{item.accion}</span>
                  <p className="text-[#BDC3C7] truncate">{item.tipo} · {item.hora}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <a href="/envios" className="text-[#1B4F72] text-xs font-medium hover:underline">
              Ver todos los envíos →
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
