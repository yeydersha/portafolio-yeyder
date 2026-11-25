/**
 * C4 — Vista interactiva de Películas.
 *
 * Sustituye únicamente la vista provisional de este bloque. El estado compartido
 * sigue en `TaquillaDemo`; aquí solo viven la búsqueda, el formulario abierto,
 * la confirmación inline y el detalle. Toda mutación pasa por `onAction`, que
 * llama al reducer puro de C2 en el contenedor.
 */

"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { DemoPelicula, TaquillaDemoState } from "@/data/taquilla-cine-demo/types";
import {
  type TaquillaDemoAction,
  type TaquillaDemoActionResult,
} from "@/lib/taquilla-cine-demo/reducer";
import { buildPeliculasView } from "@/lib/taquilla-cine-demo/peliculas-view";
import { selectFuncionesConTitulo } from "@/lib/taquilla-cine-demo/selectors";
import type { PeliculaInput } from "@/lib/taquilla-cine-demo/validation";
import { TaquillaDeleteConfirmDialog } from "./TaquillaDeleteConfirmDialog";
import type { TaquillaNavItem } from "./taquilla-navigation";
import { TaquillaPeliculaDialog } from "./TaquillaPeliculaDialog";
import { nextPeliculaId } from "./taquilla-form-utils";
import styles from "./taquilla-demo.module.css";

interface TaquillaPeliculasViewProps {
  item: TaquillaNavItem;
  state: TaquillaDemoState;
  onAction: (action: TaquillaDemoAction) => TaquillaDemoActionResult;
}

type FormaPelicula =
  | { kind: "crear" }
  | { kind: "editar"; pelicula: DemoPelicula }
  | null;

interface Feedback {
  kind: "success" | "error";
  message: string;
}

