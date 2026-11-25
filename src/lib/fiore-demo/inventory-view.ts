/**
 * B3 — Filtros y orden del inventario de la demo Fiore.
 *
 * Estas funciones son puras: la vista solo controla los valores de los controles
 * y presenta las filas devueltas. La disponibilidad reutiliza `LOW_STOCK_MAX`
 * del selector B0 para no duplicar el umbral de stock bajo.
 */

import type { DemoInventoryRow, DemoProductStatus } from "../../data/fiore-demo/types";
import { LOW_STOCK_MAX } from "./selectors";

export type InventoryAvailability = "all" | "available" | "low" | "out";

export type InventorySortKey =
  | "name-asc"
  | "name-desc"
  | "sku-asc"
  | "stock-asc"
  | "stock-desc"
  | "profit-desc"
  | "price-desc"
  | "created-desc";

export interface InventoryFilters {
  query?: string;
  categoryId?: string | "all";
  status?: DemoProductStatus | "all";
  availability?: InventoryAvailability;
}

const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

function matchesAvailability(row: DemoInventoryRow, availability: InventoryAvailability): boolean {
  if (availability === "available") return row.stock > LOW_STOCK_MAX;
  if (availability === "low") return row.stock > 0 && row.stock <= LOW_STOCK_MAX;
  if (availability === "out") return row.stock === 0;
  return true;
}

/** Filtra por texto (nombre o SKU), categoría, estado y disponibilidad. */
export function filterInventoryRows(
  rows: readonly DemoInventoryRow[],
  filters: InventoryFilters = {},
): DemoInventoryRow[] {
  const query = (filters.query ?? "").trim().toLocaleLowerCase("es");
  const categoryId = filters.categoryId ?? "all";
  const status = filters.status ?? "all";
  const availability = filters.availability ?? "all";

  return rows.filter((row) => {
    const matchesQuery =
      query.length === 0 ||
      row.name.toLocaleLowerCase("es").includes(query) ||
      row.sku.toLocaleLowerCase("es").includes(query);
    const matchesCategory = categoryId === "all" || row.categoryId === categoryId;
    const matchesStatus = status === "all" || row.status === status;

    return (
      matchesQuery &&
      matchesCategory &&
      matchesStatus &&
      matchesAvailability(row, availability)
    );
  });
}

/** Ordena copias de las filas; nunca muta el arreglo recibido. */
export function sortInventoryRows(
  rows: readonly DemoInventoryRow[],
  sort: InventorySortKey = "name-asc",
): DemoInventoryRow[] {
  return [...rows].sort((a, b) => {
    let comparison = 0;

    switch (sort) {
      case "name-desc":
        comparison = collator.compare(b.name, a.name);
        break;
      case "sku-asc":
        comparison = collator.compare(a.sku, b.sku);
        break;
      case "stock-asc":
        comparison = a.stock - b.stock;
        break;
      case "stock-desc":
        comparison = b.stock - a.stock;
        break;
      case "profit-desc":
        comparison = b.pricing.grossProfitTotal - a.pricing.grossProfitTotal;
        break;
      case "price-desc":
        comparison = b.pricing.sellingPrice - a.pricing.sellingPrice;
        break;
      case "created-desc":
        comparison = b.createdAt.localeCompare(a.createdAt);
        break;
      case "name-asc":
      default:
        comparison = collator.compare(a.name, b.name);
        break;
    }

    return comparison === 0 ? collator.compare(a.id, b.id) : comparison;
  });
}
