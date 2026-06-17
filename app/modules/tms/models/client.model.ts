import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

@modelOptions({
  schemaOptions: {
    collection: "tbl_clients",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Client extends CommonTypegooseEntity {
  @prop({ type: String, required: true, trim: true })
  razonSocial!: string;

  @prop({ type: String, required: false, trim: true })
  cuit?: string;

  @prop({ type: String, required: false, trim: true })
  direccion?: string;

  @prop({ type: String, required: false, trim: true })
  ciudad?: string;

  @prop({ type: String, required: false, trim: true })
  provincia?: string;

  @prop({ type: String, required: false, trim: true })
  telefono?: string;

  @prop({ type: String, required: false, lowercase: true, trim: true })
  email?: string;

  @prop({ type: String, required: false, trim: true })
  contacto?: string;

  // Tarifa base por km (ARS)
  @prop({ type: Number, required: false, default: 0 })
  tarifaBaseKm?: number;

  // Tarifa especial por tipo de operación
  @prop({ type: Object, default: {} })
  tarifasEspeciales?: Record<string, number>;

  @prop({ type: Boolean, default: true })
  activo!: boolean;
}

export const ClientModel = getModelForClass(Client);
