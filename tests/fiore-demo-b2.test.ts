/**
 * B2 — Pruebas del dashboard funcional de la demo Fiore.
 *
 * El componente `FioreDashboardView` es una proyección directa de
 * `selectDashboardStats`: no calcula ni guarda cifras propias. Por eso estas
 * pruebas verifican exactamente los valores que el dashboard renderiza, sus
 * fuentes (`pricing.ts`) y su reacción a cambios del estado compartido B0.
 * Se ejecutan con el corredor nativo `node --test`, sin dependencias nuevas.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";

import { createSeedState } from "../src/data/fiore-demo/seed";
import type { FioreDemoState } from "../src/data/fiore-demo/types";
import { formatCOP } from "../src/lib/fiore-demo/pricing";
import { applyDemoAction } from "../src/lib/fiore-demo/reducer";
import { LOW_STOCK_MAX, selectDashboardStats } from "../src/lib/fiore-demo/selectors";

function normalizeCOP(value: string): string {
  return value.replace(/\u00a0/g, " ");
}

test("B2 · totales del dashboard derivados de la semilla ficticia", () => {
  const stats = selectDashboardStats(createSeedState());

  assert.equal(stats.totalProducts, 8);
  assert.equal(stats.totalUnits, 58);
  assert.equal(stats.totalCostValue, 5_319_000);
  assert.equal(stats.totalPotentialSaleValue, 8_261_970);
  assert.equal(stats.totalPotentialProfit, 2_942_970);
});

test("B2 · stock bajo respeta el umbral y excluye los agotados", () => {
  const stats = selectDashboardStats(createSeedState());
  const ids = stats.lowStockProducts.map((row) => row.id).sort();

  assert.equal(LOW_STOCK_MAX, 5);
  assert.deepEqual(ids, ["demo-prod-002", "demo-prod-005", "demo-prod-007"]);
  assert.ok(stats.lowStockProducts.every((row) => row.stock >= 1 && row.stock <= LOW_STOCK_MAX));
  assert.ok(stats.lowStockProducts.every((row) => row.stock !== 0));
});

test("B2 · agotados se separan del panel de stock bajo", () => {
  const stats = selectDashboardStats(createSeedState());

  assert.deepEqual(
    stats.outOfStockProducts.map((row) => row.id),
    ["demo-prod-004"],
  );
  assert.equal(stats.outOfStockProducts[0].stock, 0);
  assert.ok(!stats.lowStockProducts.some((row) => row.id === "demo-prod-004"));
});

test("B2 · cálculos por producto usan precio manual y margen sobre venta", () => {
  const stats = selectDashboardStats(createSeedState());

  const manual = stats.recentProducts.find((row) => row.id === "demo-prod-006");
  assert.ok(manual);
  assert.equal(manual.pricing.suggestedPrice, 102_000);
  assert.equal(manual.pricing.sellingPrice, 95_000);
  assert.equal(manual.pricing.grossProfitUnit, 35_000);
  assert.equal(manual.pricing.grossProfitTotal, 630_000);
  assert.equal(manual.pricing.marginPctOnSale, 36.84);
  assert.equal(manual.pricing.markupPctOnCost, 70);

  const suggested = stats.topProfitProducts.find((row) => row.id === "demo-prod-001");
  assert.ok(suggested);
  assert.equal(suggested.pricing.sellingPrice, 136_000);
  assert.equal(suggested.pricing.grossProfitTotal, 612_000);
  assert.equal(suggested.pricing.marginPctOnSale, 37.5);
});

test("B2 · recientes se ordenan por fecha de alta descendente y se limitan a 5", () => {
  const stats = selectDashboardStats(createSeedState());

  assert.deepEqual(
    stats.recentProducts.map((row) => row.id),
    [
      "demo-prod-008",
      "demo-prod-007",
      "demo-prod-006",
      "demo-prod-005",
      "demo-prod-004",
    ],
  );
  assert.equal(stats.recentProducts.length, 5);
});

test("B2 · ranking por ganancia potencial se ordena y se limita a 5", () => {
  const stats = selectDashboardStats(createSeedState());
  const profits = stats.topProfitProducts.map((row) => row.pricing.grossProfitTotal);

  assert.deepEqual(
    stats.topProfitProducts.map((row) => row.id),
    [
      "demo-prod-006",
      "demo-prod-001",
      "demo-prod-003",
      "demo-prod-005",
      "demo-prod-008",
    ],
  );
  assert.deepEqual(profits, [630_000, 612_000, 525_000, 472_500, 303_750]);
  assert.deepEqual(profits, [...profits].sort((a, b) => b - a));
});

test("B2 · un movimiento actualiza los indicadores sin estado paralelo", () => {
  const seed = createSeedState();
  const changed = applyDemoAction(seed, {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-b2-001",
    createdAt: "2026-11-24T10:00:00.000Z",
    input: {
      productId: "demo-prod-002",
      type: "entry",
      quantity: 2,
      note: "Entrada de prueba del dashboard B2",
    },
  });
  assert.equal(changed.changed, true, changed.error);

  const stats = selectDashboardStats(changed.state);
  assert.equal(stats.totalUnits, 60);
  assert.equal(stats.totalCostValue, 5_559_000);
  assert.equal(stats.totalPotentialSaleValue, 8_633_970);
  assert.equal(stats.totalPotentialProfit, 3_074_970);
  assert.deepEqual(
    stats.lowStockProducts.map((row) => row.id).sort(),
    ["demo-prod-005", "demo-prod-007"],
  );

  /* La semilla original no se mutó: las cifras se derivan del estado recibido. */
  assert.equal(selectDashboardStats(seed).totalUnits, 58);
});

