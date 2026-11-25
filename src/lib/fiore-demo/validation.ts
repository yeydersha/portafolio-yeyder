/**
 * B0 — Validación ligera, sin dependencias externas.
 *
 * Sustituye a los esquemas del original por comprobaciones explícitas.
 * Toda estructura que entre desde localStorage pasa por `validateDemoState`
 * antes de ser utilizada.
 */

import {
  DEMO_STATE_VERSION,
  type DemoCategory,
  type DemoMovement,
  type DemoMovementOrigin,
  type DemoMovementType,
  type DemoProduct,
  type DemoProductDraft,
  type DemoProductStatus,
  type DemoSupplier,
  type DemoValidatedMovementInput,
  type FioreDemoState,
  type ValidationIssue,
  type ValidationResult,
} from "../../data/fiore-demo/types";
import { calculateSaleTotal } from "./pricing";

export interface ProductValidationContext {
  products: DemoProduct[];
  categories: DemoCategory[];
  suppliers: DemoSupplier[];
  excludeProductId?: string;
}

interface MovementValidationContext {
  products: DemoProduct[];
}

const MOVEMENT_TYPES: readonly DemoMovementType[] = ["entry", "exit", "adjustment", "return"];
const PRODUCT_STATUSES: readonly DemoProductStatus[] = ["active", "inactive"];
const SKU_PATTERN = /^DEMO-[A-Z0-9-]{1,45}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issue(field: string, message: string): ValidationIssue {
  return { field, message };
}

function readRequiredString(
  source: Record<string, unknown>,
  key: string,
  maxLength: number,
  field: string,
  issues: ValidationIssue[],
): string | null {
  const raw = source[key];
  if (typeof raw !== "string") {
    issues.push(issue(field, "Debe ser una cadena de texto"));
    return null;
  }
  const value = raw.trim();
  if (value.length === 0) {
    issues.push(issue(field, "Es requerido"));
    return null;
  }
  if (value.length > maxLength) {
    issues.push(issue(field, `Máximo ${maxLength} caracteres`));
    return null;
  }
  return value;
}

function readOptionalString(
  source: Record<string, unknown>,
  key: string,
  maxLength: number,
  field: string,
  issues: ValidationIssue[],
): string | undefined {
  const raw = source[key];
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (typeof raw !== "string") {
    issues.push(issue(field, "Debe ser una cadena de texto"));
    return undefined;
  }
  const value = raw.trim();
  if (value.length > maxLength) {
    issues.push(issue(field, `Máximo ${maxLength} caracteres`));
    return undefined;
  }
  return value.length === 0 ? undefined : value;
}

function readInteger(
  source: Record<string, unknown>,
  key: string,
  field: string,
  issues: ValidationIssue[],
): number | null {
  const raw = source[key];
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    issues.push(issue(field, "Debe ser un número entero"));
    return null;
  }
  return raw;
}

function readFiniteNumber(
  source: Record<string, unknown>,
  key: string,
  field: string,
  issues: ValidationIssue[],
): number | null {
  const raw = source[key];
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    issues.push(issue(field, "Debe ser un número finito"));
    return null;
  }
  return raw;
}

function readBoolean(
  source: Record<string, unknown>,
  key: string,
  field: string,
  issues: ValidationIssue[],
): boolean | null {
  const raw = source[key];
  if (typeof raw !== "boolean") {
    issues.push(issue(field, "Debe ser verdadero o falso"));
    return null;
  }
  return raw;
}

function readIsoDate(
  source: Record<string, unknown>,
  key: string,
  field: string,
  issues: ValidationIssue[],
): string | null {
  const raw = source[key];
  if (typeof raw !== "string" || !Number.isFinite(Date.parse(raw))) {
    issues.push(issue(field, "Debe ser una fecha ISO válida"));
    return null;
  }
  return raw;
}

function assertUniqueIds(items: Array<{ id: string }>, label: string, issues: ValidationIssue[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      issues.push(issue(label, `Identificador duplicado: ${item.id}`));
    }
    seen.add(item.id);
  }
}

