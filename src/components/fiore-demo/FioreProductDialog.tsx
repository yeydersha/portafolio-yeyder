/**
 * B3 — Diálogo accesible de alta y edición de productos demo.
 *
 * El formulario valida con `validateProductDraft` y calcula con
 * `calculateProductPricing`; no duplica fórmulas financieras. El guardado pasa
 * por `applyDemoAction` en el contenedor, de modo que un cambio de stock al
 * editar quede explicado por un movimiento de ajuste.
 */

"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type {
  DemoProduct,
  DemoProductStatus,
  FioreDemoAction,
  FioreDemoState,
} from "@/data/fiore-demo/types";
import { calculateProductPricing, formatCOP } from "@/lib/fiore-demo/pricing";
import type { DemoActionResult } from "@/lib/fiore-demo/reducer";
import { validateProductDraft } from "@/lib/fiore-demo/validation";
import styles from "./fiore-demo.module.css";

interface FioreProductDialogProps {
  state: FioreDemoState;
  product?: DemoProduct;
  onCancel: () => void;
  onCommit: (action: FioreDemoAction, successNotice: string) => DemoActionResult;
}

interface ProductFormValues {
  name: string;
  sku: string;
  categoryId: string;
  supplierId: string;
  description: string;
  material: string;
  color: string;
  costPrice: string;
  marginPct: string;
  manualPrice: boolean;
  manualSellingPrice: string;
  stock: string;
  status: DemoProductStatus;
}

type FormErrors = Record<string, string>;

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const percentFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPercent(value: number): string {
  return `${percentFormatter.format(value)} %`;
}

function parseNumber(value: string): number {
  const normalized = value.trim();
  if (normalized === "") return Number.NaN;
  return Number(normalized);
}

function initialValues(product?: DemoProduct): ProductFormValues {
  if (!product) {
    return {
      name: "",
      sku: "",
      categoryId: "",
      supplierId: "",
      description: "",
      material: "",
      color: "",
      costPrice: "",
      marginPct: "50",
      manualPrice: false,
      manualSellingPrice: "",
      stock: "0",
      status: "active",
    };
  }

  return {
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId ?? "",
    supplierId: product.supplierId ?? "",
    description: product.description ?? "",
    material: product.material ?? "",
    color: product.color ?? "",
    costPrice: String(product.costPrice),
    marginPct: String(product.marginPct),
    manualPrice: product.manualPrice,
    manualSellingPrice: product.manualSellingPrice === undefined ? "" : String(product.manualSellingPrice),
    stock: String(product.stock),
    status: product.status,
  };
}

function createDemoId(prefix: "prod" | "mov"): string {
  const random =
    globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 10) ??
    Math.random().toString(36).slice(2, 12);
  return `demo-${prefix}-${Date.now().toString(36)}-${random}`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className={styles.fieldError} role="alert">
      {message}
    </p>
  );
}

