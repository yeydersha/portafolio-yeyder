# M5 — Revisión editorial y profesionalización del contenido — Informe final

Fecha: 24/11/2026. Estado: **M5 COMPLETADO CON OBSERVACIONES**.

Trabajo exclusivamente editorial sobre el portafolio existente. Sin rediseño, sin reconstrucción, sin cambios internos en Fiore ni en ElectroTero, sin dependencias nuevas, sin commits, sin push y sin deploy.

---

## 1. Problemas de contenido identificados

Auditoría previa a cualquier edición. Fuentes reales localizadas:

- `src/app/page.tsx` solo compone `GlassmorphismPortfolioBlock` y `ProjectsCarousel`. No hay header fijo ni otras secciones con texto en la portada.
- Texto de presentación, highlights, CTA y tarjeta derecha: `src/components/ui/glassmorphism-portfolio-block-shadcnui.tsx`.
- Encabezado del carrusel: `src/components/ui/projects-carousel.tsx`.
- Etiquetas de tarjeta: `src/components/ui/project-card.tsx`.
- Tipos, descripciones, estados, acciones y textos del detalle: `src/data/projects.ts`.

| # | Problema | Evidencia encontrada |
| --- | --- | --- |
| 1 | Redundancia entre columnas | La columna derecha repetía «Estudiante de séptimo semestre de Ingeniería Informática en UNIPAZ… proyectos académicos y personales», casi igual al párrafo izquierdo. También repetía «Séptimo semestre» en la línea de formación. |
| 2 | Redundancia en los highlights | «Proyectos y desarrollo», «Formación académica» y «Objetivo profesional» volvían a decir lo mismo que la presentación y la tarjeta derecha. |
| 3 | Perfil poco concreto | El subtítulo decía «Desarrollo de software y tecnología»; la presentación no nombraba tecnologías ni tipos de proyectos y usaba frases genéricas («crear soluciones digitales», «aprender, aportar y crecer profesionalmente»). |
| 4 | Acción principal mal orientada | «Ver GitHub» abría GitHub, pero GitHub ya estaba en la tarjeta de contacto. No había acción visible hacia `#proyectos`. |
| 5 | Instrucción técnica en texto principal | El carrusel mostraba «Tres trabajos recientes. Desliza, usa las flechas o el teclado para recorrerlos.». Las instrucciones debían ser discretas o para lectores de pantalla. |
| 6 | Descripciones de proyectos imprecisas | ElectroTero: «Landing page y plataforma de gestión de solicitudes»; Taquilla: «Proyecto académico en espera de una demostración interactiva»; Fiore no decía explícitamente «datos ficticios» en la tarjeta. |
| 7 | Resumen de ElectroTero enumerativo | El resumen listaba funciones («notificaciones y dashboard») sin explicar el propósito del sitio para un visitante no técnico. |
| 8 | Tono | No se encontraron errores ortográficos, pero sí construcciones genéricas y una acción («Ver presentación») poco clara para abrir el detalle en la misma página. |

---

## 2. Comparación de textos anteriores y nuevos

