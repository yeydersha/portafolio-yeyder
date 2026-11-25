/**
 * C3 — Comprobaciones ligeras del marco, la navegación y el aislamiento.
 *
 * No se añade React Testing Library: las interacciones reales se verifican en
 * navegador. Aquí solo se comprueban los contratos que pueden fallar en silencio
 * al compilar: configuración de navigation, forma de la ruta y límites de C3.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import {
  getTaquillaNavItem,
  TAQUILLA_INITIAL_VIEW,
  TAQUILLA_NAV_ITEMS,
} from "../src/components/taquilla-cine-demo/taquilla-navigation";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

test("C3 · la navegación empieza en Películas y conserva el orden del original", () => {
  assert.equal(TAQUILLA_INITIAL_VIEW, "peliculas");
  assert.deepEqual(
    TAQUILLA_NAV_ITEMS.map((item) => item.view),
    ["peliculas", "funciones", "compras", "taquilla"],
  );
  assert.deepEqual(
    TAQUILLA_NAV_ITEMS.map((item) => item.label),
    ["Películas", "Funciones", "Compras", "Taquilla"],
  );
  for (const item of TAQUILLA_NAV_ITEMS) {
    assert.equal(getTaquillaNavItem(item.view), item);
    assert.match(item.block, /^Bloque C[456]$/);
  }
});

test("C3 · la ruta es un Server Component con metadata neutral", () => {
  const page = source("src/app/proyectos/taquilla-cine/demo/page.tsx");
  assert.match(page, /import type \{ Metadata \} from "next"/);
  assert.match(page, /export const metadata: Metadata/);
  assert.match(page, /return <TaquillaDemo \/>/);
  assert.doesNotMatch(page, /"use client"/);
  assert.doesNotMatch(page, /\bfetch\b|export async function (POST|GET|PUT|DELETE)/);
});

test("C3 · el marco conserva la etiqueta, el regreso y el footer académico", () => {
  const frame = source("src/components/taquilla-cine-demo/TaquillaDemoFrame.tsx");
  assert.match(frame, /Demostración · Datos ficticios/);
  assert.match(frame, /href="\/"/);
  assert.match(frame, /Volver al portafolio/);
  assert.match(frame, /Reiniciar demo/);
  assert.match(frame, /Saltar al contenido principal/);
  assert.match(frame, /role="status"/);
  assert.match(frame, /Adaptación de demostración del proyecto académico/);
});

test("C3 · el contenedor conecta el reducer C2 sin reloj, azar ni efectos en render", () => {
  const demo = source("src/components/taquilla-cine-demo/TaquillaDemo.tsx");
  assert.match(demo, /createSeedState/);
  assert.match(demo, /applyDemoAction\(state, action\)/);
  assert.match(demo, /type: "HYDRATE"/);
  assert.match(demo, /type: "RESET"/);
  assert.match(demo, /useReducer\(taquillaStateReducer, undefined, createSeedState\)/);
  assert.doesNotMatch(demo, /Date\.now\(|Math\.random\(|window\.|localStorage\./);
});

test("C3 · la escritura espera hidratación y no duplica la clave ni el storage", () => {
  const demo = source("src/components/taquilla-cine-demo/TaquillaDemo.tsx");
  const storage = source("src/lib/taquilla-cine-demo/storage.ts");
  assert.match(demo, /if \(!ui\.hydrationReady\) return;/);
  assert.match(demo, /loadTaquillaState\(\)/);
  assert.match(demo, /saveTaquillaState\(state\)/);
  assert.match(demo, /clearTaquillaState\(\)/);
  assert.match(storage, /TAQUILLA_STORAGE_KEY = "yeyder\.taquilla-cine\.demo\.v1"/);
  assert.doesNotMatch(storage, /yeyder\.fiore\.demo\.v1/);
  for (const file of ["TaquillaDemo.tsx", "TaquillaDemoFrame.tsx", "TaquillaSidebar.tsx", "TaquillaResetDialog.tsx"]) {
    assert.doesNotMatch(source(`src/components/taquilla-cine-demo/${file}`), /\.setItem\(|\.getItem\(/);
  }
});

test("C3 · las vistas provisionales no simulan controles operativos", () => {
  const placeholder = source("src/components/taquilla-cine-demo/TaquillaPlaceholderView.tsx");
  assert.match(placeholder, /Funcionalidad en desarrollo/);
  assert.match(placeholder, /aria-hidden="true"/);
  assert.match(placeholder, /item\.block/);
  assert.doesNotMatch(placeholder, /<button|<input|<select|<textarea|onClick/);
});

test("C3 · diálogo y sidebar exponen contratos accesibles", () => {
  const dialog = source("src/components/taquilla-cine-demo/TaquillaResetDialog.tsx");
  const sidebar = source("src/components/taquilla-cine-demo/TaquillaSidebar.tsx");
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /event\.key === "Escape"/);
  assert.match(dialog, /previousFocus\?\.focus\(\)/);
  assert.match(dialog, />\s*Cancelar\s*</);
  assert.match(sidebar, /aria-current=\{isActive \? "page" : undefined\}/);
  assert.match(sidebar, /id="taquilla-demo-nav"/);
  assert.match(sidebar, /Cerrar menú/);
  const demo = source("src/components/taquilla-cine-demo/TaquillaDemo.tsx");
  assert.match(demo, /aria-controls="taquilla-demo-nav"/);
  assert.match(demo, /aria-expanded=\{mobileNavOpen\}/);
});

test("C7 · la tarjeta publica la demo verificada y conserva el origen académico", () => {
  const projects = source("src/data/projects.ts");
  const start = projects.indexOf("export const taquillaProject: DemoProject");
  const end = projects.indexOf("export const portfolioProjects", start);
  assert.ok(start >= 0);
  assert.ok(end > start);
  const taquillaBlock = projects.slice(start, end);
  assert.match(taquillaBlock, /kind: "demo"/);
  assert.match(taquillaBlock, /status: "Demo interactiva"/);
  assert.match(taquillaBlock, /actionLabel: "Explorar demo"/);
  assert.match(taquillaBlock, /href: "\/proyectos\/taquilla-cine\/demo"/);
  assert.match(taquillaBlock, /cardImage: taquillaCardImage/);
  assert.match(projects, /src: "\/images\/taquilla-preview\.jpg"/);
  assert.match(taquillaBlock, /Angular 21, Spring Boot, Java y PostgreSQL/);
  assert.match(taquillaBlock, /React, TypeScript y datos ficticios locales/);
});
