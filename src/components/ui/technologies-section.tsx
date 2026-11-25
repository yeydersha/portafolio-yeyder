"use client";

import { Code2, Database, Wrench, Server } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionReveal } from "@/components/ui/section-reveal";
import { TechTag } from "@/components/ui/tech-tag";
import {
  technologiesContent,
  technologyCategories,
  type TechnologyCategoryId,
} from "@/data/professional-content";

type IconProps = { className?: string };
type IconComponent = (props: IconProps) => React.ReactElement;

const WebIcon = ({ className }: IconProps) => (
  <Code2 className={className} aria-hidden="true" />
);
const BackendIcon = ({ className }: IconProps) => (
  <Server className={className} aria-hidden="true" />
);
const DatabasesIcon = ({ className }: IconProps) => (
  <Database className={className} aria-hidden="true" />
);
const ToolsIcon = ({ className }: IconProps) => (
  <Wrench className={className} aria-hidden="true" />
);

const categoryIcons: Record<TechnologyCategoryId, IconComponent> = {
  web: WebIcon,
  backend: BackendIcon,
  databases: DatabasesIcon,
  tools: ToolsIcon,
};

/** Sección de tecnologías: tarjetas compactas, sin niveles ni porcentajes. */
export function TechnologiesSection() {
  return (
    <section
      id="tecnologias"
      aria-labelledby="tecnologias-titulo"
      className="relative px-6 py-14 lg:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-3xl border border-border/50 bg-background/45 p-5 backdrop-blur-2xl md:p-8">
          <SectionReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Formación y proyectos
            </p>
            <h2
              id="tecnologias-titulo"
              className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              {technologiesContent.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/60">
              {technologiesContent.description}
            </p>
          </SectionReveal>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {technologyCategories.map((category, index) => {
              const Icon = categoryIcons[category.icon];
              return (
                <SectionReveal key={category.id} delay={index * 0.05}>
                  <GlassCard className="h-full p-5">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary"
                      >
                        <Icon className="size-[18px]" />
                      </span>
                      <h3 className="text-base font-semibold tracking-tight text-foreground">
                        {category.title}
                      </h3>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {category.technologies.map((technology) => (
                        <TechTag key={technology}>{technology}</TechTag>
                      ))}
                    </div>
                  </GlassCard>
                </SectionReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