| Ubicación | Texto anterior | Texto nuevo |
| --- | --- | --- |
| Subtítulo | «Estudiante de Ingeniería Informática \| Desarrollo de software y tecnología» | «Estudiante de Ingeniería Informática \| Desarrollo de software» |
| Presentación | Un párrafo: «Soy estudiante de séptimo semestre … interesado en el desarrollo de software y la creación de soluciones digitales … Actualmente continúo fortaleciendo mis conocimientos y busco oportunidades para aprender, aportar y crecer profesionalmente.» | Tres párrafos cortos: formación y proyectos (web, sistemas de información, bases de datos); tecnologías aplicadas (JavaScript, TypeScript, React, Next.js, Angular, Java, PostgreSQL) en inventarios, solicitudes y compra de entradas; búsqueda de experiencia profesional, fortalecimiento técnico y participación en proyectos reales. |
| Highlight 1 | «Proyectos y desarrollo» — «Experiencia práctica mediante proyectos académicos y personales, incluyendo aplicaciones web, sistemas de gestión y herramientas digitales.» | «Desarrollo de software» — «Experiencia práctica en interfaces, formularios y gestión de información.» |
| Highlight 2 | «Formación académica» — «Estudiante de séptimo semestre de Ingeniería Informática en UNIPAZ.» | «Formación académica» — «Ingeniería Informática — UNIPAZ. Séptimo semestre, en curso.» |
| Highlight 3 | «Objetivo profesional» — «Abierto a oportunidades en desarrollo de software, soporte tecnológico y otras áreas de tecnología.» | «Áreas de interés» — «Desarrollo web, bases de datos, soporte tecnológico y herramientas de software.» |
| CTA principal | Botón «Ver GitHub» con `window.open` a GitHub. | Enlace real `<a href="#proyectos">` con texto «Explorar proyectos» e icono `ArrowDown`. GitHub permanece en la tarjeta de contacto. |
| Tarjeta derecha | Formación «Ingeniería Informática · UNIPAZ · Séptimo semestre» + párrafo completo repetido. | Formación «Ingeniería Informática · UNIPAZ» + ubicación + GitHub + correo. Sin párrafo repetido. |
| Carrusel (visible) | «Tres trabajos recientes. Desliza, usa las flechas o el teclado para recorrerlos.» | «Una selección de proyectos académicos y personales desarrollados durante mi formación.» |
| Carrusel (ARIA) | «Lista de proyectos. Usa las flechas del teclado para desplazarte.» | «Lista de proyectos. Desplázate con el scroll horizontal, las flechas o el teclado.» |
| ElectroTero · tipo | «Landing page y plataforma de gestión de solicitudes» | «Plataforma web · Energía solar» |
| ElectroTero · estado | «Sitio publicado en producción» | «Sitio publicado» |
| ElectroTero · tarjeta | «Landing pública y panel para gestionar las solicitudes de clientes.» | «Sitio web para presentar servicios de energía solar y gestionar solicitudes de clientes.» |
| ElectroTero · acción | «Ver presentación» | «Ver proyecto» |
| ElectroTero · resumen | «Plataforma web para servicios de energía solar con landing pública, formulario … notificaciones y dashboard.» | «ElectroTero es una plataforma web orientada a la presentación de servicios de energía solar y la gestión de solicitudes de clientes. Incluye un formulario público y un panel administrativo para consultar, organizar y responder solicitudes.» |
| ElectroTero · caption | «… El sitio no permite mostrarse dentro de un iframe, por lo que esta vista es estática.» | «… El sitio no permite incrustarlo en un iframe, por lo que esta vista es estática.» |
| Fiore · tipo | «Sistema de inventario de joyería» | «Sistema de gestión · Inventario» |
| Fiore · tarjeta | «Dashboard, inventario, movimientos y reportes con datos ficticios.» | «Aplicación para administrar productos, existencias, movimientos y reportes con datos ficticios.» |
| Fiore · acción | «Abrir demo de Fiore» | «Explorar demo» |
| Taquilla · tipo | «Proyecto académico» | «Proyecto académico · Gestión de cine» |
| Taquilla · tarjeta | «Proyecto académico en espera de una demostración interactiva.» | «Sistema para administrar películas, programar funciones y registrar compras de entradas.» |

Se conservaron sin cambio los estados «Demo interactiva» y «Demo pendiente», el enlace `https://electrotero.com/`, la ruta `/proyectos/fiore/demo`, el handle `@yeydersha`, el correo `yeyderotero@gmail.com`, el avatar «YO» y el ancla `#proyectos`.

---

## 3. Redundancias eliminadas

1. **Columna izquierda ↔ columna derecha:** se eliminó el párrafo completo de la tarjeta derecha. La derecha quedó como tarjeta de identidad y contacto (avatar, nombre, formación resumida, ubicación, GitHub, correo).
2. **Formación repetida tres veces:** «Séptimo semestre» permanece en la presentación y en el highlight de formación; se retiró de la línea de formación de la tarjeta derecha.
3. **Highlights ↔ presentación:** el objetivo profesional dejó de ser un recuadro y pasó al tercer párrafo de la presentación. El primer highlight ahora aporta detalles concretos (interfaces, formularios, gestión de información) en vez de repetir «proyectos académicos y personales».
4. **GitHub duplicado como acción principal:** GitHub queda únicamente en la tarjeta de contacto; la acción principal lleva a los proyectos.
5. **Instrucciones del carrusel:** dejaron de ocupar el texto descriptivo y pasaron al `aria-label` de la lista, disponible para lectores de pantalla.
6. **Contenido de relleno:** no se añadieron frases nuevas solo para ocupar el espacio liberado en la tarjeta derecha.

---

## 4. Archivos modificados

