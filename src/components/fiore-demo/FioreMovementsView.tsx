/**
 * B4 — Historial de movimientos de la demo Fiore.
 *
 * Muestra las filas derivadas por `selectMovementRows` y aplica búsqueda, filtro
 * por tipo, orden y paginación local con funciones puras de `movements-view.ts`.
 * Las fechas se presentan como texto ISO recortado para que servidor y cliente
 * rendericen exactamente lo mismo y no aparezca `hydration mismatch`.
 */

"use client";

import { useMemo, useState } from "react";
import type {
  DemoMovementRow,
  DemoMovementType,
  FioreDemoState,
} from "@/data/fiore-demo/types";
import { formatCOP } from "@/lib/fiore-demo/pricing";
import {
  filterMovementRows,
  paginateRows,
  type MovementSortKey,
  type MovementTypeFilter,
} from "@/lib/fiore-demo/movements-view";
import { selectMovementRows } from "@/lib/fiore-demo/selectors";
import type { FioreNavItem } from "./fiore-navigation";
import { FioreIcon } from "./FioreIcons";
import styles from "./fiore-demo.module.css";

interface FioreMovementsViewProps {
  state: FioreDemoState;
  item: FioreNavItem;
  onNewMovement: () => void;
  onSale: () => void;
}

const TYPE_LABELS: Record<DemoMovementType, string> = {
  entry: "Entrada",
  exit: "Salida",
  adjustment: "Ajuste",
  return: "Devolución",
};

const TYPE_FILTERS: readonly { value: MovementTypeFilter; label: string }[] = [
  { value: "all", label: "Todos los tipos" },
  { value: "entry", label: "Entradas" },
  { value: "exit", label: "Salidas" },
  { value: "adjustment", label: "Ajustes" },
  { value: "return", label: "Devoluciones" },
];