/** Valida y normaliza un borrador de producto, incluido el SKU único. */
export function validateProductDraft(
  input: unknown,
  context: ProductValidationContext,
): ValidationResult<DemoProductDraft> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    return { ok: false, issues: [issue("product", "El producto debe ser un objeto")] };
  }

  const rawSku = readRequiredString(input, "sku", 50, "sku", issues);
  const sku = rawSku === null ? null : rawSku.toUpperCase();
  if (sku !== null && !SKU_PATTERN.test(sku)) {
    issues.push(issue("sku", "El SKU demo debe tener el formato DEMO-XXXX"));
  }
  if (
    sku !== null &&
    context.products.some(
      (product) => product.id !== context.excludeProductId && product.sku.toUpperCase() === sku,
    )
  ) {
    issues.push(issue("sku", "Ya existe un producto demo con este SKU"));
  }

  const name = readRequiredString(input, "name", 200, "name", issues);

  const rawCategoryId = input.categoryId;
  let categoryId: string | null = null;
  if (rawCategoryId !== undefined && rawCategoryId !== null && rawCategoryId !== "") {
    if (typeof rawCategoryId !== "string" || !rawCategoryId.startsWith("demo-cat-")) {
      issues.push(issue("categoryId", "La categoría demo no es válida"));
    } else if (!context.categories.some((category) => category.id === rawCategoryId)) {
      issues.push(issue("categoryId", "La categoría demo no existe"));
    } else {
      categoryId = rawCategoryId;
    }
  }

  const rawSupplierId = input.supplierId;
  let supplierId: string | null = null;
  if (rawSupplierId !== undefined && rawSupplierId !== null && rawSupplierId !== "") {
    if (typeof rawSupplierId !== "string" || !rawSupplierId.startsWith("demo-sup-")) {
      issues.push(issue("supplierId", "El proveedor demo no es válido"));
    } else if (!context.suppliers.some((supplier) => supplier.id === rawSupplierId)) {
      issues.push(issue("supplierId", "El proveedor demo no existe"));
    } else {
      supplierId = rawSupplierId;
    }
  }

  const description = readOptionalString(input, "description", 1000, "description", issues);
  const material = readOptionalString(input, "material", 100, "material", issues);
  const color = readOptionalString(input, "color", 100, "color", issues);

  const costPrice = readInteger(input, "costPrice", "costPrice", issues);
  if (costPrice !== null && costPrice < 0) issues.push(issue("costPrice", "El costo no puede ser negativo"));

  const stock = readInteger(input, "stock", "stock", issues);
  if (stock !== null && stock < 0) issues.push(issue("stock", "El stock no puede ser negativo"));

  const marginPct = readFiniteNumber(input, "marginPct", "marginPct", issues);
  if (marginPct !== null && (marginPct < 0 || marginPct > 500)) {
    issues.push(issue("marginPct", "El margen sobre costo debe estar entre 0 y 500"));
  }

  const manualPrice = readBoolean(input, "manualPrice", "manualPrice", issues) ?? false;
  const manualSellingPriceRaw = input.manualSellingPrice;
  let manualSellingPrice: number | undefined;
  if (manualPrice) {
    if (typeof manualSellingPriceRaw !== "number" || !Number.isInteger(manualSellingPriceRaw)) {
      issues.push(issue("manualSellingPrice", "Requerido como entero cuando el precio manual está activo"));
    } else if (manualSellingPriceRaw < 0) {
      issues.push(issue("manualSellingPrice", "El precio manual no puede ser negativo"));
    } else {
      manualSellingPrice = manualSellingPriceRaw;
    }
  } else if (manualSellingPriceRaw !== undefined && manualSellingPriceRaw !== null) {
    issues.push(issue("manualSellingPrice", "Solo se usa cuando manualPrice es verdadero"));
  }

  const rawStatus = input.status;
  let status: DemoProductStatus = "active";
  if (rawStatus !== undefined) {
    if (typeof rawStatus !== "string" || !PRODUCT_STATUSES.includes(rawStatus as DemoProductStatus)) {
      issues.push(issue("status", "Estado no válido"));
    } else {
      status = rawStatus as DemoProductStatus;
    }
  }

  if (issues.length > 0 || sku === null || name === null || costPrice === null || stock === null || marginPct === null) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      sku,
      name,
      categoryId,
      supplierId,
      description,
      material,
      color,
      costPrice,
      stock,
      marginPct,
      manualPrice,
      manualSellingPrice,
      status,
    },
  };
}

