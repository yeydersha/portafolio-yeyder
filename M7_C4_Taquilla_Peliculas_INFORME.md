# M7 C4 — Taquilla de Cine: módulo de Películas — Informe final

Fecha: 25/11/2026. Estado: **C4 COMPLETADO; sin observaciones bloqueantes**.

Esta fase sustituyó únicamente la vista provisional de **Películas** por un CRUD interactivo reproducido del módulo académico original. Funciones, Compras y Taquilla siguen siendo vistas provisionales; no se avanzó a C5, C6 ni C7.

---

## 1. Objetivo y alcance

- **Único cambio funcional:** la rama `peliculas` de `TaquillaDemo.tsx` renderiza `<TaquillaPeliculasView />`. Las otras tres ramas continúan con `<TaquillaPlaceholderView item={currentItem} />`.
- Se implementaron: tabla «Cartelera registrada», búsqueda local, alta, edición, ficha `<dl>` de detalle y confirmación inline roja de borrado.
- La semilla de C1 queda intacta: **6 películas, 9 funciones, 8 compras, 25 boletos y 51.650.475 centavos históricos**.
- No se habilitó el CTA «Explorar demo» de Taquilla: `taquillaProject` conserva `kind: "pending"`, `status: "Demo pendiente"` y ausencia de `href`/`actionLabel` propio.
- No se crearon APIs, Route Handlers, Server Actions, base de datos, autenticación ni dependencias nuevas. No se ejecutaron Angular, Spring Boot ni PostgreSQL.

---

## 2. Archivos creados, modificados y configuración

| Archivo | Estado | Contenido |
| --- | --- | --- |
| `src/components/taquilla-cine-demo/TaquillaPeliculasView.tsx` | Creado | Vista CRUD: listado derivado, búsqueda, alta, edición, detalle y borrado inline. |
| `src/components/taquilla-cine-demo/TaquillaPeliculaDialog.tsx` | Creado | Formulario inline de cuatro campos con foco inicial y Escape. |
| `src/components/taquilla-cine-demo/TaquillaDeleteConfirmDialog.tsx` | Creado | Confirmación roja dentro de la fila, foco en «Cancelar» y Escape. |
| `src/components/taquilla-cine-demo/taquilla-form-utils.tsx` | Creado | Parseo, errores por campo, mensaje resumido e ID determinista `demo-pel-*`. |
| `src/components/taquilla-cine-demo/TaquillaDemo.tsx` | Modificado | Integración de la vista y del adaptador `commitAction` sobre `applyDemoAction()`. El serial de ID, el feedback y el retorno al placeholder ya existían desde C3 y se conservan sin cambios funcionales. |
| `src/components/taquilla-cine-demo/taquilla-demo.module.css` | Modificado | Clases C4 añadidas al CSS Module existente; tokens `--taquilla-*` y breakpoints de 720/700 px. |
| `tests/taquilla-demo-b4.test.ts` | Creado | 18 casos exigidos por C4. |
| `package.json` | Modificado | `test:b0` incluye `.b0-tests/tests/taquilla-demo-b4.test.js`; `test:b2`–`test:b5` delegan en él. |
| `tsconfig.b0-tests.json` | Modificado | Incluye `tests/taquilla-demo-b4.test.ts`. |
| `docs/M7_C4_Peliculas_1440.jpg`, `docs/M7_C4_Peliculas_768.jpg`, `docs/M7_C4_Peliculas_390.jpg` | Creados | Capturas reales del módulo en servidor de producción. |
| `M7_C4_Taquilla_Peliculas_INFORME.md` | Creado | Este informe con 12 apartados. |

**No se modificaron** `TaquillaPlaceholderView.tsx`, `TaquillaResetDialog.tsx`, `TaquillaSidebar.tsx`, `TaquillaDemoFrame.tsx`, `src/app/globals.css`, `src/data/projects.ts`, portada, carrusel, presentaciones, Fiore, ElectroTero ni las transiciones globales.

---

## 3. Reutilización de C1–C3 y flujo de mutación

- Toda mutación pasa por `applyDemoAction()` en el contenedor; la vista nunca importa el reducer ni escribe almacenamiento.
- `commitAction(action)` calcula el resultado con `applyDemoAction()` y solo despacha cuando `!resultado.error`; en caso de rechazo devuelve el error sin mutar el estado. Devuelve `{ state, changed, error? }` a la vista, que usa `error` para decidir el feedback.
- El alta usa `nextPeliculaId(state)` a partir del estado: el primer registro es **`demo-pel-007`**. No hay `Date.now()`, `Math.random()` ni `crypto.randomUUID()`.
- `validatePeliculaInput()` y `firstIssueMessage()` de C2 validan antes de despachar. No existe una segunda fuente de verdad ni estado paralelo.
- Persistencia exclusiva mediante `yeyder.taquilla-cine.demo.v1`, encapsulada en `storage.ts`. Las vistas C4 no contienen `localStorage.`, `.getItem(`, `.setItem(` ni `fetch`. La clave de Fiore no se lee ni se escribe.

