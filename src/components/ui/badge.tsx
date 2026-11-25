"use client";

import { cn } from "@/lib/utils";

/**
 * Badge mínimo compatible con la API de shadcn/ui que usa el componente
 * original de 21st.dev. Sin dependencias adicionales: las clases visuales
 * concretas se pasan desde el componente que lo consume.
 */
export const Badge = ({
  className,
  variant = "default",
  children,
  ...props
}: {
  className?: string;
  variant?: "default" | "outline";
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const classes = cn(
    "inline-flex items-center rounded-full text-xs font-semibold transition-colors",
    variant === "outline"
      ? "border"
      : "border border-transparent bg-primary text-primary-foreground",
    className,
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