/** Valida un movimiento y calcula su efecto firmado sobre el stock. */
export function validateMovementInput(
  input: unknown,
  context: MovementValidationContext,
): ValidationResult<DemoValidatedMovementInput> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    return { ok: false, issues: [issue("movement", "El movimiento debe ser un objeto")] };
  }

  const productId = readRequiredString(input, "productId", 80, "productId", issues);
  const product =
    productId === null
      ? undefined
      : context.products.find((candidate) => candidate.id === productId);
  if (productId !== null && !productId.startsWith("demo-prod-")) {
    issues.push(issue("productId", "El producto demo no es válido"));
  }
  if (productId !== null && !product) {
    issues.push(issue("productId", "El producto demo no existe"));
  }

  const rawType = input.type;
  if (typeof rawType !== "string" || !MOVEMENT_TYPES.includes(rawType as DemoMovementType)) {
    issues.push(issue("type", "Tipo de movimiento no válido"));
  }
  const type = rawType as DemoMovementType;

  const quantity = readInteger(input, "quantity", "quantity", issues);
  if (quantity !== null && quantity <= 0) {
    issues.push(issue("quantity", "La cantidad debe ser mayor a cero"));
  }

  let direction: 1 | -1 = 1;
  if (input.direction !== undefined) {
    if (input.direction !== 1 && input.direction !== -1) {
      issues.push(issue("direction", "La dirección debe ser 1 o -1"));
    } else {
      direction = input.direction;
    }
  }
  if (type !== "adjustment" && input.direction !== undefined) {
    issues.push(issue("direction", "La dirección solo aplica a ajustes"));
  }

  let origin: "manual" | "sale" = "manual";
  if (input.origin !== undefined) {
    if (input.origin !== "manual" && input.origin !== "sale") {
      issues.push(issue("origin", "El origen debe ser manual o sale"));
    } else {
      origin = input.origin;
    }
  }
  if (origin === "sale" && type !== "exit") {
    issues.push(issue("origin", "Una venta ficticia debe ser una salida"));
  }

  const note = readOptionalString(input, "note", 500, "note", issues);

  let delta = 0;
  if (type === "entry" || type === "return") delta = quantity ?? 0;
  if (type === "exit") delta = -(quantity ?? 0);
  if (type === "adjustment") delta = direction * (quantity ?? 0);

  if (product && quantity !== null && product.stock + delta < 0) {
    issues.push(issue("quantity", `Stock insuficiente. Disponible: ${product.stock}`));
  }

  if (issues.length > 0 || !product || productId === null || quantity === null) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      productId,
      type,
      quantity,
      direction,
      origin,
      note,
      delta,
      product,
    },
  };
}

/** Valida una categoría demo para altas y para datos persistidos. */
export function validateCategoryShape(
  input: unknown,
  field = "category",
): ValidationResult<DemoCategory> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) return { ok: false, issues: [issue(field, "Debe ser un objeto")] };

  const id = readRequiredString(input, "id", 80, `${field}.id`, issues);
  if (id !== null && !id.startsWith("demo-cat-")) {
    issues.push(issue(`${field}.id`, "El identificador debe empezar con demo-cat-"));
  }
  const name = readRequiredString(input, "name", 80, `${field}.name`, issues);
  const description = readOptionalString(input, "description", 300, `${field}.description`, issues);
  const active = readBoolean(input, "active", `${field}.active`, issues);

  if (issues.length > 0 || id === null || name === null || active === null) {
    return { ok: false, issues };
  }
  return { ok: true, value: { id, name, description, active } };
}

