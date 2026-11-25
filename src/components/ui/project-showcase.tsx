"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, ChevronDown, ImageOff } from "lucide-react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { ProjectBrowserPreview } from "@/components/ui/project-browser-preview";
import { TechTag } from "@/components/ui/tech-tag";
import type { ProjectPresentation } from "@/data/projects";
import {
  PRESENTATION_MOTION,
  presentationDuration,
} from "@/lib/project-presentation-motion";
import { cn } from "@/lib/utils";

const reveal = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/**
 * Presentación ampliada reutilizable. Recibe datos normalizados desde
 * `src/data/projects.ts`; el preview especial de ElectroTero se conserva
 * intacto y las demás presentaciones comparten la misma estructura visual.
 */
export function ProjectShowcase({
  presentation,
}: {
  presentation: ProjectPresentation;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const titleId = useId();
  const detailsInnerRef = useRef<HTMLDivElement | null>(null);
  const [detailsHeight, setDetailsHeight] = useState(0);
  const reducedMotion = useReducedMotion() ?? false;
  const duration = presentationDuration(reducedMotion);

  /*
   * La altura se mide del contenido real y se actualiza con ResizeObserver:
   * nunca queda fija ante cambios de ancho o de texto. Motion no anima de
   * forma estable `height: auto` en reaperturas, así que este detalle usa una
   * transición CSS sobre la altura medida mientras el panel exterior sigue
   * animado con Motion.
   */
  useEffect(() => {
    const node = detailsInnerRef.current;
    if (!node) return;
    const measure = () => setDetailsHeight(node.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [presentation.id]);

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-labelledby={titleId}
        className="relative px-6 py-12 lg:py-16"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            {...reveal}
            className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/45 p-6 backdrop-blur-2xl md:p-12"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.03] via-transparent to-primary/[0.05]"
            />

            <div className="relative">
              <motion.p
                {...reveal}
                className="text-xs font-semibold uppercase tracking-[0.3em] text-primary"
              >
                {presentation.eyebrow}
              </motion.p>

              <motion.h2
                {...reveal}
                id={titleId}
                className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-6xl"
              >
                {presentation.name}
              </motion.h2>

              <motion.p
                {...reveal}
                className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-foreground/60"
              >
                {presentation.type}
              </motion.p>

              <motion.div {...reveal} className="mt-6 flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1.5",
                    presentation.url
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-border/60 bg-background/50 text-foreground/70",
                  )}
                >
                  {presentation.status}
                </Badge>
                {presentation.url && presentation.displayDomain ? (
                  <span className="text-sm text-foreground/60">
                    URL pública:{" "}
                    <a
                      href={presentation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-foreground/80 underline decoration-border underline-offset-4 hover:text-primary"
                    >
                      {presentation.displayDomain}
                    </a>
                  </span>
                ) : null}
              </motion.div>

              <motion.p
                {...reveal}
                className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg"
              >
                {presentation.summary}
              </motion.p>

              {presentation.problem ? (
                <motion.div {...reveal} className="mt-5 max-w-3xl">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
                    Necesidad
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                    {presentation.problem}
                  </p>
                </motion.div>
              ) : null}

              <motion.ul
                {...reveal}
                aria-label="Tecnologías utilizadas"
                className="mt-6 flex flex-wrap gap-2"
              >
                {presentation.technologies.map((technology) => (
                  <li key={technology}>
                    <TechTag>
                      <span className="normal-case">{technology}</span>
                    </TechTag>
                  </li>
                ))}
              </motion.ul>

              {presentation.preview ? (
                <motion.div {...reveal} className="mt-10">
                  <ProjectBrowserPreview
                    domain={presentation.displayDomain ?? ""}
                    href={presentation.url ?? ""}
                    preview={presentation.preview}
                  />
                </motion.div>
              ) : presentation.image ? (
                <motion.figure {...reveal} className="mt-10">
                  <Image
                    src={presentation.image.src}
                    alt={presentation.image.alt}
                    width={presentation.image.width}
                    height={presentation.image.height}
                    className="h-auto w-full rounded-2xl border border-border/40 object-cover object-top"
                  />
                  <figcaption className="mt-3 text-xs leading-relaxed text-foreground/55">
                    {presentation.image.caption}
                  </figcaption>
                </motion.figure>
              ) : (
                <motion.div
                  {...reveal}
                  className="mt-10 flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-2xl border border-border/40 bg-surface/40 text-foreground/55"
                >
                  <ImageOff aria-hidden="true" className="size-5" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                    Captura pendiente
                  </span>
                </motion.div>
              )}

              {presentation.privacyNote || presentation.note ? (
                <motion.p
                  {...reveal}
                  className="mt-5 max-w-3xl text-sm leading-relaxed text-foreground/60"
                >
                  {presentation.privacyNote ?? presentation.note}
                </motion.p>
              ) : null}

              <motion.div {...reveal} className="mt-8 flex flex-wrap gap-3">
                {presentation.action ? (
                  <a
                    href={presentation.action.href}
                    target={presentation.action.external ? "_blank" : undefined}
                    rel={
                      presentation.action.external
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold uppercase tracking-[0.15em] text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {presentation.action.label}
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => setDetailsOpen((open) => !open)}
                  aria-expanded={detailsOpen}
                  aria-controls={detailsId}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border/60 px-6 text-sm font-semibold uppercase tracking-[0.15em] text-foreground transition-colors hover:bg-surface"
                >
                  Ver detalles del proyecto
                  <ChevronDown
                    aria-hidden="true"
                    className={cn("size-4 transition-transform", detailsOpen && "rotate-180")}
                  />
                </button>
              </motion.div>

              <div
                id={detailsId}
                aria-hidden={!detailsOpen}
                inert={!detailsOpen}
                style={
                  {
                    height: detailsOpen
                      ? `${detailsHeight}px`
                      : `${PRESENTATION_MOTION.collapsedHeight}px`,
                    marginTop: detailsOpen ? PRESENTATION_MOTION.detailsGap : 0,
                    opacity: detailsOpen ? 1 : 0,
                    transform: `translateY(${
                      detailsOpen ? 0 : PRESENTATION_MOTION.detailsEnterY
                    }px)`,
                    transitionProperty: "height, margin-top, opacity, transform",
                    transitionDuration: `${duration}s`,
                    transitionTimingFunction: PRESENTATION_MOTION.cssEase,
                  } as CSSProperties
                }
                className="overflow-hidden"
              >
                <div
                  ref={detailsInnerRef}
                  className="rounded-2xl border border-border/40 bg-surface/40 p-6"
                >
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Funciones incluidas
                  </h3>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {presentation.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm leading-relaxed text-foreground/70"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
