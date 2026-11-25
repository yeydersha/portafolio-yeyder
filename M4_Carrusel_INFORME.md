# M4 · Carrusel de proyectos seleccionados — Informe final

Fecha: 24/11/2026. Estado: **M4 COMPLETADO CON OBSERVACIONES**.
Sin commits, sin push, sin dependencias nuevas, sin bases de datos y sin cambios a Fiore ni al proyecto original de ElectroTero.

---

## 1. Componentes creados

| Componente | Archivo | Responsabilidad |
| --- | --- | --- |
| `ProjectsCarousel` | `src/components/ui/projects-carousel.tsx` (365 líneas) | Sección `#proyectos`, region accesible del carrusel, control de posición, flechas, marcadores, live region y vista de detalle expandible de ElectroTero. |
| `ProjectCard` | `src/components/ui/project-card.tsx` (160 líneas) | Tarjeta reutilizable de 280–320 px: captura 16:10, tipo, nombre, descripción, estado, acción y reflejo visual de interacción. |

Datos tipados en `src/data/projects.ts` (148 líneas), con una **unión discriminada por `kind`**:

- `published` → ElectroTero: URL externa real + preview + `details` (solo este tipo puede tener mini navegador).
- `demo` → Fiore: ruta interna `/proyectos/fiore/demo`.
- `pending` → Taquilla de Cine: sin enlace ni acción falsa.

`portfolioProjects` es la única fuente de datos del carrusel; no hay textos, URLs ni descripciones duplicadas en los componentes.

## 2. Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/data/projects.ts` | Reescrito con los tres tipos discriminados y la lista única `portfolioProjects`. |
| `src/components/ui/project-card.tsx` | **Nuevo.** Tarjeta compacta reutilizable. |
| `src/components/ui/projects-carousel.tsx` | **Nuevo.** Carrusel + detalle de ElectroTero. |
| `src/components/ui/project-showcase.tsx` | Acepta `PublishedProject` en lugar de `Project`; se le quitó el `id="proyectos"` y se redujo su padding al pasar a vista de detalle. Su lógica y `ProjectBrowserPreview` quedan intactos. |
| `src/app/page.tsx` | Sustituye el bloque grande y la sección separada de Fiore por `<ProjectsCarousel />`; conserva la portada `GlassmorphismPortfolioBlock` y el fondo ambiental. |
| `public/images/fiore-preview.jpg` | **Nuevo.** Copia de la captura real `docs/M4.2B_B6_1440_dashboard_final.jpg` generada en la verificación B6. Origen documentado en un comentario de `projects.ts`. |
| `docs/M4_Carrusel_1440.jpg`, `docs/M4_Carrusel_768.jpg`, `docs/M4_Carrusel_390.jpg`, `docs/M4_ElectroTero_Detalle_1440.jpg` | **Nuevos.** Capturas de verificación. |

**No modificados:** `src/app/globals.css`, `package.json`, `src/app/proyectos/fiore/demo/**`, `src/components/fiore-demo/**`, `src/components/ui/project-browser-preview.tsx`, `src/components/ui/glassmorphism-portfolio-block-shadcnui.tsx`, `public/images/electrotero-preview.jpg`.

## 3. Diseño del carrusel

- Sección **Proyectos seleccionados** con `id="proyectos"` (se conserva el ancla que antes tenía `ProjectShowcase`).
- Panel contenedor con fondo translúcido, borde suave y `backdrop-blur-2xl`, coherente con el glassmorphism existente.
- Pista nativa `flex` con `snap-x snap-mandatory`, `overscroll-x-contain` y `touch-manipulation`; ancho máximo 600 px, centrada.
- Tarjetas: `w-[280px]` en móvil, `sm:w-[300px]`, `lg:w-[320px]`; imagen `aspect-[16/10]` con `object-cover`; fondo `bg-background/55`, borde `border-border/50`, `backdrop-blur-xl`; sombra `0_10px_35px` que se acentúa al hover.
- Identidad conservada: tema oscuro, acentos `primary`/`secondary`, tipografía editorial (títulos 30/36/40 px según breakpoint), bordes redondeados y transiciones `motion-safe`.
- Sin librería de carrusel: CSS scroll-snap + un script pequeño derivado del `scrollLeft` real.

