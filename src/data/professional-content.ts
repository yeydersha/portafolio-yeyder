/**
 * Contenido profesional de M6, separado de la presentación para poder
 * verificarlo con pruebas puras y evitar afirmaciones no documentadas.
 *
 * Solo se incluyen tecnologías que aparecen en la formación o en proyectos
 * académicos y personales del portafolio. No hay niveles, porcentajes ni
 * años de experiencia: las etiquetas describen uso, no dominio.
 */

export type TechnologyCategoryId = "web" | "backend" | "databases" | "tools";

export interface TechnologyCategory {
  id: TechnologyCategoryId;
  title: string;
  icon: TechnologyCategoryId;
  technologies: readonly string[];
}

export const technologyCategories: readonly TechnologyCategory[] = [
  {
    id: "web",
    title: "Desarrollo web",
    icon: "web",
    technologies: [
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Angular",
    ],
  },
  {
    id: "backend",
    title: "Backend",
    icon: "backend",
    technologies: ["Java", "Spring Boot", "APIs REST"],
  },
  {
    id: "databases",
    title: "Bases de datos",
    icon: "databases",
    technologies: ["PostgreSQL", "MongoDB", "SQL"],
  },
  {
    id: "tools",
    title: "Herramientas",
    icon: "tools",
    technologies: ["Git", "GitHub", "Visual Studio Code"],
  },
];

export type ProcessIconId = "plan" | "design" | "development" | "testing";

export interface ProcessStage {
  number: string;
  title: string;
  description: string;
  icon: ProcessIconId;
}

export const processStages: readonly ProcessStage[] = [
  {
    number: "01",
    title: "Planificación",
    description:
      "Defino el objetivo del proyecto, identifico sus funcionalidades y organizo las tareas antes de comenzar.",
    icon: "plan",
  },
  {
    number: "02",
    title: "Diseño",
    description:
      "Organizo las pantallas y los componentes, buscando interfaces claras, consistentes y adaptables a diferentes dispositivos.",
    icon: "design",
  },
  {
    number: "03",
    title: "Desarrollo",
    description:
      "Implemento las funcionalidades por etapas, integrando interfaces, validaciones y gestión de datos según las necesidades del proyecto.",
    icon: "development",
  },
  {
    number: "04",
    title: "Pruebas y mejoras",
    description:
      "Compruebo el funcionamiento, reviso posibles errores y realizo ajustes antes de considerar una funcionalidad terminada.",
    icon: "testing",
  },
];

export const technologiesContent = {
  title: "Tecnologías y herramientas",
  description:
    "Herramientas que he utilizado durante mi formación y en el desarrollo de proyectos académicos y personales.",
} as const;

export const processContent = {
  title: "Mi proceso de desarrollo",
  description:
    "Una forma de organizar mis proyectos, desde la definición de funcionalidades hasta las pruebas y mejoras.",
} as const;

export const contactContent = {
  title: "¿Hablamos?",
  description:
    "Estoy interesado en oportunidades para adquirir experiencia en el área de tecnología y continuar desarrollando mis conocimientos. Si deseas conocer más sobre mis proyectos o ponerte en contacto conmigo, puedes escribirme.",
  email: "yeyderotero@gmail.com",
  emailAction: "Enviar correo",
  githubUrl: "https://github.com/yeydersha",
  githubHandle: "@yeydersha",
  githubAction: "Ver GitHub",
  education: "Ingeniería Informática — UNIPAZ · Séptimo semestre, en curso",
  location: "San Pablo, Bolívar, Colombia",
} as const;

/** Orden público de las secciones de la portada, verificable desde pruebas. */
export const homepageSectionOrder = [
  "presentacion",
  "proyectos",
  "tecnologias",
  "proceso",
  "contacto",
] as const;
