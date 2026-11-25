# M4.1 · Pulido visual del carrusel de proyectos — Informe final

Fecha: 24/11/2026. Estado: **M4.1 COMPLETADO CON OBSERVACIONES**.

Sin commits, sin push, sin deploy, sin dependencias nuevas, sin base de datos y sin cambios a la demo de Fiore ni al proyecto original de ElectroTero.

---

## 1. Diagnóstico

El carrusel de M4 funcionaba, pero su composición no acompañaba al encabezado editorial:

| Síntoma | Medición antes del cambio (1440×900) |
| --- | --- |
| Título a la izquierda, primera tarjeta demasiado centrada | Título en `x=181`, primera tarjeta en `x=416`: **235 px de desfase**. |
| Pista estrecha | `600 px` de ancho visible frente a `1000 px` de contenido; solo cabían ~1,8 tarjetas. |
| Tarjetas grandes | `320 px` de ancho y `456 px` de alto. |
| Barra de scroll visible | `scrollbar-width: thin`. |
| Exceso de aire vertical | Separación descripción→tarjeta de `44 px` y sección con `py-20 lg:py-24`. |
| Controles siempre presentes | Flechas y marcadores visibles incluso cuando podían no ser necesarios. |
| Acción inferior inconsistente | En ElectroTero y Fiore había enlace/botón de texto **más** un badge circular duplicado. |

En 390 px las flechas se apilaban debajo de la descripción y dejaban unos **~108 px** de vacío antes de la pista.

## 2. Skills verificadas

Se comprobó la disponibilidad real antes de usarlas:

- `frontend-design`: **no disponible**.
- `emil-design-eng`: **no disponible**.
- `animate`: **no disponible**.
- `review-animations`: **no disponible**.

Se usaron las alternativas reales del entorno: `frontend-design-direction`, `motion-foundations` y `modern-web-guidance`. No se instaló ninguna skill ni dependencia.

## 3. Causas técnicas

1. **Desalineación horizontal:** el encabezado vivía en `mx-auto max-w-6xl`, pero la fila usaba `mt-9 flex justify-center` y dentro un contenedor `w-full max-w-[600px]`; la pista quedaba centrada como una isla, independiente del eje del título.
2. **Pocas tarjetas visibles:** el tope `max-w-[600px]` con tarjetas de `320 px` y `gap-5` impedía mostrar tres tarjetas completas en escritorio.
3. **Barra visible:** la pista tenía `[scrollbar-color:...] [scrollbar-width:thin]` en lugar de ocultar solo el indicador visual.
4. **Controles rígidos:** flechas y marcadores se renderizaban siempre, sin medir si `scrollWidth - clientWidth > 1`.
5. **Altura:** imagen 16:10, `p-5`, `gap-3`, título `text-lg`, sombra de elevación `22px/50px` y paddings de sección grandes.
6. **Hover incompleto:** Tailwind v4 usa la propiedad CSS `translate` para `-translate-y-*`, pero la transición declarada solo incluía `transform`, por lo que la elevación no se animaba.
7. **Acción duplicada:** el pie de tarjeta combinaba la acción principal con un segundo círculo decorativo con flecha.

## 4. Correcciones aplicadas

- La pista ocupa ahora todo el ancho del panel (`w-full`) y comparte el borde izquierdo del encabezado; se eliminó `justify-center` y `max-w-[600px]`.
- Separación vertical reducida: sección `px-6 py-14 lg:py-16`, cabecera `mt-2`, pista `mt-6`, marcadores `mt-3`, panel `p-5 md:p-8`.
- Tarjetas compactas y consistentes: `w-[260px] sm:w-[280px] lg:w-[clamp(280px,21vw,300px)]`, imagen `aspect-[16/10]`, contenido `gap-2.5 p-4`, título `text-base`, pie `pt-3`.
- Barra oculta visualmente con `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`, conservando `overflow-x-auto`, snap, rueda, trackpad y táctil. **No se usó `overflow: hidden`**.
- Se añadió `canScroll` con `ResizeObserver` + `resize`; flechas y marcadores solo aparecen cuando la fila desborda.
- Flechas movidas al flujo de la cabecera (`flex items-start justify-between`) para que no se solapen con el título en móvil; siguen siendo botones con `aria-label`.
- Se unificó el pie: una sola acción principal por tarjeta. Se eliminó el badge circular adicional; la flecha pequeña permanece solo dentro de la acción real.
- Estado activo con borde `primary/30`; hover lleva el borde activo a `primary/50`, incrementa la sombra de `0 10px 30px / .2` a `0 16px 38px / .32` y aplica `translate: 0 -2px` solo con `motion-safe`. La transición incluye `translate, box-shadow, border-color`.
- Se ajustó `nearestIndex()` para comparar contra la posición de snap real de cada tarjeta, no contra su centro geométrico; así el marcador correcto permanece en `0` cuando todas caben.
- Se conservaron íntegramente `activeRef`, `updateActive`, `goTo()`, `scrollend`/debounce, `pendingRef`, `announcement`, `smoothFallbackRef`, `prefersReducedMotion()`, el detalle de ElectroTero y el ancla `#proyectos`.

