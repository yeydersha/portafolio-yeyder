/**
 * C3 — Marco exterior de la demo de Taquilla de Cine.
 *
 * La etiqueta de demostración vive aquí, fuera del área cambiante, así que
 * permanece visible en las cuatro vistas. El botón de regreso apunta a `/` sin
 * tocar el sistema global de transiciones, reservado para C7.
 */

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { TaquillaIcon } from "./TaquillaIcons";
import styles from "./taquilla-demo.module.css";

interface TaquillaDemoFrameProps {
  children: ReactNode;
  notice: string | null;
  onReset: () => void;
  backgroundInert?: boolean;
}

export function TaquillaDemoFrame({
  children,
  notice,
  onReset,
  backgroundInert = false,
}: TaquillaDemoFrameProps) {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#taquilla-contenido">
        Saltar al contenido principal
      </a>

      <header className={styles.intro}>
        <div className={styles.introText}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Taquilla de Cine</h1>
            <span className={styles.demoBadge}>Demostración · Datos ficticios</span>
          </div>
          <p className={styles.introSubtitle}>
            Adaptación interactiva del sistema académico de gestión de cartelera, funciones, compras y reportes.
          </p>
        </div>
        <div className={styles.actions} inert={backgroundInert}>
          <Link href="/" className={`${styles.button} ${styles.buttonSecondary}`}>
            <TaquillaIcon name="back" className={styles.buttonIcon} />
            Volver al portafolio
          </Link>
          <button type="button" className={`${styles.button} ${styles.buttonReset}`} onClick={onReset}>
            <TaquillaIcon name="reset" className={styles.buttonIcon} />
            Reiniciar demo
          </button>
        </div>
      </header>

      <section className={styles.frame} aria-label="Vista de demostración de Taquilla de Cine">
        <div className={styles.chrome} aria-hidden="true">
          <span className={`${styles.chromeDot} ${styles.dotBlue}`} />
          <span className={`${styles.chromeDot} ${styles.dotSlate}`} />
          <span className={`${styles.chromeDot} ${styles.dotInfo}`} />
          <span className={styles.chromeLabel}>Vista previa · entorno de demostración</span>
        </div>
        {notice ? (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        ) : null}
        {children}
      </section>

      <footer className={styles.academicFooter}>
        <p>
          Adaptación de demostración del proyecto académico Taquilla de Cine. Datos ficticios, sin conexión a servicios reales.
        </p>
      </footer>
    </div>
  );
}
