import type { Metadata } from "next";
import { RouteTransitionSurface } from "@/components/ui/route-transition-surface";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portafolio Yeyder",
  description: "Portafolio personal de Yeyder Otero, desarrollado con Next.js 16, React 19 y Tailwind CSS v4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-mode="dark" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <RouteTransitionSurface>{children}</RouteTransitionSurface>
      </body>
    </html>
  );
}
