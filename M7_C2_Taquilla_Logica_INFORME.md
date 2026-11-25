# M7 C2 — Taquilla de Cine: lógica funcional — Informe final

Fecha: 25/11/2026. Estado: **C2 COMPLETADO; sin observaciones bloqueantes**.

Esta fase implementó exclusivamente la lógica funcional aislada de la futura demo: validadores, reducer puro, selectores, persistencia local versionada y helpers de vistas, con sus pruebas. **No se implementó la ruta `/proyectos/taquilla-cine/demo`, la interfaz React, formularios, tablas visuales, diálogos, navegación, CTA «Explorar demo», APIs, bases de datos ni dependencias.** No se avanzó a C3.

---

## 1. Archivos creados y configuración

### Código creado en `src/lib/taquilla-cine-demo/`

| Archivo | Contenido |
| --- | --- |
| `validation.ts` | Validadores puros con contrato `{ ok: true, value }` / `{ ok: false, issues }`; normalización de texto, fechas, horas, IDs, importes y estado completo. |
| `reducer.ts` | `applyDemoAction()` con las nueve acciones exigidas y retorno `{ state, changed, error? }`. |
| `selectors.ts` | Catálogos ordenados, cupos derivados, compras enriquecidas, resúmenes y reporte por rango. |
| `storage.ts` | Clave `yeyder.taquilla-cine.demo.v1`, hidratación segura, compuerta de escritura propia y lectura/escritura tolerante a fallos. |
| `peliculas-view.ts` | Búsqueda sin tildes, orden por `id`/`titulo`/`genero`/`duracionMin` y mensajes de estado vacío. |
| `funciones-view.ts` | Filtro por película y texto, orden fecha/hora/ID, clasificación `agotada`/`pocos`/`disponible` y precio formateado. |
| `compras-view.ts` | Orden `fecha_compra DESC, id DESC`, filtro por cliente/película/día Bogotá y KPIs del subconjunto. |
| `reportes-view.ts` | Rango por defecto `2026-11-25` a `2026-11-30`, validación de entradas, detalle y KPIs coherentes. |

### Pruebas y documentación

| Archivo | Contenido |
| --- | --- |
| `tests/taquilla-demo-b2.test.ts` | 23 pruebas puras con `node:test` y `node:assert/strict`, sin frameworks ni efectos. |
| `M7_C2_Taquilla_Logica_INFORME.md` | Este informe con los 11 entregables solicitados. |

### Configuración ajustada

| Archivo | Cambio |
| --- | --- |
| `package.json` | Se añadió `.b0-tests/tests/taquilla-demo-b2.test.js` al final del script `test:b0`; las 10 pruebas anteriores siguen presentes y activas. |
| `tsconfig.b0-tests.json` | Se incluyó `tests/taquilla-demo-b2.test.ts`; los `include` de `src/data/taquilla-cine-demo/**/*.ts` y `src/lib/taquilla-cine-demo/**/*.ts` ya cubrían los módulos nuevos. |

**No fue necesario modificar `types.ts`, `seed.ts` ni `pricing.ts` de C1**: los contratos y cálculos existentes bastaron. No se creó ningún otro archivo de aplicación, configuración ni ruta.

---

## 2. Validadores

