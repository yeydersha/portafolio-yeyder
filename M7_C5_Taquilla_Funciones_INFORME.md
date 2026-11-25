# M7 C5 — Taquilla de Cine: módulo de Funciones y cupos — Informe final

Fecha: 25/11/2026. Estado: **C5 COMPLETADO; sin observaciones bloqueantes**.

Esta fase sustituyó únicamente la vista provisional de **Funciones** por el CRUD interactivo reproducido del módulo académico original. Películas conserva lo terminado en C4; Compras y Taquilla siguen siendo vistas provisionales. **No se avanzó a C6 ni C7.**

---

## 1. Objetivo y alcance

- **Único cambio funcional:** la rama `activeView === "funciones"` de `TaquillaDemo.tsx` renderiza `<TaquillaFuncionesView />`. Las ramas restantes no se reconstruyeron.
- Se implementaron: listado de 9 columnas, búsqueda local, alta, edición, ficha `<dl>`, avisos `(POCOS)`/`(AGOTADA)` y confirmación inline roja de borrado.
- El estado compartido sigue siendo el único reducer de C2. La vista nunca importa `localStorage` ni escribe almacenamiento directamente.
- La semilla de C1 continúa intacta: **6 películas, 9 funciones, 8 compras, 25 boletos y 51.650.475 centavos históricos**.
- `taquillaProject` conserva `kind: "pending"`, `status: "Demo pendiente"` y ausencia de `href`/`actionLabel`. `isRouteTransitionPath("/proyectos/taquilla-cine/demo")` sigue devolviendo `false`.
- No se crearon app, backend, base de datos, ruta, dependencia, servicio externo, pago, devolución ni autenticación. El servidor de producción `next start -p 3100` fue temporal y solo sirvió para verificar.

---

## 2. Archivos creados, modificados y configuración

| Archivo | Estado | Contenido |
| --- | --- | --- |
| `src/components/taquilla-cine-demo/TaquillaFuncionesView.tsx` | Creado | Vista CRUD: derivación del listado, búsqueda, formulario, ficha, indicadores y borrado inline. |
| `src/components/taquilla-cine-demo/TaquillaFuncionDialog.tsx` | Creado | Formulario de seis campos, bloque informativo de cupos en edición y validación de C2. |
| `src/components/taquilla-cine-demo/TaquillaDemo.tsx` | Modificado | Integración de la vista sobre `commitAction`; se conserva el listener de Escape en fase capture de C4. |
| `src/components/taquilla-cine-demo/taquilla-demo.module.css` | Modificado | Clases C5 para panel, formulario, tabla de 9 columnas, indicadores, tarjetas móviles y `prefers-reduced-motion`. |
| `tests/taquilla-demo-b5.test.ts` | Creado | **24 casos** nuevos de C5. |
| `tsconfig.b0-tests.json` | Modificado | Incluye `tests/taquilla-demo-b5.test.ts`. |
| `package.json` | Modificado | `test:b0` incluye `.b0-tests/tests/taquilla-demo-b5.test.js`; `test:b5` delega en `test:b0`. |
| `docs/M7_C5_Funciones_1440.jpg`, `docs/M7_C5_Funciones_768.jpg`, `docs/M7_C5_Funciones_390.jpg` | Creados | Capturas finales del build de producción en los tres viewports. |
| `M7_C5_Taquilla_Funciones_INFORME.md` | Creado | Este informe con 12 apartados. |

**No se modificaron** Fiore, ElectroTero, portada, carrusel, presentaciones, `TaquillaPlaceholderView.tsx`, `TaquillaSidebar.tsx`, `TaquillaResetDialog.tsx`, `TaquillaDemoFrame.tsx`, `src/app/globals.css`, `route-transition.ts` ni el proyecto académico original.

---

## 3. Reutilización del reducer y flujo de mutación

