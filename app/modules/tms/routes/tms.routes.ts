import { Router } from "express";
import { requireAuth } from "~/modules/authentication/authentication.middleware";
import { ShipmentModel, ShipmentStatus, OperationType } from "../models/shipment.model";
import { DriverModel } from "../models/driver.model";
import { VehicleModel, VehicleStatus } from "../models/vehicle.model";
import { ClientModel } from "../models/client.model";
import { PrefacturaModel, PrefacturaStatus } from "../models/prefactura.model";
import { ChecklistModel, ChecklistPhase } from "../models/checklist.model";
import { ShipmentService } from "../services/shipment.service";

const router = Router();

// ── Shipments ──────────────────────────────────────────────────────────────────

router.get("/api/shipments", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, estado, tipoOperacion, conductorId, vehiculoId } = req.query;
    const filters: Record<string, any> = {};
    if (estado) filters.estado = estado;
    if (tipoOperacion) filters.tipoOperacion = tipoOperacion;
    if (conductorId) filters.conductorId = conductorId;
    if (vehiculoId) filters.vehiculoId = vehiculoId;
    const result = await ShipmentService.findAll(filters, Number(page), Number(limit));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/api/shipments/kpis", requireAuth, async (req, res) => {
  try {
    const { tipoOperacion } = req.query;
    const kpis = await ShipmentService.getKpis(tipoOperacion as OperationType | undefined);
    res.json({ success: true, data: kpis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/api/shipments/:id", requireAuth, async (req, res) => {
  try {
    const shipment = await ShipmentService.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, error: "Envío no encontrado" });
    res.json({ success: true, data: shipment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/shipments", requireAuth, async (req, res) => {
  try {
    const shipment = await ShipmentService.create(req.body);
    // Mark vehicle as in-transit when assigned
    if (req.body.vehiculoId && req.body.estado === ShipmentStatus.EnTransito) {
      await VehicleModel.findByIdAndUpdate(req.body.vehiculoId, { estado: VehicleStatus.EnViaje });
    }
    res.status(201).json({ success: true, data: shipment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/api/shipments/:id", requireAuth, async (req, res) => {
  try {
    const shipment = await ShipmentService.update(req.params.id, req.body);
    res.json({ success: true, data: shipment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/api/shipments/:id/status", requireAuth, async (req, res) => {
  try {
    const { estado } = req.body;
    const shipment = await ShipmentService.updateStatus(req.params.id, estado as ShipmentStatus);
    res.json({ success: true, data: shipment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/api/shipments/:id/location", requireAuth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const shipment = await ShipmentService.updateLocation(req.params.id, lat, lng);
    res.json({ success: true, data: shipment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/api/shipments/:id", requireAuth, async (req, res) => {
  try {
    await ShipmentService.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Drivers ────────────────────────────────────────────────────────────────────

router.get("/api/drivers", requireAuth, async (req, res) => {
  try {
    const { activo } = req.query;
    const filter = activo !== undefined ? { activo: activo === "true" } : {};
    const drivers = await DriverModel.find(filter).sort({ apellido: 1, nombre: 1 }).lean();
    res.json({ success: true, data: drivers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/api/drivers/:id", requireAuth, async (req, res) => {
  try {
    const driver = await DriverModel.findById(req.params.id).lean();
    if (!driver) return res.status(404).json({ success: false, error: "Conductor no encontrado" });
    res.json({ success: true, data: driver });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/drivers", requireAuth, async (req, res) => {
  try {
    const driver = new DriverModel(req.body);
    await driver.save();
    res.status(201).json({ success: true, data: driver });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/api/drivers/:id", requireAuth, async (req, res) => {
  try {
    const driver = await DriverModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json({ success: true, data: driver });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/api/drivers/:id", requireAuth, async (req, res) => {
  try {
    await DriverModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Vehicles ──────────────────────────────────────────────────────────────────

router.get("/api/vehicles", requireAuth, async (req, res) => {
  try {
    const { estado, activo } = req.query;
    const filter: Record<string, any> = {};
    if (estado) filter.estado = estado;
    if (activo !== undefined) filter.activo = activo === "true";
    const vehicles = await VehicleModel.find(filter).sort({ patente: 1 }).lean();
    res.json({ success: true, data: vehicles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/api/vehicles/:id", requireAuth, async (req, res) => {
  try {
    const vehicle = await VehicleModel.findById(req.params.id).lean();
    if (!vehicle) return res.status(404).json({ success: false, error: "Vehículo no encontrado" });
    res.json({ success: true, data: vehicle });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/vehicles", requireAuth, async (req, res) => {
  try {
    const vehicle = new VehicleModel(req.body);
    await vehicle.save();
    res.status(201).json({ success: true, data: vehicle });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/api/vehicles/:id", requireAuth, async (req, res) => {
  try {
    const vehicle = await VehicleModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json({ success: true, data: vehicle });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/api/vehicles/:id", requireAuth, async (req, res) => {
  try {
    await VehicleModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Clients ────────────────────────────────────────────────────────────────────

router.get("/api/clients", requireAuth, async (req, res) => {
  try {
    const { activo } = req.query;
    const filter = activo !== undefined ? { activo: activo === "true" } : {};
    const clients = await ClientModel.find(filter).sort({ razonSocial: 1 }).lean();
    res.json({ success: true, data: clients });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/api/clients/:id", requireAuth, async (req, res) => {
  try {
    const client = await ClientModel.findById(req.params.id).lean();
    if (!client) return res.status(404).json({ success: false, error: "Cliente no encontrado" });
    res.json({ success: true, data: client });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/clients", requireAuth, async (req, res) => {
  try {
    const client = new ClientModel(req.body);
    await client.save();
    res.status(201).json({ success: true, data: client });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/api/clients/:id", requireAuth, async (req, res) => {
  try {
    const client = await ClientModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json({ success: true, data: client });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/api/clients/:id", requireAuth, async (req, res) => {
  try {
    await ClientModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Prefacturas ────────────────────────────────────────────────────────────────

router.get("/api/prefacturas", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, estado, tipoOperacion, clienteId } = req.query;
    const filter: Record<string, any> = {};
    if (estado) filter.estado = estado;
    if (tipoOperacion) filter.tipoOperacion = tipoOperacion;
    if (clienteId) filter.clienteId = clienteId;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      PrefacturaModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      PrefacturaModel.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/api/prefacturas/:id", requireAuth, async (req, res) => {
  try {
    const pf = await PrefacturaModel.findById(req.params.id).lean();
    if (!pf) return res.status(404).json({ success: false, error: "Prefactura no encontrada" });
    res.json({ success: true, data: pf });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/api/prefacturas/:id", requireAuth, async (req, res) => {
  try {
    const pf = await PrefacturaModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json({ success: true, data: pf });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/api/prefacturas/:id/approve", requireAuth, async (req, res) => {
  try {
    const pf = await PrefacturaModel.findByIdAndUpdate(
      req.params.id,
      { estado: PrefacturaStatus.Aprobada },
      { new: true }
    ).lean();
    res.json({ success: true, data: pf });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Tango export — returns JSON that the frontend uses to build CSV/Excel
router.get("/api/prefacturas/export/tango", requireAuth, async (req, res) => {
  try {
    const { ids } = req.query;
    const filter: Record<string, any> = { estado: { $in: [PrefacturaStatus.Aprobada, PrefacturaStatus.Revisada] } };
    if (ids) {
      const idList = String(ids).split(",");
      filter._id = { $in: idList };
    }
    const prefacturas = await PrefacturaModel.find(filter).lean();
    const rows = prefacturas.map((pf) => ({
      cliente: pf.clienteNombre ?? pf.clienteId,
      comprobante: pf.numeroPrefactura,
      importe_neto: pf.importeNeto,
      iva: pf.iva,
      total: pf.total,
      descripcion_servicios: pf.descripcionServicios ?? "",
      tipo_operacion: pf.tipoOperacion,
    }));

    // Mark as exported
    await PrefacturaModel.updateMany(filter, { estado: PrefacturaStatus.Exportada, fechaExportacion: new Date() });

    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Checklists ─────────────────────────────────────────────────────────────────

router.get("/api/checklists", requireAuth, async (req, res) => {
  try {
    const { envioId, conductorId, fase } = req.query;
    const filter: Record<string, any> = {};
    if (envioId) filter.envioId = envioId;
    if (conductorId) filter.conductorId = conductorId;
    if (fase) filter.fase = fase;
    const checklists = await ChecklistModel.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: checklists });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/checklists", requireAuth, async (req, res) => {
  try {
    // Default items per phase
    const defaultItems = {
      [ChecklistPhase.PreViaje]: [
        { pregunta: "¿Verificó nivel de aceite?", completado: false },
        { pregunta: "¿Verificó nivel de agua?", completado: false },
        { pregunta: "¿Verificó presión de neumáticos?", completado: false },
        { pregunta: "¿Verificó luces delanteras y traseras?", completado: false },
        { pregunta: "¿Cuenta con documentación de carga HAZMAT?", completado: false },
        { pregunta: "¿Verificó estado de la carga/contenedor?", completado: false },
        { pregunta: "¿Equipo de emergencia en buen estado?", completado: false },
      ],
      [ChecklistPhase.DuranteViaje]: [
        { pregunta: "¿Estado de la carga sin novedades?", completado: false },
        { pregunta: "¿Vehículo funcionando correctamente?", completado: false },
      ],
      [ChecklistPhase.PostViaje]: [
        { pregunta: "¿Carga entregada conforme?", completado: false },
        { pregunta: "¿Documentación firmada por el receptor?", completado: false },
        { pregunta: "¿Vehículo sin daños tras el viaje?", completado: false },
        { pregunta: "¿Se registraron novedades durante el viaje?", completado: false },
      ],
    };

    const items = req.body.items ?? defaultItems[req.body.fase as ChecklistPhase] ?? [];
    const checklist = new ChecklistModel({ ...req.body, items });
    await checklist.save();
    res.status(201).json({ success: true, data: checklist });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/api/checklists/:id", requireAuth, async (req, res) => {
  try {
    const checklist = await ChecklistModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json({ success: true, data: checklist });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/api/checklists/:id/complete", requireAuth, async (req, res) => {
  try {
    const checklist = await ChecklistModel.findByIdAndUpdate(
      req.params.id,
      { completado: true, completadoAt: new Date() },
      { new: true }
    ).lean();
    res.json({ success: true, data: checklist });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Dashboard Aggregations ─────────────────────────────────────────────────────

router.get("/api/dashboard/overview", requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalVehiculos,
      vehiculosDisponibles,
      vehiculosEnViaje,
      totalConductores,
      enviosHoy,
      enviosSemana,
      enTransitoCount,
      pendientesCount,
      prefacturasPendientes,
      byOperation,
    ] = await Promise.all([
      VehicleModel.countDocuments({ activo: true }),
      VehicleModel.countDocuments({ activo: true, estado: VehicleStatus.Disponible }),
      VehicleModel.countDocuments({ activo: true, estado: VehicleStatus.EnViaje }),
      DriverModel.countDocuments({ activo: true }),
      ShipmentModel.countDocuments({ createdAt: { $gte: new Date(now.setHours(0, 0, 0, 0)) } }),
      ShipmentModel.countDocuments({ createdAt: { $gte: startOfWeek } }),
      ShipmentModel.countDocuments({ estado: ShipmentStatus.EnTransito }),
      ShipmentModel.countDocuments({ estado: ShipmentStatus.Pendiente }),
      PrefacturaModel.countDocuments({ estado: PrefacturaStatus.Borrador }),
      ShipmentModel.aggregate([
        { $group: { _id: "$tipoOperacion", count: { $sum: 1 } } },
      ]),
    ]);

    const fleetOccupancy = totalVehiculos > 0 ? Math.round((vehiculosEnViaje / totalVehiculos) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalVehiculos,
        vehiculosDisponibles,
        vehiculosEnViaje,
        fleetOccupancy,
        totalConductores,
        enviosHoy,
        enviosSemana,
        enTransitoCount,
        pendientesCount,
        prefacturasPendientes,
        byOperation: byOperation.reduce((acc: Record<string, number>, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── My Trips (Conductor) ───────────────────────────────────────────────────────

router.get("/api/my-trips", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const driver = await DriverModel.findOne({ userId: user.sub }).lean();
    if (!driver) return res.json({ success: true, data: [] });
    const trips = await ShipmentModel.find({ conductorId: driver._id.toString() })
      .sort({ fechaPlanificada: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, data: trips });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
