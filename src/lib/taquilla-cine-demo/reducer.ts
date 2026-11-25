/**
 * C2 — Reducer puro de la demo de Taquilla de Cine.
 *
 * `applyDemoAction` es la única puerta de mutación: valida, calcula y devuelve
 * `{ state, changed, error? }`. No lee reloj, azar, `window` ni almacenamiento.
 * Los IDs y la fecha de compra viajan en la acción; el reducer nunca los genera.
 *
 * La atomicidad local significa una sola transición de estado en memoria. No
 * reproduce `FOR UPDATE`, bloqueos ni transacciones concurrentes del backend.
 */

import { createSeedState } from "../../data/taquilla-cine-demo/seed";
import type { TaquillaDemoState } from "../../data/taquilla-cine-demo/types";
import {
  calculateAvailableAfterCapacityChange,
  calculatePurchaseTotalCents,
  countSoldTickets,
  pricePesosToCents,
} from "./pricing";
import {
  DEMO_ID_PREFIXES,
  firstIssueMessage,
  validateCompraInput,
  validateDemoId,
  validateDemoState,
  validateFechaCompra,
  validateFuncionInput,
  validatePeliculaInput,
  type CompraInput,
  type FuncionInput,
  type PeliculaInput,
  type ValidationIssue,
} from "./validation";

export type TaquillaDemoAction =
  | { type: "HYDRATE"; state: TaquillaDemoState }
  | { type: "RESET" }
  | { type: "CREAR_PELICULA"; id: string; input: PeliculaInput }
  | { type: "EDITAR_PELICULA"; id: string; input: PeliculaInput }
  | { type: "ELIMINAR_PELICULA"; id: string }
  | { type: "CREAR_FUNCION"; id: string; input: FuncionInput }
  | { type: "EDITAR_FUNCION"; id: string; input: FuncionInput }
  | { type: "ELIMINAR_FUNCION"; id: string }
  | {
      type: "REGISTRAR_COMPRA";
      id: string;
      fechaCompra: string;
      input: CompraInput;
    };

export interface TaquillaDemoActionResult {
  state: TaquillaDemoState;
  changed: boolean;
  error?: string;
}

function unchanged(state: TaquillaDemoState, error: string): TaquillaDemoActionResult {
  return { state, changed: false, error };
}

function ids(state: TaquillaDemoState): Set<string> {
  return new Set([
    ...state.peliculas.map((item) => item.id),
    ...state.funciones.map((item) => item.id),
    ...state.compras.map((item) => item.id),
  ]);
}

