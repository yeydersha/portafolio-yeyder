/**
 * Parámetros compartidos por la apertura y el cierre de las presentaciones
 * ampliadas. Se mantienen en un módulo puro para poder verificarlos sin
 * montar React y para que el detalle interior y el panel exterior usen la
 * misma curva y duración.
 */
export const PRESENTATION_MOTION = {
  /** Duración de la transición completa, dentro del rango 350–450 ms. */
  duration: 0.4,
  /** Duración cuando el sistema solicita movimiento reducido. */
  reducedDuration: 0,
  /** Curva ease-out para Motion: salida rápida y aterrizaje sin rebote. */
  ease: "easeOut",
  /** La misma curva escrita como valor CSS válido. */
  cssEase: "ease-out",
  /** El panel exterior entra desde 16 px y el detalle interior desde 14 px. */
  enterY: 16,
  detailsEnterY: 14,
  /** La salida es más corta para no retener contenido invisible. */
  exitY: -8,
  detailsExitY: 6,
  /** La altura se anima entre 0 y su valor natural; nunca se fija en px. */
  collapsedHeight: 0,
  expandedHeight: "auto",
  /** Separación equivalente a `mt-6`, animada para no dejar hueco al cerrar. */
  detailsGap: 24,
  /** Separación equivalente a `mt-8`, animada en el panel exterior. */
  panelGap: 32,
  /** La saliente termina antes de montar la siguiente: nunca dos paneles. */
  mode: "wait",
} as const;

/** Devuelve la duración efectiva según la preferencia de movimiento. */
export function presentationDuration(reducedMotion: boolean): number {
  return reducedMotion
    ? PRESENTATION_MOTION.reducedDuration
    : PRESENTATION_MOTION.duration;
}
