import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";
import { OperationType } from "./shipment.model";
import { AdicionalModo } from "./adicional-config.model";

export enum PrefacturaStatus {
  Borrador = "borrador",
  Revisada = "revisada",
  Aprobada = "aprobada",
  Exportada = "exportada",
}

/**
 * Adicional aplicado a una prefactura (cargo post-viaje de Puerto > Contenedores).
 * Captura una "foto" de la configuración al momento de cobrarlo, de modo que un
 * cambio posterior en la tarifa maestra no altere prefacturas ya emitidas.
 */
class AdicionalAplicado {
  // Referencia al adicional maestro (AdicionalConfig).
  @prop({ type: String, required: false })
  adicionalConfigId?: string;

  @prop({ type: String, required: true, trim: true })
  nombre!: string;

  @prop({ type: String, enum: AdicionalModo, required: true, default: AdicionalModo.MontoFijo })
  modo!: AdicionalModo;

  // Tarifa aplicada (importe fijo, o valor por día para modo por_dia).
  @prop({ type: Number, required: true, default: 0 })
  tarifa!: number;

  // Cantidad de días (solo relevante para modo por_dia; 1 para monto_fijo).
  @prop({ type: Number, required: true, default: 1 })
  dias!: number;

  // Importe resultante: monto_fijo => tarifa; por_dia => tarifa × dias.
  @prop({ type: Number, required: true, default: 0 })
  subtotal!: number;

  // Fechas de devolución opcionales (para derivar los días de estadía).
  @prop({ type: Date, required: false })
  fechaRetiro?: Date;

  @prop({ type: Date, required: false })
  fechaDevolucion?: Date;
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

  // true cuando la línea proviene de un adicional (Puerto > Contenedores).
  @prop({ type: Boolean, required: false, default: false })
  esAdicional?: boolean;
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

  // Adicionales aplicados (cargos post-viaje de Puerto > Contenedores)
  @prop({ type: [AdicionalAplicado], default: [] })
  adicionalesDetalle!: AdicionalAplicado[];

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