## 4. Interacciones

| Interacción | Implementación | Evidencia |
| --- | --- | --- |
| Mouse / trackpad / táctil | Scroll horizontal nativo del contenedor. | Arrastre en 390 px: `scrollLeft` 0 → **298**. |
| Flechas anterior / siguiente | `button` nativos con `aria-label`; desplazamiento centrado en la tarjeta destino. | 1440 px: 0 → **200** → **400** → **200**; marcador y `role="status"` sincronizados. |
| Marcadores | Tres botones con `aria-current="true"` en el activo. | Al usar flechas/teclado el marcador activo cambia correctamente. |
| Teclado | `ArrowRight`, `ArrowLeft`, `Home`, `End` sobre la pista con `tabIndex=0`. | `ArrowRight` → tarjeta 3; `Home` → tarjeta 1. |
| Foco | Controles y pista con foco visible global; al llegar a un extremo el foco se traslada al control opuesto para no dejar un botón deshabilitado enfocado. | Tras `siguiente2`, foco en «Proyecto anterior». |
| Anuncios | `role="status" aria-live="polite"` con «Proyecto N de 3: …» tras asentarse el scroll. | «Proyecto 2 de 3: Fiore», «Proyecto 3 de 3: Taquilla de Cine». |
| Reduced motion | `prefers-reduced-motion` consultado antes de cada `scrollTo` y `scrollIntoView`; `motion-safe:` en animaciones decorativas. | `matchMedia(...).matches === true` bajo emulación `reduce`. |
| Fallback de scroll | Si el navegador no anima el scroll suave o el snap lo cancela, tras dos comprobaciones sin avance se aplica la posición final con `behavior:"auto"`. | Necesario en el navegador automatizado; en un navegador normal la animación suave sigue intacta. |

Cada tarjeta lleva `role="group"`, `aria-roledescription="slide"` y `aria-label="N de 3: nombre"`; el carrusel es un `region` con `aria-roledescription="carousel"`.

## 5. Integración ElectroTero / Fiore

**ElectroTero**

- La portada compacta usa la captura real `/images/electrotero-preview.jpg` (misma fuente canónica del preview, sin duplicar el archivo).
- El botón «Ver presentación» abre `#electrotero-detalle`, un `region` con `tabIndex=-1`; al abrir, el foco entra en la vista y al cerrar vuelve al botón que la abrió («Ver presentación» verificado).
- Dentro del detalle se conserva `ProjectShowcase` → `ProjectBrowserPreview` con la etiqueta «Vista estática», el enlace real `https://electrotero.com/` y todo el contenido de `details` (funciones, nota de privacidad, tecnologías).
- El mini navegador, su comportamiento de seguridad y la URL pública no se modificaron.

**Fiore**

- Tarjeta con captura real del dashboard B6 y enlace a `/proyectos/fiore/demo`.
- Navegación verificada: `location.pathname === "/proyectos/fiore/demo"`, título «Fiore · Demo interactiva | Portafolio Yeyder», clave `yeyder.fiore.demo.v1` presente, consola sin errores.
- No se tocó ningún archivo de la demo, ni `DEMO_STATE_VERSION`, ni la semilla, ni la persistencia.

**Taquilla de Cine**

- Solo datos: tipo «Proyecto académico», estado «Demo pendiente», descripción breve.
- Placeholder neutro «Captura pendiente» con icono, más texto `sr-only` que explica que no hay captura ni demo pública verificada. No se inventó enlace ni captura; no se inició ninguna demo.

