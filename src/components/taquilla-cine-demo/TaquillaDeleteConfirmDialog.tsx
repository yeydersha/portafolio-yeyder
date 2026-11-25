/**
 * C4 — Confirmación de borrado reutilizable, inline dentro de la fila.
 *
 * El original no abre una ventana modal: sustituye las acciones de la fila por
 * una confirmación roja. Se mantiene ese patrón y se añaden foco inicial en la
 * opción no destructiva y Escape para cancelar.
 */

"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import styles from "./taquilla-demo.module.css";

interface TaquillaDeleteConfirmDialogProps {
  titulo: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TaquillaDeleteConfirmDialog({
  titulo,
  onConfirm,
  onCancel,
}: TaquillaDeleteConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onCancel();
    }
  }

  return (
    <div className={styles.deleteConfirm} onKeyDown={handleKeyDown}>
      <p className={styles.deleteConfirmText} role="alert">
        ¿Eliminar «{titulo}»?
      </p>
      <div className={styles.deleteConfirmActions}>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonDanger} ${styles.buttonSmall}`}
          onClick={onConfirm}
        >
          Sí, eliminar
        </button>
        <button
          ref={cancelRef}
          type="button"
          className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
