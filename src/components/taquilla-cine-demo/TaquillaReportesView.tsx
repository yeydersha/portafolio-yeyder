/**
 * C6 — Vista de Taquilla y reportes de ventas simuladas.
 *
 * Los KPIs y el detalle se calculan con `buildReporteViewFromInputs` sobre el
 * MISMO conjunto filtrado. No se guarda ninguna estadística en el estado. El
 * botón «Hoy» consulta la fecha de Bogotá solo cuando se pulsa; el rango inicial
 * es la referencia fija de la semilla, nunca la zona del dispositivo.
 */

"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { TaquillaDemoState } from "@/data/taquilla-cine-demo/types";
import { bogotaDayKey } from "@/lib/taquilla-cine-demo/bogota-time";
import {
  buildReporteViewFromInputs,
  RANGO_REPORTE_POR_DEFECTO,
} from "@/lib/taquilla-cine-demo/reportes-view";
import type { TaquillaNavItem } from "./taquilla-navigation";
import styles from "./taquilla-demo.module.css";

interface TaquillaReportesViewProps {
  item: TaquillaNavItem;
  state: TaquillaDemoState;
}

interface RangoFormulario {
  fechaDesde: string;
  fechaHasta: string;
}

export function TaquillaReportesView({ item, state }: TaquillaReportesViewProps) {
  const [rango, setRango] = useState<RangoFormulario>({ ...RANGO_REPORTE_POR_DEFECTO });
  const [aplicado, setAplicado] = useState<RangoFormulario>({ ...RANGO_REPORTE_POR_DEFECTO });

  const vista = useMemo(
    () =>
      buildReporteViewFromInputs(state, aplicado.fechaDesde, aplicado.fechaHasta),
    [state, aplicado],
  );

  function aplicarFiltros(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAplicado({ ...rango });
  }

  function aplicarHoy() {
    const hoy = bogotaDayKey(new Date());
    const siguiente = { fechaDesde: hoy, fechaHasta: hoy };
    setRango(siguiente);
    setAplicado(siguiente);
  }

  function actualizar(campo: keyof RangoFormulario, valor: string) {
    setRango((anterior) => ({ ...anterior, [campo]: valor }));
  }

  return (
    <div className={styles.mainContent}>
      <header className={styles.viewHeader}>
        <span className={styles.eyebrow}>{item.block} · Informe</span>
        <h2 className={styles.viewTitle}>Taquilla</h2>
        <p className={styles.viewSubtitle}>
          Ingresos simulados de la demo; no corresponden a transacciones reales.
        </p>
      </header>

      <section className={styles.reportesPanel} aria-labelledby="taquilla-filtros-titulo">
        <div className={styles.panelCabecera}>
          <div>
            <h3 id="taquilla-filtros-titulo" className={styles.panelTitle}>
              Rango de fechas
            </h3>
            <p className={styles.panelNote}>
              Rango inclusivo en America/Bogota (UTC-05:00).
            </p>
          </div>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
            onClick={aplicarHoy}
          >
            Hoy
          </button>
        </div>

        <form className={styles.filtroForm} onSubmit={aplicarFiltros} noValidate>
          <div className={styles.formField}>
            <label htmlFor="taquilla-reporte-desde">Desde</label>
            <input
              id="taquilla-reporte-desde"
              type="date"
              value={rango.fechaDesde}
              onChange={(event) => actualizar("fechaDesde", event.target.value)}
              aria-describedby="taquilla-reporte-desde-ayuda"
              required
            />
            <p className={styles.fieldHelp} id="taquilla-reporte-desde-ayuda">
              Formato YYYY-MM-DD; fecha inicial del rango.
            </p>
          </div>
          <div className={styles.formField}>
            <label htmlFor="taquilla-reporte-hasta">Hasta</label>
            <input
              id="taquilla-reporte-hasta"
              type="date"
              value={rango.fechaHasta}
              onChange={(event) => actualizar("fechaHasta", event.target.value)}
              aria-describedby="taquilla-reporte-hasta-ayuda"
              required
            />
            <p className={styles.fieldHelp} id="taquilla-reporte-hasta-ayuda">
              Formato YYYY-MM-DD; fecha final del rango.
            </p>
          </div>
          <div className={styles.filtroAcciones}>
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>
              Aplicar filtros
            </button>
          </div>
        </form>
      </section>

      {!vista.valido ? (
        <div className={styles.feedback} role="alert">
          {vista.issues[0]?.message ?? "Ajusta el rango de fechas para consultar el reporte."}
          <p className={styles.panelNote}>
            Ajusta el rango de fechas para consultar el reporte.
          </p>
        </div>
      ) : (
        <>
          <dl className={styles.kpiGrid} aria-label="Indicadores del reporte">
            <div className={styles.kpiCard}>
              <dt>Compras simuladas</dt>
              <dd>{vista.cantidadCompras}</dd>
            </div>
            <div className={styles.kpiCard}>
              <dt>Boletos vendidos</dt>
              <dd>{vista.boletosVendidos}</dd>
            </div>
            <div className={styles.kpiCard}>
              <dt>Total recaudado (simulado)</dt>
              <dd>{vista.totalRecaudadoFormateado}</dd>
            </div>
          </dl>

          <section className={styles.reportesPanel} aria-labelledby="taquilla-detalle-titulo">
            <div className={styles.panelCabecera}>
              <div>
                <h3 id="taquilla-detalle-titulo" className={styles.panelTitle}>
                  Detalle de ventas
                </h3>
                <p className={styles.panelNote}>
                  {vista.fechaDesde} a {vista.fechaHasta} · importes históricos en COP.
                </p>
              </div>
            </div>

            {vista.esVacio ? (
              <div className={styles.emptyState} role="status">
                <p>{vista.mensajeVacio}</p>
              </div>
            ) : (
              <div className={styles.tableRegion}>
                <table className={styles.reporteTable}>
                  <caption className={styles.tableCaption}>
                    Detalle de ventas simuladas en el rango seleccionado.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">ID compra</th>
                      <th scope="col">Fecha compra</th>
                      <th scope="col">Película / función</th>
                      <th scope="col">Cliente ficticio</th>
                      <th scope="col">Boletos</th>
                      <th scope="col">Total registrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vista.detalles.map((detalle) => (
                      <tr key={detalle.compraId} data-venta-id={detalle.compraId}>
                        <td>
                          <span className={styles.cellLabel}>ID compra</span>
                          <span className={styles.mono}>{detalle.compraId}</span>
                        </td>
                        <td>
                          <span className={styles.cellLabel}>Fecha compra</span>
                          <time dateTime={detalle.fechaCompra}>
                            {detalle.diaBogota} {detalle.fechaCompra.slice(11, 19)}
                          </time>
                        </td>
                        <td>
                          <span className={styles.cellLabel}>Película / función</span>
                          <span>
                            {detalle.tituloPelicula} · {detalle.fechaFuncion} {detalle.horaFuncion} ·
                            Sala {detalle.sala}
                          </span>
                        </td>
                        <td>
                          <span className={styles.cellLabel}>Cliente ficticio</span>
                          <span>{detalle.nombreCliente}</span>
                        </td>
                        <td>
                          <span className={styles.cellLabel}>Boletos</span>
                          <span>{detalle.cantidadBoletos}</span>
                        </td>
                        <td>
                          <span className={styles.cellLabel}>Total registrado</span>
                          <span>{detalle.totalFormateado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
