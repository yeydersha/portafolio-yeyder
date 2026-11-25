/**
 * B5 — Modelo puro de reportes de la demo Fiore.
 *
 * La vista no calcula cifras financieras propias: los totales de inventario
 * salen de `selectReportData`, el resumen de ventas de `selectSimulatedSales`
 * y la ganancia histórica de `pricing.ts` usando solo el snapshot `unitCost`
 * guardado al registrar cada venta. Las ventas anteriores a B5 no tenían ese
 * snapshot; en ese caso la ganancia se declara "No disponible" en lugar de
 * aplicar el costo vigente del producto.
 */

import type {
  DemoMovementRow,
  DemoMovementType,
  DemoReportData,
  DemoSaleSummary,
  FioreDemoState,
} from "../../data/fiore-demo/types";
import {
  calculateGrossProfitTotal,
  calculateGrossProfitUnit,
  formatCOP,
} from "./pricing";
import { selectMovementRows, selectReportData, selectSimulatedSales } from "./selectors";

export type ReportMovementFilter = DemoMovementType | "sale";
export type ReportTypeFilter = "all" | ReportMovementFilter;

export interface ReportFilterValues {
  from: string;
  to: string;
  categoryId: string;
  productId: string;
  movementType: ReportTypeFilter;
}

export const EMPTY_REPORT_FILTERS: ReportFilterValues = {
  from: "",
  to: "",
  categoryId: "",
  productId: "",
  movementType: "all",
};

export const MOVEMENT_TYPE_LABELS: Record<DemoMovementType, string> = {
  entry: "Entrada",
  exit: "Salida",
  adjustment: "Ajuste",
  return: "Devolución",
};

export const MOVEMENT_ORIGIN_LABELS: Record<string, string> = {
  seed: "Semilla demo",
  manual: "Manual demo",
  sale: "Venta demo",
};

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ReportMovementRow extends DemoMovementRow {
  categoryName: string;
  /** Importe snapshot; vacío en movimientos que no son ventas. */
  value: number | null;
  /** Ganancia histórica solo si la venta guardó su costo; null si no está disponible. */
  profit: number | null;
}

export interface ReportSaleRow extends ReportMovementRow {
  period: string;
}

export interface ReportSalesSummary extends DemoSaleSummary {
  /** null cuando ninguna venta del filtro tiene snapshot de costo histórico. */
  profit: number | null;
  profitAvailableCount: number;
  profitUnavailableCount: number;
}

export interface ReportChartDatum {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  count: number;
}

export interface ReportChartData {
  inventoryByCategory: ReportChartDatum[];
  movementsByType: ReportChartDatum[];
  salesByPeriod: ReportChartDatum[];
}

export interface ReportModel {
  rangeError: string | null;
  inventory: DemoReportData;
  movements: ReportMovementRow[];
  sales: ReportSaleRow[];
  salesSummary: ReportSalesSummary;
  charts: ReportChartData;
}

