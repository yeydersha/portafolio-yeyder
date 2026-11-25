# M6 — Ampliación profesional del portafolio — Informe final

Fecha: 25/11/2026. Estado: **M6 COMPLETADO CON OBSERVACIONES**.

Trabajo realizado sobre el portafolio existente, sin reconstruirlo ni rediseñarlo. Se conservaron el tema oscuro, la estética editorial minimalista, el glassmorphism sutil, la paleta, la tipografía, los espaciados, los bordes/sombras y las animaciones moderadas. No se modificaron la presentación principal, el carrusel ni las presentaciones de proyectos, la demo de Fiore, el mini navegador de ElectroTero, los enlaces de GitHub y correo, el ancla `#proyectos` ni las rutas. No se añadieron dependencias, no se hicieron commits, push ni deploy, y no se inició M5.2.

---

## 1. Componentes creados

| Archivo | Función en M6 |
| --- | --- |
| `src/data/professional-content.ts` | Fuente única de datos profesionales: categorías de tecnologías, cuatro etapas del proceso, textos de contacto y orden público de secciones. Datos puros, sin React ni Next.js, para poder verificarlos con pruebas Node. |
| `src/components/ui/section-reveal.tsx` | Entrada breve al entrar en viewport mediante `motion/react` (`useInView`, `once: true`, `amount: 0.15`). Con `prefers-reduced-motion` y con un temporizador de seguridad de 1200 ms el contenido queda visible sin depender de la animación. |
| `src/components/ui/technologies-section.tsx` | Sección `#tecnologias` con cuatro tarjetas (`Desarrollo web`, `Backend`, `Bases de datos`, `Herramientas`) y etiquetas de tecnologías, sin niveles ni porcentajes. |
| `src/components/ui/process-section.tsx` | Sección `#proceso` con lista ordenada de cuatro etapas; línea de tiempo horizontal en escritorio y vertical en móvil. |
| `src/components/ui/contact-section.tsx` | Sección `#contacto` con dos enlaces reales (correo y GitHub) y una línea breve de formación y ubicación. Sin formularios ni descargas inventadas. |
| `tests/m6-professional-content.test.ts` | Seis pruebas puras sobre orden de secciones, tecnologías exactas, redacción formativa, proceso, enlaces reales y ausencia de niveles o credenciales inventadas. |

Componentes reutilizados sin cambios: `GlassCard`, `TechTag` y el contenedor visual ya usado por `ProjectsCarousel` (`rounded-3xl border-border/50 bg-background/45 backdrop-blur-2xl`). Los iconos provienen de `lucide-react` ya instalado (`Code2`, `Server`, `Database`, `Wrench`, `ListChecks`, `PenTool`, `TestTube`, `ArrowUpRight`, `GraduationCap`, `Mail`, `MapPin`). El icono de GitHub es un SVG local en `contact-section.tsx`, porque la versión instalada de `lucide-react` no incluye iconos de marca; no se instaló ningún paquete nuevo.

---

## 2. Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/app/page.tsx` | Único punto de composición: se añadieron `TechnologiesSection`, `ProcessSection` y `ContactSection` después de `ProjectsCarousel`, en el orden aprobado. No se alteró ningún componente existente. |
| `src/app/globals.css` | Refuerzo dentro del bloque `prefers-reduced-motion: reduce`: `[data-reveal] { opacity: 1 !important; transform: none !important; }`. Así el contenido es legible desde el primer render aunque la hidratación todavía no haya asentado el estado de la animación. |
| `package.json` | Los scripts `test:b0` y `test:b5` incluyen `.b0-tests/tests/m6-professional-content.test.js`. `test:b5` sigue delegando en `test:b0`. |
| `tsconfig.b0-tests.json` | Se añadió `tests/m6-professional-content.test.ts` al `include` de la compilación de pruebas. |

`src/components/ui/section-reveal.tsx` se ajustó durante la verificación para dejar la visibilidad inmediata de reduced motion a la regla CSS y conservar el efecto sin llamadas a `setState` síncronas (cumple `react-hooks/set-state-in-effect`). No se tocaron `projects-carousel.tsx`, `glassmorphism-portfolio-block-shadcnui.tsx`, `project-showcase.tsx`, `route-transition.ts` ni los archivos de la demo de Fiore.

---

## 3. Contenido

### Tecnologías y herramientas

Texto: «Herramientas que he utilizado durante mi formación y en el desarrollo de proyectos académicos y personales.»

| Categoría | Tecnologías |
| --- | --- |
| Desarrollo web | HTML, CSS, JavaScript, TypeScript, React, Next.js, Angular |
| Backend | Java, Spring Boot, APIs REST |
| Bases de datos | PostgreSQL, MongoDB, SQL |
| Herramientas | Git, GitHub, Visual Studio Code |

### Mi proceso de desarrollo

Texto: «Una forma de organizar mis proyectos, desde la definición de funcionalidades hasta las pruebas y mejoras.»

