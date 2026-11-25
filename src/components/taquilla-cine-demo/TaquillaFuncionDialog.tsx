/**
 * C5 — Formulario inline de alta y edición de funciones.
 *
 * Reproduce el panel del módulo académico original: seis campos, bloque de
 * información de cupos en edición y la nota de inicialización en el alta.
 * No envía `cuposDisponibles`: todas las reglas viven en el validador de C2.
 */

"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type {
  DemoFuncion,
  DemoPelicula,
  TaquillaDemoState,
} from "@/data/taquilla-cine-demo/types";
import { formatCOP } from "@/lib/taquilla-cine-demo/pricing";
import { selectBoletosVendidos } from "@/lib/taquilla-cine-demo/selectors";
import {
  firstIssueMessage,
  validateFuncionInput,
  type FuncionInput,
  type ValidationIssue,
} from "@/lib/taquilla-cine-demo/validation";
import styles from "./taquilla-demo.module.css";

type FuncionField =
  | "peliculaId"
  | "fecha"
  | "hora"
  | "sala"
  | "precioPesos"
  | "cuposTotales";

interface FuncionFormValues {
  peliculaId: string;
  fecha: string;
  hora: string;
  sala: string;
  precioPesos: string;
  cuposTotales: string;
}

const FUNCION_FORM_EMPTY: FuncionFormValues = {
  peliculaId: "",
  fecha: "",
  hora: "",
  sala: "",
  precioPesos: "",
  cuposTotales: "",
};

interface TaquillaFuncionDialogProps {
  funcion: DemoFuncion | null;
  peliculas: readonly DemoPelicula[];
  state: TaquillaDemoState;
  idLabel: string;
  onSave: (input: FuncionInput) => void;
  onCancel: () => void;
}

function toFuncionFormValues(funcion: DemoFuncion): FuncionFormValues {
  return {
    peliculaId: funcion.peliculaId,
    fecha: funcion.fecha,
    hora: funcion.hora,
    sala: funcion.sala,
    precioPesos: (funcion.precioCentavos / 100).toFixed(2),
    cuposTotales: String(funcion.cuposTotales),
  };
}

/** Construye exactamente las seis claves que acepta `validateFuncionInput`. */
function parseFuncionForm(values: FuncionFormValues): Record<FuncionField, unknown> {
  const precio = values.precioPesos.trim();
  const cupos = values.cuposTotales.trim();
  return {
    peliculaId: values.peliculaId,
    fecha: values.fecha,
    hora: values.hora,
    sala: values.sala,
    precioPesos: precio === "" ? 0 : Number(precio),
    cuposTotales: cupos === "" ? 0 : Number(cupos),
  };
}

function issuesPorCampo(
  issues: readonly ValidationIssue[],
): Partial<Record<FuncionField, string>> {
  const errores: Partial<Record<FuncionField, string>> = {};
  const campos: FuncionField[] = [
    "peliculaId",
    "fecha",
    "hora",
    "sala",
    "precioPesos",
    "cuposTotales",
  ];
  for (const issue of issues) {
    const campo = campos.find((candidate) => candidate === issue.field);
    if (campo && !errores[campo]) errores[campo] = issue.message;
  }
  return errores;
}

