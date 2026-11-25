/**
 * C4 — Utilidades pequeñas y puras del formulario de películas.
 *
 * Solo convierten los valores del formulario a la forma que ya valida C2 y
 * calculan el siguiente ID ficticio de forma determinista. No validan por su
 * cuenta, no leen almacenamiento y no contienen JSX: las reglas siguen viviendo
 * en `validation.ts`.
 */

import type { DemoPelicula, TaquillaDemoState } from "@/data/taquilla-cine-demo/types";
import { DEMO_ID_PREFIXES, type ValidationIssue } from "@/lib/taquilla-cine-demo/validation";

export type PeliculaField = "titulo" | "genero" | "duracionMin" | "clasificacion";

export interface PeliculaFormValues {
  titulo: string;
  genero: string;
  duracionMin: string;
  clasificacion: string;
}

export const PELICULA_FORM_EMPTY: PeliculaFormValues = {
  titulo: "",
  genero: "",
  duracionMin: "",
  clasificacion: "",
};

export function toPeliculaFormValues(pelicula: DemoPelicula): PeliculaFormValues {
  return {
    titulo: pelicula.titulo,
    genero: pelicula.genero,
    duracionMin: String(pelicula.duracionMin),
    clasificacion: pelicula.clasificacion,
  };
}

/**
 * Construye exactamente las cuatro claves que acepta `validatePeliculaInput`.
 * El texto se deja tal cual para que C2 aplique `trim()` y sus mensajes; la
 * duración vacuosa se convierte en `0` para que el validador informe del rango.
 */
export function parsePeliculaForm(values: PeliculaFormValues): Record<PeliculaField, unknown> {
  const duracionTexto = values.duracionMin.trim();
  return {
    titulo: values.titulo,
    genero: values.genero,
    duracionMin: duracionTexto === "" ? 0 : Number(duracionTexto),
    clasificacion: values.clasificacion,
  };
}

/** Agrupa los mensajes de C2 por campo para mostrarlos junto a cada entrada. */
export function issuesByField(
  issues: readonly ValidationIssue[],
): Partial<Record<PeliculaField, string>> {
  const errores: Partial<Record<PeliculaField, string>> = {};
  for (const issue of issues) {
    if (
      (issue.field === "titulo" ||
        issue.field === "genero" ||
        issue.field === "duracionMin" ||
        issue.field === "clasificacion") &&
      !errores[issue.field]
    ) {
      errores[issue.field] = issue.message;
    }
  }
  return errores;
}

/** Siguiente ID libre con prefijo `demo-pel-`, sin reloj ni azar. */
export function nextPeliculaId(state: TaquillaDemoState): string {
  let mayor = 0;
  const ids = [
    ...state.peliculas.map((item) => item.id),
    ...state.funciones.map((item) => item.id),
    ...state.compras.map((item) => item.id),
  ];
  for (const id of ids) {
    const coincidencia = /^demo-pel-(\d+)$/.exec(id);
    if (coincidencia) mayor = Math.max(mayor, Number(coincidencia[1]));
  }
  return `${DEMO_ID_PREFIXES.pelicula}${String(mayor + 1).padStart(3, "0")}`;
}
