/**
 * C2 — Lógica pura de la futura pantalla de Funciones.
 * Filtra por película o texto, ordena por fecha/hora/ID y deriva el estado de
 * cupos. No contiene JSX, estado de interfaz ni efectos.
 */

import type { TaquillaDemoState } from "../../data/taquilla-cine-demo/types";
import { formatCOP } from "./pricing";
import {
  selectBoletosVendidos,
  selectCuposDisponibles,
  selectFuncionesConTitulo,
  type FuncionConTitulo,
} from "./selectors";

/** Umbral de "pocos cupos" tomado del dataset semilla. */
export const LIMITE_POCOS_CUPOS = 5;

export type EstadoCupos = "agotada" | "pocos" | "disponible";
export type SortDirection = "asc" | "desc";

export interface FuncionViewItem extends FuncionConTitulo {
  vendidos: number;
  estadoCupos: EstadoCupos;
  precioFormateado: string;
}

export interface FuncionesView {
  items: readonly FuncionViewItem[];
  total: number;
  esVacio: boolean;
  mensajeVacio: string;
}

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function compareText(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function estadoDeCupos(disponibles: number): EstadoCupos {
  if (disponibles === 0) return "agotada";
  if (disponibles <= LIMITE_POCOS_CUPOS) return "pocos";
  return "disponible";
}

/** Busca por título de película, sala, fecha u hora; filtra por película si se da. */
export function filterFunciones(
  items: readonly FuncionConTitulo[],
  options: { query?: string; peliculaId?: string } = {},
): FuncionConTitulo[] {
  const busqueda = normalizeText(options.query ?? "");
  return items.filter((item) => {
    if (options.peliculaId && item.peliculaId !== options.peliculaId) return false;
    if (!busqueda) return true;
    return [item.tituloPelicula, item.sala, item.fecha, item.hora].some((campo) =>
      normalizeText(campo).includes(busqueda),
    );
  });
}

/** Mantiene el orden original `fecha, hora, id`; `desc` lo invierte de forma estable. */
export function sortFunciones(
  items: readonly FuncionConTitulo[],
  direction: SortDirection = "asc",
): FuncionConTitulo[] {
  const factor = direction === "desc" ? -1 : 1;
  return [...items].sort(
    (a, b) =>
      factor *
        (compareText(a.fecha, b.fecha) ||
          compareText(a.hora, b.hora) ||
          compareText(a.id, b.id)),
  );
}

export function buildFuncionesView(
  state: TaquillaDemoState,
  options: { query?: string; peliculaId?: string; direction?: SortDirection } = {},
): FuncionesView {
  const filtradas = sortFunciones(
    filterFunciones(selectFuncionesConTitulo(state), options),
    options.direction ?? "asc",
  );
  const items = filtradas.map((funcion) => {
    const disponibles = selectCuposDisponibles(state, funcion.id);
    return {
      ...funcion,
      vendidos: selectBoletosVendidos(state, funcion.id),
      estadoCupos: estadoDeCupos(disponibles),
      precioFormateado: formatCOP(funcion.precioCentavos),
    };
  });
  const esVacio = items.length === 0;
  return {
    items,
    total: items.length,
    esVacio,
    mensajeVacio:
      state.funciones.length === 0
        ? "No hay funciones registradas."
        : "No hay funciones que coincidan con los filtros.",
  };
}
