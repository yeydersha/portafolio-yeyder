# M6.1 — Presentación principal simplificada — Informe final

Fecha: 25/11/2026. Estado: **M6.1 COMPLETADO; sin observaciones bloqueantes**.

Fase ejecutada sobre la portada existente, sin reconstruir el componente de referencia ni alterar el sistema visual. Se conservaron el tema oscuro, el glassmorphism, la paleta, la tipografía, el contenedor `max-w-6xl`, los bordes/sombras y las animaciones moderadas de `motion/react`. No se añadieron dependencias, no se modificaron las secciones M6, el carrusel, las presentaciones de proyectos, la demo de Fiore, ElectroTero ni las transiciones de ruta. No se hicieron commits, push ni despliegue.

---

## 1. Alcance real de la fase

Único archivo de aplicación modificado:

| Archivo | Cambio |
| --- | --- |
| `src/components/ui/glassmorphism-portfolio-block-shadcnui.tsx` | Textos aprobados, retirada de recuadros y CTA, y ajuste directo de la composición de la presentación principal. |

Archivos generados para evidencia:

| Archivo | Función |
| --- | --- |
| `docs/M6_1_escritorio_1440.jpg` | Captura de viewport a 1440 × 900. |
| `docs/M6_1_tablet_768.jpg` | Captura de viewport a 768 × 1024. |
| `docs/M6_1_movil_390.jpg` | Captura de viewport a 390 × 844. |
| `docs/M6_1_escritorio_completa_1440.jpg` | Captura de página completa en escritorio. |
| `docs/M6_1_movil_completa_390.jpg` | Captura de página completa en móvil. |
| `M6_1_Presentacion_Simplificada_INFORME.md` | Este informe. |

No se modificaron `src/app/globals.css`, `src/app/page.tsx`, `projects-carousel.tsx`, `technologies-section.tsx`, `process-section.tsx`, `contact-section.tsx`, `professional-content.ts`, `route-transition.ts` ni ningún archivo de la demo de Fiore.

---

## 2. Comprobación previa antes de retirar contenido

Antes de eliminar los tres recuadros de la columna izquierda se revisó `src/data/professional-content.ts` y el DOM de las secciones M6:

| Contenido retirado de la presentación | Ya representado en |
| --- | --- |
| Tecnologías y áreas de interés | `#tecnologías`: `Desarrollo web`, `Backend`, `Bases de datos` y `Herramientas`. |
| Proceso / desarrollo de software | `#proceso`: `Planificación`, `Diseño`, `Desarrollo` y `Pruebas y mejoras`. |
| Formación académica | `#contacto`: «Ingeniería Informática — UNIPAZ · Séptimo semestre, en curso», además de la referencia breve conservada en la tarjeta derecha de la presentación. |

**No se trasladó contenido a otras secciones.** Solo se verificó que la información no se perdiera del conjunto del portafolio.

---

## 3. Texto eliminado de la presentación principal

### Subtítulo anterior

- «Estudiante de Ingeniería Informática | Desarrollo de software»

### Párrafos anteriores

1. «Soy estudiante de séptimo semestre de Ingeniería Informática en UNIPAZ. Durante mi formación he participado en proyectos académicos y personales relacionados con aplicaciones web, sistemas de información y bases de datos.»
2. «He trabajado con tecnologías como JavaScript, TypeScript, React, Next.js, Angular, Java y PostgreSQL, aplicándolas en proyectos de gestión de inventarios, administración de solicitudes y compra de entradas.»
3. «Actualmente busco oportunidades para adquirir experiencia profesional, fortalecer mis conocimientos técnicos y participar en proyectos reales de tecnología.»

### Recuadros eliminados de la columna izquierda

| Recuadro | Descripción eliminada |
| --- | --- |
| Desarrollo de software | «Experiencia práctica en interfaces, formularios y gestión de información.» |
| Formación académica | «Ingeniería Informática — UNIPAZ. Séptimo semestre, en curso.» |
| Áreas de interés | «Desarrollo web, bases de datos, soporte tecnológico y herramientas de software.» |

### CTA eliminado

- Enlace «Explorar proyectos» (`href="#proyectos"`), su manejador `scrollToProjects`, la importación de `getSmoothScrollBehavior` y el icono `ArrowDown`.
- No se sustituyó por ningún botón decorativo.
- El ancla real `#proyectos` **permanece** en `src/components/ui/projects-carousel.tsx`, sin modificaciones.

---

## 4. Texto definitivo de la presentación

- **Título:** `Yeyder Otero Galván`
- **Subtítulo:** `Estudiante de Ingeniería Informática`
- **Párrafo único:**

> Soy estudiante de Ingeniería Informática en UNIPAZ, con interés en el desarrollo de software y las tecnologías web. A través de proyectos académicos y personales, continúo fortaleciendo mis conocimientos y adquiriendo experiencia práctica.

