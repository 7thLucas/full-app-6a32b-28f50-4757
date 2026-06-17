import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

@modelOptions({
  schemaOptions: {
    collection: "tbl_drivers",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Driver extends CommonTypegooseEntity {
  @prop({ type: String, required: true, trim: true })
  nombre!: string;

  @prop({ type: String, required: true, trim: true })
  apellido!: string;

  @prop({ type: String, required: true, unique: true, trim: true })
  dni!: string;

  @prop({ type: String, required: false, trim: true })
  licencia?: string;

  @prop({ type: Date, required: false })
  licenciaVencimiento?: Date;

  @prop({ type: String, required: false, trim: true })
  telefono?: string;

  @prop({ type: String, required: false, lowercase: true, trim: true })
  email?: string;

  @prop({ type: Boolean, default: true })
  activo!: boolean;

  // Linked user account (conductor role)
  @prop({ type: String, required: false })
  userId?: string;
}

export const DriverModel = getModelForClass(Driver);
