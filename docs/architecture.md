# Arquitectura del Portafolio Personal

## Visión General

Arquitectura basada en **Next.js 16 con App Router**, utilizando **React 18** y **TypeScript**. El diseño prioriza la separación de preocupaciones, escalabilidad y mantenibilidad a largo plazo.

## Estructura de Carpetas

```
portfolio-yeyder/
├── src/
│   ├── app/                    # App Router (Next.js 16)
│   │   ├── layout.tsx          # Layout raíz con tema y proveedores
│   │   ├── page.tsx            # Página principal
│   │   ├── projects/           # Ruta de proyectos
│   │   ├── about/              # Página sobre mí
│   │   ├── contact/            # Página de contacto
│   │   └── resume/             # Página de hoja de vida
│   ├── components/             # Componentes de React
│   │   ├── ui/                 # Componentes UI base (shadcn-ui adaptados)
│   │   ├── sections/           # Secciones de página
│   │   └── layout/             # Componentes de layout
│   ├── lib/                    # Utilidades y helpers
│   │   ├── utils.ts            # Funciones auxiliares
│   │   └── format.ts           # Formateadores
│   ├── data/                   # Datos estructurados (sin base de datos)
│   │   ├── projects.ts         # Lista de proyectos
│   │   ├── skills.ts           # Tecnologías y habilidades
│   │   ├── education.ts        # Formación académica
│   │   ├── experience.ts       # Experiencia laboral
│   │   └── contact.ts          # Información de contacto
│   └── styles/                 # Estilos Tailwind CSS
│       └── globals.css
├── public/                     # Recursos estáticos
├── docs/                       # Documentación del proyecto
│   ├── requirements.md
│   ├── architecture.md
│   ├── design-system.md
│   ├── roadmap.md
│   └── decisions.md
├── tailwind.config.js          # Configuración de Tailwind CSS v4
├── tsconfig.json               # Configuración de TypeScript
└── package.json
```

## Patrones y Decisiones Arquitectónicas

1. **Architecture-First (Sin Base de Datos)**
   - Initialmente, los contenidos se administran mediante archivos JSON/TipoScript en `src/data/`.
   - No se requiere una base de datos para la fase M0-M3.
   - El panel de administración se podrá añadir posteriormente conectando estos archivos a una backend o CMS.

2. **Data-Driven Components**
   - Los componentes consumen datos de los archivos `src/data/`.
   - Esto permite modificar contenido sin tocar la lógica de presentación.
   - Facilita la preparación de contenido para el futuro panel de administración.

3. **Routing Estructurado**
   - Next.js App Router con rutas planificadas:
     - `/` → Página principal/herramientas destacadas
     - `/projects` → Galería de proyectos
     - `/about` → Perfil profesional
     - `/resume` → Hoja de vida descargable
     - `/contact` → Formulario/medios de contacto

4. **Tipo System Completo**
   - Todo el código es TypeScript.
   - Interfaces definidas en `src/data/` para consistencia.
   - Tipado fuerte en props de componentes y state management.

5. **Estilo y Diseño**
   - **Tailwind CSS v4** con configuración personalizada para tema oscuro.
   - **Glassmorphism** moderado como efecto visual principal.
   - **Motion for React** para animaciones controladas.
   - **Lucide React** para iconografía.

6. **Estilo de Código**
   - ESLint configurado con reglas recomendadas.
   - Commit conventions no aplicables aún (fase M0).
   - No se permiten console.log en producción.

## Estado Actual de la Arquitectura

- Repositorio Git inicializado sin commits.
- Estructura de carpetas definida.
- Sin dependencias instaladas (restricción M0).
- Documentación preliminar en curso.