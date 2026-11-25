/**
 * C1 — Cálculos puros de la demo de Taquilla de Cine.
 *
 * Reglas tomadas del plan C0: importes en centavos COP enteros, precios con
 * máximo dos decimales, límite monetario `9999999999.99`, cantidades y
 * capacidades enteras positivas y límite de INTEGER `2147483647`.
 *
 * Convención de unidades:
 * - `pricePesosToCents` ACEPTA PESOS (número decimal con hasta 2 decimales).
 * - `calculatePurchaseTotalCents` ACEPTA CENTAVOS por boleto y una cantidad.
 * - `formatCOP` ACEPTA CENTAVOS y solo los presenta con dos decimales.
 * - `countSoldTickets` y `calculateAvailableAfterCapacityChange` trabajan con
 *   conteos enteros de boletos, sin Importes monetarios.
 */

import type { DemoCompra } from "../../data/taquilla-cine-demo/types";

/** Límite original de `INTEGER` para duraciones, cupos y cantidades. */
export const MAX_INTEGER_VALUE = 2147483647;

/** `9999999999.99` COP expresado como centavos enteros. */
export const MAX_PRICE_CENTS = 999999999999;

function assertPositiveInteger(value: number, field: string, max = MAX_INTEGER_VALUE): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${field} debe ser un entero seguro`);
  }
  if (value <= 0) {
    throw new Error(`${field} debe ser mayor a cero`);
  }
  if (value > max) {
    throw new Error(`${field} no puede superar ${max}`);
  }
}

function assertNonNegativeInteger(value: number, field: string, max = MAX_INTEGER_VALUE): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${field} debe ser un entero seguro`);
  }
  if (value < 0) {
    throw new Error(`${field} no puede ser negativo`);
  }
  if (value > max) {
    throw new Error(`${field} no puede superar ${max}`);
  }
}

/**
 * Convierte un precio en PESOS a centavos COP enteros.
 * Acepta como máximo dos decimales y nunca usa `Math.round` sobre el valor
 * decimal: particiona la representación textual para evitar deriva float.
 */
export function pricePesosToCents(precioPesos: number): number {
  if (typeof precioPesos !== "number" || !Number.isFinite(precioPesos) || precioPesos <= 0) {
    throw new Error("El precio en pesos debe ser un número finito mayor a cero");
  }

  const texto = String(precioPesos);
  if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) {
    throw new Error("El precio en pesos debe tener máximo dos decimales");
  }

  const [parteEntera, parteDecimal = ""] = texto.split(".");
  const pesos = Number(parteEntera);
  const decimal = Number((parteDecimal + "00").slice(0, 2));
  const centavos = pesos * 100 + decimal;

  if (!Number.isSafeInteger(centavos) || centavos > MAX_PRICE_CENTS) {
    throw new Error("El precio supera el límite de 9999999999.99 COP");
  }
  return centavos;
}

/**
 * Total de una compra a partir de un PRECIO EN CENTAVOS y una cantidad.
 * La multiplicación se hace con enteros y se comprueba antes de ejecutarla.
 */
export function calculatePurchaseTotalCents(
  precioCentavos: number,
  cantidadBoletos: number,
): number {
  assertPositiveInteger(precioCentavos, "El precio en centavos", MAX_PRICE_CENTS);
  assertPositiveInteger(cantidadBoletos, "La cantidad de boletos");

  if (precioCentavos > MAX_PRICE_CENTS / cantidadBoletos) {
    throw new Error("El total de la compra supera el límite de 9999999999.99 COP");
  }

  const total = precioCentavos * cantidadBoletos;
  if (!Number.isSafeInteger(total) || total > MAX_PRICE_CENTS) {
    throw new Error("El total de la compra no es un importe seguro en centavos COP");
  }
  return total;
}

/** Presenta un Importe en CENTAVOS COP con dos decimales y separadores `es-CO`. */
export function formatCOP(centavos: number): string {
  assertNonNegativeInteger(centavos, "El importe en centavos", MAX_PRICE_CENTS);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);
}

/** Suma los boletos vendidos de una función; ids ausentes devuelven 0. */
export function countSoldTickets(compras: readonly DemoCompra[], funcionId: string): number {
  let vendidos = 0;
  for (const compra of compras) {
    if (compra.funcionId !== funcionId) continue;
    assertPositiveInteger(compra.cantidadBoletos, "La cantidad de boletos");
    vendidos += compra.cantidadBoletos;
    if (vendidos > MAX_INTEGER_VALUE) {
      throw new Error("El total de boletos vendidos supera el límite de INTEGER");
    }
  }
  return vendidos;
}

/**
 * Cupos disponibles al cambiar la capacidad de una función.
 * Conserva los boletos ya vendidos: `nuevosTotales - vendidos`.
 */
export function calculateAvailableAfterCapacityChange(
  nuevosCuposTotales: number,
  boletosVendidos: number,
): number {
  assertPositiveInteger(nuevosCuposTotales, "La nueva capacidad total");
  assertNonNegativeInteger(boletosVendidos, "Los cupos ya vendidos");
  if (boletosVendidos > nuevosCuposTotales) {
    throw new Error("La nueva capacidad total no puede ser inferior a los cupos ya vendidos");
  }
  return nuevosCuposTotales - boletosVendidos;
}
