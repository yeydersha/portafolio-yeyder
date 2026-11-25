/**
 * B2 — Dashboard funcional de la demo Fiore.
 *
 * Todas las cifras se derivan del estado compartido B0 mediante
 * `selectDashboardStats`. El componente no guarda estadísticas propias ni
 * repite fórmulas financieras: solo presenta los valores calculados por la
 * capa funcional.
 */

"use client";

import { useMemo, type ReactNode } from "react";
import type { DemoInventoryRow, FioreDemoState } from "@/data/fiore-demo/types";
import { formatCOP } from "@/lib/fiore-demo/pricing";
import { LOW_STOCK_MAX, selectDashboardStats } from "@/lib/fiore-demo/selectors";
import { FioreIcon, type FioreIconName } from "./FioreIcons";
import type { FioreNavItem } from "./fiore-navigation";
import styles from "./fiore-demo.module.css";

interface FioreDashboardViewProps {
  state: FioreDemoState;
  item: FioreNavItem;
}

type StatTone = "wine" | "green" | "amber" | "rose" | "blue";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: FioreIconName;
  tone: StatTone;
}

interface PanelProps {
  title: string;
  icon: FioreIconName;
  badge: string;
  children: ReactNode;
}

interface EmptyPanelProps {
  icon: FioreIconName;
  title: string;
  text: string;
}

const countFormatter = new Intl.NumberFormat("es-CO");

function formatCount(value: number): string {
  return countFormatter.format(value);
}

function StatCard({ label, value, hint, icon, tone }: StatCardProps) {
  return (
    <article className={styles.statCard}>
      <div className={styles.statCardTop}>
        <div className={styles.statCardText}>
          <p className={styles.statLabel}>{label}</p>
          <p className={styles.statValue}>{value}</p>
        </div>
        <span className={`${styles.statIcon} ${styles[`tone${tone}`]}`}>
          <FioreIcon name={icon} />
        </span>
      </div>
      <p className={styles.statHint}>{hint}</p>
    </article>
  );
}