export function TaquillaFuncionDialog({
  funcion,
  peliculas,
  state,
  idLabel,
  onSave,
  onCancel,
}: TaquillaFuncionDialogProps) {
  const [values, setValues] = useState<FuncionFormValues>(() =>
    funcion ? toFuncionFormValues(funcion) : FUNCION_FORM_EMPTY,
  );
  const [errores, setErrores] = useState<Partial<Record<FuncionField, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const peliculaRef = useRef<HTMLSelectElement>(null);
  const esEdicion = funcion !== null;

  useEffect(() => {
    peliculaRef.current?.focus();
  }, []);

  function actualizar(campo: FuncionField, valor: string) {
    setValues((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resultado = validateFuncionInput(
      parseFuncionForm(values),
      state,
      funcion?.id,
    );
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

  const vendidos = funcion ? selectBoletosVendidos(state, funcion.id) : 0;

  const campos: {
    campo: Exclude<FuncionField, "peliculaId">;
    etiqueta: string;
    ayuda: string;
    tipo: "date" | "time" | "text" | "number";
    maxLength?: number;
    min?: string;
    step?: string;
    inputMode?: "decimal" | "numeric";
  }[] = [
    {
      campo: "fecha",
      etiqueta: "Fecha",
      ayuda: "Formato YYYY-MM-DD; debe ser una fecha real.",
      tipo: "date",
    },
    {
      campo: "hora",
      etiqueta: "Hora",
      ayuda: "Formato HH:mm de 24 horas.",
      tipo: "time",
    },
    {
      campo: "sala",
      etiqueta: "Sala",
      ayuda: "Obligatoria, máximo 50 caracteres.",
      tipo: "text",
      maxLength: 50,
    },
    {
      campo: "precioPesos",
      etiqueta: "Precio (COP)",
      ayuda: "Mayor que cero, máximo dos decimales; límite 9999999999.99.",
      tipo: "number",
      min: "0.01",
      step: "0.01",
      inputMode: "decimal",
    },
    {
      campo: "cuposTotales",
      etiqueta: "Cupos totales",
      ayuda: "Número entero mayor que cero; límite 2147483647.",
      tipo: "number",
      min: "1",
      step: "1",
      inputMode: "numeric",
    },
  ];

  return (
    <section
      className={styles.funcionPanel}
      aria-labelledby="taquilla-formulario-funcion-titulo"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.panelCabecera}>
        <div>
          <h3 id="taquilla-formulario-funcion-titulo" className={styles.panelTitle}>
            {esEdicion ? "Editar función" : "Nueva función"}
          </h3>
          <p className={styles.panelNote}>
            {esEdicion
              ? "Modifica los datos y guarda los cambios."
              : "Completa los datos para programar una nueva función."}
          </p>
        </div>
        <span className={styles.placeholderBadge}>{idLabel}</span>
      </div>

      <form className={styles.funcionForm} onSubmit={handleSubmit} noValidate>
        <p className={styles.panelNote}>
          Los campos marcados con <span aria-hidden="true">*</span> son obligatorios.
        </p>

        {errorGeneral ? (
          <p className={styles.fieldError} role="alert">
            {errorGeneral}
          </p>
        ) : null}

        {esEdicion && funcion ? (
          <div className={styles.infoCupos} role="region" aria-label="Información de cupos">
            <dl>
              <div>
                <dt>Cupos totales actuales</dt>
                <dd>{funcion.cuposTotales}</dd>
              </div>
              <div>
                <dt>Cupos disponibles</dt>
                <dd className={styles.destacado}>{funcion.cuposDisponibles}</dd>
              </div>
              <div>
                <dt>Boletos vendidos</dt>
                <dd>{vendidos}</dd>
              </div>
            </dl>
            <p className={styles.fieldHelp}>
              Precio actual: {formatCOP(funcion.precioCentavos)}. Al modificar la capacidad, los
              cupos disponibles se recalculan como nuevos cupos totales menos boletos vendidos.
            </p>
          </div>
        ) : (
          <p className={styles.fieldHelp}>
            Al crear la función, los cupos disponibles se inicializarán igual a los cupos totales.
          </p>
        )}

        <div className={styles.formFields}>
          <div
            className={`${styles.formField} ${styles.formFieldWide} ${
              errores.peliculaId ? styles.formFieldError : ""
            }`}
          >
            <label htmlFor="taquilla-funcion-peliculaId">
              Película <span aria-hidden="true">*</span>
            </label>
            <select
              ref={peliculaRef}
              id="taquilla-funcion-peliculaId"
              name="peliculaId"
              value={values.peliculaId}
              onChange={(event) => actualizar("peliculaId", event.target.value)}
              required
              aria-invalid={errores.peliculaId ? true : undefined}
              aria-describedby={
                errores.peliculaId
                  ? "taquilla-funcion-peliculaId-ayuda taquilla-funcion-peliculaId-error"
                  : "taquilla-funcion-peliculaId-ayuda"
              }
            >
              <option value="" disabled>
                Seleccione una película
              </option>
              {peliculas.map((pelicula) => (
                <option key={pelicula.id} value={pelicula.id}>
                  {pelicula.titulo} ({pelicula.clasificacion})
                </option>
              ))}
            </select>
            <p id="taquilla-funcion-peliculaId-ayuda" className={styles.fieldHelp}>
              {peliculas.length === 0
                ? "No hay películas registradas. Primero debe crear una en el módulo de Películas."
                : "Seleccione la película para esta función."}
            </p>
            {errores.peliculaId ? (
              <p id="taquilla-funcion-peliculaId-error" className={styles.fieldError}>
                {errores.peliculaId}
              </p>
            ) : null}
          </div>

          {campos.map(({ campo, etiqueta, ayuda, tipo, maxLength, min, step, inputMode }) => {
            const id = `taquilla-funcion-${campo}`;
            const error = errores[campo];
            return (
              <div
                key={campo}
                className={`${styles.formField} ${error ? styles.formFieldError : ""}`}
              >
                <label htmlFor={id}>
                  {etiqueta} <span aria-hidden="true">*</span>
                </label>
                <input
                  id={id}
                  name={campo}
                  type={tipo}
                  value={values[campo]}
                  onChange={(event) => actualizar(campo, event.target.value)}
                  maxLength={maxLength}
                  min={min}
                  step={step}
                  inputMode={inputMode}
                  autoComplete="off"
                  required
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-ayuda ${id}-error` : `${id}-ayuda`}
                />
                <p id={`${id}-ayuda`} className={styles.fieldHelp}>
                  {ayuda}
                </p>
                {error ? (
                  <p id={`${id}-error`} className={styles.fieldError}>
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={`${styles.button} ${styles.buttonReset}`}>
            Guardar
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
