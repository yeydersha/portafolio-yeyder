"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import {
  isRouteTransitionPath,
  shouldAnimateInternalNavigation,
} from "@/lib/route-transition";

/**
 * Envoltura local de los flujos portafolio ↔ Fiore y portafolio ↔ Taquilla.
 * No sustituye al router de Next.js: solo retrasa ~140 ms la navegación para
 * que el contenido saliente se desvanezca. El contenido entrante usa una
 * animación CSS breve; la decisión de grupo ocurre en `route-transition.ts`.
 */
export function RouteTransitionSurface({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const timerRef = useRef(0);
  const scoped = isRouteTransitionPath(pathname);

  useEffect(() => {
    if (!scoped) return;

    const onClick = (nativeEvent: Event) => {
      const event = nativeEvent as globalThis.MouseEvent;
      if (event.defaultPrevented) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.hasAttribute("data-no-route-transition")) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#")) return;

      const candidate = {
        currentPath: pathname,
        href: anchor.href,
        origin: window.location.origin,
        target: anchor.target || undefined,
        hasDownload: anchor.hasAttribute("download"),
        button: event.button,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        defaultPrevented: event.defaultPrevented,
      };

      if (!shouldAnimateInternalNavigation(candidate)) return;

      event.preventDefault();
      // Fase de captura: evita que el onClick de next/link navegue de inmediato.
      event.stopPropagation();

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const url = new URL(anchor.href, window.location.origin);
      const destination = `${url.pathname}${url.search}${url.hash}`;
      const surface = document.querySelector<HTMLElement>(
        '[data-route-surface="scoped"]',
      );

      const navigate = () => {
        timerRef.current = 0;
        router.push(destination);
      };

      const animation =
        !reduceMotion && surface?.animate
          ? surface.animate(
              [{ opacity: 1 }, { opacity: 0.35 }],
              { duration: 140, easing: "ease-out", fill: "forwards" },
            )
          : null;

      window.clearTimeout(timerRef.current);
      if (animation?.finished) {
        void animation.finished.then(navigate, navigate);
      } else {
        timerRef.current = window.setTimeout(navigate, reduceMotion ? 0 : 140);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(timerRef.current);
      timerRef.current = 0;
    };
  }, [pathname, router, scoped]);

  return (
    <div
      key={pathname}
      data-route-surface={scoped ? "scoped" : "plain"}
      className="flex min-h-full flex-1 flex-col"
    >
      {children}
    </div>
  );
}