| Archivo | Modificación |
| --- | --- |
| `src/components/ui/glassmorphism-portfolio-block-shadcnui.tsx` | Subtítulo, presentación en tres párrafos, textos de los 3 highlights, CTA como enlace `#proyectos`, formación resumida y eliminación del párrafo duplicado. Se retiró el import de `Button` y se añadió `ArrowDown`. |
| `src/components/ui/projects-carousel.tsx` | Descripción visible del encabezado y `aria-label` de la pista. Lógica, snap, controles y detalle intactos. |
| `src/data/projects.ts` | Textos editoriales de ElectroTero, Fiore y Taquilla (tipo, descripción corta, estado, acción, resumen y caption). Única fuente de datos; sin cambios de `kind`, URLs ni rutas. |
| `docs/M5_Editorial_1440.jpg` | Nueva, 1440 × 900. |
| `docs/M5_Editorial_768.jpg` | Nueva, 768 × 1024. |
| `docs/M5_Editorial_390.jpg` | Nueva, 390 × 844. |
| `M5_Revision_Editorial_INFORME.md` | Nuevo. Este informe. |

**No modificados:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/ui/project-card.tsx`, `src/components/ui/project-showcase.tsx`, `src/components/ui/project-browser-preview.tsx`, `src/components/fiore-demo/**`, `src/lib/fiore-demo/**`, `src/data/fiore-demo/**`, `public/images/**`, `package.json`, informes y capturas de bloques anteriores.

---

## 5. Cambios de estructura realizados

- Un único `<motion.p>` de presentación se dividió en tres `<p>` dentro de un solo `motion.div`, conservando la animación, el retardo y la tipografía originales.
- El botón CTA se sustituyó por un `<a href="#proyectos">` con las mismas clases visuales del `Button` primary (altura 48 px, pastilla, `tracking-[0.25em]`, hover y foco). Es un ancla real: funciona con clic, teclado, apertura en pestaña nueva y `location.hash`.
- Se eliminó el `<motion.p>` duplicado de la tarjeta derecha sin cambiar el grid de dos columnas ni el `justify-between` de la tarjeta.
- Los tres highlights mantienen el mismo contenedor, animación y estilo; solo cambiaron sus textos.
- El carrusel no se reestructuró: mismos `role`, `aria-*`, pista, tarjetas, flechas, marcadores y región de detalle.
- No se añadieron dependencias, estados, hooks ni archivos de configuración.

---

## 6. Verificación de veracidad del perfil

| Afirmación del texto | Origen |
| --- | --- |
| Nombre «Yeyder Otero Galván» | Confirmado. |
| Estudiante de séptimo semestre de Ingeniería Informática en UNIPAZ | Confirmado; se conserva «en curso». No se afirma título terminado. |
| San Pablo, Bolívar, Colombia | Confirmado. |
| Experiencia práctica mediante proyectos académicos y personales | Confirmado. No se habla de experiencia laboral ni de años de experiencia. |
| Aplicaciones web, sistemas de información y bases de datos | Confirmado por el contexto y por los proyectos mostrados. |
| «Tecnologías como JavaScript, TypeScript, React, Next.js, Angular, Java y PostgreSQL» | El conector «como» indica ejemplos, no dominio avanzado. Todas están confirmadas. HTML/CSS, Spring Boot y MongoDB quedan fuera del texto principal para no sonar a lista de dominio. |
| Gestión de inventarios, administración de solicitudes y compra de entradas | Coincide con Fiore, ElectroTero y Taquilla. |
| Búsqueda de oportunidades profesionales | Confirmado: «adquirir experiencia profesional, fortalecer conocimientos y participar en proyectos reales». |
| ElectroTero como sitio publicado con formulario y panel | Confirmado por el proyecto real y su captura; no se añaden resultados de negocio ni estadísticas. |
| Fiore con datos ficticios | Se dice explícitamente en la tarjeta; la demo y su persistencia no se tocaron. |
| Taquilla como proyecto académico sin demo | Confirmado; sigue `kind: "pending"`, sin enlace ficticio. |

No se agregaron títulos, certificaciones, clientes, SENA, fotografía personal ni experiencia laboral. No se modificó `DEMO_STATE_VERSION`, la semilla ni `localStorage` de Fiore.

---

## 7. Capturas de escritorio y móvil

Capturas generadas desde el build final, tema oscuro, con la portada y el carrusel en vista. Se guardaron primero en el directorio permitido por el navegador y después se copiaron a `docs/`.

| Archivo | Viewport | Salida JPEG | Tamaño |
| --- | --- | --- | --- |
| `docs/M5_Editorial_1440.jpg` | 1440 × 900 | 1146 × 720, calidad 84 | 50 691 bytes |
| `docs/M5_Editorial_768.jpg` | 768 × 1024 | 608 × 819, calidad 84 | 48 264 bytes |
| `docs/M5_Editorial_390.jpg` | 390 × 844 | 306 × 675, calidad 84 | 31 957 bytes |

Verificación objetiva en esas tres vistas (DOM y estilos computados):

| Comprobación | 1440 | 768 | 390 |
| --- | --- | --- | --- |
| Desbordamiento horizontal del documento | 0 | 0 | 0 |
| Textos visibles recortados | 0 | 0 | 0 |
| Alturas de los 3 highlights | 88 / 88 / 111 px | 88 / 88 / 88 px | 111 / 111 / 111 px |
| Tarjeta derecha vs. columna izquierda | 903 / 903 px | 465 / 813 px (apiladas) | 481 / 1091 px (apiladas) |
| Alturas de las 3 tarjetas del carrusel | 441 px | 428 px | 416 px |
| Pista del carrusel (`client/scroll`) | 1118 / 1118 | 678 / 904 | 313 / 832 |

El texto de las tarjetas pasó de 2–3 a 3 líneas por descripción; las tres tarjetas siguen con la misma altura dentro de cada viewport y el carrusel mantiene su composición y scroll horizontal. La aprobación estética pixel a pixel queda al revisor humano: este agente solo puede verificar medidas, DOM y consola.

---

## 8. Pruebas automatizadas

Ejecutadas desde la raíz del portafolio, tras el último cambio de texto:

| Comando | Resultado exacto |
| --- | --- |
| `npm run test:b0` | `ℹ tests 72` · `ℹ pass 72` · `ℹ fail 0` · `ℹ skipped 0`; exit 0. |
| `npm run test:b5` | `ℹ tests 72` · `ℹ pass 72` · `ℹ fail 0` · `ℹ skipped 0`; exit 0. |
| `npx tsc --noEmit` | exit 0. |
| `npm run lint` | exit 0. |
| `npm run build` | exit 0; «Compiled successfully»; rutas estáticas `/`, `/_not-found`, `/proyectos/fiore/demo`. |

No se añadieron pruebas nuevas: los 72 tests existentes cubren la demo Fiore, no el contenido editorial. Advertencia no bloqueante ya conocida: Next.js ignora `package-lock.json` por estar fuera del repositorio Git.

Verificación en navegador real sobre el build final:

- **CTA:** clic en `a[href="#proyectos"]` → `location.hash = "#proyectos"`, `scrollY = 1126`, sección `#proyectos` visible a 131 px del borde superior. No hay header fijo que la oculte.
- **Enlaces internos y externos:** 1 enlace `#proyectos`, 1 GitHub (`https://github.com/yeydersha`), 1 `mailto:yeyderotero@gmail.com`, 1 `/proyectos/fiore/demo` y 3 referencias a `https://electrotero.com/` (URL del detalle, mini navegador y «Visitar sitio web»).
- **Detalle ElectroTero:** «Ver proyecto» abre `#electrotero-detalle` con el resumen nuevo, mini navegador presente, enlace `https://electrotero.com/` y etiqueta «Vista estática».
- **Fiore:** navegación a `/proyectos/fiore/demo` correcta; título «Fiore · Demo interactiva | Portafolio Yeyder» y clave `yeyder.fiore.demo.v1` presente.
- **Carrusel:** sin cambios de comportamiento; pista, snap, tarjetas y controles conservados.
- **Consola del navegador:** 0 errores en las tres resoluciones y durante las navegaciones.

---

## 9. Observaciones pendientes

1. **Aprobación visual humana:** se verificaron medidas, recortes, alturas y consola, pero no se inspeccionaron los píxeles de las capturas. La decisión estética final sigue en manos del revisor.
2. **Altura del carrusel:** las descripciones más concretas elevaron las tarjetas de 418/406/408 px (M4.1) a 441/428/416 px. Siguen siendo compactas y parejas; se priorizó texto legible antes que reducir la fuente.
3. **Semántica de «Ver proyecto»:** abre el detalle en la misma página; el sitio publicado se abre con «Visitar sitio web» o desde el mini navegador. Es la redacción solicitada, pero conviene confirmarla en una lectura humana.
4. **Ancla `#proyectos`:** la página termina poco después del carrusel, por lo que el navegador alcanza el máximo scroll y la sección queda a ~131 px del borde superior. No hay encabezado fijo que la tape; el comportamiento es correcto.
5. **Documentación histórica:** los informes M3/M4/M4.1 siguen citando los textos anteriores («Ver GitHub», «Ver presentación», «Abrir demo de Fiore»). No se reescribieron porque documentan su propio estado.
6. **Sin nuevos tests, commits, push ni deploy.** Los servidores y pestañas temporales se cerraron al terminar.

**Resultado final: M5 COMPLETADO CON OBSERVACIONES.** Se detiene aquí.
