/**
 * B4 — Búsqueda, filtros, orden y paginación local del historial demo.
 *
 * Todo opera sobre las filas ya derivadas por `selectMovementRows`. No hay
 * estado paralelo ni acceso a almacenamiento: la vista controla los controles y
 * estas funciones devuelven los datos que debe presentar.
 */

import type { DemoMovementRow, DemoMovementType } from "../../data/fiore-demo/types";
import { normalizeDemoName } from "./validation";

export type MovementTypeFilter = DemoMovementType | "all";
export type MovementSortKey = "date-desc" | "date-asc";

export interface MovementViewFilters {
  query?: string;
  type?: MovementTypeFilter;
  sort?: MovementSortKey;
}

export interface MovementPage<T> {
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const MOVEMENT_PAGE_SIZE = 6;

export function filterMovementRows(
  rows: readonly DemoMovementRow[],
  filters: MovementViewFilters = {},
): DemoMovementRow[] {
  const needle = normalizeDemoName(filters.query ?? "");
  const type = filters.type ?? "all";

  const filtered = rows.filter((row) => {
    const matchesQuery =
      needle === "" ||
      normalizeDemoName(row.productName).includes(needle) ||
      normalizeDemoName(row.productSku).includes(needle);
    const matchesType = type === "all" || row.type === type;
    return matchesQuery && matchesType;
  });

  const direction = filters.sort === "date-asc" ? 1 : -1;
  return filtered.sort((a, b) => direction * a.createdAt.localeCompare(b.createdAt));
}

/** Página acotada al rango válido; una lista vacía siempre tiene la página 1. */
export function paginateRows<T>(
  rows: readonly T[],
  page: number,
  pageSize: number = MOVEMENT_PAGE_SIZE,
): MovementPage<T> {
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : MOVEMENT_PAGE_SIZE;
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const requested = Number.isInteger(page) && page > 0 ? page : 1;
  const activePage = Math.min(requested, totalPages);
  const start = (activePage - 1) * safePageSize;

  return {
    rows: rows.slice(start, start + safePageSize),
    page: activePage,
    pageSize: safePageSize,
    total,
    totalPages,
  };
}
