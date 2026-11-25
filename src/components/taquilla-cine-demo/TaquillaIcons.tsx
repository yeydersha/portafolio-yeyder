/**
 * C3 — Iconografía SVG lineal de la demo.
 *
 * Auxiliar pequeño: reproduce el trazo 2px del sistema académico original sin
 * añadir dependencias ni importar los iconos de Fiore. Solo dibuja; no recibe
 * estado ni expone controles.
 */

import type { ReactNode } from "react";
import type { TaquillaIconName } from "./taquilla-navigation";

interface TaquillaIconProps {
  name: TaquillaIconName;
  className?: string;
}

const iconPaths: Record<TaquillaIconName, ReactNode> = {
  film: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="7" y1="4" x2="7" y2="20" />
      <line x1="17" y1="4" x2="17" y2="20" />
      <line x1="3" y1="9" x2="7" y2="9" />
      <line x1="17" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="7" y2="15" />
      <line x1="17" y1="15" x2="21" y2="15" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
      <line x1="13" y1="6" x2="13" y2="18" strokeDasharray="2 3" />
    </>
  ),
  chart: (
    <>
      <line x1="4" y1="20" x2="20" y2="20" />
      <line x1="7" y1="20" x2="7" y2="12" />
      <line x1="12" y1="20" x2="12" y2="5" />
      <line x1="17" y1="20" x2="17" y2="9" />
    </>
  ),
  menu: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </>
  ),
  close: (
    <>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </>
  ),
  reset: (
    <>
      <path d="M4 11a8 8 0 1 1 2.4 5.7" />
      <polyline points="4 5 4 11 10 11" />
    </>
  ),
  back: (
    <>
      <line x1="20" y1="12" x2="4" y2="12" />
      <polyline points="10 6 4 12 10 18" />
    </>
  ),
};

export function TaquillaIcon({ name, className }: TaquillaIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths[name]}
    </svg>
  );
}