1. **01 Planificación** — «Defino el objetivo del proyecto, identifico sus funcionalidades y organizo las tareas antes de comenzar.»
2. **02 Diseño** — «Organizo las pantallas y los componentes, buscando interfaces claras, consistentes y adaptables a diferentes dispositivos.»
3. **03 Desarrollo** — «Implemento las funcionalidades por etapas, integrando interfaces, validaciones y gestión de datos según las necesidades del proyecto.»
4. **04 Pruebas y mejoras** — «Compruebo el funcionamiento, reviso posibles errores y realizo ajustes antes de considerar una funcionalidad terminada.»

### Contacto profesional

Texto: «Estoy interesado en oportunidades para adquirir experiencia en el área de tecnología y continuar desarrollando mis conocimientos. Si deseas conocer más sobre mis proyectos o ponerte en contacto conmigo, puedes escribirme.»

- Correo: `mailto:yeyderotero@gmail.com`, acción «Enviar correo».
- GitHub: `https://github.com/yeydersha`, `@yeydersha`, acción «Ver GitHub», con `target="_blank"` y `rel="noopener noreferrer"`.
- Línea breve: «Ingeniería Informática — UNIPAZ · Séptimo semestre, en curso» y «San Pablo, Bolívar, Colombia».

No se incluyó hoja de vida, certificaciones, experiencia laboral, clientes, resultados comerciales, niveles avanzados, porcentajes, años de experiencia ni estadísticas. El nivel declarado sigue siendo básico y las etiquetas describen uso formativo o en proyectos académicos y personales, no dominio profesional.

### Orden final de la portada

`presentacion` → `proyectos` → `tecnologias` → `proceso` → `contacto`. Confirmado en DOM real (`main > section`: `hero`, `proyectos`, `tecnologias`, `proceso`, `contacto`) y en la prueba `homepageSectionOrder`. Ninguna sección nueva se insertó dentro de las demos.

---

## 4. Decisiones de diseño

- Se replicó el lenguaje visual existente: contenedor `max-w-6xl`, padding `px-6`, `py-14 lg:py-16`, borde `border-border/50`, fondo `bg-background/45`, `backdrop-blur-2xl` y esquinas `rounded-3xl`. Las tarjetas internas usan `GlassCard` y las etiquetas `TechTag`.
- Las secciones nuevas son moderadas: encabezado con eyebrow en `text-primary`, `h2` de `text-3xl md:text-4xl` y descripción en `text-foreground/60`. No se introdujeron nuevos colores, fuentes ni sombras.
- Tecnologías y contacto usan `grid sm:grid-cols-2`; el proceso usa `grid md:grid-cols-4`. Las líneas de la línea de tiempo son decorativas (`aria-hidden="true"`) y no cambian con el tema.
- La referencia académica y la ubicación se concentraron en una sola línea dentro de Contacto, sin crear una sección académica independiente.
- El contenido se separó en datos puros para que las afirmaciones sean auditables y las pruebas no dependan de renderizado.
- El icono de GitHub se incrustó localmente para evitar una dependencia nueva; todos los iconos decorativos llevan `aria-hidden="true"`.

---

## 5. Animaciones

- `SectionReveal` usa `initial={false}`, `animate` de `opacity: 0 → 1` e `y: distance → 0` (distancia 12 px), duración 0.4 s, `ease: "easeOut"` y escalonamiento de 0.05 s por tarjeta.
- Un temporizador acotado de 1200 ms fuerza `fallbackVisible` si `IntersectionObserver` no entrega la entrada en viewport, de modo que ningún contenido quede oculto de forma indefinida.
- Con `prefers-reduced-motion: reduce`: `useReducedMotion()` deja la transición en 0 s y la regla de `globals.css` fuerza `opacity: 1` y `transform: none` en `[data-reveal]`. El scroll global pasa a `auto` y la superficie de transición de ruta queda en `1e-05s`, conservando el comportamiento previo de M5.1.
- Verificado en navegador real: 14 elementos `[data-reveal]` con opacidad `1` y `transform: none` desde la carga bajo reduced motion; sin errores de consola.

---

## 6. Responsive

Verificación con emulación de viewport en navegador real, tema oscuro:

| Viewport | `innerWidth` | `scrollWidth` del documento | Resultado |
| --- | --- | --- | --- |
| 1440×900 | 1440 | 1432 | Sin overflow horizontal |
| 768×1024 | 768 | 760 | Sin overflow horizontal |
| 390×844 | 390 | 382 | Sin overflow horizontal |

(`scrollWidth` es menor que `innerWidth` por el ancho de la barra de desplazamiento; no hay contenido que se salga del ancho disponible.)

- Tecnologías: dos columnas en escritorio y tablet (315.2 px cada una a 768), una columna en móvil (292.8 px).
- Proceso: cuatro columnas en escritorio y tablet (146.6 px cada una a 768, tarjetas de 147 px sin desbordamiento interno), una columna en móvil (292.8 px, tarjetas de 293 px). En móvil la línea de tiempo cambia de horizontal a vertical y las cuatro etapas mantienen su numeración y texto.
- Contacto: dos columnas en escritorio y tablet, una en móvil; los textos largos se truncan dentro de la tarjeta sin romper el ancho.
- Las secciones nuevas no alteraron el orden ni la altura de las secciones originales; la página completa a 1440 midió 3006 px en la captura JPEG (escala 0.8).

