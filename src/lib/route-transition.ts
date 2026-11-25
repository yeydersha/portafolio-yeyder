/**
 * Lógica pura de las transiciones locales del portafolio.
 *
 * Hay dos grupos independientes: portada ↔ Fiore y portada ↔ Taquilla. La
 * portada pertenece a ambos, por eso el grupo se decide con el par
 * origen→destino y no con una sola ruta. No se anima Fiore ↔ Taquilla.
 * No depende de React ni de Next.js para poder probarse de forma aislada.
 */

const HOME_PATH = "/";
const FIORE_DEMO_PATH = "/proyectos/fiore/demo";
const TAQUILLA_DEMO_PATH = "/proyectos/taquilla-cine/demo";

export const ROUTE_TRANSITION_PATHS = [
  HOME_PATH,
  FIORE_DEMO_PATH,
  TAQUILLA_DEMO_PATH,
] as const;

export type RouteTransitionGroup = "fiore" | "taquilla";

/** Devuelve el grupo permitido para un par de rutas, o `null` si no aplica. */
export function getRouteTransitionGroup(
  currentPath: string,
  targetPath: string,
): RouteTransitionGroup | null {
  const esIda = currentPath === HOME_PATH;
  const esVuelta = targetPath === HOME_PATH;

  if (esIda && targetPath === FIORE_DEMO_PATH) return "fiore";
  if (currentPath === FIORE_DEMO_PATH && esVuelta) return "fiore";
  if (esIda && targetPath === TAQUILLA_DEMO_PATH) return "taquilla";
  if (currentPath === TAQUILLA_DEMO_PATH && esVuelta) return "taquilla";
  return null;
}

export type SmoothScrollBehavior = "auto" | "smooth";

export interface InternalNavigationCandidate {
  currentPath: string;
  href: string;
  origin: string;
  target?: string;
  hasDownload?: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}

export function isRouteTransitionPath(pathname: string): boolean {
  return (ROUTE_TRANSITION_PATHS as readonly string[]).includes(pathname);
}

export function getSmoothScrollBehavior(
  reduceMotion: boolean,
): SmoothScrollBehavior {
  return reduceMotion ? "auto" : "smooth";
}

/**
 * Solo se animan clics primarios, internos y dentro de un mismo grupo. Los
 * enlaces con modificadores, destino externo, descarga o anclas de la misma
 * página conservan su comportamiento nativo.
 */
export function shouldAnimateInternalNavigation(
  candidate: InternalNavigationCandidate,
): boolean {
  const {
    currentPath,
    href,
    origin,
    target,
    hasDownload,
    button,
    metaKey,
    ctrlKey,
    shiftKey,
    altKey,
    defaultPrevented,
  } = candidate;

  if (
    defaultPrevented ||
    button !== 0 ||
    metaKey ||
    ctrlKey ||
    shiftKey ||
    altKey ||
    target ||
    hasDownload
  ) {
    return false;
  }

  if (!isRouteTransitionPath(currentPath)) return false;

  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return false;
  }

  if (url.origin !== origin) return false;
  if (!isRouteTransitionPath(url.pathname)) return false;
  if (getRouteTransitionGroup(currentPath, url.pathname) === null) return false;

  // Un hash sobre la ruta actual lo resuelve el scroll suave, no el router.
  const samePage = url.pathname === currentPath && url.search === "";
  return !samePage;
}
