"use client";

import { cn } from "@/lib/utils";

/**
 * Contenedor de contenido con ancho máximo y padding responsive.
 * No usa `prose`: el plugin de tipografía no está instalado en v4.
 */
export const Container = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const classes = cn(
    "mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8",
    className,
  );

  return <div className={classes} {...props}>{children}</div>;
};