/** Valida un proveedor ficticio para altas y para datos persistidos. */
export function validateSupplierShape(
  input: unknown,
  field = "supplier",
): ValidationResult<DemoSupplier> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) return { ok: false, issues: [issue(field, "Debe ser un objeto")] };

  const id = readRequiredString(input, "id", 80, `${field}.id`, issues);
  if (id !== null && !id.startsWith("demo-sup-")) {
    issues.push(issue(`${field}.id`, "El identificador debe empezar con demo-sup-"));
  }
  const name = readRequiredString(input, "name", 120, `${field}.name`, issues);
  const reference = readOptionalString(input, "reference", 80, `${field}.reference`, issues);
  if (reference !== undefined && !reference.startsWith("DEMO-")) {
    issues.push(issue(`${field}.reference`, "La referencia debe ser demostrativa"));
  }
  const active = readBoolean(input, "active", `${field}.active`, issues);

  if (issues.length > 0 || id === null || name === null || active === null) {
    return { ok: false, issues };
  }
  return { ok: true, value: { id, name, reference, active } };
}

function validateStoredProduct(
  input: unknown,
  field: string,
  categories: DemoCategory[],
  suppliers: DemoSupplier[],
): ValidationResult<DemoProduct> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) return { ok: false, issues: [issue(field, "Debe ser un objeto")] };

  const id = readRequiredString(input, "id", 80, `${field}.id`, issues);
  if (id !== null && !id.startsWith("demo-prod-")) {
    issues.push(issue(`${field}.id`, "El identificador debe empezar con demo-prod-"));
  }
  const createdAt = readIsoDate(input, "createdAt", `${field}.createdAt`, issues);

  const draftResult = validateProductDraft(input, { products: [], categories, suppliers });
  if (!draftResult.ok) {
    issues.push(
      ...draftResult.issues.map((item) => issue(`${field}.${item.field}`, item.message)),
    );
  }

  if (issues.length > 0 || id === null || createdAt === null || !draftResult.ok) {
    return { ok: false, issues };
  }
  return { ok: true, value: { ...draftResult.value, id, createdAt } };
}

