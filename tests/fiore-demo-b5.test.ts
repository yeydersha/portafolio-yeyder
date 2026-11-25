/**
 * B5 — Pruebas de reportes, filtros, gráficos y CSV de la demo Fiore.
 *
 * Comprueban que la vista deriva sus cifras del estado B0 compartido, que la
 * ganancia histórica nunca usa el costo vigente y que la exportación respeta
 * los filtros y neutraliza fórmulas de Excel.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";

import { createSeedState } from "../src/data/fiore-demo/seed";
import type { DemoProductDraft, FioreDemoState } from "../src/data/fiore-demo/types";
import { formatCOP } from "../src/lib/fiore-demo/pricing";
import { applyDemoAction } from "../src/lib/fiore-demo/reducer";
import {
  buildReportModel,
  buildReportsCsv,
  buildReportsCsvFileName,
  EMPTY_REPORT_FILTERS,
  isIsoDay,
  REPORT_CSV_HEADERS,
  REPORT_CSV_NOTICE,
  saleProfit,
  summarizeInventoryByCategory,
  summarizeMovementsByType,
  summarizeSalesByPeriod,
  validateReportFilters,
  type ReportFilterValues,
} from "../src/lib/fiore-demo/reports-view";
import {
  clearDemoState,
  loadDemoState,
  resetDemoHydrationGate,
  saveDemoState,
  type DemoStorageLike,
} from "../src/lib/fiore-demo/storage";
import { validateDemoState } from "../src/lib/fiore-demo/validation";

/**
 * El estado persistido por localStorage elimina las claves `undefined`.
 * La comparación usa esa misma semántica para simular una recarga real.
 */
function asPersisted<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createMemoryStorage(): DemoStorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function withFilters(partial: Partial<ReportFilterValues> = {}): ReportFilterValues {
  return { ...EMPTY_REPORT_FILTERS, ...partial };
}

test("B5 · valor de inventario a costo y unidades disponibles", () => {
  const model = buildReportModel(createSeedState(), EMPTY_REPORT_FILTERS);
  assert.equal(model.inventory.rows.length, 8);
  assert.equal(model.inventory.totals.costValue, 5_319_000);
  assert.equal(model.inventory.totals.units, 58);
});

test("B5 · valor potencial de venta y ganancia bruta potencial", () => {
  const model = buildReportModel(createSeedState(), EMPTY_REPORT_FILTERS);
  assert.equal(model.inventory.totals.saleValue, 8_261_970);
  assert.equal(model.inventory.totals.profit, 2_942_970);
  assert.notEqual(model.inventory.totals.profit, model.salesSummary.revenue);
  assert.equal(formatCOP(model.inventory.totals.profit), formatCOP(2_942_970));
});

test("B5 · total de ventas ficticias, unidades y ganancia histórica", () => {
  const model = buildReportModel(createSeedState(), EMPTY_REPORT_FILTERS);
  assert.equal(model.salesSummary.count, 2);
  assert.equal(model.salesSummary.units, 5);
  assert.equal(model.salesSummary.revenue, 858_000);
  assert.equal(model.salesSummary.profit, 303_000);
  assert.equal(model.salesSummary.profitAvailableCount, 2);
  assert.equal(model.salesSummary.profitUnavailableCount, 0);
});

test("B5 · una salida manual no se cuenta como venta simulada", () => {
  const model = buildReportModel(createSeedState(), EMPTY_REPORT_FILTERS);
  const manualExit = model.movements.find((row) => row.id === "demo-mov-008");
  assert.ok(manualExit);
  assert.equal(manualExit.origin, "manual");
  assert.equal(manualExit.value, null);
  assert.equal(manualExit.profit, null);
  assert.equal(model.sales.some((row) => row.id === "demo-mov-008"), false);
});

