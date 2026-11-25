/**
 * B5 — Reportes y estadísticas de la demo Fiore.
 *
 * La vista consume `buildReportModel`: no calcula totales financieros propios y
 * solo presenta los datos derivados del estado compartido B0. El rango de fechas
 * se aplica a movimientos y ventas; el inventario se declara como saldo actual.
 */

"use client";

import { useMemo, useState } from "react";
import type { FioreDemoState } from "@/data/fiore-demo/types";
import { formatCOP } from "@/lib/fiore-demo/pricing";
import {
  buildReportModel,
  buildReportsCsv,
  buildReportsCsvFileName,
  EMPTY_REPORT_FILTERS,
  hasActiveReportFilters,
  MOVEMENT_ORIGIN_LABELS,
  MOVEMENT_TYPE_LABELS,
  type ReportChartDatum,
  type ReportFilterValues,
  type ReportMovementRow,
  type ReportSaleRow,
  type ReportTypeFilter,
} from "@/lib/fiore-demo/reports-view";
import type { FioreNavItem } from "./fiore-navigation";
import { FioreIcon, type FioreIconName } from "./FioreIcons";
import styles from "./fiore-demo.module.css";

interface FioreReportsViewProps {
  state: FioreDemoState;
  item: FioreNavItem;
}

type StatTone = "wine" | "green" | "amber" | "rose" | "blue";
type ReportSort = "date-desc" | "date-asc";

const countFormatter = new Intl.NumberFormat("es-CO");

function formatCount(value: number): string {
  return countFormatter.format(value);
}

const TYPE_FILTERS: readonly { value: ReportTypeFilter; label: string }[] = [
  { value: "all", label: "Todos los tipos" },
  { value: "entry", label: "Entradas" },
  { value: "exit", label: "Salidas" },
  { value: "adjustment", label: "Ajustes" },
  { value: "return", label: "Devoluciones" },
  { value: "sale", label: "Ventas demo" },
];

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: FioreIconName;
  tone: StatTone;
}) {
  return (
    <article className={styles.statCard}>
      <div className={styles.statCardTop}>
        <div className={styles.statCardText}>
          <p className={styles.statLabel}>{label}</p>
          <p className={styles.statValue}>{value}</p>
        </div>
        <span className={`${styles.statIcon} ${styles[`tone${tone}`]}`}>
          <FioreIcon name={icon} />
        </span>
      </div>
      <p className={styles.statHint}>{hint}</p>
    </article>
  );
}

