/**
 * C5 — Vista interactiva de Funciones y cupos.
 *
 * Sustituye únicamente la vista provisional de este bloque. El estado compartido
 * sigue en `TaquillaDemo`; aquí solo viven la búsqueda, el formulario abierto,
 * la confirmación inline y la ficha. Toda mutación pasa por `onAction`, que
 * llama al reducer puro de C2. Los cupos visibles se derivan, nunca se editan.
 */

"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { DemoFuncion, TaquillaDemoState } from "@/data/taquilla-cine-demo/types";
import { buildFuncionesView, type FuncionViewItem } from "@/lib/taquilla-cine-demo/funciones-view";
import {
  type TaquillaDemoAction,
  type TaquillaDemoActionResult,
} from "@/lib/taquilla-cine-demo/reducer";
import { DEMO_ID_PREFIXES, type FuncionInput } from "@/lib/taquilla-cine-demo/validation";
import { TaquillaDeleteConfirmDialog } from "./TaquillaDeleteConfirmDialog";
import { TaquillaFuncionDialog } from "./TaquillaFuncionDialog";
import type { TaquillaNavItem } from "./taquilla-navigation";
import styles from "./taquilla-demo.module.css";

interface TaquillaFuncionesViewProps {
  item: TaquillaNavItem;
  state: TaquillaDemoState;
  onAction: (action: TaquillaDemoAction) => TaquillaDemoActionResult;
}

type FormaFuncion =
  | { kind: "crear" }
  | { kind: "editar"; funcion: DemoFuncion }
  | null;

interface Feedback {
  kind: "success" | "error";
  message: string;
}

/** Siguiente ID libre con prefijo `demo-fun-`, sin reloj ni azar. */
function nextFuncionId(state: TaquillaDemoState): string {
  let mayor = 0;
  const ids = [
    ...state.peliculas.map((item) => item.id),
    ...state.funciones.map((item) => item.id),
    ...state.compras.map((item) => item.id),
  ];
  for (const id of ids) {
    const coincidencia = /^demo-fun-(\d+)$/.exec(id);
    if (coincidencia) mayor = Math.max(mayor, Number(coincidencia[1]));
  }
  return `${DEMO_ID_PREFIXES.funcion}${String(mayor + 1).padStart(3, "0")}`;
}

/** Indicadores del original: sin sufijo, `(POCOS)` o `(AGOTADA)`. */
function etiquetaCupos(funcion: FuncionViewItem): string {
  if (funcion.estadoCupos === "agotada") return `${funcion.cuposDisponibles} (AGOTADA)`;
  if (funcion.estadoCupos === "pocos") return `${funcion.cuposDisponibles} (POCOS)`;
  return String(funcion.cuposDisponibles);
}

function claseCupos(funcion: FuncionViewItem): string {
  if (funcion.estadoCupos === "agotada") return styles.cuposAgotados ?? "";
  if (funcion.estadoCupos === "pocos") return styles.cuposPocos ?? "";
  return styles.cuposDisponibles ?? "";
}

