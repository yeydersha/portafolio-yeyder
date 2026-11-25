/**
 * C2 — Validadores puros de la demo de Taquilla de Cine.
 *
 * Contrato único: `{ ok: true, value }` o `{ ok: false, issues }`.
 * No hay reloj, azar, almacenamiento ni efectos. Los validadores devuelven
 * copias normalizadas (texto recortado) para que el estado nunca reciba
 * referencias a objetos externos ni espacios invisibles.
 */

import {
  DEMO_STATE_VERSION,
  type DemoCompra,
  type DemoFuncion,
  type DemoPelicula,
  type TaquillaDemoState,
} from "../../data/taquilla-cine-demo/types";
import {
  MAX_INTEGER_VALUE,
  MAX_PRICE_CENTS,
  countSoldTickets,
  pricePesosToCents,
} from "./pricing";

/** Prefijos obligatorios de los identificadores ficticios. */
export const DEMO_ID_PREFIXES = {
  pelicula: "demo-pel-",
  funcion: "demo-fun-",
  compra: "demo-com-",
} as const;

export interface ValidationIssue {
  field: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

export interface PeliculaInput {
  titulo: string;
  genero: string;
  duracionMin: number;
  clasificacion: string;
}

export interface FuncionInput {
  peliculaId: string;
  fecha: string;
  hora: string;
  sala: string;
  /** Precio en PESOS con hasta dos decimales. Se convierte a centavos aquí. */
  precioPesos: number;
  cuposTotales: number;
}

export interface CompraInput {
  funcionId: string;
  nombreCliente: string;
  cantidadBoletos: number;
}

export interface ReporteRange {
  fechaDesde: string;
  fechaHasta: string;
}

function success<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

function failure(issues: ValidationIssue[]): ValidationResult<never> {
  return { ok: false, issues };
}

function addIssue(issues: ValidationIssue[], field: string, message: string): void {
  issues.push({ field, message });
}

/** Devuelve el primer mensaje de un resultado inválido, para errores de UI. */
export function firstIssueMessage(result: { ok: false; issues: ValidationIssue[] }): string {
  return result.issues[0]?.message ?? "Datos inválidos";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameKeys(actual: readonly string[], expected: readonly string[]): boolean {
  if (actual.length !== expected.length) return false;
  const left = [...actual].sort();
  const right = [...expected].sort();
  return left.every((value, index) => value === right[index]);
}

function validateExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  field: string,
  issues: ValidationIssue[],
): void {
  if (!sameKeys(Object.keys(value), expected)) {
    addIssue(
      issues,
      field,
      `Las claves permitidas son ${[...expected].sort().join(", ")}`,
    );
  }
}

function hasForbiddenKeys(value: unknown, forbidden: readonly string[]): boolean {
  return (
    isPlainObject(value) &&
    forbidden.some((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
}

function validateTrimmedText(
  value: unknown,
  field: string,
  maxLength: number,
  issues: ValidationIssue[],
): string | undefined {
  if (typeof value !== "string") {
    addIssue(issues, field, "El valor debe ser texto");
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    addIssue(issues, field, "El campo es obligatorio");
    return undefined;
  }
  if (trimmed.length > maxLength) {
    addIssue(issues, field, `El campo no puede superar ${maxLength} caracteres`);
    return undefined;
  }
  return trimmed;
}

function validateInteger(
  value: unknown,
  field: string,
  min: number,
  max: number,
  issues: ValidationIssue[],
): number | undefined {
  if (!Number.isSafeInteger(value)) {
    addIssue(issues, field, "El valor debe ser un entero seguro");
    return undefined;
  }
  const numero = value as number;
  if (numero < min || numero > max) {
    addIssue(issues, field, `El valor debe estar entre ${min} y ${max}`);
    return undefined;
  }
  return numero;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** Valida `YYYY-MM-DD` con días reales, sin Date ni zona horaria del equipo. */
export function validateDateText(
  value: unknown,
  field = "fecha",
  issues: ValidationIssue[] = [],
): string | undefined {
  if (typeof value !== "string") {
    addIssue(issues, field, "La fecha debe ser texto YYYY-MM-DD");
    return undefined;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    addIssue(issues, field, "La fecha debe tener el formato YYYY-MM-DD");
    return undefined;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    addIssue(issues, field, "La fecha no existe en el calendario");
    return undefined;
  }
  return value;
}

/** Valida `HH:mm` en formato de 24 horas. */
export function validateTimeText(
  value: unknown,
  field = "hora",
  issues: ValidationIssue[] = [],
): string | undefined {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    addIssue(issues, field, "La hora debe tener el formato HH:mm");
    return undefined;
  }
  return value;
}

/** Valida el timestamp ficticio con offset fijo de Bogotá (`-05:00`). */
export function validateFechaCompra(
  value: unknown,
  field = "fechaCompra",
  issues: ValidationIssue[] = [],
): string | undefined {
  if (typeof value !== "string") {
    addIssue(issues, field, "La fecha de compra debe ser texto ISO 8601");
    return undefined;
  }
  const trimmed = value.trim();
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):(\d{2})(?:\.\d{1,6})?-05:00$/.exec(trimmed);
  if (!match) {
    addIssue(issues, field, "La fecha de compra debe usar el offset fijo -05:00");
    return undefined;
  }
  validateDateText(match[1], field, issues);
  validateTimeText(match[2], `${field}.hora`, issues);
  if (Number(match[3]) > 59) {
    addIssue(issues, field, "Los segundos de la compra no son válidos");
    return undefined;
  }
  return trimmed;
}

/** Valida un ID ficticio con su prefijo y sin espacios. */
export function validateDemoId(
  value: unknown,
  prefix: string,
  field = "id",
): ValidationResult<string> {
  const issues: ValidationIssue[] = [];
  if (
    typeof value !== "string" ||
    !value.startsWith(prefix) ||
    value.length <= prefix.length ||
    /\s/.test(value.slice(prefix.length))
  ) {
    addIssue(issues, field, `El ID debe comenzar con ${prefix} y no contener espacios`);
    return failure(issues);
  }
  return success(value);
}

function validatePriceCents(
  value: unknown,
  field: string,
  issues: ValidationIssue[],
): number | undefined {
  return validateInteger(value, field, 1, MAX_PRICE_CENTS, issues);
}

function validatePricePesos(
  value: unknown,
  field: string,
  issues: ValidationIssue[],
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addIssue(issues, field, "El precio debe ser un número finito");
    return undefined;
  }
  try {
    return pricePesosToCents(value);
  } catch {
    addIssue(
      issues,
      field,
      "El precio debe ser mayor a cero, tener máximo dos decimales y no superar 9999999999.99",
    );
    return undefined;
  }
}

/** Valida los cuatro campos editables de una película. */
export function validatePeliculaInput(input: unknown): ValidationResult<PeliculaInput> {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(input)) {
    addIssue(issues, "pelicula", "Los datos de la película deben ser un objeto");
    return failure(issues);
  }
  validateExactKeys(
    input,
    ["titulo", "genero", "duracionMin", "clasificacion"],
    "pelicula",
    issues,
  );
  if (
    hasForbiddenKeys(input, ["id", "cuposDisponibles", "totalCentavos", "funciones"])
  ) {
    addIssue(issues, "pelicula", "La película contiene campos calculados o internos");
  }

  const titulo = validateTrimmedText(input.titulo, "titulo", 150, issues);
  const genero = validateTrimmedText(input.genero, "genero", 80, issues);
  const clasificacion = validateTrimmedText(
    input.clasificacion,
    "clasificacion",
    20,
    issues,
  );
  const duracionMin = validateInteger(
    input.duracionMin,
    "duracionMin",
    1,
    MAX_INTEGER_VALUE,
    issues,
  );

  if (issues.length > 0 || !titulo || !genero || !clasificacion || duracionMin === undefined) {
    return failure(issues);
  }
  return success({ titulo, genero, duracionMin, clasificacion });
}

/**
 * Valida una función. En edición se comprueban las reglas dependientes del
 * historial: película con compras y capacidad no inferior a boletos vendidos.
 */
export function validateFuncionInput(
  input: unknown,
  state: TaquillaDemoState,
  funcionId?: string,
): ValidationResult<FuncionInput> {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(input)) {
    addIssue(issues, "funcion", "Los datos de la función deben ser un objeto");
    return failure(issues);
  }
  validateExactKeys(
    input,
    ["peliculaId", "fecha", "hora", "sala", "precioPesos", "cuposTotales"],
    "funcion",
    issues,
  );
  if (
    hasForbiddenKeys(input, [
      "id",
      "cuposDisponibles",
      "precioCentavos",
      "totalCentavos",
    ])
  ) {
    addIssue(issues, "funcion", "La función contiene campos calculados o internos");
  }

