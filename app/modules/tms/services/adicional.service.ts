import {
  AdicionalConfigModel,
  AdicionalConfig,
  AdicionalModo,
  AdicionalScope,
} from "../models/adicional-config.model";
import { PrefacturaModel, PrefacturaStatus } from "../models/prefactura.model";
import { OperationType } from "../models/shipment.model";

/**
 * Subcategorías a las que aplican los adicionales de Puerto > Contenedores.
 * Sólo los contenedores (20' y 40') reciben adicionales post-viaje
 * (lavado, devolución, estadía por día).
 */
export const CONTENEDOR_OPERATIONS: OperationType[] = [
  OperationType.PuertoContenedor20,
  OperationType.PuertoContenedor40,
];

export function isContenedorOperation(tipo?: string): boolean {
  return !!tipo && (CONTENEDOR_OPERATIONS as string[]).includes(tipo);
}

interface AdicionalInput {
  adicionalConfigId?: string;
  nombre: string;
  modo: AdicionalModo;
  tarifa: number;
  dias?: number;
  fechaRetiro?: string | Date;
  fechaDevolucion?: string | Date;
}

/**
 * Calcula los días de estadía entre retiro y devolución (mínimo 1) cuando se
 * proveen ambas fechas; si no, respeta el valor de `dias` enviado.
 */
function resolveDias(input: AdicionalInput): number {
  if (input.modo !== AdicionalModo.PorDia) return 1;
  if (input.fechaRetiro && input.fechaDevolucion) {
    const retiro = new Date(input.fechaRetiro).getTime();
    const devolucion = new Date(input.fechaDevolucion).getTime();
    if (!Number.isNaN(retiro) && !Number.isNaN(devolucion) && devolucion >= retiro) {
      const diff = Math.ceil((devolucion - retiro) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff);
    }
  }
  return Math.max(1, Math.floor(input.dias ?? 1));
}

function computeSubtotal(modo: AdicionalModo, tarifa: number, dias: number): number {
  return modo === AdicionalModo.PorDia ? tarifa * dias : tarifa;
}

