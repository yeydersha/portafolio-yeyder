/**
 * C6 — Formulario inline de compras simuladas.
 *
 * Sigue el patrón de C4/C5: el estado compartido vive en `TaquillaDemo`, aquí
 * solo se editan los tres campos que acepta `validateCompraInput`. El precio,
 * los cupos y el total estimado se derivan; la fecha y el ID se preparan fuera.
 */

"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { TaquillaDemoState } from "@/data/taquilla-cine-demo/types";
import type { OpcionCompra } from "@/lib/taquilla-cine-demo/compras-view";
import { calculatePurchaseTotalCents, formatCOP } from "@/lib/taquilla-cine-demo/pricing";
import {
  firstIssueMessage,
  validateCompraInput,
  type CompraInput,
  type ValidationIssue,
} from "@/lib/taquilla-cine-demo/validation";
import styles from "./taquilla-demo.module.css";

type CampoCompra = "funcionId" | "nombreCliente" | "cantidadBoletos";

interface CompraFormValues {
  funcionId: string;
  nombreCliente: string;
  cantidadBoletos: string;
}

const COMPRA_FORM_EMPTY: CompraFormValues = {
  funcionId: "",
  nombreCliente: "",
  cantidadBoletos: "1",
};

interface TaquillaCompraDialogProps {
  state: TaquillaDemoState;
  opciones: readonly OpcionCompra[];
  idLabel: string;
  onSave: (input: CompraInput) => void;
  onCancel: () => void;
}

function issuesPorCampo(
  issues: readonly ValidationIssue[],
): Partial<Record<CampoCompra, string>> {
  const errores: Partial<Record<CampoCompra, string>> = {};
  const campos: CampoCompra[] = ["funcionId", "nombreCliente", "cantidadBoletos"];
  for (const issue of issues) {
    const campo = campos.find((candidate) => candidate === issue.field);
    if (campo && !errores[campo]) errores[campo] = issue.message;
  }
  return errores;
}

function parseCompraForm(values: CompraFormValues): Record<string, unknown> {
  const cantidad = values.cantidadBoletos.trim();
  return {
    funcionId: values.funcionId,
    nombreCliente: values.nombreCliente,
    cantidadBoletos: cantidad === "" ? 0 : Number(cantidad),
  };
}