- `commitAction(action)` calcula `applyDemoAction()` y **solo despacha cuando `!resultado.error`**, igual que C4. La vista recibe `{ state, changed, error? }` y decide el feedback.
- El formulario valida con `validateFuncionInput()` y `firstIssueMessage()` de C2 antes de devolver la acción. No existe una segunda validación ni estado paralelo.
- `parseFuncionForm()` construye exactamente las seis claves aceptadas: `peliculaId`, `fecha`, `hora`, `sala`, `precioPesos` y `cuposTotales`. **`cuposDisponibles` nunca se envía.**
- El alta deriva el ID del propio estado: primer registro **`demo-fun-010`**. No hay `Date.now()`, `Math.random()` ni `crypto.randomUUID()`.
- Todas las mutaciones pasan por las acciones `CREAR_FUNCION`, `EDITAR_FUNCION` y `ELIMINAR_FUNCION` del reducer único.
- Persistencia exclusiva en `yeyder.taquilla-cine.demo.v1`, encapsulada en `storage.ts`. La clave `yeyder.fiore.demo.v1` no se lee ni se escribe.

---

## 4. Listado derivado, orden y búsqueda

- `buildFuncionesView(state, { query })` deriva filas y contador; el badge muestra **9 funciones** en la semilla y **10 funciones** tras un alta.
- Orden estable por fecha, hora e ID. La tabla de escritorio muestra exactamente 9 columnas: ID, Película, Fecha, Hora, Sala, Precio, Cupos tot., Cupos disp. y Acciones.
- La búsqueda local cubre película, sala, fecha u hora, sin distinción de tildes; usa `type="search"` y `aria-describedby="taquilla-buscar-funciones-ayuda"`.
- Las 9 filas semilla son `demo-fun-001` a `demo-fun-007`, `demo-fun-009` y `demo-fun-008`, en ese orden cronológico; no se añadieron fechas futuras inventadas ni solapes.
- Los precios se muestran con `formatCOP`: p. ej. `demo-fun-001` → `$ 18.000,00`.

---

## 5. Formulario, validación y alta

- Select de **películas existentes**; fecha real `YYYY-MM-DD`, hora `HH:mm` de 24 horas, sala textual de máximo 50 caracteres, precio `> 0` con máximo dos decimales y límite `9999999999.99`, y cupos enteros `1..2147483647`. El formulario usa `noValidate` para mostrar los mensajes de C2.
- El foco inicial recae en el selector de película; los errores por campo se enlazan con `aria-describedby`, `aria-invalid` y `role="alert"`.
- Mensajes exactos cubiertos por pruebas: `El campo es obligatorio`, `El campo no puede superar 50 caracteres`, `El valor debe ser un entero seguro`, `El valor debe estar entre 1 y 2147483647`, `La fecha debe tener el formato YYYY-MM-DD`, `La fecha no existe en el calendario`, `La hora debe tener el formato HH:mm`, `El precio debe ser mayor a cero, tener máximo dos decimales y no superar 9999999999.99`.
- Alta válida verificada en navegador en los tres viewports: `demo-fun-010`, «Misterio en la Sala Cuatro» / «Cuentos del Bosque Demo», cupos iniciales iguales a totales y aviso de programación.
- La nota del alta indica que los cupos disponibles se inicializan con los totales; el campo calculado nunca es editable.

---

## 6. Edición y reglas de capacidad

- «Editar …» abre el mismo formulario con los valores actuales y el badge `ID …`. En edición se muestra el bloque «CUPOS TOTALES ACTUALES / CUPOS DISPONIBLES / BOLETOS VENDIDOS» y el precio actual.
- Al Guardar, el reducer recalcula `cuposDisponibles = nuevosCuposTotales - boletosVendidos`. Los importes históricos y el total de 51.650.475 centavos no se recalculan.
- Verificado: alta 20/20 → edición 18/18; `demo-fun-003` con compras → capacidad `10` y disponibles `9`; `demo-fun-002` agotada → capacidad `4` y disponibles `1 (POCOS)`.
- Reducción por debajo de vendidos rechazada con el mensaje exacto: **`La nueva capacidad total (1) no puede ser inferior a los cupos ya vendidos (2)`**. La fila y el estado quedan intactos.
- Cambio de película permitido solo sin compras. Con compras se rechaza con **`No se puede cambiar la película de una función que tiene compras registradas`**, sin mutar la función.

---

## 7. Indicadores, ficha y borrado

