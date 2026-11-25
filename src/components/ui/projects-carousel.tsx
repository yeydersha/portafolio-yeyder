"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

import { ProjectCard } from "@/components/ui/project-card";
import { ProjectShowcase } from "@/components/ui/project-showcase";
import {
  getProjectPresentation,
  portfolioProjects,
  type ProjectPresentation,
} from "@/data/projects";
import {
  PRESENTATION_MOTION,
  presentationDuration,
} from "@/lib/project-presentation-motion";
import { cn } from "@/lib/utils";

const lastIndex = portfolioProjects.length - 1;

type PresentationPanelProps = {
  projectId: string;
  projectName: string;
  presentation: ProjectPresentation;
  detailRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onReady: (projectId: string) => void;
};

/**
 * Panel exterior de la presentación ampliada. Motion controla opacidad,
 * desplazamiento, altura y orden de salida; la altura se mide del contenido
 * real para evitar el `height: auto` que se queda en 0 al reabrir.
 */
function PresentationPanel({
  projectId,
  projectName,
  presentation,
  detailRef,
  onClose,
  onReady,
}: PresentationPanelProps) {
  const isPresent = useIsPresent();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const height = useMotionValue<number>(PRESENTATION_MOTION.collapsedHeight);
  const marginTop = useMotionValue(0);
  const reducedMotion = useReducedMotion() ?? false;
  const duration = presentationDuration(reducedMotion);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    const measure = () => setContentHeight(node.getBoundingClientRect().height);
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  /*
   * Altura y separación comparten la misma curva que opacidad y desplazamiento.
   * Se animan valores medidos, no una altura fija, y se interrumpen limpiamente
   * cuando el proyecto cambia a mitad de transición.
   */
  useEffect(() => {
    const nextHeight =
      isPresent && contentHeight > 0
        ? contentHeight
        : PRESENTATION_MOTION.collapsedHeight;
    const heightAnimation = animate(height, nextHeight, {
      duration,
      ease: PRESENTATION_MOTION.ease,
    });
    const marginAnimation = animate(
      marginTop,
      isPresent ? PRESENTATION_MOTION.panelGap : 0,
      { duration, ease: PRESENTATION_MOTION.ease },
    );
    return () => {
      heightAnimation.stop();
      marginAnimation.stop();
    };
  }, [contentHeight, duration, height, isPresent, marginTop]);

  return (
    <motion.div
      id={`${projectId}-detalle`}
      ref={detailRef}
      tabIndex={-1}
      role="region"
      aria-label={`Presentación detallada de ${projectName}`}
      aria-hidden={!isPresent}
      inert={!isPresent}
      initial={{ opacity: 0, y: PRESENTATION_MOTION.enterY }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: PRESENTATION_MOTION.exitY }}
      transition={{ duration, ease: PRESENTATION_MOTION.ease }}
      onAnimationComplete={() => onReady(projectId)}
      style={{ height, marginTop }}
      className="overflow-hidden"
    >
      <div ref={contentRef}>
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border/60 bg-background/60 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-surface"
          >
            Cerrar presentación
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <ProjectShowcase presentation={presentation} />
      </div>
    </motion.div>
  );
}

/**
 * Carrusel de proyectos: desplazamiento nativo con scroll snap, controles
 * accesibles y una vista de detalle expandible para ElectroTero. No añade
 * dependencias: el estado se deriva de la posición real de desplazamiento.
 */
