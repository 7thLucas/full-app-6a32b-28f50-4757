import { ShipmentModel, ShipmentStatus, OperationType } from "../models/shipment.model";

/**
 * Operation-type display labels used for the live tracking map popups.
 * Maps the internal enum values to the three confirmed operation lines
 * (Distribución / Puerto / Material Técnico).
 */
const OPERATION_LABELS: Record<OperationType, string> = {
  [OperationType.Distribucion]: "Distribución",
  [OperationType.PuertoPallets]: "Puerto",
  [OperationType.PuertoContenedor20]: "Puerto",
  [OperationType.PuertoContenedor40]: "Puerto",
  [OperationType.PuertoIsotanque]: "Puerto",
  [OperationType.MaterialTecnico]: "Material Técnico",
};

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  [ShipmentStatus.Pendiente]: "Pendiente",
  [ShipmentStatus.EnTransito]: "En Tránsito",
  [ShipmentStatus.Entregado]: "Entregado",
  [ShipmentStatus.Cancelado]: "Cancelado",
};

export interface FleetPosition {
  id: string;
  numeroOrden: string;
  patente: string;
  chofer: string;
  tipoOperacion: OperationType;
  tipoOperacionLabel: string;
  estado: ShipmentStatus;
  estadoLabel: string;
  origen: string;
  destino: string;
  latitud: number;
  longitud: number;
  ultimaUbicacionAt: string | null;
}

export const FleetService = {
  /**
   * Returns every active truck (a shipment currently in transit that has a
   * reported position) as a marker-ready record carrying the confirmed
   * popup fields: patente, chofer, tipo de operación, estado del viaje and
   * última ubicación reportada.
   */
  async getActivePositions(): Promise<FleetPosition[]> {
    const shipments = await ShipmentModel.find({
      estado: ShipmentStatus.EnTransito,
      latitud: { $ne: null, $exists: true },
      longitud: { $ne: null, $exists: true },
    })
      .sort({ ultimaUbicacionAt: -1 })
      .lean();

    return shipments
      .filter((s) => typeof s.latitud === "number" && typeof s.longitud === "number")
      .map((s) => ({
        id: s._id.toString(),
        numeroOrden: s.numeroOrden,
        patente: s.vehiculoPatente ?? "—",
        chofer: s.conductorNombre ?? "Sin asignar",
        tipoOperacion: s.tipoOperacion,
        tipoOperacionLabel: OPERATION_LABELS[s.tipoOperacion] ?? s.tipoOperacion,
        estado: s.estado,
        estadoLabel: STATUS_LABELS[s.estado] ?? s.estado,
        origen: s.origen,
        destino: s.destino,
        latitud: s.latitud as number,
        longitud: s.longitud as number,
        ultimaUbicacionAt: s.ultimaUbicacionAt ? new Date(s.ultimaUbicacionAt).toISOString() : null,
      }));
  },
};