export function TaquillaFuncionesView({
  item,
  state,
  onAction,
}: TaquillaFuncionesViewProps) {
  const [query, setQuery] = useState("");
  const [forma, setForma] = useState<FormaFuncion>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const nuevaRef = useRef<HTMLButtonElement>(null);
  const retornoFormulario = useRef<HTMLElement | null>(null);
  const retornoDetalle = useRef<HTMLButtonElement | null>(null);
  const retornoFilaPendiente = useRef<string | null>(null);

  const vista = useMemo(() => buildFuncionesView(state, { query }), [state, query]);
  // La ficha se deriva de la vista sin filtrar: escribir en el buscador no debe
  // cerrar el panel ni dejar su identificador activo sin contenido visible.
  const todasLasFunciones = useMemo(() => buildFuncionesView(state).items, [state]);
  const detalle = detalleId
    ? (todasLasFunciones.find((funcion) => funcion.id === detalleId) ?? null)
    : null;
  const idSiguiente = nextFuncionId(state);

  function abrirCreacion(event: MouseEvent<HTMLButtonElement>) {
    retornoFormulario.current = event.currentTarget;
    setFeedback(null);
    setForma({ kind: "crear" });
  }

  function abrirEdicion(
    funcion: DemoFuncion,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    retornoFormulario.current = event.currentTarget;
    setFeedback(null);
    setForma({ kind: "editar", funcion });
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
    const fila = document.querySelector(`tr[data-funcion-id="${id}"]`);
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

  function guardar(input: FuncionInput) {
    if (!forma) return;
    const id = forma.kind === "crear" ? idSiguiente : forma.funcion.id;
    const resultado = onAction({
      type: forma.kind === "crear" ? "CREAR_FUNCION" : "EDITAR_FUNCION",
      id,
      input,
    });
    if (resultado.error) {
      setFeedback({ kind: "error", message: resultado.error });
      return;
    }
    const titulo = state.peliculas.find((pelicula) => pelicula.id === input.peliculaId)?.titulo;
    setFeedback({
      kind: "success",
      message:
        forma.kind === "crear"
          ? `Función de «${titulo ?? input.peliculaId}» programada con ${input.cuposTotales} cupos.`
          : `Función de «${titulo ?? input.peliculaId}» actualizada.`,
    });
    setForma(null);
    retornoFormulario.current?.focus();
  }

  function pedirEliminacion(funcion: FuncionViewItem) {
    setFeedback(null);
    setConfirmandoId(funcion.id);
  }

  function cancelarEliminacion(id: string) {
    retornoFilaPendiente.current = id;
    setConfirmandoId(null);
  }

  function confirmarEliminacion(funcion: FuncionViewItem) {
    const resultado = onAction({ type: "ELIMINAR_FUNCION", id: funcion.id });
    setConfirmandoId(null);
    if (resultado.error) {
      setFeedback({ kind: "error", message: resultado.error });
      retornoFilaPendiente.current = funcion.id;
      return;
    }
    setFeedback({
      kind: "success",
      message: `Función ${funcion.id} eliminada de la programación.`,
    });
    if (detalleId === funcion.id) setDetalleId(null);
    nuevaRef.current?.focus();
  }

  const totalFunciones = state.funciones.length;

  return (
    <div className={styles.mainContent}>
      <header className={styles.viewHeader}>
        <span className={styles.eyebrow}>{item.block} · Programación</span>
        <h2 className={styles.viewTitle}>Funciones</h2>
        <p className={styles.viewSubtitle}>
          Organiza los horarios, las salas y los cupos de cada película con datos ficticios.
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
        <TaquillaFuncionDialog
          key={forma.kind === "editar" ? `editar-${forma.funcion.id}` : "crear"}
          funcion={forma.kind === "editar" ? forma.funcion : null}
          peliculas={state.peliculas}
          state={state}
          idLabel={forma.kind === "editar" ? `ID ${forma.funcion.id}` : `ID ${idSiguiente}`}
          onSave={guardar}
          onCancel={cerrarFormulario}
        />
      ) : null}

      {detalle ? (
        <section className={styles.funcionPanel} aria-labelledby="taquilla-detalle-funcion-titulo">
          <div className={styles.panelCabecera}>
            <div>
              <h3 id="taquilla-detalle-funcion-titulo" className={styles.panelTitle}>
                Detalle de la función
              </h3>
              <p className={styles.panelNote}>Ficha de la programación ficticia de la demo.</p>
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
              <dt>Película</dt>
              <dd>{detalle.tituloPelicula}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Fecha</dt>
              <dd>{detalle.fecha}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Hora</dt>
              <dd>{detalle.hora}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Sala</dt>
              <dd>{detalle.sala}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Precio</dt>
              <dd>{detalle.precioFormateado}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Cupos totales</dt>
              <dd>{detalle.cuposTotales}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Cupos disponibles</dt>
              <dd className={styles.destacado}>{etiquetaCupos(detalle)}</dd>
            </div>
            <div className={styles.ficha}>
              <dt>Boletos vendidos</dt>
              <dd>{detalle.vendidos}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className={styles.funcionPanel} aria-labelledby="taquilla-programacion-titulo">
        <div className={styles.panelCabecera}>
          <div>
            <h3 id="taquilla-programacion-titulo" className={styles.panelTitle}>
              Programación de funciones
            </h3>
            <p className={styles.panelNote}>Datos ficticios almacenados solo en este navegador.</p>
          </div>
          <div className={styles.panelActions}>
            <span className={styles.placeholderBadge}>
              {totalFunciones} {totalFunciones === 1 ? "función" : "funciones"}
            </span>
            <button
              ref={nuevaRef}
              type="button"
              className={`${styles.button} ${styles.buttonReset}`}
              onClick={abrirCreacion}
            >
              Nueva función
            </button>
          </div>
        </div>

        <div className={styles.searchField}>
          <label htmlFor="taquilla-buscar-funciones">Buscar funciones</label>
          <input
            id="taquilla-buscar-funciones"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Película, sala, fecha u hora"
            autoComplete="off"
            aria-describedby="taquilla-buscar-funciones-ayuda"
          />
          <p id="taquilla-buscar-funciones-ayuda" className={styles.fieldHelp}>
            Búsqueda local por película, sala, fecha u hora; sin distinción de tildes.
          </p>
        </div>

        {vista.esVacio ? (
          <div className={styles.emptyState}>
            <p>{vista.mensajeVacio}</p>
          </div>
        ) : (
          <div
            className={styles.tableRegion}
            role="region"
            aria-label="Funciones programadas"
            tabIndex={0}
          >
            <table className={styles.funcionTable}>
              <caption className={styles.tableCaption}>
                Funciones programadas · ordenadas por fecha y hora
              </caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Película</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Hora</th>
                  <th scope="col">Sala</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Cupos tot.</th>
                  <th scope="col">Cupos disp.</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vista.items.map((funcion) => (
                  <tr key={funcion.id} data-funcion-id={funcion.id}>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        ID
                      </span>
                      <span className={styles.mono}>{funcion.id}</span>
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Película
                      </span>
                      <span className={styles.funcionTitulo}>{funcion.tituloPelicula}</span>
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Fecha
                      </span>
                      {funcion.fecha}
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Hora
                      </span>
                      {funcion.hora}
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Sala
                      </span>
                      {funcion.sala}
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Precio
                      </span>
                      {funcion.precioFormateado}
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Cupos tot.
                      </span>
                      {funcion.cuposTotales}
                    </td>
                    <td>
                      <span className={styles.cellLabel} aria-hidden="true">
                        Cupos disp.
                      </span>
                      <span className={claseCupos(funcion)}>{etiquetaCupos(funcion)}</span>
                    </td>
                    <td className={styles.actionsCell}>
                      {confirmandoId === funcion.id ? (
                        <TaquillaDeleteConfirmDialog
                          titulo={`función de «${funcion.tituloPelicula}» del ${funcion.fecha} a las ${funcion.hora}`}
                          onConfirm={() => confirmarEliminacion(funcion)}
                          onCancel={() => cancelarEliminacion(funcion.id)}
                        />
                      ) : (
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                            aria-label={`Consultar ${funcion.tituloPelicula} ${funcion.fecha} ${funcion.hora}`}
                            onClick={(event) => {
                              retornoDetalle.current = event.currentTarget;
                              setFeedback(null);
                              setDetalleId(funcion.id);
                            }}
                          >
                            Consultar
                          </button>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                            aria-label={`Editar ${funcion.tituloPelicula} ${funcion.fecha} ${funcion.hora}`}
                            onClick={(event) => abrirEdicion(funcion, event)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonDangerGhost} ${styles.buttonSmall}`}
                            aria-label={`Eliminar ${funcion.tituloPelicula} ${funcion.fecha} ${funcion.hora}`}
                            onClick={() => pedirEliminacion(funcion)}
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
