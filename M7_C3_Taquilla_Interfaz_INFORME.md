# M7 C3 — Taquilla de Cine: interfaz y navegación — Informe final

Fecha: 25/11/2026. Estado: **C3 COMPLETADO; sin observaciones bloqueantes**.

Esta fase implementó exclusivamente la ruta `/proyectos/taquilla-cine/demo`, el marco visual aislado, la navegación responsive por estado, la hidratación segura y el reinicio de la demo. Las cuatro secciones son **vistas provisionales**: no hay formularios, tablas operativas ni controles que simulen las funcionalidades de C4–C6. No se habilitó el CTA «Explorar demo», no se avanzó a C4 y se detuvo la ejecución al terminar C3.

---

## 1. Archivos creados y configuración

### Ruta

| Archivo | Contenido |
| --- | --- |
| `src/app/proyectos/taquilla-cine/demo/page.tsx` | Server Component sin `"use client"`; exporta `metadata` neutral y renderiza `<TaquillaDemo />`. No contiene Route Handlers ni Server Actions. |

### Componentes en `src/components/taquilla-cine-demo/`

| Archivo | Contenido |
| --- | --- |
| `TaquillaDemo.tsx` | Contenedor cliente: reducer puente sobre `applyDemoAction()`, hidratación tras montaje, escritura diferida, vistas por estado, drawer móvil y reinicio. |
| `TaquillaDemoFrame.tsx` | Marco exterior: título, badge, regreso a `/`, botón de reinicio, región `role="status"`, chrome decorativo y footer académico. |
| `TaquillaSidebar.tsx` | Menú lateral; en móvil pasa a drawer con overlay, `aria-expanded`, `aria-controls`, Escape, trap de foco, foco inicial y cierre explícito. |
| `TaquillaResetDialog.tsx` | Confirmación modal accesible con Cancelar/Reiniciar, foco inicial en la opción no destructiva, trap y restauración. |
| `TaquillaPlaceholderView.tsx` | Auxiliar pequeño y documentado: encabezado, descripción breve, presentación `aria-hidden` y «Funcionalidad en desarrollo». Sin botones ni entradas. |
| `TaquillaIcons.tsx` | Iconos SVG locales reutilizados por marco, menú, vistas y diálogo. Sin dependencias nuevas. |
| `taquilla-navigation.ts` | Configuración pura de los cuatro ítems, el order del original, el bloque C4–C6 correspondiente y `TAQUILLA_INITIAL_VIEW`. Importable desde el arnés CommonJS. |
| `taquilla-demo.module.css` | CSS Module aislado con variables `--taquilla-*`, estados de foco visibles y media queries de 900 px y 520 px. |

### Pruebas, documentación y capturas

| Archivo | Contenido |
| --- | --- |
| `tests/taquilla-demo-b3.test.ts` | 8 pruebas ligeras de contrato/estática; las interacciones se verificaron en navegador porque no hay React Testing Library instalada. |
| `docs/M7_C3_Taquilla_1440.jpg` | Captura de verificación a 1440 × 900. |
| `docs/M7_C3_Taquilla_768.jpg` | Captura de verificación a 768 × 1024. |
| `docs/M7_C3_Taquilla_390.jpg` | Captura de verificación a 390 × 844. |
| `M7_C3_Taquilla_Interfaz_INFORME.md` | Este informe con los 11 entregables solicitados. |

### Configuración ajustada

| Archivo | Cambio |
| --- | --- |
| `package.json` | Se añadió `.b0-tests/tests/taquilla-demo-b3.test.js` al final de `test:b0`; los scripts `test:b2`–`test:b5` delegan en él y las pruebas previas siguen activas. |
| `tsconfig.b0-tests.json` | Se incluyó `tests/taquilla-demo-b3.test.ts`; los `include` existentes ya cubrían C1 y C2. |

**No se modificaron** `src/app/globals.css`, `src/data/projects.ts`, el carrusel, las presentaciones, Fiore, ElectroTero ni los módulos de C1/C2.

