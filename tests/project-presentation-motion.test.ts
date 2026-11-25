/**
 * M8.1 — Regresiones de la animación de apertura y cierre de las
 * presentaciones ampliadas. Las constantes se comprueban de forma pura y los
 * componentes se revisan estáticamente para evitar volver al montaje
 * condicional instantáneo.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PRESENTATION_MOTION,
  presentationDuration,
} from "../src/lib/project-presentation-motion";

const showcaseSource = readFileSync(
  "src/components/ui/project-showcase.tsx",
  "utf8",
);
const carouselSource = readFileSync(
  "src/components/ui/projects-carousel.tsx",
  "utf8",
);

test("M8.1 · la duración está en el rango solicitado y el movimiento reducido es inmediato", () => {
  assert.ok(PRESENTATION_MOTION.duration >= 0.35);
  assert.ok(PRESENTATION_MOTION.duration <= 0.45);
  assert.equal(PRESENTATION_MOTION.reducedDuration, 0);
  assert.equal(presentationDuration(true), 0);
  assert.equal(presentationDuration(false), PRESENTATION_MOTION.duration);
});

test("M8.1 · la curva es ease-out y no hay escalado ni efectos 3D", () => {
  assert.equal(PRESENTATION_MOTION.ease, "easeOut");
  assert.equal(PRESENTATION_MOTION.cssEase, "ease-out");
  const keys = Object.keys(PRESENTATION_MOTION);
  assert.ok(!keys.some((key) => /scale|rotate|perspective|translateZ/i.test(key)));
});

test("M8.1 · el desplazamiento de entrada es sutil y el de salida muy ligero", () => {
  assert.ok(PRESENTATION_MOTION.enterY >= 12);
  assert.ok(PRESENTATION_MOTION.enterY <= 20);
  assert.ok(PRESENTATION_MOTION.detailsEnterY >= 12);
  assert.ok(PRESENTATION_MOTION.detailsEnterY <= 20);
  assert.ok(PRESENTATION_MOTION.exitY < 0);
  assert.ok(Math.abs(PRESENTATION_MOTION.exitY) <= PRESENTATION_MOTION.enterY);
  assert.ok(Math.abs(PRESENTATION_MOTION.detailsExitY) <= 12);
});

test("M8.1 · la altura se mide y se anima, sin valores fijos", () => {
  assert.equal(PRESENTATION_MOTION.collapsedHeight, 0);
  assert.equal(PRESENTATION_MOTION.expandedHeight, "auto");
  assert.equal(PRESENTATION_MOTION.panelGap, 32);
  assert.match(carouselSource, /useMotionValue<number>\(PRESENTATION_MOTION\.collapsedHeight\)/);
  assert.match(carouselSource, /animate\(height, nextHeight/);
  assert.match(carouselSource, /contentHeight/);
  assert.match(carouselSource, /ResizeObserver/);
  assert.match(carouselSource, /style=\{\{ height, marginTop \}\}/);
  assert.match(carouselSource, /PRESENTATION_MOTION\.panelGap/);
  assert.match(showcaseSource, /ResizeObserver/);
  assert.match(showcaseSource, /detailsHeight/);
  assert.match(showcaseSource, /height:\s*detailsOpen\s*\?/);
});

test("M8.1 · el cambio de proyecto espera a que salga el anterior", () => {
  assert.equal(PRESENTATION_MOTION.mode, "wait");
  assert.match(carouselSource, /mode=\{PRESENTATION_MOTION\.mode\}/);
});

test("M8.1 · el detalle interior ya no se monta con hidden", () => {
  assert.doesNotMatch(showcaseSource, /\shidden=\{!detailsOpen\}/);
  assert.match(showcaseSource, /opacity: detailsOpen \? 1 : 0/);
  assert.match(showcaseSource, /height:\s*detailsOpen\s*\?/);
  assert.match(showcaseSource, /PRESENTATION_MOTION\.detailsEnterY/);
  assert.match(showcaseSource, /transitionDuration: `\$\{duration\}s`/);
  assert.match(showcaseSource, /transitionTimingFunction: PRESENTATION_MOTION\.cssEase/);
  assert.equal(PRESENTATION_MOTION.detailsGap, 24);
});

test("M8.1 · el detalle cerrado queda inerte para teclado y lectores", () => {
  assert.match(showcaseSource, /aria-hidden=\{!detailsOpen\}/);
  assert.match(showcaseSource, /inert=\{!detailsOpen\}/);
});

test("M8.1 · el foco se restaura una sola vez y la salida se marca inerte", () => {
  assert.match(carouselSource, /focusRestoredRef/);
  assert.match(carouselSource, /restorePresentationFocus\(\)/);
  assert.match(carouselSource, /detailRef\.current\.inert = true/);
  assert.match(carouselSource, /useIsPresent/);
  assert.match(carouselSource, /inert=\{!isPresent\}/);
  assert.match(carouselSource, /aria-hidden=\{!isPresent\}/);
  assert.doesNotMatch(carouselSource, /duration: prefersReducedMotion\(\) \? 0 : 0\.25/);
});
