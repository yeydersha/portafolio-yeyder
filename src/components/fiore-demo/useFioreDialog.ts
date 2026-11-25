/**
 * B4 — Comportamiento común de los diálogos nuevos de la demo.
 *
 * Replica las garantías del diálogo de reinicio (Escape, trap de foco y
 * restauración del disparador) sin modificar B1. Cada diálogo decide qué
 * elemento recibe el foco inicial pasándolo como primer.focusable del DOM.
 */

"use client";

import { useEffect, type RefObject } from "react";

export const FIORE_FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFioreDialog(
  dialogRef: RefObject<HTMLElement | null>,
  onCancel: () => void,
): void {
  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const firstField = dialog?.querySelector<HTMLElement>(FIORE_FOCUSABLE);
    (firstField ?? dialog)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FIORE_FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      /* Si el foco quedó fuera (por ejemplo al volver de la confirmación), se
       * devuelve al diálogo en lugar de permitir Tab sobre el fondo. */
      if (active === null || !dialogRef.current.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

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
      previouslyFocused?.focus();
    };
  }, [dialogRef, onCancel]);
}
