# M5.1 — Presentaciones de proyectos y navegación fluida — Informe final

Fecha: 24–25/11/2026. Estado: **M5.1 COMPLETADO CON OBSERVACIONES**.

Trabajo realizado sobre el portafolio existente, sin reconstruirlo ni rediseñarlo. Se conservaron el tema oscuro, el glassmorphism sutil, los acentos turquesa, la tipografía, los espaciados y las animaciones moderadas. No se modificó el código interno de la demo de Fiore, no se añadieron dependencias, no se crearon repositorios ni servicios externos, y no hubo commits, push ni deploy.

---

## 1. Diagnóstico

### Estado encontrado

- `src/app/page.tsx` solo compone `GlassmorphismPortfolioBlock` y `ProjectsCarousel`; no había una capa de presentación reutilizable para los tres proyectos.
- `src/components/ui/projects-carousel.tsx` tenía un detalle expandible propio, pensado principalmente para ElectroTero. Fiore y Taquilla no compartían esa presentación.
- `src/data/projects.ts` ya era la fuente única de datos, pero no existía un tipo normalizado ni un normalizador para alimentar un solo componente visual.
- La tarjeta de Fiore enlazaba a `/proyectos/fiore/demo`, pero no había una presentación previa que explicara el proyecto original, la demo y sus datos ficticios.
- Taquilla de Cine no tenía demo pública verificada; cualquier acción inventada habría sido engañosa.
- El CTA «Explorar proyectos» conservaba `#proyectos`, pero el desplazamiento y la navegación a la demo no tenían una transición local coordinada.
- En M5 ya se había corregido un problema de visibilidad: los highlights y los enlaces GitHub/correo quedaban con `opacity: 0` por animaciones `whileInView` fuera del viewport. Esa corrección se conservó.

### Objetivo de la iteración

Unificar la presentación de los tres proyectos, mantener una sola abierta a la vez, hacer que el foco y el cierre sean accesibles, suavizar el flujo `/` ↔ `/proyectos/fiore/demo`, y controlar el salto al ancla `#proyectos` sin perder enlaces directos ni navegación con teclado.

---

## 2. Componentes reutilizados

| Archivo | Función en M5.1 |
| --- | --- |
| `src/data/projects.ts` | Nuevos tipos `ProjectPresentationData`, `ProjectPresentation` y `getProjectPresentation`. Normaliza `published`, `demo` y `pending` sin inventar URLs ni acciones. Sigue siendo la única fuente de datos. |
| `src/components/ui/project-showcase.tsx` | Presentación ampliada única. Muestra nombre, tipo, estado, descripción, necesidad, funcionalidades, tecnologías, captura real, acción real y nota de privacidad/demo. Conserva el preview especial de ElectroTero. |
| `src/components/ui/project-card.tsx` | Un solo botón por tarjeta con `aria-label="Ver presentación de …"`; el texto visible sigue siendo «Ver proyecto», «Explorar demo» o «Ver presentación» según el caso. |
| `src/components/ui/projects-carousel.tsx` | Estado único `openProjectId`, `AnimatePresence mode="wait"`, cierre visible, foco entrante y restaurado, y normalización mediante `getProjectPresentation`. |
| `src/components/ui/project-browser-preview.tsx` | Mini navegador de ElectroTero, reutilizado sin cambios de comportamiento. |
| `src/components/ui/badge.tsx` y `src/components/ui/tech-tag.tsx` | Estados y tecnologías, reutilizados dentro de la presentación común. |
| `src/components/ui/glassmorphism-portfolio-block-shadcnui.tsx` | CTA `#proyectos` con `scrollIntoView` controlado y `history.replaceState`; contenido personal de M5 conservado. |
| `src/lib/route-transition.ts` | Lógica pura para decidir qué clics internos se animan. Prueba unitaria sin React ni Next.js. |
| `src/components/ui/route-transition-surface.tsx` | Interceptación local en fase de captura, fade-out con WAAPI y contenedor `data-route-surface`. No sustituye al router de Next.js. |
| `src/app/layout.tsx` | Integra `RouteTransitionSurface` alrededor de `children`. |
| `src/app/globals.css` | `scroll-behavior: smooth`, animación de entrada de 220 ms y refuerzo de `prefers-reduced-motion`. |

No se instalaron paquetes; el stack sigue siendo Next.js `16.4.6`, React `19.3.0`, Tailwind CSS `4.3.3`, Motion y Lucide.

---

## 3. Presentaciones

Todas las tarjetas abren el mismo componente `ProjectShowcase`, alimentado por `getProjectPresentation`.