- `estadoCupos` de `funciones-view.ts` produce: sin sufijo cuando hay más de cinco, **`(POCOS)`** entre 1 y 5, y **`(AGOTADA)`** cuando es 0. En la semilla, `demo-fun-002` está agotada y `demo-fun-005`/`demo-fun-006` muestran `(POCOS)`.
- «Consultar …» abre una ficha `<dl>` con ID, Película, Fecha, Hora, Sala, Precio, Cupos totales, Cupos disponibles y Boletos vendidos. El foco inicial está en «Cerrar» y vuelve al botón «Consultar …» al cerrar.
- «Eliminar …» sustituye las acciones de la fila por el bloque rojo «¿Eliminar …?», «Sí, eliminar» y «Cancelar». El foco inicial está en Cancelar; al eliminar se enfoca «Nueva función» y al cancelar vuelve al botón Eliminar de esa fila (`data-funcion-id`).
- Borrado permitido verificado: la función creada `demo-fun-010` desaparece y el aviso es **`Función demo-fun-010 eliminada de la programación.`**
- Borrado bloqueado verificado: al intentar eliminar una función con compras, la fila permanece y aparece **`No se puede eliminar la función porque tiene compras asociadas`** con `role="alert"`. No hay cascada ni borrado del historial.

---

## 8. Accesibilidad, teclado y foco

- Etiquetas `<label for>` en los seis campos y en la búsqueda; ayudas y errores enlazados por `aria-describedby`; `aria-invalid` cuando corresponde.
- Feedback con `role="status"` o `role="alert"` según éxito/error; tabla dentro de `role="region"` con `aria-label`, `tabIndex={0}`, `<caption>` y `scope="col"`.
- Botones con nombres explícitos `Consultar/Editar/Eliminar <película> <fecha> <hora>`; el bloque de cupos en edición tiene `aria-label="Información de cupos"`.
- Escape cancela formularios y confirmaciones y cierra la ficha, devolviendo el foco al control originario. La ficha usa un listener propio con `stopPropagation()`.
- Se conserva la corrección capture-phase de C4 en `TaquillaDemo.tsx`: `document.addEventListener("keydown", handleKeyDown, { capture: true })` con `event.stopImmediatePropagation()`; no hay listener redundante.
- Verificación real en 390 × 844 con menú y ficha abiertos: **primer Escape cerró el menú** (foco en «Abrir menú») y **segundo Escape cerró la ficha** (foco en «Consultar Viaje a la Luna Demo 2026-11-25 10:30»). El foco nunca cayó en `<body>`.
- `:focus-visible` mantiene el contorno azul del marco C3 y `prefers-reduced-motion: reduce` elimina animaciones.

---

## 9. Reproducción visual y CSS Module

- Encabezado «Bloque C5 · Programación», título «Funciones» y panel «Programación de funciones», con la misma paleta y jerarquía de C3/C4.
- La tabla y las fichas `<dl>` reproducen el original académico adaptado; la confirmación de borrado es inline y roja, sin modal nuevo.
- Los estilos C5 viven en `taquilla-demo.module.css`; no se añadieron librerías de UI, iconos externos ni estilos globales.
- Breakpoints existentes de 720 px y 700 px: en móvil, `table`/`tbody`/`tr`/`td` pasan a `display: block`, `thead` se oculta y cada celda muestra su etiqueta mediante `.cellLabel`. No hay desplazamiento horizontal.

---

## 10. Aislamiento de C6, Fiore y portada

- No se implementaron Compras, Taquilla, reportes visuales, exportaciones, pagos, devoluciones ni autenticación. Compras y Taquilla siguen con la vista provisional.
- El CTA «Explorar demo» de Taquilla continúa pendiente; solo Fiore mantiene su CTA y no se tocó su storage ni sus componentes.
- No hay `fetch`, `localStorage.`, `Date.now(`, `Math.random(` ni `crypto.randomUUID(` en los archivos C5.
- La ruta `/proyectos/taquilla-cine/demo` es la única de la demo y ya existía desde C3. El build sigue emitiendo cuatro rutas estáticas: `/`, `/_not-found`, `/proyectos/fiore/demo` y `/proyectos/taquilla-cine/demo`.
- La comprobación de la suite C5 incluye el centinela `yeyder.fiore.demo.v1` → `C5-SENTINEL-NO-BORRAR` intacto tras limpiar el estado de Taquilla.

---

## 11. Resultados exactos de verificación

