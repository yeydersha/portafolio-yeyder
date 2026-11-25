import type { Metadata } from "next";
import { FioreDemo } from "@/components/fiore-demo/FioreDemo";

export const metadata: Metadata = {
  title: "Fiore · Demo interactiva | Portafolio Yeyder",
  description:
    "Demostración aislada de Fiore con datos ficticios: marco visual, navegación interna y estado local.",
};

export default function FioreDemoPage() {
  return <FioreDemo />;
}