---

## 4. Catálogo derivado y búsqueda local

- `buildPeliculasView(state, { query })` deriva el listado y el contador; el badge muestra `6 películas` en la semilla y `7 películas` tras un alta.
- Orden estable por ID; la tabla muestra ID, título, género, duración, clasificación y acciones.
- Búsqueda local por título, género o clasificación, sin distinción de tildes y con `type="search"` y `aria-describedby="taquilla-buscar-ayuda"`; el borrado de la consulta restaura el listado completo.
- Resultados verificados en navegador: `luna` → 1 fila (`demo-pel-001`); `zzzz` → 0 filas y mensaje **«No hay películas que coincidan con la búsqueda.»**; sin búsqueda → 6 filas y **«No hay películas registradas.»** cuando corresponde.

---

## 5. Alta y validación de campos

- Campos obligatorios: título (≤150), género (≤80), clasificación (≤20); duración entera positiva en `1..2147483647`. El formulario usa `noValidate` para que los mensajes sean los de C2, no los nativos del navegador.
- El foco al abrir el formulario recae en `#taquilla-pelicula-titulo`.
- Entrada de solo espacios con duración `0` produjo **4 errores por campo** y el resumen «El campo es obligatorio»; el número de filas siguió en 6, es decir, **no se registró ningún inválido**.
- Mensajes exactos confirmados: `El campo es obligatorio`, `El campo no puede superar 150 caracteres`, `El campo no puede superar 80 caracteres`, `El campo no puede superar 20 caracteres`, `El valor debe ser un entero seguro`, `El valor debe estar entre 1 y 2147483647`.
- Alta válida verificada: «Amanecer de Prueba C4», Drama, 95 min, B → `demo-pel-007` y aviso **«Película «Amanecer de Prueba C4» registrada en la cartelera.»**

---

## 6. Edición y ficha de detalle

- «Editar <título>» abre el mismo formulario con los valores actuales y el badge `ID demo-pel-007`; la mutación conserva ID, funciones y compras.
- Edición verificada en navegador: título «… editada», género «Ciencia ficción», duración 100 y clasificación A → aviso **«Datos de «…» actualizados.»** y fila actualizada.
- «Consultar <título>» abre una ficha `<dl>` con ID, Título, Género, Duración, Clasificación y **Funciones asociadas** derivado de `selectFuncionesConTitulo(state)`.
- La ficha se cierra con «Cerrar» o con **Escape**, con el botón «Cerrar» enfocado al abrirse; el foco vuelve al botón «Consultar <título>» que la abrió.

---

## 7. Eliminación inline, bloqueo y mensajes

- «Eliminar <título>» sustituye las acciones de esa fila por el bloque rojo: **«¿Eliminar «…»?»**, «Sí, eliminar» y «Cancelar».
- El foco inicial está en **Cancelar**; Escape cancela y devuelve el foco al botón «Eliminar <título>» de la misma fila (se localiza por `data-pelicula-id`).
- Borrado permitido: la película creada sin funciones se eliminó; el contador volvió a 6 y el aviso fue **«Película «…» eliminada.»**
- Borrado bloqueado: al intentar eliminar `demo-pel-001`, el estado no cambió, la fila permaneció y se mostró **«No se puede eliminar la película porque tiene funciones asociadas»** con `role="alert"`. El mensaje no menciona SQL ni claves foráneas internas.

---

## 8. Accesibilidad, teclado y foco

- Etiquetas `<label for>` en los cuatro campos y en la búsqueda; ayudas y errores enlazados por `aria-describedby`; `aria-invalid` en campos con error.
- Resumen de error con `role="alert"`; confirmaciones con `role="status"`; tabla dentro de `role="region"` con `aria-label` y `tabIndex={0}`; `scope="col"` en encabezados y `<caption>`.
- Botones con nombres explícitos mediante `aria-label="Consultar/Editar/Eliminar <título>"`.
- Escape cancela formulario y confirmación, y cierra la ficha de detalle; en todos los casos el foco vuelve al control que originó la acción.
- Orden lógico: encabezado → feedback → formulario/detalle → cartelera. `:focus-visible` mantiene el contorno azul del marco C3.
- A 390 px las celdas usan etiquetas visibles por celda para que la tabla siga siendo legible sin desplazamiento horizontal.

---

## 9. Reproducción visual y CSS Module

- Encabezado «Catálogo» en la eyebrow del bloque `C4`, título «Películas» y panel «Cartelera registrada», igual que el módulo original adaptado.
- Formato original de la tabla y de las fichas `<dl>`; confirmación de borrado en rojo dentro de la fila, sin modal.
- Paleta conservada: `#1e293b`, `#2563eb`, `#f8fafc`, blanco y `#e2e8f0`, además de los tokens ya definidos en C3. Los estilos C4 viven en `taquilla-demo.module.css`, no en `globals.css`.
- Media queries a 720 px y 700 px: apilado de actions, etiquetas de celda y reducción de paddings. No se añadieron librerías de UI ni iconos externos.

