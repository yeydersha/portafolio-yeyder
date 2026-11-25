/**
 * B3 — Inventario y gestión de productos de la demo Fiore.
 *
 * La vista sustituye al placeholder `inventory`. Solo presenta: las filas
 * vienen de `buildInventoryRows` (B0), los filtros y el orden son funciones puras
 * de `inventory-view.ts`, y las cifras monetarias salen de `pricing.ts`.
 * El alta y la edición se delegan al `ProductDialog` del contenedor.
 */

"use client";

import { useMemo, useState } from "react";
import type { DemoInventoryRow, DemoProductStatus, FioreDemoState } from "@/data/fiore-demo/types";
import { formatCOP } from "@/lib/fiore-demo/pricing";
import {
  filterInventoryRows,
  sortInventoryRows,
  type InventoryAvailability,
  type InventorySortKey,
} from "@/lib/fiore-demo/inventory-view";
import { buildInventoryRows, LOW_STOCK_MAX } from "@/lib/fiore-demo/selectors";
import type { FioreNavItem } from "./fiore-navigation";
import { FioreIcon } from "./FioreIcons";
import styles from "./fiore-demo.module.css";

interface FioreInventoryViewProps {
  state: FioreDemoState;
  item: FioreNavItem;
  onNewProduct: () => void;
  onEditProduct: (id: string) => void;
}

const countFormatter = new Intl.NumberFormat("es-CO");

function formatCount(value: number): string {
  return countFormatter.format(value);
}

function StockBadge({ stock }: { stock: number }) {
  const tone =
    stock === 0
      ? styles.stockBadgeOut
      : stock <= LOW_STOCK_MAX
        ? styles.stockBadgeLow
        : styles.stockBadgeAvailable;
  const label =
    stock === 0 ? "Agotado" : stock <= LOW_STOCK_MAX ? "Stock bajo" : "Disponible";

  return <span className={`${styles.stockBadge} ${tone}`}>{label}</span>;
}

function StatusBadge({ status }: { status: DemoProductStatus }) {
  return (
    <span
      className={`${styles.statusBadge} ${
        status === "active" ? styles.statusActive : styles.statusInactive
      }`}
    >
      {status === "active" ? "Activo" : "Inactivo"}
    </span>
  );
}

function ProductActions({
  row,
  onEdit,
}: {
  row: DemoInventoryRow;
  onEdit: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={styles.actionButton}
      onClick={() => onEdit(row.id)}
      aria-label={`Editar ${row.name}`}
    >
      <FioreIcon name="edit" className={styles.actionIcon} />
      Editar
    </button>
  );
}

