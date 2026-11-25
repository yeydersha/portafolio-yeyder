/**
 * B3 — Pruebas del inventario, el formulario y la calculadora de la demo Fiore.
 *
 * Comprueban las reglas que la vista B3 presenta, sin depender de React ni de
 * frameworks externos: altas, ediciones, movimientos por cambio de stock,
 * validación local, filtros, orden, cálculo y persistencia compartida con B2.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";

import { createSeedState } from "../src/data/fiore-demo/seed";
import type { DemoProductDraft } from "../src/data/fiore-demo/types";
import {
  filterInventoryRows,
  sortInventoryRows,
} from "../src/lib/fiore-demo/inventory-view";
import { calculateProductPricing } from "../src/lib/fiore-demo/pricing";
import { applyDemoAction } from "../src/lib/fiore-demo/reducer";
import { buildInventoryRows, selectDashboardStats } from "../src/lib/fiore-demo/selectors";
import {
  loadDemoState,
  resetDemoHydrationGate,
  saveDemoState,
  type DemoStorageLike,
} from "../src/lib/fiore-demo/storage";
import { validateDemoState, validateProductDraft } from "../src/lib/fiore-demo/validation";

function baseDraft(overrides: Partial<DemoProductDraft> = {}): DemoProductDraft {
  return {
    sku: "DEMO-PRU-099",
    name: "Producto de prueba B3",
    categoryId: "demo-cat-anillos",
    supplierId: "demo-sup-aurora",
    material: "Plata 925",
    color: "Plata",
    costPrice: 100_000,
    stock: 6,
    marginPct: 50,
    manualPrice: false,
    status: "active",
    ...overrides,
  };
}

/** `loadDemoState` devuelve el estado normalizado por `validateDemoState`. */
function normalizeState(state: ReturnType<typeof createSeedState>) {
  const result = validateDemoState(state);
  if (!result.ok) throw new Error(result.issues.map((issue) => issue.message).join("; "));
  return result.value;
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

test("B3 · el alta conserva el id interno y registra la entrada inicial", () => {
  const seed = createSeedState();
  const createdAt = "2026-11-24T12:00:00.000Z";
  const result = applyDemoAction(seed, {
    type: "ADD_PRODUCT",
    id: "demo-prod-b3-001",
    movementId: "demo-mov-b3-001",
    createdAt,
    draft: baseDraft(),
  });

  assert.equal(result.changed, true, result.error);
  const product = result.state.products.find((item) => item.id === "demo-prod-b3-001");
  assert.ok(product);
  assert.equal(product.sku, "DEMO-PRU-099");
  assert.equal(product.createdAt, createdAt);

  const opening = result.state.movements.find((item) => item.id === "demo-mov-b3-001");
  assert.ok(opening);
  assert.equal(opening.productId, product.id);
  assert.equal(opening.type, "entry");
  assert.equal(opening.quantity, 6);
  assert.equal(opening.delta, 6);
  assert.equal(opening.balanceAfter, 6);
  assert.equal(result.state.movements.length, seed.movements.length + 1);
  assert.equal(validateDemoState(result.state).ok, true);
  assert.equal(seed.products.length, 8);
});

test("B3 · editar sin cambiar stock conserva identidad e historial", () => {
  const seed = createSeedState();
  const result = applyDemoAction(seed, {
    type: "UPDATE_PRODUCT",
    id: "demo-prod-001",
    patch: { costPrice: 90_000, marginPct: 60 },
  });

  assert.equal(result.changed, true, result.error);
  const before = seed.products.find((item) => item.id === "demo-prod-001");
  const after = result.state.products.find((item) => item.id === "demo-prod-001");
  assert.ok(before);
  assert.ok(after);
  assert.equal(after.id, before.id);
  assert.equal(after.createdAt, before.createdAt);
  assert.deepEqual(result.state.movements, seed.movements);

  const row = buildInventoryRows(result.state).find((item) => item.id === before.id);
  assert.ok(row);
  assert.equal(row.pricing.suggestedPrice, 144_000);
  assert.equal(row.pricing.sellingPrice, 144_000);
  assert.equal(row.pricing.grossProfitUnit, 54_000);
  assert.equal(row.pricing.grossProfitTotal, 648_000);
});

test("B3 · cambiar stock al editar crea un ajuste sin borrar el historial", () => {
  const seed = createSeedState();
  const movementCreatedAt = "2026-11-24T13:00:00.000Z";
  const result = applyDemoAction(seed, {
    type: "UPDATE_PRODUCT",
    id: "demo-prod-002",
    patch: { stock: 9 },
    movementId: "demo-mov-b3-003",
    movementCreatedAt,
  });

  assert.equal(result.changed, true, result.error);
  const product = result.state.products.find((item) => item.id === "demo-prod-002");
  assert.ok(product);
  assert.equal(product.stock, 9);
  assert.equal(result.state.movements.length, seed.movements.length + 1);
  assert.ok(
    seed.movements.every((movement) =>
      result.state.movements.some((candidate) => candidate.id === movement.id),
    ),
  );

  const adjustment = result.state.movements.find((item) => item.id === "demo-mov-b3-003");
  assert.ok(adjustment);
  assert.equal(adjustment.type, "adjustment");
  assert.equal(adjustment.quantity, 5);
  assert.equal(adjustment.delta, 5);
  assert.equal(adjustment.balanceAfter, 9);
  assert.equal(adjustment.createdAt, movementCreatedAt);
  assert.equal(validateDemoState(result.state).ok, true);
});

test("B3 · un SKU duplicado se rechaza aunque cambie la capitalización", () => {
  const seed = createSeedState();
  const draft = baseDraft({ sku: "demo-ani-001" });
  const validation = validateProductDraft(draft, {
    products: seed.products,
    categories: seed.categories,
    suppliers: seed.suppliers,
  });

  assert.equal(validation.ok, false);
  if (!validation.ok) {
    assert.ok(
      validation.issues.some(
        (issue) => issue.field === "sku" && /Ya existe/.test(issue.message),
      ),
    );
  }

  const result = applyDemoAction(seed, {
    type: "ADD_PRODUCT",
    id: "demo-prod-b3-duplicado",
    movementId: "demo-mov-b3-duplicado",
    createdAt: "2026-11-24T14:00:00.000Z",
    draft,
  });
  assert.equal(result.changed, false);
  assert.match(result.error ?? "", /sku/i);
  assert.equal(result.state, seed);
});

test("B3 · se rechazan costo negativo, stock negativo y margen mayor a 500", () => {
  const seed = createSeedState();
  const context = {
    products: seed.products,
    categories: seed.categories,
    suppliers: seed.suppliers,
  };
  const cases = [
    { override: { costPrice: -1 }, field: "costPrice", pattern: /negativo/i },
    { override: { stock: -2 }, field: "stock", pattern: /negativo/i },
    { override: { marginPct: 501 }, field: "marginPct", pattern: /500/ },
  ] as const;

  for (const item of cases) {
    const result = validateProductDraft(baseDraft(item.override), context);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(
        result.issues.some(
          (issue) => issue.field === item.field && item.pattern.test(issue.message),
        ),
        `Falta el error de ${item.field}`,
      );
    }
  }
});

