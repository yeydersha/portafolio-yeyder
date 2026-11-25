/**
 * B0 — Tipos locales de la demo de Fiore.
 *
 * Ningún tipo se importa desde el proyecto original. Los identificadores
 * internos usan el prefijo `demo-` y los SKU el prefijo `DEMO-` para que la
 * naturaleza demostrativa sea explícita también en los datos.
 */

export const DEMO_STATE_VERSION = 1 as const;
export type FioreDemoStateVersion = typeof DEMO_STATE_VERSION;

export type FioreDemoView =
  | "dashboard"
  | "inventory"
  | "categories"
  | "suppliers"
  | "movements"
  | "reports";

export type DemoMovementType = "entry" | "exit" | "adjustment" | "return";
export type DemoMovementOrigin = "seed" | "manual" | "sale";
export type DemoProductStatus = "active" | "inactive";

export interface DemoCategory {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface DemoSupplier {
  id: string;
  name: string;
  reference?: string;
  active: boolean;
}

export interface DemoProduct {
  id: string;
  sku: string;
  name: string;
  categoryId: string | null;
  supplierId: string | null;
  description?: string;
  material?: string;
  color?: string;
  costPrice: number;
  stock: number;
  marginPct: number;
  manualPrice: boolean;
  manualSellingPrice?: number;
  status: DemoProductStatus;
  createdAt: string;
}

export interface DemoMovement {
  id: string;
  productId: string;
  type: DemoMovementType;
  /** Magnitud positiva del movimiento. */
  quantity: number;
  /** Efecto firmado sobre el stock: entry/return +, exit -, adjustment ±. */
  delta: number;
  origin: DemoMovementOrigin;
  note?: string;
  createdAt: string;
  /** Stock del producto inmediatamente después de aplicar este movimiento. */
  balanceAfter: number;
  /** Snapshot del precio unitario solo para ventas ficticias. */
  unitPrice?: number;
  /** Snapshot del total solo para ventas ficticias. */
  total?: number;
  /**
   * B5 — Snapshot opcional del costo unitario al momento de la venta ficticia.
   * Las ventas guardadas antes de B5 no lo tienen: en ese caso la ganancia
   * histórica se marca como no disponible, nunca se calcula con el costo vigente.
   */
  unitCost?: number;
}

export interface FioreDemoState {
  version: FioreDemoStateVersion;
  products: DemoProduct[];
  categories: DemoCategory[];
  suppliers: DemoSupplier[];
  movements: DemoMovement[];
}

/** Datos editables de un producto; el id y createdAt los aporta la acción. */
export interface DemoProductDraft {
  sku: string;
  name: string;
  categoryId: string | null;
  supplierId: string | null;
  description?: string;
  material?: string;
  color?: string;
  costPrice: number;
  stock: number;
  marginPct: number;
  manualPrice: boolean;
  manualSellingPrice?: number;
  status: DemoProductStatus;
}

export interface DemoMovementInput {
  productId: string;
  type: DemoMovementType;
  /** Magnitud positiva; para adjustment se combine con `direction`. */
  quantity: number;
  /** Solo aplica a adjustment. Por defecto 1. */
  direction?: 1 | -1;
  /** `sale` solo es válido con `type: "exit"`. Por defecto `manual`. */
  origin?: "manual" | "sale";
  note?: string;
}

export interface DemoValidatedMovementInput extends DemoMovementInput {
  direction: 1 | -1;
  origin: "manual" | "sale";
  delta: number;
  product: DemoProduct;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

export type FioreDemoAction =
  | { type: "RESET" }
  | { type: "HYDRATE"; state: FioreDemoState }
  | {
      type: "ADD_PRODUCT";
      id: string;
      movementId: string;
      createdAt: string;
      draft: DemoProductDraft;
    }
  | {
      type: "UPDATE_PRODUCT";
      id: string;
      patch: Partial<DemoProductDraft>;
      movementId?: string;
      movementCreatedAt?: string;
    }
  | { type: "DELETE_PRODUCT"; id: string }
  | {
      type: "RECORD_MOVEMENT";
      id: string;
      createdAt: string;
      input: DemoMovementInput;
    }
  | { type: "ADD_CATEGORY"; category: DemoCategory }
  | { type: "ADD_SUPPLIER"; supplier: DemoSupplier }
  | {
      type: "UPDATE_CATEGORY";
      id: string;
      patch: Partial<Pick<DemoCategory, "name" | "description" | "active">>;
    }
  | {
      type: "UPDATE_SUPPLIER";
      id: string;
      patch: Partial<Pick<DemoSupplier, "name" | "reference" | "active">>;
    };

export interface DemoPricingView {
  suggestedPrice: number;
  sellingPrice: number;
  grossProfitUnit: number;
  grossProfitTotal: number;
  /** Margen calculado sobre el precio de venta. */
  marginPctOnSale: number;
  /** Porcentaje de incremento aplicado sobre el costo. */
  markupPctOnCost: number;
  manualPrice: boolean;
}

export interface DemoInventoryRow extends DemoProduct {
  categoryName?: string;
  supplierName?: string;
  pricing: DemoPricingView;
}

export interface DemoSaleSummary {
  count: number;
  units: number;
  /** Suma de snapshots históricos, no de precios vigentes. */
  revenue: number;
  note: string;
}

export interface DemoDashboardStats {
  totalProducts: number;
  totalUnits: number;
  totalCostValue: number;
  totalPotentialSaleValue: number;
  totalPotentialProfit: number;
  lowStockProducts: DemoInventoryRow[];
  outOfStockProducts: DemoInventoryRow[];
  recentProducts: DemoInventoryRow[];
  topProfitProducts: DemoInventoryRow[];
  simulatedSales: DemoSaleSummary;
}

export interface DemoMovementRow extends DemoMovement {
  productSku: string;
  productName: string;
}

export interface DemoReportTotals {
  units: number;
  costValue: number;
  saleValue: number;
  profit: number;
}

export interface DemoReportFilters {
  categoryId?: string;
  status?: DemoProductStatus | "all";
}

export interface DemoReportData {
  rows: DemoInventoryRow[];
  totals: DemoReportTotals;
  sales: DemoSaleSummary;
}

export interface DemoCategoryCount extends DemoCategory {
  productCount: number;
}

export interface DemoSupplierCount extends DemoSupplier {
  productCount: number;
}
