/**
 * M5.1 — Pruebas puras de la lógica de navegación reutilizable.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";

import {
  getRouteTransitionGroup,
  getSmoothScrollBehavior,
  isRouteTransitionPath,
  shouldAnimateInternalNavigation,
  type InternalNavigationCandidate,
} from "../src/lib/route-transition";

function candidate(
  overrides: Partial<InternalNavigationCandidate> = {},
): InternalNavigationCandidate {
  return {
    currentPath: "/",
    href: "http://localhost:3000/proyectos/fiore/demo",
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

test("C7 · el alcance de rutas incluye portada y ambas demos, agrupadas por pares", () => {
  assert.equal(isRouteTransitionPath("/"), true);
  assert.equal(isRouteTransitionPath("/proyectos/fiore/demo"), true);
  assert.equal(isRouteTransitionPath("/proyectos/taquilla-cine/demo"), true);
  assert.equal(isRouteTransitionPath("/proyectos/fiore"), false);
});

test("C7 · las transiciones por grupo separan Fiore de Taquilla", () => {
  assert.equal(getRouteTransitionGroup("/", "/proyectos/fiore/demo"), "fiore");
  assert.equal(
    getRouteTransitionGroup("/proyectos/fiore/demo", "/"),
    "fiore",
  );
  assert.equal(
    shouldAnimateInternalNavigation(
      candidate({ href: "http://localhost:3000/proyectos/fiore/demo" }),
    ),
    true,
  );
  assert.equal(
    shouldAnimateInternalNavigation(
      candidate({
        currentPath: "/proyectos/fiore/demo",
        href: "http://localhost:3000/",
      }),
    ),
    true,
  );

  assert.equal(
    getRouteTransitionGroup("/", "/proyectos/taquilla-cine/demo"),
    "taquilla",
  );
  assert.equal(
    getRouteTransitionGroup("/proyectos/taquilla-cine/demo", "/"),
    "taquilla",
  );
  assert.equal(
    shouldAnimateInternalNavigation(
      candidate({ href: "http://localhost:3000/proyectos/taquilla-cine/demo" }),
    ),
    true,
  );
  assert.equal(
    shouldAnimateInternalNavigation(
      candidate({
        currentPath: "/proyectos/taquilla-cine/demo",
        href: "http://localhost:3000/",
      }),
    ),
    true,
  );

  assert.equal(
    getRouteTransitionGroup(
      "/proyectos/fiore/demo",
      "/proyectos/taquilla-cine/demo",
    ),
    null,
  );
  assert.equal(
    shouldAnimateInternalNavigation(
      candidate({
        currentPath: "/proyectos/fiore/demo",
        href: "http://localhost:3000/proyectos/taquilla-cine/demo",
      }),
    ),
    false,
  );
  assert.equal(
    shouldAnimateInternalNavigation(
      candidate({
        currentPath: "/proyectos/taquilla-cine/demo",
        href: "http://localhost:3000/proyectos/fiore/demo",
      }),
    ),
    false,
  );
});

test("M5.1 · se anima la navegación interna entre las dos rutas", () => {
  assert.equal(shouldAnimateInternalNavigation(candidate()), true);
  assert.equal(
    shouldAnimateInternalNavigation(
      candidate({ currentPath: "/proyectos/fiore/demo", href: "http://localhost:3000/" }),
    ),
    true,
  );
});

test("M5.1 · no se animan enlaces externos, anclas ni clics modificados", () => {
  assert.equal(
    shouldAnimateInternalNavigation(candidate({ href: "https://electrotero.com/" })),
    false,
  );
  assert.equal(
    shouldAnimateInternalNavigation(candidate({ href: "#proyectos" })),
    false,
  );
  assert.equal(
    shouldAnimateInternalNavigation(candidate({ href: "http://localhost:3000/#proyectos" })),
    false,
  );
  assert.equal(shouldAnimateInternalNavigation(candidate({ target: "_blank" })), false);
  assert.equal(shouldAnimateInternalNavigation(candidate({ hasDownload: true })), false);
  assert.equal(shouldAnimateInternalNavigation(candidate({ metaKey: true })), false);
  assert.equal(shouldAnimateInternalNavigation(candidate({ ctrlKey: true })), false);
  assert.equal(shouldAnimateInternalNavigation(candidate({ button: 1 })), false);
  assert.equal(
    shouldAnimateInternalNavigation(candidate({ defaultPrevented: true })),
    false,
  );
});

test("M5.1 · el scroll respeta prefers-reduced-motion", () => {
  assert.equal(getSmoothScrollBehavior(false), "smooth");
  assert.equal(getSmoothScrollBehavior(true), "auto");
});