function formatDate(iso: string): { date: string; time: string } {
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

function Delta({ value }: { value: number }) {
  const positive = value > 0;
  return (
    <span className={`${styles.deltaValue} ${positive ? styles.deltaPositive : styles.deltaNegative}`}>
      {positive ? "+" : ""}
      {value} und
    </span>
  );
}

function MovementTypeBadge({ row }: { row: DemoMovementRow }) {
  const className =
    row.type === "entry" || row.type === "return"
      ? styles.statusActive
      : row.type === "adjustment"
        ? styles.movementAdjustment
        : styles.statusInactive;
  return (
    <span className={`${styles.statusBadge} ${className}`}>
      {TYPE_LABELS[row.type]}
      {row.origin === "sale" ? " · venta demo" : ""}
    </span>
  );
}

export function FioreMovementsView({
  state,
  item,
  onNewMovement,
  onSale,
}: FioreMovementsViewProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<MovementTypeFilter>("all");
  const [sort, setSort] = useState<MovementSortKey>("date-desc");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => selectMovementRows(state), [state]);
  const filtered = useMemo(
    () => filterMovementRows(rows, { query, type, sort }),
    [rows, query, type, sort],
  );
  const visible = useMemo(() => paginateRows(filtered, page), [filtered, page]);

  const filtersActive = query.trim().length > 0 || type !== "all";

  function clearFilters() {
    setQuery("");
    setType("all");
    setSort("date-desc");
    setPage(1);
  }

  return (
    <div className={styles.mainContent}>
      <header className={styles.inventoryIntro}>
        <div>
          <h2 className={styles.viewTitle}>{item.label}</h2>
          <p className={styles.viewSubtitle}>{item.subtitle}</p>
        </div>
        <div className={styles.actionGroup}>
          <button type="button" className={styles.primaryAction} onClick={onNewMovement}>
            <FioreIcon name="plus" className={styles.primaryActionIcon} />
            Registrar movimiento
          </button>
          <button
            type="button"
            className={`${styles.primaryAction} ${styles.primaryActionAlt}`}
            onClick={onSale}
          >
            Registrar venta demo
          </button>
        </div>
      </header>

      <section className={styles.inventoryToolbar} aria-label="Filtros del historial demo">
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-movements-search">
            Buscar producto o SKU
          </label>
          <div className={styles.searchWrap}>
            <FioreIcon name="search" className={styles.searchIcon} />
            <input
              id="fiore-movements-search"
              className={`${styles.control} ${styles.searchInput}`}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="DEMO-… o nombre del producto"
              autoComplete="off"
            />
          </div>
        </div>
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-movements-type">
            Tipo
          </label>
          <select
            id="fiore-movements-type"
            className={styles.control}
            value={type}
            onChange={(event) => {
              setType(event.target.value as MovementTypeFilter);
              setPage(1);
            }}
          >
            {TYPE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-movements-sort">
            Orden por fecha
          </label>
          <select
            id="fiore-movements-sort"
            className={styles.control}
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as MovementSortKey);
              setPage(1);
            }}
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

      <p className={styles.inventoryCount} aria-live="polite">
        {filtered.length === 0
          ? "Sin movimientos"
          : `Mostrando ${(visible.page - 1) * visible.pageSize + 1}–${Math.min(visible.page * visible.pageSize, visible.total)} de ${visible.total} movimientos`}
      </p>

      {visible.rows.length === 0 ? (
        <div className={styles.emptyInventory}>
          <FioreIcon name="movements" className={styles.emptyStateIcon} />
          <p className={styles.emptyStateTitle}>Sin movimientos para mostrar</p>
          <p className={styles.emptyStateText}>
            {rows.length === 0
              ? "Todavía no hay movimientos demo. Registra una entrada para comenzar."
              : "Ningún movimiento coincide con los filtros. Prueba con otra búsqueda o limpia los filtros."}
          </p>
          {filtersActive ? (
            <button
              type="button"
              className={`${styles.dialogButton} ${styles.dialogButtonGhost}`}
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          ) : (
            <button type="button" className={styles.primaryAction} onClick={onNewMovement}>
              Registrar movimiento
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.inventoryTableWrap}>
            <table className={styles.inventoryTable}>
              <caption className={styles.visuallyHidden}>
                Historial de movimientos ficticios con fecha, producto, tipo, variación y saldo
              </caption>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Producto</th>
                  <th scope="col">SKU</th>
                  <th scope="col">Tipo</th>
                  <th scope="col" className={styles.numericCell}>Cantidad</th>
                  <th scope="col" className={styles.numericCell}>Variación</th>
                  <th scope="col" className={styles.numericCell}>Saldo posterior</th>
                  <th scope="col">Nota</th>
                </tr>
              </thead>
              <tbody>
                {visible.rows.map((row) => {
                  const formatted = formatDate(row.createdAt);
                  return (
                    <tr key={row.id}>
                      <td>
                        <time dateTime={row.createdAt} className={styles.dateSmall}>
                          {formatted.date}
                        </time>
                        <span className={styles.tableSecondary}>{formatted.time}</span>
                      </td>
                      <td>
                        <span className={styles.tablePrimary}>{row.productName}</span>
                        {row.origin === "sale" && row.total !== undefined ? (
                          <span className={styles.tableSecondary}>
                            Importe snapshot: {formatCOP(row.total)}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <span className={styles.tableSecondary}>{row.productSku}</span>
                      </td>
                      <td>
                        <MovementTypeBadge row={row} />
                      </td>
                      <td className={styles.numericCell}>{row.quantity}</td>
                      <td className={styles.numericCell}>
                        <Delta value={row.delta} />
                      </td>
                      <td className={styles.numericCell}>{row.balanceAfter} und</td>
                      <td>
                        <span className={styles.tableSecondary}>
                          {row.note ?? "Sin nota"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className={styles.inventoryCards} aria-label="Movimientos demo">
            {visible.rows.map((row) => {
              const formatted = formatDate(row.createdAt);
              return (
                <li key={row.id} className={styles.inventoryCard}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardHeading}>
                      <h3 className={styles.cardProductName}>{row.productName}</h3>
                      <p className={styles.cardSku}>
                        <time dateTime={row.createdAt}>
                          {formatted.date} {formatted.time}
                        </time>
                        {" · "}
                        {row.productSku}
                      </p>
                    </div>
                    <MovementTypeBadge row={row} />
                  </div>
                  <dl className={styles.cardData}>
                    <div className={styles.cardDataItem}>
                      <dt>Cantidad</dt>
                      <dd>{row.quantity}</dd>
                    </div>
                    <div className={styles.cardDataItem}>
                      <dt>Variación</dt>
                      <dd>
                        <Delta value={row.delta} />
                      </dd>
                    </div>
                    <div className={styles.cardDataItem}>
                      <dt>Saldo posterior</dt>
                      <dd>{row.balanceAfter} und</dd>
                    </div>
                    <div className={styles.cardDataItem}>
                      <dt>Nota</dt>
                      <dd>{row.note ?? "Sin nota"}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>

          {visible.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación del historial">
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={visible.page <= 1}
                aria-label="Página anterior"
              >
                Anterior
              </button>
              <span className={styles.pageInfo} aria-live="polite">
                Página {visible.page} de {visible.totalPages}
              </span>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => setPage((current) => Math.min(visible.totalPages, current + 1))}
                disabled={visible.page >= visible.totalPages}
                aria-label="Página siguiente"
              >
                Siguiente
              </button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