- Contrato único: `{ ok: true, value }` o `{ ok: false, issues: ValidationIssue[] }`; `firstIssueMessage()` expone el primer mensaje para la futura UI.
- Los validadores devuelven **copias normalizadas**: recortan espacios y no devuelven referencias a los objetos de entrada.
- Textos: obligatorios, sin espacios vacíos y con límites `150` (título/cliente), `80` (género/ID de entrada), `50` (sala) y `20` (clasificación). Se rechazan claves calculadas o internas (`id`, `cuposDisponibles`, `totalCentavos`, `fechaCompra`, etc.) en las entradas de formulario.
- Enteros: `duracionMin`, `cuposTotales` y `cantidadBoletos` entre `1` y `2147483647`; `cuposDisponibles` entre `0` y el mismo límite; se exige `Number.isSafeInteger`.
- Precios: `precioPesos` finito, positivo, con máximo dos decimales y `<= 9999999999.99`; se convierte a centavos con `pricePesosToCents()`. Los importes ya persistidos se validan en centavos (`1..999999999999`).
- Fechas: `YYYY-MM-DD` con días reales (incluye bisiestos), sin `Date` ni zona del equipo; horas `HH:mm` en 24 horas; `fechaCompra` ISO 8601 con **offset fijo `-05:00`** y segundos `00..59`.
- IDs: prefijos `demo-pel-`, `demo-fun-` y `demo-com-`, con al menos un carácter posterior y sin espacios.
- `validateReporteRange()` exige ambas fechas y `fechaDesde <= fechaHasta`.
- `validateDemoState()` comprueba versión `1`, claves exactas, tipos, IDs únicos y con prefijo, referencias existentes, cupos `= totales - vendidos`, divisibilidad del total histórico entre la cantidad y límites monetarios. **No recalcula ventas antiguas con el precio actual.**

---

## 3. Acciones del reducer

`applyDemoAction(state, action)` nunca muta la entrada y siempre devuelve `{ state, changed, error? }`.

| Acción | Comportamiento |
| --- | --- |
| `HYDRATE` | Valida el estado entrante con `validateDemoState()`; si es inválido devuelve el estado actual con `changed: false` y `error`. |
| `RESET` | Sustituye el estado por una copia nueva de `createSeedState()`. |
| `CREAR_PELICULA` | Valida ID nuevo, unicidad global y campos; agrega al catálogo. |
| `EDITAR_PELICULA` | Exige existencia, valida campos y conserva las funciones asociadas. |
| `ELIMINAR_PELICULA` | Bloquea el borrado si existen funciones que la referencian. |
| `CREAR_FUNCION` | Valida ID, película, fecha, hora, sala, precio y cupos; convierte pesos a centavos e inicializa `cuposDisponibles = cuposTotales`. |
| `EDITAR_FUNCION` | Recalcula `cuposDisponibles = nuevosCuposTotales - vendidos`; bloquea cambiar la película o bajar la capacidad por debajo de lo vendido. |
| `ELIMINAR_FUNCION` | Bloquea el borrado si hay compras asociadas. |
| `REGISTRAR_COMPRA` | Toma `id` y `fechaCompra` **de la acción**, valida cliente/cantidad/cupos, calcula `totalCentavos = precioCentavos × cantidad` y descuenta cupos en una sola transición. |

Cualquier acción no reconocida devuelve `changed: false` con `error: "Acción no reconocida"`. Toda transición aceptada pasa por `validateDemoState()` antes de confirmarse.

---

## 4. Integridad y pureza

- El reducer **no usa** `Date.now()`, `new Date()`, `Math.random()`, `window`, `localStorage` ni `fetch`. Una prueba lee el código fuente y lo comprueba con una expresión regular.
- Los IDs y `fechaCompra` viajan en la acción; el reducer nunca los genera. El total se calcula en centavos con `calculatePurchaseTotalCents()`.
- La «atomicidad» es **exclusivamente local**: una única transición de estado en memoria. No se simulan `FOR UPDATE`, bloqueos ni transacciones concurrentes del backend académico.
- `changed` se calcula con serialización canónica (claves ordenadas recursivamente), de modo que un `RESET` sobre la semilla devuelve `false` aunque el orden de claves de `seed.ts` difiera del orden del contrato.
- Se rechazan sin efectos: ID duplicado, función agotada, exceso de boletos, fecha con offset distinto, totales inválidos, claves calculadas en formularios y referencias rotas.
- Casos verificados en la semilla: `demo-fun-002` agotada (3/3), `demo-fun-005` con 2 libres, `demo-fun-006` con 4 libres, `demo-fun-007` sin compras y `demo-pel-006` sin funciones.

---

## 5. Selectores y agregados

