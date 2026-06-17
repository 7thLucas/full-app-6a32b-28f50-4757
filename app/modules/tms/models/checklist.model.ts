import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

export enum ChecklistPhase {
  PreViaje = "pre_viaje",
  DuranteViaje = "durante_viaje",
  PostViaje = "post_viaje",
}

class ChecklistItem {
  @prop({ type: String, required: true })
  pregunta!: string;

  @prop({ type: Boolean, default: false })
  completado!: boolean;

  @prop({ type: String, required: false })
  nota?: string;

  @prop({ type: Date, required: false })
  completadoAt?: Date;
}

class Novedad {
  @prop({ type: String, required: true })
  descripcion!: string;

  @prop({ type: Date, required: true })
  fecha!: Date;

  @prop({ type: String, required: false })
  fotoUrl?: string;
}

@modelOptions({
  schemaOptions: {
    collection: "tbl_checklists",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Checklist extends CommonTypegooseEntity {
  @prop({ type: String, required: true })
  envioId!: string;

  @prop({ type: String, required: true })
  conductorId!: string;

  @prop({ type: String, enum: ChecklistPhase, required: true })
  fase!: ChecklistPhase;

  @prop({ type: [ChecklistItem], default: [] })
  items!: ChecklistItem[];

  @prop({ type: [Novedad], default: [] })
  novedades!: Novedad[];

  @prop({ type: Boolean, default: false })
  completado!: boolean;

  @prop({ type: Date, required: false })
  completadoAt?: Date;

  // Maintenance request
  @prop({ type: Boolean, default: false })
  solicitaMantenimiento!: boolean;

  @prop({ type: String, required: false })
  detalleMantenimiento?: string;
}

export const ChecklistModel = getModelForClass(Checklist);
