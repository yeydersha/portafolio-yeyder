/**
 * B4 — Categorías de la demo Fiore.
 *
 * Las filas y los conteos vienen de `selectCategoryCounts`; la búsqueda y el
 * orden son funciones puras de `entity-view.ts`. No hay borrado: las cuatro
 * categorías originales se conservan y activar/desactivar pasa por el reducer,
 * sin tocar las asociaciones de los productos.
 */

"use client";

import { useMemo, useState } from "react";
import type { DemoCategoryCount, FioreDemoState } from "@/data/fiore-demo/types";
import {
  filterCategoryCounts,
  sortCategoriesByName,
} from "@/lib/fiore-demo/entity-view";
import { selectCategoryCounts } from "@/lib/fiore-demo/selectors";
import type { FioreNavItem } from "./fiore-navigation";
import { FioreIcon } from "./FioreIcons";
import styles from "./fiore-demo.module.css";

interface FioreCategoriesViewProps {
  state: FioreDemoState;
  item: FioreNavItem;
  onNewCategory: () => void;
  onEditCategory: (id: string) => void;
  onToggleCategory: (row: DemoCategoryCount) => void;
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`${styles.statusBadge} ${
        active ? styles.statusActive : styles.statusInactive
      }`}
    >
      {active ? "Activa" : "Inactiva"}
    </span>
  );
}

function CategoryActions({
  row,
  onEdit,
  onToggle,
}: {
  row: DemoCategoryCount;
  onEdit: (id: string) => void;
  onToggle: (row: DemoCategoryCount) => void;
}) {
  return (
    <div className={styles.actionGroup}>
      <button
        type="button"
        className={styles.actionButton}
        onClick={() => onEdit(row.id)}
        aria-label={`Editar categoría ${row.name}`}
      >
        <FioreIcon name="edit" className={styles.actionIcon} />
        Editar
      </button>
      <button
        type="button"
        className={styles.actionButton}
        onClick={() => onToggle(row)}
        aria-label={`${row.active ? "Desactivar" : "Activar"} categoría ${row.name}`}
      >
        {row.active ? "Desactivar" : "Activar"}
      </button>
    </div>
  );
}

export function FioreCategoriesView({
  state,
  item,
  onNewCategory,
  onEditCategory,
  onToggleCategory,
}: FioreCategoriesViewProps) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => selectCategoryCounts(state), [state]);
  const visibleRows = useMemo(
    () => sortCategoriesByName(filterCategoryCounts(rows, query)),
    [rows, query],
  );

  return (
    <div className={styles.mainContent}>
      <header className={styles.inventoryIntro}>
        <div>
          <h2 className={styles.viewTitle}>{item.label}</h2>
          <p className={styles.viewSubtitle}>{item.subtitle}</p>
        </div>
        <button type="button" className={styles.primaryAction} onClick={onNewCategory}>
          <FioreIcon name="plus" className={styles.primaryActionIcon} />
          Nueva categoría
        </button>
      </header>

      <section className={styles.inventoryToolbar} aria-label="Filtros de categorías demo">
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-categories-search">
            Buscar por nombre
          </label>
          <div className={styles.searchWrap}>
            <FioreIcon name="search" className={styles.searchIcon} />
            <input
              id="fiore-categories-search"
              className={`${styles.control} ${styles.searchInput}`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Anillos, Collares…"
              autoComplete="off"
            />
          </div>
        </div>
        <div className={styles.toolbarNote}>
          Las categorías originales se conservan; no se eliminan ni se desasocian productos.
        </div>
      </section>

      <p className={styles.inventoryCount} aria-live="polite">
        {visibleRows.length} de {rows.length} categorías demo
      </p>

      {visibleRows.length === 0 ? (
        <div className={styles.emptyInventory}>
          <FioreIcon name="categories" className={styles.emptyStateIcon} />
          <p className={styles.emptyStateTitle}>Sin categorías para mostrar</p>
          <p className={styles.emptyStateText}>
            {rows.length === 0
              ? "Todavía no hay categorías demo. Agrega una para comenzar."
              : "No hay categorías que coincidan con la búsqueda. Prueba con otro nombre."}
          </p>
          <button
            type="button"
            className={`${styles.dialogButton} ${styles.dialogButtonGhost}`}
            onClick={onNewCategory}
          >
            Nueva categoría
          </button>
        </div>
      ) : (
        <>
          <div className={styles.inventoryTableWrap}>
            <table className={styles.inventoryTable}>
              <caption className={styles.visuallyHidden}>
                Categorías ficticias con su cantidad de productos asociados
              </caption>
              <thead>
                <tr>
                  <th scope="col">Categoría</th>
                  <th scope="col">Descripción</th>
                  <th scope="col">Productos</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={styles.tablePrimary}>{row.name}</span>
                      <span className={styles.tableSecondary}>{row.id}</span>
                    </td>
                    <td>
                      <span className={styles.tableSecondary}>
                        {row.description ?? "Sin descripción demo"}
                      </span>
                    </td>
                    <td className={styles.numericCell}>{row.productCount}</td>
                    <td>
                      <ActiveBadge active={row.active} />
                    </td>
                    <td>
                      <CategoryActions
                        row={row}
                        onEdit={onEditCategory}
                        onToggle={onToggleCategory}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.inventoryCards} aria-label="Categorías demo">
            {visibleRows.map((row) => (
              <li key={row.id} className={styles.inventoryCard}>
                <div className={styles.cardTop}>
                  <div className={styles.cardHeading}>
                    <h3 className={styles.cardProductName}>{row.name}</h3>
                    <p className={styles.cardSku}>{row.id}</p>
                  </div>
                  <ActiveBadge active={row.active} />
                </div>
                <dl className={styles.cardData}>
                  <div className={styles.cardDataItem}>
                    <dt>Productos</dt>
                    <dd>{row.productCount}</dd>
                  </div>
                  <div className={styles.cardDataItem}>
                    <dt>Descripción</dt>
                    <dd>{row.description ?? "Sin descripción demo"}</dd>
                  </div>
                </dl>
                <CategoryActions
                  row={row}
                  onEdit={onEditCategory}
                  onToggle={onToggleCategory}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
