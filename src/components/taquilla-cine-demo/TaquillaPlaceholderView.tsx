/**
 * C3 — Vista provisional compartida por las cuatro secciones.
 *
 * Auxiliar pequeño con una necesidad real: C3 debe conservar la jerarquía del
 * sistema académico sin anticipar formularios, tablas ni acciones de C4–C6.
 * Por eso solo contiene texto y decoración `aria-hidden`.
 */

import type { TaquillaNavItem } from "./taquilla-navigation";
import { TaquillaIcon } from "./TaquillaIcons";
import styles from "./taquilla-demo.module.css";

interface TaquillaPlaceholderViewProps {
  item: TaquillaNavItem;
}

export function TaquillaPlaceholderView({ item }: TaquillaPlaceholderViewProps) {
  return (
    <div className={styles.mainContent}>
      <header className={styles.viewHeader}>
        <span className={styles.eyebrow}>{item.block}</span>
        <h2 className={styles.viewTitle}>{item.label}</h2>
        <p className={styles.viewSubtitle}>{item.subtitle}</p>
      </header>

      <section className={styles.placeholderCard} aria-labelledby={`taquilla-seccion-${item.view}`}>
        <div className={styles.placeholderHeader}>
          <span className={styles.placeholderIcon}>
            <TaquillaIcon name={item.icon} className={styles.placeholderIconSvg} />
          </span>
          <div className={styles.placeholderHeading}>
            <h3 id={`taquilla-seccion-${item.view}`} className={styles.placeholderTitle}>
              Espacio reservado para {item.label.toLowerCase()}
            </h3>
            <span className={styles.placeholderBadge}>Funcionalidad en desarrollo</span>
          </div>
        </div>

        <div className={styles.placeholderBody}>
          <p className={styles.placeholderText}>
            La interfaz de esta sección se integrará en {item.block}. Esta vista no registra datos ni simula operaciones.
          </p>
          <div className={styles.placeholderPreview} aria-hidden="true">
            <div className={styles.previewLineWide} />
            <div className={styles.previewLineMedium} />
            <div className={styles.previewLineShort} />
          </div>
        </div>
      </section>
    </div>
  );
}