function BarChart({ data, emptyText }: { data: ReportChartDatum[]; emptyText: string }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  if (data.length === 0) {
    return <p className={styles.chartEmpty}>{emptyText}</p>;
  }

  return (
    <ol className={styles.reportBars}>
      {data.map((item) => (
        <li key={item.key} className={styles.reportBarRow}>
          <div className={styles.reportBarHead}>
            <span className={styles.reportBarLabel}>{item.label}</span>
            <span className={styles.reportBarValue}>{item.formattedValue}</span>
          </div>
          <div className={styles.reportBarTrack} aria-hidden="true">
            <div
              className={styles.reportBarFill}
              style={{ width: `${Math.max(4, Math.round((item.value / max) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function ChartPanel({
  title,
  badge,
  data,
  emptyText,
}: {
  title: string;
  badge: string;
  data: ReportChartDatum[];
  emptyText: string;
}) {
  return (
    <section className={styles.panelCard} aria-label={title}>
      <header className={styles.panelHeader}>
        <span className={`${styles.panelIcon} ${styles.toneWine}`}>
          <FioreIcon name="reports" />
        </span>
        <h3 className={styles.panelTitle}>{title}</h3>
        <span className={styles.panelBadge}>{badge}</span>
      </header>
      <div className={styles.panelBody}>
        <BarChart data={data} emptyText={emptyText} />
        <p className={styles.chartNote}>Cada barra muestra su etiqueta y valor en texto.</p>
      </div>
    </section>
  );
}

function MovementCell({ row }: { row: ReportMovementRow }) {
  return (
    <>
      <time dateTime={row.createdAt} className={styles.dateSmall}>
        {row.createdAt.slice(0, 10)}
      </time>
      <span className={styles.tableSecondary}>{row.createdAt.slice(11, 16)}</span>
    </>
  );
}

function ProfitCell({ row }: { row: ReportMovementRow }) {
  if (row.profit === null) {
    return (
      <span className={styles.tableSecondary}>
        {row.origin === "sale" ? "No disponible" : "No aplica"}
      </span>
    );
  }
  return <span className={styles.numericCell}>{formatCOP(row.profit)}</span>;
}

function EmptyReport({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.emptyInventory}>
      <FioreIcon name="reports" className={styles.emptyStateIcon} />
      <p className={styles.emptyStateTitle}>{title}</p>
      <p className={styles.emptyStateText}>{text}</p>
    </div>
  );
}

export function FioreReportsView({ state, item }: FioreReportsViewProps) {
  const [filters, setFilters] = useState<ReportFilterValues>(EMPTY_REPORT_FILTERS);
  const [sort, setSort] = useState<ReportSort>("date-desc");

  const model = useMemo(() => buildReportModel(state, filters), [state, filters]);
  const movements = useMemo(
    () =>
      sort === "date-desc"
        ? model.movements
        : [...model.movements].reverse(),
    [model.movements, sort],
  );
  const sales = useMemo(
    () => (sort === "date-desc" ? model.sales : [...model.sales].reverse()),
    [model.sales, sort],
  );

  const filtersActive = hasActiveReportFilters(filters);
  const { inventory, salesSummary } = model;
  const profitLabel =
    salesSummary.profit === null ? "No disponible" : formatCOP(salesSummary.profit);

  function updateFilter<K extends keyof ReportFilterValues>(
    key: K,
    value: ReportFilterValues[K],
  ): void {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters(): void {
    setFilters(EMPTY_REPORT_FILTERS);
    setSort("date-desc");
  }

  function exportCsv(): void {
    const csv = buildReportsCsv({ ...model, movements, sales });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildReportsCsvFileName(new Date().toISOString().slice(0, 10));
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.mainContent}>
      <header className={styles.inventoryIntro}>
        <div>
          <h2 className={styles.viewTitle}>Reportes</h2>
          <p className={styles.viewSubtitle}>{item.subtitle}</p>
        </div>
        <div className={styles.actionGroup}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={exportCsv}
            disabled={model.rangeError !== null}
          >
            <FioreIcon name="reports" className={styles.primaryActionIcon} />
            Exportar CSV
          </button>
        </div>
      </header>

      <section className={styles.projectionBanner} role="note" aria-label="Aviso de datos ficticios">
        <strong>Demostración · Datos ficticios</strong>
        <span>
          Valores proyectados; no representan ventas efectuadas. El inventario es el saldo actual y el
          rango de fechas se aplica solo a movimientos y ventas simuladas.
        </span>
      </section>

      <section className={styles.inventoryToolbar} aria-label="Filtros de reportes demo">
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-reports-from">
            Desde
          </label>
          <input
            id="fiore-reports-from"
            className={styles.control}
            type="date"
            value={filters.from}
            aria-invalid={model.rangeError !== null}
            aria-describedby={model.rangeError ? "fiore-reports-range-error" : undefined}
            onChange={(event) => updateFilter("from", event.target.value)}
          />
        </div>
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-reports-to">
            Hasta
          </label>
          <input
            id="fiore-reports-to"
            className={styles.control}
            type="date"
            value={filters.to}
            aria-invalid={model.rangeError !== null}
            aria-describedby={model.rangeError ? "fiore-reports-range-error" : undefined}
            onChange={(event) => updateFilter("to", event.target.value)}
          />
        </div>
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-reports-category">
            Categoría
          </label>
          <select
            id="fiore-reports-category"
            className={styles.control}
            value={filters.categoryId}
            onChange={(event) => updateFilter("categoryId", event.target.value)}
          >
            <option value="">Todas las categorías</option>
            {state.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-reports-product">
            Producto
          </label>
          <select
            id="fiore-reports-product"
            className={styles.control}
            value={filters.productId}
            onChange={(event) => updateFilter("productId", event.target.value)}
          >
            <option value="">Todos los productos</option>
            {state.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} · {product.sku}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-reports-type">
            Tipo de movimiento
          </label>
          <select
            id="fiore-reports-type"
            className={styles.control}
            value={filters.movementType}
            onChange={(event) =>
              updateFilter("movementType", event.target.value as ReportTypeFilter)
            }
          >
            {TYPE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-reports-sort">
            Orden por fecha
          </label>
          <select
            id="fiore-reports-sort"
            className={styles.control}
            value={sort}
            onChange={(event) => setSort(event.target.value as ReportSort)}
          >
            <option value="date-desc">Más recientes primero</option>
            <option value="date-asc">Más antiguos primero</option>
          </select>
        </div>
        {filtersActive ? (
          <button
            type="button"
            className={`${styles.dialogButton} ${styles.dialogButtonGhost}`}
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        ) : null}
      </section>

      {model.rangeError ? (
        <p id="fiore-reports-range-error" className={styles.reportError} role="alert">
          {model.rangeError} Ajusta el rango para volver a ver movimientos y ventas.
        </p>
      ) : null}

      <p className={styles.inventoryCount} aria-live="polite">
        {model.rangeError
          ? "Rango de fechas inválido"
          : `Inventario: ${formatCount(inventory.rows.length)} productos · Historial: ${formatCount(movements.length)} movimientos · ${formatCount(sales.length)} ventas demo`}
      </p>

      <section className={styles.statGrid} aria-label="Indicadores de la demo">
        <StatCard
          label="Valor inventario a costo"
          value={formatCOP(inventory.totals.costValue)}
          hint="Costo vigente × stock disponible; saldo actual"
          icon="box"
          tone="wine"
        />
        <StatCard
          label="Valor potencial de venta"
          value={formatCOP(inventory.totals.saleValue)}
          hint="Precio vigente × stock disponible; proyección"
          icon="dollar"
          tone="green"
        />
        <StatCard
          label="Ganancia bruta potencial"
          value={formatCOP(inventory.totals.profit)}
          hint="Proyección sobre inventario; no es ingreso recibido"
          icon="trending"
          tone="amber"
        />
        <StatCard
          label="Unidades disponibles"
          value={`${formatCount(inventory.totals.units)} und`}
          hint="Stock actual de los productos filtrados"
          icon="inventory"
          tone="blue"
        />
        <StatCard
          label="Ventas simuladas"
          value={formatCount(salesSummary.count)}
          hint="Salidas etiquetadas como venta demo"
          icon="clock"
          tone="rose"
        />
        <StatCard
          label="Unidades vendidas"
          value={`${formatCount(salesSummary.units)} und`}
          hint="Cantidad total de las ventas ficticias filtradas"
          icon="award"
          tone="wine"
        />
        <StatCard
          label="Importe ventas simuladas"
          value={formatCOP(salesSummary.revenue)}
          hint="Suma de importes snapshot; no es ingreso real"
          icon="dollar"
          tone="green"
        />
        <StatCard
          label="Ganancia bruta estimada"
          value={profitLabel}
          hint="Snapshot de costo por venta; sin costo histórico = no disponible"
          icon="trending"
          tone="amber"
        />
      </section>

      <section className={styles.panelGrid} aria-label="Gráficos de la demo">
        <ChartPanel
          title="Inventario por categoría"
          badge={`${formatCOP(inventory.totals.costValue)} a costo`}
          data={model.charts.inventoryByCategory}
          emptyText="No hay productos para graficar con los filtros actuales."
        />
        <ChartPanel
          title="Movimientos por tipo"
          badge={`${formatCount(movements.length)} mov`}
          data={model.charts.movementsByType}
          emptyText="No hay movimientos en el rango seleccionado."
        />
        <ChartPanel
          title="Ventas simuladas por período"
          badge={`${formatCOP(salesSummary.revenue)} snapshot`}
          data={model.charts.salesByPeriod}
          emptyText="No hay ventas ficticias en el rango seleccionado."
        />
      </section>

      <section className={styles.sectionCard} aria-labelledby="fiore-reports-movements-title">
        <header className={styles.cardHeader}>
          <span className={`${styles.cardIcon} ${styles.toneWine}`}>
            <FioreIcon name="movements" className={styles.cardHeaderIcon} />
          </span>
          <div>
            <h3 id="fiore-reports-movements-title" className={styles.cardTitle}>
              Movimientos filtrados
            </h3>
            <p className={styles.cardDescription}>
              Historial ficticio con la misma fecha, producto y tipo usados por los filtros.
            </p>
          </div>
        </header>
        <div className={styles.cardBody}>
          {movements.length === 0 ? (
            <EmptyReport
              title={model.rangeError ? "Corrige el rango de fechas" : "Sin movimientos para mostrar"}
              text={
                model.rangeError
                  ? "La fecha inicial y la final deben formar un rango válido."
                  : "Ningún movimiento coincide con los filtros. Prueba con otra categoría, producto o tipo."
              }
            />
          ) : (
            <div className={`${styles.reportTableWrap} ${styles.reportMovementsWrap}`}>
              <table className={styles.inventoryTable}>
                <caption className={styles.visuallyHidden}>
                  Movimientos ficticios filtrados con fecha, producto, categoría, tipo, cantidad,
                  importe y ganancia estimada
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Producto</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Tipo</th>
                    <th scope="col" className={styles.numericCell}>Cantidad</th>
                    <th scope="col" className={styles.numericCell}>Importe snapshot</th>
                    <th scope="col" className={styles.numericCell}>Ganancia estimada</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Fecha"><MovementCell row={row} /></td>
                      <td data-label="Producto">
                        <span className={styles.tablePrimary}>{row.productName}</span>
                        <span className={styles.tableSecondary}>{row.productSku}</span>
                      </td>
                      <td data-label="Categoría"><span className={styles.tableSecondary}>{row.categoryName}</span></td>
                      <td data-label="Tipo">
                        <span className={styles.statusBadge}>
                          {MOVEMENT_TYPE_LABELS[row.type]}
                          {row.origin === "sale" ? " · venta demo" : ""}
                        </span>
                      </td>
                      <td data-label="Cantidad" className={styles.numericCell}>{formatCount(row.quantity)}</td>
                      <td data-label="Importe snapshot" className={styles.numericCell}>
                        {row.value === null ? (
                          <span className={styles.tableSecondary}>No aplica</span>
                        ) : (
                          formatCOP(row.value)
                        )}
                      </td>
                      <td data-label="Ganancia estimada"><ProfitCell row={row} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className={styles.sectionCard} aria-labelledby="fiore-reports-sales-title">
        <header className={styles.cardHeader}>
          <span className={`${styles.cardIcon} ${styles.toneWine}`}>
            <FioreIcon name="reports" className={styles.cardHeaderIcon} />
          </span>
          <div>
            <h3 id="fiore-reports-sales-title" className={styles.cardTitle}>
              Ventas ficticias filtradas
            </h3>
            <p className={styles.cardDescription}>
              Solo operaciones de salida con origen «venta demo». Ninguna es una transacción real.
            </p>
          </div>
        </header>
        <div className={styles.cardBody}>
          {sales.length === 0 ? (
            <EmptyReport
              title={model.rangeError ? "Corrige el rango de fechas" : "Sin ventas para mostrar"}
              text={
                model.rangeError
                  ? "La fecha inicial y la final deben formar un rango válido."
                  : "No hay ventas demo con los filtros actuales. Los importes se muestran solo cuando existen."
              }
            />
          ) : (
            <div className={`${styles.reportTableWrap} ${styles.reportSalesWrap}`}>
              <table className={styles.inventoryTable}>
                <caption className={styles.visuallyHidden}>
                  Ventas ficticias filtradas con fecha, producto, categoría, cantidad, importe
                  snapshot y ganancia histórica estimada
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Producto</th>
                    <th scope="col">Categoría</th>
                    <th scope="col" className={styles.numericCell}>Cantidad</th>
                    <th scope="col" className={styles.numericCell}>Importe snapshot</th>
                    <th scope="col" className={styles.numericCell}>Ganancia estimada</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((row: ReportSaleRow) => (
                    <tr key={row.id}>
                      <td data-label="Fecha"><MovementCell row={row} /></td>
                      <td data-label="Producto">
                        <span className={styles.tablePrimary}>{row.productName}</span>
                        <span className={styles.tableSecondary}>{row.productSku}</span>
                      </td>
                      <td data-label="Categoría"><span className={styles.tableSecondary}>{row.categoryName}</span></td>
                      <td data-label="Cantidad" className={styles.numericCell}>{formatCount(row.quantity)}</td>
                      <td data-label="Importe snapshot" className={styles.numericCell}>{formatCOP(row.total ?? 0)}</td>
                      <td data-label="Ganancia estimada"><ProfitCell row={row} /></td>
                      <td data-label="Estado">
                        <span className={styles.tableSecondary}>
                          {MOVEMENT_ORIGIN_LABELS[row.origin] ?? row.origin}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
