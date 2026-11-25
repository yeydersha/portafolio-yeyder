/**
 * B1 — Configuración local de la navegación de la demo.
 *
 * Las seis vistas existen solo en estado local; no hay rutas internas ni
 * autenticación. Los bloques indicados corresponden al plan documentado.
 */

import type { FioreDemoView } from "@/data/fiore-demo/types";
import type { FioreIconName } from "./FioreIcons";

export interface FioreNavItem {
  view: FioreDemoView;
  label: string;
  subtitle: string;
  placeholder: string;
  block: string;
  icon: FioreIconName;
}

export const FIORE_NAV_ITEMS: readonly FioreNavItem[] = [
  {
    view: "dashboard",
    label: "Dashboard",
    subtitle: "Resumen del estado del inventario",
    placeholder: "Dashboard implementado en el bloque B2.",
    block: "Bloque B2",
    icon: "dashboard",
  },
  {
    view: "inventory",
    label: "Inventario",
    subtitle: "Consulta del catálogo de accesorios ficticios",
    placeholder: "Inventario implementado en el bloque B3.",
    block: "Bloque B3",
    icon: "inventory",
  },
  {
    view: "categories",
    label: "Categorías",
    subtitle: "Agrupación de las piezas de demostración",
    placeholder: "La gestión de categorías ficticias está disponible en la demo.",
    block: "Bloque B3",
    icon: "categories",
  },
  {
    view: "suppliers",
    label: "Proveedores",
    subtitle: "Referencias ficticias del catálogo demo",
    placeholder: "Las referencias de proveedores ficticios están disponibles en la demo.",
    block: "Bloque B3",
    icon: "suppliers",
  },
  {
    view: "movements",
    label: "Movimientos",
    subtitle: "Historial simulado de entradas y salidas",
    placeholder: "El historial interactivo de movimientos ficticios está disponible.",
    block: "Bloque B4",
    icon: "movements",
  },
  {
    view: "reports",
    label: "Reportes",
    subtitle: "Proyecciones derivadas del estado de la demo",
    placeholder: "Los reportes derivados del estado ficticio están disponibles.",
    block: "Bloque B5",
    icon: "reports",
  },
];

export function getFioreNavItem(view: FioreDemoView): FioreNavItem {
  return FIORE_NAV_ITEMS.find((item) => item.view === view) ?? FIORE_NAV_ITEMS[0];
}
