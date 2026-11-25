/**
 * C6 — Vista interactiva de Compras simuladas.
 *
 * Sustituye únicamente la vista provisional de este bloque. Toda mutación pasa
 * por `onAction`: la fecha se prepara aquí, en la capa cliente, y el ID se deriva
 * del estado. El reducer de C2 sigue siendo la única puerta de cambio.
 */

"use client";

import { useMemo, useRef, useState, type MouseEvent } from "react";
import type { TaquillaDemoState } from "@/data/taquilla-cine-demo/types";
import { fechaCompraBogota } from "@/lib/taquilla-cine-demo/bogota-time";
import {
  buildComprasView,
  buildOpcionesCompra,
  nextCompraId,
} from "@/lib/taquilla-cine-demo/compras-view";
import { formatCOP } from "@/lib/taquilla-cine-demo/pricing";
import {
  type TaquillaDemoAction,
  type TaquillaDemoActionResult,
} from "@/lib/taquilla-cine-demo/reducer";
import type { CompraInput } from "@/lib/taquilla-cine-demo/validation";
import { TaquillaCompraDialog } from "./TaquillaCompraDialog";
import type { TaquillaNavItem } from "./taquilla-navigation";
import styles from "./taquilla-demo.module.css";

interface TaquillaComprasViewProps {
  item: TaquillaNavItem;
  state: TaquillaDemoState;
  onAction: (action: TaquillaDemoAction) => TaquillaDemoActionResult;
}

interface Feedback {
  kind: "success" | "error";
  message: string;
}

export function TaquillaComprasView({
  item,
  state,
  onAction,
}: TaquillaComprasViewProps) {
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const abrirRef = useRef<HTMLButtonElement>(null);

  const opciones = useMemo(() => buildOpcionesCompra(state), [state]);
  const vista = useMemo(() => buildComprasView(state), [state]);
  const idSiguiente = nextCompraId(state);

  function abrirFormulario(event: MouseEvent<HTMLButtonElement>) {
    abrirRef.current = event.currentTarget;
    setFeedback(null);
    setFormularioAbierto(true);
  }

  function cerrarFormulario() {
    setFormularioAbierto(false);
    abrirRef.current?.focus();
  }

  function guardar(input: CompraInput) {
    const fechaCompra = fechaCompraBogota(new Date());
    const resultado = onAction({
      type: "REGISTRAR_COMPRA",
      id: idSiguiente,
      fechaCompra,
      input,
    });
    if (resultado.error) {
      setFeedback({ kind: "error", message: resultado.error });
      return;
    }
    setFeedback({
      kind: "success",
      message: `Compra ${idSiguiente} registrada: ${input.cantidadBoletos} boletos para ${input.nombreCliente}.`,
    });
    setFormularioAbierto(false);
    abrirRef.current?.focus();
  }

  return (
    <div className={styles.mainContent}>
      <header className={styles.viewHeader}>
        <span className={styles.eyebrow}>{item.block} · Ventas simuladas</span>
        <h2 className={styles.viewTitle}>Compras</h2>
        <p className={styles.viewSubtitle}>{item.subtitle}</p>
      </header>

      <div className={styles.simulacionNota} role="note">
        Esta operación es una simulación y no representa una compra real.
      </div>

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

      <section className={styles.comprasPanel} aria-labelledby="taquilla-nueva-compra-titulo">
        <div className={styles.panelCabecera}>
          <div>
            <h3 id="taquilla-nueva-compra-titulo" className={styles.panelTitle}>
              Nueva compra
            </h3>
            <p className={styles.panelNote}>
              Selecciona una función, indica la cantidad y confirma la venta ficticia.
            </p>
          </div>
          <button
            ref={abrirRef}
            type="button"
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonSmall}`}
            onClick={abrirFormulario}
          >
            Registrar compra
          </button>
        </div>
      </section>

      {formularioAbierto ? (
        <TaquillaCompraDialog
          key={idSiguiente}
          state={state}
          opciones={opciones}
          idLabel={`ID ${idSiguiente}`}
          onSave={guardar}
          onCancel={cerrarFormulario}
        />
      ) : null}

      <section className={styles.comprasPanel} aria-labelledby="taquilla-historial-titulo">
        <div className={styles.panelCabecera}>
          <div>
            <h3 id="taquilla-historial-titulo" className={styles.panelTitle}>
              Historial de compras
            </h3>
            <p className={styles.panelNote}>
              {vista.total} compras · {vista.boletosVendidos} boletos · {formatCOP(vista.totalRecaudadoCentavos)} en ventas simuladas.
            </p>
          </div>
        </div>

        {vista.esVacio ? (
          <div className={styles.emptyState} role="status">
            <p>{vista.mensajeVacio}</p>
          </div>
        ) : (
          <div className={styles.tableRegion}>
            <table className={styles.compraTable}>
              <caption className={styles.tableCaption}>
                Compras ficticias ordenadas por fecha de compra y ID, más recientes primero.
              </caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Función</th>
                  <th scope="col">Película</th>
                  <th scope="col">Cliente ficticio</th>
                  <th scope="col">Boletos</th>
                  <th scope="col">Total registrado</th>
                  <th scope="col">Fecha de compra</th>
                </tr>
              </thead>
              <tbody>
                {vista.items.map((compra) => (
                  <tr key={compra.id} data-compra-id={compra.id}>
                    <td>
                      <span className={styles.cellLabel}>ID</span>
                      <span className={styles.mono}>{compra.id}</span>
                    </td>
                    <td>
                      <span className={styles.cellLabel}>Función</span>
                      <span>
                        {compra.fechaFuncion} {compra.horaFuncion} · Sala {compra.sala}
                      </span>
                    </td>
                    <td>
                      <span className={styles.cellLabel}>Película</span>
                      <span>{compra.tituloPelicula}</span>
                    </td>
                    <td>
                      <span className={styles.cellLabel}>Cliente ficticio</span>
                      <span>{compra.nombreCliente}</span>
                    </td>
                    <td>
                      <span className={styles.cellLabel}>Boletos</span>
                      <span>{compra.cantidadBoletos}</span>
                    </td>
                    <td>
                      <span className={styles.cellLabel}>Total registrado</span>
                      <span>{compra.totalFormateado}</span>
                    </td>
                    <td>
                      <span className={styles.cellLabel}>Fecha de compra</span>
                      <time dateTime={compra.fechaCompra}>{compra.fechaCompra}</time>
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