test("B3 · se rechazan precios manuales inválidos y referencias inexistentes", () => {
  const seed = createSeedState();
  const context = {
    products: seed.products,
    categories: seed.categories,
    suppliers: seed.suppliers,
  };

  const missingManual = validateProductDraft(baseDraft({ manualPrice: true }), context);
  assert.equal(missingManual.ok, false);
  if (!missingManual.ok) {
    assert.ok(missingManual.issues.some((issue) => issue.field === "manualSellingPrice"));
  }

  const negativeManual = validateProductDraft(
    baseDraft({ manualPrice: true, manualSellingPrice: -5 }),
    context,
  );
  assert.equal(negativeManual.ok, false);
  if (!negativeManual.ok) {
    assert.ok(
      negativeManual.issues.some(
        (issue) => issue.field === "manualSellingPrice" && /negativo/i.test(issue.message),
      ),
    );
  }

  const badReferences = validateProductDraft(
    baseDraft({
      sku: "DEMO-REF-999",
      categoryId: "demo-cat-inexistente",
      supplierId: "demo-sup-inexistente",
    }),
    context,
  );
  assert.equal(badReferences.ok, false);
  if (!badReferences.ok) {
    assert.ok(badReferences.issues.some((issue) => issue.field === "categoryId"));
    assert.ok(badReferences.issues.some((issue) => issue.field === "supplierId"));
  }
});

test("B3 · búsqueda y filtros devuelven solo las filas ficticias esperadas", () => {
  const rows = buildInventoryRows(createSeedState());

  assert.deepEqual(
    filterInventoryRows(rows, { query: "eclipse" }).map((row) => row.id),
    ["demo-prod-004"],
  );
  assert.deepEqual(
    filterInventoryRows(rows, { query: "pul-001" }).map((row) => row.id),
    ["demo-prod-005"],
  );
  assert.deepEqual(
    filterInventoryRows(rows, { categoryId: "demo-cat-aretes", status: "active" }).map(
      (row) => row.id,
    ),
    ["demo-prod-007"],
  );
  assert.deepEqual(
    filterInventoryRows(rows, { categoryId: "demo-cat-aretes", status: "inactive" }).map(
      (row) => row.id,
    ),
    ["demo-prod-008"],
  );
  assert.deepEqual(
    filterInventoryRows(rows, { availability: "low" }).map((row) => row.id),
    ["demo-prod-002", "demo-prod-005", "demo-prod-007"],
  );
  assert.deepEqual(
    filterInventoryRows(rows, { availability: "out" }).map((row) => row.id),
    ["demo-prod-004"],
  );
  assert.deepEqual(filterInventoryRows(rows, { query: "no existe" }), []);
});

