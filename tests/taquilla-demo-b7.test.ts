/**
 * C7 — Auditoría final, integración pública y regresiones de la demo de
 * Taquilla de Cine.
 *
 * El arnés no monta React: aquí se fijan los contratos puros de persistencia,
 * integridad, transiciones y datos, además de las correcciones accesibles
 * verificadas en navegador. Los recorridos visuales y de teclado se documentan
 * en el informe C7 con capturas reales.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import {
  electroTeroProject,
  fioreProject,
  getProjectPresentation,
  portfolioProjects,
  taquillaProject,
} from "../src/data/projects";
import { createSeedState } from "../src/data/taquilla-cine-demo/seed";
import type { TaquillaDemoState } from "../src/data/taquilla-cine-demo/types";
import { DEMO_STORAGE_KEY as FIORE_STORAGE_KEY } from "../src/lib/fiore-demo/storage";
import {
  getRouteTransitionGroup,
  getSmoothScrollBehavior,
  isRouteTransitionPath,
  shouldAnimateInternalNavigation,
  type InternalNavigationCandidate,
} from "../src/lib/route-transition";
import { applyDemoAction } from "../src/lib/taquilla-cine-demo/reducer";
import {
  TAQUILLA_STORAGE_KEY,
  clearTaquillaState,
  loadTaquillaState,
  resetTaquillaHydrationGate,
  saveTaquillaState,
  type TaquillaStorageLike,
} from "../src/lib/taquilla-cine-demo/storage";
import {
  validateDemoState,
  type CompraInput,
} from "../src/lib/taquilla-cine-demo/validation";

const TAQUILLA_PATH = "/proyectos/taquilla-cine/demo";
const FIORE_PATH = "/proyectos/fiore/demo";
const FECHA_COMPRA = "2026-11-25T20:00:00-05:00";

class MemoryStorage implements TaquillaStorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function cloneSeed(): TaquillaDemoState {
  return JSON.parse(JSON.stringify(createSeedState())) as TaquillaDemoState;
}

function candidate(overrides: Partial<InternalNavigationCandidate> = {}): InternalNavigationCandidate {
  return {
    currentPath: "/",
    href: `http://localhost:3000${TAQUILLA_PATH}`,
    origin: "http://localhost:3000",
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    ...overrides,
  };
}

function comprar(overrides: Partial<CompraInput> = {}) {
  const input: CompraInput = {
    funcionId: "demo-fun-001",
    nombreCliente: "Ana Pérez",
    cantidadBoletos: 3,
    ...overrides,
  };
  return applyDemoAction(cloneSeed(), {
    type: "REGISTRAR_COMPRA",
    id: "demo-com-009",
    fechaCompra: FECHA_COMPRA,
    input,
  });
}

test("C7 · la tarjeta de Taquilla publica una demo verificada, no un estado pendiente", () => {
  assert.equal(taquillaProject.kind, "demo");
  assert.equal(taquillaProject.status, "Demo interactiva");
  assert.equal(taquillaProject.actionLabel, "Explorar demo");
  assert.equal(taquillaProject.href, TAQUILLA_PATH);
  assert.deepEqual(getProjectPresentation(taquillaProject).action, {
    label: "Explorar demo",
    href: TAQUILLA_PATH,
    external: false,
  });
  assert.ok(portfolioProjects.includes(taquillaProject));
  assert.equal(portfolioProjects.length, 3);
});

test("C7 · la tarjeta abre la presentación y el CTA vive en la presentación ampliada", () => {
  const card = source("src/components/ui/project-card.tsx");
  const showcase = source("src/components/ui/project-showcase.tsx");
  const page = source("src/app/proyectos/taquilla-cine/demo/page.tsx");

  assert.match(card, /onClick=\{\(event\) => onOpenDetail\(event\.currentTarget\)\}/);
  assert.match(showcase, /href=\{presentation\.action\.href\}/);
  assert.match(page, /<TaquillaDemo \/>/);
  assert.match(page, /Taquilla de Cine · Demo interactiva/);
});

test("C7 · la captura de Taquilla es un asset real, propio y de proporción 16:10", () => {
  const imagePath = "public/images/taquilla-preview.jpg";
  assert.ok(existsSync(join(process.cwd(), imagePath)));
  const image = getProjectPresentation(taquillaProject).image;
  assert.ok(image);
  assert.equal(image.src, "/images/taquilla-preview.jpg");
  assert.equal(image.width / image.height, 16 / 10);
  assert.match(image.alt, /Captura real/);
  assert.match(image.caption, /datos ficticios locales/);
  assert.equal(getProjectPresentation(fioreProject).image?.src, "/images/fiore-preview.jpg");
  assert.equal(
    getProjectPresentation(electroTeroProject).preview?.image,
    "/images/electrotero-preview.jpg",
  );
});

test("C7 · las transiciones forman dos grupos y nunca cruzan Fiore con Taquilla", () => {
  assert.equal(isRouteTransitionPath("/"), true);
  assert.equal(isRouteTransitionPath(FIORE_PATH), true);
  assert.equal(isRouteTransitionPath(TAQUILLA_PATH), true);
  assert.equal(getRouteTransitionGroup("/", TAQUILLA_PATH), "taquilla");
  assert.equal(getRouteTransitionGroup(TAQUILLA_PATH, "/"), "taquilla");
  assert.equal(getRouteTransitionGroup("/", FIORE_PATH), "fiore");
  assert.equal(getRouteTransitionGroup(FIORE_PATH, "/"), "fiore");

  assert.equal(shouldAnimateInternalNavigation(candidate()), true);
  assert.equal(
    shouldAnimateInternalNavigation(candidate({ currentPath: TAQUILLA_PATH, href: "http://localhost:3000/" })),
    true,
  );
  assert.equal(
    shouldAnimateInternalNavigation(
      candidate({ currentPath: FIORE_PATH, href: `http://localhost:3000${TAQUILLA_PATH}` }),
    ),
    false,
  );
  assert.equal(
    shouldAnimateInternalNavigation(
      candidate({ currentPath: TAQUILLA_PATH, href: `http://localhost:3000${FIORE_PATH}` }),
    ),
    false,
  );
  assert.equal(
    shouldAnimateInternalNavigation(candidate({ target: "_blank" })),
    false,
  );
});

test("C7 · la transición respeta reduced motion y no usa APIs experimentales", () => {
  const surface = source("src/components/ui/route-transition-surface.tsx");
  assert.match(surface, /\(prefers-reduced-motion: reduce\)/);
  assert.match(surface, /duration: 140/);
  assert.match(surface, /reduceMotion \? 0 : 140/);
  assert.doesNotMatch(surface, /startViewTransition|viewTransition/);
  assert.equal(getSmoothScrollBehavior(false), "smooth");
  assert.equal(getSmoothScrollBehavior(true), "auto");
});

test("C7 · la escritura sigue cerrada hasta resolver la hidratación", () => {
  resetTaquillaHydrationGate();
  const storage = new MemoryStorage();
  assert.equal(saveTaquillaState(createSeedState(), storage), false);
  assert.equal(storage.values.size, 0);

  assert.equal(loadTaquillaState(storage).status, "empty");
  assert.equal(saveTaquillaState(createSeedState(), storage), true);
  assert.equal(storage.values.has(TAQUILLA_STORAGE_KEY), true);
});

test("C7 · JSON corrupto, versión antigua y referencias rotas se descartan", () => {
  const corrupto = new MemoryStorage();
  corrupto.values.set(TAQUILLA_STORAGE_KEY, "{no es JSON");
  resetTaquillaHydrationGate();
  assert.equal(loadTaquillaState(corrupto).status, "invalid");
  assert.equal(corrupto.values.has(TAQUILLA_STORAGE_KEY), false);

  const versionAntigua = cloneSeed() as unknown as Record<string, unknown>;
  versionAntigua.version = 0;
  const storageVersion = new MemoryStorage();
  storageVersion.values.set(TAQUILLA_STORAGE_KEY, JSON.stringify(versionAntigua));
  resetTaquillaHydrationGate();
  assert.equal(loadTaquillaState(storageVersion).status, "invalid");
  assert.equal(storageVersion.values.has(TAQUILLA_STORAGE_KEY), false);

  const referencesRotas = cloneSeed();
  referencesRotas.funciones[0].peliculaId = "demo-pel-inexistente";
  const storageRefs = new MemoryStorage();
  storageRefs.values.set(TAQUILLA_STORAGE_KEY, JSON.stringify(referencesRotas));
  resetTaquillaHydrationGate();
  assert.equal(loadTaquillaState(storageRefs).status, "invalid");
  assert.equal(storageRefs.values.has(TAQUILLA_STORAGE_KEY), false);
});

test("C7 · cupos y totales históricos incoherentes invalidan el estado persistido", () => {
  const cupos = cloneSeed();
  cupos.funciones[0].cuposDisponibles += 1;
  const storageCupos = new MemoryStorage();
  storageCupos.values.set(TAQUILLA_STORAGE_KEY, JSON.stringify(cupos));
  resetTaquillaHydrationGate();
  assert.equal(loadTaquillaState(storageCupos).status, "invalid");
  assert.equal(storageCupos.values.has(TAQUILLA_STORAGE_KEY), false);

  const totales = cloneSeed();
  totales.compras[0].cantidadBoletos = 2;
  totales.compras[0].totalCentavos = 3;
  const storageTotales = new MemoryStorage();
  storageTotales.values.set(TAQUILLA_STORAGE_KEY, JSON.stringify(totales));
  resetTaquillaHydrationGate();
  assert.equal(loadTaquillaState(storageTotales).status, "invalid");
  assert.equal(storageTotales.values.has(TAQUILLA_STORAGE_KEY), false);
});

test("C7 · una compra conserva total histórico, cupos y validez tras recargar", () => {
  const semilla = createSeedState();
  const funcion = semilla.funciones.find((item) => item.id === "demo-fun-001");
  assert.ok(funcion);
  const resultado = comprar();
  assert.ok(resultado.changed);
  assert.equal(resultado.error, undefined);
  assert.equal(validateDemoState(resultado.state).ok, true);

  const compra = resultado.state.compras.find((item) => item.id === "demo-com-009");
  assert.ok(compra);
  assert.equal(compra.totalCentavos, funcion.precioCentavos * 3);
  assert.equal(compra.fechaCompra, FECHA_COMPRA);

  const funcionActualizada = resultado.state.funciones.find((item) => item.id === funcion.id);
  assert.ok(funcionActualizada);
  assert.equal(funcionActualizada.cuposDisponibles, funcion.cuposDisponibles - 3);

  const storage = new MemoryStorage();
  resetTaquillaHydrationGate();
  assert.equal(loadTaquillaState(storage).status, "empty");
  assert.equal(saveTaquillaState(resultado.state, storage), true);

  resetTaquillaHydrationGate();
  const recargado = loadTaquillaState(storage);
  assert.equal(recargado.status, "ok");
  if (recargado.status !== "ok") throw new Error("Estado recargado no válido");
  assert.deepEqual(recargado.state, resultado.state);
});

test("C7 · editar el precio actual no reescribe el total histórico de una compra", () => {
  const comprado = comprar();
  assert.equal(comprado.error, undefined);
  const funcion = comprado.state.funciones.find((item) => item.id === "demo-fun-001");
  assert.ok(funcion);
  const antes = comprado.state.compras.map((item) => ({ ...item }));

  const editado = applyDemoAction(comprado.state, {
    type: "EDITAR_FUNCION",
    id: funcion.id,
    input: {
      peliculaId: funcion.peliculaId,
      fecha: funcion.fecha,
      hora: funcion.hora,
      sala: funcion.sala,
      precioPesos: 99,
      cuposTotales: funcion.cuposTotales,
    },
  });
  assert.equal(editado.error, undefined);
  assert.deepEqual(editado.state.compras, antes);
});

test("C7 · reiniciar restaura la semilla y limpia solo la clave de Taquilla", () => {
  const storage = new MemoryStorage();
  const snapshotFiore = JSON.stringify({ activo: true, clave: "fiore" });
  storage.values.set(FIORE_STORAGE_KEY, snapshotFiore);
  storage.values.set(TAQUILLA_STORAGE_KEY, JSON.stringify(comprar().state));

  resetTaquillaHydrationGate();
  const loaded = loadTaquillaState(storage);
  assert.equal(loaded.status, "ok");

  clearTaquillaState(storage);
  assert.equal(storage.values.has(TAQUILLA_STORAGE_KEY), false);
  assert.equal(storage.values.get(FIORE_STORAGE_KEY), snapshotFiore);

  const reset = applyDemoAction(comprar().state, { type: "RESET" });
  assert.deepEqual(reset.state, createSeedState());
});

test("C7 · la demo no importa Fiore, backend, credenciales ni pagos reales", () => {
  const archivos = [
    "src/components/taquilla-cine-demo/TaquillaDemo.tsx",
    "src/components/taquilla-cine-demo/TaquillaDemoFrame.tsx",
    "src/components/taquilla-cine-demo/TaquillaSidebar.tsx",
    "src/components/taquilla-cine-demo/TaquillaResetDialog.tsx",
    "src/components/taquilla-cine-demo/TaquillaPeliculasView.tsx",
    "src/components/taquilla-cine-demo/TaquillaFuncionesView.tsx",
    "src/components/taquilla-cine-demo/TaquillaComprasView.tsx",
    "src/components/taquilla-cine-demo/TaquillaReportesView.tsx",
    "src/lib/taquilla-cine-demo/storage.ts",
    "src/lib/taquilla-cine-demo/reducer.ts",
    "src/lib/taquilla-cine-demo/validation.ts",
  ];
  const codigo = archivos.map(source).join("\n");
  assert.doesNotMatch(codigo, /fiore-demo|FIORE_STORAGE_KEY|fioreProject/);
  assert.doesNotMatch(codigo, /fetch\(|XMLHttpRequest|axios/);
  assert.doesNotMatch(codigo, /process\.env|NEXT_PUBLIC|password|secret|apiKey/i);
  assert.doesNotMatch(codigo, /stripe|paypal|mercadopago|tarjeta de crédito/i);
  assert.doesNotMatch(codigo, /Spring Boot|Angular|PostgreSQL|JDBC|INSERT INTO/i);
  assert.match(
    source("src/components/taquilla-cine-demo/TaquillaDemoFrame.tsx"),
    /Demostración · Datos ficticios/,
  );
});

test("C7 · operaciones inválidas no mutan cupos, historial ni estado", () => {
  const semilla = createSeedState();
  const agotada = applyDemoAction(semilla, {
    type: "REGISTRAR_COMPRA",
    id: "demo-com-009",
    fechaCompra: FECHA_COMPRA,
    input: {
      funcionId: "demo-fun-002",
      nombreCliente: "Cliente Demo",
      cantidadBoletos: 1,
    },
  });
  assert.equal(agotada.changed, false);
  assert.ok(agotada.error);
  assert.equal(agotada.state, semilla);

  const exceso = applyDemoAction(semilla, {
    type: "REGISTRAR_COMPRA",
    id: "demo-com-009",
    fechaCompra: FECHA_COMPRA,
    input: {
      funcionId: "demo-fun-001",
      nombreCliente: "Cliente Demo",
      cantidadBoletos: 100000,
    },
  });
  assert.equal(exceso.changed, false);
  assert.ok(exceso.error);
  assert.equal(exceso.state, semilla);

  const peliculaInvalida = applyDemoAction(semilla, {
    type: "CREAR_PELICULA",
    id: "demo-pel-007",
    input: { titulo: "   ", genero: "Drama", duracionMin: 90, clasificacion: "A" },
  });
  assert.equal(peliculaInvalida.changed, false);
  assert.equal(peliculaInvalida.error, "El campo es obligatorio");
  assert.equal(peliculaInvalida.state, semilla);
});

test("C7 · regresiones accesibles: capas de Escape, foco, filtros y aviso de storage", () => {
  const demo = source("src/components/taquilla-cine-demo/TaquillaDemo.tsx");
  const reset = source("src/components/taquilla-cine-demo/TaquillaResetDialog.tsx");
  const peliculas = source("src/components/taquilla-cine-demo/TaquillaPeliculasView.tsx");
  const funciones = source("src/components/taquilla-cine-demo/TaquillaFuncionesView.tsx");

  assert.match(demo, /notice: "reason" in loaded \? loaded\.reason \?\? null : null/);
  assert.match(demo, /backgroundInert=\{mobileNavOpen \|\| resetOpen\}/);
  assert.match(demo, /inert=\{mobileNavOpen \|\| resetOpen\}/);
  assert.match(reset, /stopImmediatePropagation\(\)/);
  assert.match(reset, /\{ capture: true \}/);
  assert.match(peliculas, /if \(forma \|\| confirmandoId\) return;/);
  assert.match(funciones, /if \(forma \|\| confirmandoId\) return;/);
  assert.match(funciones, /buildFuncionesView\(state\)\.items/);
  assert.doesNotMatch(funciones, /vista\.items\.find\(\(funcion\) => funcion\.id === detalleId\)/);
  assert.match(peliculas, /retornoFormulario\.current\?\.focus\(\);/);
});
