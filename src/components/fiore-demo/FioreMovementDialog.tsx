/**
 * B4 — Diálogo accesible de movimientos y de venta simulada.
 *
 * El stock nunca se escribe desde la vista: se valida con
 * `validateMovementInput`, se muestra una vista previa y se pide confirmación
 * antes de despachar `RECORD_MOVEMENT`. El precio, el importe y la ganancia
 * bruta estimada salen de `pricing.ts` / `selectors.ts`; la venta se guarda con
 * `origin: "sale"` y snapshot, sin clientes, pagos ni facturas.
 */

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type {
  DemoMovementInput,
  DemoMovementType,
  FioreDemoAction,
  FioreDemoState,
} from "@/data/fiore-demo/types";
import {
  calculateGrossProfitTotal,
  calculateSaleTotal,
  formatCOP,
} from "@/lib/fiore-demo/pricing";
import type { DemoActionResult } from "@/lib/fiore-demo/reducer";
import { buildProductPricing } from "@/lib/fiore-demo/selectors";
import { validateMovementInput } from "@/lib/fiore-demo/validation";
import { FioreFieldError, createFioreDemoId } from "./fiore-form-utils";
import { useFioreDialog } from "./useFioreDialog";
import styles from "./fiore-demo.module.css";

interface FioreMovementDialogProps {
  state: FioreDemoState;
  mode: "manual" | "sale";
  onCancel: () => void;
  onCommit: (action: FioreDemoAction, successNotice: string) => DemoActionResult;
}

interface MovementFormValues {
  productId: string;
  type: DemoMovementType;
  quantity: string;
  direction: "1" | "-1";
  note: string;
}

const MOVEMENT_TYPES: readonly DemoMovementType[] = ["entry", "exit", "adjustment", "return"];
const MOVEMENT_LABELS: Record<DemoMovementType, string> = {
  entry: "Entrada",
  exit: "Salida",
  adjustment: "Ajuste",
  return: "Devolución",
};

function parseQuantity(value: string): number {
  const normalized = value.trim();
  if (normalized === "") return Number.NaN;
  return Number(normalized);
}

function signedLabel(delta: number | null): string {
  if (delta === null) return "—";
  return `${delta > 0 ? "+" : ""}${delta} und`;
}

