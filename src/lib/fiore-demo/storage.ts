/**
 * B0 — Persistencia local versionada de la demo Fiore.
 *
 * La lectura se ejecuta una sola vez durante la hidratación. `saveDemoState`
 * se niega a escribir hasta que `loadDemoState` haya resuelto, para que el
 * efecto de persistencia del primer render no sobrescriba el estado recuperado.
 */

import type { FioreDemoState } from "../../data/fiore-demo/types";
import { validateDemoState } from "./validation";

export const DEMO_STORAGE_KEY = "yeyder.fiore.demo.v1";

export interface DemoStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type DemoLoadResult =
  | { status: "empty" }
  | { status: "ok"; state: FioreDemoState }
  | { status: "invalid"; reason: string };

let hydrationResolved = false;

function getTarget(candidate?: DemoStorageLike | null): DemoStorageLike | null {
  if (candidate) return candidate;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeRemove(target: DemoStorageLike): void {
  try {
    target.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Almacenamiento bloqueado: la demo continúa solo en memoria.
  }
}

/**
 * Lee y valida el estado persistido. Marca la hidratación como resuelta incluso
 * cuando no hay datos o están corruptos, para permitir escribir la semilla.
 */
export function loadDemoState(storage?: DemoStorageLike | null): DemoLoadResult {
  const target = getTarget(storage);
  if (!target) {
    hydrationResolved = true;
    return { status: "empty" };
  }

  let raw: string | null;
  try {
    raw = target.getItem(DEMO_STORAGE_KEY);
  } catch {
    hydrationResolved = true;
    return { status: "empty" };
  }
  hydrationResolved = true;

  if (raw === null) return { status: "empty" };

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = validateDemoState(parsed);
    if (!result.ok) {
      safeRemove(target);
      return { status: "invalid", reason: "Estado persistido inválido; se restauró la semilla" };
    }
    return { status: "ok", state: result.value };
  } catch {
    safeRemove(target);
    return { status: "invalid", reason: "Estado persistido ilegible; se restauró la semilla" };
  }
}

/** Escribe solo después de la hidratación y solo si el estado sigue siendo válido. */
export function saveDemoState(state: FioreDemoState, storage?: DemoStorageLike | null): boolean {
  if (!hydrationResolved) return false;

  const target = getTarget(storage);
  if (!target) return false;
  if (!validateDemoState(state).ok) return false;

  try {
    target.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Elimina la clave demo. El botón de reinicio puede usarlo antes de hidratar. */
export function clearDemoState(storage?: DemoStorageLike | null): void {
  const target = getTarget(storage);
  if (target) safeRemove(target);
}

export function isDemoHydrationResolved(): boolean {
  return hydrationResolved;
}

/** Solo para pruebas y para reiniciar el módulo entre montajes aislados. */
export function resetDemoHydrationGate(): void {
  hydrationResolved = false;
}
