/**
 * B0 — Única fuente de reglas financieras de la demo Fiore.
 *
 * Las fórmulas reproducen las reglas observadas en el proyecto original
 * (COP enteros, margen sobre costo para sugerir precio y margen sobre venta
 * para reportar rentabilidad), pero están reescritas aquí sin importar código
 * del backend ni consultar datos reales.
 */

import type { DemoPricingView } from "../../data/fiore-demo/types";

export interface DemoPricingInput {
  costPrice: number;
  /** Porcentaje de incremento sobre el costo (0..500). */
  marginPct: number;
  stock: number;
  manualPrice?: boolean;
  manualSellingPrice?: number;
}

function assertIntegerPeso(value: number, field: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${field} debe ser un valor entero en COP`);
  }
}

/** Redondea al peso colombiano más cercano. */
export function roundToPeso(value: number): number {
  return Math.round(value);
}

/**
 * precio sugerido = costo * (1 + margen sobre costo / 100)
 */
export function calculateSuggestedPrice(costPrice: number, marginPct: number): number {
  assertIntegerPeso(costPrice, "El costo");
  if (costPrice < 0) throw new Error("El costo no puede ser negativo");
  if (!Number.isFinite(marginPct)) throw new Error("El margen debe ser un número finito");
  if (marginPct < 0 || marginPct > 500) {
    throw new Error("El margen sobre costo debe estar entre 0 y 500");
  }

  return roundToPeso(costPrice * (1 + marginPct / 100));
}

/** ganancia unitaria = precio de venta - costo */
export function calculateGrossProfitUnit(sellingPrice: number, costPrice: number): number {
  assertIntegerPeso(sellingPrice, "El precio de venta");
  assertIntegerPeso(costPrice, "El costo");
  if (sellingPrice < 0) throw new Error("El precio de venta no puede ser negativo");
  if (costPrice < 0) throw new Error("El costo no puede ser negativo");

  return roundToPeso(sellingPrice - costPrice);
}

/** ganancia total potencial = ganancia unitaria * stock */
export function calculateGrossProfitTotal(grossProfitUnit: number, stock: number): number {
  assertIntegerPeso(grossProfitUnit, "La ganancia unitaria");
  assertIntegerPeso(stock, "El stock");
  if (stock < 0) throw new Error("El stock no puede ser negativo");

  return roundToPeso(grossProfitUnit * stock);
}

/**
 * Margen real sobre el precio de venta, distinto del incremento sobre costo.
 * Se reporta con dos decimales; si no hay venta, el margen es 0.
 */
export function calculateMarginPctOnSale(grossProfitUnit: number, sellingPrice: number): number {
  if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) return 0;
  return roundToPeso((grossProfitUnit / sellingPrice) * 100 * 100) / 100;
}

/** Calcula todo el desglose financiero de un producto demo. */
export function calculateProductPricing(input: DemoPricingInput): DemoPricingView {
  const suggestedPrice = calculateSuggestedPrice(input.costPrice, input.marginPct);
  assertIntegerPeso(input.stock, "El stock");
  if (input.stock < 0) throw new Error("El stock no puede ser negativo");

  const useManualPrice = input.manualPrice === true;
  let sellingPrice = suggestedPrice;

  if (useManualPrice) {
    if (input.manualSellingPrice === undefined) {
      throw new Error("El precio manual es requerido cuando está activado");
    }
    assertIntegerPeso(input.manualSellingPrice, "El precio manual");
    if (input.manualSellingPrice < 0) {
      throw new Error("El precio manual no puede ser negativo");
    }
    sellingPrice = roundToPeso(input.manualSellingPrice);
  }

  const grossProfitUnit = calculateGrossProfitUnit(sellingPrice, input.costPrice);
  const grossProfitTotal = calculateGrossProfitTotal(grossProfitUnit, input.stock);

  return {
    suggestedPrice,
    sellingPrice,
    grossProfitUnit,
    grossProfitTotal,
    marginPctOnSale: calculateMarginPctOnSale(grossProfitUnit, sellingPrice),
    markupPctOnCost: input.marginPct,
    manualPrice: useManualPrice,
  };
}

/** Total de una venta ficticia; usa el precio snapshot del momento. */
export function calculateSaleTotal(unitPrice: number, quantity: number): number {
  assertIntegerPeso(unitPrice, "El precio unitario");
  assertIntegerPeso(quantity, "La cantidad");
  if (unitPrice < 0) throw new Error("El precio unitario no puede ser negativo");
  if (quantity <= 0) throw new Error("La cantidad debe ser mayor a cero");

  return roundToPeso(unitPrice * quantity);
}

/** Formato COP sin decimales, igual al criterio observado en el original. */
export function formatCOP(value: number): string {
  if (!Number.isFinite(value)) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
