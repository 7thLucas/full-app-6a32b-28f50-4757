import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

export enum VehicleType {
  Camion = "camion",
  SemiRemolque = "semi_remolque",
  Cisterna = "cisterna",
  Isotanque = "isotanque",
  Chasis = "chasis",
  Otro = "otro",
}

export enum VehicleStatus {
  Disponible = "disponible",
  EnViaje = "en_viaje",
  Mantenimiento = "mantenimiento",
  Inactivo = "inactivo",
}

@modelOptions({
  schemaOptions: {
    collection: "tbl_vehicles",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Vehicle extends CommonTypegooseEntity {
  @prop({ type: String, required: true, unique: true, trim: true })
  patente!: string;

  @prop({ type: String, required: false, trim: true })
  marca?: string;

  @prop({ type: String, required: false, trim: true })
  modelo?: string;

  @prop({ type: Number, required: false })
  anio?: number;

  @prop({ type: String, enum: VehicleType, required: true })
  tipo!: VehicleType;

  @prop({ type: String, enum: VehicleStatus, default: VehicleStatus.Disponible })
  estado!: VehicleStatus;

  @prop({ type: Number, required: false })
  capacidadTon?: number;

  @prop({ type: String, required: false, trim: true })
  observaciones?: string;

  @prop({ type: Boolean, default: true })
  activo!: boolean;
}

export const VehicleModel = getModelForClass(Vehicle);
