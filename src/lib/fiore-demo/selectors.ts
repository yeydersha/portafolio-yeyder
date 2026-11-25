/**
 * B0 — Selectores derivados de la demo Fiore.
 *
 * No guardan resultados calculados: todo se deriva del estado validado en cada
 * llamada, de modo que inventario, movimientos, dashboard y reportes comparten
 * las mismas cifras.
 */

import type {
  DemoCategoryCount,
  DemoDashboardStats,
  DemoInventoryRow,
  DemoMovementRow,
  DemoPricingView,
  DemoProduct,
  DemoReportData,
  DemoReportFilters,
  DemoReportTotals,
  DemoSaleSummary,
  DemoSupplierCount,
  FioreDemoState,
} from "../../data/fiore-demo/types";
import { calculateProductPricing } from "./pricing";

export const LOW_STOCK_MAX = 5;
const RECENT_LIMIT = 5;
const TOP_PROFIT_LIMIT = 5;

/** Único punto donde un producto demo obtiene su desglose financiero. */
export function buildProductPricing(product: DemoProduct): DemoPricingView {
  return calculateProductPricing({
    costPrice: product.costPrice,
    marginPct: product.marginPct,
    stock: product.stock,
    manualPrice: product.manualPrice,
    manualSellingPrice: product.manualSellingPrice,
  });
}

export function buildInventoryRows(state: FioreDemoState): DemoInventoryRow[] {
  const categoryNames = new Map(state.categories.map((category) => [category.id, category.name]));
  const supplierNames = new Map(state.suppliers.map((supplier) => [supplier.id, supplier.name]));

  return state.products.map((product) => ({
    ...product,
    categoryName: product.categoryId ? categoryNames.get(product.categoryId) : undefined,
    supplierName: product.supplierId ? supplierNames.get(product.supplierId) : undefined,
    pricing: buildProductPricing(product),
  }));
}

/**
 * Resumen de ventas ficticias. El ingreso usa los snapshots guardados en cada
 * movimiento, no los precios vigentes, y se declara explícitamente como
 * proyección para que nunca se lea como ingreso real.
 */
export function selectSimulatedSales(
  state: FioreDemoState,
  productIds?: readonly string[],
): DemoSaleSummary {
  const allowed = productIds ? new Set(productIds) : null;
  const sales = state.movements.filter(
    (movement) => movement.origin === "sale" && (!allowed || allowed.has(movement.productId)),
  );

  return {
    count: sales.length,
    units: sales.reduce((sum, movement) => sum + movement.quantity, 0),
    revenue: sales.reduce((sum, movement) => sum + (movement.total ?? 0), 0),
    note: "Ventas ficticias de demostración: totales snapshot con fines ilustrativos; no representan transacciones reales.",
  };
}

export function selectDashboardStats(state: FioreDemoState): DemoDashboardStats {
  const rows = buildInventoryRows(state);

  const totalUnits = rows.reduce((sum, row) => sum + row.stock, 0);
  const totalCostValue = rows.reduce((sum, row) => sum + row.costPrice * row.stock, 0);
  const totalPotentialSaleValue = rows.reduce(
    (sum, row) => sum + row.pricing.sellingPrice * row.stock,
    0,
  );
  const totalPotentialProfit = rows.reduce(
    (sum, row) => sum + row.pricing.grossProfitTotal,
    0,
  );

  return {
    totalProducts: rows.length,
    totalUnits,
    totalCostValue,
    totalPotentialSaleValue,
    totalPotentialProfit,
    lowStockProducts: rows.filter((row) => row.stock > 0 && row.stock <= LOW_STOCK_MAX),
    outOfStockProducts: rows.filter((row) => row.stock === 0),
    recentProducts: [...rows]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, RECENT_LIMIT),
    topProfitProducts: [...rows]
      .sort((a, b) => b.pricing.grossProfitTotal - a.pricing.grossProfitTotal)
      .slice(0, TOP_PROFIT_LIMIT),
    simulatedSales: selectSimulatedSales(state),
  };
}

export function selectMovementRows(state: FioreDemoState): DemoMovementRow[] {
  const products = new Map(state.products.map((product) => [product.id, product]));
  return state.movements
    .map((movement) => {
      const product = products.get(movement.productId);
      return {
        ...movement,
        productSku: product?.sku ?? "DEMO-SIN-PRODUCTO",
        productName: product?.name ?? "Producto demo eliminado",
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function sumReportTotals(rows: DemoInventoryRow[]): DemoReportTotals {
  return {
    units: rows.reduce((sum, row) => sum + row.stock, 0),
    costValue: rows.reduce((sum, row) => sum + row.costPrice * row.stock, 0),
    saleValue: rows.reduce((sum, row) => sum + row.pricing.sellingPrice * row.stock, 0),
    profit: rows.reduce((sum, row) => sum + row.pricing.grossProfitTotal, 0),
  };
}

export function selectReportData(
  state: FioreDemoState,
  filters: DemoReportFilters = {},
): DemoReportData {
  const rows = buildInventoryRows(state).filter((row) => {
    const matchesCategory = !filters.categoryId || row.categoryId === filters.categoryId;
    const matchesStatus =
      !filters.status || filters.status === "all" || row.status === filters.status;
    return matchesCategory && matchesStatus;
  });

  return {
    rows,
    totals: sumReportTotals(rows),
    sales: selectSimulatedSales(
      state,
      rows.map((row) => row.id),
    ),
  };
}

export function selectCategoryCounts(state: FioreDemoState): DemoCategoryCount[] {
  return state.categories.map((category) => ({
    ...category,
    productCount: state.products.filter((product) => product.categoryId === category.id).length,
  }));
}

export function selectSupplierCounts(state: FioreDemoState): DemoSupplierCount[] {
  return state.suppliers.map((supplier) => ({
    ...supplier,
    productCount: state.products.filter((product) => product.supplierId === supplier.id).length,
  }));
}
