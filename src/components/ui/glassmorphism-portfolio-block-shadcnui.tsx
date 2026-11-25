"use client";

import { Badge } from "@/components/ui/badge";
import { motion, MotionConfig, type Variants } from "motion/react";
import { ArrowUpRight, Mail } from "lucide-react";

type IconComponent = (props: { className?: string }) => React.ReactElement;

type SocialLink = {
  label: string;
  handle: string;
  href: string;
  icon: IconComponent;
};

/* lucide-react v1 ya no incluye iconos de marca: SVG inline del logo GitHub. */
const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58C20.57 22.29 24 17.8 24 12.5 24 5.87 18.63.5 12 .5Z" />
  </svg>
);

/* Icono de correo usando el Lucide disponible, envuelto para la API local. */
const MailIcon = ({ className }: { className?: string }) => (
  <Mail className={className} />
);

const socialLinks: SocialLink[] = [
  {
    label: "GitHub",
    handle: "@yeydersha",
    href: "https://github.com/yeydersha",
    icon: GithubIcon,
  },
  {
    label: "Correo",
    handle: "yeyderotero@gmail.com",
    href: "mailto:yeyderotero@gmail.com",
    icon: MailIcon,
  },
];

const listVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
    },
  },
};

/**
 * Portada de portafolio basada en el componente original de 21st.dev
 * "Glassmorphism Portfolio Block" (Moumen Soliman), adaptada a Yeyder Otero Galván.
 * La composición visual se conserva; solo cambian contenido, APIs de Motion
 * (motion/react) y el avatar temporal con iniciales.
 */
export function GlassmorphismPortfolioBlock() {
  return (
    <MotionConfig reducedMotion="user">
      <section className="relative overflow-hidden px-6 py-14 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/45 p-6 backdrop-blur-2xl md:p-10"
          >
            {/* Glass gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.05] via-transparent to-transparent" />

            <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-10">
              {/* Left column - Main content */}
              <div className="space-y-6">
                <Badge
                  variant="outline"
                  className="inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-foreground/70 backdrop-blur transition-colors hover:bg-background/70"
                >
                  Portafolio
                </Badge>

                <div className="space-y-4">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
                  >
                    Yeyder Otero Galván
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60"
                  >
                    Estudiante de Ingeniería Informática
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-xl text-base leading-relaxed text-foreground/70"
                  >
                    Soy estudiante de Ingeniería Informática en UNIPAZ, con
                    interés en el desarrollo de software y las tecnologías web.
                    A través de proyectos académicos y personales, continúo
                    fortaleciendo mis conocimientos y adquiriendo experiencia
                    práctica.
                  </motion.p>
                </div>
              </div>

              {/* Right column - Profile card */}
              <div className="relative">
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-primary/15 via-transparent to-transparent blur-3xl" />
                <div className="relative flex h-full flex-col justify-center gap-8 overflow-hidden rounded-[28px] border border-border/50 bg-background/60 p-6 backdrop-blur-xl md:p-8">
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar with glow (temporary initials, no stock photo) */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="relative"
                    >
                      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-2xl" />
                      <div
                        role="img"
                        aria-label="Iniciales de Yeyder Otero Galván"
                        className="relative flex h-24 w-24 items-center justify-center rounded-full border border-border/40 bg-surface text-2xl font-semibold text-foreground shadow-[0_25px_60px_rgba(15,23,42,0.3)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                      >
                        YO
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="space-y-1"
                    >
                      <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                        Yeyder Otero Galván
                      </h3>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                        Ingeniería Informática
                      </p>
                      <p className="text-xs text-foreground/50">UNIPAZ</p>
                      <p className="text-xs text-foreground/45">
                        San Pablo, Bolívar, Colombia
                      </p>
                    </motion.div>
                  </div>

                  {/* Social links */}
                  <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-3"
                  >
                    {socialLinks.map((social) => {
                      const Icon = social.icon;
                      return (
                        <motion.a
                          key={social.label}
                          variants={itemVariants}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between rounded-2xl border border-border/40 bg-background/70 px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-border/60 hover:bg-background/80 hover:shadow-md"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.985 }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-background/70 text-foreground/80 shadow-[0_10px_30px_rgba(15,23,42,0.2)] transition-all group-hover:shadow-[0_10px_30px_rgba(15,23,42,0.3)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] dark:group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {social.label}
                              </p>
                              <p className="text-xs text-foreground/60">
                                {social.handle}
                              </p>
                            </div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground/70" />
                        </motion.a>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
