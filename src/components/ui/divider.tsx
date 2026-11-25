"use client";

import { cn } from "@/lib/utils";

/**
 * Separador visual horizontal con múltiples estilos.
 * Puede ser una línea simple, punto o dash decorativo.
 */
export const Divider = ({
  className,
  variant = "line",
  ...props
}: {
  className?: string;
  variant?: "line" | "dot" | "dash";
}) => {
  const variantStyles = {
    line: "my-4 h-px w-full bg-border",
    dot: "my-4 flex w-full items-center justify-center gap-2",
    dash: "my-4 w-full border-t border-dashed border-border",
  };

  return (
    <div className={cn(variantStyles[variant], className)} role="separator" {...props}>
      {variant === "dot" && (
        <>
          <span className="size-1.5 rounded-full bg-muted" />
          <span className="size-1.5 rounded-full bg-muted" />
          <span className="size-1.5 rounded-full bg-muted" />
        </>
      )}
    </div>
  );
};
