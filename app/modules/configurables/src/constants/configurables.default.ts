/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
  companyName: string;
  tagline: string;
  fleetSize: number;
  defaultCurrency: string;
  ivaRate: number;
  tangoExportEmail: string;
  enableGoogleMaps: boolean;
  enableGoogleSheets: boolean;
  showDistribucion: boolean;
  showPuerto: boolean;
  showMaterialTecnico: boolean;
  loginWelcomeMessage: string;
  footerText: string;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "EterFleet TMS",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "#1B4F72",
    secondary: "#0D1B2A",
    accent: "#E8702A",
  },
  companyName: "EterFleet",
  tagline: "Logística química de precisión",
  fleetSize: 35,
  defaultCurrency: "ARS",
  ivaRate: 21,
  tangoExportEmail: "", // fill it here
  enableGoogleMaps: true,
  enableGoogleSheets: false,
  showDistribucion: true,
  showPuerto: true,
  showMaterialTecnico: true,
  loginWelcomeMessage: "Bienvenido a EterFleet TMS",
  footerText: "EterFleet TMS — Sistema de Gestión de Transporte",
};
