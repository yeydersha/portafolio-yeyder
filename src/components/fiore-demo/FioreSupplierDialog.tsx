/**
 * B4 — Diálogo accesible de alta y edición de proveedores ficticios.
 *
 * Solo se capturan nombre y referencia demostrativa. A diferencia del sistema
 * original, no existen campos de contacto, teléfono, correo, dirección ni datos
 * fiscales: la demo no maneja información confidencial ni real.
 */

"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import type { DemoSupplier, FioreDemoAction, FioreDemoState } from "@/data/fiore-demo/types";
import type { DemoActionResult } from "@/lib/fiore-demo/reducer";
import { validateSupplierDraft } from "@/lib/fiore-demo/validation";
import { FioreFieldError, createFioreDemoId } from "./fiore-form-utils";
import { useFioreDialog } from "./useFioreDialog";
import styles from "./fiore-demo.module.css";

interface FioreSupplierDialogProps {
  state: FioreDemoState;
  supplier?: DemoSupplier;
  onCancel: () => void;
  onCommit: (action: FioreDemoAction, successNotice: string) => DemoActionResult;
}

const DRAFT_ID = "demo-sup-borrador";

export function FioreSupplierDialog({
  state,
  supplier,
  onCancel,
  onCommit,
}: FioreSupplierDialogProps) {
  const [name, setName] = useState(supplier?.name ?? "");
  const [reference, setReference] = useState(supplier?.reference ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFioreDialog(dialogRef, onCancel);

  const validation = useMemo(
    () =>
      validateSupplierDraft(
        {
          id: supplier?.id ?? DRAFT_ID,
          name,
          reference,
          active: supplier?.active ?? true,
        },
        { suppliers: state.suppliers, excludeId: supplier?.id },
      ),
    [name, reference, supplier, state.suppliers],
  );

  const errors: Record<string, string> =
    submitted && !validation.ok
      ? Object.fromEntries(
          validation.issues.map((item) => [
            item.field.replace(/^supplier\./, ""),
            item.message,
          ]),
        )
      : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setFormError(null);
    if (!validation.ok) return;

    const id = supplier?.id ?? createFioreDemoId("sup");
    const value = validation.value;
    const action: FioreDemoAction = supplier
      ? {
          type: "UPDATE_SUPPLIER",
          id,
          patch: { name: value.name, reference: value.reference },
        }
      : { type: "ADD_SUPPLIER", supplier: { ...value, id } };

    const result = onCommit(
      action,
      supplier ? "Proveedor demo actualizado." : "Proveedor demo agregado.",
    );
    if (!result.changed) {
      setFormError(result.error ?? "No se pudo guardar el proveedor demo.");
      return;
    }
    onCancel();
  }

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
        aria-labelledby="fiore-supplier-dialog-title"
        aria-describedby="fiore-supplier-dialog-description"
        className={`${styles.dialog} ${styles.productDialog}`}
      >
        <h2 id="fiore-supplier-dialog-title" className={styles.dialogTitle}>
          {supplier ? "Editar proveedor demo" : "Nuevo proveedor demo"}
        </h2>
        <p id="fiore-supplier-dialog-description" className={styles.dialogText}>
          Proveedor inventado para la demostración. No se registran teléfonos, correos, direcciones
          ni datos fiscales.
        </p>

        <form className={styles.productForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.formGrid}>
            <div className={`${styles.formField} ${styles.formFieldWide}`}>
              <label className={styles.fieldLabel} htmlFor="fiore-supplier-name">
                Nombre <span aria-hidden="true">*</span>
              </label>
              <input
                id="fiore-supplier-name"
                className={`${styles.control} ${errors.name ? styles.controlInvalid : ""}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "fiore-supplier-name-error fiore-supplier-name-hint" : "fiore-supplier-name-hint"}
                autoComplete="off"
              />
              <p id="fiore-supplier-name-hint" className={styles.fieldHint}>
                Obligatorio, hasta 120 caracteres. No se admiten nombres repetidos aunque cambien
                mayúsculas o espacios.
              </p>
              <FioreFieldError id="fiore-supplier-name-error" message={errors.name} />
            </div>

            <div className={`${styles.formField} ${styles.formFieldWide}`}>
              <label className={styles.fieldLabel} htmlFor="fiore-supplier-reference">
                Referencia demo
              </label>
              <input
                id="fiore-supplier-reference"
                className={`${styles.control} ${errors.reference ? styles.controlInvalid : ""}`}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="DEMO-REF-D"
                aria-invalid={errors.reference ? true : undefined}
                aria-describedby={errors.reference ? "fiore-supplier-reference-error fiore-supplier-reference-hint" : "fiore-supplier-reference-hint"}
                autoComplete="off"
              />
              <p id="fiore-supplier-reference-hint" className={styles.fieldHint}>
                Opcional; si se usa debe comenzar con DEMO-.
              </p>
              <FioreFieldError id="fiore-supplier-reference-error" message={errors.reference} />
            </div>
          </div>

          {formError ? (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          ) : null}

          <div className={styles.formActions}>
            <button
              type="button"
              className={`${styles.dialogButton} ${styles.dialogButtonGhost}`}
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button type="submit" className={`${styles.dialogButton} ${styles.dialogButtonPrimary}`}>
              {supplier ? "Guardar cambios" : "Agregar proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
