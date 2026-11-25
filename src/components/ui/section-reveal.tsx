"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/* Si IntersectionObserver no entrega el evento, el contenido deja de estar oculto. */
const FALLBACK_VISIBLE_MS = 1200;

/**
 * Entrada breve al entrar en viewport. El estado final siempre es visible:
 * reduced motion lo muestra de inmediato desde CSS (globals.css) y un
 * temporizador acotado evita que una animación fallida retenga contenido
 * oculto de forma indefinida.
 */
export function SectionReveal({
  children,
  className,
  delay = 0,
  distance = 12,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const reduceMotion = useReducedMotion();
  const [fallbackVisible, setFallbackVisible] = useState(false);

  useEffect(() => {
    if (inView) return;
    const timer = window.setTimeout(() => setFallbackVisible(true), FALLBACK_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [inView]);

  const visible = Boolean(reduceMotion || inView || fallbackVisible);

  return (
    <motion.div
      ref={ref}
      data-reveal={visible ? "visible" : "pending"}
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.4, delay, ease: "easeOut" }
      }
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