test("B5 · filtro por rango de fechas usa fechas reales del movimiento", () => {
  const model = buildReportModel(
    createSeedState(),
    withFilters({ from: "2026-11-04", to: "2026-11-04" }),
  );
  assert.deepEqual(
    model.movements.map((row) => row.id).sort(),
    ["demo-mov-006", "demo-mov-008"],
  );
  assert.deepEqual(model.sales.map((row) => row.id), ["demo-mov-006"]);
  assert.equal(model.salesSummary.revenue, 450_000);
  assert.equal(model.salesSummary.profit, 150_000);
  /* El inventario es saldo actual: el rango no lo reescribe. */
  assert.equal(model.inventory.totals.costValue, 5_319_000);
});

test("B5 · fechas inválidas y rangos invertidos se rechazan", () => {
  assert.equal(isIsoDay("2026-02-28"), true);
  assert.equal(isIsoDay("2026-02-30"), false);
  assert.equal(isIsoDay("2026-11-04T10:00:00.000Z"), false);
  assert.match(
    validateReportFilters(withFilters({ from: "2026-02-30" })) ?? "",
    /fecha válida/,
  );
  assert.match(
    validateReportFilters(withFilters({ from: "2026-11-05", to: "2026-11-04" })) ?? "",
    /no puede ser posterior/,
  );

  const model = buildReportModel(
    createSeedState(),
    withFilters({ from: "2026-11-05", to: "2026-11-04" }),
  );
  assert.ok(model.rangeError);
  assert.deepEqual(model.movements, []);
  assert.deepEqual(model.sales, []);
  assert.equal(model.salesSummary.revenue, 0);
  assert.deepEqual(model.charts.salesByPeriod, []);
});

test("B5 · filtro por categoría reduce inventario y movimientos", () => {
  const model = buildReportModel(
    createSeedState(),
    withFilters({ categoryId: "demo-cat-pulseras" }),
  );
  assert.equal(model.inventory.rows.length, 2);
  assert.equal(model.inventory.totals.costValue, 2_130_000);
  assert.ok(model.movements.length > 0);
  assert.ok(
    model.movements.every((row) =>
      ["demo-prod-005", "demo-prod-006"].includes(row.productId),
    ),
  );
  assert.equal(model.sales.length, 0);
  assert.ok(model.movements.every((row) => row.categoryName === "Pulseras"));
});

test("B5 · filtro por producto y por tipo de movimiento", () => {
  const byProduct = buildReportModel(
    createSeedState(),
    withFilters({ productId: "demo-prod-001" }),
  );
  assert.equal(byProduct.inventory.totals.costValue, 1_020_000);
  assert.deepEqual(byProduct.sales.map((row) => row.id), ["demo-mov-002"]);
  assert.equal(byProduct.salesSummary.profit, 153_000);

  const bySaleType = buildReportModel(
    createSeedState(),
    withFilters({ movementType: "sale" }),
  );
  assert.equal(bySaleType.movements.length, 2);
  assert.ok(bySaleType.movements.every((row) => row.origin === "sale"));
  assert.equal(bySaleType.sales.length, 2);

  const byExitType = buildReportModel(
    createSeedState(),
    withFilters({ movementType: "exit" }),
  );
  assert.equal(byExitType.movements.length, 3);
  assert.equal(byExitType.sales.length, 2);
});

test("B5 · distribución del inventario por categoría suma el costo total", () => {
  const model = buildReportModel(createSeedState(), EMPTY_REPORT_FILTERS);
  const chart = summarizeInventoryByCategory(model.inventory);
  assert.deepEqual(
    chart.map((item) => item.label),
    ["Pulseras", "Anillos", "Collares", "Aretes"],
  );
  assert.equal(chart.reduce((sum, item) => sum + item.value, 0), 5_319_000);
  assert.equal(chart[0].value, 2_130_000);
  assert.equal(chart[0].formattedValue, formatCOP(2_130_000));
  assert.deepEqual(model.charts.inventoryByCategory, chart);
});

