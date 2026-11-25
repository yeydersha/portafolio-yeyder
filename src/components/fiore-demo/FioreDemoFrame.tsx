/**
 * B1 — Marco decorativo de ventana y cabecera exterior de la demo.
 *
 * La barra superior es solo ornamentación: no simula un dominio, una URL ni un
 * navegador real. Los estilos de Fiore quedan confinados al contenido interno.
 */

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FioreIcon } from "./FioreIcons";
import styles from "./fiore-demo.module.css";

interface FioreDemoFrameProps {
  children: ReactNode;
  notice: string | null;
  onReset: () => void;
}

export function FioreDemoFrame({ children, notice, onReset }: FioreDemoFrameProps) {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <div className={styles.introText}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Fiore</h1>
            <span className={styles.demoBadge}>Demostración · Datos ficticios</span>
          </div>
          <p className={styles.introSubtitle}>
            Vista previa aislada del sistema de gestión, integrada en el portafolio de Yeyder Otero.
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/" className={`${styles.button} ${styles.buttonSecondary}`}>
            <FioreIcon name="back" className={styles.buttonIcon} />
            Volver al portafolio
          </Link>
          <button type="button" className={`${styles.button} ${styles.buttonReset}`} onClick={onReset}>
            <FioreIcon name="reset" className={styles.buttonIcon} />
            Reiniciar demo
          </button>
        </div>
      </header>

      <section className={styles.frame} aria-label="Ventana de demostración de Fiore">
        <div className={styles.chrome} aria-hidden="true">
          <span className={`${styles.chromeDot} ${styles.dotWine}`} />
          <span className={`${styles.chromeDot} ${styles.dotBeige}`} />
          <span className={`${styles.chromeDot} ${styles.dotRose}`} />
          <span className={styles.chromeLabel}>Vista previa · entorno de demostración</span>
        </div>
        {notice ? (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        ) : null}
        {children}
      </section>
    </div>
  );
}
