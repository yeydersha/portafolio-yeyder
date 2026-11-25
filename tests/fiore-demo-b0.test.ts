/**
 * B0 — Pruebas automatizadas ligeras de la base funcional de la demo Fiore.
 * Sin frameworks externos: se compila con tsconfig.b0-tests.json y se ejecuta
 * con el corredor nativo `node --test`.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";

import { createSeedState } from "../src/data/fiore-demo/seed";
import type { DemoProductDraft, FioreDemoState } from "../src/data/fiore-demo/types";
import {
  calculateProductPricing,
  formatCOP,
} from "../src/lib/fiore-demo/pricing";
import { applyDemoAction } from "../src/lib/fiore-demo/reducer";
import {
  buildInventoryRows,
  selectDashboardStats,
  selectMovementRows,
  selectReportData,
  selectSimulatedSales,
} from "../src/lib/fiore-demo/selectors";
import {
  DEMO_STORAGE_KEY,
  clearDemoState,
  loadDemoState,
  resetDemoHydrationGate,
  saveDemoState,
  type DemoStorageLike,
} from "../src/lib/fiore-demo/storage";
import { validateDemoState, validateProductDraft } from "../src/lib/fiore-demo/validation";

interface MemoryStorage extends DemoStorageLike {
  data: Map<string, string>;
}

function createMemoryStorage(): MemoryStorage {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

/** Compara con la semántica real de localStorage: las claves `undefined` se omiten. */
function asPersisted<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isValid(state: FioreDemoState): void {
  const result = validateDemoState(state);
  assert.equal(
    result.ok,
    true,
    result.ok ? "estado válido" : `estado inválido: ${JSON.stringify(result.issues)}`,
  );
}

const NEW_DRAFT: DemoProductDraft = {
  sku: "DEMO-PRU-099",
  name: "Anillo Demo Prueba",
  categoryId: "demo-cat-anillos",
  supplierId: "demo-sup-aurora",
  costPrice: 100000,
  stock: 6,
  marginPct: 50,
  manualPrice: false,
  status: "active",
};

const CREATED_AT = "2026-11-20T10:00:00.000Z";

function addTestProduct(state: FioreDemoState): FioreDemoState {
  const result = applyDemoAction(state, {
    type: "ADD_PRODUCT",
    id: "demo-prod-099",
    movementId: "demo-mov-099",
    createdAt: CREATED_AT,
    draft: NEW_DRAFT,
  });
  assert.equal(result.changed, true, result.error);
  return result.state;
}

test("la semilla es ficticia, versionada e internamente coherente", () => {
  const state = createSeedState();
  isValid(state);
  assert.ok(state.products.length >= 8);
  assert.equal(state.categories.length, 4);
  assert.ok(state.suppliers.length >= 3);
  assert.equal(
    state.products.every(
      (product) => product.id.startsWith("demo-") && product.sku.startsWith("DEMO-"),
    ),
    true,
  );
  assert.equal(
    state.movements.every((movement) => movement.id.startsWith("demo-mov-")),
    true,
  );
});

test("alta y edición de productos conservan la coherencia stock-movimientos", () => {
  const seed = createSeedState();
  const added = addTestProduct(seed);

  const created = added.products.find((product) => product.id === "demo-prod-099");
  assert.ok(created);
  assert.equal(created.stock, 6);

  const opening = added.movements.find((movement) => movement.id === "demo-mov-099");
  assert.ok(opening);
  assert.equal(opening.type, "entry");
  assert.equal(opening.delta, 6);
  assert.equal(opening.balanceAfter, 6);
  isValid(added);

  const edited = applyDemoAction(added, {
    type: "UPDATE_PRODUCT",
    id: "demo-prod-099",
    patch: { name: "Anillo Demo Editado", costPrice: 110000, stock: 9 },
    movementId: "demo-mov-100",
    movementCreatedAt: "2026-11-21T10:00:00.000Z",
  });
  assert.equal(edited.changed, true, edited.error);
  isValid(edited.state);

  const updated = edited.state.products.find((product) => product.id === "demo-prod-099");
  assert.ok(updated);
  assert.equal(updated.name, "Anillo Demo Editado");
  assert.equal(updated.stock, 9);

  const adjustment = edited.state.movements.find((movement) => movement.id === "demo-mov-100");
  assert.ok(adjustment);
  assert.equal(adjustment.type, "adjustment");
  assert.equal(adjustment.delta, 3);
  assert.equal(adjustment.balanceAfter, 9);
});