export function FioreProductDialog({
  state,
  product,
  onCancel,
  onCommit,
}: FioreProductDialogProps) {
  const [values, setValues] = useState<ProductFormValues>(() => initialValues(product));
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstFieldRef.current?.focus();

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
      previouslyFocused?.focus();
    };
  }, [onCancel]);

  const pricing = useMemo(() => {
    const costPrice = parseNumber(values.costPrice);
    const marginPct = parseNumber(values.marginPct);
    const stock = parseNumber(values.stock);
    const manualSellingPrice = values.manualPrice
      ? parseNumber(values.manualSellingPrice)
      : undefined;

    if (
      !Number.isInteger(costPrice) ||
      !Number.isFinite(marginPct) ||
      !Number.isInteger(stock) ||
      (values.manualPrice && !Number.isInteger(manualSellingPrice))
    ) {
      return null;
    }

    try {
      return calculateProductPricing({
        costPrice,
        marginPct,
        stock,
        manualPrice: values.manualPrice,
        manualSellingPrice,
      });
    } catch {
      return null;
    }
  }, [
    values.costPrice,
    values.marginPct,
    values.stock,
    values.manualPrice,
    values.manualSellingPrice,
  ]);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
    setFormError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validation = validateProductDraft(
      {
        name: values.name,
        sku: values.sku,
        categoryId: values.categoryId || null,
        supplierId: values.supplierId || null,
        description: values.description.trim() || undefined,
        material: values.material.trim() || undefined,
        color: values.color.trim() || undefined,
        costPrice: parseNumber(values.costPrice),
        marginPct: parseNumber(values.marginPct),
        stock: parseNumber(values.stock),
        manualPrice: values.manualPrice,
        manualSellingPrice: values.manualPrice
          ? parseNumber(values.manualSellingPrice)
          : undefined,
        status: values.status,
      },
      {
        products: state.products,
        categories: state.categories,
        suppliers: state.suppliers,
        excludeProductId: product?.id,
      },
    );

    if (!validation.ok) {
      const nextErrors: FormErrors = {};
      for (const issue of validation.issues) nextErrors[issue.field] = issue.message;
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    const now = new Date().toISOString();
    const action: FioreDemoAction = product
      ? {
          type: "UPDATE_PRODUCT",
          id: product.id,
          patch: validation.value,
          movementId:
            product.stock !== validation.value.stock ? createDemoId("mov") : undefined,
          movementCreatedAt:
            product.stock !== validation.value.stock ? now : undefined,
        }
      : {
          type: "ADD_PRODUCT",
          id: createDemoId("prod"),
          movementId: createDemoId("mov"),
          createdAt: now,
          draft: validation.value,
        };

    const result = onCommit(
      action,
      product
        ? `Producto demo "${validation.value.name}" actualizado.`
        : `Producto demo "${validation.value.name}" agregado.`,
    );

    if (!result.changed) {
      setFormError(result.error ?? "No se pudo guardar el producto demo.");
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
        aria-labelledby="fiore-product-dialog-title"
        aria-describedby="fiore-product-dialog-description"
        className={`${styles.dialog} ${styles.productDialog}`}
      >
        <h2 id="fiore-product-dialog-title" className={styles.dialogTitle}>
          {product ? "Editar producto demo" : "Nuevo producto demo"}
        </h2>
        <p id="fiore-product-dialog-description" className={styles.dialogText}>
          Todos los campos son ficticios. Solo se guardan en este navegador; no hay conexión con el
          sistema real de Fiore ni con proveedores o clientes reales.
        </p>
        {product ? (
          <p className={styles.internalId}>
            ID interno estable: <code>{product.id}</code>
          </p>
        ) : null}

        <form className={styles.productForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-name">
                Nombre <span aria-hidden="true">*</span>
              </label>
              <input
                ref={firstFieldRef}
                id="fiore-product-name"
                className={`${styles.control} ${errors.name ? styles.controlInvalid : ""}`}
                value={values.name}
                onChange={(event) => update("name", event.target.value)}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "fiore-product-name-error" : undefined}
                autoComplete="off"
              />
              <FieldError id="fiore-product-name-error" message={errors.name} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-sku">
                SKU demo <span aria-hidden="true">*</span>
              </label>
              <input
                id="fiore-product-sku"
                className={`${styles.control} ${errors.sku ? styles.controlInvalid : ""}`}
                value={values.sku}
                onChange={(event) => update("sku", event.target.value)}
                aria-invalid={errors.sku ? true : undefined}
                aria-describedby={
                  errors.sku
                    ? "fiore-product-sku-error fiore-product-sku-hint"
                    : "fiore-product-sku-hint"
                }
                autoComplete="off"
              />
              <p id="fiore-product-sku-hint" className={styles.fieldHint}>
                Formato DEMO-XXXX y único en la demo.
              </p>
              <FieldError id="fiore-product-sku-error" message={errors.sku} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-category">
                Categoría
              </label>
              <select
                id="fiore-product-category"
                className={`${styles.control} ${errors.categoryId ? styles.controlInvalid : ""}`}
                value={values.categoryId}
                onChange={(event) => update("categoryId", event.target.value)}
                aria-invalid={errors.categoryId ? true : undefined}
                aria-describedby={errors.categoryId ? "fiore-product-category-error" : undefined}
              >
                <option value="">Sin categoría</option>
                {state.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FieldError id="fiore-product-category-error" message={errors.categoryId} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-supplier">
                Proveedor ficticio
              </label>
              <select
                id="fiore-product-supplier"
                className={`${styles.control} ${errors.supplierId ? styles.controlInvalid : ""}`}
                value={values.supplierId}
                onChange={(event) => update("supplierId", event.target.value)}
                aria-invalid={errors.supplierId ? true : undefined}
                aria-describedby={errors.supplierId ? "fiore-product-supplier-error" : undefined}
              >
                <option value="">Sin proveedor</option>
                {state.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <FieldError id="fiore-product-supplier-error" message={errors.supplierId} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-material">
                Material
              </label>
              <input
                id="fiore-product-material"
                className={`${styles.control} ${errors.material ? styles.controlInvalid : ""}`}
                value={values.material}
                onChange={(event) => update("material", event.target.value)}
                aria-invalid={errors.material ? true : undefined}
                aria-describedby={errors.material ? "fiore-product-material-error" : undefined}
                autoComplete="off"
              />
              <FieldError id="fiore-product-material-error" message={errors.material} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-color">
                Color
              </label>
              <input
                id="fiore-product-color"
                className={`${styles.control} ${errors.color ? styles.controlInvalid : ""}`}
                value={values.color}
                onChange={(event) => update("color", event.target.value)}
                aria-invalid={errors.color ? true : undefined}
                aria-describedby={errors.color ? "fiore-product-color-error" : undefined}
                autoComplete="off"
              />
              <FieldError id="fiore-product-color-error" message={errors.color} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-cost">
                Costo (COP) <span aria-hidden="true">*</span>
              </label>
              <input
                id="fiore-product-cost"
                className={`${styles.control} ${errors.costPrice ? styles.controlInvalid : ""}`}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={values.costPrice}
                onChange={(event) => update("costPrice", event.target.value)}
                aria-invalid={errors.costPrice ? true : undefined}
                aria-describedby={errors.costPrice ? "fiore-product-cost-error" : undefined}
              />
              <FieldError id="fiore-product-cost-error" message={errors.costPrice} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-margin">
                % de incremento sobre costo <span aria-hidden="true">*</span>
              </label>
              <input
                id="fiore-product-margin"
                className={`${styles.control} ${errors.marginPct ? styles.controlInvalid : ""}`}
                type="number"
                min={0}
                max={500}
                step={1}
                inputMode="numeric"
                value={values.marginPct}
                onChange={(event) => update("marginPct", event.target.value)}
                aria-invalid={errors.marginPct ? true : undefined}
                aria-describedby={errors.marginPct ? "fiore-product-margin-error" : undefined}
              />
              <FieldError id="fiore-product-margin-error" message={errors.marginPct} />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-stock">
                {product ? "Stock actual" : "Stock inicial"} <span aria-hidden="true">*</span>
              </label>
              <input
                id="fiore-product-stock"
                className={`${styles.control} ${errors.stock ? styles.controlInvalid : ""}`}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={values.stock}
                onChange={(event) => update("stock", event.target.value)}
                aria-invalid={errors.stock ? true : undefined}
                aria-describedby={errors.stock ? "fiore-product-stock-error" : undefined}
              />
              <FieldError id="fiore-product-stock-error" message={errors.stock} />
              {product ? (
                <p className={styles.fieldHint}>
                  Al guardar un cambio de stock se registra un movimiento de ajuste; no se borra el
                  historial.
                </p>
              ) : null}
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-status">
                Estado
              </label>
              <select
                id="fiore-product-status"
                className={`${styles.control} ${errors.status ? styles.controlInvalid : ""}`}
                value={values.status}
                onChange={(event) =>
                  update("status", event.target.value as DemoProductStatus)
                }
                aria-invalid={errors.status ? true : undefined}
                aria-describedby={errors.status ? "fiore-product-status-error" : undefined}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              <FieldError id="fiore-product-status-error" message={errors.status} />
            </div>

            <div className={`${styles.formField} ${styles.formFieldWide}`}>
              <label className={styles.checkboxField} htmlFor="fiore-product-manual">
                <input
                  id="fiore-product-manual"
                  type="checkbox"
                  checked={values.manualPrice}
                  onChange={(event) => update("manualPrice", event.target.checked)}
                />
                <span>Usar precio manual opcional</span>
              </label>
              <p className={styles.fieldHint}>
                Si se activa, el precio final se toma del campo manual en lugar del precio sugerido.
              </p>
              {values.manualPrice ? (
                <div className={styles.manualPriceField}>
                  <label className={styles.fieldLabel} htmlFor="fiore-product-manual-price">
                    Precio manual (COP)
                  </label>
                  <input
                    id="fiore-product-manual-price"
                    className={`${styles.control} ${
                      errors.manualSellingPrice ? styles.controlInvalid : ""
                    }`}
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={values.manualSellingPrice}
                    onChange={(event) => update("manualSellingPrice", event.target.value)}
                    aria-invalid={errors.manualSellingPrice ? true : undefined}
                    aria-describedby={
                      errors.manualSellingPrice ? "fiore-product-manual-price-error" : undefined
                    }
                  />
                  <FieldError
                    id="fiore-product-manual-price-error"
                    message={errors.manualSellingPrice}
                  />
                </div>
              ) : null}
            </div>

            <div className={`${styles.formField} ${styles.formFieldWide}`}>
              <label className={styles.fieldLabel} htmlFor="fiore-product-description">
                Descripción ficticia
              </label>
              <textarea
                id="fiore-product-description"
                className={`${styles.control} ${styles.textarea}`}
                rows={2}
                value={values.description}
                onChange={(event) => update("description", event.target.value)}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={errors.description ? "fiore-product-description-error" : undefined}
              />
              <FieldError id="fiore-product-description-error" message={errors.description} />
            </div>
          </div>

          <aside
            className={styles.calculatorCard}
            aria-labelledby="fiore-product-calculator-title"
            aria-live="polite"
          >
            <h3 id="fiore-product-calculator-title" className={styles.calculatorTitle}>
              Calculadora en vivo
            </h3>
            {pricing ? (
              <dl className={styles.calculatorGrid}>
                <div className={styles.calculatorItem}>
                  <dt>Precio sugerido</dt>
                  <dd>{formatCOP(pricing.suggestedPrice)}</dd>
                </div>
                <div className={styles.calculatorItem}>
                  <dt>Precio final</dt>
                  <dd>{formatCOP(pricing.sellingPrice)}</dd>
                </div>
                <div className={styles.calculatorItem}>
                  <dt>Ganancia unitaria</dt>
                  <dd>{formatCOP(pricing.grossProfitUnit)}</dd>
                </div>
                <div className={styles.calculatorItem}>
                  <dt>Ganancia potencial según stock</dt>
                  <dd>{formatCOP(pricing.grossProfitTotal)}</dd>
                </div>
                <div className={styles.calculatorItem}>
                  <dt>Incremento sobre costo</dt>
                  <dd>{formatPercent(pricing.markupPctOnCost)}</dd>
                </div>
                <div className={styles.calculatorItem}>
                  <dt>Margen real sobre venta</dt>
                  <dd>{formatPercent(pricing.marginPctOnSale)}</dd>
                </div>
              </dl>
            ) : (
              <p className={styles.fieldHint}>
                Completa costo, incremento, stock y precio manual con valores válidos para ver el
                desglose.
              </p>
            )}
            <p className={styles.calculatorNote}>
              Proyección basada en stock y precios demo; no representa ventas efectuadas. El
              incremento sobre costo y el margen sobre venta son magnitudes distintas.
            </p>
          </aside>

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
              {product ? "Guardar cambios" : "Agregar producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
