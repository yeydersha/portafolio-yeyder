/**
 * B4 — Filtros y orden de categorías y proveedores de la demo Fiore.
 *
 * Funciones puras: las vistas solo controlan el texto de búsqueda y presentan
 * las filas devueltas. La comparación reutiliza `normalizeDemoName`, la misma
 * que impide nombres duplicados en el reducer.
 */

import type { DemoCategoryCount, DemoSupplierCount } from "../../data/fiore-demo/types";
import { normalizeDemoName } from "./validation";

const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

function matchesName(name: string, query: string): boolean {
  const needle = normalizeDemoName(query);
  return needle === "" || normalizeDemoName(name).includes(needle);
}

export function filterCategoryCounts(
  rows: readonly DemoCategoryCount[],
  query = "",
): DemoCategoryCount[] {
  return rows.filter((row) => matchesName(row.name, query));
}

export function filterSupplierCounts(
  rows: readonly DemoSupplierCount[],
  query = "",
): DemoSupplierCount[] {
  return rows.filter((row) => matchesName(row.name, query));
}

export function sortCategoriesByName(rows: readonly DemoCategoryCount[]): DemoCategoryCount[] {
  return [...rows].sort((a, b) => collator.compare(a.name, b.name));
}

export function sortSuppliersByName(rows: readonly DemoSupplierCount[]): DemoSupplierCount[] {
  return [...rows].sort((a, b) => collator.compare(a.name, b.name));
}
