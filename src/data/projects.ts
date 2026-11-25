/**
 * Datos de proyectos del portafolio.
 * Separados de los componentes visuales para poder reutilizarlos y ampliarlos
 * sin modificar la presentación. Solo se incluye información confirmada.
 *
 * La unión discriminada por `kind` evita enlaces inventados: solo un proyecto
 * publicado puede tener URL externa y mini navegador, solo una demo puede
 * tener ruta interna, y un proyecto pendiente no expone ninguna acción falsa.
 */

export interface ProjectStaticPreview {
  kind: "static";
  image: string;
  imageAlt: string;
  width: number;
  height: number;
  caption: string;
}

export type ProjectPreview = ProjectStaticPreview;

export interface ProjectCardImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface ProjectBase {
  id: string;
  name: string;
  type: string;
  status: string;
  cardDescription: string;
  cardImage?: ProjectCardImage;
}

export interface PublishedProject extends ProjectBase {
  kind: "published";
  summary: string;
  technologies: readonly string[];
  url: string;
  displayDomain: string;
  detailActionLabel: string;
  preview: ProjectPreview;
  details: {
    features: readonly string[];
    privacyNote: string;
  };
}

/** Contenido verificable de la presentación ampliada de una demo o proyecto pendiente. */
export interface ProjectPresentationData {
  type?: string;
  eyebrow: string;
  summary: string;
  problem: string;
  features: readonly string[];
  technologies: readonly string[];
  image?: ProjectCardImage & { caption: string };
  note: string;
  actionLabel?: string;
}

export interface DemoProject extends ProjectBase {
  kind: "demo";
  actionLabel: string;
  href: string;
  presentation: ProjectPresentationData;
}

export interface PendingProject extends ProjectBase {
  kind: "pending";
  note: string;
  presentation: ProjectPresentationData;
}

export type Project = PublishedProject | DemoProject | PendingProject;

/** Vista normalizada que consume un único componente de presentación. */
export interface ProjectPresentation {
  id: string;
  name: string;
  type: string;
  status: string;
  eyebrow: string;
  summary: string;
  problem?: string;
  features: readonly string[];
  technologies: readonly string[];
  image?: ProjectCardImage & { caption: string };
  preview?: ProjectPreview;
  url?: string;
  displayDomain?: string;
  privacyNote?: string;
  note?: string;
  action?: { label: string; href: string; external: boolean };
}

/**
 * Normaliza los tres tipos de proyecto sin duplicar componentes ni inventar
 * acciones. ElectroTero conserva su preview especial y su URL pública; las
 * demos y los proyectos pendientes solo exponen lo que su tipo permite.
 */
export function getProjectPresentation(project: Project): ProjectPresentation {
  const base = {
    id: project.id,
    name: project.name,
    type: project.type,
    status: project.status,
  };

  if (project.kind === "published") {
    return {
      ...base,
      eyebrow: "Proyecto destacado · 01",
      summary: project.summary,
      features: project.details.features,
      technologies: project.technologies,
      preview: project.preview,
      url: project.url,
      displayDomain: project.displayDomain,
      privacyNote: project.details.privacyNote,
      action: {
        label: "Visitar sitio web",
        href: project.url,
        external: true,
      },
    };
  }

  if (project.kind === "demo") {
    return {
      ...base,
      type: project.presentation.type ?? project.type,
      eyebrow: project.presentation.eyebrow,
      summary: project.presentation.summary,
      problem: project.presentation.problem,
      features: project.presentation.features,
      technologies: project.presentation.technologies,
      image: project.presentation.image,
      note: project.presentation.note,
      action: {
        label: project.presentation.actionLabel ?? project.actionLabel,
        href: project.href,
        external: false,
      },
    };
  }

  return {
    ...base,
    type: project.presentation.type ?? project.type,
    eyebrow: project.presentation.eyebrow,
    summary: project.presentation.summary,
    problem: project.presentation.problem,
    features: project.presentation.features,
    technologies: project.presentation.technologies,
    image: project.presentation.image,
    note: project.presentation.note,
  };
}

const electroTeroPreview: ProjectStaticPreview = {
  kind: "static",
  image: "/images/electrotero-preview.jpg",
  imageAlt: "Captura de la portada pública de ElectroTero",
  width: 1012,
  height: 640,
  caption:
    "Captura real de la landing pública. El sitio no permite incrustarlo en un iframe, por lo que esta vista es estática.",
};

export const electroTeroProject: PublishedProject = {
  id: "electrotero",
  kind: "published",
  name: "ElectroTero",
  type: "Plataforma web · Energía solar",
  status: "Sitio publicado",
  cardDescription:
    "Sitio web para presentar servicios de energía solar y gestionar solicitudes de clientes.",
  detailActionLabel: "Ver proyecto",
  summary:
    "ElectroTero es una plataforma web orientada a la presentación de servicios de energía solar y la gestión de solicitudes de clientes. Incluye un formulario público y un panel administrativo para consultar, organizar y responder solicitudes.",
  technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "MongoDB", "Vercel"],
  url: "https://electrotero.com/",
  displayDomain: "electrotero.com",
  preview: electroTeroPreview,
  details: {
    features: [
      "Landing page pública",
      "Formulario para solicitudes de clientes",
      "Panel administrativo protegido",
      "Gestión de solicitudes",
      "Respuestas por correo",
      "Notificaciones",
      "Dashboard administrativo",
    ],
    privacyNote:
      "ElectroTero es un proyecto web real publicado en producción. Además de la landing pública, dispone de funcionalidades administrativas que no se muestran en esta demostración por motivos de privacidad y seguridad.",
  },
};