test("B3 · el ordenamiento usa nombre, stock y ganancia sin mutar las filas", () => {
  const rows = buildInventoryRows(createSeedState());
  const originalIds = rows.map((row) => row.id);

  const byName = sortInventoryRows(rows, "name-asc");
  assert.deepEqual(
    byName.map((row) => row.name),
    [...rows].map((row) => row.name).sort((a, b) => a.localeCompare(b, "es")),
  );
  assert.deepEqual(sortInventoryRows(rows, "stock-asc")[0].id, "demo-prod-004");
  assert.deepEqual(sortInventoryRows(rows, "created-desc")[0].id, "demo-prod-008");
  assert.deepEqual(
    sortInventoryRows(rows, "profit-desc")
      .slice(0, 5)
      .map((row) => row.id),
    [
      "demo-prod-006",
      "demo-prod-001",
      "demo-prod-003",
      "demo-prod-005",
      "demo-prod-008",
    ],
  );
  assert.deepEqual(rows.map((row) => row.id), originalIds);
});

test("B3 · la calculadora en vivo usa pricing.ts y distingue ambos porcentajes", () => {
  const draft = baseDraft({ costPrice: 100_000, stock: 7, marginPct: 60, sku: "DEMO-CAL-100" });
  const live = calculateProductPricing({
    costPrice: draft.costPrice,
    marginPct: draft.marginPct,
    stock: draft.stock,
    manualPrice: draft.manualPrice,
  });

  assert.equal(live.suggestedPrice, 160_000);
  assert.equal(live.sellingPrice, 160_000);
  assert.equal(live.grossProfitUnit, 60_000);
  assert.equal(live.grossProfitTotal, 420_000);
  assert.equal(live.markupPctOnCost, 60);
  assert.equal(live.marginPctOnSale, 37.5);

  const manual = calculateProductPricing({
    costPrice: draft.costPrice,
    marginPct: draft.marginPct,
    stock: draft.stock,
    manualPrice: true,
    manualSellingPrice: 145_000,
  });
  assert.equal(manual.suggestedPrice, 160_000);
  assert.equal(manual.sellingPrice, 145_000);
  assert.equal(manual.grossProfitTotal, 315_000);
  assert.equal(manual.markupPctOnCost, 60);
  assert.equal(manual.marginPctOnSale, 31.03);

  const added = applyDemoAction(createSeedState(), {
    type: "ADD_PRODUCT",
    id: "demo-prod-b3-cal",
    movementId: "demo-mov-b3-cal",
    createdAt: "2026-11-24T15:00:00.000Z",
    draft,
  });
  assert.equal(added.changed, true, added.error);
  const row = buildInventoryRows(added.state).find((item) => item.id === "demo-prod-b3-cal");
  assert.ok(row);
  assert.deepEqual(row.pricing, live);
});

test("B3 · dashboard, persistencia y reinicio comparten el mismo estado B0", () => {
  resetDemoHydrationGate();
  const storage = createMemoryStorage();
  assert.equal(loadDemoState(storage).status, "empty");

  const seed = createSeedState();
  const added = applyDemoAction(seed, {
    type: "ADD_PRODUCT",
    id: "demo-prod-b3-persist",
    movementId: "demo-mov-b3-persist-open",
    createdAt: "2026-11-24T16:00:00.000Z",
    draft: baseDraft({ sku: "DEMO-PER-100", stock: 10 }),
  });
  assert.equal(added.changed, true, added.error);

  const edited = applyDemoAction(added.state, {
    type: "UPDATE_PRODUCT",
    id: "demo-prod-b3-persist",
    patch: { stock: 8 },
    movementId: "demo-mov-b3-persist-adjust",
    movementCreatedAt: "2026-11-24T16:30:00.000Z",
  });
  assert.equal(edited.changed, true, edited.error);

  const stats = selectDashboardStats(edited.state);
  assert.equal(stats.totalProducts, 9);
  assert.equal(stats.totalUnits, 66);
  assert.equal(stats.totalPotentialProfit, 3_342_970);
  assert.equal(validateDemoState(edited.state).ok, true);

  assert.equal(saveDemoState(edited.state, storage), true);
  const reloaded = loadDemoState(storage);
  assert.equal(reloaded.status, "ok");
  if (reloaded.status === "ok") assert.deepEqual(reloaded.state, normalizeState(edited.state));

  const reset = applyDemoAction(reloaded.status === "ok" ? reloaded.state : edited.state, {
    type: "RESET",
  });
  assert.equal(saveDemoState(reset.state, storage), true);
  const afterReset = loadDemoState(storage);
  assert.equal(afterReset.status, "ok");
  if (afterReset.status === "ok") assert.deepEqual(afterReset.state, normalizeState(createSeedState()));
  assert.equal(selectDashboardStats(createSeedState()).totalUnits, 58);
});
