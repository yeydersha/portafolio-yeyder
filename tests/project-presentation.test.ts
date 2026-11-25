/**
 * M5.1 — Pruebas de la capa de datos compartida por las presentaciones.
 * Confirma que el sistema reutilizable no altera los enlaces reales ni atribuye
 * tecnologías de la demo a los proyectos originales.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";

import {
  electroTeroProject,
  fioreProject,
  getProjectPresentation,
  portfolioProjects,
  taquillaProject,
} from "../src/data/projects";

test("M5.1 · todas las tarjetas comparten una presentación normalizada", () => {
  assert.equal(portfolioProjects.length, 3);
  for (const project of portfolioProjects) {
    const presentation = getProjectPresentation(project);
    assert.equal(presentation.id, project.id);
    assert.equal(presentation.name, project.name);
    assert.equal(presentation.status, project.status);
    assert.ok(presentation.eyebrow.length > 0);
    assert.ok(presentation.summary.length > 0);
    assert.ok(presentation.features.length > 0);
    assert.ok(presentation.technologies.length > 0);
  }
});

test("M5.1 · ElectroTero conserva su preview, URL y acciones originales", () => {
  const presentation = getProjectPresentation(electroTeroProject);
  assert.equal(presentation.preview?.kind, "static");
  assert.equal(presentation.preview?.image, "/images/electrotero-preview.jpg");
  assert.equal(presentation.url, "https://electrotero.com/");
  assert.equal(presentation.displayDomain, "electrotero.com");
  assert.deepEqual(presentation.action, {
    label: "Visitar sitio web",
    href: "https://electrotero.com/",
    external: true,
  });
  assert.deepEqual(presentation.technologies, [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "MongoDB",
    "Vercel",
  ]);
  assert.equal(presentation.problem, undefined);
});

test("M5.1 · Fiore abre su demo real y separa el stack original del demo", () => {
  const presentation = getProjectPresentation(fioreProject);
  assert.equal(presentation.type, "Sistema de gestión de inventario para joyería");
  assert.deepEqual(presentation.action, {
    label: "Explorar demo",
    href: "/proyectos/fiore/demo",
    external: false,
  });
  assert.equal(presentation.image?.src, "/images/fiore-preview.jpg");
  assert.match(presentation.note ?? "", /datos ficticios/);
  assert.match(presentation.note ?? "", /almacenamiento local/);
  for (const technology of ["Next.js 16", "React 19", "TypeScript", "PostgreSQL"]) {
    assert.ok(
      presentation.technologies.includes(technology),
      `falta tecnología original: ${technology}`,
    );
  }
  assert.ok(!presentation.technologies.includes("localStorage"));
});

test("C7 · Taquilla abre su demo real y separa el stack original del adaptador", () => {
  const presentation = getProjectPresentation(taquillaProject);
  assert.deepEqual(presentation.action, {
    label: "Explorar demo",
    href: "/proyectos/taquilla-cine/demo",
    external: false,
  });
  assert.equal(presentation.preview, undefined);
  assert.equal(presentation.image?.src, "/images/taquilla-preview.jpg");
  assert.match(presentation.note ?? "", /Angular 21, Spring Boot, Java y PostgreSQL/);
  assert.match(presentation.note ?? "", /React, TypeScript y datos ficticios locales/);
  assert.match(presentation.note ?? "", /no ejecuta el backend original/);
  assert.deepEqual(presentation.technologies, [
    "Angular 21",
    "Spring Boot",
    "Java",
    "PostgreSQL",
  ]);
  assert.ok(
    presentation.features.every(
      (feature) =>
        feature.includes("proyecto original") || feature.includes("frontend original"),
    ),
  );
});