---

## 2. Ruta, marco visual y paleta

- `/proyectos/taquilla-cine/demo` responde **HTTP 200** en el servidor de producción y aparece como ruta estática en `npm run build`.
- La página es un Server Component: no usa `"use client"`, no llama a `fetch`, no define `GET`/`POST` ni Server Actions. Todo el estado vive en el componente cliente importado.
- `metadata` es neutral y describe una demostración aislada con datos ficticios; no promete funcionalidad de C4–C6.
- El marco muestra la identidad «Taquilla de Cine», la etiqueta **«Demostración · Datos ficticios»**, el enlace «Volver al portafolio» hacia `/`, el botón «Reiniciar demo» y un footer académico. La etiqueta vive fuera del área cambiante, así que permanece en las cuatro vistas.
- Paleta obligatoria, declarada como `--taquilla-*` dentro de `.page`: sidebar `#1e293b`, fondo `#f8fafc`, superficie `#ffffff`, azul `#2563eb`, azul oscuro `#1d4ed8`, texto `#1e293b`/`#64748b`, borde `#e2e8f0` e informativo `#eff6ff`. Se añadieron solo `--taquilla-success` y `--taquilla-error` para mensajes de C3.
- `color-scheme: light` y `:focus-visible` con contorno azul de 2 px. No se usan utilidades Tailwind ni tokens oscuros del portafolio dentro de la demo.

---

## 3. Navegación por estado y vistas provisionales

- Estado React local: `peliculas`, `funciones`, `compras`, `taquilla`. Vista inicial: **`peliculas`**, definida en `TAQUILLA_INITIAL_VIEW`.
- El orden de los ítems y sus etiquetas reproduce el menú del sistema académico; cada ítem declara el bloque `C4`, `C5` o `C6` que lo resolverá.
- La navegación **no crea rutas internas**: al pulsar cualquier ítem cambia el encabezado y `aria-current="page"`, pero `location.pathname` sigue siendo `/proyectos/taquilla-cine/demo`.
- Cada vista muestra únicamente: etapa del bloque, título, descripción breve, tarjeta de presentación con decoración `aria-hidden` y el texto **«Funcionalidad en desarrollo»**.
- No hay `<button>`, `<input>`, `<select>`, `<textarea>` ni `onClick` dentro de las vistas provisionales: no se simulan búsquedas, filtros, tablas ni formularios.

---

## 4. Hidratación, conexión C1/C2 y reinicio

- El primer render del servidor y del cliente usa `createSeedState()`; no se lee `window` ni `localStorage` durante el render, por lo que no hay hydration mismatch.
- Tras montar, `loadTaquillaState()` resuelve la lectura; si es `ok` se aplica `HYDRATE` a través de `applyDemoAction()`. La única puerta de transición del estado sigue siendo el reducer puro de C2.
- `saveTaquillaState(state)` se ejecuta en un efecto posterior **solo cuando `ui.hydrationReady` es verdadero**. Si la lectura resolvió `empty` o `invalid`, la semilla también queda escrita con la compuerta propia ya abierta.
- Clave exclusiva: **`yeyder.taquilla-cine.demo.v1`**. Ningún componente C3 llama a `getItem`/`setItem`; esos accesos permanecen encapsulados en `storage.ts`. La clave de Fiore (`yeyder.fiore.demo.v1`) no se importa ni se toca.
- «Reiniciar demo» abre una confirmación; al confirmar se llama a `clearTaquillaState()` (que borra solo la clave de Taquilla), se despacha `RESET`, se vuelve a `peliculas`, se cierran menú y diálogo y se muestra: **«Demo reiniciada con los datos ficticios iniciales.»**
- Un estado persistido corrupto mostró **«Estado persistido inválido; se restauró la semilla»** y recuperó 6 películas, 9 funciones y 8 compras. Tras el reinicio, la clave de Fiore conservó su valor centinela `C3-SENTINEL-NO-BORRAR`.

---

## 5. Accesibilidad y drawer móvil

