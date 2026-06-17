import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useConfigurables } from "~/modules/configurables";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const TruckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const PackageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.07 4.93A10 10 0 0 1 21.98 10h-3.06a7 7 0 0 0-1.72-3.07zM19.07 19.07a10 10 0 0 1-5.07 2.91v-3.06a7 7 0 0 0 3.07-1.72zM4.93 19.07A10 10 0 0 1 2.02 14h3.06a7 7 0 0 0 1.72 3.07zM4.93 4.93A10 10 0 0 1 10 2.02v3.06a7 7 0 0 0-3.07 1.72z" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const ShipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" /><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" /><polyline points="12 8 12 13" /><line x1="9" y1="11" x2="15" y2="11" />
  </svg>
);
const WrenchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const navSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: <HomeIcon /> },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { href: "/envios", label: "Envíos", icon: <PackageIcon /> },
      { href: "/distribucion", label: "Distribución", icon: <MapPinIcon /> },
      { href: "/puerto", label: "Puerto", icon: <ShipIcon /> },
      { href: "/material-tecnico", label: "Material Técnico", icon: <WrenchIcon /> },
      { href: "/seguimiento", label: "Seguimiento en Vivo", icon: <MapPinIcon /> },
    ],
  },
  {
    title: "Facturación",
    items: [
      { href: "/prefacturas", label: "Prefacturas", icon: <DollarIcon /> },
      { href: "/tango-export", label: "Exportar Tango", icon: <FileTextIcon /> },
    ],
  },
  {
    title: "Flota",
    items: [
      { href: "/vehiculos", label: "Vehículos", icon: <TruckIcon /> },
      { href: "/conductores", label: "Conductores", icon: <UsersIcon /> },
      { href: "/conductor", label: "Portal Conductor", icon: <MapPinIcon /> },
    ],
  },
  {
    title: "Gerencia",
    items: [
      { href: "/kpis", label: "KPIs", icon: <ChartIcon /> },
    ],
  },
  {
    title: "Administración",
    items: [
      { href: "/clientes", label: "Clientes", icon: <UsersIcon /> },
      { href: "/adicionales", label: "Adicionales", icon: <DollarIcon /> },
      { href: "/configuracion", label: "Configuración", icon: <SettingsIcon /> },
    ],
  },
];

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  user?: { username: string; role: string; email: string } | null;
}

export function AppShell({ children, title, user }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { config } = useConfigurables();

  const appName = config?.appName ?? "EterFleet TMS";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1e2f40]">
        <div className="w-8 h-8 bg-[#1B4F72] rounded flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="1" y="3" width="15" height="13" rx="1" />
            <path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        {!collapsed && (
          <span className="text-white font-semibold text-sm tracking-tight truncate">{appName}</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#5D6D7E] mb-1">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const active = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm mb-0.5 transition-colors ${
                    active
                      ? "bg-[#1B4F72] text-white"
                      : "text-[#BDC3C7] hover:bg-[#1e2f40] hover:text-white"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge ? (
                    <span className="ml-auto bg-[#E8702A] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User / Logout */}
      {user && (
        <div className="px-3 py-3 border-t border-[#1e2f40]">
          {!collapsed && (
            <div className="mb-2">
              <p className="text-white text-xs font-medium truncate">{user.username}</p>
              <p className="text-[#5D6D7E] text-[10px] capitalize">{user.role}</p>
            </div>
          )}
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className={`flex items-center gap-2 text-[#5D6D7E] hover:text-white text-xs transition-colors ${collapsed ? "justify-center w-full" : ""}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!collapsed && "Cerrar sesión"}
            </button>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F4F6F7] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#0D1B2A] transition-all duration-200 flex-shrink-0 ${collapsed ? "w-16" : "w-60"}`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-5 h-10 bg-[#1e2f40] border border-[#2a4360] rounded text-[#BDC3C7] hover:text-white flex items-center justify-center hidden md:flex"
          style={{ left: collapsed ? "64px" : "240px" }}
        >
          <span className={`transition-transform ${collapsed ? "rotate-180" : ""}`}>
            <ChevronLeftIcon />
          </span>
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0D1B2A]">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 py-3 bg-white border-b border-[#BDC3C7] shadow-sm flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-[#5D6D7E] hover:text-[#0D1B2A]"
          >
            <MenuIcon />
          </button>
          {title && (
            <h1 className="text-[#0D1B2A] font-semibold text-base">{title}</h1>
          )}
          <div className="ml-auto flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1B4F72] flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-[#0D1B2A] text-sm font-medium">{user.username}</span>
                <span className="hidden sm:block px-2 py-0.5 bg-[#EBF5FB] text-[#1B4F72] text-xs font-medium rounded capitalize">
                  {user.role}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
