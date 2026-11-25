"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, ImageOff } from "lucide-react";

import type { Project, ProjectCardImage } from "@/data/projects";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  index: number;
  total: number;
  registerRef: (element: HTMLElement | null) => void;
  onOpenDetail?: (trigger: HTMLButtonElement) => void;
  active?: boolean;
}

/** La imagen de ElectroTero se reutiliza de su preview canónica: no se duplica. */
function getCardImage(project: Project): ProjectCardImage | undefined {
  if (project.cardImage) return project.cardImage;
  if (project.kind === "published" && project.preview.kind === "static") {
    return {
      src: project.preview.image,
      alt: project.preview.imageAlt,
      width: project.preview.width,
      height: project.preview.height,
    };
  }
  return undefined;
}

const statusClasses: Record<Project["kind"], string> = {
  published: "border-primary/30 bg-primary/5 text-primary",
  demo: "border-secondary/40 bg-secondary/5 text-secondary",
  pending: "border-border/60 bg-background/50 text-foreground/60",
};

function getDetailLabel(project: Project): string {
  if (project.kind === "published") return project.detailActionLabel;
  if (project.kind === "demo") return project.actionLabel;
  return "Ver presentación";
}

export function ProjectCard({
  project,
  index,
  total,
  registerRef,
  onOpenDetail,
  active = false,
}: ProjectCardProps) {
  const image = getCardImage(project);

  return (
    <article
      ref={registerRef}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} de ${total}: ${project.name}`}
      className={cn(
        "group relative flex w-[260px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl",
        "border bg-background/55 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl",
        active
          ? "border-primary/30 hover:border-primary/50"
          : "border-border/50 hover:border-border/80",
        "sm:w-[280px] lg:w-[clamp(280px,21vw,300px)]",
        "motion-safe:transition-[translate,box-shadow,border-color] motion-safe:duration-300",
        "motion-safe:hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(0,0,0,0.32)]",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-border/40 bg-surface/50">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 280px, (max-width: 1024px) 300px, 320px"
            className="object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.06),transparent_65%)]">
            <ImageOff aria-hidden="true" className="size-5 text-foreground/50" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Captura pendiente
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-border/50 bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80 backdrop-blur-md">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">
            {project.type}
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">
            {project.name}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-foreground/65">
          {project.cardDescription}
        </p>

        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            statusClasses[project.kind],
          )}
        >
          {project.status}
        </span>

        <div className="mt-auto flex min-h-10 items-center border-t border-border/40 pt-3">
          {onOpenDetail ? (
            <button
              type="button"
              aria-label={`Ver presentación de ${project.name}`}
              onClick={(event) => onOpenDetail(event.currentTarget)}
              className="inline-flex items-center gap-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:text-primary"
            >
              {getDetailLabel(project)}
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
              />
            </button>
          ) : project.kind === "pending" ? (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground/55">
              <Clock3 aria-hidden="true" className="size-3.5" />
              Sin demo disponible
            </span>
          ) : project.kind === "demo" ? (
            <Link
              href={project.href}
              className="inline-flex items-center gap-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:text-primary"
            >
              {project.actionLabel}
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
              />
            </Link>
          ) : (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:text-primary"
            >
              {project.detailActionLabel}
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
              />
            </a>
          )}
        </div>
      </div>

      {project.kind === "pending" ? (
        <span className="sr-only">{project.note}</span>
      ) : null}
    </article>
  );
}