test("B5 · datos de gráficos de movimientos y ventas por período", () => {
  const model = buildReportModel(createSeedState(), EMPTY_REPORT_FILTERS);
  const movements = summarizeMovementsByType(model.movements);
  assert.deepEqual(
    movements.map((item) => [item.key, item.value]),
    [
      ["entry", 8],
      ["exit", 3],
      ["adjustment", 1],
      ["return", 1],
    ],
  );
  assert.equal(movements.reduce((sum, item) => sum + item.value, 0), 13);

  const periods = summarizeSalesByPeriod(model.sales);
  assert.deepEqual(periods, [
    {
      key: "2026-11",
      label: "2026-11",
      value: 858_000,
      formattedValue: formatCOP(858_000),
      count: 2,
    },
  ]);
  assert.deepEqual(model.charts.movementsByType, movements);
  assert.deepEqual(model.charts.salesByPeriod, periods);
});

test("B5 · CSV trae BOM, encabezados claros, CRLF y prefijo DEMO", () => {
  const model = buildReportModel(createSeedState(), EMPTY_REPORT_FILTERS);
  const csv = buildReportsCsv(model);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes("\r\n"));
  /* 13 movimientos + 2 ventas + encabezado = 16 filas. */
  assert.equal(csv.split("\r\n").length, 16);
  for (const header of REPORT_CSV_HEADERS) {
    assert.ok(csv.includes(`"${header}"`), `falta el encabezado ${header}`);
  }
  assert.ok(csv.includes('"DEMO-MOVIMIENTO"'));
  assert.ok(csv.includes('"DEMO-VENTA"'));
  assert.ok(csv.includes(`"${REPORT_CSV_NOTICE}"`));
  assert.equal(buildReportsCsvFileName("2026-11-24"), "DEMO-reportes-2026-11-24.csv");
  assert.equal(buildReportsCsvFileName("no-fecha"), "DEMO-reportes-sin-fecha.csv");
});

test("B5 · CSV respeta los filtros y omite filas de otras fechas", () => {
  const model = buildReportModel(
    createSeedState(),
    withFilters({ from: "2026-11-04", to: "2026-11-04" }),
  );
  const csv = buildReportsCsv(model);
  assert.equal(csv.split("\r\n").length, 1 + model.movements.length + model.sales.length);
  assert.ok(csv.includes('"2026-11-04"'));
  assert.ok(!csv.includes('"2026-11-03"'));
  assert.ok(!csv.includes('"2026-11-05"'));
  assert.ok(csv.includes(`"${formatCOP(450_000)}"`));
  assert.ok(!csv.includes(`"${formatCOP(408_000)}"`));
});

test("B5 · CSV neutraliza fórmulas peligrosas de Excel", () => {
  const base = buildReportModel(createSeedState(), EMPTY_REPORT_FILTERS);
  const model = {
    ...base,
    movements: base.movements.map((row, index) =>
      index === 0
        ? { ...row, note: "=SUM(1+1)", productName: "@cmd|'/c calc'" }
        : row,
    ),
  };
  const csv = buildReportsCsv(model);
  assert.ok(csv.includes(`"'=SUM(1+1)"`));
  assert.ok(csv.includes(`"'@cmd|'/c calc'"`));
  assert.ok(!csv.includes('"=SUM(1+1)"'));
  assert.ok(!csv.includes('"@cmd|'));
});

test("B5 · nueva venta actualiza indicadores y congela su costo histórico", () => {
  const seed = createSeedState();
  const before = buildReportModel(seed, EMPTY_REPORT_FILTERS);
  const result = applyDemoAction(seed, {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-b5-sale",
    createdAt: "2026-11-24T12:00:00.000Z",
    input: {
      productId: "demo-prod-002",
      type: "exit",
      quantity: 2,
      origin: "sale",
    },
  });
  assert.equal(result.changed, true, result.error);
  assert.equal(validateDemoState(result.state).ok, true);

  const movement = result.state.movements.find((item) => item.id === "demo-mov-b5-sale");
  assert.ok(movement);
  assert.equal(movement.unitPrice, 186_000);
  assert.equal(movement.unitCost, 120_000);
  assert.equal(movement.total, 372_000);

  const after = buildReportModel(result.state, EMPTY_REPORT_FILTERS);
  assert.equal(after.salesSummary.count, before.salesSummary.count + 1);
  assert.equal(after.salesSummary.units, before.salesSummary.units + 2);
  assert.equal(after.salesSummary.revenue, 1_230_000);
  assert.equal(after.salesSummary.profit, 435_000);
  assert.equal(after.inventory.totals.costValue, before.inventory.totals.costValue - 240_000);
  assert.equal(after.inventory.totals.units, before.inventory.totals.units - 2);
});

