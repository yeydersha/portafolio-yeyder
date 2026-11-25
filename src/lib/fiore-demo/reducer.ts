/**
 * B0 — Reducer puro de la demo Fiore.
 *
 * Todas las transiciones validan antes de mutar y devuelven un estado nuevo.
 * El stock nunca es negativo, el SKU es único y cada cambio de stock queda
 * explicado por un movimiento. Las reglas financieras se toman siempre de
 * `pricing.ts`, que es la única fuente de cálculo.
 */

import {
  type DemoCategory,
  type DemoMovement,
  type DemoProduct,
  type DemoSupplier,
  type DemoValidatedMovementInput,
  type FioreDemoAction,
  type FioreDemoState,
  type ValidationIssue,
} from "../../data/fiore-demo/types";
import { createSeedState } from "../../data/fiore-demo/seed";
import { calculateProductPricing, calculateSaleTotal } from "./pricing";
import {
  validateCategoryDraft,
  validateDemoState,
  validateMovementInput,
  validateProductDraft,
  validateSupplierDraft,
} from "./validation";

export interface DemoActionResult {
  state: FioreDemoState;
  changed: boolean;
  error?: string;
}

function unchanged(state: FioreDemoState, error?: string): DemoActionResult {
  return error ? { state, changed: false, error } : { state, changed: false };
}

function formatIssues(issues: ValidationIssue[]): string {
  return issues.map((item) => `${item.field}: ${item.message}`).join("; ");
}

/**
 * Construye un movimiento a partir de una entrada validada.
 * `baseStock` permite representar la entrada inicial de un producto nuevo,
 * cuyo saldo previo es 0 aunque el producto ya tenga un stock asignado.
 */
function buildMovement(
  input: DemoValidatedMovementInput,
  id: string,
  createdAt: string,
  baseStock: number = input.product.stock,
): DemoMovement {
  const movement: DemoMovement = {
    id,
    productId: input.productId,
    type: input.type,
    quantity: input.quantity,
    delta: input.delta,
    origin: input.origin,
    note: input.note,
    createdAt,
    balanceAfter: baseStock + input.delta,
  };

  if (input.origin === "sale") {
    const pricing = calculateProductPricing({
      costPrice: input.product.costPrice,
      marginPct: input.product.marginPct,
      stock: input.product.stock,
      manualPrice: input.product.manualPrice,
      manualSellingPrice: input.product.manualSellingPrice,
    });
    movement.unitPrice = pricing.sellingPrice;
    movement.total = calculateSaleTotal(pricing.sellingPrice, input.quantity);
    /* B5 — Se congela también el costo vigente para poder reportar ganancia histórica. */
    movement.unitCost = input.product.costPrice;
  }

  return movement;
}

