/**
 * C3 — Confirmación accesible del reinicio.
 *
 * La opción no destructiva recibe el foco inicial; Escape, Tab contenido y la
 * restauración del disparador se gestionan aquí sin tocar los diálogos de C4–C6.
 */

"use client";

import { useEffect, useRef } from "react";
import { TaquillaIcon } from "./TaquillaIcons";
import styles from "./taquilla-demo.module.css";

interface TaquillaResetDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const TAQUILLA_DIALOG_FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function TaquillaResetDialog({ onCancel, onConfirm }: TaquillaResetDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        // El reinicio es la capa superior: su Escape no debe cerrar también
        // un formulario o una ficha abierta detrás del diálogo.
        event.preventDefault();
        event.stopImmediatePropagation();
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(TAQUILLA_DIALOG_FOCUSABLE));
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

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
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
        aria-labelledby="taquilla-reset-title"
        aria-describedby="taquilla-reset-description"
        className={styles.dialog}
      >
        <span className={styles.dialogIcon}>
          <TaquillaIcon name="reset" className={styles.dialogIconSvg} />
        </span>
        <h2 id="taquilla-reset-title" className={styles.dialogTitle}>
          ¿Reiniciar la demo?
        </h2>
        <p id="taquilla-reset-description" className={styles.dialogText}>
          Se restaurarán las películas, funciones y compras ficticias iniciales. Los cambios guardados en este navegador se descartarán.
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