## 5. Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/components/ui/projects-carousel.tsx` | `canScroll`, `nearestIndex()` por posición de snap, cabecera/pista/controles, paddings, ocultado de scrollbar y pase de `active` a cada tarjeta. |
| `src/components/ui/project-card.tsx` | Prop `active`, anchos 260/280/clamp 280–300, contenido más compacto, pie unificado, hover/foco/selección refinados. |
| `docs/M4_1_Carrusel_1440.jpg` | **Nueva.** Captura final 1440×900. |
| `docs/M4_1_Carrusel_768.jpg` | **Nueva.** Captura final 768×1024. |
| `docs/M4_1_Carrusel_390.jpg` | **Nueva.** Captura final 390×844. |
| `M4_1_Carrusel_Pulido_INFORME.md` | **Nuevo.** Este informe. |

**No modificados:** `src/data/projects.ts`, `src/app/page.tsx`, `src/app/globals.css`, `package.json`, `src/components/ui/project-showcase.tsx`, `src/components/ui/project-browser-preview.tsx`, `src/app/proyectos/fiore/demo/**`, `src/components/fiore-demo/**`, `public/images/**`, `M4_Carrusel_INFORME.md` ni las capturas M4.

## 6. Alineación y dimensiones

| Ancho | Antes | Después | Resultado |
| --- | --- | --- | --- |
| 1440×900 | Título `x=181`, tarjeta `x=416`, ancho 320, alto 456, pista 600/1000, scrollbar `thin` | Título y tarjeta `x=173`, tarjeta **300×418**, pista **1118/1118**, scrollbar `none` | Desfase **0 px**; **3/3 tarjetas completas**; sin flechas ni marcadores; sin overflow de documento. |
| 768×1024 | Título `x=65`, tarjeta `x=80`, ancho 300, pista 600/940, scrollbar `thin` | Título y tarjeta `x=57`, tarjeta **280×406**, pista **678/904**, scrollbar `none` | Desfase **0 px**; 2 tarjetas completas; flechas y 3 marcadores. |
| 390×844 | Tarjeta 280, pista 285/880, flechas apiladas debajo de la descripción | Título y tarjeta `x=45`, tarjeta **260×408**, pista **313/832**, flechas en cabecera | Desfase **0 px**; 1 tarjeta completa; sin solapamiento (`heading.right=240`, `arrow.left=252`); sin overflow. |

Comprobación adicional a 1024×768: tarjeta **280 px**, pista 934/934, `docOverflow=0` (se corrigió el salto a 260 px que producía el `clamp` anterior).

La separación descripción→tarjeta pasó de **44 px a 32 px** en los tres anchos medidos. La altura total de la región del carrusel en escritorio pasó de **526 px a 434 px**. El panel conserva borde suave, fondo translúcido y `backdrop-blur-2xl`; no se alteraron tipografía, acentos ni identidad editorial.

## 7. Navegación e interacciones

| Interacción | Evidencia final |
| --- | --- |
| Flechas 768 px | `scrollLeft` `0 → 97 → 226`; marcador y `role="status"` sincronizados: «Proyecto 2 de 3: Fiore» y «Proyecto 3 de 3: Taquilla de Cine». Al llegar al final, `next` queda deshabilitado. |
| Teclado | Sobre la pista con `tabIndex=0`: `Home` → `scrollLeft 0` / proyecto 1; `End` → `scrollLeft 226` / proyecto 3; `ArrowLeft` → proyecto 2. |
| Rueda / trackpad 390 px | `deltaX:180` → `scrollLeft 250`, proyecto 2 activo. |
| Marcadores 390 px | `Ir al proyecto 3` → `scrollLeft 519`, proyecto 3 activo. |
| Scroll oculto | `getComputedStyle(track).scrollbarWidth === "none"`; `::-webkit-scrollbar` oculto; `overflow-x-auto` y `snap-x snap-mandatory` intactos. |
| Una sola tarjeta | Al ocultar dos tarjetas por DOM: 1 visible, `overflow=0`, **0 flechas y 0 marcadores**. |
| Más proyectos | Al simular 6 tarjetas por DOM: `overflow=1347`, **2 flechas visibles**. Los marcadores se generan con `portfolioProjects.map`, por lo que escalarían con datos reales (ver limitación). |
| Hover | Borde activo `primary/30 → primary/50`; sombra `0 10px 30px /.2 → 0 16px 38px /.32`; `translate: none → 0px -2px`; transición `translate, box-shadow, border-color`. |
| Reduced motion | Bajo emulación `reduce`: `matches=true`, `translate=none`, duración de transición `~0 s`. |
| Foco global | Pista, flechas, marcadores y acciones conservan el foco visible global; el control deshabilitado no retiene el foco. |
| Consola | Sin errores ni excepciones en las tres resoluciones ni al abrir el detalle o navegar a Fiore. |