---

## 10. Aislamiento de Fiore, portada, CTA y transiciones

- `taquillaProject` sigue siendo `PendingProject` con `status: "Demo pendiente"`; no tiene `href`, `actionLabel` ni imagen de demo. El CTA «Explorar demo» continúa activo solo en Fiore y **queda pendiente para C7**.
- `isRouteTransitionPath("/proyectos/taquilla-cine/demo")` sigue devolviendo `false`; no se tocaron `route-transition.ts` ni sus pruebas.
- No se reutilizó storage, componentes ni estilos de Fiore. No hay `fetch`, URLs externas, reloj ni azar en los archivos C4.
- Funciones, Compras y Taquilla muestran «Funcionalidad en desarrollo»; no se anticipó ninguna regla de C5–C7.

---

## 11. Resultados exactos de verificación

| Comprobación | Resultado |
| --- | --- |
| `npm run test:b0` | **155/155 pruebas aprobadas**, 0 fallos, `EXIT_CODE=0` (137 previas + 18 nuevas de C4). |
| `npm run test:b5` | **155/155 pruebas aprobadas**, 0 fallos, `EXIT_CODE=0`. |
| `npx tsc --noEmit` | Sin errores, `EXIT_CODE=0`. |
| `npm run lint` | Sin errores ni avisos, `EXIT_CODE=0`. |
| `npm run build` | `✓ Compiled successfully`, TypeScript terminado, `EXIT_CODE=0`; rutas estáticas: `/`, `/_not-found`, `/proyectos/fiore/demo`, `/proyectos/taquilla-cine/demo`. |
| `GET /proyectos/taquilla-cine/demo` | `STATUS=200` en `http://localhost:3100`, servidor de producción. |
| Consola de producción | **0 entradas; 0 errores** tras las tres verificaciones responsive. |
| Warning no bloqueante del build | Next.js ignora `package-lock.json` por estar fuera del repositorio Git; no afecta al resultado. |

---

## 12. Verificación en navegador, incidencias y cierre

La verificación se hizo en el servidor de producción, con escenario real completo en cada viewport. Las capturas se tomaron primero en `C:\Users\pc\AppData\Local\Temp\opencode` y se copiaron después a `docs/`.

| Viewport | Escenario ejecutado | Overflow | Captura |
| --- | --- | --- | --- |
| 1440 × 900 | Búsqueda `luna`/`zzzz`, validación inválida, alta `demo-pel-007`, detalle + Escape, edición, cancelación con Escape, borrado permitido y borrado bloqueado. | `scrollWidth=1432`, `innerWidth=1440` → sin desbordamiento (solo scrollbar). | `docs/M7_C4_Peliculas_1440.jpg` (1432 × 1193) |
| 768 × 1024 | El mismo ciclo completo; tabla legible y acciones reachables sin cambios de URL. | `scrollWidth=760`, `innerWidth=768`. | `docs/M7_C4_Peliculas_768.jpg` (760 × 2520) |
| 390 × 844 | El mismo ciclo completo con `mobile: true`; celdas apiladas y sin scroll horizontal. | `scrollWidth=390`, `innerWidth=390`. | `docs/M7_C4_Peliculas_390.jpg` (390 × 2569) |

Incidencias detectadas y corregidas:

1. Tres aserciones de la nueva suite fallaron por regex del action ternario y por una entrada inválida construida inline; se ajustaron y las 155 pruebas pasan.
2. La ficha de detalle no respondía a Escape; se añadió el manejador y la restauración de foco al botón «Consultar».
3. Tras cancelar una eliminación, el foco caía en `<body>` porque el botón disparador se desmontaba con la fila; se restaura ahora al botón «Eliminar» de esa fila mediante `data-pelicula-id`.
4. Con `touch: true` en la emulación móvil, un tap pareció activar dos veces el botón y cerrar la confirmación; la verificación final de 390 × 844 se repitió con `mobile: true` y `touch: false` (mismo viewport, puntero de escritorio), completándose el escenario sin incidencias.

Aislamiento final: el directorio académico original `C:\Users\pc\Downloads\proyectos_No Tocar\Tarea_PBC_Parcial` sigue con **23.915 archivos**; el manifiesto registrado en C1/C2/C3 conserva el SHA-256 `579AA88FFAA162F4BA7F9444CB04A066D5FBEFF7652FC3C81EAAE621545629BA` y C4 no escribió ni borró archivos allí. El repositorio del portafolio no tiene commits: **`git log` informa «your current branch 'master' does not have any commits yet»**; todos los cambios quedan locales sin versionar. **No hubo push ni despliegue.**

**C4 queda cerrado aquí.** La ejecución se detiene sin avanzar a C5, C6 ni C7.