- Enlace «Saltar al contenido principal» hacia `#taquilla-contenido` (`main` con `tabIndex={-1}`).
- `nav` con `aria-label`, botones con `aria-current="page"` solo en el activo, botón «Abrir menú» con `aria-controls="taquilla-demo-nav"` y `aria-expanded` sincronizado.
- Hasta 900 px el sidebar se convierte en drawer: overlay clicable, `inert` en el contenido de fondo y en las acciones del marco, foco inicial en «Cerrar menú», trap de Tab y Escape para cerrar.
- El foco inicial se reintenta mientras siga fuera del panel y se detiene en cuanto entra cualquier control del drawer, para no robárselo al usuario. Los hijos del panel fuerzan `visibility: visible` mientras está abierto, evitando valores intermedios heredados durante la transición.
- Al cerrar por Escape, overlay o navegación, el foco vuelve a «Abrir menú»; el drawer queda `visibility: hidden` y desplazado fuera de la pantalla.
- No se detectó desbordamiento horizontal: `scrollWidth === innerWidth` a 1440, 768 y 390 px.

---

## 6. Diálogo de reinicio y confirmaciones

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` y `aria-describedby`; título «¿Reiniciar la demo?».
- El foco inicial recae en **Cancelar**, la opción no destructiva. Tab y Shift+Tab permanecen entre Cancelar y Reiniciar demo; Escape cancela y restaura el foco al disparador «Reiniciar demo».
- Clic en el fondo también cancela. La confirmación se anuncia en la región `role="status"` del marco.
- A 390 px las acciones se apilan en columna invertida y conservan el orden visual Cancelar/Reiniciar demo.

---

## 7. Aislamiento de Fiore, CTA y transiciones

- `taquillaProject` permanece con `kind: "pending"` y `status: "Demo pendiente"`; no tiene `href`, `actionLabel` ni enlace a la demo. **El CTA «Explorar demo» sigue sin habilitarse hasta C7.**
- `isRouteTransitionPath("/proyectos/taquilla-cine/demo")` continúa devolviendo `false` y sus pruebas no se modificaron: no se tocó el sistema global de transiciones.
- No se reutilizó storage ni estilos de Fiore; solo se tomó su patrón estructural como referencia. No se importaron componentes, hooks ni tipos de la demo de Fiore.
- No hay Route Handlers, Server Actions, APIs, base de datos, dependencias nuevas ni llamadas externas. No se ejecutó Angular, Spring Boot ni PostgreSQL.

---

## 8. Resultados exactos de verificación

| Comprobación | Resultado |
| --- | --- |
| `npm run test:b0` | **137/137 pruebas aprobadas**, `EXIT_CODE=0` (129 previas + 8 nuevas de C3). |
| `npm run test:b5` | **137/137 pruebas aprobadas**, `EXIT_CODE=0`. |
| `npx tsc --noEmit` | `EXIT_CODE=0`, sin errores de tipos. |
| `npm run lint` | `EXIT_CODE=0`, sin avisos. |
| `npm run build` | `EXIT_CODE=0`; rutas generadas: `/`, `/_not-found`, `/proyectos/fiore/demo` y `/proyectos/taquilla-cine/demo`. |
| `GET /proyectos/taquilla-cine/demo` | `STATUS=200` en `http://127.0.0.1:3100`. |
| Consola en producción | `consoleEntries: 0` en la comprobación final; `consoleErrors: []`. En dev aparecieron solo errores de HMR/WebSocket y del font local, ausentes en producción. |

Las cifras de la semilla de C1 siguen intactas: 6 películas, 9 funciones, 8 compras, 25 boletos y 51.650.475 centavos históricos; en `2026-11-25`–`2026-11-30`, 6 compras, 20 boletos y 40.475.250 centavos.

---

## 9. Verificación visual en navegador

La verificación se realizó en el servidor de producción con el tab visible del navegador; las capturas se guardaron primero en Temporal y después se copiaron a `docs/`.

