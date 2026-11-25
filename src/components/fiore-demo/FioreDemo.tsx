/**
 * B1/B2/B3/B4/B5 — Contenedor de la demo Fiore.
 *
 * Conecta el estado B0 con la navegación local, el dashboard y el inventario. En
 * B2 la lectura de `localStorage` se movió a un efecto posterior al montaje: el
 * HTML del servidor y el primer render del cliente usan siempre la semilla, de
 * modo que las cifras derivadas no producen `hydration mismatch`. B3 agrega el
 * diálogo de productos, B4 las vistas de catálogo y movimientos y B5 los
 * reportes: la UI valida primero y el guardado pasa por `applyDemoAction`,
 * única puerta de entrada al estado compartido.
 */

"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type {
  DemoCategoryCount,
  DemoSupplierCount,
  FioreDemoAction,
  FioreDemoView,
} from "@/data/fiore-demo/types";
import { createSeedState } from "@/data/fiore-demo/seed";
import {
  applyDemoAction,
  fioreDemoReducer,
  type DemoActionResult,
} from "@/lib/fiore-demo/reducer";
import { clearDemoState, loadDemoState, saveDemoState } from "@/lib/fiore-demo/storage";
import { FioreCategoriesView } from "./FioreCategoriesView";
import { FioreCategoryDialog } from "./FioreCategoryDialog";
import { FioreDashboardView } from "./FioreDashboardView";
import { FioreDemoFrame } from "./FioreDemoFrame";
import { FioreInventoryView } from "./FioreInventoryView";
import { FioreMovementDialog } from "./FioreMovementDialog";
import { FioreMovementsView } from "./FioreMovementsView";
import { FiorePlaceholderView } from "./FiorePlaceholderView";
import { FioreProductDialog } from "./FioreProductDialog";
import { FioreReportsView } from "./FioreReportsView";
import { FioreResetDialog } from "./FioreResetDialog";
import { FioreSidebar } from "./FioreSidebar";
import { FioreSupplierDialog } from "./FioreSupplierDialog";
import { FioreSuppliersView } from "./FioreSuppliersView";
import { FioreIcon } from "./FioreIcons";
import { getFioreNavItem } from "./fiore-navigation";
import styles from "./fiore-demo.module.css";

interface FioreUiState {
  hydrationReady: boolean;
  notice: string | null;
}

type FioreUiAction =
  | { type: "HYDRATION_READY"; notice: string | null }
  | { type: "SET_NOTICE"; notice: string | null };

type FioreOverlayKind = "product" | "category" | "supplier" | "movement" | "sale";
type FioreOverlay = { kind: FioreOverlayKind; id?: string } | null;

/**
 * El estado de la envoltura (aviso y compuerta de persistencia) se gobierna con
 * un reducer, no con `setState` directo dentro del efecto: el efecto de lectura
 * de `localStorage` solo sincroniza con una fuente externa y agrupa sus
 * actualizaciones en el mismo render.
 */
function uiReducer(state: FioreUiState, action: FioreUiAction): FioreUiState {
  switch (action.type) {
    case "HYDRATION_READY":
      return { hydrationReady: true, notice: action.notice };
    case "SET_NOTICE":
      return { ...state, notice: action.notice };
  }
}

