/**
 * C1 — Pruebas puras de la base de datos ficticia de Taquilla de Cine.
 * Sin frameworks externos: se compila con tsconfig.b0-tests.json y se ejecuta
 * con el corredor nativo `node --test`.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";

import { createSeedState } from "../src/data/taquilla-cine-demo/seed";
import {
  DEMO_STATE_VERSION,
  DEMO_TODAY,
  type TaquillaDemoState,
} from "../src/data/taquilla-cine-demo/types";
import {
  MAX_INTEGER_VALUE,
  MAX_PRICE_CENTS,
  calculateAvailableAfterCapacityChange,
  calculatePurchaseTotalCents,
  countSoldTickets,
  formatCOP,
  pricePesosToCents,
} from "../src/lib/taquilla-cine-demo/pricing";

function ids<T extends { id: string }>(items: readonly T[]): string[] {
  return items.map((item) => item.id);
}

function funcion(state: TaquillaDemoState, id: string) {
  const found = state.funciones.find((item) => item.id === id);
  assert.ok(found, `función ${id} inexistente en la semilla`);
  return found;
}

function compra(state: TaquillaDemoState, id: string) {
  const found = state.compras.find((item) => item.id === id);
  assert.ok(found, `compra ${id} inexistente en la semilla`);
  return found;
}

test("1. la semilla tiene la estructura exacta del contrato C1", () => {
  const state = createSeedState();
  assert.deepEqual(Object.keys(state).sort(), ["compras", "funciones", "peliculas", "version"]);
  for (const item of state.peliculas) {
    assert.deepEqual(Object.keys(item).sort(), [
      "clasificacion",
      "duracionMin",
      "genero",
      "id",
      "titulo",
    ]);
  }
  for (const item of state.funciones) {
    assert.deepEqual(Object.keys(item).sort(), [
      "cuposDisponibles",
      "cuposTotales",
      "fecha",
      "hora",
      "id",
      "peliculaId",
      "precioCentavos",
      "sala",
    ]);
  }
  for (const item of state.compras) {
    assert.deepEqual(Object.keys(item).sort(), [
      "cantidadBoletos",
      "fechaCompra",
      "funcionId",
      "id",
      "nombreCliente",
      "totalCentavos",
    ]);
  }
});

test("2. el estado usa la versión 1 y la fecha fija de referencia", () => {
  const state = createSeedState();
  assert.equal(state.version, DEMO_STATE_VERSION);
  assert.equal(state.version, 1);
  assert.equal(DEMO_TODAY, "2026-11-25");
});

test("3. hay seis películas ficticias con géneros, duraciones y clasificaciones distintos", () => {
  const state = createSeedState();
  assert.equal(state.peliculas.length, 6);
  assert.equal(new Set(state.peliculas.map((item) => item.genero)).size, 6);
  assert.equal(new Set(state.peliculas.map((item) => item.duracionMin)).size, 6);
  assert.ok(new Set(state.peliculas.map((item) => item.clasificacion)).size >= 4);
  assert.equal(
    state.peliculas.every((item) => item.duracionMin >= 1 && item.duracionMin <= MAX_INTEGER_VALUE),
    true,
  );
});

test("4. hay nueve funciones con fechas, horarios y salas variados", () => {
  const state = createSeedState();
  assert.equal(state.funciones.length, 9);
  assert.equal(new Set(state.funciones.map((item) => item.hora)).size, 9);
  assert.equal(
    state.funciones.every((item) => item.fecha >= "2026-11-25" && item.fecha <= "2026-11-30"),
    true,
  );
  assert.deepEqual([...new Set(state.funciones.map((item) => item.sala))].sort(), ["1", "2", "3", "4"]);
  assert.equal(
    state.funciones.every((item) => Number.isSafeInteger(item.precioCentavos) && item.precioCentavos > 0 && item.precioCentavos <= MAX_PRICE_CENTS),
    true,
  );
});

test("5. hay ocho compras ficticias con cantidades variadas y nombres Demo", () => {
  const state = createSeedState();
  assert.equal(state.compras.length, 8);
  assert.deepEqual(
    state.compras.map((item) => item.nombreCliente),
    Array.from({ length: 8 }, (_, index) => `Cliente Demo ${String.fromCharCode(65 + index)}`),
  );
  assert.equal(new Set(state.compras.map((item) => item.cantidadBoletos)).size >= 4, true);
  assert.equal(
    state.compras.every((item) => item.cantidadBoletos >= 1 && item.cantidadBoletos <= MAX_INTEGER_VALUE),
    true,
  );
  assert.equal(state.compras.every((item) => item.fechaCompra.endsWith("-05:00")), true);
});

test("6. todos los IDs son únicos y usan los prefijos acordados", () => {
  const state = createSeedState();
  const allIds = [...ids(state.peliculas), ...ids(state.funciones), ...ids(state.compras)];
  assert.equal(new Set(allIds).size, allIds.length);
  assert.equal(state.peliculas.every((item) => item.id.startsWith("demo-pel-")), true);
  assert.equal(state.funciones.every((item) => item.id.startsWith("demo-fun-")), true);
  assert.equal(state.compras.every((item) => item.id.startsWith("demo-com-")), true);
});

test("7. todas las referencias entre entidades existen", () => {
  const state = createSeedState();
  const peliculaIds = new Set(ids(state.peliculas));
  const funcionIds = new Set(ids(state.funciones));
  assert.equal(state.funciones.every((item) => peliculaIds.has(item.peliculaId)), true);
  assert.equal(state.compras.every((item) => funcionIds.has(item.funcionId)), true);
});

test("8. existe exactamente una función agotada", () => {
  const state = createSeedState();
  const agotadas = state.funciones.filter((item) => item.cuposDisponibles === 0);
  assert.deepEqual(ids(agotadas), ["demo-fun-002"]);
  assert.equal(funcion(state, "demo-fun-002").cuposTotales, 3);
});

test("9. existen exactamente dos funciones con pocos cupos disponibles y no agotadas", () => {
  const state = createSeedState();
  const pocos = state.funciones.filter(
    (item) => item.cuposDisponibles > 0 && item.cuposDisponibles <= 5,
  );
  assert.deepEqual(ids(pocos), ["demo-fun-005", "demo-fun-006"]);
  assert.deepEqual(pocos.map((item) => item.cuposDisponibles), [2, 4]);
});

test("10. existe exactamente una función sin compras", () => {
  const state = createSeedState();
  const sinCompras = state.funciones.filter(
    (item) => countSoldTickets(state.compras, item.id) === 0,
  );
  assert.deepEqual(ids(sinCompras), ["demo-fun-007"]);
  const libre = funcion(state, "demo-fun-007");
  assert.equal(libre.cuposDisponibles, libre.cuposTotales);
});

test("11. existe exactamente una película sin funciones", () => {
  const state = createSeedState();
  const conFunciones = new Set(state.funciones.map((item) => item.peliculaId));
  const sinFunciones = state.peliculas.filter((item) => !conFunciones.has(item.id));
  assert.deepEqual(ids(sinFunciones), ["demo-pel-006"]);
});

test("12. los cupos disponibles coinciden con la capacidad menos los boletos vendidos", () => {
  const state = createSeedState();
  for (const item of state.funciones) {
    const vendidos = countSoldTickets(state.compras, item.id);
    assert.equal(item.cuposDisponibles, item.cuposTotales - vendidos, item.id);
    assert.ok(vendidos <= item.cuposTotales, item.id);
    assert.ok(item.cuposDisponibles >= 0 && item.cuposDisponibles <= item.cuposTotales, item.id);
    assert.equal(Number.isSafeInteger(item.cuposDisponibles), true, item.id);
  }
});

test("13. los totales históricos son coherentes y no cambian si se edita un precio", () => {
  const state = createSeedState();
  for (const item of state.compras) {
    const precio = funcion(state, item.funcionId).precioCentavos;
    assert.equal(item.totalCentavos, calculatePurchaseTotalCents(precio, item.cantidadBoletos), item.id);
    assert.ok(Number.isSafeInteger(item.totalCentavos) && item.totalCentavos > 0, item.id);
  }

  const original = compra(state, "demo-com-002").totalCentavos;
  const editada = createSeedState();
  funcion(editada, "demo-fun-002").precioCentavos = 999999;
  assert.equal(compra(editada, "demo-com-002").totalCentavos, original);
});

test("14. la conversión de pesos a centavos respeta decimales y límites", () => {
  assert.equal(pricePesosToCents(18000), 1800000);
  assert.equal(pricePesosToCents(22.5), 2250);
  assert.equal(pricePesosToCents(0.01), 1);
  assert.equal(pricePesosToCents(9999999999.99), MAX_PRICE_CENTS);

  for (const invalido of [0, -1, 12.345, 1e-7, Number.NaN, Number.POSITIVE_INFINITY, 10000000000]) {
    assert.throws(() => pricePesosToCents(invalido), String(invalido));
  }
});

test("15. el formato COP muestra centavos con separadores es-CO", () => {
  assert.match(formatCOP(0), /0,00/);
  assert.match(formatCOP(3600000), /36\.000,00/);
  assert.match(formatCOP(MAX_PRICE_CENTS), /9\.999\.999\.999,99/);

  for (const invalido of [-1, 1.5, Number.NaN, MAX_PRICE_CENTS + 1]) {
    assert.throws(() => formatCOP(invalido), String(invalido));
  }
});

test("16. el total de compra usa centavos y no supera el límite monetario", () => {
  assert.equal(calculatePurchaseTotalCents(1800000, 2), 3600000);
  assert.equal(calculatePurchaseTotalCents(MAX_PRICE_CENTS, 1), MAX_PRICE_CENTS);
  assert.equal(Number.isSafeInteger(calculatePurchaseTotalCents(1875050, 5)), true);

  assert.throws(() => calculatePurchaseTotalCents(MAX_PRICE_CENTS, 2));
  assert.throws(() => calculatePurchaseTotalCents(0, 1));
  assert.throws(() => calculatePurchaseTotalCents(MAX_PRICE_CENTS + 1, 1));
  assert.throws(() => calculatePurchaseTotalCents(1800000, 0));
  assert.throws(() => calculatePurchaseTotalCents(1800000, MAX_INTEGER_VALUE));
});

test("17. capacidades y conteos respetan el límite de INTEGER", () => {
  assert.equal(calculateAvailableAfterCapacityChange(MAX_INTEGER_VALUE, 0), MAX_INTEGER_VALUE);
  assert.equal(calculateAvailableAfterCapacityChange(1, 1), 0);

  for (const capacidadInvalida of [0, -1, 1.5, MAX_INTEGER_VALUE + 1]) {
    assert.throws(
      () => calculateAvailableAfterCapacityChange(capacidadInvalida, 0),
      String(capacidadInvalida),
    );
  }
  for (const vendidosInvalidos of [-1, 1.5, MAX_INTEGER_VALUE + 1]) {
    assert.throws(
      () => calculateAvailableAfterCapacityChange(10, vendidosInvalidos),
      String(vendidosInvalidos),
    );
  }
});

test("18. countSoldTickets filtra por función y rechaza cantidades inválidas", () => {
  const state = createSeedState();
  assert.equal(countSoldTickets(state.compras, "demo-fun-002"), 3);
  assert.equal(countSoldTickets(state.compras, "demo-fun-007"), 0);
  assert.equal(countSoldTickets(state.compras, "demo-fun-inexistente"), 0);

  const invalidas = state.compras.map((item) => ({ ...item }));
  const primera = invalidas[0];
  assert.ok(primera);
  primera.cantidadBoletos = 0;
  assert.throws(() => countSoldTickets(invalidas, "demo-fun-001"));
});

test("19. el recálculo de capacidad conserva los boletos ya vendidos", () => {
  const state = createSeedState();
  assert.equal(calculateAvailableAfterCapacityChange(10, 2), 8);
  assert.equal(calculateAvailableAfterCapacityChange(7, 5), 2);
  assert.equal(calculateAvailableAfterCapacityChange(3, 3), 0);
  assert.throws(() => calculateAvailableAfterCapacityChange(3, 4));

  const objetivo = funcion(state, "demo-fun-005");
  assert.equal(
    calculateAvailableAfterCapacityChange(
      objetivo.cuposTotales,
      countSoldTickets(state.compras, objetivo.id),
    ),
    objetivo.cuposDisponibles,
  );
});

test("20. dos llamadas a createSeedState devuelven estados iguales pero independientes", () => {
  const primero = createSeedState();
  const segundo = createSeedState();
  assert.deepEqual(primero, segundo);
  assert.notStrictEqual(primero, segundo);
  assert.notStrictEqual(primero.peliculas, segundo.peliculas);
  assert.notStrictEqual(primero.funciones[0], segundo.funciones[0]);
  assert.notStrictEqual(primero.compras[0], segundo.compras[0]);

  const pelicula = primero.peliculas[0];
  assert.ok(pelicula);
  pelicula.titulo = "Título modificado solo en la primera llamada";
  primero.compras.pop();

  assert.notDeepEqual(primero, segundo);
  assert.deepEqual(segundo, createSeedState());
});
