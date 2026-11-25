/**
 * B1 — Vista provisional de cada sección.
 *
 * No consulta selectores ni muestra cifras: los KPIs, formularios y reportes
 * pertenecen a B2 en adelante. Solo conserva la jerarquía visual de Fiore.
 */

import type { FioreNavItem } from "./fiore-navigation";
import { FioreIcon } from "./FioreIcons";
import styles from "./fiore-demo.module.css";

interface FiorePlaceholderViewProps {
  item: FioreNavItem;
}

export function FiorePlaceholderView({ item }: FiorePlaceholderViewProps) {
  return (
    <div className={styles.mainContent}>
      <header className={styles.viewHeader}>
        <h2 className={styles.viewTitle}>{item.label}</h2>
        <p className={styles.viewSubtitle}>{item.subtitle}</p>
      </header>

      <section className={styles.sectionCard} aria-labelledby={`fiore-section-${item.view}`}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>
            <FioreIcon name={item.icon} className={styles.cardHeaderIcon} />
          </span>
          <h3 id={`fiore-section-${item.view}`} className={styles.cardTitle}>
            {item.label}
          </h3>
          <span className={styles.cardBadge}>{item.block}</span>
        </div>
        <div className={styles.cardBody}>
          <FioreIcon name={item.icon} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Sección en preparación</p>
          <p className={styles.emptyText}>{item.placeholder}</p>
        </div>
      </section>
    </div>
  );
}
