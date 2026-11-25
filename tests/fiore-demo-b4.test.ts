/**
 * B4 — Pruebas de categorías, proveedores y movimientos de la demo Fiore.
 *
 * Comprueban las reglas de la vista sin depender de React: altas y ediciones,
 * nombres duplicados, activación sin borrado, asociaciones conservadas,
 * movimientos y venta simulada, historial, dashboard, persistencia y reinicio.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";

import { createSeedState } from "../src/data/fiore-demo/seed";
import type {
  DemoCategory,
  DemoMovementInput,
  DemoSupplier,
  FioreDemoState,
} from "../src/data/fiore-demo/types";
import {
  filterCategoryCounts,
  filterSupplierCounts,
  sortCategoriesByName,
  sortSuppliersByName,
} from "../src/lib/fiore-demo/entity-view";
import {
  filterMovementRows,
  paginateRows,
} from "../src/lib/fiore-demo/movements-view";
import { calculateProductPricing, calculateSaleTotal } from "../src/lib/fiore-demo/pricing";
import { applyDemoAction } from "../src/lib/fiore-demo/reducer";
import {
  selectCategoryCounts,
  selectDashboardStats,
  selectMovementRows,
  selectSupplierCounts,
} from "../src/lib/fiore-demo/selectors";
import {
  clearDemoState,
  DEMO_STORAGE_KEY,
  loadDemoState,
  resetDemoHydrationGate,
  saveDemoState,
  type DemoStorageLike,
} from "../src/lib/fiore-demo/storage";
import {
  normalizeDemoName,
  validateCategoryDraft,
  validateDemoState,
  validateSupplierDraft,
} from "../src/lib/fiore-demo/validation";

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

function recordMovement(
  state: FioreDemoState,
  input: DemoMovementInput,
  id = "demo-mov-b4",
  createdAt = "2026-11-24T12:00:00.000Z",
) {
  return applyDemoAction(state, { type: "RECORD_MOVEMENT", id, createdAt, input });
}

test("B4 · alta de categoría ficticia conserva las cuatro originales", () => {
  const seed = createSeedState();
  const category: DemoCategory = {
    id: "demo-cat-b4-001",
    name: "Broches Demo",
    description: "Categoría inventada para la demostración",
    active: true,
  };

  const result = applyDemoAction(seed, { type: "ADD_CATEGORY", category });

  assert.equal(result.changed, true, result.error);
  assert.equal(result.state.categories.length, 5);
  for (const name of ["Anillos", "Collares", "Pulseras", "Aretes"]) {
    assert.ok(result.state.categories.some((item) => item.name === name));
  }
  const count = selectCategoryCounts(result.state).find((item) => item.id === category.id);
  assert.equal(count?.productCount, 0);
  assert.equal(validateDemoState(result.state).ok, true);
});

test("B4 · edición de categoría cambia nombre y descripción sin perder productos", () => {
  const seed = createSeedState();
  const before = selectCategoryCounts(seed).find((item) => item.id === "demo-cat-anillos");
  assert.ok(before);

  const result = applyDemoAction(seed, {
    type: "UPDATE_CATEGORY",
    id: "demo-cat-anillos",
    patch: { name: "Anillos Demo Editados", description: "Descripción actualizada" },
  });

  assert.equal(result.changed, true, result.error);
  const after = selectCategoryCounts(result.state).find((item) => item.id === "demo-cat-anillos");
  assert.equal(after?.name, "Anillos Demo Editados");
  assert.equal(after?.description, "Descripción actualizada");
  assert.equal(after?.productCount, before.productCount);
  assert.equal(result.state.products.filter((item) => item.categoryId === "demo-cat-anillos").length, before.productCount);
  assert.equal(validateDemoState(result.state).ok, true);
});

test("B4 · nombres de categoría duplicados se rechazan sin mayúsculas ni espacios", () => {
  const seed = createSeedState();

  assert.equal(normalizeDemoName("  An illos "), "anillos");
  const add = applyDemoAction(seed, {
    type: "ADD_CATEGORY",
    category: { id: "demo-cat-b4-dup", name: "  anillos ", active: true },
  });
  assert.equal(add.changed, false);
  assert.match(add.error ?? "", /nombre/);

  const edit = applyDemoAction(seed, {
    type: "UPDATE_CATEGORY",
    id: "demo-cat-collares",
    patch: { name: "An illos" },
  });
  assert.equal(edit.changed, false);

  const draft = validateCategoryDraft(
    { id: "demo-cat-b4-dup", name: "Aretes", active: true },
    { categories: seed.categories },
  );
  assert.equal(draft.ok, false);
});

test("B4 · desactivar una categoría no elimina ni desasocia productos", () => {
  const seed = createSeedState();
  const associated = seed.products.filter((item) => item.categoryId === "demo-cat-anillos").length;
  assert.ok(associated > 0);

  const result = applyDemoAction(seed, {
    type: "UPDATE_CATEGORY",
    id: "demo-cat-anillos",
    patch: { active: false },
  });

  assert.equal(result.changed, true, result.error);
  assert.equal(result.state.categories.length, seed.categories.length);
  assert.equal(result.state.categories.find((item) => item.id === "demo-cat-anillos")?.active, false);
  assert.equal(result.state.products.filter((item) => item.categoryId === "demo-cat-anillos").length, associated);
  assert.equal(validateDemoState(result.state).ok, true);
});

test("B4 · alta de proveedor ficticio solo guarda campos inocuos", () => {
  const seed = createSeedState();
  const supplier: DemoSupplier = {
    id: "demo-sup-b4-001",
    name: "Proveedor Demo Vela",
    reference: "DEMO-REF-D",
    active: true,
  };

  const result = applyDemoAction(seed, { type: "ADD_SUPPLIER", supplier });

  assert.equal(result.changed, true, result.error);
  const stored = result.state.suppliers.find((item) => item.id === supplier.id);
  assert.deepEqual(Object.keys(stored ?? {}).sort(), ["active", "id", "name", "reference"]);
  assert.equal(stored?.reference, "DEMO-REF-D");
  assert.equal(selectSupplierCounts(result.state).find((item) => item.id === supplier.id)?.productCount, 0);
  assert.equal(validateDemoState(result.state).ok, true);
});

test("B4 · edición de proveedor conserva la asociación de sus productos", () => {
  const seed = createSeedState();
  const before = seed.products.filter((item) => item.supplierId === "demo-sup-aurora").length;
  assert.ok(before > 0);

  const result = applyDemoAction(seed, {
    type: "UPDATE_SUPPLIER",
    id: "demo-sup-aurora",
    patch: { name: "Proveedor Demo Aurora Editado", reference: "DEMO-REF-A2" },
  });

  assert.equal(result.changed, true, result.error);
  const after = selectSupplierCounts(result.state).find((item) => item.id === "demo-sup-aurora");
  assert.equal(after?.name, "Proveedor Demo Aurora Editado");
  assert.equal(after?.reference, "DEMO-REF-A2");
  assert.equal(after?.productCount, before);
  assert.equal(validateDemoState(result.state).ok, true);
});

test("B4 · nombres de proveedor duplicados se rechazan sin mayúsculas ni espacios", () => {
  const seed = createSeedState();

  const add = applyDemoAction(seed, {
    type: "ADD_SUPPLIER",
    supplier: { id: "demo-sup-b4-dup", name: " proveedordemoaurora ", active: true },
  });
  assert.equal(add.changed, false);
  assert.match(add.error ?? "", /nombre/);

  const edit = applyDemoAction(seed, {
    type: "UPDATE_SUPPLIER",
    id: "demo-sup-brisa",
    patch: { name: "PROVEEDOR DEMO AURORA" },
  });
  assert.equal(edit.changed, false);

  const draft = validateSupplierDraft(
    { id: "demo-sup-b4-dup", name: "Proveedor Demo Luna", active: true },
    { suppliers: seed.suppliers },
  );
  assert.equal(draft.ok, false);
});

test("B4 · desactivar un proveedor no elimina productos asociados", () => {
  const seed = createSeedState();
  const associated = seed.products.filter((item) => item.supplierId === "demo-sup-brisa").length;
  assert.ok(associated > 0);

  const result = applyDemoAction(seed, {
    type: "UPDATE_SUPPLIER",
    id: "demo-sup-brisa",
    patch: { active: false },
  });

  assert.equal(result.changed, true, result.error);
  assert.equal(result.state.suppliers.find((item) => item.id === "demo-sup-brisa")?.active, false);
  assert.equal(result.state.products.filter((item) => item.supplierId === "demo-sup-brisa").length, associated);
  assert.equal(validateDemoState(result.state).ok, true);
});

test("B4 · búsqueda y orden de catálogo usan la misma normalización", () => {
  const seed = createSeedState();
  const categories = selectCategoryCounts(seed);
  const suppliers = selectSupplierCounts(seed);

  assert.equal(filterCategoryCounts(categories, "  an illos ").length, 1);
  assert.equal(filterCategoryCounts(categories, "inexistente").length, 0);
  assert.deepEqual(
    sortCategoriesByName(categories).map((item) => item.name),
    ["Anillos", "Aretes", "Collares", "Pulseras"],
  );

  assert.equal(filterSupplierCounts(suppliers, "AURORA").length, 1);
  assert.equal(filterSupplierCounts(suppliers, "sin proveedor").length, 0);
  assert.deepEqual(
    sortSuppliersByName(suppliers).map((item) => item.name),
    suppliers.map((item) => item.name).sort((a, b) => a.localeCompare(b, "es")),
  );
});

test("B4 · entrada manual aumenta el stock y explica el saldo", () => {
  const seed = createSeedState();
  const before = seed.products.find((item) => item.id === "demo-prod-001");
  assert.ok(before);

  const result = recordMovement(seed, {
    productId: "demo-prod-001",
    type: "entry",
    quantity: 3,
    origin: "manual",
    note: "Entrada ficticia de prueba",
  });

  assert.equal(result.changed, true, result.error);
  const product = result.state.products.find((item) => item.id === "demo-prod-001");
  assert.equal(product?.stock, before.stock + 3);
  const movement = result.state.movements.at(-1);
  assert.equal(movement?.delta, 3);
  assert.equal(movement?.balanceAfter, before.stock + 3);
  assert.equal(movement?.origin, "manual");
  assert.equal(movement?.total, undefined);
  assert.equal(validateDemoState(result.state).ok, true);
});

test("B4 · salida manual respeta el stock y cantidades inválidas se rechazan", () => {
  const seed = createSeedState();
  const before = seed.products.find((item) => item.id === "demo-prod-002");
  assert.ok(before);

  const exit = recordMovement(seed, {
    productId: "demo-prod-002",
    type: "exit",
    quantity: 2,
    note: "Salida ficticia",
  });
  assert.equal(exit.changed, true, exit.error);
  assert.equal(exit.state.products.find((item) => item.id === before.id)?.stock, before.stock - 2);

  const excessive = recordMovement(seed, {
    productId: "demo-prod-002",
    type: "exit",
    quantity: before.stock + 1,
  });
  assert.equal(excessive.changed, false);
  assert.match(excessive.error ?? "", /Stock insuficiente/);

  for (const quantity of [0, -1, 1.5, Number.NaN]) {
    const invalid = recordMovement(seed, {
      productId: "demo-prod-002",
      type: "exit",
      quantity,
    });
    assert.equal(invalid.changed, false);
  }
  assert.equal(validateDemoState(exit.state).ok, true);
});

test("B4 · ajustes y devoluciones registran su variación firmada", () => {
  const seed = createSeedState();

  const plus = recordMovement(
    seed,
    { productId: "demo-prod-003", type: "adjustment", quantity: 2, direction: 1 },
    "demo-mov-b4-plus",
  );
  assert.equal(plus.changed, true, plus.error);
  assert.equal(plus.state.movements.at(-1)?.delta, 2);

  const minus = recordMovement(
    plus.state,
    { productId: "demo-prod-003", type: "adjustment", quantity: 1, direction: -1 },
    "demo-mov-b4-minus",
  );
  assert.equal(minus.changed, true, minus.error);
  assert.equal(minus.state.movements.at(-1)?.delta, -1);

  const returned = recordMovement(
    minus.state,
    { productId: "demo-prod-003", type: "return", quantity: 4, note: "Devolución ficticia" },
    "demo-mov-b4-return",
  );
  assert.equal(returned.changed, true, returned.error);
  assert.equal(returned.state.movements.at(-1)?.delta, 4);
  assert.equal(validateDemoState(returned.state).ok, true);
});

test("B4 · venta simulada guarda snapshot y no datos de clientes ni pagos", () => {
  const seed = createSeedState();
  const product = seed.products.find((item) => item.id === "demo-prod-001");
  assert.ok(product);
  const pricing = calculateProductPricing(product);

  const result = recordMovement(seed, {
    productId: "demo-prod-001",
    type: "exit",
    quantity: 2,
    origin: "sale",
    note: "Venta simulada de demostración",
  });

  assert.equal(result.changed, true, result.error);
  const sale = result.state.movements.at(-1);
  assert.equal(sale?.origin, "sale");
  assert.equal(sale?.unitPrice, pricing.sellingPrice);
  assert.equal(sale?.total, calculateSaleTotal(pricing.sellingPrice, 2));
  assert.equal(sale?.total, pricing.sellingPrice * 2);
  const forbidden = ["performedBy", "performed_by", "paymentMethod", "payment_method", "customer", "invoice"];
  for (const key of forbidden) assert.equal(key in (sale ?? {}), false);
  assert.equal(validateDemoState(result.state).ok, true);
});

test("B4 · historial derivado filtra por producto, SKU y tipo y ordena por fecha", () => {
  const seed = createSeedState();
  const rows = selectMovementRows(seed);
  assert.equal(rows.length, seed.movements.length);
  assert.deepEqual(rows[0].createdAt, [...seed.movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0].createdAt);

  assert.ok(filterMovementRows(rows, { query: "ANI-001" }).every((row) => row.productSku.includes("DEMO-ANI-001")));
  assert.ok(filterMovementRows(rows, { query: "Anillo Demo Aurora" }).length > 0);
  assert.ok(filterMovementRows(rows, { type: "exit" }).every((row) => row.type === "exit"));
  assert.equal(filterMovementRows(rows, { query: "no existe" }).length, 0);

  const ascending = filterMovementRows(rows, { sort: "date-asc" });
  for (let index = 1; index < ascending.length; index += 1) {
    assert.ok(ascending[index - 1].createdAt <= ascending[index].createdAt);
  }
});

test("B4 · paginación local acota la página y maneja listas vacías", () => {
  const seed = createSeedState();
  const rows = selectMovementRows(seed);
  const first = paginateRows(rows, 1);

  assert.equal(first.total, rows.length);
  assert.equal(first.totalPages, Math.ceil(rows.length / 6));
  assert.equal(first.rows.length, 6);

  const last = paginateRows(rows, 999);
  assert.equal(last.page, last.totalPages);
  assert.equal(last.rows.length, rows.length - 6 * (last.totalPages - 1));

  const empty = paginateRows(filterMovementRows(rows, { query: "no existe" }), 3);
  assert.equal(empty.page, 1);
  assert.equal(empty.totalPages, 1);
  assert.deepEqual(empty.rows, []);
});

test("B4 · una venta simulada actualiza el dashboard sin contarla como ingreso real", () => {
  const seed = createSeedState();
  const before = selectDashboardStats(seed);

  const result = recordMovement(seed, {
    productId: "demo-prod-001",
    type: "exit",
    quantity: 2,
    origin: "sale",
  });
  const after = selectDashboardStats(result.state);
  const sale = result.state.movements.at(-1);

  assert.equal(after.totalUnits, before.totalUnits - 2);
  assert.equal(after.simulatedSales.count, before.simulatedSales.count + 1);
  assert.equal(after.simulatedSales.units, before.simulatedSales.units + 2);
  assert.equal(after.simulatedSales.revenue, before.simulatedSales.revenue + (sale?.total ?? 0));
  assert.match(after.simulatedSales.note, /no representan transacciones reales/);
});

test("B4 · persistencia y reinicio restauran el seed compartido tras cambios B4", () => {
  const storage = createMemoryStorage();
  resetDemoHydrationGate();
  assert.equal(loadDemoState(storage).status, "empty");

  const seed = createSeedState();
  const withCategory = applyDemoAction(seed, {
    type: "ADD_CATEGORY",
    category: { id: "demo-cat-b4-persist", name: "Categoría Persistida", active: true },
  });
  const withSale = recordMovement(withCategory.state, {
    productId: "demo-prod-001",
    type: "exit",
    quantity: 1,
    origin: "sale",
  });

  assert.equal(saveDemoState(withSale.state, storage), true);
  const loaded = loadDemoState(storage);
  assert.equal(loaded.status, "ok");
  if (loaded.status !== "ok") return;
  assert.equal(loaded.state.categories.length, seed.categories.length + 1);
  assert.equal(loaded.state.movements.at(-1)?.origin, "sale");
  assert.ok(storage.getItem(DEMO_STORAGE_KEY));

  const reset = applyDemoAction(loaded.state, { type: "RESET" });
  assert.deepEqual(reset.state, createSeedState());
  clearDemoState(storage);
  assert.equal(storage.getItem(DEMO_STORAGE_KEY), null);
});
