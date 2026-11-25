/**
 * C4 — Formulario inline de alta y edición de películas.
 *
 * Reproduce el panel del módulo original sin convertirlo en una ventana modal:
 * el formulario aparece dentro de la sección, recibe el foco al abrirse y
 * permite Escape para cancelar. Todas las reglas se validan con C2.
 */

"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { DemoPelicula } from "@/data/taquilla-cine-demo/types";
import {
  firstIssueMessage,
  validatePeliculaInput,
  type PeliculaInput,
} from "@/lib/taquilla-cine-demo/validation";
import {
  issuesByField,
  parsePeliculaForm,
  PELICULA_FORM_EMPTY,
  toPeliculaFormValues,
  type PeliculaField,
  type PeliculaFormValues,
} from "./taquilla-form-utils";
import styles from "./taquilla-demo.module.css";

interface TaquillaPeliculaDialogProps {
  pelicula: DemoPelicula | null;
  idLabel: string;
  onSave: (input: PeliculaInput) => void;
  onCancel: () => void;
}

export function TaquillaPeliculaDialog({
  pelicula,
  idLabel,
  onSave,
  onCancel,
}: TaquillaPeliculaDialogProps) {
  const [values, setValues] = useState<PeliculaFormValues>(() =>
    pelicula ? toPeliculaFormValues(pelicula) : PELICULA_FORM_EMPTY,
  );
  const [errores, setErrores] = useState<Partial<Record<PeliculaField, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const tituloRef = useRef<HTMLInputElement>(null);
  const esEdicion = pelicula !== null;

  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  function actualizar(campo: PeliculaField, valor: string) {
    setValues((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resultado = validatePeliculaInput(parsePeliculaForm(values));
    if (!resultado.ok) {
      setErrores(issuesByField(resultado.issues));
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

  const campos: {
    campo: PeliculaField;
    etiqueta: string;
    ayuda: string;
    maxLength?: number;
    inputMode?: "numeric";
    ancho?: boolean;
  }[] = [
    {
      campo: "titulo",
      etiqueta: "Título",
      ayuda: "Obligatorio, máximo 150 caracteres.",
      maxLength: 150,
      ancho: true,
    },
    {
      campo: "genero",
      etiqueta: "Género",
      ayuda: "Obligatorio, máximo 80 caracteres.",
      maxLength: 80,
    },
    {
      campo: "duracionMin",
      etiqueta: "Duración en minutos",
      ayuda: "Número entero de minutos, mayor que cero.",
      inputMode: "numeric",
    },
    {
      campo: "clasificacion",
      etiqueta: "Clasificación",
      ayuda: "Obligatorio, máximo 20 caracteres.",
      maxLength: 20,
      ancho: true,
    },
  ];

  return (
    <section
      className={styles.peliculaPanel}
      aria-labelledby="taquilla-formulario-pelicula-titulo"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.panelCabecera}>
        <div>
          <h3 id="taquilla-formulario-pelicula-titulo" className={styles.panelTitle}>
            {esEdicion ? "Editar película" : "Nueva película"}
          </h3>
          <p className={styles.panelNote}>
            {esEdicion
              ? "Modifica los datos y guarda los cambios."
              : "Completa los datos para registrar una película en la cartelera."}
          </p>
        </div>
        <span className={styles.placeholderBadge}>{idLabel}</span>
      </div>

      <form className={styles.peliculaForm} onSubmit={handleSubmit} noValidate>
        <p className={styles.panelNote}>
          Los campos marcados con <span aria-hidden="true">*</span> son obligatorios.
        </p>

        {errorGeneral ? (
          <p className={styles.fieldError} role="alert">
            {errorGeneral}
          </p>
        ) : null}

        <div className={styles.formFields}>
          {campos.map(({ campo, etiqueta, ayuda, maxLength, inputMode, ancho }) => {
            const id = `taquilla-pelicula-${campo}`;
            const error = errores[campo];
            return (
              <div
                key={campo}
                className={`${styles.formField} ${ancho ? styles.formFieldWide : ""} ${
                  error ? styles.formFieldError : ""
                }`}
              >
                <label htmlFor={id}>
                  {etiqueta} <span aria-hidden="true">*</span>
                </label>
                <input
                  ref={campo === "titulo" ? tituloRef : undefined}
                  id={id}
                  name={campo}
                  type={campo === "duracionMin" ? "number" : "text"}
                  value={values[campo]}
                  onChange={(event) => actualizar(campo, event.target.value)}
                  maxLength={maxLength}
                  min={campo === "duracionMin" ? 1 : undefined}
                  step={campo === "duracionMin" ? 1 : undefined}
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
