"use client";

import { Code2, ListChecks, PenTool, TestTube } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { SectionReveal } from "@/components/ui/section-reveal";
import {
  processContent,
  processStages,
  type ProcessIconId,
} from "@/data/professional-content";

type IconProps = { className?: string };
type IconComponent = (props: IconProps) => React.ReactElement;

const PlanIcon = ({ className }: IconProps) => (
  <ListChecks className={className} aria-hidden="true" />
);
const DesignIcon = ({ className }: IconProps) => (
  <PenTool className={className} aria-hidden="true" />
);
const DevelopmentIcon = ({ className }: IconProps) => (
  <Code2 className={className} aria-hidden="true" />
);
const TestingIcon = ({ className }: IconProps) => (
  <TestTube className={className} aria-hidden="true" />
);

const stageIcons: Record<ProcessIconId, IconComponent> = {
  plan: PlanIcon,
  design: DesignIcon,
  development: DevelopmentIcon,
  testing: TestingIcon,
};

/** Línea de tiempo horizontal en escritorio; vertical en pantallas pequeñas. */
export function ProcessSection() {
  return (
    <section
      id="proceso"
      aria-labelledby="proceso-titulo"
      className="relative px-6 py-14 lg:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-3xl border border-border/50 bg-background/45 p-5 backdrop-blur-2xl md:p-8">
          <SectionReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Organización del trabajo
            </p>
            <h2
              id="proceso-titulo"
              className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              {processContent.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/60">
              {processContent.description}
            </p>
          </SectionReveal>

          <ol className="relative mt-8 grid list-none gap-7 p-0 md:grid-cols-4 md:gap-5">
            <span
              aria-hidden="true"
              className="absolute bottom-6 left-[21px] top-6 w-px bg-border/60 md:hidden"
            />
            <span
              aria-hidden="true"
              className="absolute left-[12%] right-[12%] top-[21px] hidden h-px bg-border/60 md:block"
            />

            {processStages.map((stage, index) => {
              const Icon = stageIcons[stage.icon];
              return (
                <li key={stage.number} className="relative min-w-0">
                  <SectionReveal delay={index * 0.05}>
                    <div className="flex items-start gap-4 md:block">
                      <span
                        aria-hidden="true"
                        className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-background font-mono text-xs font-semibold text-primary"
                      >
                        {stage.number}
                      </span>
                      <GlassCard className="min-w-0 flex-1 p-4 md:mt-4 md:flex-none">
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 shrink-0 text-primary" />
                          <h3 className="text-sm font-semibold tracking-tight text-foreground">
                            {stage.title}
                          </h3>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-foreground/60">
                          {stage.description}
                        </p>
                      </GlassCard>
                    </div>
                  </SectionReveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