- `selectPeliculas()` ordena por ID ascendente, como el listado original.
- `selectFuncionesConTitulo()` incorpora `tituloPelicula` y ordena por `fecha`, `hora`, `id`. Por hora, `demo-fun-009` (09:00) precede a `demo-fun-008` (20:00) el `2026-11-30`.
- `selectComprasConFuncion()` enriquece cada compra con título, fecha, hora, sala y precio unitario; ordena `fecha_compra DESC, id DESC`.
- `selectCuposDisponibles()` y `selectBoletosVendidos()` derivan los valores del historial, no copian el campo persistido.
- `summarizeSales()` y `selectResumenTaquilla()` devuelven `cantidadCompras`, `boletosVendidos` y `totalRecaudadoCentavos`; comprueban precisión segura en cada suma.
- `selectReporteVentas()` filtra por día local Bogotá en rango inclusivo, equivalente a `[fechaDesde 00:00 -05:00, fechaHasta+1 00:00 -05:00)`; un rango invertido devuelve detalle y KPIs en cero.
- Los indicadores del reporte se calculan **sobre la misma lista** que el detalle, por lo que no pueden contradecir la tabla.

---

## 6. Helpers de vista, filtros y ordenamiento

- `peliculas-view.ts`: búsqueda insensible a mayúsculas y tildes sobre título, género y clasificación; orden configurable; `total`, `esVacio` y mensaje específico según no haya registros o no haya coincidencias.
- `funciones-view.ts`: filtro por `peliculaId` y por texto de título/sala/fecha/hora; orden ascendente o descendente; estado de cupos y precio COP formateado.
- `compras-view.ts`: filtro por texto de cliente/película/sala y por rango de días `-05:00`; rango invertido da lista vacía; KPIs recalculados sobre el subconjunto.
- `reportes-view.ts`: rango por defecto `2026-11-25`–`2026-11-30`; `buildReporteViewFromInputs()` valida antes de derivar y devuelve `valido: false`, `issues` y resultados vacíos en vez de lanzar.
- Ningún helper guarda estado calculado, usa hooks ni contiene JSX. La vista activa, búsquedas, filtros, orden y errores siguen siendo estado de UI no persistido, para resolver en fases posteriores.

---

## 7. Almacenamiento e hidratación

- Clave exclusiva: `yeyder.taquilla-cine.demo.v1`. No se importa ni reutiliza nada de Fiore; una prueba comprueba que la clave es distinta de `yeyder.fiore.demo.v1` y que una escritura no crea otras claves.
- `loadTaquillaState()` usa `getItem` en `try/catch`, parsea JSON y valida con `validateDemoState()`. Resultados: `empty`, `ok` o `invalid` con motivo.
- Si el JSON está corrupto, la versión es distinta de `1` o hay referencias/cupos rotos, se elimina **solo esa clave** y se conserva la semilla.
- `saveTaquillaState()` se niega a escribir hasta que la lectura haya resuelto, **incluso cuando no había datos**. `isTaquillaHydrationResolved()` expone la compuerta propia; `resetTaquillaHydrationGate()` sirve para pruebas y montajes aislados.
- Si `localStorage` está bloqueado o lanza cuota excedida, la lectura devuelve `empty` con motivo y la demo continúa en memoria; `saveTaquillaState()` devuelve `false` sin exponer detalles sensibles.
- `clearTaquillaState()` elimina únicamente la clave de Taquilla. No se persisten vistas, filtros, orden, diálogos ni errores.

---

## 8. Resultados exactos de verificación

| Comprobación | Resultado |
| --- | --- |
| `npm run test:b0` | **129/129 pruebas aprobadas**, `EXIT_CODE=0` (106 previas + 23 nuevas). |
| `npm run test:b5` | **129/129 pruebas aprobadas**, `EXIT_CODE=0`. |
| `npx tsc --noEmit` | `EXIT_CODE=0`, sin errores de tipos. |
| `npm run lint` | `EXIT_CODE=0`, sin avisos. |
| `npm run build` | `EXIT_CODE=0`; rutas generadas: `/`, `/_not-found`, `/proyectos/fiore/demo`. **No aparece `/proyectos/taquilla-cine/demo`.** |

