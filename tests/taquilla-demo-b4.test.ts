/**
 * C4 — Contratos de la vista interactiva de Películas.
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
import { applyDemoAction } from "../src/lib/taquilla-cine-demo/reducer";
import {
  buildPeliculasView,
  filterPeliculas,
} from "../src/lib/taquilla-cine-demo/peliculas-view";
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
  validatePeliculaInput,
  type PeliculaInput,
} from "../src/lib/taquilla-cine-demo/validation";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function input(overrides: Partial<PeliculaInput> = {}): Record<string, unknown> {
  return {
    titulo: "Película de prueba",
    genero: "Drama",
    duracionMin: 95,
    clasificacion: "A",
    ...overrides,
  };
}

function valido(overrides: Partial<PeliculaInput> = {}): PeliculaInput {
  const resultado = validatePeliculaInput(input(overrides));
  assert.ok(resultado.ok);
  return resultado.value;
}

function mensaje(overrides: Partial<PeliculaInput>): string {
  const resultado = validatePeliculaInput(input(overrides));
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

test("C4 · listado inicial derivado del estado y orden estable por ID", () => {
  const estado = createSeedState();
  const vista = buildPeliculasView(estado);
  assert.equal(vista.total, 6);
  assert.equal(vista.esVacio, false);
  assert.deepEqual(
    vista.items.map((pelicula) => pelicula.id),
    [
      "demo-pel-001",
      "demo-pel-002",
      "demo-pel-003",
      "demo-pel-004",
      "demo-pel-005",
      "demo-pel-006",
    ],
  );
  const demo = source("src/components/taquilla-cine-demo/TaquillaDemo.tsx");
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaPeliculasView.tsx");
  assert.match(demo, /activeView === "peliculas"/);
  assert.match(demo, /<TaquillaPeliculasView/);
  assert.match(demo, /<TaquillaPlaceholderView item=\{currentItem\} \/>/);
  assert.match(vistaSource, /buildPeliculasView\(state, \{ query \}\)/);
});

test("C4 · búsqueda local con los helpers de C2", () => {
  const estado = createSeedState();
  const encontradas = filterPeliculas(estado.peliculas, "  caribe  ");
  assert.deepEqual(
    encontradas.map((pelicula) => pelicula.id),
    ["demo-pel-005"],
  );
  assert.equal(buildPeliculasView(estado, { query: "DINOSAURIOS" }).total, 1);
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaPeliculasView.tsx");
  assert.match(vistaSource, /type="search"/);
  assert.match(vistaSource, /aria-describedby="taquilla-buscar-ayuda"/);
});

test("C4 · búsqueda sin resultados usa el mensaje del selector", () => {
  const vista = buildPeliculasView(createSeedState(), { query: "no existe" });
  assert.equal(vista.esVacio, true);
  assert.equal(vista.total, 0);
  assert.equal(vista.mensajeVacio, "No hay películas que coincidan con la búsqueda.");
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaPeliculasView.tsx");
  assert.match(vistaSource, /vista\.mensajeVacio/);
});

test("C4 · alta válida conserva el ID generado y los cuatro campos", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "CREAR_PELICULA",
    id: "demo-pel-007",
    input: valido({ titulo: "  Estreno de prueba  " }),
  });
  assert.equal(resultado.error, undefined);
  assert.equal(resultado.changed, true);
  assert.equal(resultado.state.peliculas.length, 7);
  const creada = resultado.state.peliculas.find((pelicula) => pelicula.id === "demo-pel-007");
  assert.equal(creada?.titulo, "Estreno de prueba");
  assert.equal(estado.peliculas.length, 6);
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaPeliculasView.tsx");
  assert.match(vistaSource, /"CREAR_PELICULA"/);
  assert.match(vistaSource, /nextPeliculaId\(state\)/);
});

test("C4 · edición válida conserva ID y relaciones", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "EDITAR_PELICULA",
    id: "demo-pel-001",
    input: valido({ titulo: "Viaje a la Luna (edición)" }),
  });
  assert.equal(resultado.error, undefined);
  assert.equal(resultado.changed, true);
  assert.equal(resultado.state.peliculas.find((p) => p.id === "demo-pel-001")?.titulo, "Viaje a la Luna (edición)");
  assert.deepEqual(resultado.state.funciones, estado.funciones);
  assert.deepEqual(resultado.state.compras, estado.compras);
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaPeliculasView.tsx");
  assert.match(vistaSource, /"EDITAR_PELICULA"/);
});

test("C4 · eliminación permitida solo para películas sin funciones", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "ELIMINAR_PELICULA",
    id: "demo-pel-006",
  });
  assert.equal(resultado.error, undefined);
  assert.equal(resultado.changed, true);
  assert.equal(resultado.state.peliculas.length, 5);
  assert.equal(resultado.state.peliculas.some((p) => p.id === "demo-pel-006"), false);
  const confirmacion = source("src/components/taquilla-cine-demo/TaquillaDeleteConfirmDialog.tsx");
  assert.match(confirmacion, /¿Eliminar «\{titulo\}»\?/);
  assert.match(confirmacion, />\s*Sí, eliminar\s*</);
  assert.match(confirmacion, />\s*Cancelar\s*</);
});

test("C4 · eliminación bloqueada por funciones con mensaje comprensible", () => {
  const estado = createSeedState();
  const resultado = applyDemoAction(estado, {
    type: "ELIMINAR_PELICULA",
    id: "demo-pel-001",
  });
  assert.equal(resultado.changed, false);
  assert.equal(
    resultado.error,
    "No se puede eliminar la película porque tiene funciones asociadas",
  );
  assert.equal(resultado.state, estado);
  assert.doesNotMatch(resultado.error ?? "", /SQL|FOREIGN KEY|约束/i);
  const vistaSource = source("src/components/taquilla-cine-demo/TaquillaPeliculasView.tsx");
  assert.match(vistaSource, /role=\{feedback\.kind === "error" \? "alert" : "status"\}/);
});

test("C4 · título vacío o de solo espacios", () => {
  assert.equal(mensaje({ titulo: "" }), "El campo es obligatorio");
  assert.equal(mensaje({ titulo: "    " }), "El campo es obligatorio");
});

test("C4 · género vacío o de solo espacios", () => {
  assert.equal(mensaje({ genero: "" }), "El campo es obligatorio");
  assert.equal(mensaje({ genero: " \t " }), "El campo es obligatorio");
});

test("C4 · clasificación vacía o de solo espacios", () => {
  assert.equal(mensaje({ clasificacion: "" }), "El campo es obligatorio");
  assert.equal(mensaje({ clasificacion: "   " }), "El campo es obligatorio");
});

test("C4 · límites de longitud del original y normalización", () => {
  assert.equal(mensaje({ titulo: "x".repeat(151) }), "El campo no puede superar 150 caracteres");
  assert.equal(mensaje({ genero: "x".repeat(81) }), "El campo no puede superar 80 caracteres");
  assert.equal(
    mensaje({ clasificacion: "x".repeat(21) }),
    "El campo no puede superar 20 caracteres",
  );
  const limite = validatePeliculaInput(
    input({
      titulo: "x".repeat(150),
      genero: "y".repeat(80),
      clasificacion: "z".repeat(20),
    }),
  );
  assert.ok(limite.ok);
  const formulario = source("src/components/taquilla-cine-demo/TaquillaPeliculaDialog.tsx");
  assert.match(formulario, /validatePeliculaInput\(parsePeliculaForm\(values\)\)/);
  assert.match(formulario, /aria-invalid=\{error \? true : undefined\}/);
});

test("C4 · duración cero", () => {
  assert.equal(mensaje({ duracionMin: 0 }), "El valor debe estar entre 1 y 2147483647");
});

test("C4 · duración negativa", () => {
  assert.equal(mensaje({ duracionMin: -5 }), "El valor debe estar entre 1 y 2147483647");
});

test("C4 · duración decimal", () => {
  assert.equal(mensaje({ duracionMin: 12.5 }), "El valor debe ser un entero seguro");
});

test("C4 · duración fuera del límite INTEGER", () => {
  assert.equal(
    mensaje({ duracionMin: 2147483648 }),
    "El valor debe estar entre 1 y 2147483647",
  );
});

test("C4 · una operación rechazada no altera el estado", () => {
  const estado = createSeedState();
  const rechazado = applyDemoAction(estado, {
    type: "CREAR_PELICULA",
    id: "demo-pel-007",
    input: {
      titulo: "   ",
      genero: "Drama",
      duracionMin: 95,
      clasificacion: "A",
    },
  });
  assert.equal(rechazado.changed, false);
  assert.equal(rechazado.state, estado);
  const aceptado = applyDemoAction(estado, {
    type: "CREAR_PELICULA",
    id: "demo-pel-007",
    input: valido(),
  });
  assert.equal(aceptado.changed, true);
  assert.equal(aceptado.state.peliculas.length, 7);
});

test("C4 · persistencia con la clave propia y sin acceso directo desde la vista", () => {
  const almacen = almacenFalso();
  resetTaquillaHydrationGate();
  assert.equal(loadTaquillaState(almacen).status, "empty");
  const editado = applyDemoAction(createSeedState(), {
    type: "EDITAR_PELICULA",
    id: "demo-pel-002",
    input: valido({ titulo: "Persistida" }),
  }).state;
  assert.equal(saveTaquillaState(editado, almacen), true);
  assert.deepEqual([...almacen.datos.keys()], [TAQUILLA_STORAGE_KEY]);
  assert.equal(TAQUILLA_STORAGE_KEY, "yeyder.taquilla-cine.demo.v1");
  const cargado = loadTaquillaState(almacen);
  assert.equal(cargado.status, "ok");
  if (cargado.status === "ok") {
    assert.equal(
      cargado.state.peliculas.find((p) => p.id === "demo-pel-002")?.titulo,
      "Persistida",
    );
  }
  for (const archivo of [
    "TaquillaPeliculasView.tsx",
    "TaquillaPeliculaDialog.tsx",
    "TaquillaDeleteConfirmDialog.tsx",
    "taquilla-form-utils.tsx",
  ]) {
    const contenido = source(`src/components/taquilla-cine-demo/${archivo}`);
    assert.doesNotMatch(contenido, /localStorage\.|\.getItem\(|\.setItem\(|\bfetch\b/);
    assert.doesNotMatch(contenido, /yeyder\.fiore\.demo\.v1/);
    assert.doesNotMatch(contenido, /Date\.now\(|Math\.random\(/);
  }
});

test("C4 · reinicio recupera la semilla y limpia solo la clave de Taquilla", () => {
  const almacen = almacenFalso();
  almacen.datos.set("yeyder.fiore.demo.v1", "C4-SENTINEL-NO-BORRAR");
  resetTaquillaHydrationGate();
  loadTaquillaState(almacen);
  const modificado = applyDemoAction(createSeedState(), {
    type: "ELIMINAR_PELICULA",
    id: "demo-pel-006",
  }).state;
  saveTaquillaState(modificado, almacen);
  const reiniciado = applyDemoAction(modificado, { type: "RESET" });
  assert.equal(reiniciado.changed, true);
  assert.deepEqual(reiniciado.state, createSeedState());
  clearTaquillaState(almacen);
  assert.equal(almacen.datos.has(TAQUILLA_STORAGE_KEY), false);
  assert.equal(almacen.datos.get("yeyder.fiore.demo.v1"), "C4-SENTINEL-NO-BORRAR");
  const demo = source("src/components/taquilla-cine-demo/TaquillaDemo.tsx");
  assert.match(demo, /clearTaquillaState\(\)/);
  assert.match(demo, /setResetSerial\(\(actual\) => actual \+ 1\)/);
});