| Proyecto | Tipo y estado | Contenido de la presentación | Acción real |
| --- | --- | --- | --- |
| ElectroTero | «Plataforma web · Energía solar» · «Sitio publicado» | Resumen original, tecnologías originales, preview estático real, aviso de vista estática y notas administrativas. | Enlace externo a `https://electrotero.com/` con texto «Visitar sitio web». |
| Fiore | «Sistema de gestión de inventario para joyería» · «Demo interactiva» | Necesidad de trazabilidad de productos, existencias y rentabilidad; seis funcionalidades; tecnologías originales verificadas; captura real B6; nota que separa demo y producción. | Enlace interno a `/proyectos/fiore/demo` con texto «Explorar demo». |
| Taquilla de Cine | «Proyecto académico de desarrollo de software» · «Demo pendiente» | Necesidad de unificar cartelera, cupos, compras y ventas; funcionalidades del proyecto original; stack verificado; marcador «Captura pendiente». | Sin acción. No se creó `/proyectos/taquilla-cine/demo`, captura ni repositorio inventado. |

### Funcionalidades mostradas en Fiore

1. Administración de productos.
2. Categorías y proveedores.
3. Entradas, salidas y ajustes de stock.
4. Registro de ventas.
5. Dashboard de indicadores.
6. Reportes y consultas.

### Tecnologías originales de Fiore

`Next.js 16`, `React 19`, `TypeScript`, `Tailwind CSS v4`, `PostgreSQL`, `Zod`, `node-postgres`. La demo local se describe por separado como React/TypeScript con datos ficticios y `localStorage`; no se presenta como el sistema original en producción.

### Tecnologías verificadas de Taquilla

`Angular 21`, `Spring Boot`, `Java`, `PostgreSQL`. La presentación aclara que las funciones pertenecen al proyecto original y que todavía no existe una demostración interactiva pública.

### ElectroTero

Se conservaron el `kind: "published"`, `https://electrotero.com/`, `displayDomain: "electrotero.com"`, la captura real `electrotero-preview.jpg`, el mini navegador y el aviso de que el sitio no permite incrustarlo en un iframe.

---

## 4. Apertura y cierre de presentaciones

- `openProjectId` es el único estado de presentación. Al elegir otro proyecto, `AnimatePresence mode="wait"` sustituye la vista anterior; en las pruebas de navegador siempre hubo **una sola** región `Presentación detallada…`.
- La región entrante se enfoca al terminar la animación de entrada. Al cambiar de ElectroTero → Fiore → Taquilla, `document.activeElement` pasó a ser, respectivamente:
  - `Presentación detallada de ElectroTero`
  - `Presentación detallada de Fiore`
  - `Presentación detallada de Taquilla de Cine`
- El botón «Cerrar presentación» permanece arriba a la derecha de la vista abierta; se comprobó que tiene altura visible (`h > 0`).
- El cierre restaura el foco al botón que abrió la presentación. Tras cerrar Taquilla, el foco volvió a `Ver presentación de Taquilla de Cine` y el número de regiones bajó a 0.
- La salida dura 250 ms. Como Motion no garantiza `onAnimationComplete` para la rama `exit` en todas las versiones, hay un temporizador acotado de 300 ms como respaldo; si se vuelve a abrir antes, `openDetail` lo cancela.
- El desplazamiento automático solo ocurre la primera vez que se abre una presentación. Al conmutar de ElectroTero a Fiore, `scrollY` pasó de 1994 a 1994: no hubo salto. Al cerrar, se devuelve el botón de origen a la vista con `scrollIntoView({ block: "nearest" })`.

---

## 5. Transiciones de ruta

- Ámbito: solo `/` y `/proyectos/fiore/demo`. `isRouteTransitionPath` impide que la transición se aplique al resto del sitio.
- `shouldAnimateInternalNavigation` excluye clics con modificadores, botón secundario, `target`, `download`, enlaces externos, anclas de la misma página y eventos ya prevenidos.
- `RouteTransitionSurface` intercepta el clic en fase de captura, aplica un fade-out de 140 ms hasta `opacity: 0.35` y luego llama a `router.push`.
- La superficie entrante usa `@keyframes route-surface-in`, de `0.35` a `1` en 220 ms, con `key={pathname}`. No se modifica el tamaño ni se inserta una pantalla negra.
- Flujo verificado en Chrome real: portada → abrir Fiore → «Explorar demo» → demo → atrás → portada → adelante → demo. Las rutas observadas fueron `/` y `/proyectos/fiore/demo` en el orden esperado.
- La opacidad mínima observada en la superficie fue `0.35`; nunca se vio la página en negro ni un parpadeo de contenido. En algunas lecturas inmediatas la superficie seguía en `0.35` y se estabilizó en `1` al completarse el fotograma animado.
- La clave `m51.transition.probe` escrita en `localStorage` antes de navegar siguió con valor `ok` en ida, atrás y adelante. La clave propia de la demo `yeyder.fiore.demo.v1` también permaneció presente.
- No se detectaron errores de consola durante el flujo completo (`errorsOnly: true` devolvió `entries: []`).

