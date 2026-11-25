/**
 * B1 — Sidebar de la demo Fiore.
 *
 * En escritorio ocupa 248px con el vino profundo original; en móvil se convierte
 * en un panel desplegable accesible, cerrado con overlay, botón o Escape.
 */

"use client";

import { useEffect, useRef } from "react";
import type { FioreDemoView } from "@/data/fiore-demo/types";
import { FIORE_NAV_ITEMS } from "./fiore-navigation";
import { FioreIcon } from "./FioreIcons";
import { FIORE_FOCUSABLE } from "./useFioreDialog";
import styles from "./fiore-demo.module.css";

interface FioreSidebarProps {
  activeView: FioreDemoView;
  mobileOpen: boolean;
  onNavigate: (view: FioreDemoView) => void;
  onCloseMobile: () => void;
}

export function FioreSidebar({ activeView, mobileOpen, onNavigate, onCloseMobile }: FioreSidebarProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !navRef.current) return;
      const focusable = Array.from(navRef.current.querySelectorAll<HTMLElement>(FIORE_FOCUSABLE));
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
    return () => document.removeEventListener("keydown", handleKeyDown);
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
        id="fiore-demo-nav"
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}
        aria-label="Navegación de la demo Fiore"
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.wordmark}>
            <FioreIcon name="flower" className={styles.wordmarkIcon} />
            <span>Fiore</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={`${styles.iconButton} ${styles.closeMenuButton}`}
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
          >
            <FioreIcon name="close" className={styles.iconButtonSvg} />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Secciones de la demostración">
          {FIORE_NAV_ITEMS.map((item) => {
            const isActive = item.view === activeView;
            return (
              <button
                key={item.view}
                type="button"
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onNavigate(item.view)}
              >
                <FioreIcon name={item.icon} className={styles.navIcon} />
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
