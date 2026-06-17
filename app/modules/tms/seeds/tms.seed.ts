import { createLogger } from "~/lib/logger";
import { DriverModel } from "../models/driver.model";
import { VehicleModel, VehicleType, VehicleStatus } from "../models/vehicle.model";
import { ClientModel } from "../models/client.model";
import { ShipmentModel, ShipmentStatus, OperationType } from "../models/shipment.model";
import { PrefacturaModel, PrefacturaStatus } from "../models/prefactura.model";

const logger = createLogger("TMSSeed");

export async function seedTMSData() {
  logger.info("Seeding TMS demo data...");

  // Seed clients
  const clientCount = await ClientModel.countDocuments();
  if (clientCount === 0) {
    await ClientModel.insertMany([
      { razonSocial: "Dow Chemical Argentina S.A.", cuit: "30-50000001-1", ciudad: "Buenos Aires", provincia: "Buenos Aires", email: "logistica@dow.com.ar", tarifaBaseKm: 380, activo: true },
      { razonSocial: "BASF Argentina S.A.", cuit: "30-50000002-2", ciudad: "Zárate", provincia: "Buenos Aires", email: "supply@basf.com.ar", tarifaBaseKm: 350, activo: true },
      { razonSocial: "YPF S.A.", cuit: "30-50000003-3", ciudad: "La Plata", provincia: "Buenos Aires", email: "logistica@ypf.com.ar", tarifaBaseKm: 400, activo: true },
      { razonSocial: "Petronas Quimicos Argentina", cuit: "30-50000004-4", ciudad: "Ensenada", provincia: "Buenos Aires", email: "ops@petronas.com.ar", tarifaBaseKm: 360, activo: true },
      { razonSocial: "Bayer CropScience S.A.", cuit: "30-50000005-5", ciudad: "Buenos Aires", provincia: "Buenos Aires", email: "transport@bayer.com.ar", tarifaBaseKm: 370, activo: true },
    ]);
    logger.info("Seeded clients");
  }

  // Seed drivers
  const driverCount = await DriverModel.countDocuments();
  if (driverCount === 0) {
    await DriverModel.insertMany([
      { nombre: "Carlos", apellido: "Rodríguez", dni: "22345678", licencia: "C1-0001", telefono: "11-4001-0001", email: "carlos.rodriguez@eter.com.ar", activo: true },
      { nombre: "Jorge", apellido: "Martínez", dni: "24567890", licencia: "C1-0002", telefono: "11-4001-0002", email: "jorge.martinez@eter.com.ar", activo: true },
      { nombre: "Roberto", apellido: "González", dni: "26789012", licencia: "C1-0003", telefono: "11-4001-0003", email: "roberto.gonzalez@eter.com.ar", activo: true },
      { nombre: "Eduardo", apellido: "López", dni: "28901234", licencia: "C1-0004", telefono: "11-4001-0004", email: "eduardo.lopez@eter.com.ar", activo: true },
      { nombre: "Miguel", apellido: "Fernández", dni: "30123456", licencia: "C1-0005", telefono: "11-4001-0005", email: "miguel.fernandez@eter.com.ar", activo: true },
      { nombre: "Raúl", apellido: "Díaz", dni: "32345678", licencia: "C1-0006", telefono: "11-4001-0006", email: "raul.diaz@eter.com.ar", activo: true },
    ]);
    logger.info("Seeded drivers");
  }

  // Seed vehicles
  const vehicleCount = await VehicleModel.countDocuments();
  if (vehicleCount === 0) {
    const vehicles = [];
    const marcas = ["Mercedes-Benz", "Scania", "Volvo", "Iveco", "MAN"];
    const tipos = [VehicleType.Camion, VehicleType.SemiRemolque, VehicleType.Cisterna, VehicleType.Isotanque, VehicleType.Chasis];
    for (let i = 1; i <= 35; i++) {
      const padded = String(i).padStart(3, "0");
      vehicles.push({
        patente: `ET-${padded}-ET`,
        marca: marcas[i % marcas.length],
        modelo: `Actros ${2000 + (i % 5)}`,
        anio: 2015 + (i % 9),
        tipo: tipos[i % tipos.length],
        estado: i <= 5 ? VehicleStatus.EnViaje : VehicleStatus.Disponible,
        capacidadTon: 20 + (i % 10),
        activo: true,
      });
    }
    await VehicleModel.insertMany(vehicles);
    logger.info("Seeded 35 vehicles");
  }

  // Seed sample shipments
  const shipmentCount = await ShipmentModel.countDocuments();
  if (shipmentCount === 0) {
    const clients = await ClientModel.find().lean();
    const drivers = await DriverModel.find().lean();
    const vehicles = await VehicleModel.find().lean();

    if (clients.length > 0 && drivers.length > 0 && vehicles.length > 0) {
      const sampleShipments = [];
      const ops = Object.values(OperationType);
      const statuses = [ShipmentStatus.Pendiente, ShipmentStatus.EnTransito, ShipmentStatus.Entregado];
      const origenes = ["Planta Zárate", "Terminal Puerto Buenos Aires", "Planta La Plata", "Depósito Dock Sud"];
      const destinos = ["Cliente BA Centro", "Puerto Quequén", "Planta Campana", "Terminal TRP", "Depósito Luján"];

      for (let i = 0; i < 25; i++) {
        const client = clients[i % clients.length];
        const driver = drivers[i % drivers.length];
        const vehicle = vehicles[i % vehicles.length];
        const op = ops[i % ops.length];
        const status = statuses[i % statuses.length];
        const daysAgo = i;
        const plannedDate = new Date();
        plannedDate.setDate(plannedDate.getDate() - daysAgo);

        sampleShipments.push({
          numeroOrden: `ORD-DEMO-${String(i + 1).padStart(4, "0")}`,
          tipoOperacion: op,
          estado: status,
          clienteId: client._id.toString(),
          clienteNombre: client.razonSocial,
          vehiculoId: vehicle._id.toString(),
          vehiculoPatente: vehicle.patente,
          conductorId: driver._id.toString(),
          conductorNombre: `${driver.nombre} ${driver.apellido}`,
          origen: origenes[i % origenes.length],
          destino: destinos[i % destinos.length],
          fechaPlanificada: plannedDate,
          fechaReal: status === ShipmentStatus.Entregado ? plannedDate : undefined,
          kmRecorridos: 50 + (i * 37) % 300,
          tiempoHoras: 2 + (i % 8),
          hazmat: {
            clase: i % 3 === 0 ? "3" : "N/A",
            numeroUN: i % 3 === 0 ? `UN ${1200 + i}` : undefined,
            nombrePropio: i % 3 === 0 ? "Líquido inflamable" : undefined,
          },
          descripcionCarga: `Carga química ${client.razonSocial}`,
          prefacturaGenerada: status === ShipmentStatus.Entregado,
        });
      }

      await ShipmentModel.insertMany(sampleShipments);
      logger.info("Seeded sample shipments");

      // Seed a few prefacturas for delivered shipments
      const deliveredShipments = await ShipmentModel.find({ estado: ShipmentStatus.Entregado }).lean();
      const pfCount = await PrefacturaModel.countDocuments();
      if (pfCount === 0 && deliveredShipments.length > 0) {
        const pfData = deliveredShipments.map((s, idx) => {
          const flete = (s.kmRecorridos ?? 50) * 350;
          const peajes = 1500;
          const combustible = (s.kmRecorridos ?? 50) * 120;
          const importeNeto = flete + peajes + combustible;
          const iva = importeNeto * 0.21;
          const total = importeNeto + iva;
          return {
            numeroPrefactura: `PRF-DEMO-${String(idx + 1).padStart(4, "0")}`,
            envioId: s._id.toString(),
            numeroOrdenRef: s.numeroOrden,
            clienteId: s.clienteId,
            clienteNombre: s.clienteNombre,
            tipoOperacion: s.tipoOperacion,
            estado: idx % 2 === 0 ? PrefacturaStatus.Aprobada : PrefacturaStatus.Borrador,
            fechaGeneracion: new Date(),
            flete,
            peajes,
            combustible,
            adicionales: 0,
            lineas: [
              { descripcion: "Flete", cantidad: s.kmRecorridos ?? 50, unidad: "km", precioUnitario: 350, subtotal: flete },
              { descripcion: "Peajes", cantidad: 1, unidad: "viaje", precioUnitario: peajes, subtotal: peajes },
              { descripcion: "Combustible", cantidad: s.kmRecorridos ?? 50, unidad: "km", precioUnitario: 120, subtotal: combustible },
            ],
            importeNeto,
            ivaRate: 21,
            iva,
            total,
            descripcionServicios: `Transporte de carga química — ${s.tipoOperacion} — ${s.numeroOrden}`,
          };
        });
        await PrefacturaModel.insertMany(pfData);
        logger.info("Seeded sample prefacturas");
      }
    }
  }

  logger.info("TMS seed complete");
}

export default seedTMSData;