/** Valida fechas reales (no solo el formato) para no aceptar, por ejemplo, 2026-02-30. */
export function isIsoDay(value: string): boolean {
  if (!DAY_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Devuelve un mensaje legible cuando el rango no es utilizable. */
export function validateReportFilters(filters: ReportFilterValues): string | null {
  if (filters.from && !isIsoDay(filters.from)) {
    return "La fecha inicial debe ser una fecha válida en formato AAAA-MM-DD.";
  }
  if (filters.to && !isIsoDay(filters.to)) {
    return "La fecha final debe ser una fecha válida en formato AAAA-MM-DD.";
  }
  if (filters.from && filters.to && filters.from > filters.to) {
    return "La fecha inicial no puede ser posterior a la fecha final.";
  }
  return null;
}

export function hasActiveReportFilters(filters: ReportFilterValues): boolean {
  return (
    filters.from.length > 0 ||
    filters.to.length > 0 ||
    filters.categoryId.length > 0 ||
    filters.productId.length > 0 ||
    filters.movementType !== "all"
  );
}

function matchesDay(createdAt: string, from: string, to: string): boolean {
  const day = createdAt.slice(0, 10);
  return (!from || day >= from) && (!to || day <= to);
}

function matchesType(row: DemoMovementRow, filter: ReportTypeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "sale") return row.origin === "sale";
  return row.type === filter;
}

/**
 * Calcula la ganancia histórica de una venta usando exclusivamente el snapshot
 * de costo guardado en el movimiento. Nunca consulta `product.costPrice`.
 */
export function saleProfit(movement: {
  unitPrice?: number;
  unitCost?: number;
  quantity: number;
}): number | null {
  const { unitPrice, unitCost, quantity } = movement;
  if (unitPrice === undefined || unitCost === undefined) return null;
  return calculateGrossProfitTotal(
    calculateGrossProfitUnit(unitPrice, unitCost),
    quantity,
  );
}

function decorateMovement(row: DemoMovementRow): ReportMovementRow {
  const value = row.origin === "sale" && row.total !== undefined ? row.total : null;
  return {
    ...row,
    categoryName: "Sin categoría",
    value,
    profit: row.origin === "sale" ? saleProfit(row) : null,
  };
}

function sumBy(
  rows: ReportChartDatum[],
  key: string,
  label: string,
  value: number,
  formatter: (value: number) => string,
): void {
  const found = rows.find((item) => item.key === key);
  if (found) {
    found.value += value;
    found.formattedValue = formatter(found.value);
    found.count += 1;
  } else {
    rows.push({ key, label, value, formattedValue: formatter(value), count: 1 });
  }
}

export function summarizeInventoryByCategory(
  inventory: DemoReportData,
): ReportChartDatum[] {
  const result: ReportChartDatum[] = [];
  for (const row of inventory.rows) {
    const key = row.categoryId ?? "sin-categoria";
    const label = row.categoryName ?? "Sin categoría";
    sumBy(result, key, label, row.costPrice * row.stock, formatCOP);
  }
  return result.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "es"));
}

export function summarizeMovementsByType(
  movements: readonly ReportMovementRow[],
): ReportChartDatum[] {
  const order: DemoMovementType[] = ["entry", "exit", "adjustment", "return"];
  const result: ReportChartDatum[] = [];
  for (const type of order) {
    const count = movements.filter((row) => row.type === type).length;
    if (count > 0) {
      result.push({
        key: type,
        label: MOVEMENT_TYPE_LABELS[type],
        value: count,
        formattedValue: `${count} mov`,
        count,
      });
    }
  }
  return result;
}