test("B5 · editar precios cambia la proyección sin reescribir ventas históricas", () => {
  const seed = createSeedState();
  const before = buildReportModel(seed, EMPTY_REPORT_FILTERS);
  const result = applyDemoAction(seed, {
    type: "UPDATE_PRODUCT",
    id: "demo-prod-001",
    patch: { manualPrice: true, manualSellingPrice: 999_000 },
  });
  assert.equal(result.changed, true, result.error);

  const after = buildReportModel(result.state, EMPTY_REPORT_FILTERS);
  assert.notEqual(after.inventory.totals.saleValue, before.inventory.totals.saleValue);
  assert.notEqual(after.inventory.totals.profit, before.inventory.totals.profit);
  assert.equal(after.salesSummary.revenue, before.salesSummary.revenue);
  assert.equal(after.salesSummary.profit, before.salesSummary.profit);
  assert.equal(saleProfit({ unitPrice: 136_000, unitCost: 85_000, quantity: 3 }), 153_000);
});

test("B5 · alta de producto amplía el inventario, los filtros y los gráficos", () => {
  const seed = createSeedState();
  const before = buildReportModel(seed, EMPTY_REPORT_FILTERS);
  const draft: DemoProductDraft = {
    sku: "DEMO-PRU-B5",
    name: "Aretes Demo Reporte",
    categoryId: "demo-cat-aretes",
    supplierId: "demo-sup-aurora",
    costPrice: 90_000,
    stock: 4,
    marginPct: 40,
    manualPrice: false,
    status: "active",
  };
  const result = applyDemoAction(seed, {
    type: "ADD_PRODUCT",
    id: "demo-prod-b5-new",
    movementId: "demo-mov-b5-new",
    createdAt: "2026-11-24T14:00:00.000Z",
    draft,
  });
  assert.equal(result.changed, true, result.error);
  assert.equal(validateDemoState(asPersisted(result.state)).ok, true);

  const after = buildReportModel(result.state, EMPTY_REPORT_FILTERS);
  assert.equal(after.inventory.rows.length, before.inventory.rows.length + 1);
  assert.equal(after.inventory.totals.costValue, before.inventory.totals.costValue + 360_000);
  assert.equal(after.inventory.totals.units, before.inventory.totals.units + 4);
  assert.equal(after.movements.length, before.movements.length + 1);
  assert.ok(
    summarizeInventoryByCategory(after.inventory).find((item) => item.label === "Aretes"),
  );
  assert.equal(
    summarizeInventoryByCategory(after.inventory).reduce((sum, item) => sum + item.value, 0),
    after.inventory.totals.costValue,
  );

  const filtered = buildReportModel(result.state, withFilters({ productId: "demo-prod-b5-new" }));
  assert.equal(filtered.inventory.rows.length, 1);
  assert.equal(filtered.inventory.totals.units, 4);
  assert.equal(filtered.sales.length, 0);
});