  const peliculaId = validateTrimmedText(input.peliculaId, "peliculaId", 80, issues);
  const fecha = validateDateText(input.fecha, "fecha", issues);
  const hora = validateTimeText(input.hora, "hora", issues);
  const sala = validateTrimmedText(input.sala, "sala", 50, issues);
  const precioCentavos = validatePricePesos(input.precioPesos, "precioPesos", issues);
  const cuposTotales = validateInteger(
    input.cuposTotales,
    "cuposTotales",
    1,
    MAX_INTEGER_VALUE,
    issues,
  );

  let existente: DemoFuncion | undefined;
  if (funcionId !== undefined) {
    existente = state.funciones.find((item) => item.id === funcionId);
    if (!existente) {
      addIssue(issues, "id", "No existe la función indicada");
    }
  }

  if (peliculaId && !state.peliculas.some((item) => item.id === peliculaId)) {
    addIssue(issues, "peliculaId", "La película indicada no existe");
  }

  if (existente && peliculaId && existente.peliculaId !== peliculaId) {
    try {
      if (countSoldTickets(state.compras, existente.id) > 0) {
        addIssue(
          issues,
          "peliculaId",
          "No se puede cambiar la película de una función que tiene compras registradas",
        );
      }
    } catch {
      addIssue(issues, "compras", "El historial de compras no es válido");
    }
  }