## 6. Resultados de pruebas

| Comando | Resultado |
| --- | --- |
| `npm run test:b0` | **72/72 pass**, 0 fail |
| `npm run test:b5` | **72/72 pass**, 0 fail (incluye `test:b0`) |
| `npx tsc --noEmit` | **exit 0** |
| `npm run lint` | **exit 0** |
| `npm run build` | **exit 0** — 3 rutas estáticas: `/`, `/_not-found`, `/proyectos/fiore/demo` |

Advertencia no bloqueante de Next.js: ignora `package-lock.json` por estar fuera del repositorio Git; aparece también en el build de B6.

**Verificación en navegador real (Chrome/Brave vía herramienta `browse`, no Playwright):**

- 1440×900: 3 tarjetas de 320 px, pista 600/1000 px, `scroll-snap-type: x mandatory`, sin desbordamiento del documento (`scrollWidth === clientWidth === 1432`), consola sin errores.
- 768×1024: tarjetas de 300 px, sin desbordamiento (760/760), flecha funcional (`scrollLeft` 170).
- 390×844 con `touch: true`: tarjetas de 280 px, pista 285/880 px, sin desbordamiento (382/382), arrastre funcional (`scrollLeft` 298).
- Detalle ElectroTero: `hidden=false`, mini navegador presente («Abrir electrotero.com en una pestaña nueva»), imagen cargada 843×533, `href=https://electrotero.com/`, etiqueta «Vista estática» presente.
- Cierre del detalle: `hidden=true` y foco devuelto al disparador.

## 7. Capturas de escritorio y móvil

| Archivo | Contenido |
| --- | --- |
| `docs/M4_Carrusel_1440.jpg` | Escritorio 1440×900, sección de proyectos con las tres tarjetas. |
| `docs/M4_Carrusel_768.jpg` | Tablet 768×1024, tarjetas de 300 px. |
| `docs/M4_Carrusel_390.jpg` | Móvil 390×844, tarjeta de 280 px y pista desplazable. |
| `docs/M4_ElectroTero_Detalle_1440.jpg` | Detalle expandido de ElectroTero con mini navegador y enlace real. |

Las capturas se generaron desde el navegador real con `colorScheme: dark`. La comprobación automatizada cubrió medidas, desbordamiento, foco, estado y consola; la aprobación estética pixel a pixel queda a criterio del revisor humano.

## 8. Limitaciones pendientes

1. **Taquilla de Cine**: no hay captura ni demo pública verificada en `docs/`. La tarjeta usa placeholder y no expone acciones. Si aparece un repositorio o demo verificable, actualizar `src/data/projects.ts` (p. ej., cambiar `kind` a `demo` o `published`) sin tocar los componentes.
2. **Captura de Fiore**: se reutilizó una imagen real generada en B6 (`docs/M4.2B_B6_1440_dashboard_final.jpg`); no es una captura nueva del proyecto original. Está documentado en `projects.ts`.
3. **Scroll suave en automatización**: el navegador automatizado no anima `scrollTo({behavior:"smooth"})` (comprobado con y sin snap). Se añadió un fallback que garantiza la llegada; conviene una pasada manual en un navegador de usuario para confirmar la sensación de la animación.
4. **Gestos táctiles reales**: la verificación usó emulación táctil y arrastre del navegador automatizado, no un dispositivo físico.
5. **Revisión visual humana**: este agente no puede inspeccionar los píxeles de las capturas; se revisaron medidas y estado del DOM, no la composición visual final.
6. **Sin Playwright**: no se instaló ni ejecutó; la verificación se hizo con la herramienta de navegador disponible.
7. **Estado Git**: el repositorio sigue sin commits y todo permanece como archivos locales; no se hizo commit ni push, conforme a la restricción.

**Resultado final: M4 COMPLETADO CON OBSERVACIONES.** Se detiene aquí sin iniciar otro bloque.
