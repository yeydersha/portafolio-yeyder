/**
 * C2 — Lógica pura de la futura pantalla de Taquilla/Reportes.
 * El rango es inclusivo en `America/Bogota`; el reporte se obtiene de los
 * selectores y los KPIs se derivan del MISMO detalle. Un rango inválido no
 * lanza: devuelve `valido: false`, `issues` y resultados vacíos.
 */

import { DEMO_TODAY, type TaquillaDemoState } from "../../data/taquilla-cine-demo/types";
import { formatCOP } from "./pricing";
import {
  selectReporteVentas,
  toBogotaDayKey,
  type DetalleVenta,
  type ReporteVentas,
  type ResumenTaquilla,
} from "./selectors";
import {
  validateReporteRange,
  type ReporteRange,
  type ValidationIssue,
} from "./validation";

/** Rango de referencia del dataset semilla (`2026-11-25` a `2026-11-30`). */
export const RANGO_REPORTE_POR_DEFECTO: ReporteRange = {
  fechaDesde: DEMO_TODAY,
  fechaHasta: "2026-11-30",
};

export interface DetalleVentaView extends DetalleVenta {
  diaBogota: string;
  precioFormateado: string;
  totalFormateado: string;
}

export interface ReporteView extends ResumenTaquilla {
  valido: boolean;
  issues: ValidationIssue[];
  fechaDesde: string;
  fechaHasta: string;
  detalles: readonly DetalleVentaView[];
  totalRecaudadoFormateado: string;
  esVacio: boolean;
  mensajeVacio: string;
}

function reporteVacio(
  fechaDesde: string,
  fechaHasta: string,
  issues: ValidationIssue[],
): ReporteView {
  return {
    valido: false,
    issues,
    fechaDesde,
    fechaHasta,
    detalles: [],
    cantidadCompras: 0,
    boletosVendidos: 0,
    totalRecaudadoCentavos: 0,
    totalRecaudadoFormateado: formatCOP(0),
    esVacio: true,
    mensajeVacio: "Ajusta el rango de fechas para consultar el reporte.",
  };
}

function fromReporte(reporte: ReporteVentas): ReporteView {
  const detalles = reporte.detalles.map((detalle) => ({
    ...detalle,
    diaBogota: toBogotaDayKey(detalle.fechaCompra),
    precioFormateado: formatCOP(detalle.precioUnitarioCentavos),
    totalFormateado: formatCOP(detalle.totalCentavos),
  }));
  const esVacio = detalles.length === 0;
  return {
    valido: true,
    issues: [],
    fechaDesde: reporte.fechaDesde,
    fechaHasta: reporte.fechaHasta,
    detalles,
    ...reporte.resumen,
    totalRecaudadoFormateado: formatCOP(reporte.resumen.totalRecaudadoCentavos),
    esVacio,
    mensajeVacio: "No hay ventas registradas en el rango seleccionado.",
  };
}

/** Construye la vista a partir de un rango ya validado por el llamador. */
export function buildReporteView(
  state: TaquillaDemoState,
  rango: ReporteRange = RANGO_REPORTE_POR_DEFECTO,
): ReporteView {
  const validacion = validateReporteRange(rango.fechaDesde, rango.fechaHasta);
  if (!validacion.ok) {
    return reporteVacio(String(rango.fechaDesde ?? ""), String(rango.fechaHasta ?? ""), validacion.issues);
  }
  return fromReporte(selectReporteVentas(state, validacion.value));
}

/** Variante para entradas de formulario: valida antes de derivar cualquier dato. */
export function buildReporteViewFromInputs(
  state: TaquillaDemoState,
  fechaDesde: unknown,
  fechaHasta: unknown,
): ReporteView {
  const validacion = validateReporteRange(fechaDesde, fechaHasta);
  if (!validacion.ok) {
    return reporteVacio(
      typeof fechaDesde === "string" ? fechaDesde : "",
      typeof fechaHasta === "string" ? fechaHasta : "",
      validacion.issues,
    );
  }
  return fromReporte(selectReporteVentas(state, validacion.value));
}
