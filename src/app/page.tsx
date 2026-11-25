import { GlassmorphismPortfolioBlock } from "@/components/ui/glassmorphism-portfolio-block-shadcnui";
import { ProjectsCarousel } from "@/components/ui/projects-carousel";
import { TechnologiesSection } from "@/components/ui/technologies-section";
import { ProcessSection } from "@/components/ui/process-section";
import { ContactSection } from "@/components/ui/contact-section";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background font-sans text-foreground antialiased">
      <div
        className="ambient-glow pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <GlassmorphismPortfolioBlock />
      <ProjectsCarousel />
      <TechnologiesSection />
      <ProcessSection />
      <ContactSection />
    </main>
  );
}
