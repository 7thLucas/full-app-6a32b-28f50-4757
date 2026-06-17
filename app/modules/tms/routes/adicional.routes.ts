import { Router } from "express";
import {
  requireAuth,
  requireAdmin,
} from "~/modules/authentication/authentication.middleware";
import { AdicionalService } from "../services/adicional.service";

/**
 * API de adicionales de prefacturación (Puerto > Contenedores).
 *
 * El router de API se monta en "/api" en server.ts (app.use("/api", apiRoutes)),
 * por lo que Express ELIMINA el prefijo "/api" antes de hacer el match interno.
 * Por eso las rutas se declaran SIN "/api". El navegador igual llama a
 * /api/adicionales/... y resuelve correctamente.
 *
 * - La gestión de la configuración maestra (alta/baja/edición de tipos de
 *   adicional) queda restringida al rol Admin (Gerencia + Administración).
 * - La aplicación de adicionales a una prefactura concreta la realizan
 *   Operaciones / Facturación, por lo que sólo requiere autenticación.
 */
const router = Router();

// ── Configuración maestra de adicionales (Administración) ────────────────────

router.get("/adicionales", requireAuth, async (req, res) => {
  try {
    const { activo, scope } = req.query;
    const filter: Record<string, any> = {};
    if (activo !== undefined) filter.activo = activo === "true";
    if (scope) filter.scope = scope;
    const items = await AdicionalService.findAll(filter);
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/adicionales/:id", requireAuth, async (req, res) => {
  try {
    const item = await AdicionalService.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: "Adicional no encontrado" });
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/adicionales", requireAdmin, async (req, res) => {
  try {
    const item = await AdicionalService.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/adicionales/:id", requireAdmin, async (req, res) => {
  try {
    const item = await AdicionalService.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: "Adicional no encontrado" });
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/adicionales/:id", requireAdmin, async (req, res) => {
  try {
    await AdicionalService.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Aplicar adicionales a una prefactura (Operaciones / Facturación) ─────────

router.put("/prefacturas/:id/adicionales", requireAuth, async (req, res) => {
  try {
    const inputs = Array.isArray(req.body?.adicionales) ? req.body.adicionales : [];
    const pf = await AdicionalService.applyToPrefactura(req.params.id, inputs);
    res.json({ success: true, data: pf });
  } catch (err: any) {
    const status = /no aplican|exportada|no encontrada/i.test(err.message) ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

export default router;
