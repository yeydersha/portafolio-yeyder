/**
 * C3 — Sidebar azul marino de la demo.
 *
 * En escritorio acompaña al área principal; hasta 900 px pasa a ser un panel
 * desplegable con overlay, Escape, trap de foco y botón de cierre explícito.
 */

"use client";

import { useEffect, useRef } from "react";
import type { TaquillaDemoView } from "@/data/taquilla-cine-demo/types";
import { TAQUILLA_NAV_ITEMS } from "./taquilla-navigation";
import { TaquillaIcon } from "./TaquillaIcons";
import styles from "./taquilla-demo.module.css";

interface TaquillaSidebarProps {
  activeView: TaquillaDemoView;
  mobileOpen: boolean;
  onNavigate: (view: TaquillaDemoView) => void;
  onCloseMobile: () => void;
}

const TAQUILLA_FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function TaquillaSidebar({
  activeView,
  mobileOpen,
  onNavigate,
  onCloseMobile,
}: TaquillaSidebarProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const focusTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    // El panel cambia de `visibility: hidden` a visible en el mismo ciclo;
    // reintentar el foco evita que el navegador lo descarte mientras todavía
    // aplica la transición de `visibility`.
    const focusClose = () => {
      const button = closeRef.current;
      if (!button) return;
      button.focus({ preventScroll: true });
      if (document.activeElement === button) return;
      // Si el foco ya entró al panel (p. ej. el usuario hizo Tab), no lo robamos.
      if (navRef.current?.contains(document.activeElement)) return;
      // `inert` y `visibility` pueden diferir el foco unos cuadros; reintentar
      // mientras siga fuera evita dejarlo en el body.
      focusTimerRef.current = window.setTimeout(focusClose, 50);
    };
    focusTimerRef.current = window.setTimeout(focusClose, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !navRef.current) return;
      const focusable = Array.from(navRef.current.querySelectorAll<HTMLElement>(TAQUILLA_FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (active === null || !navRef.current.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      if (focusTimerRef.current !== null) window.clearTimeout(focusTimerRef.current);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <>
      <div
        className={`${styles.navOverlay} ${mobileOpen ? styles.navOverlayVisible : ""}`}
        aria-hidden="true"
        onClick={onCloseMobile}
      />

      <aside
        ref={navRef}
        id="taquilla-demo-nav"
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}
        aria-label="Navegación de la demo Taquilla de Cine"
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.wordmark}>
            <TaquillaIcon name="film" className={styles.wordmarkIcon} />
            <span>Taquilla de Cine</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={`${styles.iconButton} ${styles.closeMenuButton}`}
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
          >
            <TaquillaIcon name="close" className={styles.iconButtonSvg} />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Secciones de la demostración">
          {TAQUILLA_NAV_ITEMS.map((item) => {
            const isActive = item.view === activeView;
            return (
              <button
                key={item.view}
                type="button"
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onNavigate(item.view)}
              >
                <TaquillaIcon name={item.icon} className={styles.navIcon} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <span>Entorno aislado · Datos ficticios</span>
        </div>
      </aside>
    </>
  );
}