export function FioreMovementDialog({
  state,
  mode,
  onCancel,
  onCommit,
}: FioreMovementDialogProps) {
  const isSale = mode === "sale";
  const firstProduct = state.products.find((product) => product.stock > 0) ?? state.products[0];
  const [values, setValues] = useState<MovementFormValues>({
    productId: firstProduct?.id ?? "",
    type: "entry",
    quantity: "1",
    direction: "1",
    note: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const reviewRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  useFioreDialog(dialogRef, onCancel);

  useEffect(() => {
    if (confirming) {
      confirmRef.current?.focus();
    } else if (wasConfirming.current) {
      /* "Volver a editar" desmonta el botón confirmado; el foco vuelve al
       * formulario en lugar de caer en el documento. */
      reviewRef.current?.focus();
    }
    wasConfirming.current = confirming;
  }, [confirming]);

  const selectedProduct = state.products.find((product) => product.id === values.productId);
  const pricing = selectedProduct ? buildProductPricing(selectedProduct) : undefined;
  const quantity = parseQuantity(values.quantity);
  const validQuantity = Number.isInteger(quantity) && quantity > 0;

  const movementInput: DemoMovementInput = {
    productId: values.productId,
    type: isSale ? "exit" : values.type,
    quantity,
    direction:
      !isSale && values.type === "adjustment" ? (values.direction === "-1" ? -1 : 1) : undefined,
    origin: isSale ? "sale" : "manual",
    note: values.note,
  };
  const validation = validateMovementInput(movementInput, { products: state.products });

  const unitPrice = pricing?.sellingPrice ?? 0;
  const total = isSale && validQuantity && unitPrice > 0 ? calculateSaleTotal(unitPrice, quantity) : 0;
  const estimatedProfit =
    pricing && validQuantity ? calculateGrossProfitTotal(pricing.grossProfitUnit, quantity) : 0;
  const delta = validation.ok ? validation.value.delta : null;
  const balanceAfter = validation.ok ? validation.value.product.stock + validation.value.delta : null;

  const errors: Record<string, string> =
    submitted && !validation.ok
      ? Object.fromEntries(validation.issues.map((item) => [item.field, item.message]))
      : {};

  function update<K extends keyof MovementFormValues>(field: K, value: MovementFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setFormError(null);
    if (!validation.ok) return;
    if (isSale && unitPrice <= 0) {
      setFormError("La venta simulada requiere un precio de venta positivo.");
      return;
    }
    setConfirming(true);
  }

  function handleConfirm() {
    const action: FioreDemoAction = {
      type: "RECORD_MOVEMENT",
      id: createFioreDemoId("mov"),
      createdAt: new Date().toISOString(),
      input: movementInput,
    };
    const result = onCommit(
      action,
      isSale ? "Venta simulada registrada en el historial." : "Movimiento demo registrado.",
    );
    if (!result.changed) {
      setFormError(result.error ?? "No se pudo registrar el movimiento demo.");
      setConfirming(false);
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
        aria-labelledby="fiore-movement-dialog-title"
        aria-describedby="fiore-movement-dialog-description"
        className={`${styles.dialog} ${styles.productDialog}`}
      >
        <h2 id="fiore-movement-dialog-title" className={styles.dialogTitle}>
          {isSale ? "Registrar venta demo" : "Registrar movimiento demo"}
        </h2>
        <p id="fiore-movement-dialog-description" className={styles.dialogText}>
          {isSale
            ? "Operación ficticia: no hay clientes, pagos ni facturas. El precio y el total quedan como snapshot en el historial."
            : "Toda salida o ajuste se valida antes de cambiar el stock y se documenta con un movimiento."}
        </p>

        {confirming ? (
          <div className={styles.confirmationCard} role="group" aria-labelledby="fiore-movement-confirm-title">
            <h3 id="fiore-movement-confirm-title" className={styles.calculatorTitle}>
              Confirma {isSale ? "la venta simulada" : "este movimiento"}
            </h3>
            <dl className={styles.calculatorGrid}>
              <div className={styles.calculatorItem}>
                <dt>Producto</dt>
                <dd>{selectedProduct?.name ?? "—"}</dd>
              </div>
              <div className={styles.calculatorItem}>
                <dt>Tipo</dt>
                <dd>{isSale ? "Salida (venta)" : MOVEMENT_LABELS[values.type]}</dd>
              </div>
              <div className={styles.calculatorItem}>
                <dt>Cantidad</dt>
                <dd>{validQuantity ? quantity : "—"} und</dd>
              </div>
              <div className={styles.calculatorItem}>
                <dt>Variación</dt>
                <dd>{signedLabel(delta)}</dd>
              </div>
              <div className={styles.calculatorItem}>
                <dt>Saldo posterior</dt>
                <dd>{balanceAfter === null ? "—" : `${balanceAfter} und`}</dd>
              </div>
              {isSale ? (
                <>
                  <div className={styles.calculatorItem}>
                    <dt>Precio unitario</dt>
                    <dd>{formatCOP(unitPrice)}</dd>
                  </div>
                  <div className={styles.calculatorItem}>
                    <dt>Importe snapshot</dt>
                    <dd>{formatCOP(total)}</dd>
                  </div>
                  <div className={styles.calculatorItem}>
                    <dt>Ganancia bruta estimada</dt>
                    <dd>{formatCOP(estimatedProfit)}</dd>
                  </div>
                </>
              ) : null}
            </dl>
            {isSale ? (
              <p className={styles.saleWarning} role="note">
                Venta simulada: esta operación no representa una transacción comercial real.
              </p>
            ) : null}
            <p className={styles.calculatorNote}>
              Al confirmar se actualizará el stock y se agregará un movimiento al historial.
            </p>
            {formError ? (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            ) : null}
            <div className={styles.formActions}>
              <button
                type="button"
                className={`${styles.dialogButton} ${styles.dialogButtonGhost}`}
                onClick={() => setConfirming(false)}
              >
                Volver a editar
              </button>
              <button
                ref={confirmRef}
                type="button"
                className={`${styles.dialogButton} ${styles.dialogButtonPrimary}`}
                onClick={handleConfirm}
              >
                {isSale ? "Confirmar venta simulada" : "Confirmar movimiento"}
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.productForm} onSubmit={handleSubmit} noValidate>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="fiore-movement-product">
                  Producto ficticio <span aria-hidden="true">*</span>
                </label>
                <select
                  id="fiore-movement-product"
                  className={`${styles.control} ${errors.productId ? styles.controlInvalid : ""}`}
                  value={values.productId}
                  onChange={(event) => update("productId", event.target.value)}
                  aria-invalid={errors.productId ? true : undefined}
                  aria-describedby={errors.productId ? "fiore-movement-product-error" : undefined}
                >
                  {state.products.length === 0 ? <option value="">Sin productos demo</option> : null}
                  {state.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {product.sku}
                    </option>
                  ))}
                </select>
                <FioreFieldError id="fiore-movement-product-error" message={errors.productId} />
              </div>

              {isSale ? null : (
                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="fiore-movement-type">
                    Tipo de movimiento <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="fiore-movement-type"
                    className={`${styles.control} ${errors.type ? styles.controlInvalid : ""}`}
                    value={values.type}
                    onChange={(event) => update("type", event.target.value as DemoMovementType)}
                    aria-invalid={errors.type ? true : undefined}
                    aria-describedby={errors.type ? "fiore-movement-type-error" : undefined}
                  >
                    {MOVEMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {MOVEMENT_LABELS[type]}
                      </option>
                    ))}
                  </select>
                  <FioreFieldError id="fiore-movement-type-error" message={errors.type} />
                </div>
              )}

              <div className={styles.formField}>
                <label className={styles.fieldLabel} htmlFor="fiore-movement-quantity">
                  Cantidad <span aria-hidden="true">*</span>
                </label>
                <input
                  id="fiore-movement-quantity"
                  className={`${styles.control} ${errors.quantity ? styles.controlInvalid : ""}`}
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={values.quantity}
                  onChange={(event) => update("quantity", event.target.value)}
                  aria-invalid={errors.quantity ? true : undefined}
                  aria-describedby={errors.quantity ? "fiore-movement-quantity-error" : undefined}
                />
                <FioreFieldError id="fiore-movement-quantity-error" message={errors.quantity} />
              </div>

              {!isSale && values.type === "adjustment" ? (
                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="fiore-movement-direction">
                    Dirección del ajuste <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="fiore-movement-direction"
                    className={`${styles.control} ${errors.direction ? styles.controlInvalid : ""}`}
                    value={values.direction}
                    onChange={(event) => update("direction", event.target.value as "1" | "-1")}
                    aria-invalid={errors.direction ? true : undefined}
                    aria-describedby={errors.direction ? "fiore-movement-direction-error" : undefined}
                  >
                    <option value="1">Sumar unidades</option>
                    <option value="-1">Restar unidades</option>
                  </select>
                  <FioreFieldError id="fiore-movement-direction-error" message={errors.direction} />
                </div>
              ) : null}

              <div className={`${styles.formField} ${styles.formFieldWide}`}>
                <label className={styles.fieldLabel} htmlFor="fiore-movement-note">
                  Nota
                </label>
                <textarea
                  id="fiore-movement-note"
                  className={`${styles.control} ${styles.textarea} ${errors.note ? styles.controlInvalid : ""}`}
                  rows={2}
                  value={values.note}
                  onChange={(event) => update("note", event.target.value)}
                  aria-invalid={errors.note ? true : undefined}
                  aria-describedby={errors.note ? "fiore-movement-note-error" : undefined}
                />
                <FioreFieldError id="fiore-movement-note-error" message={errors.note} />
              </div>
            </div>

            <aside className={styles.calculatorCard} aria-labelledby="fiore-movement-preview-title" aria-live="polite">
              <h3 id="fiore-movement-preview-title" className={styles.calculatorTitle}>
                {isSale ? "Desglose de la venta simulada" : "Vista previa del movimiento"}
              </h3>
              <dl className={styles.calculatorGrid}>
                <div className={styles.calculatorItem}>
                  <dt>Stock actual</dt>
                  <dd>{selectedProduct ? `${selectedProduct.stock} und` : "—"}</dd>
                </div>
                <div className={styles.calculatorItem}>
                  <dt>Variación</dt>
                  <dd>{signedLabel(delta)}</dd>
                </div>
                <div className={styles.calculatorItem}>
                  <dt>Saldo posterior</dt>
                  <dd>{balanceAfter === null ? "—" : `${balanceAfter} und`}</dd>
                </div>
                {isSale ? (
                  <>
                    <div className={styles.calculatorItem}>
                      <dt>Precio unitario</dt>
                      <dd>{formatCOP(unitPrice)}</dd>
                    </div>
                    <div className={styles.calculatorItem}>
                      <dt>Importe</dt>
                      <dd>{formatCOP(total)}</dd>
                    </div>
                    <div className={styles.calculatorItem}>
                      <dt>Ganancia bruta estimada</dt>
                      <dd>{formatCOP(estimatedProfit)}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
              <p className={styles.calculatorNote}>
                {isSale
                  ? "Precio unitario tomado de la única fuente financiera de la demo. La ganancia es estimada; el importe es solo un snapshot ilustrativo, no un ingreso realizado."
                  : "No se permite una salida mayor al stock. El cambio se aplica solo al confirmar."}
              </p>
            </aside>

            {isSale ? (
              <p className={styles.saleWarning} role="note">
                Venta simulada: esta operación no representa una transacción comercial real.
              </p>
            ) : null}

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
              <button
                ref={reviewRef}
                type="submit"
                className={`${styles.dialogButton} ${styles.dialogButtonPrimary}`}
              >
                {isSale ? "Revisar venta simulada" : "Revisar movimiento"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