test("no se permiten SKU duplicados ni en alta ni en edición", () => {
  const seed = createSeedState();
  const duplicated = applyDemoAction(seed, {
    type: "ADD_PRODUCT",
    id: "demo-prod-100",
    movementId: "demo-mov-100",
    createdAt: CREATED_AT,
    draft: { ...NEW_DRAFT, sku: "DEMO-ANI-001" },
  });
  assert.equal(duplicated.changed, false);
  assert.ok(duplicated.error);
  assert.equal(duplicated.state, seed);

  const draftCheck = validateProductDraft(
    { ...NEW_DRAFT, sku: "demo-ani-001" },
    { products: seed.products, categories: seed.categories, suppliers: seed.suppliers },
  );
  assert.equal(draftCheck.ok, false);
  if (!draftCheck.ok) {
    assert.ok(draftCheck.issues.some((item) => item.field === "sku"));
  }

  const added = addTestProduct(seed);
  const conflict = applyDemoAction(added, {
    type: "UPDATE_PRODUCT",
    id: "demo-prod-099",
    patch: { sku: "DEMO-ANI-002" },
  });
  assert.equal(conflict.changed, false);
  assert.equal(conflict.state, added);
});

test("la venta ficticia reduce stock, guarda snapshot y no se confunde con otras salidas", () => {
  const seed = createSeedState();
  const target = seed.products.find((product) => product.id === "demo-prod-001");
  assert.ok(target);

  const sold = applyDemoAction(seed, {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-201",
    createdAt: "2026-11-21T12:00:00.000Z",
    input: {
      productId: target.id,
      type: "exit",
      quantity: 2,
      origin: "sale",
      note: "Venta ficticia de prueba",
    },
  });
  assert.equal(sold.changed, true, sold.error);
  isValid(sold.state);

  const after = sold.state.products.find((product) => product.id === target.id);
  assert.ok(after);
  assert.equal(after.stock, target.stock - 2);

  const movement = sold.state.movements.find((item) => item.id === "demo-mov-201");
  assert.ok(movement);
  assert.equal(movement.origin, "sale");
  assert.equal(movement.delta, -2);
  assert.equal(movement.balanceAfter, target.stock - 2);

  const pricing = calculateProductPricing({
    costPrice: target.costPrice,
    marginPct: target.marginPct,
    stock: target.stock,
    manualPrice: target.manualPrice,
    manualSellingPrice: target.manualSellingPrice,
  });
  assert.equal(movement.unitPrice, pricing.sellingPrice);
  assert.equal(movement.total, pricing.sellingPrice * 2);

  const manualExit = seed.movements.find((item) => item.id === "demo-mov-008");
  assert.ok(manualExit);
  assert.equal(manualExit.origin, "manual");
  assert.equal(manualExit.unitPrice, undefined);

  const sales = selectSimulatedSales(sold.state);
  assert.equal(sales.count, 3);
  assert.equal(sales.units, 7);
  assert.ok(sales.note.includes("no representan transacciones reales"));
});

test("ninguna operación permite stock negativo", () => {
  const seed = createSeedState();
  const oversell = applyDemoAction(seed, {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-202",
    createdAt: "2026-11-22T12:00:00.000Z",
    input: { productId: "demo-prod-004", type: "exit", quantity: 1, origin: "sale" },
  });
  assert.equal(oversell.changed, false);
  assert.ok(oversell.error);
  assert.equal(oversell.state, seed);

  const badEdit = applyDemoAction(seed, {
    type: "UPDATE_PRODUCT",
    id: "demo-prod-007",
    patch: { stock: -1 },
    movementId: "demo-mov-203",
    movementCreatedAt: "2026-11-22T13:00:00.000Z",
  });
  assert.equal(badEdit.changed, false);
  assert.equal(badEdit.state, seed);
});

test("entradas, devoluciones y ajustes actualizan el historial y el saldo", () => {
  const seed = createSeedState();
  const entry = applyDemoAction(seed, {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-204",
    createdAt: "2026-11-23T09:00:00.000Z",
    input: {
      productId: "demo-prod-004",
      type: "entry",
      quantity: 5,
      note: "Entrada de prueba",
    },
  });
  assert.equal(entry.changed, true, entry.error);
  isValid(entry.state);

  const after = entry.state.products.find((product) => product.id === "demo-prod-004");
  assert.ok(after);
  assert.equal(after.stock, 5);

  const rows = selectMovementRows(entry.state);
  assert.equal(rows.length, seed.movements.length + 1);
  assert.equal(rows[0]?.id, "demo-mov-204");
  assert.equal(rows[0]?.balanceAfter, 5);
  assert.equal(rows[0]?.productSku, "DEMO-COL-002");

  const negativeAdjustment = applyDemoAction(entry.state, {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-205",
    createdAt: "2026-11-23T10:00:00.000Z",
    input: {
      productId: "demo-prod-004",
      type: "adjustment",
      quantity: 2,
      direction: -1,
    },
  });
  assert.equal(negativeAdjustment.changed, true, negativeAdjustment.error);
  const adjusted = negativeAdjustment.state.products.find(
    (product) => product.id === "demo-prod-004",
  );
  assert.ok(adjusted);
  assert.equal(adjusted.stock, 3);
  isValid(negativeAdjustment.state);
});