/** Serialización canónica: compara contenido, no el orden de las claves. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const objeto = value as Record<string, unknown>;
    return `{${Object.keys(objeto)
      .sort()
      .map((clave) => `${JSON.stringify(clave)}:${canonical(objeto[clave])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function commit(
  state: TaquillaDemoState,
  candidato: TaquillaDemoState,
): TaquillaDemoActionResult {
  const validacion = validateDemoState(candidato);
  if (!validacion.ok) return unchanged(state, firstIssueMessage(validacion));
  const siguiente = validacion.value;
  const changed = canonical(state) !== canonical(siguiente);
  return changed ? { state: siguiente, changed: true } : { state: siguiente, changed: false };
}

function validateActionId(
  id: unknown,
  prefix: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const resultado = validateDemoId(id, prefix, "id");
  return resultado.ok
    ? { ok: true, value: resultado.value }
    : { ok: false, error: firstIssueMessage(resultado) };
}

/** Aplica una acción sin mutar el estado recibido. */
export function applyDemoAction(
  state: TaquillaDemoState,
  action: TaquillaDemoAction,
): TaquillaDemoActionResult {
  switch (action.type) {
    case "HYDRATE": {
      const validacion = validateDemoState(action.state);
      if (!validacion.ok) return unchanged(state, firstIssueMessage(validacion));
      return commit(state, validacion.value);
    }

    case "RESET": {
      return commit(state, createSeedState());
    }

    case "CREAR_PELICULA": {
      const id = validateActionId(action.id, DEMO_ID_PREFIXES.pelicula);
      if (!id.ok) return unchanged(state, id.error);
      if (ids(state).has(id.value)) {
        return unchanged(state, "El ID ya existe en la demo");
      }
      const validacion = validatePeliculaInput(action.input);
      if (!validacion.ok) return unchanged(state, firstIssueMessage(validacion));
      return commit(state, {
        ...state,
        peliculas: [...state.peliculas, { id: id.value, ...validacion.value }],
      });
    }

    case "EDITAR_PELICULA": {
      const id = validateActionId(action.id, DEMO_ID_PREFIXES.pelicula);
      if (!id.ok) return unchanged(state, id.error);
      if (!state.peliculas.some((item) => item.id === id.value)) {
        return unchanged(state, "No existe la película indicada");
      }
      const validacion = validatePeliculaInput(action.input);
      if (!validacion.ok) return unchanged(state, firstIssueMessage(validacion));
      return commit(state, {
        ...state,
        peliculas: state.peliculas.map((item) =>
          item.id === id.value ? { id: id.value, ...validacion.value } : { ...item },
        ),
      });
    }

    case "ELIMINAR_PELICULA": {
      const id = validateActionId(action.id, DEMO_ID_PREFIXES.pelicula);
      if (!id.ok) return unchanged(state, id.error);
      if (!state.peliculas.some((item) => item.id === id.value)) {
        return unchanged(state, "No existe la película indicada");
      }
      if (state.funciones.some((item) => item.peliculaId === id.value)) {
        return unchanged(
          state,
          "No se puede eliminar la película porque tiene funciones asociadas",
        );
      }
      return commit(state, {
        ...state,
        peliculas: state.peliculas.filter((item) => item.id !== id.value),
      });
    }

    case "CREAR_FUNCION": {
      const id = validateActionId(action.id, DEMO_ID_PREFIXES.funcion);
      if (!id.ok) return unchanged(state, id.error);
      if (ids(state).has(id.value)) {
        return unchanged(state, "El ID ya existe en la demo");
      }
      const validacion = validateFuncionInput(action.input, state);
      if (!validacion.ok) return unchanged(state, firstIssueMessage(validacion));
      let precioCentavos: number;
      try {
        precioCentavos = pricePesosToCents(validacion.value.precioPesos);
      } catch {
        return unchanged(state, "El precio de la función no es válido");
      }
      return commit(state, {
        ...state,
        funciones: [
          ...state.funciones,
          {
            id: id.value,
            peliculaId: validacion.value.peliculaId,
            fecha: validacion.value.fecha,
            hora: validacion.value.hora,
            sala: validacion.value.sala,
            precioCentavos,
            cuposTotales: validacion.value.cuposTotales,
            cuposDisponibles: validacion.value.cuposTotales,
          },
        ],
      });
    }

    case "EDITAR_FUNCION": {
      const id = validateActionId(action.id, DEMO_ID_PREFIXES.funcion);
      if (!id.ok) return unchanged(state, id.error);
      const existente = state.funciones.find((item) => item.id === id.value);
      if (!existente) return unchanged(state, "No existe la función indicada");
      const validacion = validateFuncionInput(action.input, state, id.value);
      if (!validacion.ok) return unchanged(state, firstIssueMessage(validacion));
      let precioCentavos: number;
      let cuposDisponibles: number;
      try {
        precioCentavos = pricePesosToCents(validacion.value.precioPesos);
      } catch {
        return unchanged(state, "El precio de la función no es válido");
      }
      try {
        cuposDisponibles = calculateAvailableAfterCapacityChange(
          validacion.value.cuposTotales,
          countSoldTickets(state.compras, id.value),
        );
      } catch (error) {
        return unchanged(state, (error as Error).message);
      }
      return commit(state, {
        ...state,
        funciones: state.funciones.map((item) =>
          item.id === id.value
            ? {
                ...item,
                peliculaId: validacion.value.peliculaId,
                fecha: validacion.value.fecha,
                hora: validacion.value.hora,
                sala: validacion.value.sala,
                precioCentavos,
                cuposTotales: validacion.value.cuposTotales,
                cuposDisponibles,
              }
            : { ...item },
        ),
      });
    }

    case "ELIMINAR_FUNCION": {
      const id = validateActionId(action.id, DEMO_ID_PREFIXES.funcion);
      if (!id.ok) return unchanged(state, id.error);
      if (!state.funciones.some((item) => item.id === id.value)) {
        return unchanged(state, "No existe la función indicada");
      }
      if (state.compras.some((item) => item.funcionId === id.value)) {
        return unchanged(state, "No se puede eliminar la función porque tiene compras asociadas");
      }
      return commit(state, {
        ...state,
        funciones: state.funciones.filter((item) => item.id !== id.value),
      });
    }

    case "REGISTRAR_COMPRA": {
      const id = validateActionId(action.id, DEMO_ID_PREFIXES.compra);
      if (!id.ok) return unchanged(state, id.error);
      if (ids(state).has(id.value)) {
        return unchanged(state, "El ID ya existe en la demo");
      }
      const fechaIssues: ValidationIssue[] = [];
      const fechaCompra = validateFechaCompra(action.fechaCompra, "fechaCompra", fechaIssues);
      if (fechaIssues.length > 0 || !fechaCompra) {
        return unchanged(state, firstIssueMessage({ ok: false, issues: fechaIssues }));
      }
      const validacion = validateCompraInput(action.input, state);
      if (!validacion.ok) return unchanged(state, firstIssueMessage(validacion));

      const funcion = state.funciones.find(
        (item) => item.id === validacion.value.funcionId,
      );
      if (!funcion) return unchanged(state, "La función indicada no existe");

      let disponibles: number;
      let totalCentavos: number;
      try {
        const vendidos = countSoldTickets(state.compras, funcion.id);
        disponibles = funcion.cuposTotales - vendidos;
      } catch (error) {
        return unchanged(state, (error as Error).message);
      }
      if (disponibles <= 0) {
        return unchanged(state, "La función seleccionada está agotada");
      }
      if (validacion.value.cantidadBoletos > disponibles) {
        return unchanged(
          state,
          `Se solicitaron ${validacion.value.cantidadBoletos} boletos, pero solo hay ${disponibles} disponibles`,
        );
      }
      try {
        totalCentavos = calculatePurchaseTotalCents(
          funcion.precioCentavos,
          validacion.value.cantidadBoletos,
        );
      } catch (error) {
        return unchanged(state, (error as Error).message);
      }

      return commit(state, {
        ...state,
        funciones: state.funciones.map((item) =>
          item.id === funcion.id
            ? { ...item, cuposDisponibles: disponibles - validacion.value.cantidadBoletos }
            : { ...item },
        ),
        compras: [
          ...state.compras,
          {
            id: id.value,
            funcionId: funcion.id,
            nombreCliente: validacion.value.nombreCliente,
            cantidadBoletos: validacion.value.cantidadBoletos,
            totalCentavos,
            fechaCompra,
          },
        ],
      });
    }

    default: {
      return unchanged(state, "Acción no reconocida");
    }
  }
}