export function FioreInventoryView({
  state,
  item,
  onNewProduct,
  onEditProduct,
}: FioreInventoryViewProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<DemoProductStatus | "all">("all");
  const [availability, setAvailability] = useState<InventoryAvailability>("all");
  const [sort, setSort] = useState<InventorySortKey>("name-asc");

  const rows = useMemo(() => buildInventoryRows(state), [state]);
  const visibleRows = useMemo(
    () =>
      sortInventoryRows(
        filterInventoryRows(rows, { query, categoryId, status, availability }),
        sort,
      ),
    [rows, query, categoryId, status, availability, sort],
  );

  const filtersActive =
    query.trim().length > 0 ||
    categoryId !== "all" ||
    status !== "all" ||
    availability !== "all";

  function clearFilters() {
    setQuery("");
    setCategoryId("all");
    setStatus("all");
    setAvailability("all");
    setSort("name-asc");
  }

  return (
    <div className={styles.mainContent}>
      <header className={styles.inventoryIntro}>
        <div>
          <h2 className={styles.viewTitle}>{item.label}</h2>
          <p className={styles.viewSubtitle}>{item.subtitle}</p>
        </div>
        <button type="button" className={styles.primaryAction} onClick={onNewProduct}>
          <FioreIcon name="plus" className={styles.primaryActionIcon} />
          Nuevo producto
        </button>
      </header>

      <section className={styles.inventoryToolbar} aria-label="Filtros del inventario demo">
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-inventory-search">
            Buscar
          </label>
          <div className={styles.searchWrap}>
            <FioreIcon name="search" className={styles.searchIcon} />
            <input
              id="fiore-inventory-search"
              className={`${styles.control} ${styles.searchInput}`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre o SKU demo"
            />
          </div>
        </div>

        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-inventory-category">
            Categoría
          </label>
          <select
            id="fiore-inventory-category"
            className={styles.control}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="all">Todas</option>
            {state.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-inventory-status">
            Estado
          </label>
          <select
            id="fiore-inventory-status"
            className={styles.control}
            value={status}
            onChange={(event) => setStatus(event.target.value as DemoProductStatus | "all")}
          >
            <option value="all">Todos</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-inventory-availability">
            Disponibilidad
          </label>
          <select
            id="fiore-inventory-availability"
            className={styles.control}
            value={availability}
            onChange={(event) => setAvailability(event.target.value as InventoryAvailability)}
          >
            <option value="all">Todas</option>
            <option value="available">Disponible</option>
            <option value="low">Stock bajo</option>
            <option value="out">Agotado</option>
          </select>
        </div>

        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-inventory-sort">
            Ordenar por
          </label>
          <select
            id="fiore-inventory-sort"
            className={styles.control}
            value={sort}
            onChange={(event) => setSort(event.target.value as InventorySortKey)}
          >
            <option value="name-asc">Nombre A–Z</option>
            <option value="name-desc">Nombre Z–A</option>
            <option value="sku-asc">SKU</option>
            <option value="stock-asc">Menor stock</option>
            <option value="stock-desc">Mayor stock</option>
            <option value="profit-desc">Mayor ganancia</option>
            <option value="price-desc">Mayor precio</option>
            <option value="created-desc">Más recientes</option>
          </select>
        </div>
      </section>

      <p className={styles.inventoryCount} role="status">
        Mostrando {formatCount(visibleRows.length)} de {formatCount(rows.length)} productos demo
        {filtersActive ? " · filtros activos" : ""}
      </p>

      {rows.length === 0 ? (
        <div className={styles.emptyInventory}>
          <FioreIcon name="box" className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Aún no hay productos demo</h3>
          <p className={styles.emptyText}>
            El inventario está vacío. Agrega un producto ficticio para empezar; ningún dato se envía a
            un servidor.
          </p>
          <button type="button" className={styles.primaryAction} onClick={onNewProduct}>
            <FioreIcon name="plus" className={styles.primaryActionIcon} />
            Agregar primer producto
          </button>
        </div>
      ) : visibleRows.length === 0 ? (
        <div className={styles.emptyInventory}>
          <FioreIcon name="search" className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Sin resultados</h3>
          <p className={styles.emptyText}>
            No hay productos demo que coincidan con la búsqueda o los filtros aplicados.
          </p>
          <button type="button" className={styles.dialogButtonGhost} onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div className={styles.inventoryTableWrap}>
            <table className={styles.inventoryTable}>
              <caption className={styles.visuallyHidden}>
                Productos ficticios del inventario de la demo Fiore
              </caption>
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Proveedor</th>
                  <th scope="col" className={styles.numericCell}>Costo</th>
                  <th scope="col" className={styles.numericCell}>Venta</th>
                  <th scope="col" className={styles.numericCell}>Ganancia estimada</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={styles.tablePrimary}>{row.name}</span>
                      <span className={styles.tableSecondary}>{row.sku}</span>
                    </td>
                    <td>{row.categoryName ?? "Sin categoría"}</td>
                    <td>{row.supplierName ?? "Sin proveedor"}</td>
                    <td className={styles.numericCell}>{formatCOP(row.costPrice)}</td>
                    <td className={styles.numericCell}>{formatCOP(row.pricing.sellingPrice)}</td>
                    <td className={styles.numericCell}>
                      <span className={styles.profitValue}>{formatCOP(row.pricing.grossProfitTotal)}</span>
                      <span className={styles.tableSecondary}>
                        {formatCOP(row.pricing.grossProfitUnit)} / u.
                      </span>
                    </td>
                    <td>
                      <div className={styles.stockCell}>
                        <strong>{formatCount(row.stock)}</strong>
                        <StockBadge stock={row.stock} />
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>
                      <ProductActions row={row} onEdit={onEditProduct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.inventoryCards}>
            {visibleRows.map((row) => (
              <li key={row.id} className={styles.inventoryCard}>
                <div className={styles.cardTop}>
                  <div className={styles.cardHeading}>
                    <h3 className={styles.cardProductName}>{row.name}</h3>
                    <p className={styles.cardSku}>{row.sku}</p>
                  </div>
                  <StockBadge stock={row.stock} />
                </div>
                <dl className={styles.cardData}>
                  <div className={styles.cardDataItem}>
                    <dt>Categoría</dt>
                    <dd>{row.categoryName ?? "Sin categoría"}</dd>
                  </div>
                  <div className={styles.cardDataItem}>
                    <dt>Proveedor</dt>
                    <dd>{row.supplierName ?? "Sin proveedor"}</dd>
                  </div>
                  <div className={styles.cardDataItem}>
                    <dt>Costo</dt>
                    <dd>{formatCOP(row.costPrice)}</dd>
                  </div>
                  <div className={styles.cardDataItem}>
                    <dt>Venta</dt>
                    <dd>{formatCOP(row.pricing.sellingPrice)}</dd>
                  </div>
                  <div className={styles.cardDataItem}>
                    <dt>Ganancia estimada</dt>
                    <dd>{formatCOP(row.pricing.grossProfitTotal)}</dd>
                  </div>
                  <div className={styles.cardDataItem}>
                    <dt>Stock</dt>
                    <dd>{formatCount(row.stock)}</dd>
                  </div>
                  <div className={styles.cardDataItem}>
                    <dt>Estado</dt>
                    <dd>
                      <StatusBadge status={row.status} />
                    </dd>
                  </div>
                </dl>
                <ProductActions row={row} onEdit={onEditProduct} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
