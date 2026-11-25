"use client";

import { cn } from "@/lib/utils";

/**
 * Botón estilizado con variaciones para el sistema visual.
 * Soporta múltiples estilos: primary, secondary, outline, ghost.
 * Los foregrounds oscuros sobre primary/secondary cumplen WCAG 2.2 AA.
 */
export const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  children,
  onClick,
  ...props
}: {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  const classes = cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-colors",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
      outline: "border border-border bg-transparent text-foreground hover:bg-surface",
      ghost: "text-muted hover:bg-surface hover:text-foreground",
    }[variant],
    {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-base",
      lg: "h-12 px-6 text-lg",
    }[size],
    disabled && "cursor-not-allowed opacity-50",
    className,
  );

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
