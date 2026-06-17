import { createLogger } from "~/lib/logger";
import { ShipmentModel, ShipmentStatus } from "./models/shipment.model";

const logger = createLogger("FleetPositionsSeed");

/**
 * Demo coordinates spread across the Buenos Aires / La Plata / Zárate /
 * Campana logistics corridor where EterFleet operates. Used to give the
 * active (En Tránsito) shipments a last-reported position so the live
 * tracking map has markers to display out of the box.
 */
const DEMO_COORDS: Array<[number, number]> = [
  [-34.6037, -58.3816], // CABA — Puerto Buenos Aires
  [-34.9215, -57.9545], // La Plata
  [-34.0975, -59.0289], // Zárate
  [-34.1689, -58.9595], // Campana
  [-34.6708, -58.3539], // Dock Sud
  [-34.4708, -58.5136], // San Isidro / Panamericana
  [-34.7656, -58.2119], // Ezeiza
  [-34.5221, -58.7008], // Pilar
  [-34.8513, -58.3937], // Quilmes
  [-34.6584, -58.6164], // La Matanza
  [-33.7577, -59.6916], // San Pedro
  [-34.4264, -58.5797], // Tigre
];

/**
 * Assigns a last-reported position to active shipments that don't have one yet.
 * Idempotent: only touches En Tránsito shipments missing latitud/longitud.
 */
export async function seedFleetPositions(): Promise<void> {
  const activeMissingPosition = await ShipmentModel.find({
    estado: ShipmentStatus.EnTransito,
    $or: [{ latitud: { $exists: false } }, { latitud: null }],
  })
    .sort({ createdAt: 1 })
    .lean();

  if (activeMissingPosition.length === 0) {
    logger.info("All active shipments already have positions — skipping fleet position seed");
    return;
  }

  let index = 0;
  for (const shipment of activeMissingPosition) {
    const [lat, lng] = DEMO_COORDS[index % DEMO_COORDS.length];
    // Small jitter so markers sharing a base coordinate don't perfectly overlap.
    const jitterLat = lat + (Math.random() - 0.5) * 0.05;
    const jitterLng = lng + (Math.random() - 0.5) * 0.05;
    await ShipmentModel.findByIdAndUpdate(shipment._id, {
      latitud: jitterLat,
      longitud: jitterLng,
      ultimaUbicacionAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 60_000),
    });
    index += 1;
  }

  logger.info(`Seeded positions for ${activeMissingPosition.length} active shipments`);
}

export default seedFleetPositions;
