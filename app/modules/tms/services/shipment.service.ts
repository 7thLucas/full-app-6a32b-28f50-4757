import { ShipmentModel, Shipment, ShipmentStatus, OperationType } from "../models/shipment.model";
import { PrefacturaModel, PrefacturaStatus } from "../models/prefactura.model";
import { VehicleModel, VehicleStatus } from "../models/vehicle.model";

function generateOrderNumber(): string {
  const prefix = "ORD";
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function generatePrefacturaNumber(): string {
  const prefix = "PRF";
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function getOperationLabel(tipo: OperationType): string {
  const labels: Record<OperationType, string> = {
    [OperationType.Distribucion]: "Distribución",
    [OperationType.PuertoPallets]: "Puerto - Pallets",
    [OperationType.PuertoContenedor20]: "Puerto - Contenedor 20ft",
    [OperationType.PuertoContenedor40]: "Puerto - Contenedor 40ft",
    [OperationType.PuertoIsotanque]: "Puerto - Isotanque",
    [OperationType.MaterialTecnico]: "Material Técnico",
  };
  return labels[tipo] ?? tipo;
}

export const ShipmentService = {
  async create(data: Partial<Shipment>) {
    const numeroOrden = generateOrderNumber();
    const shipment = new ShipmentModel({ ...data, numeroOrden });
    return await shipment.save();
  },

  async findAll(filters: Record<string, any> = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { ...filters };
    const [items, total] = await Promise.all([
      ShipmentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ShipmentModel.countDocuments(query),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return await ShipmentModel.findById(id).lean();
  },

  async update(id: string, data: Partial<Shipment>) {
    return await ShipmentModel.findByIdAndUpdate(id, data, { new: true }).lean();
  },

  async delete(id: string) {
    return await ShipmentModel.findByIdAndDelete(id);
  },

  async updateStatus(id: string, estado: ShipmentStatus) {
    const shipment = await ShipmentModel.findByIdAndUpdate(
      id,
      { estado, ...(estado === ShipmentStatus.Entregado ? { fechaReal: new Date() } : {}) },
      { new: true }
    ).lean();

    // Auto-generate pre-invoice when delivered
    if (shipment && estado === ShipmentStatus.Entregado && !shipment.prefacturaGenerada) {
      await ShipmentService.autoGeneratePrefactura(shipment._id.toString());
    }

    // Free vehicle when delivered or cancelled
    if (shipment?.vehiculoId && (estado === ShipmentStatus.Entregado || estado === ShipmentStatus.Cancelado)) {
      await VehicleModel.findByIdAndUpdate(shipment.vehiculoId, { estado: VehicleStatus.Disponible });
    }

    return shipment;
  },

  async autoGeneratePrefactura(shipmentId: string) {
    const shipment = await ShipmentModel.findById(shipmentId).lean();
    if (!shipment) return null;

    // Simple auto-calc based on km
    const tarifaKm = 350; // ARS per km — default, should come from client rates
    const kmRec = shipment.kmRecorridos ?? 0;
    const flete = kmRec * tarifaKm;
    const peajes = kmRec > 100 ? 1500 : 500;
    const combustible = kmRec * 120;
    const adicionales = 0;
    const importeNeto = flete + peajes + combustible + adicionales;
    const ivaRate = 21;
    const iva = importeNeto * (ivaRate / 100);
    const total = importeNeto + iva;

    const lineas = [
      { descripcion: "Flete", cantidad: kmRec, unidad: "km", precioUnitario: tarifaKm, subtotal: flete },
      { descripcion: "Peajes", cantidad: 1, unidad: "viaje", precioUnitario: peajes, subtotal: peajes },
      { descripcion: "Combustible", cantidad: kmRec, unidad: "km", precioUnitario: 120, subtotal: combustible },
    ];

    const prefactura = new PrefacturaModel({
      numeroPrefactura: generatePrefacturaNumber(),
      envioId: shipmentId,
      numeroOrdenRef: shipment.numeroOrden,
      clienteId: shipment.clienteId,
      clienteNombre: shipment.clienteNombre,
      tipoOperacion: shipment.tipoOperacion,
      estado: PrefacturaStatus.Borrador,
      fechaGeneracion: new Date(),
      flete,
      peajes,
      combustible,
      adicionales,
      lineas,
      importeNeto,
      ivaRate,
      iva,
      total,
      descripcionServicios: `Servicio de transporte — ${getOperationLabel(shipment.tipoOperacion)} — Orden ${shipment.numeroOrden}`,
    });

    const saved = await prefactura.save();
    await ShipmentModel.findByIdAndUpdate(shipmentId, { prefacturaGenerada: true, prefacturaId: saved._id.toString() });
    return saved;
  },

  async updateLocation(id: string, lat: number, lng: number) {
    return await ShipmentModel.findByIdAndUpdate(
      id,
      { latitud: lat, longitud: lng, ultimaUbicacionAt: new Date() },
      { new: true }
    ).lean();
  },

  async getKpis(tipoOperacion?: OperationType) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

    const baseFilter = tipoOperacion ? { tipoOperacion } : {};

    const [
      totalEnviados,
      hoy,
      semana,
      enTransito,
      pendientes,
      avgKm,
    ] = await Promise.all([
      ShipmentModel.countDocuments({ ...baseFilter }),
      ShipmentModel.countDocuments({ ...baseFilter, createdAt: { $gte: startOfDay } }),
      ShipmentModel.countDocuments({ ...baseFilter, createdAt: { $gte: startOfWeek } }),
      ShipmentModel.countDocuments({ ...baseFilter, estado: ShipmentStatus.EnTransito }),
      ShipmentModel.countDocuments({ ...baseFilter, estado: ShipmentStatus.Pendiente }),
      ShipmentModel.aggregate([
        { $match: { ...baseFilter, kmRecorridos: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: "$kmRecorridos" } } },
      ]),
    ]);

    return {
      totalEnviados,
      hoy,
      semana,
      enTransito,
      pendientes,
      avgKm: Math.round(avgKm[0]?.avg ?? 0),
    };
  },
};