| Comprobación | Resultado |
| --- | --- |
| `npm run test:b0` | **179/179 pruebas aprobadas**, 0 fallos, `EXIT_CODE=0` (155 previas + 24 nuevas de C5). |
| `npm run test:b5` | **179/179 pruebas aprobadas**, 0 fallos, `EXIT_CODE=0`. |
| `npx tsc --noEmit` | Sin errores, `EXIT_CODE=0`. |
| `npm run lint` | Sin errores, `EXIT_CODE=0`. |
| `npm run build` | Compilación y generación estática correctas, `EXIT_CODE=0`. |
| `GET /proyectos/taquilla-cine/demo` | **`STATUS=200`** en `http://localhost:3100`, servidor de producción. |
| Consola de producción | **0 entradas; 0 errores; sin errores de hidratación** en los tres viewports finales. |
| Warning no bloqueante del build | Next.js ignora `package-lock.json` por estar fuera del repositorio Git; no afecta al resultado. |

Los 24 casos de `tests/taquilla-demo-b5.test.ts` cubren integración, orden, precios, alta, ID determinista, inicialización de cupos, edición, conservación de vendidos, recálculo, rechazo coherente, cambio de película permitido/bloqueado, borrado permitido/bloqueado, errores de fecha/hora/sala/precio/cupos, `(AGOTADA)`, `(POCOS)`, persistencia, reinicio, Fiore y teclado/foco.

---

## 12. Verificación en navegador, incidencias y cierre

La verificación se hizo contra el build final en el servidor de producción. Las capturas se tomaron en `C:\Users\pc\AppData\Local\Temp\opencode` y se copiaron después a `docs/`, siempre desde la semilla reiniciada y sin capas abiertas.

| Viewport | Escenario ejecutado | Overflow | Captura final |
| --- | --- | --- | --- |
| 1440 × 900 | 9 filas / 9 columnas, orden correcto, alta `demo-fun-010`, edición 20→18, capacidad con compras 12/10, ficha + Escape, rechazo de reducción inválida, persistencia tras recarga, borrado permitido y borrado bloqueado. | `scrollWidth=1432`, `innerWidth=1440` → sin desbordamiento. | `docs/M7_C5_Funciones_1440.jpg` (1432 × 3424) |
| 768 × 1024 | El mismo ciclo completo; menú móvil usado para navegar, tabla legible y acciones alcanzables sin cambios de URL. | `scrollWidth=760`, `innerWidth=768`. | `docs/M7_C5_Funciones_768.jpg` (760 × 3403) |
| 390 × 844 | El mismo ciclo con `mobile: true`; tarjetas por fila, etiquetas por celda, Escape en capas y foco restaurado. | `scrollWidth=390`, `innerWidth=390`. | `docs/M7_C5_Funciones_390.jpg` (390 × 4332) |

Incidencias detectadas y resueltas:

1. **Estado residual del formulario:** al abrir una edición distinta mientras el diálogo seguía abierto, se conservaban los valores anteriores. Se corrigió remontando el diálogo con `key={forma.kind === "editar" ? \`editar-${forma.funcion.id}\` : "crear"}` y se añadió la aserción dentro del caso 24. Verificado en navegador: la edición de `demo-fun-001` mostró `demo-pel-001`, `2026-11-25`, `10:30`, sala `1`, `18000.00` y `10`.
2. **Escape en capas:** se comprobó la corrección capture-phase heredada de C4; con menú y ficha abiertos hicieron falta dos Escape, sin foco en `<body>`.
3. **Desconexión del navegador:** la barra de depuración se cerró dos veces durante la verificación; tras reconectar se repitieron los escenarios afectados desde la semilla. No implicó cambios de código.
4. **Script de verificación intermedio:** una primera lectura de 768 interpolaba literalmente la expresión de cupos; se repitió paso a paso con lecturas directas y los valores correctos (18/18 y 10/9).

Aislamiento final: el directorio académico original `C:\Users\pc\Downloads\proyectos_No Tocar\Tarea_PBC_Parcial` sigue con **23.915 archivos**; el manifiesto registrado en C1–C4 conserva el SHA-256 `579AA88FFAA162F4BA7F9444CB04A066D5FBEFF7652FC3C81EAAE621545629BA`. C5 no escribió ni borró archivos allí. El repositorio del portafolio sigue sin commits (**`git log`: «your current branch 'master' does not have any commits yet»**). **No hubo commit, push ni despliegue.**

**C5 queda cerrado aquí.** La ejecución se detiene sin avanzar a C6 ni C7.
