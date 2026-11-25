/**
 * C2 — Selectores puros de la demo de Taquilla de Cine.
 *
 * Ningún indicador se guarda en el estado: se deriva de películas, funciones y
 * compras. Los importes agregados se comprueban contra la precisión segura de
 * JavaScript antes de devolverse.
 */

import type {
  DemoCompra,
  DemoFuncion,
  DemoPelicula,
  TaquillaDemoState,
} from "../../data/taquilla-cine-demo/types";
import { countSoldTickets } from "./pricing";
import type { ReporteRange } from "./validation";

export interface FuncionConTitulo extends DemoFuncion {
  tituloPelicula: string;
}

export interface CompraConFuncion extends DemoCompra {
  tituloPelicula: string;
  fechaFuncion: string;
  horaFuncion: string;
  sala: string;
  precioUnitarioCentavos: number;
}

export interface ResumenTaquilla {
  cantidadCompras: number;
  boletosVendidos: number;
  totalRecaudadoCentavos: number;
}

export interface DetalleVenta {
  compraId: string;
  fechaCompra: string;
  nombreCliente: string;
  tituloPelicula: string;
  fechaFuncion: string;
  horaFuncion: string;
  sala: string;
  cantidadBoletos: number;
  precioUnitarioCentavos: number;
  totalCentavos: number;
}

export interface ReporteVentas {
  fechaDesde: string;
  fechaHasta: string;
  detalles: DetalleVenta[];
  resumen: ResumenTaquilla;
}

function compareText(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Catálogo en orden de ID, como el listado original. */
export function selectPeliculas(state: TaquillaDemoState): readonly DemoPelicula[] {
  return [...state.peliculas].sort((a, b) => compareText(a.id, b.id));
}

/** Funciones con el título de su película, ordenadas por fecha, hora e ID. */
export function selectFuncionesConTitulo(
  state: TaquillaDemoState,
): readonly FuncionConTitulo[] {
  const titulos = new Map(state.peliculas.map((item) => [item.id, item.titulo]));
  return [...state.funciones]
    .map((funcion) => ({
      ...funcion,
      tituloPelicula: titulos.get(funcion.peliculaId) ?? "",
    }))
    .sort(
      (a, b) =>
        compareText(a.fecha, b.fecha) ||
        compareText(a.hora, b.hora) ||
        compareText(a.id, b.id),
    );
}

/** Cupos libres derivados del historial, no copiados del campo del estado. */
export function selectCuposDisponibles(
  state: TaquillaDemoState,
  funcionId: string,
): number {
  const funcion = state.funciones.find((item) => item.id === funcionId);
  if (!funcion) return 0;
  return funcion.cuposTotales - countSoldTickets(state.compras, funcionId);
}

export function selectBoletosVendidos(
  state: TaquillaDemoState,
  funcionId: string,
): number {
  if (!state.funciones.some((item) => item.id === funcionId)) return 0;
  return countSoldTickets(state.compras, funcionId);
}

export function selectFuncionesAgotadas(
  state: TaquillaDemoState,
): readonly FuncionConTitulo[] {
  return selectFuncionesConTitulo(state).filter(
    (item) => selectCuposDisponibles(state, item.id) === 0,
  );
}

export function selectFuncionesPocosCupos(
  state: TaquillaDemoState,
  limite = 5,
): readonly FuncionConTitulo[] {
  const maximo = Number.isSafeInteger(limite) && limite > 0 ? limite : 5;
  return selectFuncionesConTitulo(state).filter((item) => {
    const disponibles = selectCuposDisponibles(state, item.id);
    return disponibles > 0 && disponibles <= maximo;
  });
}

/** Compras con datos de la función, orden como `fecha_compra DESC, id DESC`. */
export function selectComprasConFuncion(
  state: TaquillaDemoState,
): readonly CompraConFuncion[] {
  const porId = new Map(state.funciones.map((item) => [item.id, item]));
  const titulos = new Map(state.peliculas.map((item) => [item.id, item.titulo]));
  return [...state.compras]
    .map((compra) => {
      const funcion = porId.get(compra.funcionId);
      return {
        ...compra,
        tituloPelicula: funcion ? (titulos.get(funcion.peliculaId) ?? "") : "",
        fechaFuncion: funcion?.fecha ?? "",
        horaFuncion: funcion?.hora ?? "",
        sala: funcion?.sala ?? "",
        precioUnitarioCentavos: funcion?.precioCentavos ?? 0,
      };
    })
    .sort(
      (a, b) =>
        compareText(b.fechaCompra, a.fechaCompra) || compareText(b.id, a.id),
    );
}

function addSafe(total: number, delta: number): number {
  const resultado = total + delta;
  if (!Number.isSafeInteger(resultado)) {
    throw new Error("El total agregado supera la precisión segura de JavaScript");
  }
  return resultado;
}

/** Resume cualquier lista de ventas usando SOLO los importes históricos. */
export function summarizeSales(
  items: readonly { cantidadBoletos: number; totalCentavos: number }[],
): ResumenTaquilla {
  let boletosVendidos = 0;
  let totalRecaudadoCentavos = 0;
  for (const item of items) {
    boletosVendidos = addSafe(boletosVendidos, item.cantidadBoletos);
    totalRecaudadoCentavos = addSafe(totalRecaudadoCentavos, item.totalCentavos);
  }
  return {
    cantidadCompras: items.length,
    boletosVendidos,
    totalRecaudadoCentavos,
  };
}

export function selectResumenTaquilla(
  state: TaquillaDemoState,
): ResumenTaquilla {
  return summarizeSales(state.compras);
}

/** Día local de Bogotá de un timestamp `-05:00`; el offset es fijo. */
export function toBogotaDayKey(fechaCompra: string): string {
  return /^\d{4}-\d{2}-\d{2}T/.test(fechaCompra) ? fechaCompra.slice(0, 10) : "";
}

function detalleFromCompra(
  compra: CompraConFuncion,
): DetalleVenta {
  return {
    compraId: compra.id,
    fechaCompra: compra.fechaCompra,
    nombreCliente: compra.nombreCliente,
    tituloPelicula: compra.tituloPelicula,
    fechaFuncion: compra.fechaFuncion,
    horaFuncion: compra.horaFuncion,
    sala: compra.sala,
    cantidadBoletos: compra.cantidadBoletos,
    precioUnitarioCentavos: compra.precioUnitarioCentavos,
    totalCentavos: compra.totalCentavos,
  };
}

/**
 * Detalle de ventas en rango inclusivo. El resumen se calcula sobre esta MISMA
 * lista, de modo que los KPIs nunca puedan contradecir la tabla.
 */
export function selectReporteVentas(
  state: TaquillaDemoState,
  rango: ReporteRange,
): ReporteVentas {
  const rangoValido = rango.fechaDesde <= rango.fechaHasta;
  const detalles = rangoValido
    ? selectComprasConFuncion(state)
        .filter((compra) => {
          const dia = toBogotaDayKey(compra.fechaCompra);
          return dia >= rango.fechaDesde && dia <= rango.fechaHasta;
        })
        .map(detalleFromCompra)
    : [];
  return {
    fechaDesde: rango.fechaDesde,
    fechaHasta: rango.fechaHasta,
    detalles,
    resumen: summarizeSales(detalles),
  };
}