export const AdicionalService = {
  // ── Master config CRUD ────────────────────────────────────────────────────
  async findAll(filters: Record<string, any> = {}) {
    return AdicionalConfigModel.find(filters).sort({ orden: 1, nombre: 1 }).lean();
  },

  async findById(id: string) {
    return AdicionalConfigModel.findById(id).lean();
  },

  async create(data: Partial<AdicionalConfig>) {
    const adicional = new AdicionalConfigModel({
      ...data,
      scope: data.scope ?? AdicionalScope.PuertoContenedores,
    });
    return adicional.save();
  },

  async update(id: string, data: Partial<AdicionalConfig>) {
    return AdicionalConfigModel.findByIdAndUpdate(id, data, { new: true }).lean();
  },

  async delete(id: string) {
    return AdicionalConfigModel.findByIdAndDelete(id);
  },

  /**
   * Normaliza la lista de adicionales recibida desde la UI, calculando días y
   * subtotales del lado del servidor (nunca confiar en el subtotal del cliente).
   */
  normalizeAdicionales(inputs: AdicionalInput[] = []) {
    return inputs.map((input) => {
      const modo = input.modo ?? AdicionalModo.MontoFijo;
      const tarifa = Number(input.tarifa) || 0;
      const dias = resolveDias({ ...input, modo, tarifa });
      const subtotal = computeSubtotal(modo, tarifa, dias);
      return {
        adicionalConfigId: input.adicionalConfigId,
        nombre: input.nombre,
        modo,
        tarifa,
        dias,
        subtotal,
        fechaRetiro: input.fechaRetiro ? new Date(input.fechaRetiro) : undefined,
        fechaDevolucion: input.fechaDevolucion ? new Date(input.fechaDevolucion) : undefined,
      };
    });
  },

  /**
   * Aplica/actualiza la lista de adicionales de una prefactura y recalcula:
   *  - el campo `adicionales` (suma),
   *  - las líneas (quita las líneas de adicional previas y reinyecta las nuevas),
   *  - los totales (importeNeto, iva, total),
   *  - la descripción de servicios usada en el export a Tango.
   *
   * Restringido a prefacturas de Puerto > Contenedores. No permite editar
   * prefacturas ya exportadas.
   */
  async applyToPrefactura(prefacturaId: string, inputs: AdicionalInput[]) {
    const pf = await PrefacturaModel.findById(prefacturaId);
    if (!pf) throw new Error("Prefactura no encontrada");

    if (!isContenedorOperation(pf.tipoOperacion)) {
      throw new Error(
        "Los adicionales sólo aplican a prefacturas de Puerto > Contenedores."
      );
    }
    if (pf.estado === PrefacturaStatus.Exportada) {
      throw new Error("No se puede modificar una prefactura ya exportada.");
    }

    const detalle = AdicionalService.normalizeAdicionales(inputs);
    const adicionalesTotal = detalle.reduce((sum, a) => sum + a.subtotal, 0);

    // Reconstruir líneas: conservar las que no son adicionales y reinyectar los adicionales.
    const baseLineas = (pf.lineas ?? []).filter((l) => !(l as any).esAdicional);
    const adicionalLineas = detalle.map((a) => ({
      descripcion:
        a.modo === AdicionalModo.PorDia
          ? `Adicional: ${a.nombre} (${a.dias} día/s)`
          : `Adicional: ${a.nombre}`,
      cantidad: a.modo === AdicionalModo.PorDia ? a.dias : 1,
      unidad: a.modo === AdicionalModo.PorDia ? "día" : "unidad",
      precioUnitario: a.tarifa,
      subtotal: a.subtotal,
      esAdicional: true,
    }));

    pf.adicionalesDetalle = detalle as any;
    pf.adicionales = adicionalesTotal;
    pf.lineas = [...baseLineas, ...adicionalLineas] as any;

    // Recalcular totales. importeNeto = flete + peajes + combustible + adicionales.
    const importeNeto =
      (pf.flete ?? 0) + (pf.peajes ?? 0) + (pf.combustible ?? 0) + adicionalesTotal;
    const ivaRate = pf.ivaRate ?? 21;
    const iva = importeNeto * (ivaRate / 100);
    pf.importeNeto = importeNeto;
    pf.iva = iva;
    pf.total = importeNeto + iva;

    // Reflejar los adicionales en la descripción de servicios (export Tango).
    const baseDescripcion = (pf.descripcionServicios ?? "").split(" | Adicionales:")[0];
    if (detalle.length > 0) {
      const resumen = detalle
        .map((a) =>
          a.modo === AdicionalModo.PorDia
            ? `${a.nombre} x${a.dias}d`
            : a.nombre
        )
        .join(", ");
      pf.descripcionServicios = `${baseDescripcion} | Adicionales: ${resumen}`;
    } else {
      pf.descripcionServicios = baseDescripcion;
    }

    await pf.save();
    return pf.toObject();
  },
};

/**
 * Siembra los tres adicionales por defecto de Puerto > Contenedores si la
 * colección está vacía: Lavado, Devolución y Por día de devolución.
 */
export async function seedAdicionalesDefaults() {
  const count = await AdicionalConfigModel.countDocuments();
  if (count > 0) return;
  await AdicionalConfigModel.insertMany([
    {
      nombre: "Lavado",
      tarifa: 25000,
      modo: AdicionalModo.MontoFijo,
      scope: AdicionalScope.PuertoContenedores,
      descripcion: "Lavado del contenedor luego de su devolución.",
      activo: true,
      orden: 1,
    },
    {
      nombre: "Devolución",
      tarifa: 18000,
      modo: AdicionalModo.MontoFijo,
      scope: AdicionalScope.PuertoContenedores,
      descripcion: "Cargo fijo por devolución del contenedor.",
      activo: true,
      orden: 2,
    },
    {
      nombre: "Por día de devolución",
      tarifa: 9000,
      modo: AdicionalModo.PorDia,
      scope: AdicionalScope.PuertoContenedores,
      descripcion: "Cargo por día de estadía/atraso en la devolución del contenedor.",
      activo: true,
      orden: 3,
    },
  ]);
}
