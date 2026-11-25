/**
 * C2 — Persistencia local versionada y aislada de la demo de Taquilla.
 *
 * Clave propia: `yeyder.taquilla-cine.demo.v1`. No importa ni reutiliza nada
 * de Fiore. `saveTaquillaState` se niega a escribir hasta que la lectura de
 * hidratación haya resuelto, incluso si no había datos guardados.
 */

import type { TaquillaDemoState } from "../../data/taquilla-cine-demo/types";
import { validateDemoState } from "./validation";

export const TAQUILLA_STORAGE_KEY = "yeyder.taquilla-cine.demo.v1";

export interface TaquillaStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type TaquillaLoadResult =
  | { status: "empty"; reason?: string }
  | { status: "ok"; state: TaquillaDemoState }
  | { status: "invalid"; reason: string };

let hydrationResolved = false;

function getTarget(candidate?: TaquillaStorageLike | null): TaquillaStorageLike | null {
  if (candidate !== undefined) return candidate;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeRemove(target: TaquillaStorageLike | null): void {
  if (!target) return;
  try {
    target.removeItem(TAQUILLA_STORAGE_KEY);
  } catch {
    // Almacenamiento bloqueado: la demo continúa solo en memoria.
  }
}

/**
 * Lee y valida el estado persistido. Siempre abre la compuerta de escritura,
 * incluso cuando no hay datos, JSON corrupto o almacenamiento bloqueado.
 */
export function loadTaquillaState(
  storage?: TaquillaStorageLike | null,
): TaquillaLoadResult {
  const target = getTarget(storage);
  if (!target) {
    hydrationResolved = true;
    return { status: "empty", reason: "Almacenamiento no disponible; se usa la semilla" };
  }

  let raw: string | null;
  try {
    raw = target.getItem(TAQUILLA_STORAGE_KEY);
  } catch {
    hydrationResolved = true;
    return { status: "empty", reason: "Almacenamiento bloqueado; se usa la semilla" };
  }
  hydrationResolved = true;

  if (raw === null) return { status: "empty" };

  try {
    const parsed: unknown = JSON.parse(raw);
    const validacion = validateDemoState(parsed);
    if (!validacion.ok) {
      safeRemove(target);
      return {
        status: "invalid",
        reason: "Estado persistido inválido; se restauró la semilla",
      };
    }
    return { status: "ok", state: validacion.value };
  } catch {
    safeRemove(target);
    return {
      status: "invalid",
      reason: "Estado persistido ilegible; se restauró la semilla",
    };
  }
}

/** Escribe solo después de la hidratación y solo si el estado sigue siendo válido. */
export function saveTaquillaState(
  state: TaquillaDemoState,
  storage?: TaquillaStorageLike | null,
): boolean {
  if (!hydrationResolved) return false;
  const target = getTarget(storage);
  if (!target) return false;
  if (!validateDemoState(state).ok) return false;

  try {
    target.setItem(TAQUILLA_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Elimina únicamente la clave de Taquilla. */
export function clearTaquillaState(storage?: TaquillaStorageLike | null): void {
  safeRemove(getTarget(storage));
}

export function isTaquillaHydrationResolved(): boolean {
  return hydrationResolved;
}

/** Solo para pruebas y para montajes aislados: cierra la compuerta de escritura. */
export function resetTaquillaHydrationGate(): void {
  hydrationResolved = false;
}
