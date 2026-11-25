/**
 * C2 — Lógica pura de la futura pantalla de Películas.
 * Búsqueda, ordenamiento y estado vacío; sin JSX ni estado de interfaz.
 */

import type { DemoPelicula, TaquillaDemoState } from "../../data/taquilla-cine-demo/types";

export type PeliculaSortKey = "id" | "titulo" | "genero" | "duracionMin";
export type SortDirection = "asc" | "desc";

export interface PeliculasView {
  items: readonly DemoPelicula[];
  total: number;
  esVacio: boolean;
  mensajeVacio: string;
}

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function compareValues(a: string | number, b: string | number): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Búsqueda insensible a mayúsculas y tildes sobre título, género y clasificación. */
export function filterPeliculas(
  items: readonly DemoPelicula[],
  query: string,
): DemoPelicula[] {
  const busqueda = normalizeText(query);
  if (!busqueda) return [...items];
  return items.filter((item) =>
    [item.titulo, item.genero, item.clasificacion].some((campo) =>
      normalizeText(campo).includes(busqueda),
    ),
  );
}

export function sortPeliculas(
  items: readonly DemoPelicula[],
  sortBy: PeliculaSortKey = "id",
  direction: SortDirection = "asc",
): DemoPelicula[] {
  const factor = direction === "desc" ? -1 : 1;
  return [...items].sort(
    (a, b) => factor * compareValues(a[sortBy], b[sortBy]) || compareValues(a.id, b.id),
  );
}

export function buildPeliculasView(
  state: TaquillaDemoState,
  options: {
    query?: string;
    sortBy?: PeliculaSortKey;
    direction?: SortDirection;
  } = {},
): PeliculasView {
  const filtradas = sortPeliculas(
    filterPeliculas(state.peliculas, options.query ?? ""),
    options.sortBy ?? "id",
    options.direction ?? "asc",
  );
  const esVacio = filtradas.length === 0;
  return {
    items: filtradas,
    total: filtradas.length,
    esVacio,
    mensajeVacio:
      state.peliculas.length === 0
        ? "No hay películas registradas."
        : "No hay películas que coincidan con la búsqueda.",
  };
}
