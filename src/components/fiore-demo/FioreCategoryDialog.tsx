/**
 * B4 — Diálogo accesible de alta y edición de categorías demo.
 *
 * La validación de forma y de nombres duplicados viene de `validation.ts`; el
 * guardado pasa por `applyDemoAction` en el contenedor. Desactivar una categoría
 * no elimina ni desasocia productos: se hace desde la lista, no aquí.
 */

"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import type { DemoCategory, FioreDemoAction, FioreDemoState } from "@/data/fiore-demo/types";
import type { DemoActionResult } from "@/lib/fiore-demo/reducer";
import { validateCategoryDraft } from "@/lib/fiore-demo/validation";
import { FioreFieldError, createFioreDemoId } from "./fiore-form-utils";
import { useFioreDialog } from "./useFioreDialog";
import styles from "./fiore-demo.module.css";

interface FioreCategoryDialogProps {
  state: FioreDemoState;
  category?: DemoCategory;
  onCancel: () => void;
  onCommit: (action: FioreDemoAction, successNotice: string) => DemoActionResult;
}

const DRAFT_ID = "demo-cat-borrador";

export function FioreCategoryDialog({
  state,
  category,
  onCancel,
  onCommit,
}: FioreCategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useFioreDialog(dialogRef, onCancel);

  const validation = useMemo(
    () =>
      validateCategoryDraft(
        {
          id: category?.id ?? DRAFT_ID,
          name,
          description,
          active: category?.active ?? true,
        },
        { categories: state.categories, excludeId: category?.id },
      ),
    [name, description, category, state.categories],
  );

  const errors: Record<string, string> =
    submitted && !validation.ok
      ? Object.fromEntries(
          validation.issues.map((item) => [
            item.field.replace(/^category\./, ""),
            item.message,
          ]),
        )
      : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setFormError(null);
    if (!validation.ok) return;

    const id = category?.id ?? createFioreDemoId("cat");
    const value = validation.value;
    const action: FioreDemoAction = category
      ? {
          type: "UPDATE_CATEGORY",
          id,
          patch: { name: value.name, description: value.description },
        }
      : { type: "ADD_CATEGORY", category: { ...value, id } };

    const result = onCommit(
      action,
      category ? "Categoría demo actualizada." : "Categoría demo agregada.",
    );
    if (!result.changed) {
      setFormError(result.error ?? "No se pudo guardar la categoría demo.");
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
        aria-labelledby="fiore-category-dialog-title"
        aria-describedby="fiore-category-dialog-description"
        className={`${styles.dialog} ${styles.productDialog}`}
      >
        <h2 id="fiore-category-dialog-title" className={styles.dialogTitle}>
          {category ? "Editar categoría demo" : "Nueva categoría demo"}
        </h2>
        <p id="fiore-category-dialog-description" className={styles.dialogText}>
          Las cuatro categorías originales (Anillos, Collares, Pulseras y Aretes) se conservan. Solo
          se guarda información ficticia en este navegador.
        </p>

        <form className={styles.productForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.formGrid}>
            <div className={`${styles.formField} ${styles.formFieldWide}`}>
              <label className={styles.fieldLabel} htmlFor="fiore-category-name">
                Nombre <span aria-hidden="true">*</span>
              </label>
              <input
                ref={nameRef}
                id="fiore-category-name"
                className={`${styles.control} ${errors.name ? styles.controlInvalid : ""}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "fiore-category-name-error fiore-category-name-hint" : "fiore-category-name-hint"}
                autoComplete="off"
              />
              <p id="fiore-category-name-hint" className={styles.fieldHint}>
                Obligatorio, hasta 80 caracteres. No se admiten nombres repetidos aunque cambien
                mayúsculas o espacios.
              </p>
              <FioreFieldError id="fiore-category-name-error" message={errors.name} />
            </div>

            <div className={`${styles.formField} ${styles.formFieldWide}`}>
              <label className={styles.fieldLabel} htmlFor="fiore-category-description">
                Descripción
              </label>
              <textarea
                id="fiore-category-description"
                className={`${styles.control} ${styles.textarea} ${errors.description ? styles.controlInvalid : ""}`}
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={errors.description ? "fiore-category-description-error" : undefined}
              />
              <FioreFieldError id="fiore-category-description-error" message={errors.description} />
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
              {category ? "Guardar cambios" : "Agregar categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
