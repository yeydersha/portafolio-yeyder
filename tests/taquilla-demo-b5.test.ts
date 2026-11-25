/**
 * C5 — Contratos de la vista interactiva de Funciones.
 *
 * El arnés del portafolio no incluye React Testing Library: aquí se comprueban
 * los contratos puros que alimentan la vista, la integración de su archivo en
 * `TaquillaDemo` y los límites de aislamiento. Los clics, el foco y el diseño
 * responsive se verifican en navegador.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { createSeedState } from "../src/data/taquilla-cine-demo/seed";
import { buildFuncionesView, filterFunciones } from "../src/lib/taquilla-cine-demo/funciones-view";
import { formatCOP } from "../src/lib/taquilla-cine-demo/pricing";
import { applyDemoAction } from "../src/lib/taquilla-cine-demo/reducer";
import { selectBoletosVendidos, selectCuposDisponibles } from "../src/lib/taquilla-cine-demo/selectors";
import {
  TAQUILLA_STORAGE_KEY,
  clearTaquillaState,
  loadTaquillaState,
  resetTaquillaHydrationGate,
  saveTaquillaState,
  type TaquillaStorageLike,
} from "../src/lib/taquilla-cine-demo/storage";
import {
  firstIssueMessage,
  validateFuncionInput,
  type FuncionInput,
} from "../src/lib/taquilla-cine-demo/validation";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function input(overrides: Partial<FuncionInput> = {}): Record<string, unknown> {
  return {
    peliculaId: "demo-pel-001",
    fecha: "2026-12-15",
    hora: "20:00",
    sala: "Sala 5",
    precioPesos: 18000,
    cuposTotales: 10,
    ...overrides,
  };
}

function valido(overrides: Partial<FuncionInput> = {}): FuncionInput {
  const resultado = validateFuncionInput(input(overrides), createSeedState());
  assert.ok(resultado.ok);
  return resultado.value;
}

function mensaje(overrides: Partial<FuncionInput>): string {
  const resultado = validateFuncionInput(input(overrides), createSeedState());
  assert.ok(!resultado.ok);
  return firstIssueMessage(resultado);
}

function almacenFalso(): TaquillaStorageLike & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => void datos.set(clave, valor),
    removeItem: (clave) => void datos.delete(clave),
  };
}

test("C5 · listado inicial de nueve funciones e integración de la vista", () => {
  const estado = createSeedState();
  const vista = buildFuncionesView(estado);
  assert.equal(vista.total, 9);
  assert.equal(vista.esVacio, false);
  assert.deepEqual(
    vista.items.map((funcion) => funcion.id),
    [
      "demo-fun-001",
      "demo-fun-002",
      "demo-fun-003",
      "demo-fun-004",
      "demo-fun-005",
      "demo-fun-006",
      "demo-fun-007",
      "demo-fun-009",
      "demo-fun-008",
    ],
  );
  const demo = source("src/components/taquilla-cine-demo/TaquillaDemo.tsx");
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaFuncionesView.tsx");
  assert.match(demo, /activeView === "funciones"/);
  assert.match(demo, /<TaquillaFuncionesView/);
  assert.match(vistaSource, /buildFuncionesView\(state, \{ query \}\)/);
});

test("C5 · orden por fecha, hora e ID con búsqueda local", () => {
  const estado = createSeedState();
  const vista = buildFuncionesView(estado);
  const fechasHoras = vista.items.map((funcion) => `${funcion.fecha} ${funcion.hora}`);
  assert.deepEqual(fechasHoras, [...fechasHoras].sort());
  assert.equal(vista.items[0]?.id, "demo-fun-001");
  assert.equal(vista.items[8]?.id, "demo-fun-008");
  assert.deepEqual(
    filterFunciones(buildFuncionesView(estado).items, { query: "  barranquilla  " }).map(
      (funcion) => funcion.id,
    ),
    ["demo-fun-003", "demo-fun-008"],
  );
  assert.deepEqual(
    filterFunciones(buildFuncionesView(estado).items, { peliculaId: "demo-pel-001" }).map(
      (funcion) => funcion.id,
    ),
    ["demo-fun-001", "demo-fun-006"],
  );
  const invertida = buildFuncionesView(estado, { direction: "desc" });
  assert.equal(invertida.items[0]?.id, "demo-fun-008");
});

test("C5 · cada función muestra la película existente y su precio formateado", () => {
  const estado = createSeedState();
  const vista = buildFuncionesView(estado);
  const funcion = vista.items.find((item) => item.id === "demo-fun-001");
  assert.equal(funcion?.peliculaId, "demo-pel-001");
  assert.equal(
    funcion?.tituloPelicula,
    estado.peliculas.find((pelicula) => pelicula.id === "demo-pel-001")?.titulo,
  );
  assert.equal(funcion?.precioFormateado, formatCOP(1800000));
  const tabla = source("src/components/taquilla-cine-demo/TaquillaFuncionesView.tsx");
  assert.match(tabla, /<th scope="col">Película<\/th>/);
  assert.match(tabla, /funcion\.tituloPelicula/);
});

test("C5 · alta válida con ID determinista derivado del estado", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "CREAR_FUNCION",
    id: "demo-fun-010",
    input: valido(),
  });
  assert.equal(resultado.error, undefined);
  assert.equal(resultado.changed, true);
  assert.equal(resultado.state.funciones.length, 10);
  assert.equal(estado.funciones.length, 9);
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaFuncionesView.tsx");
  assert.match(vistaSource, /DEMO_ID_PREFIXES\.funcion/);
  assert.match(vistaSource, /"CREAR_FUNCION"/);
  assert.match(vistaSource, /nextFuncionId\(state\)/);
});

test("C5 · una función nueva nace con cupos disponibles iguales a los totales", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "CREAR_FUNCION",
    id: "demo-fun-010",
    input: valido({ cuposTotales: 17 }),
  });
  assert.equal(resultado.error, undefined);
  const creada = resultado.state.funciones.find((funcion) => funcion.id === "demo-fun-010");
  assert.equal(creada?.cuposTotales, 17);
  assert.equal(creada?.cuposDisponibles, 17);
  assert.equal(selectCuposDisponibles(resultado.state, "demo-fun-010"), 17);
  const dialogo = source("src/components/taquilla-cine-demo/TaquillaFuncionDialog.tsx");
  assert.doesNotMatch(dialogo, /cuposDisponibles\s*:/);
});

test("C5 · edición válida conserva ID, compras y película de la función", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: valido({ hora: "21:15", sala: "Sala 6", precioPesos: 19500 }),
  });
  assert.equal(resultado.error, undefined);
  assert.equal(resultado.changed, true);
  const editada = resultado.state.funciones.find((funcion) => funcion.id === "demo-fun-001");
  assert.equal(editada?.hora, "21:15");
  assert.equal(editada?.sala, "Sala 6");
  assert.equal(editada?.precioCentavos, 1950000);
  assert.equal(editada?.peliculaId, "demo-pel-001");
  assert.deepEqual(resultado.state.compras, estado.compras);
});

test("C5 · aumentar capacidad conserva los boletos vendidos", () => {
  const estado = createSeedState();
  assert.equal(selectBoletosVendidos(estado, "demo-fun-001"), 2);
  const resultado = applyDemoAction(estado, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: valido({ cuposTotales: 20 }),
  });
  assert.equal(resultado.error, undefined);
  const editada = resultado.state.funciones.find((funcion) => funcion.id === "demo-fun-001");
  assert.equal(editada?.cuposTotales, 20);
  assert.equal(editada?.cuposDisponibles, 18);
  assert.equal(selectBoletosVendidos(resultado.state, "demo-fun-001"), 2);
});

test("C5 · reducción válida recalcula disponibles sin tocar el historial", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: valido({ cuposTotales: 6 }),
  });
  assert.equal(resultado.error, undefined);
  const editada = resultado.state.funciones.find((funcion) => funcion.id === "demo-fun-001");
  assert.equal(editada?.cuposTotales, 6);
  assert.equal(editada?.cuposDisponibles, 4);
  assert.equal(selectBoletosVendidos(resultado.state, "demo-fun-001"), 2);
  assert.deepEqual(resultado.state.compras, estado.compras);
});

test("C5 · reducción por debajo de vendidos se rechaza y deja el estado intacto", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: valido({ cuposTotales: 1 }),
  });
  assert.equal(resultado.changed, false);
  assert.equal(
    resultado.error,
    "La nueva capacidad total (1) no puede ser inferior a los cupos ya vendidos (2)",
  );
  assert.equal(resultado.state, estado);
});

test("C5 · cambio de película permitido cuando la función no tiene compras", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-007",
    input: valido({ peliculaId: "demo-pel-004" }),
  });
  assert.equal(resultado.error, undefined);
  assert.equal(
    resultado.state.funciones.find((funcion) => funcion.id === "demo-fun-007")?.peliculaId,
    "demo-pel-004",
  );
});

test("C5 · cambio de película bloqueado cuando hay compras registradas", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: valido({ peliculaId: "demo-pel-002" }),
  });
  assert.equal(resultado.changed, false);
  assert.equal(
    resultado.error,
    "No se puede cambiar la película de una función que tiene compras registradas",
  );
  assert.equal(resultado.state, estado);
});

test("C5 · eliminación permitida en una función sin compras", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "ELIMINAR_FUNCION",
    id: "demo-fun-007",
  });
  assert.equal(resultado.error, undefined);
  assert.equal(resultado.changed, true);
  assert.equal(resultado.state.funciones.length, 8);
  assert.equal(resultado.state.funciones.some((funcion) => funcion.id === "demo-fun-007"), false);
  assert.deepEqual(resultado.state.compras, estado.compras);
  const confirmacion = source("src/components/taquilla-cine-demo/TaquillaDeleteConfirmDialog.tsx");
  assert.match(confirmacion, /¿Eliminar «\{titulo\}»\?/);
  assert.match(confirmacion, />\s*Sí, eliminar\s*</);
  assert.match(confirmacion, />\s*Cancelar\s*</);
});

test("C5 · eliminación bloqueada por compras, sin cascada", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "ELIMINAR_FUNCION",
    id: "demo-fun-002",
  });
  assert.equal(resultado.changed, false);
  assert.equal(
    resultado.error,
    "No se puede eliminar la función porque tiene compras asociadas",
  );
  assert.equal(resultado.state, estado);
  assert.equal(resultado.state.compras.length, 8);
});

test("C5 · fecha con formato inválido", () => {
  assert.equal(mensaje({ fecha: "15-12-2026" }), "La fecha debe tener el formato YYYY-MM-DD");
  assert.equal(mensaje({ fecha: "" }), "La fecha debe tener el formato YYYY-MM-DD");
});

test("C5 · fecha inexistente en el calendario", () => {
  assert.equal(mensaje({ fecha: "2026-02-30" }), "La fecha no existe en el calendario");
  assert.equal(mensaje({ fecha: "2026-13-01" }), "La fecha no existe en el calendario");
});

test("C5 · hora con formato inválido", () => {
  assert.equal(mensaje({ hora: "8:00" }), "La hora debe tener el formato HH:mm");
  assert.equal(mensaje({ hora: "25:00" }), "La hora debe tener el formato HH:mm");
  assert.equal(mensaje({ hora: "" }), "La hora debe tener el formato HH:mm");
});

test("C5 · sala obligatoria y con límite de 50 caracteres", () => {
  assert.equal(mensaje({ sala: "   " }), "El campo es obligatorio");
  assert.equal(mensaje({ sala: "x".repeat(51) }), "El campo no puede superar 50 caracteres");
  assert.ok(validateFuncionInput(input({ sala: "x".repeat(50) }), createSeedState()).ok);
});

test("C5 · precio positivo, con máximo dos decimales y dentro del límite", () => {
  const esperado =
    "El precio debe ser mayor a cero, tener máximo dos decimales y no superar 9999999999.99";
  assert.equal(mensaje({ precioPesos: 0 }), esperado);
  assert.equal(mensaje({ precioPesos: -1 }), esperado);
  assert.equal(mensaje({ precioPesos: 12.345 }), esperado);
  assert.equal(mensaje({ precioPesos: 10000000000 }), esperado);
  assert.ok(validateFuncionInput(input({ precioPesos: 9999999999.99 }), createSeedState()).ok);
});

test("C5 · cupos totales enteros positivos dentro de 1..2147483647", () => {
  assert.equal(mensaje({ cuposTotales: 0 }), "El valor debe estar entre 1 y 2147483647");
  assert.equal(mensaje({ cuposTotales: -3 }), "El valor debe estar entre 1 y 2147483647");
  assert.equal(mensaje({ cuposTotales: 2.5 }), "El valor debe ser un entero seguro");
  assert.equal(
    mensaje({ cuposTotales: 2147483648 }),
    "El valor debe estar entre 1 y 2147483647",
  );
  assert.ok(validateFuncionInput(input({ cuposTotales: 2147483647 }), createSeedState()).ok);
});

test("C5 · indicador (AGOTADA) cuando no quedan cupos", () => {
  const estado = createSeedState();
  const funciones = buildFuncionesView(estado).items;
  const agotada = funciones.find((funcion) => funcion.id === "demo-fun-002");
  assert.equal(agotada?.cuposTotales, 3);
  assert.equal(agotada?.cuposDisponibles, 0);
  assert.equal(agotada?.estadoCupos, "agotada");
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaFuncionesView.tsx");
  assert.match(vistaSource, /\(AGOTADA\)/);
});

test("C5 · indicador (POCOS) entre uno y cinco cupos", () => {
  const funciones = buildFuncionesView(createSeedState()).items;
  const pocos = funciones.filter((funcion) => funcion.estadoCupos === "pocos");
  assert.deepEqual(
    pocos.map((funcion) => funcion.id),
    ["demo-fun-005", "demo-fun-006"],
  );
  assert.equal(pocos[0]?.cuposDisponibles, 2);
  assert.equal(pocos[1]?.cuposDisponibles, 4);
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaFuncionesView.tsx");
  assert.match(vistaSource, /\(POCOS\)/);
});

test("C5 · persistencia solo en la clave propia de Taquilla", () => {
  const almacen = almacenFalso();
  resetTaquillaHydrationGate();
  loadTaquillaState(almacen);
  const editado = applyDemoAction(createSeedState(), {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: valido({ sala: "Persistida" }),
  }).state;
  assert.equal(saveTaquillaState(editado, almacen), true);
  assert.deepEqual([...almacen.datos.keys()], [TAQUILLA_STORAGE_KEY]);
  assert.equal(TAQUILLA_STORAGE_KEY, "yeyder.taquilla-cine.demo.v1");
  for (const archivo of [
    "TaquillaFuncionesView.tsx",
    "TaquillaFuncionDialog.tsx",
    "TaquillaDeleteConfirmDialog.tsx",
  ]) {
    const contenido = source(`src/components/taquilla-cine-demo/${archivo}`);
    assert.doesNotMatch(contenido, /localStorage\.|\.getItem\(|\.setItem\(|\bfetch\b/);
    assert.doesNotMatch(contenido, /yeyder\.fiore\.demo\.v1/);
    assert.doesNotMatch(contenido, /Date\.now\(|Math\.random\(/);
  }
});

test("C5 · restauración de funciones y reinicio sin tocar Fiore", () => {
  const almacen = almacenFalso();
  almacen.datos.set("yeyder.fiore.demo.v1", "C5-SENTINEL-NO-BORRAR");
  resetTaquillaHydrationGate();
  loadTaquillaState(almacen);
  const modificado = applyDemoAction(createSeedState(), {
    type: "ELIMINAR_FUNCION",
    id: "demo-fun-007",
  }).state;
  saveTaquillaState(modificado, almacen);
  const cargado = loadTaquillaState(almacen);
  assert.equal(cargado.status, "ok");
  if (cargado.status === "ok") {
    assert.equal(cargado.state.funciones.length, 8);
  }
  const reiniciado = applyDemoAction(modificado, { type: "RESET" });
  assert.deepEqual(reiniciado.state, createSeedState());
  clearTaquillaState(almacen);
  assert.equal(almacen.datos.has(TAQUILLA_STORAGE_KEY), false);
  assert.equal(almacen.datos.get("yeyder.fiore.demo.v1"), "C5-SENTINEL-NO-BORRAR");
});

test("C5 · teclado: Escape en capas y foco restaurado sin listeners redundantes", () => {
  const demo = source("src/components/taquilla-cine-demo/TaquillaDemo.tsx");
  assert.match(demo, /event\.stopImmediatePropagation\(\)/);
  assert.match(demo, /document\.addEventListener\("keydown", handleKeyDown, \{ capture: true \}\)/);
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaFuncionesView.tsx");
  assert.match(vistaSource, /key=\{forma\.kind === "editar"/);
  assert.match(vistaSource, /retornoFormulario\.current\?\.focus\(\)/);
  assert.match(vistaSource, /retornoDetalle\.current\?\.focus\(\)/);
  assert.match(vistaSource, /document\.addEventListener\("keydown", alPulsar\)/);
  assert.match(vistaSource, /aria-describedby=/);
  assert.match(vistaSource, /role=\{feedback\.kind === "error" \? "alert" : "status"\}/);
  const css = source("src/components/taquilla-cine-demo/taquilla-demo.module.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