function validateStoredMovement(
  input: unknown,
  field: string,
  products: DemoProduct[],
): ValidationResult<DemoMovement> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) return { ok: false, issues: [issue(field, "Debe ser un objeto")] };

  const id = readRequiredString(input, "id", 80, `${field}.id`, issues);
  if (id !== null && !id.startsWith("demo-mov-")) {
    issues.push(issue(`${field}.id`, "El identificador debe empezar con demo-mov-"));
  }
  const productId = readRequiredString(input, "productId", 80, `${field}.productId`, issues);
  if (productId !== null && !products.some((product) => product.id === productId)) {
    issues.push(issue(`${field}.productId`, "El producto del movimiento no existe"));
  }

  const rawType = input.type;
  if (typeof rawType !== "string" || !MOVEMENT_TYPES.includes(rawType as DemoMovementType)) {
    issues.push(issue(`${field}.type`, "Tipo de movimiento no válido"));
  }
  const type = rawType as DemoMovementType;

  const quantity = readInteger(input, "quantity", `${field}.quantity`, issues);
  if (quantity !== null && quantity <= 0) {
    issues.push(issue(`${field}.quantity`, "La cantidad debe ser mayor a cero"));
  }
  const delta = readInteger(input, "delta", `${field}.delta`, issues);
  const balanceAfter = readInteger(input, "balanceAfter", `${field}.balanceAfter`, issues);
  if (balanceAfter !== null && balanceAfter < 0) {
    issues.push(issue(`${field}.balanceAfter`, "El saldo no puede ser negativo"));
  }

  const rawOrigin = input.origin;
  let origin: DemoMovementOrigin = "seed";
  if (rawOrigin === "seed" || rawOrigin === "manual" || rawOrigin === "sale") {
    origin = rawOrigin;
  } else {
    issues.push(issue(`${field}.origin`, "Origen de movimiento no válido"));
  }
  if (origin === "sale" && type !== "exit") {
    issues.push(issue(`${field}.origin`, "Una venta ficticia debe ser una salida"));
  }

  const note = readOptionalString(input, "note", 500, `${field}.note`, issues);
  const createdAt = readIsoDate(input, "createdAt", `${field}.createdAt`, issues);

  if (quantity !== null && delta !== null) {
    const expectedDelta =
      type === "entry" || type === "return"
        ? quantity
        : type === "exit"
          ? -quantity
          : Math.abs(delta) === quantity && delta !== 0
            ? delta
            : Number.NaN;
    if (!Number.isFinite(expectedDelta) || delta !== expectedDelta) {
      issues.push(issue(`${field}.delta`, "El efecto firmado no coincide con el tipo y la cantidad"));
    }
  }

  const unitPrice = input.unitPrice;
  const total = input.total;
  const unitCost = input.unitCost;
  if (origin === "sale") {
    if (typeof unitPrice !== "number" || !Number.isInteger(unitPrice) || unitPrice <= 0) {
      issues.push(issue(`${field}.unitPrice`, "La venta ficticia requiere un precio unitario positivo"));
    }
    if (typeof total !== "number" || !Number.isInteger(total) || total < 0) {
      issues.push(issue(`${field}.total`, "La venta ficticia requiere un total entero"));
    } else if (
      typeof unitPrice === "number" &&
      Number.isInteger(unitPrice) &&
      unitPrice > 0 &&
      quantity !== null &&
      quantity > 0 &&
      total !== calculateSaleTotal(unitPrice, quantity)
    ) {
      /* Solo se compara cuando ambos operandos son válidos: calculateSaleTotal
       * lanza ante valores inválidos y este validador debe devolver issues. */
      issues.push(issue(`${field}.total`, "El total no coincide con precio unitario por cantidad"));
    }
    /*
     * B5 — El costo histórico es opcional para no rechazar ventas persistidas
     * antes de este bloque. Si existe, debe ser un entero no negativo; nunca se
     * rellena automáticamente con el costo actual del producto.
     */
    if (
      unitCost !== undefined &&
      (typeof unitCost !== "number" || !Number.isInteger(unitCost) || unitCost < 0)
    ) {
      issues.push(issue(`${field}.unitCost`, "El costo histórico de la venta debe ser un entero no negativo"));
    }
  } else if (unitPrice !== undefined || total !== undefined || unitCost !== undefined) {
    issues.push(issue(`${field}.unitPrice`, "Solo las ventas ficticias guardan precio, total y costo"));
  }

  if (
    issues.length > 0 ||
    id === null ||
    productId === null ||
    quantity === null ||
    delta === null ||
    balanceAfter === null ||
    createdAt === null
  ) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      id,
      productId,
      type,
      quantity,
      delta,
      origin,
      note,
      createdAt,
      balanceAfter,
      unitPrice: origin === "sale" ? (unitPrice as number) : undefined,
      total: origin === "sale" ? (total as number) : undefined,
      unitCost: origin === "sale" && typeof unitCost === "number" ? unitCost : undefined,
    },
  };
}

function requireArray(source: Record<string, unknown>, key: string, issues: ValidationIssue[]): unknown[] {
  const raw = source[key];
  if (!Array.isArray(raw)) {
    issues.push(issue(key, "Debe ser una lista"));
    return [];
  }
  return raw;
}

/**
 * Valida por completo un estado persistido: formas, referencias, SKU único,
 * historial de movimientos y coherencia stock <-> movimientos.
 */
