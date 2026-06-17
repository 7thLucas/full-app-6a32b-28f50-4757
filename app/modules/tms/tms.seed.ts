// Root-level barrel so the seed discovery (which scans the module root and
// `src/seeds`, not `seeds/`) runs the core TMS demo data seed, followed by the
// fleet-position seed. Ordering matters: shipments must exist before positions
// can be assigned to the active ones.
import { seedTMSData } from "./seeds/tms.seed";
import { seedFleetPositions } from "./fleet-positions.helper";

export async function seedTMS(): Promise<void> {
  await seedTMSData();
  await seedFleetPositions();
}

export default seedTMS;
