/**
 * B4 — Utilidades compartidas por los formularios de catálogo y movimientos.
 *
 * Los identificadores siguen el prefijo `demo-` del contrato B0. No hay
 * dependencias nuevas ni acceso a almacenamiento.
 */

import styles from "./fiore-demo.module.css";

export function createFioreDemoId(prefix: "cat" | "sup" | "mov"): string {
  const random =
    globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 10) ??
    Math.random().toString(36).slice(2, 12);
  return `demo-${prefix}-${Date.now().toString(36)}-${random}`;
}

export function FioreFieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className={styles.fieldError} role="alert">
      {message}
    </p>
  );
}