  if (existente && cuposTotales !== undefined) {
    try {
      const vendidos = countSoldTickets(state.compras, existente.id);
      if (cuposTotales < vendidos) {
        addIssue(
          issues,
          "cuposTotales",
          `La nueva capacidad total (${cuposTotales}) no puede ser inferior a los cupos ya vendidos (${vendidos})`,
        );
      }
    } catch {
      addIssue(issues, "compras", "El historial de compras no es válido");
    }
  }

  if (
    issues.length > 0 ||
    !peliculaId ||
    !fecha ||
    !hora ||
    !sala ||
    precioCentavos === undefined ||
    cuposTotales === undefined
  ) {
    return failure(issues);
  }
  return success({
    peliculaId,
    fecha,
    hora,
    sala,
    precioPesos: (input.precioPesos as number),
    cuposTotales,
  });
}

/** Valida una compra simulada y comprueba cupos contra el historial. */
export function validateCompraInput(
  input: unknown,
  state: TaquillaDemoState,
): ValidationResult<CompraInput> {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(input)) {
    addIssue(issues, "compra", "Los datos de la compra deben ser un objeto");
    return failure(issues);
  }
  validateExactKeys(
    input,
    ["funcionId", "nombreCliente", "cantidadBoletos"],
    "compra",
    issues,
  );
  if (
    hasForbiddenKeys(input, [
      "id",
      "totalCentavos",
      "cuposDisponibles",
      "fechaCompra",
    ])
  ) {
    addIssue(issues, "compra", "La compra contiene campos calculados o internos");
  }

  const funcionId = validateTrimmedText(input.funcionId, "funcionId", 80, issues);
  const nombreCliente = validateTrimmedText(
    input.nombreCliente,
    "nombreCliente",
    150,
    issues,
  );
  const cantidadBoletos = validateInteger(
    input.cantidadBoletos,
    "cantidadBoletos",
    1,
    MAX_INTEGER_VALUE,
    issues,
  );
  const funcion = funcionId
    ? state.funciones.find((item) => item.id === funcionId)
    : undefined;

  if (funcionId && !funcion) {
    addIssue(issues, "funcionId", "La función indicada no existe");
  }

  if (funcion && cantidadBoletos !== undefined) {
    try {
      const vendidos = countSoldTickets(state.compras, funcion.id);
      const disponibles = funcion.cuposTotales - vendidos;
      if (disponibles === 0) {
        addIssue(issues, "funcionId", "La función seleccionada está agotada");
      } else if (cantidadBoletos > disponibles) {
        addIssue(
          issues,
          "cantidadBoletos",
          `Se solicitaron ${cantidadBoletos} boletos, pero solo hay ${disponibles} disponibles`,
        );
      }
      if (cantidadBoletos > MAX_PRICE_CENTS / funcion.precioCentavos) {
        addIssue(
          issues,
          "cantidadBoletos",
          "El total de la compra supera el límite de 9999999999.99 COP",
        );
      }
    } catch {
      addIssue(issues, "compras", "El historial de compras no es válido");
    }
  }

  if (
    issues.length > 0 ||
    !funcionId ||
    !nombreCliente ||
    cantidadBoletos === undefined
  ) {
    return failure(issues);
  }
  return success({ funcionId, nombreCliente, cantidadBoletos });
}

