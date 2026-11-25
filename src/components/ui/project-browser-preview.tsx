"use client";

import Image from "next/image";
import { ArrowUpRight, Globe } from "lucide-react";

import type { ProjectPreview } from "@/data/projects";
import { cn } from "@/lib/utils";

interface ProjectBrowserPreviewProps {
  domain: string;
  href: string;
  preview: ProjectPreview;
  className?: string;
}

/**
 * Mini navegador reutilizable para mostrar la vista de un proyecto.
 * La barra superior es decorativa; el único control real es el enlace de
 * apertura. La vista se etiqueta explícitamente como estática o interactiva
 * según el tipo de preview, para no confundir una captura con un iframe.
 */
export function ProjectBrowserPreview({
  domain,
  href,
  preview,
  className,
}: ProjectBrowserPreviewProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/50 bg-background/45",
        "shadow-[0_25px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border/40 bg-background/55 px-4 py-3">
        <div aria-hidden="true" className="flex shrink-0 gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff6b6b]/80" />
          <span className="size-2.5 rounded-full bg-[#f5c86b]/80" />
          <span className="size-2.5 rounded-full bg-primary/80" />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-border/40 bg-surface/60 px-3 py-1.5">
          <Globe aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
          <span className="truncate font-mono text-xs text-foreground/70">
            {domain}
          </span>
        </div>

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${domain} en una pestaña nueva`}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/40 text-foreground/70 transition-colors hover:bg-surface hover:text-foreground"
        >
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      </div>

      <figure className="relative">
        {preview.kind === "static" ? (
          <Image
            src={preview.image}
            alt={preview.imageAlt}
            width={preview.width}
            height={preview.height}
            sizes="(max-width: 768px) 100vw, 900px"
            style={{ aspectRatio: `${preview.width} / ${preview.height}` }}
            className="block w-full object-cover object-top"
          />
        ) : null}

        <span className="absolute left-3 top-3 rounded-full border border-border/50 bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80 backdrop-blur-md">
          {preview.kind === "static" ? "Vista estática" : "Vista interactiva"}
        </span>

        <figcaption className="border-t border-border/40 bg-background/45 px-4 py-3 text-xs leading-relaxed text-foreground/60">
          {preview.caption}
        </figcaption>
      </figure>
    </div>
  );
}