No se añadieron pruebas unitarias nuevas: los 72 tests existentes cubren la demo Fiore y no el carrusel. La verificación del carrusel se hizo con navegador real vía `browse`, no con Playwright.

## 8. Integraciones preservadas

- **ElectroTero:** «Ver presentación» abre `#electrotero-detalle` (`hidden=false`), el foco entra en la región, el mini navegador sigue presente y el enlace real sigue siendo `https://electrotero.com/`. «Cerrar presentación» deja `hidden=true` y devuelve el foco al botón disparador «Ver presentación» tras un frame.
- **Fiore:** la tarjeta enlaza a `/proyectos/fiore/demo`; verificado `location.pathname`, título «Fiore · Demo interactiva | Portafolio Yeyder» y clave `yeyder.fiore.demo.v1`. No se tocó `DEMO_STATE_VERSION`, la semilla ni la persistencia.
- **Taquilla de Cine:** sigue como `pending`, con placeholder «Captura pendiente», texto `sr-only` y sin enlace ficticio.
- **Ancla `#proyectos`:** conservada en la sección. Mini navegador, portada y resto de la página sin cambios.

## 9. Capturas antes / después

| Archivo | Antes (M4) | Después (M4.1) |
| --- | --- | --- |
| `docs/M4_Carrusel_1440.jpg` → `docs/M4_1_Carrusel_1440.jpg` | Tarjeta 320, pista centrada de 600, desfase 235, barra visible | Tarjeta 300, pista completa de 1118, desfase 0, 3 tarjetas, sin barra |
| `docs/M4_Carrusel_768.jpg` → `docs/M4_1_Carrusel_768.jpg` | Tarjeta 300, desfase 15, pista 600/940 | Tarjeta 280, desfase 0, pista 678/904, flechas y marcadores |
| `docs/M4_Carrusel_390.jpg` → `docs/M4_1_Carrusel_390.jpg` | Tarjeta 280, flechas apiladas, pista 285/880 | Tarjeta 260, flechas en cabecera, pista 313/832 |

Las capturas nuevas se generaron desde el build final con `colorScheme: dark` y la sección `#proyectos` en vista. Se guardaron primero en el directorio permitido por el navegador y después se copiaron a `docs/`.

## 10. Resultados exactos de pruebas

| Comando | Resultado |
| --- | --- |
| `npm run test:b0` | **72 tests, 72 pass, 0 fail, 0 skipped**; exit 0. |
| `npm run test:b5` | **72 tests, 72 pass, 0 fail, 0 skipped** (ejecuta `test:b0`); exit 0. |
| `npx tsc --noEmit` | exit 0. |
| `npm run lint` | exit 0. |
| `npm run build` | exit 0. Compilación correcta; rutas estáticas `/`, `/_not-found`, `/proyectos/fiore/demo`. |

Advertencia no bloqueante ya presente en M4/B6: Next.js ignora `package-lock.json` por estar fuera del repositorio Git.

## 11. Limitaciones

1. **Revisión estética humana:** este agente no puede inspeccionar los píxeles de las capturas. Se verificaron medidas, DOM, estado y consola; la aprobación visual final queda al revisor humano.
2. **Gestos táctiles físicos:** la pista usa scroll nativo (`touch-manipulation`, sin handlers propios). La verificación usó emulación táctil y scroll horizontal del navegador; la herramienta `drag` simula ratón, no touch real.
3. **Marcadores con datos reales:** la simulación añadió tarjetas por DOM para probar desbordamiento y flechas; los marcadores siguen siendo 3 porque React no recalculó `portfolioProjects`. En código, ambos usan el mismo `.map`, pero no se modificó el archivo de datos para una prueba destructiva.
4. **Sombra hover:** el contenedor mantiene `py-2` para no recuperar altura; `overflow-x-auto` puede recortar parte de la sombra inferior. Se priorizó el espacio vertical compacto.
5. **Scroll suave en automatización:** permanece el fallback de M4 porque el navegador automatizado no anima `scrollTo({behavior:"smooth"})`. Conviene una pasada manual para confirmar la sensación.
6. **Informe M4 histórico:** `M4_Carrusel_INFORME.md` documenta las medidas originales (320/300 px) y no se reescribió; este informe registra las nuevas.
7. **Sin Playwright, commits, push ni deploy.**

**Resultado final: M4.1 COMPLETADO CON OBSERVACIONES.** Se detiene aquí.