export function summarizeSalesByPeriod(sales: readonly ReportSaleRow[]): ReportChartDatum[] {
  const result: ReportChartDatum[] = [];
  for (const row of sales) {
    const label = row.period;
    sumBy(result, label, label, row.total ?? 0, formatCOP);
  }
  return result.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Construye todo el modelo de reportes. El inventario es saldo actual, por eso
 * el rango de fechas no altera sus cifras; se aplica a movimientos y ventas.
 */
export function buildReportModel(
  state: FioreDemoState,
  filters: ReportFilterValues,
): ReportModel {
  const rangeError = validateReportFilters(filters);
  const categoryId = filters.categoryId || undefined;
  const productId = filters.productId || undefined;

  const scopedProducts = state.products.filter((product) => {
    const matchesCategory = !categoryId || product.categoryId === categoryId;
    const matchesProduct = !productId || product.id === productId;
    return matchesCategory && matchesProduct;
  });
  const scopedIds = new Set(scopedProducts.map((product) => product.id));
  const scopedState: FioreDemoState = {
    ...state,
    products: scopedProducts,
    movements: state.movements.filter((movement) => scopedIds.has(movement.productId)),
  };

  const inventory = selectReportData(scopedState, { categoryId, status: "all" });
  const categoryNames = new Map(state.categories.map((category) => [category.id, category.name]));
  const productCategoryNames = new Map<string, string>();
  for (const product of state.products) {
    if (product.categoryId) {
      const name = categoryNames.get(product.categoryId);
      if (name) productCategoryNames.set(product.id, name);
    }
  }

  const usableRange = rangeError === null;
  const movementRows = usableRange
    ? selectMovementRows(scopedState).filter(
        (row) =>
          matchesDay(row.createdAt, filters.from, filters.to) &&
          matchesType(row, filters.movementType),
      )
    : [];

  const movements = movementRows.map((row) => ({
    ...decorateMovement(row),
    categoryName: productCategoryNames.get(row.productId) ?? "Sin categoría",
  }));

  const sales = movements
    .filter((row) => row.origin === "sale")
    .map((row) => ({ ...row, period: row.createdAt.slice(0, 7) }));

  const salesState: FioreDemoState = { ...scopedState, movements: sales };
  const baseSummary = selectSimulatedSales(salesState);
  const profitValues = sales.map((row) => row.profit);
  const available = profitValues.filter((value): value is number => value !== null);
  const salesSummary: ReportSalesSummary = {
    ...baseSummary,
    profit: available.length > 0 ? available.reduce((sum, value) => sum + value, 0) : null,
    profitAvailableCount: available.length,
    profitUnavailableCount: profitValues.length - available.length,
  };

  return {
    rangeError,
    inventory,
    movements,
    sales,
    salesSummary,
    charts: {
      inventoryByCategory: summarizeInventoryByCategory(inventory),
      movementsByType: summarizeMovementsByType(movements),
      salesByPeriod: summarizeSalesByPeriod(sales),
    },
  };
}

function csvCell(value: string | number | null | undefined, numericText = false): string {
  const raw = value === null || value === undefined ? "" : String(value);
  /* Excel ejecuta celdas que empiezan por = + - @ (o tab/CR); se neutralizan.
   * Una cifra COP negativa empieza por "-" pero no es una fórmula. */
  const safe = !numericText && /^\s*[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Columnas 8-10: cantidad, valor y ganancia; siempre derivadas de números validados. */
const CSV_NUMERIC_CELLS = new Set([8, 9, 10]);

function csvRow(cells: Array<string | number>): string {
  return cells.map((cell, index) => csvCell(cell, CSV_NUMERIC_CELLS.has(index))).join(",");
}

export const REPORT_CSV_HEADERS: readonly string[] = [
  "Dato",
  "Fecha",
  "Hora",
  "Producto",
  "SKU",
  "Categoría",
  "Tipo",
  "Origen",
  "Cantidad",
  "Valor (COP)",
  "Ganancia estimada (COP)",
  "Nota",
  "Aviso",
];

export const REPORT_CSV_NOTICE =
  "DEMO · Datos ficticios; no representan transacciones reales";

function movementCsvCells(row: ReportMovementRow, label: string): Array<string | number> {
  return [
    label,
    row.createdAt.slice(0, 10),
    row.createdAt.slice(11, 16),
    row.productName,
    row.productSku,
    row.categoryName,
    MOVEMENT_TYPE_LABELS[row.type],
    MOVEMENT_ORIGIN_LABELS[row.origin] ?? row.origin,
    row.quantity,
    row.value === null ? "" : formatCOP(row.value),
    row.profit === null ? (row.origin === "sale" ? "No disponible" : "") : formatCOP(row.profit),
    row.note ?? "",
    REPORT_CSV_NOTICE,
  ];
}

/** CSV con BOM para Excel; respeta exactamente las filas filtradas del modelo. */
export function buildReportsCsv(model: ReportModel): string {
  const lines: string[] = [
    csvRow([...REPORT_CSV_HEADERS]),
    ...model.movements.map((row) => csvRow(movementCsvCells(row, "DEMO-MOVIMIENTO"))),
    ...model.sales.map((row) => csvRow(movementCsvCells(row, "DEMO-VENTA"))),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

/** Nombre siempre prefijado con DEMO y con fecha ISO determinista. */
export function buildReportsCsvFileName(isoDay: string): string {
  return `DEMO-reportes-${isIsoDay(isoDay) ? isoDay : "sin-fecha"}.csv`;
}