/** Valida el rango inclusivo del reporte, sin fechas futuras inventadas. */
export function validateReporteRange(
  fechaDesde: unknown,
  fechaHasta: unknown,
): ValidationResult<ReporteRange> {
  const issues: ValidationIssue[] = [];
  const desde = validateDateText(fechaDesde, "fechaDesde", issues);
  const hasta = validateDateText(fechaHasta, "fechaHasta", issues);
  if (desde && hasta && desde > hasta) {
    addIssue(
      issues,
      "fechaHasta",
      "La fecha inicial no puede ser posterior a la fecha final",
    );
  }
  if (issues.length > 0 || !desde || !hasta) return failure(issues);
  return success({ fechaDesde: desde, fechaHasta: hasta });
}

function validatePeliculasBasic(
  value: unknown,
  issues: ValidationIssue[],
): DemoPelicula[] {
  const resultado: DemoPelicula[] = [];
  if (!Array.isArray(value)) {
    addIssue(issues, "peliculas", "Debe ser un arreglo");
    return resultado;
  }
  value.forEach((item, index) => {
    const field = `peliculas[${index}]`;
    if (!isPlainObject(item)) {
      addIssue(issues, field, "Debe ser un objeto");
      return;
    }
    const locales: ValidationIssue[] = [];
    validateExactKeys(
      item,
      ["id", "titulo", "genero", "duracionMin", "clasificacion"],
      field,
      locales,
    );
    const idResult = validateDemoId(item.id, DEMO_ID_PREFIXES.pelicula, `${field}.id`);
    if (!idResult.ok) locales.push(...idResult.issues);
    const titulo = validateTrimmedText(item.titulo, `${field}.titulo`, 150, locales);
    const genero = validateTrimmedText(item.genero, `${field}.genero`, 80, locales);
    const clasificacion = validateTrimmedText(
      item.clasificacion,
      `${field}.clasificacion`,
      20,
      locales,
    );
    const duracionMin = validateInteger(
      item.duracionMin,
      `${field}.duracionMin`,
      1,
      MAX_INTEGER_VALUE,
      locales,
    );
    issues.push(...locales);
    if (
      locales.length === 0 &&
      idResult.ok &&
      titulo &&
      genero &&
      clasificacion &&
      duracionMin !== undefined
    ) {
      resultado.push({
        id: idResult.value,
        titulo,
        genero,
        duracionMin,
        clasificacion,
      });
    }
  });
  return resultado;
}