| Viewport | Comprobaciones | Captura |
| --- | --- | --- |
| 1440 × 900 | Badge y marco visibles; menú de escritorio; vista inicial «Películas»; navegación por estado sin cambiar URL; diálogo con trap y Escape; hidratación inválida y reinicio correctos. | `docs/M7_C3_Taquilla_1440.jpg` |
| 768 × 1024 | Sidebar oculto y desplazado; overlay `opacity: 0`/`pointer-events: none`; menú móvil `aria-expanded="false"`; sin `inert` ni overflow en reposo. Al abrir: panel y overlay visibles, fondo `inert`, foco en «Cerrar menú», Tab/Shift+Tab contenidos, Escape con restauración; «Compras» cambia el encabezado sin cambiar URL. | `docs/M7_C3_Taquilla_768.jpg` |
| 390 × 844 | Mismo ciclo de drawer, trap y Escape; diálogo de reinicio con botones apilados y foco en Cancelar; `scrollWidth === innerWidth`. | `docs/M7_C3_Taquilla_390.jpg` |

No se declara verificación visual sin navegador: las tres capturas se tomaron con `browse.screenshot` sobre la página servida en producción. Las transiciones CSS se inspeccionaron mediante estados computados (`visibility`, `transform`, `opacity` y `pointer-events`), no solo por captura estática.

---

## 10. Problemas detectados y correcciones

1. **`TS2304` / `react/jsx-no-undef`.** `TaquillaDemo.tsx` usaba `TaquillaIcon` sin importarlo. Se añadió el import; `tsc`, lint y build volvieron a `EXIT_CODE=0`.
2. **Foco del drawer no contenido al abrir.** El intento inicial con `requestAnimationFrame` se descartaba mientras el panel todavía aplicaba `visibility`. Se sustituyó por reintentos temporizados que paran en cuanto el foco entra al panel.
3. **Valor intermedio de `visibility` en los hijos del drawer.** El botón de cierre podía quedar heredando `hidden` durante la transición. Se eliminó la transición de `visibility` de `.sidebarOpen` y se forzó `visibility: visible` en `sidebarHeader`, `nav` y `sidebarFooter` mientras el panel está abierto.
4. **Transiciones aparentemente detenidas en automatización.** Las lecturas inmediatas mostraban `transform` y `opacity` iniciales; con esperas largas se confirmó el estado final (`matrix(1,0,0,1,0,0)` y `opacity: 1`). No era un defecto de C3 sino una consecuencia del renderizado diferido del tab automatizado.
5. **Fallos de clic en dev.** El servidor de desarrollo presentó errores HMR/WebSocket y `403` del font local que interferían con los clics; la verificación se trasladó al servidor de producción, donde la consola quedó limpia.

Ninguna corrección tocó C1, C2, Fiore ni las pruebas previas.

---

## 11. Aislamiento del original y estado final

- Proyecto académico original `C:\Users\pc\Downloads\proyectos_No Tocar\Tarea_PBC_Parcial`: **23.915 archivos** contados en C3. El manifiesto de metadatos —ruta, tamaño y `mtime`, incluyendo archivos ocultos— registrado en C1/C2 tiene SHA-256 `579AA88FFAA162F4BA7F9444CB04A066D5FBEFF7652FC3C81EAAE621545629BA`. No se escribió ni borró ningún archivo del original.
- No se modificaron la portada, el carrusel, las presentaciones, `src/data/projects.ts`, los enlaces de Fiore/ElectroTero, las transiciones existentes ni `src/app/globals.css`.
- No se instalaron dependencias ni se ejecutaron Angular, Spring Boot o PostgreSQL. No se hicieron **commits, push ni despliegue**; los cambios quedan como archivos locales sin versionar.
- `taquillaProject` continúa con `kind: "pending"` y sin CTA de demo, en cumplimiento de la regla de no habilitar el acceso hasta C7.
- **C3 queda cerrado aquí.** La ejecución se detiene sin avanzar a C4 ni a ninguna fase posterior de interfaz.
