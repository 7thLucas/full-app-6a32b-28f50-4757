import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

export enum OperationType {
  Distribucion = "distribucion",
  PuertoPallets = "puerto_pallets",
  PuertoContenedor20 = "puerto_contenedor_20",
  PuertoContenedor40 = "puerto_contenedor_40",
  PuertoIsotanque = "puerto_isotanque",
  MaterialTecnico = "material_tecnico",
}

export enum ShipmentStatus {
  Pendiente = "pendiente",
  EnTransito = "en_transito",
  Entregado = "entregado",
  Cancelado = "cancelado",
}

export enum HazmatClass {
  Clase1 = "1",
  Clase2 = "2",
  Clase3 = "3",
  Clase4 = "4",
  Clase5 = "5",
  Clase6 = "6",
  Clase7 = "7",
  Clase8 = "8",
  Clase9 = "9",
  NoAplica = "N/A",
}

class HazmatInfo {
  @prop({ type: String, enum: HazmatClass, default: HazmatClass.NoAplica })
  clase?: HazmatClass;

  @prop({ type: String, required: false, trim: true })
  numeroUN?: string;

  @prop({ type: String, required: false, trim: true })
  nombrePropio?: string;

  @prop({ type: String, required: false })
  notasManejo?: string;
}

class RoutePoint {
  @prop({ type: String, required: true })
  descripcion!: string;

  @prop({ type: Boolean, default: false })
  completado!: boolean;
}

@modelOptions({
  schemaOptions: {
    collection: "tbl_shipments",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Shipment extends CommonTypegooseEntity {
  // Auto-generated order number
  @prop({ type: String, required: true, unique: true, trim: true })
  numeroOrden!: string;

  @prop({ type: String, enum: OperationType, required: true })
  tipoOperacion!: OperationType;

  @prop({ type: String, enum: ShipmentStatus, default: ShipmentStatus.Pendiente })
  estado!: ShipmentStatus;

  // Client reference (ID)
  @prop({ type: String, required: true })
  clienteId!: string;

  @prop({ type: String, required: false, trim: true })
  clienteNombre?: string; // denormalized for quick display

  // Vehicle reference
  @prop({ type: String, required: false })
  vehiculoId?: string;

  @prop({ type: String, required: false, trim: true })
  vehiculoPatente?: string; // denormalized

  // Driver reference
  @prop({ type: String, required: false })
  conductorId?: string;

  @prop({ type: String, required: false, trim: true })
  conductorNombre?: string; // denormalized

  // Origin & destination
  @prop({ type: String, required: true, trim: true })
  origen!: string;

  @prop({ type: String, required: true, trim: true })
  destino!: string;

  // Dates
  @prop({ type: Date, required: true })
  fechaPlanificada!: Date;

  @prop({ type: Date, required: false })
  fechaReal?: Date;

  // Logistics data
  @prop({ type: Number, required: false, default: 0 })
  kmRecorridos?: number;

  @prop({ type: Number, required: false, default: 0 })
  tiempoHoras?: number;

  // Distribucion-specific
  @prop({ type: String, required: false, trim: true })
  hojaRutaId?: string;

  @prop({ type: Number, required: false, default: 0 })
  entregasCompletadas?: number;

  @prop({ type: Number, required: false, default: 0 })
  entregasTotales?: number;

  @prop({ type: [RoutePoint], required: false, default: [] })
  puntosRuta?: RoutePoint[];

  // Puerto-specific
  @prop({ type: String, required: false, trim: true })
  terminal?: string;

  @prop({ type: Number, required: false, default: 0 })
  cantidadPallets?: number;

  @prop({ type: String, required: false, trim: true })
  numeroContenedor?: string;

  // HAZMAT
  @prop({ type: HazmatInfo, required: false, default: {} })
  hazmat?: HazmatInfo;

  // Cargo description
  @prop({ type: String, required: false })
  descripcionCarga?: string;

  // Tracking
  @prop({ type: Number, required: false })
  latitud?: number;

  @prop({ type: Number, required: false })
  longitud?: number;

  @prop({ type: Date, required: false })
  ultimaUbicacionAt?: Date;

  // Pre-invoicing reference
  @prop({ type: String, required: false })
  prefacturaId?: string;

  @prop({ type: Boolean, default: false })
  prefacturaGenerada!: boolean;

  // Observations
  @prop({ type: String, required: false })
  observaciones?: string;

  // Excel import source
  @prop({ type: String, required: false })
  importadoDe?: string;
}

export const ShipmentModel = getModelForClass(Shipment);
