"use client";

import { cn } from "@/lib/utils";

/**
 * Superficie con efecto glassmorphism.
 * El desenfoque se aplica SOLO al fondo (backdrop-filter), nunca al contenido.
 * No se usa `filter: blur()` ni estilos inline que compitan con las clases.
 * Variables CSS: --glass-blur, --glass-bg, --glass-border definidas en globals.css.
 */
export const GlassCard = ({
  className,
  children,
  background,
  borderColor,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  background?: string;
  borderColor?: string;
}) => {
  const style = {
    ...(background && { backgroundColor: background }),
    ...(borderColor && { borderColor: borderColor }),
  };

  const classes = cn(
    "relative rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]",
    "backdrop-blur-[var(--glass-blur)]",
    "transition-all duration-200 hover:opacity-90",
    className,
  );

  return (
    <div className={classes} style={style} {...props}>
      {children}
    </div>
  );
};
