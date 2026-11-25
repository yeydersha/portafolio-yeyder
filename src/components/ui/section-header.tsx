"use client";

import { cn } from "@/lib/utils";

/**
 * Encabezado de sección con jerarquía tipográfica consistente.
 * Título en color primary y subtítulo en muted (contraste verificado sobre el fondo).
 */
export const SectionHeader = ({
  title,
  subtitle,
  className,
  showDivider = true,
  ...props
}: {
  title: string;
  subtitle?: string;
  className?: string;
  showDivider?: boolean;
}) => {
  return (
    <header className={cn("mb-8", className)} {...props}>
      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm leading-relaxed text-muted">{subtitle}</p>
      )}
      {showDivider && (
        <div className="my-4 h-0.5 w-8 rounded-full bg-primary" />
      )}
    </header>
  );
};
