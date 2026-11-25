/**
 * M6 — Contenido profesional verificable sin depender de React ni Next.js.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";

import {
  contactContent,
  homepageSectionOrder,
  processContent,
  processStages,
  technologiesContent,
  technologyCategories,
} from "../src/data/professional-content";

test("M6 · el orden de las secciones conserva presentación y proyectos", () => {
  assert.deepEqual([...homepageSectionOrder], [
    "presentacion",
    "proyectos",
    "tecnologias",
    "proceso",
    "contacto",
  ]);
});

test("M6 · las cuatro categorías contienen solo tecnologías documentadas", () => {
  assert.deepEqual(
    technologyCategories.map((category) => [category.id, category.title, [...category.technologies]]),
    [
      ["web", "Desarrollo web", ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Angular"]],
      ["backend", "Backend", ["Java", "Spring Boot", "APIs REST"]],
      ["databases", "Bases de datos", ["PostgreSQL", "MongoDB", "SQL"]],
      ["tools", "Herramientas", ["Git", "GitHub", "Visual Studio Code"]],
    ],
  );
});

test("M6 · la descripción de tecnologías enmarca el uso como formativo", () => {
  assert.equal(technologiesContent.title, "Tecnologías y herramientas");
  assert.equal(
    technologiesContent.description,
    "Herramientas que he utilizado durante mi formación y en el desarrollo de proyectos académicos y personales.",
  );
});

test("M6 · el proceso tiene cuatro etapas con el texto aprobado", () => {
  assert.equal(processContent.title, "Mi proceso de desarrollo");
  assert.deepEqual(
    processStages.map((stage) => [stage.number, stage.title, stage.description]),
    [
      [
        "01",
        "Planificación",
        "Defino el objetivo del proyecto, identifico sus funcionalidades y organizo las tareas antes de comenzar.",
      ],
      [
        "02",
        "Diseño",
        "Organizo las pantallas y los componentes, buscando interfaces claras, consistentes y adaptables a diferentes dispositivos.",
      ],
      [
        "03",
        "Desarrollo",
        "Implemento las funcionalidades por etapas, integrando interfaces, validaciones y gestión de datos según las necesidades del proyecto.",
      ],
      [
        "04",
        "Pruebas y mejoras",
        "Compruebo el funcionamiento, reviso posibles errores y realizo ajustes antes de considerar una funcionalidad terminada.",
      ],
    ],
  );
});

test("M6 · contacto usa enlaces reales y no expone descarga inventada", () => {
  assert.equal(contactContent.title, "¿Hablamos?");
  assert.equal(contactContent.email, "yeyderotero@gmail.com");
  assert.equal(contactContent.githubUrl, "https://github.com/yeydersha");
  assert.equal(contactContent.emailAction, "Enviar correo");
  assert.equal(contactContent.githubAction, "Ver GitHub");

  const serialized = JSON.stringify(contactContent);
  assert.equal(serialized.includes("pdf"), false);
  assert.equal(serialized.includes("descargar"), false);
  assert.equal(serialized.includes("hoja-de-vida"), false);
});

test("M6 · no hay niveles, porcentajes ni credenciales inventadas", () => {
  const serialized = JSON.stringify([
    technologiesContent,
    processContent,
    contactContent,
    technologyCategories,
    processStages,
  ]);
  for (const phrase of [
    "Experto",
    "experto",
    "Avanzado",
    "avanzado",
    "Intermedio",
    "intermedio",
    "%",
    "años de experiencia",
    "certificación",
    "certificado",
  ]) {
    assert.equal(serialized.includes(phrase), false, `No debe aparecer: ${phrase}`);
  }
});