export function FioreDemo() {
  /*
   * Render determinista: servidor y cliente empiezan con la semilla. B2 muestra
   * cifras derivadas, así que la recuperación de localStorage se aplica después
   * del montaje para que el primer render del cliente coincida con el HTML SSR.
   */
  const [state, dispatch] = useReducer(fioreDemoReducer, undefined, createSeedState);
  const [ui, uiDispatch] = useReducer(uiReducer, { hydrationReady: false, notice: null });
  const [activeView, setActiveView] = useState<FioreDemoView>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasMobileNavOpen = useRef(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [overlay, setOverlay] = useState<FioreOverlay>(null);

  useEffect(() => {
    const loaded = loadDemoState();
    if (loaded.status === "ok") dispatch({ type: "HYDRATE", state: loaded.state });
    uiDispatch({
      type: "HYDRATION_READY",
      notice: loaded.status === "invalid" ? loaded.reason : null,
    });
  }, []);

  useEffect(() => {
    if (!ui.hydrationReady) return;
    saveDemoState(state);
  }, [state, ui.hydrationReady]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (wasMobileNavOpen.current && !mobileNavOpen) menuButtonRef.current?.focus();
    wasMobileNavOpen.current = mobileNavOpen;
  }, [mobileNavOpen]);

  const handleNavigate = useCallback((view: FioreDemoView) => {
    setActiveView(view);
    setMobileNavOpen(false);
  }, []);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const openReset = useCallback(() => setResetOpen(true), []);
  const cancelReset = useCallback(() => setResetOpen(false), []);
  const confirmReset = useCallback(() => {
    clearDemoState();
    dispatch({ type: "RESET" });
    setActiveView("dashboard");
    setMobileNavOpen(false);
    setResetOpen(false);
    setOverlay(null);
    uiDispatch({ type: "SET_NOTICE", notice: "Demo reiniciada con los datos ficticios iniciales." });
  }, []);

  /**
   * Toda escritura del inventario se valida con `applyDemoAction` antes de
   * despacharse. El reducer sigue siendo la única fuente de transiciones; aquí
   * solo se traduce el resultado a un aviso visible.
   */
  const commitAction = useCallback(
    (action: FioreDemoAction, successNotice: string): DemoActionResult => {
      const result = applyDemoAction(state, action);
      if (!result.changed) return result;
      dispatch(action);
      uiDispatch({ type: "SET_NOTICE", notice: successNotice });
      return result;
    },
    [state],
  );

  const openOverlay = useCallback((kind: FioreOverlayKind) => setOverlay({ kind }), []);
  const openEditOverlay = useCallback(
    (kind: FioreOverlayKind, id: string) => setOverlay({ kind, id }),
    [],
  );
  const closeOverlay = useCallback(() => setOverlay(null), []);

  /* B4 — Activar/desactivar conserva la entidad y sus asociaciones. */
  const toggleCategory = useCallback(
    (row: DemoCategoryCount) => {
      const result = commitAction(
        { type: "UPDATE_CATEGORY", id: row.id, patch: { active: !row.active } },
        `Categoría demo ${row.active ? "desactivada" : "activada"}.`,
      );
      if (!result.changed) {
        uiDispatch({ type: "SET_NOTICE", notice: result.error ?? "No se pudo cambiar la categoría demo." });
      }
    },
    [commitAction],
  );

  const toggleSupplier = useCallback(
    (row: DemoSupplierCount) => {
      const result = commitAction(
        { type: "UPDATE_SUPPLIER", id: row.id, patch: { active: !row.active } },
        `Proveedor demo ${row.active ? "desactivado" : "activado"}.`,
      );
      if (!result.changed) {
        uiDispatch({ type: "SET_NOTICE", notice: result.error ?? "No se pudo cambiar el proveedor demo." });
      }
    },
    [commitAction],
  );

  const currentItem = getFioreNavItem(activeView);
  const editingProduct =
    overlay?.kind === "product" && overlay.id
      ? state.products.find((product) => product.id === overlay.id)
      : undefined;
  const editingCategory =
    overlay?.kind === "category" && overlay.id
      ? state.categories.find((category) => category.id === overlay.id)
      : undefined;
  const editingSupplier =
    overlay?.kind === "supplier" && overlay.id
      ? state.suppliers.find((supplier) => supplier.id === overlay.id)
      : undefined;

  const showProductDialog = overlay?.kind === "product" && (!overlay.id || editingProduct);
  const showCategoryDialog = overlay?.kind === "category" && (!overlay.id || editingCategory);
  const showSupplierDialog = overlay?.kind === "supplier" && (!overlay.id || editingSupplier);
  const showMovementDialog = overlay?.kind === "movement" || overlay?.kind === "sale";

  return (
    <FioreDemoFrame notice={ui.notice} onReset={openReset}>
      <div className={styles.appShell}>
        <FioreSidebar
          activeView={activeView}
          mobileOpen={mobileNavOpen}
          onNavigate={handleNavigate}
          onCloseMobile={closeMobileNav}
        />

        <div className={styles.content} inert={mobileNavOpen}>
          <div className={styles.mobileTopbar}>
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menú"
              aria-controls="fiore-demo-nav"
              aria-expanded={mobileNavOpen}
            >
              <FioreIcon name="menu" className={styles.iconButtonSvg} />
              <span>Menú</span>
            </button>
            <span className={styles.mobileTopbarLabel}>Fiore · Demo</span>
          </div>

          <main className={styles.contentBody}>
            {activeView === "dashboard" ? (
              <FioreDashboardView state={state} item={currentItem} />
            ) : activeView === "inventory" ? (
              <FioreInventoryView
                state={state}
                item={currentItem}
                onNewProduct={() => openOverlay("product")}
                onEditProduct={(id) => openEditOverlay("product", id)}
              />
            ) : activeView === "categories" ? (
              <FioreCategoriesView
                state={state}
                item={currentItem}
                onNewCategory={() => openOverlay("category")}
                onEditCategory={(id) => openEditOverlay("category", id)}
                onToggleCategory={toggleCategory}
              />
            ) : activeView === "suppliers" ? (
              <FioreSuppliersView
                state={state}
                item={currentItem}
                onNewSupplier={() => openOverlay("supplier")}
                onEditSupplier={(id) => openEditOverlay("supplier", id)}
                onToggleSupplier={toggleSupplier}
              />
            ) : activeView === "movements" ? (
              <FioreMovementsView
                state={state}
                item={currentItem}
                onNewMovement={() => openOverlay("movement")}
                onSale={() => openOverlay("sale")}
              />
            ) : activeView === "reports" ? (
              <FioreReportsView state={state} item={currentItem} />
            ) : (
              <FiorePlaceholderView item={currentItem} />
            )}
          </main>
        </div>
      </div>

      {showProductDialog ? (
        <FioreProductDialog
          state={state}
          product={editingProduct}
          onCancel={closeOverlay}
          onCommit={commitAction}
        />
      ) : null}
      {showCategoryDialog ? (
        <FioreCategoryDialog
          state={state}
          category={editingCategory}
          onCancel={closeOverlay}
          onCommit={commitAction}
        />
      ) : null}
      {showSupplierDialog ? (
        <FioreSupplierDialog
          state={state}
          supplier={editingSupplier}
          onCancel={closeOverlay}
          onCommit={commitAction}
        />
      ) : null}
      {showMovementDialog ? (
        <FioreMovementDialog
          state={state}
          mode={overlay?.kind === "sale" ? "sale" : "manual"}
          onCancel={closeOverlay}
          onCommit={commitAction}
        />
      ) : null}
      {resetOpen ? <FioreResetDialog onCancel={cancelReset} onConfirm={confirmReset} /> : null}
    </FioreDemoFrame>
  );
}