/** Aplica una acción devolviendo estado, indicador de cambio y error legible. */
export function applyDemoAction(
  state: FioreDemoState,
  action: FioreDemoAction,
): DemoActionResult {
  switch (action.type) {
    case "RESET":
      return { state: createSeedState(), changed: true };

    case "HYDRATE": {
      const result = validateDemoState(action.state);
      if (!result.ok) return unchanged(state, formatIssues(result.issues));
      return { state: result.value, changed: true };
    }

    case "ADD_PRODUCT": {
      const result = validateProductDraft(action.draft, {
        products: state.products,
        categories: state.categories,
        suppliers: state.suppliers,
      });
      if (!result.ok) return unchanged(state, formatIssues(result.issues));

      const product: DemoProduct = {
        ...result.value,
        id: action.id,
        createdAt: action.createdAt,
      };

      const movements = [...state.movements];
      if (product.stock > 0) {
        const opening = validateMovementInput(
          {
            productId: product.id,
            type: "entry",
            quantity: product.stock,
            note: "Entrada inicial de producto demo",
          },
          { products: [...state.products, product] },
        );
        if (!opening.ok) return unchanged(state, formatIssues(opening.issues));
        movements.push(buildMovement(opening.value, action.movementId, action.createdAt, 0));
      }

      return {
        state: {
          ...state,
          products: [...state.products, product],
          movements,
        },
        changed: true,
      };
    }

    case "UPDATE_PRODUCT": {
      const current = state.products.find((product) => product.id === action.id);
      if (!current) return unchanged(state, "El producto demo no existe");

      const merged: DemoProduct = { ...current, ...action.patch };
      if (!merged.manualPrice) merged.manualSellingPrice = undefined;

      const draftResult = validateProductDraft(merged, {
        products: state.products,
        categories: state.categories,
        suppliers: state.suppliers,
        excludeProductId: action.id,
      });
      if (!draftResult.ok) return unchanged(state, formatIssues(draftResult.issues));

      const updated: DemoProduct = { ...draftResult.value, id: current.id, createdAt: current.createdAt };
      const movements = [...state.movements];
      const stockDelta = updated.stock - current.stock;

      if (stockDelta !== 0) {
        if (!action.movementId || !action.movementCreatedAt) {
          return unchanged(state, "Un cambio de stock requiere identificador y fecha de movimiento");
        }
        const adjustment = validateMovementInput(
          {
            productId: current.id,
            type: "adjustment",
            quantity: Math.abs(stockDelta),
            direction: stockDelta > 0 ? 1 : -1,
            note: "Ajuste de stock al editar producto demo",
          },
          { products: state.products },
        );
        if (!adjustment.ok) return unchanged(state, formatIssues(adjustment.issues));
        movements.push(
          buildMovement(adjustment.value, action.movementId, action.movementCreatedAt, current.stock),
        );
      }

      return {
        state: {
          ...state,
          products: state.products.map((product) => (product.id === current.id ? updated : product)),
          movements,
        },
        changed: true,
      };
    }

    case "DELETE_PRODUCT": {
      if (!state.products.some((product) => product.id === action.id)) {
        return unchanged(state, "El producto demo no existe");
      }
      return {
        state: {
          ...state,
          products: state.products.filter((product) => product.id !== action.id),
          movements: state.movements.filter((movement) => movement.productId !== action.id),
        },
        changed: true,
      };
    }

    case "RECORD_MOVEMENT": {
      const result = validateMovementInput(action.input, { products: state.products });
      if (!result.ok) return unchanged(state, formatIssues(result.issues));

      if (result.value.origin === "sale") {
        const pricing = calculateProductPricing({
          costPrice: result.value.product.costPrice,
          marginPct: result.value.product.marginPct,
          stock: result.value.product.stock,
          manualPrice: result.value.product.manualPrice,
          manualSellingPrice: result.value.product.manualSellingPrice,
        });
        if (pricing.sellingPrice <= 0) {
          return unchanged(state, "Una venta ficticia requiere un precio de venta positivo");
        }
      }

      const movement = buildMovement(result.value, action.id, action.createdAt);
      return {
        state: {
          ...state,
          products: state.products.map((product) =>
            product.id === movement.productId ? { ...product, stock: movement.balanceAfter } : product,
          ),
          movements: [...state.movements, movement],
        },
        changed: true,
      };
    }

    case "ADD_CATEGORY": {
      const result = validateCategoryDraft(action.category, { categories: state.categories });
      if (!result.ok) return unchanged(state, formatIssues(result.issues));
      const category: DemoCategory = result.value;
      if (state.categories.some((item) => item.id === category.id)) {
        return unchanged(state, "Ya existe una categoría demo con ese identificador");
      }
      return { state: { ...state, categories: [...state.categories, category] }, changed: true };
    }

    case "ADD_SUPPLIER": {
      const result = validateSupplierDraft(action.supplier, { suppliers: state.suppliers });
      if (!result.ok) return unchanged(state, formatIssues(result.issues));
      const supplier: DemoSupplier = result.value;
      if (state.suppliers.some((item) => item.id === supplier.id)) {
        return unchanged(state, "Ya existe un proveedor demo con ese identificador");
      }
      return { state: { ...state, suppliers: [...state.suppliers, supplier] }, changed: true };
    }

    /* B4 — Editar o activar no elimina la entidad: las asociaciones se conservan. */
    case "UPDATE_CATEGORY": {
      const current = state.categories.find((category) => category.id === action.id);
      if (!current) return unchanged(state, "La categoría demo no existe");

      const candidate = { ...current, ...action.patch };
      const result = validateCategoryDraft(candidate, {
        categories: state.categories,
        excludeId: current.id,
      });
      if (!result.ok) return unchanged(state, formatIssues(result.issues));

      const updated: DemoCategory = { ...result.value, id: current.id };
      return {
        state: {
          ...state,
          categories: state.categories.map((category) =>
            category.id === current.id ? updated : category,
          ),
        },
        changed: true,
      };
    }

    case "UPDATE_SUPPLIER": {
      const current = state.suppliers.find((supplier) => supplier.id === action.id);
      if (!current) return unchanged(state, "El proveedor demo no existe");

      const candidate = { ...current, ...action.patch };
      const result = validateSupplierDraft(candidate, {
        suppliers: state.suppliers,
        excludeId: current.id,
      });
      if (!result.ok) return unchanged(state, formatIssues(result.issues));

      const updated: DemoSupplier = { ...result.value, id: current.id };
      return {
        state: {
          ...state,
          suppliers: state.suppliers.map((supplier) =>
            supplier.id === current.id ? updated : supplier,
          ),
        },
        changed: true,
      };
    }

    default:
      return unchanged(state);
  }
}

/** Reducer apto para `useReducer`; los errores se consultan con `applyDemoAction`. */
export function fioreDemoReducer(state: FioreDemoState, action: FioreDemoAction): FioreDemoState {
  return applyDemoAction(state, action).state;
}
