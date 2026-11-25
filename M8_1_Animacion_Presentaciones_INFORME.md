# M8.1 — Animación de apertura y cierre de presentaciones ampliadas

## 1. Objetivo y alcance

Corregir únicamente la animación de apertura y cierre de las presentaciones ampliadas de **ElectroTero**, **Fiore** y **Taquilla de Cine**, reutilizando Motion for React (`motion` ^14.14.0) ya instalado.

No se rediseñaron las presentaciones ni se tocaron datos, textos, tamaños, colores, tipografías, demos, carrusel, transiciones de ruta ni el proyecto original académico. No se instalaron dependencias.

## 2. Estado inicial y causa raíz

La medición inicial en navegador confirmó dos fallos:

- El botón interior `Ver detalles del proyecto` usaba `hidden={!detailsOpen}`. Eso montaba y desmontaba el detalle de forma instantánea: **0 animaciones** y altura saltaba de `0` a su valor final sin transición.
- El panel exterior animaba solo opacidad en `250 ms`; `height: "auto"` quedaba en `0 px` en reaperturas y el foco se entregaba dos veces (temporizador + `onAnimationComplete`).

Además, `html` conserva `scroll-behavior: smooth` y las revelaciones internas de `ProjectShowcase` siguen siendo de `500 ms`; se dejaron intactas porque no forman parte del cierre/apertura del panel.

## 3. Cambios implementados

| Archivo | Cambio |
| --- | --- |
| `src/lib/project-presentation-motion.ts` | Constantes puras compartidas por el panel exterior y el detalle interior. |
| `src/components/ui/project-showcase.tsx` | El detalle ya no usa `hidden`; permanece montado, mide su altura con `ResizeObserver` y anima `height`, `margin-top`, `opacity` y `transform` con CSS. |
| `src/components/ui/projects-carousel.tsx` | Nuevo `PresentationPanel`: Motion controla opacidad, desplazamiento y orden de salida; altura y separación se animan con valores medidos mediante `useMotionValue` + `animate`. |
| `tests/project-presentation-motion.test.ts` | 8 regresiones M8.1 nuevas (219 → 227 pruebas). |

Puntos clave:

- `AnimatePresence mode="wait"`: la saliente termina antes de montar la siguiente; nunca dos paneles simultáneos.
- `useIsPresent()` marca el panel saliente con `aria-hidden` e `inert`, por lo que sus controles dejan de ser alcanzables por Tab mientras se desvanece.
- El detalle cerrado queda con `aria-hidden="true"` e `inert`, sin `hidden`, y vuelve a abrirse con altura medida.
- El foco se entrega al panel entrante cuando termina su animación y se devuelve al botón de origen una sola vez al cerrar.

## 4. Parámetros de animación

```ts
duration: 0.4
reducedDuration: 0
ease: "easeOut"      // Motion
cssEase: "ease-out"  // CSS
enterY: 16
detailsEnterY: 14
exitY: -8
detailsExitY: 6      // documentado; el cierre vuelve a 14 px de entrada
collapsedHeight: 0
expandedHeight: "auto"
detailsGap: 24
panelGap: 32
mode: "wait"
```

La altura nunca es una cifra fija arbitraria: se mide del contenido real y se actualiza ante cambios de ancho o de carga de multimedia. `easeOut` es el nombre aceptado por Motion y `ease-out` el valor CSS válido; mantener ambos evitó que el detalle cayera al valor por defecto `ease`.

## 5. Regresiones automáticas y códigos exactos

| Comando | Resultado | Código |
| --- | --- | --- |
| `npm run test:b0` | `ℹ tests 227` / `ℹ pass 227` / `ℹ fail 0` | `EXIT_TEST_B0:0` |
| `npm run test:b5` | `ℹ tests 227` / `ℹ pass 227` / `ℹ fail 0` | `EXIT_TEST_B5:0` |
| `npx tsc --noEmit` | sin errores | `EXIT_TSC:0` |
| `npm run lint` | sin errores | `EXIT_LINT:0` |
| `npm run build` | build de producción correcto | `EXIT_BUILD:0` |

El build generó las rutas `/`, `/_not-found`, `/proyectos/fiore/demo` y `/proyectos/taquilla-cine/demo`. Emitió una advertencia no bloqueante: Next.js ignora `package-lock.json` porque está fuera del repositorio Git actual.

## 6. Apertura y cierre medidos en navegador

Panel exterior (build de producción, `1440×900`, `prefers-reduced-motion: no-preference`):

| Tiempo | Altura | Opacidad | Desplazamiento |
| --- | --- | --- | --- |
| 40 ms | 133,5 px | 0,20 | +12,8 px |
| 120 ms | 433,1 px | 0,49 | +8,2 px |
| 220 ms | 679,2 px | 0,81 | +3,1 px |
| 350 ms | 996,4 px | 1,00 | 0 px |
| 450 ms | 1.545,6 px | 1,00 | 0 px |

Cierre del mismo panel:

| Tiempo | Altura | Opacidad | Desplazamiento |
| --- | --- | --- | --- |
| 40 ms | 1.335,8 px | 0,86 | −1,1 px |
| 120 ms | 1.049,1 px | 0,68 | −2,6 px |
| 220 ms | 354,7 px | 0,23 | −6,2 px |
| 350 ms | 18,3 px | 0,01 | −7,9 px |
| 450 ms | 0 px | 0 | −8 px |

Las animaciones WAAPI capturadas usan `duration: 400` y `easing: "ease-out"`, sin rebote, escalado ni 3D. No queda contenido residual: a los 450 ms el panel tiene altura y opacidad cero, y el nodo se desmonta después de la salida.

Detalle interior, medición final del build definitivo:

| Tiempo | Altura | Opacidad | `transition-timing-function` |
| --- | --- | --- | --- |
| 40 ms | 0 px | 0 | `ease-out` |
| 120 ms | 54,3 px | 0,26 | `ease-out` |
| 220 ms | 123,2 px | 0,59 | `ease-out` |
| 350 ms | 189,1 px | 0,91 | `ease-out` |
| 450 ms | 208,6 px | 1 | `ease-out` |

## 7. Cambio de proyecto y pulsaciones rápidas

Se monitorizó el número de regiones y su `aria-label` cada 50 ms:

| Flujo | Paneles máximos | Etiquetas vistas | Estado final |
| --- | --- | --- | --- |
| ElectroTero → Fiore | 1 | ElectroTero, Fiore | Fiore, `h2` = Fiore, foco en el panel |
| Fiore → Taquilla de Cine | 1 | Fiore, Taquilla de Cine | Taquilla de Cine, `h2` = Taquilla de Cine |
| ElectroTero → Fiore → Taquilla con 60 ms entre pulsaciones | 1 | Taquilla de Cine | Taquilla de Cine, sin mezcla de datos |
| Cerrar y reabrir Fiore con 60 ms de separación | 1 | Taquilla de Cine, Fiore | Fiore, foco en el panel |

En todos los casos `aria-hidden="false"`, `inert=false` y opacidad final `1`. No se observaron superposiciones, parpadeos ni estados inconsistentes.

El botón interior también se probó con cinco pulsaciones separadas 70 ms: `aria-expanded` terminó en `true`, con altura `177,85 px`, opacidad `1` y `inert=false`.

## 8. Accesibilidad, teclado y movimiento reducido

- `Enter` sobre `Ver presentación de ElectroTero` entregó el foco a `Presentación detallada de ElectroTero` (`DIV`, `tabindex="-1"`).
- Un `Tab` posterior llevó al botón `Cerrar presentación`.
- `Enter` en `Cerrar presentación` devolvió el foco a `Ver presentación de ElectroTero` y dejó 0 regiones abiertas.
- El detalle cerrado queda `aria-hidden="true"` e `inert`; el panel saliente también se marca inerte desde `useIsPresent()`.
- Con `prefers-reduced-motion: reduce` aplicado **antes de cargar la página**, no se registraron animaciones WAAPI del panel; el estado final (`height`, `opacity`, `y`) apareció en el siguiente frame y el cierre devolvió el foco de inmediato. La transición CSS del detalle quedó en `0,00001 s` (equivalente a inmediata).

## 9. Responsive y consola

| Viewport | `scrollWidth` / `innerWidth` | Altura del panel | Botón de cierre | Resultado |
| --- | --- | --- | --- | --- |
| 1440×900 | 1432 / 1440 | 1548,56 px | 230×40 px | Sin desbordamiento horizontal |
| 768×1024 | 760 / 768 | 1309,8 px | 230×40 px | Sin desbordamiento horizontal |
| 390×844 | 382 / 390 | 1440,76 px | 230×40 px | Sin desbordamiento horizontal |

En 390 px, Fiore y Taquilla también abrieron con `scrollWidth` 382 y alturas 1483,76 px y 1357 px respectivamente. La diferencia entre `scrollWidth` y `innerWidth` corresponde a la barra de desplazamiento vertical, no a overflow. La consola del navegador terminó con **0 entradas**.

Limitación observada: durante una prueba de teclado, una secuencia de `Tab` no intencionada activó el enlace `mailto:` de contacto; la prueba se repitió enfocando explícitamente solo los botones de presentación y cierre, y esa es la evidencia reportada.

## 10. Evidencia visual

Capturas guardadas en `docs/`:

- `M8_1_ElectroTero_1440.png`
- `M8_1_Fiore_1440.png`
- `M8_1_Taquilla_1440.png`
- `M8_1_ElectroTero_768.png`
- `M8_1_ElectroTero_390.png`
- `M8_1_Detalles_1440.png`

## 11. Resultado y cierre

**Resultado: M8.1 CORREGIDO Y VERIFICADO.**

La apertura y el cierre de las tres presentaciones usan una transición de 400 ms, ease-out, desplazamiento sutil, altura medidas y salida ordenada. Se conservan 227/227 pruebas, el diseño y los datos. No se hicieron commits, pushes ni deploys: el repositorio sigue sin commits (`fatal: your current branch 'master' does not have any commits yet`) y todos los cambios quedan sin commitear.

El trabajo se detiene aquí, sin iniciar otros cambios.