function Panel({ title, icon, badge, children }: PanelProps) {
  return (
    <section className={styles.panelCard} aria-label={title}>
      <header className={styles.panelHeader}>
        <span className={`${styles.panelIcon} ${styles.toneWine}`}>
          <FioreIcon name={icon} />
        </span>
        <h3 className={styles.panelTitle}>{title}</h3>
        <span className={styles.panelBadge}>{badge}</span>
      </header>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

function EmptyPanel({ icon, title, text }: EmptyPanelProps) {
  return (
    <div className={styles.emptyState}>
      <FioreIcon name={icon} className={styles.emptyStateIcon} />
      <p className={styles.emptyStateTitle}>{title}</p>
      <p className={styles.emptyStateText}>{text}</p>
    </div>
  );
}

function ProductIdentity({ row }: { row: DemoInventoryRow }) {
  return (
    <div className={styles.productInfo}>
      <p className={styles.productName} title={row.name}>
        {row.name}
      </p>
      <p className={styles.productSku}>{row.sku}</p>
    </div>
  );
}

function LowStockPanel({ rows }: { rows: DemoInventoryRow[] }) {
  return (
    <Panel title="Productos con stock bajo" icon="alert" badge={`≤ ${LOW_STOCK_MAX} und`}>
      {rows.length === 0 ? (
        <EmptyPanel
          icon="inventory"
          title="Sin alertas de stock bajo"
          text="Ningún producto ficticio tiene entre 1 y 5 unidades disponibles."
        />
      ) : (
        <ul className={styles.panelList}>
          {rows.map((row) => (
            <li key={row.id} className={styles.productRow}>
              <ProductIdentity row={row} />
              <div className={styles.productMetrics}>
                <span className={`${styles.stockBadge} ${styles.stockBadgeLow}`}>
                  {formatCount(row.stock)} und
                </span>
                <span className={styles.moneySmall}>{formatCOP(row.pricing.sellingPrice)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function OutOfStockPanel({ rows }: { rows: DemoInventoryRow[] }) {
  return (
    <Panel title="Productos agotados" icon="box" badge="Stock 0">
      {rows.length === 0 ? (
        <EmptyPanel
          icon="box"
          title="Sin productos agotados"
          text="Todos los productos ficticios conservan existencias disponibles."
        />
      ) : (
        <ul className={styles.panelList}>
          {rows.map((row) => (
            <li key={row.id} className={styles.productRow}>
              <ProductIdentity row={row} />
              <div className={styles.productMetrics}>
                <span className={`${styles.stockBadge} ${styles.stockBadgeOut}`}>Agotado</span>
                <span className={styles.moneySmall}>{formatCOP(row.pricing.sellingPrice)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RecentProductsPanel({ rows }: { rows: DemoInventoryRow[] }) {
  return (
    <Panel title="Productos recientes" icon="clock" badge="Últimos 5">
      {rows.length === 0 ? (
        <EmptyPanel
          icon="inventory"
          title="No hay productos registrados"
          text="Los productos ficticios agregados aparecerán aquí por fecha de alta."
        />
      ) : (
        <ul className={styles.panelList}>
          {rows.map((row) => (
            <li key={row.id} className={styles.productRow}>
              <ProductIdentity row={row} />
              <div className={styles.productMetrics}>
                <span className={`${styles.stockBadge} ${styles.stockBadgeRecent}`}>
                  {formatCount(row.stock)} und
                </span>
                <span className={styles.dateSmall}>Alta {row.createdAt.slice(0, 10)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function TopProfitPanel({ rows }: { rows: DemoInventoryRow[] }) {
  return (
    <Panel title="Mayor ganancia potencial" icon="award" badge="Top 5">
      {rows.length === 0 ? (
        <EmptyPanel
          icon="award"
          title="No hay datos de ganancia"
          text="La proyección aparecerá cuando existan productos ficticios con stock."
        />
      ) : (
        <ul className={styles.panelList}>
          {rows.map((row, index) => (
            <li key={row.id} className={styles.productRow}>
              <span className={styles.rank}>#{index + 1}</span>
              <ProductIdentity row={row} />
              <div className={styles.productMetrics}>
                <span className={styles.profitValue}>
                  {formatCOP(row.pricing.grossProfitTotal)}
                </span>
                <span className={styles.marginSmall}>
                  Margen {row.pricing.marginPctOnSale}% sobre venta
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function FioreDashboardView({ state, item }: FioreDashboardViewProps) {
  /*
   * El estado ya viene de FioreDemo. `useMemo` solo evita recalcular los
   * selectores en renderizados sin cambios; no crea un estado paralelo.
   */
  const stats = useMemo(() => selectDashboardStats(state), [state]);

  return (
    <div className={styles.mainContent}>
      <header className={styles.dashboardIntro}>
        <div>
          <h2 className={styles.viewTitle}>{item.label}</h2>
          <p className={styles.viewSubtitle}>{item.subtitle}</p>
        </div>
        <span className={styles.dashboardMeta}>Cifras derivadas · datos ficticios</span>
      </header>

      <div className={styles.projectionBanner} role="note">
        <span className={styles.projectionIcon}>
          <FioreIcon name="alert" />
        </span>
        <div>
          <p className={styles.projectionTitle}>Proyección, no ingreso realizado</p>
          <p className={styles.projectionCopy}>
            La ganancia bruta y el valor potencial se calculan con el stock actual y los precios de
            la demo. No representan dinero recibido ni ventas efectivamente realizadas.
          </p>
        </div>
      </div>

      <div className={styles.statGrid}>
        <StatCard
          label="Productos registrados"
          value={formatCount(stats.totalProducts)}
          hint="Catálogo ficticio"
          icon="inventory"
          tone="wine"
        />
        <StatCard
          label="Unidades disponibles"
          value={formatCount(stats.totalUnits)}
          hint="Stock actual"
          icon="box"
          tone="green"
        />
        <StatCard
          label="Valor inventario (costo)"
          value={formatCOP(stats.totalCostValue)}
          hint="Costo × unidades"
          icon="dollar"
          tone="amber"
        />
        <StatCard
          label="Valor potencial de venta"
          value={formatCOP(stats.totalPotentialSaleValue)}
          hint="Precio vigente × stock"
          icon="trending"
          tone="wine"
        />
        <StatCard
          label="Ganancia bruta potencial"
          value={formatCOP(stats.totalPotentialProfit)}
          hint="Proyección, no ingreso"
          icon="trending"
          tone="green"
        />
        <StatCard
          label="Productos stock bajo"
          value={formatCount(stats.lowStockProducts.length)}
          hint={`Entre 1 y ${LOW_STOCK_MAX} unidades`}
          icon="alert"
          tone="amber"
        />
        <StatCard
          label="Productos agotados"
          value={formatCount(stats.outOfStockProducts.length)}
          hint="Sin existencias"
          icon="alert"
          tone="rose"
        />
      </div>

      <section className={styles.salesSummary} aria-labelledby="fiore-simulated-sales">
        <header className={styles.salesHeader}>
          <span className={`${styles.salesIcon} ${styles.toneBlue}`}>
            <FioreIcon name="reports" />
          </span>
          <h3 id="fiore-simulated-sales" className={styles.salesTitle}>
            Ventas ficticias registradas
          </h3>
        </header>
        <div className={styles.salesGrid}>
          <div className={styles.salesMetric}>
            <p className={styles.salesMetricLabel}>Operaciones</p>
            <p className={styles.salesMetricValue}>{formatCount(stats.simulatedSales.count)}</p>
          </div>
          <div className={styles.salesMetric}>
            <p className={styles.salesMetricLabel}>Unidades snapshot</p>
            <p className={styles.salesMetricValue}>{formatCount(stats.simulatedSales.units)}</p>
          </div>
          <div className={styles.salesMetric}>
            <p className={styles.salesMetricLabel}>Total snapshot</p>
            <p className={styles.salesMetricValue}>{formatCOP(stats.simulatedSales.revenue)}</p>
          </div>
        </div>
        <p className={styles.salesNote}>{stats.simulatedSales.note}</p>
      </section>

      <div className={styles.panelGrid}>
        <LowStockPanel rows={stats.lowStockProducts} />
        <OutOfStockPanel rows={stats.outOfStockProducts} />
        <RecentProductsPanel rows={stats.recentProducts} />
        <TopProfitPanel rows={stats.topProfitProducts} />
      </div>
    </div>
  );
}
