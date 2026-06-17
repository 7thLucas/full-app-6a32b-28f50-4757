import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

/**
 * Modo de cobro de un adicional de prefacturación.
 *
 * - `monto_fijo`: se cobra un importe fijo por aplicar el adicional (Lavado, Devolución).
 * - `por_dia`: se cobra tarifa × cantidad de días (Por día de devolución / estadía).
 */
export enum AdicionalModo {
  MontoFijo = "monto_fijo",
  PorDia = "por_dia",
}

/**
 * Ámbito de operación al que aplica el adicional. Por ahora los adicionales de
 * post-viaje (lavado, devolución, estadía) se circunscriben a Puerto >
 * Contenedores (20' y 40'), tal como los gestiona hoy Administración. Se deja
 * el campo configurable para futuras extensiones sin tocar el código.
 */
export enum AdicionalScope {
  PuertoContenedores = "puerto_contenedores",
}

@modelOptions({
  schemaOptions: {
    collection: "tbl_adicionales_config",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class AdicionalConfig extends CommonTypegooseEntity {
  // Nombre visible del adicional (ej. "Lavado", "Devolución", "Por día de devolución").
  @prop({ type: String, required: true, trim: true })
  nombre!: string;

  // Tarifa base en ARS. Para monto_fijo es el importe; para por_dia es el valor por día.
  @prop({ type: Number, required: true, default: 0 })
  tarifa!: number;

  // Modo de cobro.
  @prop({ type: String, enum: AdicionalModo, required: true, default: AdicionalModo.MontoFijo })
  modo!: AdicionalModo;

  // Ámbito de aplicación (subcategoría de operación).
  @prop({ type: String, enum: AdicionalScope, required: true, default: AdicionalScope.PuertoContenedores })
  scope!: AdicionalScope;

  // Descripción opcional / nota interna.
  @prop({ type: String, required: false, trim: true })
  descripcion?: string;

  // Permite desactivar sin borrar.
  @prop({ type: Boolean, required: true, default: true })
  activo!: boolean;

  // Orden de visualización.
  @prop({ type: Number, required: false, default: 0 })
  orden?: number;
}

export const AdicionalConfigModel = getModelForClass(AdicionalConfig);
