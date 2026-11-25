/**
 * B6 — Regresiones de la auditoría final.
 *
 * Cubren únicamente defectos detectados durante B6: validación de ventas
 * persistidas mal formadas, cifras COP negativas en CSV, semilla versionada y
 * almacenamiento bloqueado o corrupto. Las 67 pruebas B0-B5 se conservan.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";

import { createSeedState } from "../src/data/fiore-demo/seed";
import { DEMO_STATE_VERSION } from "../src/data/fiore-demo/types";
import { formatCOP } from "../src/lib/fiore-demo/pricing";
import { applyDemoAction } from "../src/lib/fiore-demo/reducer";
import {
  buildReportModel,
  buildReportsCsv,
  EMPTY_REPORT_FILTERS,
} from "../src/lib/fiore-demo/reports-view";
import {
  clearDemoState,
  DEMO_STORAGE_KEY,
  isDemoHydrationResolved,
  loadDemoState,
  resetDemoHydrationGate,
  saveDemoState,
  type DemoStorageLike,
} from "../src/lib/fiore-demo/storage";
import { validateDemoState } from "../src/lib/fiore-demo/validation";

/** Igualdad con localStorage: las claves `undefined` desaparecen al serializar. */
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

function createBlockedStorage(): DemoStorageLike {
  const blocked = () => {
    throw new Error("localStorage bloqueado");
  };
  return { getItem: blocked, setItem: blocked, removeItem: blocked };
}

test("B6 · la semilla usa la versión canónica y sigue siendo válida", () => {
  assert.equal(createSeedState().version, DEMO_STATE_VERSION);
  assert.equal(validateDemoState(asPersisted(createSeedState())).ok, true);
});

test("B6 · venta persistida con precio inválido devuelve issues, no excepción", () => {
  const base = createSeedState();
  const saleIndex = base.movements.findIndex((movement) => movement.origin === "sale");
  assert.ok(saleIndex >= 0);

  for (const badPrice of [-5, 1.5]) {
    const state = asPersisted(createSeedState());
    const movement = state.movements[saleIndex] as unknown as Record<string, unknown>;
    movement.unitPrice = badPrice;
    assert.doesNotThrow(() => validateDemoState(state));
    const result = validateDemoState(state);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(
      result.issues.some((item) => item.field.endsWith(".unitPrice")),
      JSON.stringify(result.issues),
    );
  }

  const zeroQuantity = asPersisted(createSeedState());
  const movement = zeroQuantity.movements[saleIndex] as unknown as Record<string, unknown>;
  movement.quantity = 0;
  assert.doesNotThrow(() => validateDemoState(zeroQuantity));
  assert.equal(validateDemoState(zeroQuantity).ok, false);
});

test("B6 · CSV conserva la cifra COP negativa y neutraliza fórmulas en texto", () => {
  const priced = applyDemoAction(createSeedState(), {
    type: "UPDATE_PRODUCT",
    id: "demo-prod-002",
    patch: { manualPrice: true, manualSellingPrice: 50_000 },
  });
  assert.equal(priced.changed, true, priced.error);
  const sold = applyDemoAction(priced.state, {
    type: "RECORD_MOVEMENT",
    id: "demo-mov-b6-loss",
    createdAt: "2026-11-24T15:00:00.000Z",
    input: {
      productId: "demo-prod-002",
      type: "exit",
      quantity: 1,
      origin: "sale",
    },
  });
  assert.equal(sold.changed, true, sold.error);

  const model = buildReportModel(sold.state, EMPTY_REPORT_FILTERS);
  const csv = buildReportsCsv(model);
  const loss = formatCOP(-70_000);
  assert.ok(csv.includes(`"${loss}"`), `Falta la cifra ${loss} en el CSV`);
  assert.ok(!csv.includes(`"'${loss}"`));

  const injected = {
    ...model,
    movements: model.movements.map((row, index) =>
      index === 0 ? { ...row, note: "=SUM(1+1)" } : row,
    ),
  };
  assert.ok(buildReportsCsv(injected).includes(`"'=SUM(1+1)"`));
});

test("B6 · almacenamiento bloqueado no interrumpe la demo", () => {
  const blocked = createBlockedStorage();
  resetDemoHydrationGate();
  assert.equal(saveDemoState(createSeedState(), blocked), false);
  assert.equal(isDemoHydrationResolved(), false);
  assert.equal(loadDemoState(blocked).status, "empty");
  assert.equal(isDemoHydrationResolved(), true);
  assert.equal(saveDemoState(createSeedState(), blocked), false);
  assert.doesNotThrow(() => clearDemoState(blocked));
  resetDemoHydrationGate();
});

test("B6 · estado persistido ilegible se descarta antes de volver a escribir", () => {
  resetDemoHydrationGate();
  const storage = createMemoryStorage();
  storage.setItem(DEMO_STORAGE_KEY, "{no es json");
  assert.equal(loadDemoState(storage).status, "invalid");
  assert.equal(storage.getItem(DEMO_STORAGE_KEY), null);
  assert.equal(isDemoHydrationResolved(), true);
  resetDemoHydrationGate();
});
