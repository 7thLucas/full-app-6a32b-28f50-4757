import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

/**
 * Singleton-ish settings document for the route-optimization feature.
 *
 * Holds the "depósito de origen" (company depot / base) that distribution
 * routes start and end from. There is only ever one active record, identified
 * by the fixed `clave` discriminator so we can upsert it.
 */
@modelOptions({
  schemaOptions: {
    collection: "tbl_route_settings",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  options: { allowMixed: Severity.ALLOW },
})
export class RouteSettings extends CommonTypegooseEntity {
  // Fixed discriminator so the settings stay a singleton.
  @prop({ type: String, required: true, unique: true, default: "default" })
  clave!: string;

  // Human-readable address of the depot, geocoded when optimizing.
  @prop({ type: String, required: false, trim: true, default: "Av. Hipólito Yrigoyen 1234, Avellaneda, Buenos Aires, Argentina" })
  depositoDireccion?: string;

  // Cached geocoded coordinates of the depot (refreshed on optimization).
  @prop({ type: Number, required: false })
  depositoLatitud?: number;

  @prop({ type: Number, required: false })
  depositoLongitud?: number;
}

export const RouteSettingsModel = getModelForClass(RouteSettings);
