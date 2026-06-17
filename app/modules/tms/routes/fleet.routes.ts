import { Router } from "express";
import { requireAuth } from "~/modules/authentication/authentication.middleware";
import { FleetService } from "../services/fleet.service";

const router = Router();

// ── Live Fleet Tracking ──────────────────────────────────────────────────────
//
// Returns active trucks (shipments currently En Tránsito) with their last
// reported position plus the confirmed popup metadata: patente, chofer,
// tipo de operación, estado del viaje and última ubicación reportada.
//
// Consumed by the live tracking map (/seguimiento), which is accessible to the
// Operaciones and Gerencia areas. Both areas authenticate into the web app, so
// access is gated by requireAuth consistent with the rest of the TMS API.
router.get("/api/fleet/active-positions", requireAuth, async (_req, res) => {
  try {
    const positions = await FleetService.getActivePositions();
    res.json({
      success: true,
      data: {
        positions,
        count: positions.length,
        // Surfaced so the client can decide between Google Maps and the
        // OpenStreetMap fallback at render time without a separate round-trip.
        googleMapsKey: process.env.GOOGLE_MAPS_API_KEY ?? null,
        refreshedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