export function TaquillaPeliculasView({
  item,
  state,
  onAction,
}: TaquillaPeliculasViewProps) {
  const [query, setQuery] = useState("");
  const [forma, setForma] = useState<FormaPelicula>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const nuevaRef = useRef<HTMLButtonElement>(null);
  const retornoFormulario = useRef<HTMLElement | null>(null);
  const retornoDetalle = useRef<HTMLButtonElement | null>(null);
  const retornoFilaPendiente = useRef<string | null>(null);

  const vista = useMemo(() => buildPeliculasView(state, { query }), [state, query]);
  const funcionesPorPelicula = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const funcion of selectFuncionesConTitulo(state)) {
      conteo.set(funcion.peliculaId, (conteo.get(funcion.peliculaId) ?? 0) + 1);
    }
    return conteo;
  }, [state]);

  const detalle = detalleId
    ? (state.peliculas.find((pelicula) => pelicula.id === detalleId) ?? null)
    : null;
  const idSiguiente = nextPeliculaId(state);

  function abrirCreacion(event: MouseEvent<HTMLButtonElement>) {
    retornoFormulario.current = event.currentTarget;
    setFeedback(null);
    setForma({ kind: "crear" });
  }

  function abrirEdicion(
    pelicula: DemoPelicula,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    retornoFormulario.current = event.currentTarget;
    setFeedback(null);
    setForma({ kind: "editar", pelicula });
  }

  function cerrarFormulario() {
    setForma(null);
    retornoFormulario.current?.focus();
  }

  function cerrarDetalle() {
    setDetalleId(null);
    retornoDetalle.current?.focus();
  }

  useEffect(() => {
    const id = retornoFilaPendiente.current;
    if (!id || confirmandoId) return;
    retornoFilaPendiente.current = null;
    const fila = document.querySelector(`tr[data-pelicula-id="${id}"]`);
    const boton =
      fila?.querySelector<HTMLButtonElement>('button[aria-label^="Eliminar "]') ??
      fila?.querySelector<HTMLButtonElement>("button") ??
      null;
    if (boton) boton.focus();
    else nuevaRef.current?.focus();
  }, [confirmandoId]);

  useEffect(() => {
    if (!detalleId) return;
    function alPulsar(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // El formulario o la confirmación inline son capas superiores: su
      // propio Escape debe actuar primero sin cerrar también la ficha.
      if (forma || confirmandoId) return;
      event.stopImmediatePropagation();
      setDetalleId(null);
      retornoDetalle.current?.focus();
    }
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [detalleId, forma, confirmandoId]);

  function guardar(input: PeliculaInput) {
    if (!forma) return;
    const id = forma.kind === "crear" ? idSiguiente : forma.pelicula.id;
    const resultado = onAction({
      type: forma.kind === "crear" ? "CREAR_PELICULA" : "EDITAR_PELICULA",
      id,
      input,
    });
    if (resultado.error) {
      setFeedback({ kind: "error", message: resultado.error });
      return;
    }
    setFeedback({
      kind: "success",
      message:
        forma.kind === "crear"
          ? `Película «${input.titulo}» registrada en la cartelera.`
          : `Datos de «${input.titulo}» actualizados.`,
    });
    setForma(null);
    retornoFormulario.current?.focus();
  }

  function pedirEliminacion(pelicula: DemoPelicula) {
    setFeedback(null);
    setConfirmandoId(pelicula.id);
  }

  function cancelarEliminacion(id: string) {
    retornoFilaPendiente.current = id;
    setConfirmandoId(null);
  }

  function confirmarEliminacion(pelicula: DemoPelicula) {
    const resultado = onAction({ type: "ELIMINAR_PELICULA", id: pelicula.id });
    setConfirmandoId(null);
    if (resultado.error) {
      setFeedback({ kind: "error", message: resultado.error });
      retornoFilaPendiente.current = pelicula.id;
      return;
    }
    setFeedback({
      kind: "success",
      message: `Película «${pelicula.titulo}» eliminada.`,
    });
    if (detalleId === pelicula.id) setDetalleId(null);
    nuevaRef.current?.focus();
  }

  const totalPeliculas = state.peliculas.length;

  return (
    <div className={styles.mainContent}>
      <header className={styles.viewHeader}>
        <span className={styles.eyebrow}>{item.block} · Catálogo</span>
        <h2 className={styles.viewTitle}>Películas</h2>
        <p className={styles.viewSubtitle}>
          Registra, consulta y actualiza la cartelera del cine con datos ficticios.
        </p>
      </header>

      {feedback ? (
        <div
          className={`${styles.feedback} ${
            feedback.kind === "error" ? styles.feedbackError : styles.feedbackSuccess
          }`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      ) : null}

      {forma ? (
        <TaquillaPeliculaDialog
          pelicula={forma.kind === "editar" ? forma.pelicula : null}
          idLabel={forma.kind === "editar" ? `ID ${forma.pelicula.id}` : `ID ${idSiguiente}`}
          onSave={guardar}
          onCancel={cerrarFormulario}
        />
      ) : null}

      {detalle ? (
        <section className={styles.peliculaPanel} aria-labelledby="taquilla-detalle-titulo">
          <div className={styles.panelCabecera}>
            <div>
              <h3 id="taquilla-detalle-titulo" className={styles.panelTitle}>
                Detalle de la película
              </h3>
              <p className={styles.panelNote}>Ficha de la cartelera ficticia de la demo.</p>
            </div>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
              onClick={cerrarDetalle}
            >
              Cerrar
            </button>
          </div>
          <dl className={styles.fichas}>
            <div className={styles.ficha}>
              <dt>ID</dt>
              <dd className={styles.mono}>{detalle.id}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Título</dt>
              <dd>{detalle.titulo}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Género</dt>
              <dd>{detalle.genero}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Duración</dt>
              <dd>{detalle.duracionMin} min</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Clasificación</dt>
              <dd>{detalle.clasificacion}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Funciones asociadas</dt>
              <dd>{funcionesPorPelicula.get(detalle.id) ?? 0}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className={styles.peliculaPanel} aria-labelledby="taquilla-cartelera-titulo">
        <div className={styles.panelCabecera}>
          <div>
            <h3 id="taquilla-cartelera-titulo" className={styles.panelTitle}>
              Cartelera registrada
            </h3>
            <p className={styles.panelNote}>Datos ficticios almacenados solo en este navegador.</p>
          </div>
          <div className={styles.panelActions}>
            <span className={styles.placeholderBadge}>
              {totalPeliculas} {totalPeliculas === 1 ? "película" : "películas"}
            </span>
            <button
              ref={nuevaRef}
              type="button"
              className={`${styles.button} ${styles.buttonReset}`}
              onClick={abrirCreacion}
            >
              Nueva película
            </button>
          </div>
        </div>

        <div className={styles.searchField}>
          <label htmlFor="taquilla-buscar-peliculas">Buscar películas</label>
          <input
            id="taquilla-buscar-peliculas"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Título, género o clasificación"
            autoComplete="off"
            aria-describedby="taquilla-buscar-ayuda"
          />
          <p id="taquilla-buscar-ayuda" className={styles.fieldHelp}>
            Búsqueda local por título, género o clasificación; sin distinción de tildes.
          </p>
        </div>

        {vista.esVacio ? (
          <div className={styles.emptyState}>
            <p>{vista.mensajeVacio}</p>
          </div>
        ) : (
          <div className={styles.tableRegion} role="region" aria-label="Cartelera registrada" tabIndex={0}>
            <table className={styles.peliculaTable}>
              <caption className={styles.tableCaption}>Películas registradas</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Título</th>
                  <th scope="col">Género</th>
                  <th scope="col">Duración</th>
                  <th scope="col">Clasificación</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vista.items.map((pelicula) => (
                  <tr key={pelicula.id} data-pelicula-id={pelicula.id}>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        ID
                      </span>
                      <span className={styles.mono}>{pelicula.id}</span>
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Título
                      </span>
                      {pelicula.titulo}
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Género
                      </span>
                      {pelicula.genero}
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Duración
                      </span>
                      {pelicula.duracionMin} min
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Clasificación
                      </span>
                      <span className={styles.placeholderBadge}>{pelicula.clasificacion}</span>
                    </td>
                    <td className={styles.actionsCell}>
                      {confirmandoId === pelicula.id ? (
                        <TaquillaDeleteConfirmDialog
                          titulo={pelicula.titulo}
                          onConfirm={() => confirmarEliminacion(pelicula)}
                          onCancel={() => cancelarEliminacion(pelicula.id)}
                        />
                      ) : (
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                            aria-label={`Consultar ${pelicula.titulo}`}
                            onClick={(event) => {
                              retornoDetalle.current = event.currentTarget;
                              setFeedback(null);
                              setDetalleId(pelicula.id);
                            }}
                          >
                            Consultar
                          </button>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                            aria-label={`Editar ${pelicula.titulo}`}
                            onClick={(event) => abrirEdicion(pelicula, event)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonDangerGhost} ${styles.buttonSmall}`}
                            aria-label={`Eliminar ${pelicula.titulo}`}
                            onClick={() => pedirEliminacion(pelicula)}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