---

## 6. Scroll y ancla `#proyectos`

- El CTA sigue siendo un enlace real: `<a href="#proyectos">Explorar proyectos</a>`.
- El manejador intercepta el clic primario sin modificadores, usa `scrollIntoView({ behavior: "smooth" | "auto", block: "start" })` y conserva `#proyectos` con `history.replaceState`.
- En 1440×900, el hash pasó a `#proyectos` y `scrollY` de 1043 a 1126 de forma progresiva; a los 700 ms la sección quedó con `top: 131` y se mantuvo estable a los 1400 ms.
- En 768×1024, al enfocar el CTA y pulsar `Enter`, el hash fue `#proyectos` y la sección quedó con `top: 225`.
- En 390×844, el CTA terminó con `hash: "#proyectos"`, `scrollY: 1853` y `top: 24`.
- La URL directa `/#proyectos` también desplazó a la sección (`scrollY: 1126`, `top: 131` en 1440×900).
- `html` conserva `scroll-behavior: smooth`; con `prefers-reduced-motion: reduce` pasa a `auto`.

---

## 7. Presentación personal

No se tocó el diseño aprobado en M5:

- Subtítulo: «Estudiante de Ingeniería Informática | Desarrollo de software».
- CTA principal: «Explorar proyectos» hacia `#proyectos`.
- GitHub y correo permanecen únicamente en la tarjeta derecha de contacto.
- Highlights visibles: «Desarrollo de software», «Formación académica» y «Áreas de interés».
- El párrafo duplicado de la columna derecha sigue eliminado.
- Las instrucciones del carrusel permanecen en el `aria-label` de la pista, no como texto decorativo.
- Los tres enlaces GitHub/correo, los highlights y el CTA se midieron con `opacity: 1` y `visibility: visible` en 1440×900, 768×1024 y 390×844.

---

## 8. Accesibilidad

- Cada presentación es un `role="region"` con `aria-label="Presentación detallada de …"` y `tabIndex={-1}` para poder recibir el foco.
- Cada tarjeta expone un botón con etiqueta explícita; el texto visible no depende de iconos sin nombre.
- «Ver detalles del proyecto» usa `aria-expanded` y `aria-controls`; el panel se oculta con `hidden` cuando está cerrado.
- La pista del carrusel conserva `tabIndex={0}`, `role="group"`, `aria-label` descriptivo, flechas, inicio/fin y un `role="status"` con `aria-live="polite"` para anunciar el proyecto activo.
- El foco visible global usa contorno turquesa de 2 px con `outline-offset: 2px`.
- `MotionConfig reducedMotion="user"`, `prefersReducedMotion()` en los componentes y la regla CSS global reducen o eliminan animaciones cuando el sistema lo solicita.
- En la prueba con `prefers-reduced-motion: reduce`: `matchMedia` devolvió `true`, `scroll-behavior` fue `auto`, la animación de la superficie quedó en `1e-05s`, el CTA llegó de inmediato a `#proyectos`, la presentación abrió con una sola región y enfocó su título, el cierre devolvió el foco al botón y la ruta a la demo terminó con opacidad `1`.
- No se detectaron errores de consola en los recorridos de teclado, presentaciones ni transición.

---

## 9. Responsive

Se emularon tres viewports en Chrome real. No hubo overflow horizontal en ninguno (`document.documentElement.scrollWidth <= innerWidth`).

| Viewport | Portada | Presentación | Demo y transición |
| --- | --- | --- | --- |
| 1440×900 | CTA, highlights y contacto visibles; sin overflow. | Una región, foco en la región, cierre visible; Fiore, Taquilla y ElectroTero verificados. | Ruta correcta, sin overflow, sin errores; ida y vuelta con `localStorage` conservado. |
| 768×1024 | CTA y contacto visibles; `scrollW: 760`, `innerW: 768`; CTA por `Enter` correcto. | Una región Fiore, foco en la región, acción «Explorar demo», cierre visible. | Demo cargó sin overflow; atrás devolvió a `/` con superficie en opacidad `1`. |
| 390×844 | CTA, highlights y contacto visibles; `scrollW: 382`, `innerW: 390`. | Una región Fiore, foco en la región, cierre visible, sin overflow. | Demo cargó sin overflow; atrás devolvió a `/` con superficie en opacidad `1`. |