/**
 * La captura es una imagen real del dashboard de la demo, generada durante la
 * verificación B6. No es una creación artificial ni una captura del proyecto
 * original de Fiore.
 */
export const fioreProject: DemoProject = {
  id: "fiore",
  kind: "demo",
  name: "Fiore",
  type: "Sistema de gestión · Inventario",
  status: "Demo interactiva",
  cardDescription:
    "Aplicación para administrar productos, existencias, movimientos y reportes con datos ficticios.",
  actionLabel: "Explorar demo",
  href: "/proyectos/fiore/demo",
  cardImage: {
    src: "/images/fiore-preview.jpg",
    alt: "Captura real del dashboard de la demo interactiva de Fiore",
    width: 1146,
    height: 720,
  },
  presentation: {
    type: "Sistema de gestión de inventario para joyería",
    eyebrow: "Presentación del proyecto · 02",
    summary:
      "Fiore es una aplicación de gestión de inventario orientada a organizar productos de joyería, controlar existencias, registrar movimientos y consultar información administrativa y financiera.",
    problem:
      "Mantener trazabilidad de los productos, las existencias y los cálculos de rentabilidad sin depender de información dispersa.",
    features: [
      "Administración de productos",
      "Categorías y proveedores",
      "Entradas, salidas y ajustes de stock",
      "Registro de ventas",
      "Dashboard de indicadores",
      "Reportes y consultas",
    ],
    /* Stack verificado en el proyecto original (Proyecto_fiora/fiore/README.md). */
    technologies: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS v4",
      "PostgreSQL",
      "Zod",
      "node-postgres",
    ],
    image: {
      src: "/images/fiore-preview.jpg",
      alt: "Captura real del dashboard de la demo interactiva de Fiore",
      width: 1146,
      height: 720,
      caption:
        "Captura real de la demo integrada en el portafolio. Usa datos ficticios y no muestra el sistema original en producción.",
    },
    note:
      "La demostración funciona con React y TypeScript dentro del portafolio. Utiliza datos ficticios y almacenamiento local, sin acceso a producción.",
    actionLabel: "Explorar demo",
  },
};

/**
 * La captura es una imagen real de la demostración integrada, generada durante
 * la verificación C7. No representa la interfaz del sistema académico original.
 */
const taquillaCardImage: ProjectCardImage = {
  src: "/images/taquilla-preview.jpg",
  alt: "Captura real de la demostración interactiva de Taquilla de Cine",
  width: 1120,
  height: 700,
};

/**
 * Proyecto académico con demostración propia dentro del portafolio. El stack
 * original se conserva en `technologies`; la nota distingue ese sistema del
 * adaptador React con datos ficticios que se ejecuta localmente.
 */
export const taquillaProject: DemoProject = {
  id: "taquilla-cine",
  kind: "demo",
  name: "Taquilla de Cine",
  type: "Proyecto académico · Gestión de cine",
  status: "Demo interactiva",
  cardDescription:
    "Sistema para administrar películas, programar funciones y registrar compras de entradas.",
  actionLabel: "Explorar demo",
  href: "/proyectos/taquilla-cine/demo",
  cardImage: taquillaCardImage,
  presentation: {
    type: "Proyecto académico de desarrollo de software",
    eyebrow: "Presentación del proyecto · 03",
    summary:
      "Sistema académico para administrar películas, programar funciones, registrar compras de entradas y consultar reportes de taquilla.",
    problem:
      "Unificar la gestión de cartelera, cupos, compras y ventas en una sola aplicación académica.",
    features: [
      "CRUD de películas en el proyecto original",
      "CRUD de funciones y gestión de cupos en el proyecto original",
      "Registro de compras con descuento de cupos en el proyecto original",
      "Reporte de ventas con filtros de fecha en el proyecto original",
      "API REST consumida por el frontend original",
    ],
    /* Stack verificado en Tarea_PBC_Parcial/taquilla-cine-* (README y pom.xml). */
    technologies: ["Angular 21", "Spring Boot", "Java", "PostgreSQL"],
    image: {
      ...taquillaCardImage,
      caption:
        "Captura real de la demostración del portafolio: películas, funciones, compras y taquilla con datos ficticios locales.",
    },
    note:
      "El sistema original usa Angular 21, Spring Boot, Java y PostgreSQL. La demostración de este portafolio usa React, TypeScript y datos ficticios locales; no ejecuta el backend original ni procesa pagos reales.",
    actionLabel: "Explorar demo",
  },
};

/** Única fuente de datos de las tarjetas del carrusel. */
export const portfolioProjects: readonly Project[] = [
  electroTeroProject,
  fioreProject,
  taquillaProject,
];