Cifras derivadas comprobadas en pruebas:

| Concepto | Valor |
| --- | ---: |
| Compras totales / boletos / recaudado histórico | 8 / 25 / 51.650.475 centavos |
| Rango por defecto `2026-11-25`–`2026-11-30` | 6 compras / 20 boletos / 40.475.250 centavos |
| Día `2026-11-25` | 2 compras / 4 boletos / 8.100.000 centavos |
| Rango completo `2026-11-24`–`2026-12-01` | igual al resumen global |
| Compra nueva `demo-com-009` (3 boletos en `demo-fun-001`) | 5.400.000 centavos; cupos de 8 a 5 |

---

## 9. Problemas detectados y correcciones

1. **Comparación `changed` dependiente del orden de claves.** `JSON.stringify` marcaba un `RESET` sobre la semilla como cambio porque `seed.ts` inserta `fechaCompra` antes que `totalCentavos`. Se sustituyó por serialización canónica con claves ordenadas; ahora `RESET` sobre la semilla devuelve `changed: false` y el contenido se compara por valor.
2. **Expectativa de orden de funciones.** Las funciones `demo-fun-008` y `demo-fun-009` comparten fecha; el orden correcto por hora sitúa `demo-fun-009` (09:00) antes que `demo-fun-008` (20:00). Se corrigieron las dos aserciones afectadas.
3. **Tipado de `ComprasView`.** La vista de compras necesitaba un campo `total` homogéneo con las demás vistas; se añadió al interface y al objeto devuelto.
4. **Aserciones de prueba mal planteadas.** Se ajustaron una comprobación de fecha inválida, una referencia a un campo inexistente y una validación directa de compra que usaba 9 boletos donde correspondía 1.
5. **Limpieza de validadores.** Se unificó `validateDemoId` para devolver siempre `{ ok, value | issues }` y que los validadores de estado acumulen esos `issues`, y se eliminó una comprobación redundante de precio cero dentro de `validateCompraInput()`.

Ninguna corrección tocó las pruebas ni el comportamiento de C1 ni de Fiore.

---

## 10. Limitaciones y alcance no implementado

- No hay ruta demo, componentes React, formularios, tablas, diálogos, animaciones, carrusel ni CTA. Por tanto `taquillaProject.kind` sigue siendo `"pending"`.
- No hay Route Handlers, Server Actions, middleware, APIs, base de datos, dependencias ni llamadas externas.
- La transición por grupos entre la portada y la futura demo no se modificó: `isRouteTransitionPath()` y sus pruebas permanecen intactas y se resolverían en C7.
- La validación de persistencia no reconstruye el precio histórico de cada venta: comprueba límites, divisibilidad y coherencia de cupos, que es todo lo verificable con el contrato disponible.
- No se inventaron restricciones del original: fechas futuras, solapamiento de salas, paginación, devoluciones, descuentos ni exportaciones.
- La atomicidad es local y en memoria; no equivale a una transacción concurrente del backend original.

---

## 11. Aislamiento del original y estado final

- Proyecto académico original `C:\Users\pc\Downloads\proyectos_No Tocar\Tarea_PBC_Parcial`: **23.915 archivos** y SHA-256 `579AA88FFAA162F4BA7F9444CB04A066D5FBEFF7652FC3C81EAAE621545629BA`, idéntico al manifiesto tomado antes de C2. No se escribió ni borró ningún archivo.
- No se modificaron Fiore, ElectroTero, la presentación principal, las secciones M6, las transiciones existentes ni los tipos/seed/pricing de C1.
- No se hicieron **commits, push ni despliegue**. El repositorio del portafolio no tiene commits en la rama actual; los cambios quedan como archivos locales sin versionar.
- `taquillaProject` continúa con `kind: "pending"` y sin `href` de demo, en cumplimiento de la regla de no habilitar el acceso hasta verificar la ruta en fases posteriores.
- **C2 queda cerrado aquí.** La ejecución se detiene sin avanzar a C3 ni a ninguna fase de interfaz.