Los tamaños de archivo JPEG capturados son inferiores a los viewports emulados porque el navegador capturó a resolución de dispositivo reducida; la evidencia de layout se midió sobre los viewports indicados.

---

## 10. Pruebas

### Comandos

| Comando | Resultado |
| --- | --- |
| `npm run test:b0` | **80/80** pruebas en verde; 0 fallos, 0 canceladas, 0 omitidas. Incluye 8 pruebas nuevas de M5.1. |
| `npm run test:b5` | **80/80** pruebas en verde; 0 fallos. `test:b5` reutiliza `test:b0`. |
| `npx tsc --noEmit` | Exit 0. |
| `npm run lint` | Exit 0. |
| `npm run build` | Exit 0. Compilación correcta y rutas estáticas: `/`, `/_not-found` y `/proyectos/fiore/demo`. |

Las pruebas nuevas de `tests/project-presentation.test.ts` cubren la normalización de las tres tarjetas, la conservación de ElectroTero, la separación entre stack original y demo de Fiore, y la ausencia de demo inventada en Taquilla. `tests/route-transition.test.ts` cubre el ámbito de las dos rutas, los clics animados, las exclusiones y `prefers-reduced-motion`.

### Verificación en navegador real

Se usó el navegador Chrome conectado al entorno, sobre el servidor de producción en `http://127.0.0.1:3000`:

- Conmutación ElectroTero → Fiore → Taquilla: siempre una sola región, foco correcto, cierre visible y `scrollY` estable al cambiar de proyecto.
- Cierre desde Taquilla: región eliminada y foco restaurado al botón de origen.
- Fiore → demo → atrás → adelante: rutas correctas, superficie sin pantalla negra, consola vacía y claves de `localStorage` conservadas.
- CTA por clic y por teclado, y enlace directo `/#proyectos`: desplazamiento controlado al ancla.
- Tres viewports y `prefers-reduced-motion: reduce` verificados.

---

## 11. Capturas

Copiadas a `docs/` desde la ubicación temporal del navegador:

| Archivo | Viewport emulado | Resolución del JPEG |
| --- | --- | --- |
| `docs/M5_1_Portada_1440.jpg` | 1440×900 | 1146×720 |
| `docs/M5_1_Portada_768.jpg` | 768×1024 | 608×819 |
| `docs/M5_1_Portada_390.jpg` | 390×844 | 306×675 |
| `docs/M5_1_Fiore_Presentacion_1440.jpg` | 1440×900 | 1146×720 |
| `docs/M5_1_Fiore_Presentacion_768.jpg` | 768×1024 | 608×819 |
| `docs/M5_1_Fiore_Presentacion_390.jpg` | 390×844 | 306×675 |
| `docs/M5_1_Fiore_Demo_1440.jpg` | 1440×900 | 1146×720 |
| `docs/M5_1_Fiore_Demo_768.jpg` | 768×1024 | 608×819 |
| `docs/M5_1_Fiore_Demo_390.jpg` | 390×844 | 306×675 |

Las capturas de presentación se retomaron con la vista ya asentada y el foco en la región; se descartó una captura anterior tomada durante un estado intermedio de conmutación.

---

## 12. Limitaciones y observaciones

1. La aprobación píxel a píxel de las capturas queda al revisor humano: el modelo no inspecciona el contenido visual de las imágenes; solo midió DOM, estilos, foco, opacidad, rutas y overflow en navegador real.
2. ElectroTero sigue mostrando una vista estática porque el sitio publicado no permite incrustarse en un iframe. El enlace externo real permanece disponible.
3. Taquilla de Cine permanece sin demo, sin captura y sin repositorio inventado. Su presentación distingue explícitamente el proyecto original de la ausencia de demostración pública.
4. La demo de Fiore continúa usando datos ficticios y `localStorage`; no se conectó a PostgreSQL ni al sistema original.
5. La transición de ruta está limitada deliberadamente al flujo portafolio ↔ demo Fiore. No se aplicó a GitHub, correo, anclas ni otras rutas.
6. Con `prefers-reduced-motion`, la superficie de ruta y el CTA son inmediatos; la presentación puede mostrar un estado inicial de opacidad 0 durante el montaje antes de asentarse en 1. No se observaron bloqueos ni errores.
7. `npm run build` emite una advertencia no bloqueante de Next.js sobre `package-lock.json` fuera del repositorio Git; no afecta al build ni a las rutas generadas.
8. No se hicieron commits, push ni deploy. Los cambios quedan en el árbol de trabajo sin historial nuevo.
9. No se inició M5.2.
