import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";
import { OperationType } from "./shipment.model";

export enum PrefacturaStatus {
  Borrador = "borrador",
  Revisada = "revisada",
  Aprobada = "aprobada",
  Exportada = "exportada",
}

class LineaPrefactura {
  @prop({ type: String, required: true })
  descripcion!: string;

  @prop({ type: Number, required: true, default: 0 })
  cantidad!: number;

  @prop({ type: String, required: false, default: "" })
  unidad?: string;

  @prop({ type: Number, required: true, default: 0 })
  precioUnitario!: number;

  @prop({ type: Number, required: true, default: 0 })
  subtotal!: number;
}

@modelOptions({
  schemaOptions: {
    collection: "tbl_prefacturas",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Prefactura extends CommonTypegooseEntity {
  @prop({ type: String, required: true, unique: true, trim: true })
  numeroPrefactura!: string;

  @prop({ type: String, required: true })
  envioId!: string;

  @prop({ type: String, required: false, trim: true })
  numeroOrdenRef?: string;

  @prop({ type: String, required: true })
  clienteId!: string;

  @prop({ type: String, required: false, trim: true })
  clienteNombre?: string;

  @prop({ type: String, enum: OperationType, required: true })
  tipoOperacion!: OperationType;

  @prop({ type: String, enum: PrefacturaStatus, default: PrefacturaStatus.Borrador })
  estado!: PrefacturaStatus;

  @prop({ type: Date, required: true })
  fechaGeneracion!: Date;

  @prop({ type: Date, required: false })
  fechaExportacion?: Date;

  // Cost components
  @prop({ type: Number, required: false, default: 0 })
  flete!: number;

  @prop({ type: Number, required: false, default: 0 })
  peajes!: number;

  @prop({ type: Number, required: false, default: 0 })
  combustible!: number;

  @prop({ type: Number, required: false, default: 0 })
  adicionales!: number;

  // Line items
  @prop({ type: [LineaPrefactura], default: [] })
  lineas!: LineaPrefactura[];

  // Totals
  @prop({ type: Number, required: true, default: 0 })
  importeNeto!: number;

  @prop({ type: Number, required: false, default: 21 })
  ivaRate!: number;

  @prop({ type: Number, required: true, default: 0 })
  iva!: number;

  @prop({ type: Number, required: true, default: 0 })
  total!: number;

  @prop({ type: String, required: false })
  descripcionServicios?: string;

  @prop({ type: String, required: false })
  observaciones?: string;

  // Tango export fields
  @prop({ type: String, required: false, trim: true })
  tangoComprobante?: string;
}

export const PrefacturaModel = getModelForClass(Prefactura);