---

## 7. Accesibilidad

- Cada sección nueva usa `<section>` con `id` y `aria-labelledby` apuntando a su `h2`; la jerarquía `h2` → `h3` es correcta.
- El proceso es una `<ol>` con `<li>`; los conectores visuales están marcados como `aria-hidden="true"`.
- Los enlaces de contacto tienen `aria-label` descriptivo («Enviar correo a …», «Ver GitHub: @yeydersha»). El de GitHub abre en pestaña nueva con `rel="noopener noreferrer"`.
- Las tarjetas de enlace conservan `:focus-visible` con contorno de 2 px en `primary` y `outline-offset-2`. No se eliminaron estados de foco existentes.
- No hay formularios con backend (0 `<form>` en Contacto) ni enlaces con atributo `download` (0).
- Todos los iconos decorativos son `aria-hidden="true"`.
- Flujo verificado en navegador real: CTA «Explorar proyectos» con `href="#proyectos"` llega al ancla (`hash="#proyectos"`, top ≈ 24 px); apertura de la presentación de Fiore enfoca la región «Presentación detallada de Fiore» y el cierre devuelve el foco al botón «Ver presentación de Fiore»; el enlace a `/proyectos/fiore/demo` y la navegación atrás conservan las cinco secciones y la superficie de ruta.
- Consola del navegador: 0 errores en todas las verificaciones (incluido reduced motion).

---

## 8. Pruebas

| Comando | Resultado final |
| --- | --- |
| `npm run test:b0` | **86/86** pruebas en verde; 0 fallos, 0 canceladas, 0 omitidas. Incluye las 6 pruebas nuevas de M6 y las 80 anteriores. |
| `npm run test:b5` | **86/86** pruebas en verde; 0 fallos (`test:b5` delega en `test:b0`). |
| `npx tsc --noEmit` | Exit 0. |
| `npm run lint` | Exit 0. |
| `npm run build` | Exit 0. Compilación correcta con rutas estáticas `/`, `/_not-found` y `/proyectos/fiore/demo`. |

Las seis pruebas nuevas validan: el orden de las cinco secciones, las cuatro categorías y tecnologías exactas, la redacción que enmarca el uso como formativo, las cuatro etapas del proceso con su texto literal, los enlaces reales sin descarga inventada y la ausencia de niveles, porcentajes, años de experiencia ni certificaciones.

Durante la verificación se detectó y corrigió un error de lint (`react-hooks/set-state-in-effect`) causado por una llamada síncrona a `setState` en el efecto de reduced motion. La solución definitiva deja esa responsabilidad a la regla CSS de `globals.css`; después del cambio se repitieron los cinco comandos, todos en verde.

---

## 9. Capturas

Copiadas a `docs/` desde la ubicación temporal del navegador, sobre el build final de producción:

| Archivo | Viewport emulado | Resolución del JPEG |
| --- | --- | --- |
| `docs/M6_Tecnologias_1440.jpg` | 1440×900 | 1146×720 |
| `docs/M6_Proceso_1440.jpg` | 1440×900 | 1146×720 |
| `docs/M6_Contacto_1440.jpg` | 1440×900 | 1146×720 |
| `docs/M6_Movil_390.jpg` | 390×844 | 306×675 |
| `docs/M6_Pagina_Completa_1440.jpg` | 1440×900, página completa | 1146×3006 |

Las capturas de escritorio se tomaron con cada sección asentada en la parte superior del viewport y el contacto al final de la página; la de móvil muestra la línea de tiempo vertical. Se descartó una captura móvil intermedia tomada antes de que la emulación de 390 px estuviera activa.

---

## 10. Observaciones pendientes

1. La aprobación píxel a píxel de las capturas queda al revisor humano: el modelo midió DOM, estilos, foco, opacidad, overflow y rutas en navegador real, pero no inspecciona el contenido visual de las imágenes.
2. No se añadió botón ni enlace de hoja de vida porque todavía no existe un PDF verificado. Si se aprueba uno, debe incorporarse como enlace real y documentarse en una iteración posterior.
3. El nivel declarado sigue siendo básico; cualquier cambio a «intermedio/avanzado» requeriría evidencia documentada.
4. `npm run build` emite una advertencia no bloqueante de Next.js sobre `package-lock.json` fuera del repositorio Git. No afecta al build ni a las rutas generadas.
5. Los cambios quedan en el árbol de trabajo sin historial nuevo. No se hicieron commits, push ni deploy.
6. El servidor de producción usado para la verificación se detuvo y la pestaña del navegador se cerró al finalizar M6.
7. No se inició M5.2 ni ninguna iteración posterior. El trabajo se detiene aquí, a la espera de instrucciones.