export function ProjectsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const openProjectIdRef = useRef<string | null>(null);
  const restoreFocusRef = useRef<HTMLButtonElement | null>(null);
  const focusRestoredRef = useRef(true);
  const closeTimerRef = useRef(0);
  const [canScroll, setCanScroll] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const activeRef = useRef(0);
  const settledRef = useRef(0);
  const pendingRef = useRef(false);
  const rafRef = useRef(0);
  const settleTimerRef = useRef(0);
  const pendingTimerRef = useRef(0);
  const smoothFallbackRef = useRef(0);
  const titleId = useId();

  const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const updateActive = useCallback((next: number) => {
    if (activeRef.current === next) return;
    activeRef.current = next;
    setActiveIndex(next);
  }, []);

  const settle = useCallback(() => {
    pendingRef.current = false;
    const index = activeRef.current;
    if (settledRef.current === index) return;
    settledRef.current = index;
    setAnnouncement(
      `Proyecto ${index + 1} de ${portfolioProjects.length}: ${portfolioProjects[index].name}`,
    );
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    /*
     * Se compara contra la posición de snap real de cada tarjeta (no contra
     * su centro geométrico): con una pista ancha donde caben todas, los
     * centros apuntarían a la tarjeta intermedia aunque no haya scroll.
     */
    const nearestIndex = () => {
      const trackRect = track.getBoundingClientRect();
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      let nearest = 0;
      let best = Number.POSITIVE_INFINITY;

      slideRefs.current.forEach((slide, index) => {
        if (!slide) return;
        const slideRect = slide.getBoundingClientRect();
        const offset = slideRect.left - trackRect.left + track.scrollLeft;
        const snapped = Math.min(
          Math.max(offset + slideRect.width / 2 - track.clientWidth / 2, 0),
          max,
        );
        const distance = Math.abs(track.scrollLeft - snapped);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      });
      return nearest;
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        if (pendingRef.current) return;
        updateActive(nearestIndex());
      });
    };

    const debouncedSettle = () => {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(settle, 180);
    };

    const supportsScrollEnd = "onscrollend" in (track as unknown as object);
    track.addEventListener("scroll", onScroll, { passive: true });
    if (supportsScrollEnd) {
      track.addEventListener("scrollend", settle);
    } else {
      track.addEventListener("scroll", debouncedSettle, { passive: true });
    }
    updateActive(nearestIndex());

    return () => {
      track.removeEventListener("scroll", onScroll);
      if (supportsScrollEnd) {
        track.removeEventListener("scrollend", settle);
      } else {
        track.removeEventListener("scroll", debouncedSettle);
      }
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      window.clearTimeout(settleTimerRef.current);
      window.clearTimeout(pendingTimerRef.current);
      window.clearTimeout(smoothFallbackRef.current);
    };
  }, [settle, updateActive]);

  /* Los controles solo aparecen cuando la fila realmente desborda. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      setCanScroll(track.scrollWidth - track.clientWidth > 1);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      const slide = slideRefs.current[index];
      if (!track || !slide) return;

      const trackRect = track.getBoundingClientRect();
      const slideRect = slide.getBoundingClientRect();
      const left =
        track.scrollLeft +
        (slideRect.left + slideRect.width / 2) -
        (trackRect.left + track.clientWidth / 2);

      pendingRef.current = true;
      updateActive(index);
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = window.setTimeout(settle, 700);

      const target = Math.max(0, left);
      const reduceMotion = prefersReducedMotion();
      track.scrollTo({
        left: target,
        behavior: reduceMotion ? "auto" : "smooth",
      });

      /*
       * Algunos entornos automatizados no animan el scroll suave y el snap
       * puede cancelarlo. Si tras dos comprobaciones no hay avance, se aplica
       * la posición final de forma directa para que las flechas siempre
       * funcionen; en un navegador normal la animación continúa intacta.
       */
      if (!reduceMotion && track.scrollLeft !== target) {
        window.clearTimeout(smoothFallbackRef.current);
        let previous = track.scrollLeft;
        let stagnant = 0;
        const verify = () => {
          const current = track.scrollLeft;
          if (Math.abs(current - target) <= 2) return;
          stagnant = Math.abs(current - previous) <= 1 ? stagnant + 1 : 0;
          previous = current;
          if (stagnant >= 2) {
            track.scrollTo({ left: target, behavior: "auto" });
            settle();
            return;
          }
          smoothFallbackRef.current = window.setTimeout(verify, 60);
        };
        smoothFallbackRef.current = window.setTimeout(verify, 80);
      }

      // Un control que acaba deshabilitado no debe retener el foco.
      if (index === 0 && document.activeElement === prevRef.current) {
        nextRef.current?.focus();
      }
      if (index === lastIndex && document.activeElement === nextRef.current) {
        prevRef.current?.focus();
      }
    },
    [settle, updateActive],
  );

  const onTrackKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== trackRef.current) return;
    const moves: Record<string, number> = {
      ArrowRight: Math.min(activeRef.current + 1, lastIndex),
      ArrowLeft: Math.max(activeRef.current - 1, 0),
      Home: 0,
      End: lastIndex,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    goTo(target);
  };

  /*
   * El panel saliente sigue montado durante la transición. Marcarlo como
   * inerte impide que sus botones sigan siendo alcanzables con Tab mientras
   * se desvanece; el nodo entrante se monta sin esta marca.
   */
  const inactivateDetail = () => {
    if (detailRef.current) detailRef.current.inert = true;
  };

  /* El foco se devuelve una sola vez, desde la salida o desde el temporizador. */
  const restorePresentationFocus = () => {
    if (focusRestoredRef.current) return;
    focusRestoredRef.current = true;
    const trigger = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (!trigger) return;
    trigger.focus({ preventScroll: true });
    trigger.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });
  };

  const openDetail = (projectId: string, trigger: HTMLButtonElement) => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = 0;
    if (openProjectId !== null) inactivateDetail();
    triggerRef.current = trigger;
    openProjectIdRef.current = projectId;
    restoreFocusRef.current = null;
    focusRestoredRef.current = false;
    setOpenProjectId(projectId);
  };

  const closeDetail = () => {
    restoreFocusRef.current = triggerRef.current;
    triggerRef.current = null;
    inactivateDetail();
    openProjectIdRef.current = null;
    setOpenProjectId(null);

    /*
     * La salida dura 400 ms. Motion no garantiza onAnimationComplete para la
     * rama exit en todas las versiones, así que el foco se restaura con un
     * temporizador acotado y coordinado con la finalización real.
     */
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = 0;
      if (openProjectIdRef.current !== null) return;
      restorePresentationFocus();
    }, prefersReducedMotion() ? 0 : 400);
  };

  const activeProject =
    portfolioProjects.find((project) => project.id === openProjectId) ?? null;
  const presentation = activeProject
    ? getProjectPresentation(activeProject)
    : null;
  const hasPresentedRef = useRef(false);

  useEffect(() => {
    if (!openProjectId) hasPresentedRef.current = false;
  }, [openProjectId]);

  useEffect(
    () => () => {
      window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  /*
   * El foco se entrega cuando la animación de entrada termina. Con
   * AnimatePresence mode="wait" la presentación saliente sigue montada unos
   * milisegundos; enfocar en el efecto de estado haría que el foco quedara en
   * un nodo a punto de desaparecer.
   */
  const onPresentationReady = (projectId: string) => {
    const currentId = openProjectIdRef.current;

    // La animación de salida terminó: devuelve el foco al botón que abrió la vista.
    if (currentId === null) {
      restorePresentationFocus();
      return;
    }

    if (currentId !== projectId) return;
    const node = detailRef.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    // El desplazamiento solo ocurre la primera vez: cambiar de proyecto no mueve la página.
    if (!hasPresentedRef.current) {
      hasPresentedRef.current = true;
      node.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
      });
    }
  };

  return (
    <section
      id="proyectos"
      aria-labelledby={titleId}
      className="relative scroll-mt-6 px-6 py-14 lg:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-3xl border border-border/50 bg-background/45 p-5 backdrop-blur-2xl md:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Selección
              </p>
              <h2
                id={titleId}
                className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
              >
                Proyectos seleccionados
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/60">
                Una selección de proyectos académicos y personales desarrollados
                durante mi formación.
              </p>
            </div>

            {canScroll ? (
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  ref={prevRef}
                  type="button"
                  aria-label="Proyecto anterior"
                  disabled={activeIndex === 0}
                  onClick={() => goTo(activeRef.current - 1)}
                  className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 sm:size-11"
                >
                  <ChevronLeft aria-hidden="true" className="size-5" />
                </button>
                <button
                  ref={nextRef}
                  type="button"
                  aria-label="Proyecto siguiente"
                  disabled={activeIndex === lastIndex}
                  onClick={() => goTo(activeRef.current + 1)}
                  className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 sm:size-11"
                >
                  <ChevronRight aria-hidden="true" className="size-5" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <div
              role="region"
              aria-roledescription="carousel"
              aria-label="Carrusel de proyectos seleccionados"
              className="w-full"
            >
              <div
                ref={trackRef}
                tabIndex={0}
                role="group"
                aria-label="Lista de proyectos. Desplázate con el scroll horizontal, las flechas o el teclado."
                onKeyDown={onTrackKeyDown}
                className="-mr-5 flex snap-x snap-mandatory touch-manipulation gap-4 overflow-x-auto overscroll-x-contain py-2 pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:-mr-8 md:pr-8"
              >
                {portfolioProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    total={portfolioProjects.length}
                    active={activeIndex === index}
                    registerRef={(element) => {
                      slideRefs.current[index] = element;
                    }}
                    onOpenDetail={(trigger) => openDetail(project.id, trigger)}
                  />
                ))}
              </div>

              {canScroll ? (
                <div
                  role="group"
                  aria-label="Elegir un proyecto"
                  className="mt-3 flex items-center justify-center gap-2"
                >
                  {portfolioProjects.map((project, index) => (
                    <button
                      key={project.id}
                      type="button"
                      aria-label={`Ir al proyecto ${index + 1}: ${project.name}`}
                      aria-current={activeIndex === index ? "true" : undefined}
                      onClick={() => goTo(index)}
                      className="flex size-6 items-center justify-center rounded-full"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "block h-2 rounded-full transition-all",
                          activeIndex === index
                            ? "w-6 bg-primary"
                            : "w-2 bg-foreground/50 hover:bg-foreground/75",
                        )}
                      />
                    </button>
                  ))}
                </div>
              ) : null}

              <p className="sr-only" role="status" aria-live="polite">
                {announcement}
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false} mode={PRESENTATION_MOTION.mode}>
          {activeProject && presentation ? (
            <PresentationPanel
              key={activeProject.id}
              projectId={activeProject.id}
              projectName={activeProject.name}
              presentation={presentation}
              detailRef={detailRef}
              onClose={closeDetail}
              onReady={onPresentationReady}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
