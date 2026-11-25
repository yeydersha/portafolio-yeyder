/**
 * B1 — Diálogo de confirmación del reinicio de la demo.
 *
 * Gestiona Escape, cancelación por backdrop, trap de foco y restauración del
 * elemento que abrió el diálogo.
 */

"use client";

import { useEffect, useRef } from "react";
import { FioreIcon } from "./FioreIcons";
import styles from "./fiore-demo.module.css";

interface FioreResetDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FioreResetDialog({ onCancel, onConfirm }: FioreResetDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    /* La acción no destructiva recibe el foco inicial: Enter no debe borrar la demo. */
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onCancel]);

  return (
    <div
      className={styles.dialogBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fiore-reset-title"
        aria-describedby="fiore-reset-description"
        className={styles.dialog}
      >
        <span className={styles.dialogIcon}>
          <FioreIcon name="reset" className={styles.dialogIconSvg} />
        </span>
        <h2 id="fiore-reset-title" className={styles.dialogTitle}>
          ¿Reiniciar la demo?
        </h2>
        <p id="fiore-reset-description" className={styles.dialogText}>
          Se restaurarán los productos, categorías, proveedores y movimientos ficticios iniciales. Los cambios guardados en este navegador se descartarán.
        </p>
        <div className={styles.dialogActions}>
          <button
            ref={cancelRef}
            type="button"
            className={`${styles.dialogButton} ${styles.dialogButtonGhost}`}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`${styles.dialogButton} ${styles.dialogButtonPrimary}`}
            onClick={onConfirm}
          >
            Reiniciar demo
          </button>
        </div>
      </div>
    </div>
  );
}