test("B5 · ajuste de stock cambia el inventario sin crear ventas ficticias", () => {
  const seed = createSeedState();
  const before = buildReportModel(seed, EMPTY_REPORT_FILTERS);
  const result = applyDemoAction(seed, {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-b5-adjust",
    createdAt: "2026-11-24T15:00:00.000Z",
    input: { productId: "demo-prod-001", type: "adjustment", quantity: 2, direction: 1 },
  });
  assert.equal(result.changed, true, result.error);
  assert.equal(validateDemoState(asPersisted(result.state)).ok, true);

  const after = buildReportModel(result.state, EMPTY_REPORT_FILTERS);
  assert.equal(after.inventory.totals.costValue, before.inventory.totals.costValue + 170_000);
  assert.equal(after.inventory.totals.units, before.inventory.totals.units + 2);
  assert.equal(after.movements.length, before.movements.length + 1);
  assert.equal(
    after.charts.movementsByType.find((item) => item.key === "adjustment")?.value,
    before.charts.movementsByType.find((item) => item.key === "adjustment")!.value + 1,
  );
  assert.equal(after.salesSummary.count, before.salesSummary.count);
  assert.equal(after.salesSummary.units, before.salesSummary.units);
  assert.equal(after.salesSummary.revenue, before.salesSummary.revenue);
  assert.equal(after.salesSummary.profit, before.salesSummary.profit);
});

test("B5 · venta persistida sin costo histórico marca ganancia no disponible", () => {
  const seed = createSeedState();
  const legacy: FioreDemoState = {
    ...seed,
    movements: seed.movements.map((movement) =>
      movement.id === "demo-mov-002" ? { ...movement, unitCost: undefined } : movement,
    ),
    products: seed.products.map((product) =>
      product.id === "demo-prod-001" ? { ...product, costPrice: 1 } : product,
    ),
  };
  assert.equal(validateDemoState(asPersisted(legacy)).ok, true);

  const model = buildReportModel(asPersisted(legacy), EMPTY_REPORT_FILTERS);
  const row = model.sales.find((item) => item.id === "demo-mov-002");
  assert.ok(row);
  assert.equal(row.profit, null);
  assert.equal(row.value, 408_000);
  assert.equal(model.salesSummary.profitAvailableCount, 1);
  assert.equal(model.salesSummary.profitUnavailableCount, 1);
  assert.equal(model.salesSummary.profit, 150_000);
  assert.equal(model.salesSummary.revenue, 858_000);
  assert.ok(buildReportsCsv(model).includes('"No disponible"'));
});

test("B5 · persistencia y restauración conservan los reportes; RESET vuelve a la semilla", () => {
  resetDemoHydrationGate();
  const storage = createMemoryStorage();
  assert.equal(loadDemoState(storage).status, "empty");

  const seed = createSeedState();
  const sold = applyDemoAction(seed, {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-b5-persist",
    createdAt: "2026-11-24T13:00:00.000Z",
    input: {
      productId: "demo-prod-006",
      type: "exit",
      quantity: 1,
      origin: "sale",
    },
  });
  assert.equal(sold.changed, true, sold.error);
  assert.equal(saveDemoState(asPersisted(sold.state), storage), true);

  const loaded = loadDemoState(storage);
  assert.equal(loaded.status, "ok");
  if (loaded.status !== "ok") return;
  const reloaded = buildReportModel(loaded.state, EMPTY_REPORT_FILTERS);
  const expected = buildReportModel(sold.state, EMPTY_REPORT_FILTERS);
  assert.equal(reloaded.salesSummary.count, 3);
  assert.equal(reloaded.salesSummary.revenue, expected.salesSummary.revenue);
  assert.equal(reloaded.salesSummary.profit, expected.salesSummary.profit);
  assert.equal(reloaded.inventory.totals.costValue, expected.inventory.totals.costValue);

  clearDemoState(storage);
  resetDemoHydrationGate();
  assert.equal(loadDemoState(storage).status, "empty");

  const reset = applyDemoAction(sold.state, { type: "RESET" });
  assert.deepEqual(reset.state, createSeedState());
  const initial = buildReportModel(reset.state, EMPTY_REPORT_FILTERS);
  assert.equal(initial.salesSummary.revenue, 858_000);
  assert.equal(initial.inventory.totals.costValue, 5_319_000);
});
