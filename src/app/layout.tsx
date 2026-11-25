import type { Metadata } from "next";
import { RouteTransitionSurface } from "@/components/ui/route-transition-surface";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://portafolio-yeyder.vercel.app"),
  title: "Yeyder Otero | Portafolio",
  description:
    "Portafolio personal de Yeyder Otero, estudiante de Ingeniería Informática. Conoce mis proyectos y demostraciones de desarrollo web.",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Yeyder Otero | Portafolio",
    title: "Yeyder Otero | Portafolio",
    description:
      "Portafolio personal de Yeyder Otero, estudiante de Ingeniería Informática. Conoce mis proyectos y demostraciones de desarrollo web.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yeyder Otero | Portafolio",
    description:
      "Portafolio personal de Yeyder Otero, estudiante de Ingeniería Informática. Conoce mis proyectos y demostraciones de desarrollo web.",
  },
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
