"use client";

import { ArrowUpRight, GraduationCap, Mail, MapPin } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionReveal } from "@/components/ui/section-reveal";
import { contactContent } from "@/data/professional-content";

/* lucide-react v1 no incluye iconos de marca; SVG local, sin dependencias nuevas. */
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

const linkCardClasses =
  "group flex h-full flex-col justify-between gap-5 rounded-xl border border-border/60 bg-background/40 p-5 transition-colors hover:border-primary/40 hover:bg-surface/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Cierre de la página con enlaces reales; sin formularios ni descargas ficticias. */
export function ContactSection() {
  return (
    <section
      id="contacto"
      aria-labelledby="contacto-titulo"
      className="relative px-6 pb-20 pt-14 lg:pb-24 lg:pt-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-3xl border border-border/50 bg-background/45 p-5 backdrop-blur-2xl md:p-8">
          <SectionReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Contacto
            </p>
            <h2
              id="contacto-titulo"
              className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              {contactContent.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/60">
              {contactContent.description}
            </p>
          </SectionReveal>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <SectionReveal>
              <a
                href={`mailto:${contactContent.email}`}
                aria-label={`${contactContent.emailAction} a ${contactContent.email}`}
                className={linkCardClasses}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary"
                  >
                    <Mail className="size-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                      Correo
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {contactContent.email}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {contactContent.emailAction}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </span>
              </a>
            </SectionReveal>

            <SectionReveal delay={0.05}>
              <a
                href={contactContent.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${contactContent.githubAction}: ${contactContent.githubHandle}`}
                className={linkCardClasses}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary"
                  >
                    <GithubIcon className="size-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                      GitHub
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {contactContent.githubHandle}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {contactContent.githubAction}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </span>
              </a>
            </SectionReveal>
          </div>

          <SectionReveal>
            <GlassCard className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 p-4">
              <span className="inline-flex items-center gap-2 text-xs text-foreground/60">
                <GraduationCap aria-hidden="true" className="size-4 shrink-0 text-primary" />
                {contactContent.education}
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-foreground/60">
                <MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
                {contactContent.location}
              </span>
            </GlassCard>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
