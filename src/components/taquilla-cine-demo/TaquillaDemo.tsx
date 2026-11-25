/**
 * C3 — Contenedor cliente de la demo de Taquilla de Cine.
 *
 * Servidor y primer render del cliente usan siempre `createSeedState()`; la
 * lectura de `localStorage` se aplica en un efecto posterior al montaje para
 * evitar diferencias de hidratación. Toda transición del estado pasa por
 * `applyDemoAction`, la única puerta definida en C2.
 *
 * C4 muestra Películas, C5 muestra Funciones y C6 muestra Compras y Taquilla.
 * El contenedor no crea una fuente paralela de datos: `commitAction` solo
 * publica resultados del reducer de C2.
 */

"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createSeedState } from "@/data/taquilla-cine-demo/seed";
import type { TaquillaDemoState, TaquillaDemoView } from "@/data/taquilla-cine-demo/types";
import {
  applyDemoAction,
  type TaquillaDemoAction,
  type TaquillaDemoActionResult,
} from "@/lib/taquilla-cine-demo/reducer";
import {
  clearTaquillaState,
  loadTaquillaState,
  saveTaquillaState,
} from "@/lib/taquilla-cine-demo/storage";
import { TaquillaComprasView } from "./TaquillaComprasView";
import { TaquillaDemoFrame } from "./TaquillaDemoFrame";
import { TaquillaFuncionesView } from "./TaquillaFuncionesView";
import { TaquillaIcon } from "./TaquillaIcons";
import { TaquillaPeliculasView } from "./TaquillaPeliculasView";
import { TaquillaReportesView } from "./TaquillaReportesView";
import { TaquillaPlaceholderView } from "./TaquillaPlaceholderView";
import { TaquillaResetDialog } from "./TaquillaResetDialog";
import { TaquillaSidebar } from "./TaquillaSidebar";
import { getTaquillaNavItem, TAQUILLA_INITIAL_VIEW } from "./taquilla-navigation";
import styles from "./taquilla-demo.module.css";

/** Adaptador mínimo: el reducer puro sigue siendo la única fuente de verdad. */
function taquillaStateReducer(
  state: TaquillaDemoState,
  action: TaquillaDemoAction,
): TaquillaDemoState {
  return applyDemoAction(state, action).state;
}

interface TaquillaUiState {
  hydrationReady: boolean;
  notice: string | null;
}

type TaquillaUiAction =
  | { type: "HYDRATION_READY"; notice: string | null }
  | { type: "SET_NOTICE"; notice: string | null };

function uiReducer(state: TaquillaUiState, action: TaquillaUiAction): TaquillaUiState {
  switch (action.type) {
    case "HYDRATION_READY":
      return { hydrationReady: true, notice: action.notice };
    case "SET_NOTICE":
      return { ...state, notice: action.notice };
  }
}

export function TaquillaDemo() {
  const [state, dispatch] = useReducer(taquillaStateReducer, undefined, createSeedState);
  const [ui, uiDispatch] = useReducer(uiReducer, { hydrationReady: false, notice: null });
  const [activeView, setActiveView] = useState<TaquillaDemoView>(TAQUILLA_INITIAL_VIEW);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasMobileNavOpen = useRef(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetSerial, setResetSerial] = useState(0);

  useEffect(() => {
    const loaded = loadTaquillaState();
    if (loaded.status === "ok") dispatch({ type: "HYDRATE", state: loaded.state });
    uiDispatch({
      type: "HYDRATION_READY",
      notice: "reason" in loaded ? loaded.reason ?? null : null,
    });
  }, []);

  useEffect(() => {
    if (!ui.hydrationReady) return;
    saveTaquillaState(state);
  }, [state, ui.hydrationReady]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // C5 — corrección mínima a la observación de C4: el menú es la capa
      // superior, por lo que su Escape no debe cerrar también la ficha o el
      // formulario de la vista. Capture + stopImmediatePropagation evita que
      // los listeners de la vista reciban el mismo evento.
      event.stopImmediatePropagation();
      setMobileNavOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [mobileNavOpen]);

  useEffect(() => {
    if (wasMobileNavOpen.current && !mobileNavOpen) menuButtonRef.current?.focus();
    wasMobileNavOpen.current = mobileNavOpen;
  }, [mobileNavOpen]);

  const handleNavigate = useCallback((view: TaquillaDemoView) => {
    setActiveView(view);
    setMobileNavOpen(false);
  }, []);

  /**
   * C4 — `applyDemoAction` ya calculó el resultado; el adaptador del reducer
   * sigue siendo la única puerta de cambio y aquí solo se propaga en caso
   * exitoso para que la vista pueda mostrar el error original de C2.
   */
  const commitAction = useCallback(
    (action: TaquillaDemoAction): TaquillaDemoActionResult => {
      const resultado = applyDemoAction(state, action);
      if (!resultado.error) dispatch(action);
      return resultado;
    },
    [state],
  );

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const openReset = useCallback(() => setResetOpen(true), []);
  const cancelReset = useCallback(() => setResetOpen(false), []);
  const confirmReset = useCallback(() => {
    clearTaquillaState();
    dispatch({ type: "RESET" });
    setResetSerial((actual) => actual + 1);
    setActiveView(TAQUILLA_INITIAL_VIEW);
    setMobileNavOpen(false);
    setResetOpen(false);
    uiDispatch({
      type: "SET_NOTICE",
      notice: "Demo reiniciada con los datos ficticios iniciales.",
    });
  }, []);

  const currentItem = getTaquillaNavItem(activeView);

  return (
    <TaquillaDemoFrame
      notice={ui.notice}
      onReset={openReset}
      backgroundInert={mobileNavOpen || resetOpen}
    >
      <div className={styles.appShell}>
        <TaquillaSidebar
          activeView={activeView}
          mobileOpen={mobileNavOpen}
          onNavigate={handleNavigate}
          onCloseMobile={closeMobileNav}
        />

        <div className={styles.content} inert={mobileNavOpen || resetOpen}>
          <div className={styles.mobileTopbar}>
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menú"
              aria-controls="taquilla-demo-nav"
              aria-expanded={mobileNavOpen}
            >
              <TaquillaIcon name="menu" className={styles.menuIcon} />
              <span>Menú</span>
            </button>
            <span className={styles.mobileTopbarLabel}>Taquilla · Demo</span>
          </div>

          <main id="taquilla-contenido" className={styles.contentBody} tabIndex={-1}>
            {activeView === "peliculas" ? (
              <TaquillaPeliculasView
                key={resetSerial}
                item={currentItem}
                state={state}
                onAction={commitAction}
              />
            ) : activeView === "funciones" ? (
              <TaquillaFuncionesView
                key={resetSerial}
                item={currentItem}
                state={state}
                onAction={commitAction}
              />
            ) : activeView === "compras" ? (
              <TaquillaComprasView
                key={resetSerial}
                item={currentItem}
                state={state}
                onAction={commitAction}
              />
            ) : activeView === "taquilla" ? (
              <TaquillaReportesView
                key={resetSerial}
                item={currentItem}
                state={state}
              />
            ) : (
              <TaquillaPlaceholderView item={currentItem} />
            )}
          </main>
        </div>
      </div>

      {resetOpen ? <TaquillaResetDialog onCancel={cancelReset} onConfirm={confirmReset} /> : null}
    </TaquillaDemoFrame>
  );
}