export function validateDemoState(value: unknown): ValidationResult<FioreDemoState> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) {
    return { ok: false, issues: [issue("state", "El estado debe ser un objeto")] };
  }
  if (value.version !== DEMO_STATE_VERSION) {
    issues.push(issue("version", `Se esperaba la versión ${DEMO_STATE_VERSION}`));
  }

  const categoriesRaw = requireArray(value, "categories", issues);
  const suppliersRaw = requireArray(value, "suppliers", issues);
  const productsRaw = requireArray(value, "products", issues);
  const movementsRaw = requireArray(value, "movements", issues);

  const categories: DemoCategory[] = [];
  categoriesRaw.forEach((item, index) => {
    const result = validateCategoryShape(item, `categories[${index}]`);
    if (result.ok) categories.push(result.value);
    else issues.push(...result.issues);
  });

  const suppliers: DemoSupplier[] = [];
  suppliersRaw.forEach((item, index) => {
    const result = validateSupplierShape(item, `suppliers[${index}]`);
    if (result.ok) suppliers.push(result.value);
    else issues.push(...result.issues);
  });

  const products: DemoProduct[] = [];
  productsRaw.forEach((item, index) => {
    const result = validateStoredProduct(item, `products[${index}]`, categories, suppliers);
    if (result.ok) products.push(result.value);
    else issues.push(...result.issues);
  });

  const movements: DemoMovement[] = [];
  movementsRaw.forEach((item, index) => {
    const result = validateStoredMovement(item, `movements[${index}]`, products);
    if (result.ok) movements.push(result.value);
    else issues.push(...result.issues);
  });

  assertUniqueIds(categories, "categories", issues);
  assertUniqueIds(suppliers, "suppliers", issues);
  assertUniqueIds(products, "products", issues);
  assertUniqueIds(movements, "movements", issues);

  const skuSet = new Set<string>();
  for (const product of products) {
    const sku = product.sku.toUpperCase();
    if (skuSet.has(sku)) issues.push(issue("products.sku", `SKU demo duplicado: ${sku}`));
    skuSet.add(sku);
  }

  const runningStock = new Map<string, number>();
  for (const movement of movements) {
    const nextStock = (runningStock.get(movement.productId) ?? 0) + movement.delta;
    if (nextStock < 0) {
      issues.push(issue("movements.delta", `Stock negativo en ${movement.id}`));
    }
    if (nextStock !== movement.balanceAfter) {
      issues.push(issue("movements.balanceAfter", `Saldo inconsistente en ${movement.id}`));
    }
    runningStock.set(movement.productId, nextStock);
  }

  for (const product of products) {
    if ((runningStock.get(product.id) ?? 0) !== product.stock) {
      issues.push(issue(`products.${product.id}.stock`, "El stock no coincide con el historial de movimientos"));
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    value: {
      version: DEMO_STATE_VERSION,
      products,
      categories,
      suppliers,
      movements,
    },
  };
}

/**
 * B4 — Comparación de nombres demo. Se ignoran mayúsculas y todos los espacios,
 * de modo que "Anillos", "anillos" y "An illos" se consideran el mismo nombre.
 */
export function normalizeDemoName(value: string): string {
  return value.trim().toLocaleLowerCase("es").replace(/\s+/g, "");
}

export interface CategoryDraftContext {
  categories: DemoCategory[];
  excludeId?: string;
}

export interface SupplierDraftContext {
  suppliers: DemoSupplier[];
  excludeId?: string;
}

/** Valida una categoría demo y su unicidad de nombre sin tocar su forma B0. */
export function validateCategoryDraft(
  input: unknown,
  context: CategoryDraftContext,
): ValidationResult<DemoCategory> {
  const shape = validateCategoryShape(input);
  if (!shape.ok) return shape;

  const nameKey = normalizeDemoName(shape.value.name);
  const duplicate = context.categories.some(
    (category) =>
      category.id !== context.excludeId && normalizeDemoName(category.name) === nameKey,
  );
  if (duplicate) {
    return {
      ok: false,
      issues: [
        issue(
          "name",
          "Ya existe una categoría demo con este nombre (se ignoran mayúsculas y espacios)",
        ),
      ],
    };
  }
  return shape;
}

/** Valida un proveedor ficticio y su unicidad de nombre sin tocar su forma B0. */
export function validateSupplierDraft(
  input: unknown,
  context: SupplierDraftContext,
): ValidationResult<DemoSupplier> {
  const shape = validateSupplierShape(input);
  if (!shape.ok) return shape;

  const nameKey = normalizeDemoName(shape.value.name);
  const duplicate = context.suppliers.some(
    (supplier) =>
      supplier.id !== context.excludeId && normalizeDemoName(supplier.name) === nameKey,
  );
  if (duplicate) {
    return {
      ok: false,
      issues: [
        issue(
          "name",
          "Ya existe un proveedor demo con este nombre (se ignoran mayúsculas y espacios)",
        ),
      ],
    };
  }
  return shape;
}