El texto anterior fue comprobado en DOM real como coincidencia exacta (`paragraphExact: true`) en las tres resoluciones.

La tarjeta derecha conserva exclusivamente:

- Avatar con iniciales `YO` (sin fotografía inventada; 96 × 96 px después de asentar la animación).
- `Yeyder Otero Galván`
- `Ingeniería Informática`
- `UNIPAZ`
- `San Pablo, Bolívar, Colombia`
- GitHub: `https://github.com/yeydersha` (`target="_blank"`, `rel="noopener noreferrer"`).
- Correo: `mailto:yeyderotero@gmail.com`.

No se añadió ningún párrafo personal nuevo en la columna derecha.

---

## 5. Cambios de composición

| Elemento | Antes | Después |
| --- | --- | --- |
| Sección de presentación | `py-24 lg:py-32` y `min-h-screen` | `py-14 lg:py-16`, sin `min-h-screen`; ya no fuerza una pantalla completa. |
| Tarjeta principal | `p-8 md:p-12` | `p-6 md:p-10`. |
| Rejilla de columnas | `gap-12` | `gap-8 lg:gap-10`. |
| Columna izquierda | `space-y-8` con tres recuadros y CTA | `space-y-6`, solo badge, título, subtítulo y párrafo. |
| Columna derecha | `justify-between`, padding `p-8`, enlaces con `mt-8` | `justify-center gap-8`, padding `p-6 md:p-8`, enlaces sin margen superior artificial. |
| Avatar | `h-32 w-32`, texto `text-3xl`, halo de 128 px | `h-24 w-24`, texto `text-2xl`, halo de 96 px. |
| UNIPAZ | Dentro de «Ingeniería Informática · UNIPAZ» | Línea breve independiente, junto a «Ingeniería Informática». |

Resultado: dos columnas en escritorio y apilado en tablet/móvil. La separación hasta `#proyectos` se mantiene con el padding simétrico de ambas secciones (112 px en móvil y 128 px en escritorio), sin bloques vacíos añadidos. Las secciones del DOM siguen siendo contiguas.

---

## 6. Verificación en navegador real

Servidor de producción reiniciado con la build definitiva y página cargada en `http://127.0.0.1:3000`.

| Resolución | Columnas CSS | Altura presentación | Tarjeta | Avatar | Overflow horizontal | Texto recortado / fuera de tarjeta | Errores de consola |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1440 × 900 | `515.2px 515.2px`, gap 40 px | 638 px | 510 px | 96 × 96 px | No (`scrollWidth` 1432 < `innerWidth` 1440; ancho de scrollbar) | Ninguno | 0 |
| 768 × 1024 | `630.4px` (apilado), gap 32 px | 896 px | 784 px | 96 × 96 px | No (`scrollWidth` 760 < `innerWidth` 768) | Ninguno | 0 |
| 390 × 844 | `284.8px` (apilado), gap 32 px | 938 px | 826 px | 96 × 96 px | No (`scrollWidth` 382 < `innerWidth` 390) | Ninguno | 0 |

Comprobaciones adicionales:

- `#proyectos` presente en las tres resoluciones.
- En la presentación solo quedan dos enlaces: GitHub y correo; ya no existe «Explorar proyectos».
- No aparecen en la presentación «Desarrollo de software», «Formación académica», «Áreas de interés», «Actualmente busco oportunidades» ni «He trabajado con tecnologías».
- Título y subtítulo exactos; párrafo exacto.
- Las cinco secciones de la portada siguen en orden: presentación → proyectos → tecnologías → proceso → contacto.

---

## 7. Resultados de pruebas y build

| Comando | Resultado |
| --- | --- |
| `npm run test:b0` | **PASS** — 86 pruebas, 86 OK, 0 fallos, 0 omitidas (492.8193 ms). |
| `npm run test:b5` | **PASS** — 86 pruebas, 86 OK, 0 fallos, 0 omitidas (341.8734 ms). |
| `npx tsc --noEmit` | **PASS** — exit code 0, sin errores. |
| `npm run lint` | **PASS** — exit code 0, sin avisos de ESLint. |
| `npm run build` | **PASS** — exit code 0; compilación en 1582 ms, chequeo de TypeScript en 3.0 s, 5/5 páginas estáticas generadas en 1525 ms. Rutas: `/`, `/_not-found` y `/proyectos/fiore/demo`. |

Advertencia no bloqueante del build, ya presente en fases anteriores: `Next.js ignored package-lock.json in C:\Users\pc because it is outside the current Git repository`. No afecta la compilación ni las rutas.

---

## 8. Cierre

- Servidor de producción detenido y puerto 3000 liberado.
- Pestañas de diagnóstico cerradas.
- Sin commits, push ni deploy.
- La fase se detiene aquí; no se inició ninguna fase posterior.
