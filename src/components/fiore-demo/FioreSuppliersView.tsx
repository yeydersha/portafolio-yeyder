/**
 * B4 — Proveedores ficticios de la demo Fiore.
 *
 * Igual que en categorías, las filas vienen de un selector y la búsqueda es una
 * función pura. A diferencia del sistema original, aquí no existen teléfonos,
 * correos, direcciones ni datos fiscales: solo nombre, referencia demo y
 * cantidad de productos asociados.
 */

"use client";

import { useMemo, useState } from "react";
import type { DemoSupplierCount, FioreDemoState } from "@/data/fiore-demo/types";
import {
  filterSupplierCounts,
  sortSuppliersByName,
} from "@/lib/fiore-demo/entity-view";
import { selectSupplierCounts } from "@/lib/fiore-demo/selectors";
import type { FioreNavItem } from "./fiore-navigation";
import { FioreIcon } from "./FioreIcons";
import styles from "./fiore-demo.module.css";

interface FioreSuppliersViewProps {
  state: FioreDemoState;
  item: FioreNavItem;
  onNewSupplier: () => void;
  onEditSupplier: (id: string) => void;
  onToggleSupplier: (row: DemoSupplierCount) => void;
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`${styles.statusBadge} ${
        active ? styles.statusActive : styles.statusInactive
      }`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function SupplierActions({
  row,
  onEdit,
  onToggle,
}: {
  row: DemoSupplierCount;
  onEdit: (id: string) => void;
  onToggle: (row: DemoSupplierCount) => void;
}) {
  return (
    <div className={styles.actionGroup}>
      <button
        type="button"
        className={styles.actionButton}
        onClick={() => onEdit(row.id)}
        aria-label={`Editar proveedor ${row.name}`}
      >
        <FioreIcon name="edit" className={styles.actionIcon} />
        Editar
      </button>
      <button
        type="button"
        className={styles.actionButton}
        onClick={() => onToggle(row)}
        aria-label={`${row.active ? "Desactivar" : "Activar"} proveedor ${row.name}`}
      >
        {row.active ? "Desactivar" : "Activar"}
      </button>
    </div>
  );
}

export function FioreSuppliersView({
  state,
  item,
  onNewSupplier,
  onEditSupplier,
  onToggleSupplier,
}: FioreSuppliersViewProps) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => selectSupplierCounts(state), [state]);
  const visibleRows = useMemo(
    () => sortSuppliersByName(filterSupplierCounts(rows, query)),
    [rows, query],
  );

  return (
    <div className={styles.mainContent}>
      <header className={styles.inventoryIntro}>
        <div>
          <h2 className={styles.viewTitle}>{item.label}</h2>
          <p className={styles.viewSubtitle}>{item.subtitle}</p>
        </div>
        <button type="button" className={styles.primaryAction} onClick={onNewSupplier}>
          <FioreIcon name="plus" className={styles.primaryActionIcon} />
          Nuevo proveedor
        </button>
      </header>

      <section className={styles.inventoryToolbar} aria-label="Filtros de proveedores demo">
        <div className={styles.toolbarField}>
          <label className={styles.toolbarLabel} htmlFor="fiore-suppliers-search">
            Buscar por nombre
          </label>
          <div className={styles.searchWrap}>
            <FioreIcon name="search" className={styles.searchIcon} />
            <input
              id="fiore-suppliers-search"
              className={`${styles.control} ${styles.searchInput}`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Proveedor Demo Aurora…"
              autoComplete="off"
            />
          </div>
        </div>
        <div className={styles.toolbarNote}>
          Solo proveedores inventados. No se registran contactos ni datos confidenciales.
        </div>
      </section>

      <p className={styles.inventoryCount} aria-live="polite">
        {visibleRows.length} de {rows.length} proveedores demo
      </p>

      {visibleRows.length === 0 ? (
        <div className={styles.emptyInventory}>
          <FioreIcon name="suppliers" className={styles.emptyStateIcon} />
          <p className={styles.emptyStateTitle}>Sin proveedores para mostrar</p>
          <p className={styles.emptyStateText}>
            {rows.length === 0
              ? "Todavía no hay proveedores demo. Agrega uno para comenzar."
              : "No hay proveedores que coincidan con la búsqueda. Prueba con otro nombre."}
          </p>
          <button
            type="button"
            className={`${styles.dialogButton} ${styles.dialogButtonGhost}`}
            onClick={onNewSupplier}
          >
            Nuevo proveedor
          </button>
        </div>
      ) : (
        <>
          <div className={styles.inventoryTableWrap}>
            <table className={styles.inventoryTable}>
              <caption className={styles.visuallyHidden}>
                Proveedores ficticios con su cantidad de productos asociados
              </caption>
              <thead>
                <tr>
                  <th scope="col">Proveedor</th>
                  <th scope="col">Referencia demo</th>
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
                        {row.reference ?? "Sin referencia demo"}
                      </span>
                    </td>
                    <td className={styles.numericCell}>{row.productCount}</td>
                    <td>
                      <ActiveBadge active={row.active} />
                    </td>
                    <td>
                      <SupplierActions
                        row={row}
                        onEdit={onEditSupplier}
                        onToggle={onToggleSupplier}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.inventoryCards} aria-label="Proveedores demo">
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
                    <dt>Referencia</dt>
                    <dd>{row.reference ?? "Sin referencia demo"}</dd>
                  </div>
                </dl>
                <SupplierActions
                  row={row}
                  onEdit={onEditSupplier}
                  onToggle={onToggleSupplier}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