test("B2 · cambiar un precio manual recalcula valor potencial y ganancia", () => {
  const seed = createSeedState();
  const edited = applyDemoAction(seed, {
    type: "UPDATE_PRODUCT",
    id: "demo-prod-006",
    patch: { manualSellingPrice: 100_000 },
  });
  assert.equal(edited.changed, true, edited.error);

  const before = selectDashboardStats(seed);
  const after = selectDashboardStats(edited.state);
  assert.equal(after.totalUnits, before.totalUnits);
  assert.equal(after.totalCostValue, before.totalCostValue);
  assert.equal(after.totalPotentialSaleValue, before.totalPotentialSaleValue + 5_000 * 18);
  assert.equal(after.totalPotentialProfit, before.totalPotentialProfit + 5_000 * 18);
  assert.equal(after.topProfitProducts[0].pricing.sellingPrice, 100_000);
});

test("B2 · estado vacío produce totales cero y paneles vacíos", () => {
  const empty: FioreDemoState = {
    version: 1,
    products: [],
    categories: [],
    suppliers: [],
    movements: [],
  };
  const stats = selectDashboardStats(empty);

  assert.equal(stats.totalProducts, 0);
  assert.equal(stats.totalUnits, 0);
  assert.equal(stats.totalCostValue, 0);
  assert.equal(stats.totalPotentialSaleValue, 0);
  assert.equal(stats.totalPotentialProfit, 0);
  assert.deepEqual(stats.lowStockProducts, []);
  assert.deepEqual(stats.outOfStockProducts, []);
  assert.deepEqual(stats.recentProducts, []);
  assert.deepEqual(stats.topProfitProducts, []);
  assert.equal(stats.simulatedSales.count, 0);
  assert.equal(stats.simulatedSales.units, 0);
  assert.equal(stats.simulatedSales.revenue, 0);
});

test("B2 · ventas ficticias se distinguen de la ganancia proyectada", () => {
  const stats = selectDashboardStats(createSeedState());

  assert.equal(stats.simulatedSales.count, 2);
  assert.equal(stats.simulatedSales.units, 5);
  assert.equal(stats.simulatedSales.revenue, 858_000);
  assert.match(stats.simulatedSales.note, /no representan transacciones reales/i);
  assert.notEqual(stats.simulatedSales.revenue, stats.totalPotentialSaleValue);
  assert.notEqual(stats.simulatedSales.revenue, stats.totalPotentialProfit);
});

test("B2 · formato monetario COP sin decimales y con separadores es-CO", () => {
  assert.equal(normalizeCOP(formatCOP(8_261_970)), "$ 8.261.970");
  assert.equal(normalizeCOP(formatCOP(0)), "$ 0");
  assert.equal(normalizeCOP(formatCOP(-1_200)), "-$ 1.200");
  assert.equal(normalizeCOP(formatCOP(Number.NaN)), "$ 0");
});