function validateFuncionesBasic(
  value: unknown,
  issues: ValidationIssue[],
): DemoFuncion[] {
  const resultado: DemoFuncion[] = [];
  if (!Array.isArray(value)) {
    addIssue(issues, "funciones", "Debe ser un arreglo");
    return resultado;
  }
  value.forEach((item, index) => {
    const field = `funciones[${index}]`;
    if (!isPlainObject(item)) {
      addIssue(issues, field, "Debe ser un objeto");
      return;
    }
    const locales: ValidationIssue[] = [];
    validateExactKeys(
      item,
      [
        "id",
        "peliculaId",
        "fecha",
        "hora",
        "sala",
        "precioCentavos",
        "cuposTotales",
        "cuposDisponibles",
      ],
      field,
      locales,
    );
    const idResult = validateDemoId(item.id, DEMO_ID_PREFIXES.funcion, `${field}.id`);
    if (!idResult.ok) locales.push(...idResult.issues);
    const peliculaResult = validateDemoId(
      item.peliculaId,
      DEMO_ID_PREFIXES.pelicula,
      `${field}.peliculaId`,
    );
    if (!peliculaResult.ok) locales.push(...peliculaResult.issues);
    const fecha = validateDateText(item.fecha, `${field}.fecha`, locales);
    const hora = validateTimeText(item.hora, `${field}.hora`, locales);
    const sala = validateTrimmedText(item.sala, `${field}.sala`, 50, locales);
    const precioCentavos = validatePriceCents(
      item.precioCentavos,
      `${field}.precioCentavos`,
      locales,
    );
    const cuposTotales = validateInteger(
      item.cuposTotales,
      `${field}.cuposTotales`,
      1,
      MAX_INTEGER_VALUE,
      locales,
    );
    const cuposDisponibles = validateInteger(
      item.cuposDisponibles,
      `${field}.cuposDisponibles`,
      0,
      MAX_INTEGER_VALUE,
      locales,
    );
    if (
      cuposTotales !== undefined &&
      cuposDisponibles !== undefined &&
      cuposDisponibles > cuposTotales
    ) {
      addIssue(
        locales,
        `${field}.cuposDisponibles`,
        "Los cupos disponibles no pueden superar los cupos totales",
      );
    }
    issues.push(...locales);
    if (
      locales.length === 0 &&
      idResult.ok &&
      peliculaResult.ok &&
      fecha &&
      hora &&
      sala &&
      precioCentavos !== undefined &&
      cuposTotales !== undefined &&
      cuposDisponibles !== undefined
    ) {
      resultado.push({
        id: idResult.value,
        peliculaId: peliculaResult.value,
        fecha,
        hora,
        sala,
        precioCentavos,
        cuposTotales,
        cuposDisponibles,
      });
    }
  });
  return resultado;
}

function validateComprasBasic(
  value: unknown,
  issues: ValidationIssue[],
): DemoCompra[] {
  const resultado: DemoCompra[] = [];
  if (!Array.isArray(value)) {
    addIssue(issues, "compras", "Debe ser un arreglo");
    return resultado;
  }
  value.forEach((item, index) => {
    const field = `compras[${index}]`;
    if (!isPlainObject(item)) {
      addIssue(issues, field, "Debe ser un objeto");
      return;
    }
    const locales: ValidationIssue[] = [];
    validateExactKeys(
      item,
      [
        "id",
        "funcionId",
        "nombreCliente",
        "cantidadBoletos",
        "totalCentavos",
        "fechaCompra",
      ],
      field,
      locales,
    );
    const idResult = validateDemoId(item.id, DEMO_ID_PREFIXES.compra, `${field}.id`);
    if (!idResult.ok) locales.push(...idResult.issues);
    const funcionResult = validateDemoId(
      item.funcionId,
      DEMO_ID_PREFIXES.funcion,
      `${field}.funcionId`,
    );
    if (!funcionResult.ok) locales.push(...funcionResult.issues);
    const nombreCliente = validateTrimmedText(
      item.nombreCliente,
      `${field}.nombreCliente`,
      150,
      locales,
    );
    const cantidadBoletos = validateInteger(
      item.cantidadBoletos,
      `${field}.cantidadBoletos`,
      1,
      MAX_INTEGER_VALUE,
      locales,
    );
    const totalCentavos = validatePriceCents(
      item.totalCentavos,
      `${field}.totalCentavos`,
      locales,
    );
    const fechaCompra = validateFechaCompra(
      item.fechaCompra,
      `${field}.fechaCompra`,
      locales,
    );
    issues.push(...locales);
    if (
      locales.length === 0 &&
      idResult.ok &&
      funcionResult.ok &&
      nombreCliente &&
      cantidadBoletos !== undefined &&
      totalCentavos !== undefined &&
      fechaCompra
    ) {
      resultado.push({
        id: idResult.value,
        funcionId: funcionResult.value,
        nombreCliente,
        cantidadBoletos,
        totalCentavos,
        fechaCompra,
      });
    }
  });
  return resultado;
}

