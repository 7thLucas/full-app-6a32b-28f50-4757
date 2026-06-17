/* START: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */
export interface FieldSchemaType {
  fieldName?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "color"
    | "url"
    | "enum"
    | "datetime"
    | "file"
    | "files";
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  fields?: FieldSchemaType[];
  item?: FieldSchemaType;
}
/* END: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */

export type ConfigurableSchemas = {
  formSchema: FieldSchemaType[];
};

export const configurableSchemas: ConfigurableSchemas = {
  formSchema: [
    {
      fieldName: "appName",
      type: "string",
      required: true,
      label: "App Name",
    },
    {
      fieldName: "logoUrl",
      type: "url",
      required: true,
      label: "Logo URL",
    },
    {
      fieldName: "brandColor",
      type: "object",
      required: true,
      label: "Brand Color",
      fields: [
        {
          fieldName: "primary",
          type: "color",
          required: true,
          label: "Primary Color (Industrial Blue)",
        },
        {
          fieldName: "secondary",
          type: "color",
          required: true,
          label: "Secondary Color (Deep Navy)",
        },
        {
          fieldName: "accent",
          type: "color",
          required: true,
          label: "Accent Color (Safety Orange)",
        },
      ],
    },
    {
      fieldName: "companyName",
      type: "string",
      required: true,
      label: "Company Name",
    },
    {
      fieldName: "tagline",
      type: "string",
      required: false,
      label: "Tagline / Slogan",
    },
    {
      fieldName: "fleetSize",
      type: "number",
      required: false,
      label: "Fleet Size (number of trucks)",
      min: 1,
      max: 9999,
    },
    {
      fieldName: "defaultCurrency",
      type: "enum",
      required: true,
      label: "Default Currency",
      options: ["ARS", "USD", "EUR"],
    },
    {
      fieldName: "ivaRate",
      type: "number",
      required: false,
      label: "IVA Rate (%)",
      min: 0,
      max: 100,
    },
    {
      fieldName: "tangoExportEmail",
      type: "string",
      required: false,
      label: "Tango Export Email (default recipient)",
    },
    {
      fieldName: "enableGoogleMaps",
      type: "boolean",
      required: false,
      label: "Enable Google Maps Integration",
    },
    {
      fieldName: "enableGoogleSheets",
      type: "boolean",
      required: false,
      label: "Enable Google Sheets Sync",
    },
    {
      fieldName: "showDistribucion",
      type: "boolean",
      required: false,
      label: "Show Distribucion Operations",
    },
    {
      fieldName: "showPuerto",
      type: "boolean",
      required: false,
      label: "Show Puerto Operations",
    },
    {
      fieldName: "showMaterialTecnico",
      type: "boolean",
      required: false,
      label: "Show Material Tecnico Operations",
    },
    {
      fieldName: "loginWelcomeMessage",
      type: "string",
      required: false,
      label: "Login Welcome Message",
    },
    {
      fieldName: "footerText",
      type: "string",
      required: false,
      label: "Footer Text",
    },
  ],
};