test("los cálculos financieros coinciden con las reglas observadas y separan margen de incremento", () => {
  const seed = createSeedState();
  const product = seed.products.find((item) => item.id === "demo-prod-001");
  assert.ok(product);

  const pricing = calculateProductPricing({
    costPrice: product.costPrice,
    marginPct: product.marginPct,
    stock: product.stock,
    manualPrice: product.manualPrice,
    manualSellingPrice: product.manualSellingPrice,
  });
  assert.equal(pricing.suggestedPrice, 136000);
  assert.equal(pricing.sellingPrice, 136000);
  assert.equal(pricing.grossProfitUnit, 51000);
  assert.equal(pricing.grossProfitTotal, 612000);
  assert.equal(pricing.marginPctOnSale, 37.5);
  assert.equal(pricing.markupPctOnCost, 60);

  const manualProduct = seed.products.find((item) => item.id === "demo-prod-006");
  assert.ok(manualProduct);
  const manualPricing = calculateProductPricing({
    costPrice: manualProduct.costPrice,
    marginPct: manualProduct.marginPct,
    stock: manualProduct.stock,
    manualPrice: manualProduct.manualPrice,
    manualSellingPrice: manualProduct.manualSellingPrice,
  });
  assert.equal(manualPricing.suggestedPrice, 102000);
  assert.equal(manualPricing.sellingPrice, 95000);
  assert.equal(manualPricing.grossProfitUnit, 35000);
  assert.equal(manualPricing.marginPctOnSale, 36.84);
  assert.equal(manualPricing.markupPctOnCost, 70);
  assert.ok(formatCOP(136000).includes("136"));

  const stats = selectDashboardStats(seed);
  const report = selectReportData(seed);
  assert.equal(stats.totalProducts, report.rows.length);
  assert.equal(stats.totalUnits, report.totals.units);
  assert.equal(stats.totalPotentialProfit, report.totals.profit);
  assert.equal(stats.totalPotentialSaleValue, report.totals.saleValue);
  assert.equal(stats.lowStockProducts.every((row) => row.stock > 0 && row.stock <= 5), true);
  assert.equal(stats.outOfStockProducts.every((row) => row.stock === 0), true);
  assert.equal(buildInventoryRows(seed).length, seed.products.length);
});

test("el estado persistido se recupera solo después de la hidratación y se revalida", () => {
  const storage = createMemoryStorage();
  resetDemoHydrationGate();

  assert.equal(saveDemoState(createSeedState(), storage), false);
  assert.equal(storage.data.size, 0);

  const loadedEmpty = loadDemoState(storage);
  assert.equal(loadedEmpty.status, "empty");

  const changed = applyDemoAction(createSeedState(), {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-206",
    createdAt: "2026-11-23T11:00:00.000Z",
    input: { productId: "demo-prod-003", type: "entry", quantity: 1 },
  }).state;
  assert.equal(saveDemoState(changed, storage), true);
  assert.ok(storage.getItem(DEMO_STORAGE_KEY));

  resetDemoHydrationGate();
  const restored = loadDemoState(storage);
  assert.equal(restored.status, "ok");
  if (restored.status === "ok") {
    assert.deepEqual(asPersisted(restored.state), asPersisted(changed));
    isValid(restored.state);
  }
});

test("datos corruptos, incompletos o de otra versión se descartan sin uso", () => {
  const storage = createMemoryStorage();

  storage.setItem(DEMO_STORAGE_KEY, "{ json inválido");
  resetDemoHydrationGate();
  const brokenJson = loadDemoState(storage);
  assert.equal(brokenJson.status, "invalid");
  assert.equal(storage.getItem(DEMO_STORAGE_KEY), null);

  storage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      products: [{ id: "demo-prod-001" }],
      categories: [],
      suppliers: [],
      movements: [],
    }),
  );
  resetDemoHydrationGate();
  assert.equal(loadDemoState(storage).status, "invalid");
  assert.equal(storage.getItem(DEMO_STORAGE_KEY), null);

  storage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ ...createSeedState(), version: 2 }));
  resetDemoHydrationGate();
  assert.equal(loadDemoState(storage).status, "invalid");
  assert.equal(storage.getItem(DEMO_STORAGE_KEY), null);

  const seed = createSeedState();
  const rejected = applyDemoAction(seed, {
    type: "HYDRATE",
    state: { ...seed, version: 2 as 1 },
  });
  assert.equal(rejected.changed, false);
  assert.equal(rejected.state, seed);
});

test("el reinicio restaura la semilla y limpia la clave local", () => {
  const seed = createSeedState();
  const dirty = applyDemoAction(seed, {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-207",
    createdAt: "2026-11-23T12:00:00.000Z",
    input: { productId: "demo-prod-002", type: "entry", quantity: 4 },
  }).state;
  assert.notDeepEqual(dirty, seed);

  const reset = applyDemoAction(dirty, { type: "RESET" });
  assert.deepEqual(reset.state, createSeedState());
  isValid(reset.state);

  const storage = createMemoryStorage();
  resetDemoHydrationGate();
  loadDemoState(storage);
  assert.equal(saveDemoState(dirty, storage), true);
  clearDemoState(storage);
  assert.equal(storage.getItem(DEMO_STORAGE_KEY), null);
});