/**
 * Validación completa de un estado persistido o de un estado a punto de ser
 * confirmado por el reducer. Devuelve una copia normalizada.
 *
 * El total histórico NO se recalcula con el precio actual: solo se comprueban
 * sus límites y que sea divisible entre la cantidad, única coherencia
 * verificable sin conocer el precio de esa venta en su momento.
 */
export function validateDemoState(value: unknown): ValidationResult<TaquillaDemoState> {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(value)) {
    addIssue(issues, "estado", "El estado debe ser un objeto");
    return failure(issues);
  }
  validateExactKeys(value, ["version", "peliculas", "funciones", "compras"], "estado", issues);
  if (value.version !== DEMO_STATE_VERSION) {
    addIssue(issues, "version", `La versión del estado debe ser ${DEMO_STATE_VERSION}`);
  }

  const peliculas = validatePeliculasBasic(value.peliculas, issues);
  const funciones = validateFuncionesBasic(value.funciones, issues);
  const compras = validateComprasBasic(value.compras, issues);
  if (issues.length > 0) return failure(issues);

  const todosLosIds = [
    ...peliculas.map((item) => item.id),
    ...funciones.map((item) => item.id),
    ...compras.map((item) => item.id),
  ];
  if (new Set(todosLosIds).size !== todosLosIds.length) {
    addIssue(issues, "ids", "Los identificadores del estado deben ser únicos");
  }

  const peliculaIds = new Set(peliculas.map((item) => item.id));
  const funcionIds = new Set(funciones.map((item) => item.id));
  for (const funcion of funciones) {
    if (!peliculaIds.has(funcion.peliculaId)) {
      addIssue(
        issues,
        `funciones.${funcion.id}`,
        "La función referencia una película inexistente",
      );
    }
  }
  for (const compra of compras) {
    if (!funcionIds.has(compra.funcionId)) {
      addIssue(
        issues,
        `compras.${compra.id}`,
        "La compra referencia una función inexistente",
      );
    }
  }

  for (const funcion of funciones) {
    const vendidos = countSoldTickets(compras, funcion.id);
    const esperados = funcion.cuposTotales - vendidos;
    if (funcion.cuposDisponibles !== esperados) {
      addIssue(
        issues,
        `funciones.${funcion.id}.cuposDisponibles`,
        `Los cupos disponibles deben ser ${esperados} según el historial de compras`,
      );
    }
  }

  for (const compra of compras) {
    if (compra.totalCentavos % compra.cantidadBoletos !== 0) {
      addIssue(
        issues,
        `compras.${compra.id}.totalCentavos`,
        "El total histórico no es consistente con la cantidad de boletos",
      );
      continue;
    }
    const precioUnitario = compra.totalCentavos / compra.cantidadBoletos;
    if (!Number.isSafeInteger(precioUnitario) || precioUnitario < 1 || precioUnitario > MAX_PRICE_CENTS) {
      addIssue(
        issues,
        `compras.${compra.id}.totalCentavos`,
        "El precio unitario histórico está fuera de los límites permitidos",
      );
    }
  }

  if (issues.length > 0) return failure(issues);
  return success({
    version: DEMO_STATE_VERSION,
    peliculas,
    funciones,
    compras,
  });
}
