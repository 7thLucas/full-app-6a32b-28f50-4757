import { Router } from "express";
import { requireAuth } from "~/modules/authentication/authentication.middleware";
import { RouteOptimizerService } from "./services/route-optimizer.service";

/**
 * Route-optimization API for Distribución hojas de ruta.
 *
 * The API router is mounted at "/api" in server.ts, so paths here are declared
 * WITHOUT the "/api" prefix. The browser calls /api/route-optimizer/...
 *
 * All endpoints are gated by requireAuth, consistent with the rest of the TMS
 * API (Operaciones and Gerencia areas).
 */
const router = Router();

// Whether a Google Maps key is configured + the current depot settings.
router.get("/route-optimizer/status", requireAuth, async (_req, res) => {
  try {
    const settings = await RouteOptimizerService.getSettings();
    res.json({
      success: true,
      data: {
        googleMapsConfigurado: RouteOptimizerService.hasGoogleMapsKey(),
        deposito: {
          direccion: settings?.depositoDireccion ?? "",
          latitud: settings?.depositoLatitud ?? null,
          longitud: settings?.depositoLongitud ?? null,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update the "depósito de origen" address.
router.put("/route-optimizer/deposito", requireAuth, async (req, res) => {
  try {
    const { direccion } = req.body ?? {};
    if (!direccion || !String(direccion).trim()) {
      return res.status(400).json({ success: false, error: "La dirección del depósito es obligatoria." });
    }
    const settings = await RouteOptimizerService.updateDeposito(String(direccion).trim());
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Compute the optimized stop order for a shipment (read-only).
router.post("/route-optimizer/:shipmentId/optimize", requireAuth, async (req, res) => {
  try {
    const outcome = await RouteOptimizerService.optimize(String(req.params.shipmentId));
    if (!outcome.ok) {
      // NO_KEY is a configuration state, not a server fault: 200 with success:false
      // so the UI shows the Spanish "configurá tu clave" message gracefully.
      const httpStatus =
        outcome.code === "NO_KEY"
          ? 200
          : outcome.code === "NOT_FOUND"
            ? 404
            : outcome.code === "NOT_DISTRIBUTION" || outcome.code === "TOO_FEW_STOPS"
              ? 422
              : 502;
      return res.status(httpStatus).json({ success: false, code: outcome.code, error: outcome.message, details: outcome.details });
    }
    res.json({ success: true, data: outcome });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Apply (persist) an optimized order to the shipment's route sheet.
router.post("/route-optimizer/:shipmentId/apply", requireAuth, async (req, res) => {
  try {
    const { orden, distanciaKm, minutos } = req.body ?? {};
    if (!Array.isArray(orden)) {
      return res.status(400).json({ success: false, error: "Se requiere el arreglo 'orden'." });
    }
    const updated = await RouteOptimizerService.applyOrder(String(req.params.shipmentId), orden, { distanciaKm, minutos });
    if (!updated) return res.status(404).json({ success: false, error: "No se encontró la hoja de ruta." });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
