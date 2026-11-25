"use client";

import { cn } from "@/lib/utils";

/**
 * Etiqueta compacta para tecnologías/habilidades.
 * `shrink-0` (nombre v4 de flex-shrink-0) evita que se estire en contenedores flex.
 * El contenedor debe usar flex + flex-wrap + gap para una distribución correcta.
 */
export const TechTag = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const classes = cn(
    "inline-flex shrink-0 items-center rounded-full border border-border bg-surface",
    "h-7 px-3.5 text-xs font-medium font-mono capitalize text-muted",
    "transition-colors hover:bg-primary hover:text-primary-foreground",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className,
  );

  return <span className={classes} {...props}>{children}</span>;
};
