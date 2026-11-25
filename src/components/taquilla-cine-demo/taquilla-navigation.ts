/**
 * C3 — Configuración pura de la navegación local de la demo.
 *
 * Las cuatro vivas viven solo en estado React dentro de la misma ruta. Este
 * archivo no importa React ni componentes: puede comprobarse en el arnés de
 * pruebas CommonJS del portafolio sin arrastrar CSS Modules.
 */

import type { TaquillaDemoView } from "../../data/taquilla-cine-demo/types";

export type TaquillaIconName = "film" | "calendar" | "ticket" | "chart" | "menu" | "close" | "reset" | "back";

export interface TaquillaNavItem {
  view: TaquillaDemoView;
  label: string;
  subtitle: string;
  block: string;
  icon: TaquillaIconName;
}

/** La portada del sistema académico original abre Películas. */
export const TAQUILLA_INITIAL_VIEW: TaquillaDemoView = "peliculas";

export const TAQUILLA_NAV_ITEMS: readonly TaquillaNavItem[] = [
  {
    view: "peliculas",
    label: "Películas",
    subtitle: "Cartelera ficticia registrada para la demostración.",
    block: "Bloque C4",
    icon: "film",
  },
  {
    view: "funciones",
    label: "Funciones",
    subtitle: "Programación de funciones y disponibilidad de cupos.",
    block: "Bloque C5",
    icon: "calendar",
  },
  {
    view: "compras",
    label: "Compras",
    subtitle: "Registro simulado de entradas y clientes ficticios.",
    block: "Bloque C6",
    icon: "ticket",
  },
  {
    view: "taquilla",
    label: "Taquilla",
    subtitle: "Reporte de ventas por rango de fechas ficticio.",
    block: "Bloque C6",
    icon: "chart",
  },
];

export function getTaquillaNavItem(view: TaquillaDemoView): TaquillaNavItem {
  return TAQUILLA_NAV_ITEMS.find((item) => item.view === view) ?? TAQUILLA_NAV_ITEMS[0];
}