export function TaquillaCompraDialog({
  state,
  opciones,
  idLabel,
  onSave,
  onCancel,
}: TaquillaCompraDialogProps) {
  const [values, setValues] = useState<CompraFormValues>(COMPRA_FORM_EMPTY);
  const [errores, setErrores] = useState<Partial<Record<CampoCompra, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const funcionRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    funcionRef.current?.focus();
  }, []);

  const seleccion = opciones.find((opcion) => opcion.id === values.funcionId) ?? null;
  const cantidad = Number(values.cantidadBoletos);
  let totalEstimado: number | null = null;
  if (
    seleccion?.puedeComprar &&
    Number.isSafeInteger(cantidad) &&
    cantidad > 0 &&
    cantidad <= seleccion.cuposDisponibles
  ) {
    try {
      totalEstimado = calculatePurchaseTotalCents(seleccion.precioCentavos, cantidad);
    } catch {
      totalEstimado = null;
    }
  }

  function actualizar(campo: CampoCompra, valor: string) {
    setValues((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resultado = validateCompraInput(parseCompraForm(values), state);
    if (!resultado.ok) {
      setErrores(issuesPorCampo(resultado.issues));
      setErrorGeneral(firstIssueMessage(resultado));
      return;
    }
    setErrores({});
    setErrorGeneral(null);
    onSave(resultado.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onCancel();
    }
  }

  function idsCampo(campo: CampoCompra) {
    return {
      input: `taquilla-compra-${campo}`,
      ayuda: `taquilla-compra-${campo}-ayuda`,
      error: `taquilla-compra-${campo}-error`,
    };
  }

  function descritoPor(campo: CampoCompra): string {
    const ids = idsCampo(campo);
    return errores[campo] ? `${ids.ayuda} ${ids.error}` : ids.ayuda;
  }

  const estadoCupos = seleccion
    ? seleccion.estado === "agotada"
      ? styles.cuposAgotados
      : seleccion.estado === "pocos"
        ? styles.cuposPocos
        : styles.cuposDisponibles
    : "";

  return (
    <section
      className={styles.comprasPanel}
      aria-labelledby="taquilla-formulario-compra-titulo"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.panelCabecera}>
        <div>
          <h3 id="taquilla-formulario-compra-titulo" className={styles.panelTitle}>
            Registrar compra simulada
          </h3>
          <p className={styles.panelNote}>
            Esta operación es una simulación y no representa una compra real.
          </p>
        </div>
        <span className={styles.placeholderBadge}>{idLabel}</span>
      </div>

      <form className={styles.compraForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.formFields}>
          <div className={styles.formField}>
            <label htmlFor={idsCampo("funcionId").input}>Función</label>
            <select
              ref={funcionRef}
              id={idsCampo("funcionId").input}
              value={values.funcionId}
              onChange={(event) => actualizar("funcionId", event.target.value)}
              aria-invalid={Boolean(errores.funcionId)}
              aria-describedby={descritoPor("funcionId")}
              required
            >
              <option value="">Selecciona una función</option>
              {opciones.map((opcion) => (
                <option key={opcion.id} value={opcion.id} disabled={!opcion.puedeComprar}>
                  {opcion.etiqueta}
                </option>
              ))}
            </select>
            <p className={styles.fieldHelp} id={idsCampo("funcionId").ayuda}>
              Las funciones agotadas permanecen visibles pero no permiten comprar.
            </p>
            {errores.funcionId ? (
              <p className={styles.fieldError} id={idsCampo("funcionId").error}>
                {errores.funcionId}
              </p>
            ) : null}
          </div>

          <div className={styles.formField}>
            <label htmlFor={idsCampo("nombreCliente").input}>Cliente ficticio</label>
            <input
              id={idsCampo("nombreCliente").input}
              type="text"
              maxLength={150}
              value={values.nombreCliente}
              onChange={(event) => actualizar("nombreCliente", event.target.value)}
              aria-invalid={Boolean(errores.nombreCliente)}
              aria-describedby={descritoPor("nombreCliente")}
              placeholder="Ej.: Cliente Demo I"
              required
            />
            <p className={styles.fieldHelp} id={idsCampo("nombreCliente").ayuda}>
              Obligatorio, máximo 150 caracteres. No se solicitan datos personales reales.
            </p>
            {errores.nombreCliente ? (
              <p className={styles.fieldError} id={idsCampo("nombreCliente").error}>
                {errores.nombreCliente}
              </p>
            ) : null}
          </div>

          <div className={styles.formField}>
            <label htmlFor={idsCampo("cantidadBoletos").input}>Cantidad de boletos</label>
            <input
              id={idsCampo("cantidadBoletos").input}
              type="number"
              min={1}
              max={seleccion?.cuposDisponibles ?? 1}
              step={1}
              inputMode="numeric"
              value={values.cantidadBoletos}
              onChange={(event) => actualizar("cantidadBoletos", event.target.value)}
              aria-invalid={Boolean(errores.cantidadBoletos)}
              aria-describedby={descritoPor("cantidadBoletos")}
              required
            />
            <p className={styles.fieldHelp} id={idsCampo("cantidadBoletos").ayuda}>
              Entero positivo; no puede superar los cupos disponibles.
            </p>
            {errores.cantidadBoletos ? (
              <p className={styles.fieldError} id={idsCampo("cantidadBoletos").error}>
                {errores.cantidadBoletos}
              </p>
            ) : null}
          </div>
        </div>

        {seleccion ? (
          <div className={styles.infoCupos} aria-label="Información de la función seleccionada">
            <dl>
              <div>
                <dt>Película</dt>
                <dd>{seleccion.tituloPelicula}</dd>
              </div>
              <div>
                <dt>Fecha y hora</dt>
                <dd>
                  {seleccion.fecha} · {seleccion.hora}
                </dd>
              </div>
              <div>
                <dt>Sala</dt>
                <dd>{seleccion.sala}</dd>
              </div>
              <div>
                <dt>Precio por entrada</dt>
                <dd>{formatCOP(seleccion.precioCentavos)}</dd>
              </div>
              <div>
                <dt>Capacidad / cupos libres</dt>
                <dd className={estadoCupos}>
                  {seleccion.cuposDisponibles} disponibles
                  {seleccion.estado === "agotada"
                    ? " (AGOTADA)"
                    : seleccion.estado === "pocos"
                      ? " (POCOS)"
                      : ""}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className={styles.panelNote}>
            Selecciona una función para ver su precio, capacidad y cupos.
          </p>
        )}

        <div className={styles.totalPanel} role="status" aria-live="polite">
          <span className={styles.totalLabel}>Total estimado de la compra</span>
          <strong className={styles.totalValue}>
            {totalEstimado === null ? "—" : formatCOP(totalEstimado)}
          </strong>
          <span className={styles.totalNote}>
            Calculado en centavos COP con el precio actual de la función.
          </span>
        </div>

        {errorGeneral ? (
          <p className={styles.fieldError} role="alert">
            {errorGeneral}
          </p>
        ) : null}

        <div className={styles.formActions}>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={!seleccion?.puedeComprar}
          >
            Confirmar compra simulada
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
