import type { Metadata } from "next";
import { TaquillaDemo } from "@/components/taquilla-cine-demo/TaquillaDemo";

export const metadata: Metadata = {
  title: "Taquilla de Cine · Demo interactiva | Portafolio Yeyder",
  description:
    "Demostración aislada de Taquilla de Cine con datos ficticios: marco visual, navegación local y reinicio de la demo.",
};

export default function TaquillaCineDemoPage() {
  return <TaquillaDemo />;
}
