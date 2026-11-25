# M7 C6 — Taquilla de Cine: compras simuladas y reportes — Informe final

Fecha: 25/11/2026. Estado: **C6 COMPLETADO; sin observaciones bloqueantes**. La ejecución se detiene aquí: **no se avanzó a C7**.

## 1. Componentes y archivos

| Archivo | Acción | Función |
| --- | --- | --- |
| `src/components/taquilla-cine-demo/TaquillaComprasView.tsx` | Creado | Vista de Compras: panel de nueva compra, historial y mensajes de confirmación/error. |
| `src/components/taquilla-cine-demo/TaquillaCompraDialog.tsx` | Creado | Formulario inline de tres campos con validación, información de función y total estimado. |
| `src/components/taquilla-cine-demo/TaquillaReportesView.tsx` | Creado | Vista de Taquilla: filtros de fecha, tres KPIs y detalle de ventas. |
| `src/components/taquilla-cine-demo/TaquillaDemo.tsx` | Modificado | Enrutamiento por estado: `activeView === "compras"` y `activeView === "taquilla"` renderizan las vistas C6. Conserva `commitAction`, sidebar, navegación, reinicio y listener de Escape. |
| `src/components/taquilla-cine-demo/taquilla-demo.module.css` | Modificado | Clases C6 (`comprasPanel`, `reportesPanel`, `compraForm`, `filtroForm`, `totalPanel`, `kpiGrid`, `compraTable`, `reporteTable`, tarjetas móviles y `prefers-reduced-motion`). |
| `src/lib/taquilla-cine-demo/bogota-time.ts` | Creado | `bogotaDayKey()` y `fechaCompraBogota()` con desplazamiento fijo `UTC-05:00`, sin zona horaria del dispositivo. |
| `src/lib/taquilla-cine-demo/compras-view.ts` | Ampliado | `buildOpcionesCompra()` y `nextCompraId()`, derivados del estado. |
| `tests/taquilla-demo-b6.test.ts` | Creado | **25 casos nuevos** de C6. |
| `tsconfig.b0-tests.json`, `package.json` | Modificados | Registro de `test:b6` y su inclusión en `test:b0`; `test:b5` sigue siendo alias de `test:b0`. |

No se creó otra app, backend, base de datos, servidor, API, ruta, dependencia ni servicio externo. Se reutilizan `REGISTRAR_COMPRA`, los validadores, los selectores y los helpers de cálculo de C1/C2, además del marco visual de C3 y los módulos terminados de C4/C5.

## 2. Interfaz de compras

La vista muestra el encabezado «Bloque C6 · Ventas simuladas», el aviso permanente «Esta operación es una simulación y no representa una compra real.», el botón «Registrar compra» y el historial. El formulario inline sigue el patrón de C4/C5 y contiene exactamente los tres campos aceptados por `validateCompraInput`:

- **Función**: `select` con opción inicial «Selecciona una función».
- **Cliente ficticio**: texto obligatorio, `maxLength={150}`, sin datos personales reales.
- **Cantidad de boletos**: numérica, entera, `min=1`, `max` igual a los cupos libres de la función seleccionada.

Debajo aparece el bloque «Información de la función seleccionada» con película, fecha/hora, sala, precio por entrada y capacidad/cupos. El panel azul claro «Total estimado de la compra» usa `role="status"` y `aria-live="polite"`; muestra «—» hasta que la selección y la cantidad son válidas. La confirmación accesible se informa con `role="status"` y el error con `role="alert"`.

## 3. Disponibilidad de funciones

`buildOpcionesCompra(state)` genera las nueve opciones reales más la opción vacía. Todas las funciones permanecen visibles:

- `demo-fun-002` aparece como `0 cupos (AGOTADA)` y su `<option>` está `disabled`; no se puede confirmar una compra sobre ella.
- `demo-fun-005` (2 cupos) y `demo-fun-006` (4 cupos) aparecen con `(POCOS)`.
- Tras comprar 3 boletos en `demo-fun-001`, la opción pasa de `8 cupos` a `5 cupos (POCOS)`; la ficha de C5 refleja el mismo cambio.

La cantidad enviada se valida contra los cupos calculados desde el historial. Un valor superior se rechaza con `Se solicitaron 9 boletos, pero solo hay 5 disponibles`; el estado no se muta.

## 4. Cálculos

El total se calcula únicamente con `calculatePurchaseTotalCents(precioCentavos, cantidad)` y se formatea con `formatCOP()` (`Intl.NumberFormat("es-CO")`). No hay aritmética monetaria duplicada en los componentes.

- Precio unitario de `demo-fun-001`: `$ 18.000,00` (1.800.000 centavos).
- 3 boletos: `$ 54.000,00` (5.400.000 centavos), mostrados en el panel estimado antes de confirmar.
- El reducer conserva el total registrado en cada compra; si el precio de la función cambia después, el importe histórico no se recalcula.
- El límite monetario se valida antes de escribir: un total superior a `9999999999.99 COP` se rechaza sin efectos.

## 5. Historial y persistencia

`buildComprasView(state)` ordena por fecha de compra y, en empate, por ID; muestra ID, función, película, cliente, boletos, total registrado y fecha. La semilla tiene **8 compras, 25 boletos y $ 516.504,75** en ventas simuladas. Después de registrar `demo-com-009` con 3 boletos para «Ana Pérez», el resumen pasa a **9 compras, 28 boletos y $ 570.504,75**. El siguiente ID mostrado es `demo-com-010`, derivado del estado, sin `Date.now()`, azar ni UUID.

La persistencia sigue encapsulada en `storage.ts` bajo la clave exclusiva `yeyder.taquilla-cine.demo.v1`. Las vistas C6 no contienen `localStorage.`, `.getItem(`, `.setItem(` ni `fetch`. El reinicio restauró en navegador las 8 compras, 25 boletos y $ 516.504,75 originales, y eliminó `demo-com-009`.

## 6. Taquilla y KPIs

La vista «Taquilla» sustituye al placeholder y muestra tres indicadores —**Compras simuladas**, **Boletos vendidos** y **Total recaudado (simulado)**— junto al detalle de ventas. Los tres KPIs y las filas se derivan de un único resultado de `buildReporteViewFromInputs(state, fechaDesde, fechaHasta)`; no existe ninguna estadística guardada en el estado de la demo.

Con el rango inicial `2026-11-25` a `2026-11-30` la semilla muestra **7 compras, 23 boletos y $ 458.752,50** (la compra `demo-com-008` está fechada en 2026-12-01 y queda fuera). Tras la compra simulada, los mismos KPI/subconjunto pasan a **8 compras, 26 boletos y $ 512.752,50**. El detalle usa tabla semántica con `<caption>`, `<th scope="col">` y `<time dateTime>`.

## 7. Filtros de fecha

Los campos «Desde» y «Hasta» usan `type="date"` y `formato YYYY-MM-DD`. «Aplicar filtros» confirma el rango; «Hoy» calcula la fecha de Bogotá solo al pulsarse, de modo que el render inicial nunca depende del reloj local. El rango es inclusivo y las comparaciones usan la clave de día `America/Bogota` (`UTC-05:00`).

Comportamiento verificado en navegador:

- Rango invertido `2026-11-30` → `2026-11-25`: «La fecha inicial no puede ser posterior a la fecha final» y «Ajusta el rango de fechas para consultar el reporte.»; **0 filas** y ningún KPI inventado.
- «Hoy» con la referencia de la semilla: `2026-11-25` a `2026-11-25`, **3 compras, 7 boletos, $ 135.000,00** y 3 filas.
- Rango sin ventas `2020-01-01` → `2020-01-02`: «No hay ventas registradas en el rango seleccionado.», 0 compras, 0 boletos y `$ 0,00`.

## 8. Actualización entre módulos

Toda mutación pasa por la misma acción `REGISTRAR_COMPRA` y por el único `commitAction()` de `TaquillaDemo`. En un solo render, y sin recarga, se actualizan:

1. El historial de Compras y su resumen.
2. Los cupos de Funciones (`demo-fun-001`: 8 → 5, con `(POCOS)`).
3. Los KPIs y el detalle de Taquilla para el rango aplicado.

La fecha se prepara en la capa cliente antes de despachar la acción (`fechaCompraBogota(new Date())`); el reducer permanece puro. Una acción rechazada no cambia cupos ni historial, lo cual se comprobó en navegador al enviar 9 boletos: aparece el error de campo, el formulario sigue abierto y la función conserva 5 cupos.

## 9. Accesibilidad

- Cada control tiene `<label>` asociado; los textos de ayuda y error se enlazan con `aria-describedby`, y `aria-invalid` cambia a `true` cuando hay error de campo.
- El formulario pone el foco inicial en el selector de función, `stopPropagation()` en Escape para no cerrar varias capas, y restaura el foco al botón «Registrar compra» al cancelar, al confirmar o al usar Escape.
- Los avisos usan `role="note"`, `role="status"`/`aria-live="polite"` y `role="alert"` según corresponda; las tablas tienen caption y encabezados semánticos.
- El foco visible se mantiene con los tokens ya definidos y las transiciones se anulan con `prefers-reduced-motion: reduce`.
- No se añadieron atajos, diálogos modales nuevos ni escuchas redundantes de teclado.

## 10. Pruebas

`tests/taquilla-demo-b6.test.ts` aporta **25 casos**: opciones disponibles, agotadas visibles y pocos cupos; compra válida con ID y fecha preparados; cantidades `0`, negativa, decimal y superior a cupos; función agotada; cliente vacío y longitud inválida; total en centavos/COP y límite monetario; descuento de cupos en una transición; rechazo sin mutar estado; importe histórico tras cambio de precio; orden del historial; reporte por fechas; rango invertido; rango sin ventas; coherencia KPI/detalle; actualización entre módulos sin recargar; persistencia; reinicio; y «Hoy» en Bogotá `UTC-05:00`.

| Verificación | Resultado | Código |
| --- | --- | --- |
| `npm run test:b0` | **204/204 aprobadas**, 0 fallos (179 previas + 25 de C6) | `0` |
| `npm run test:b5` | **204/204 aprobadas**, 0 fallos (alias de `test:b0`) | `0` |
| `npx tsc --noEmit` | Sin errores de tipos | `0` |
| `npm run lint` | Sin incidencias de ESLint | `0` |
| `npm run build` | Build de producción correcto; 4 rutas estáticas, incluida `/proyectos/taquilla-cine/demo` | `0` |

El build emite una advertencia no bloqueante de Next.js: ignora `package-lock.json` porque el repositorio está anidado fuera de `C:\Users\pc`. No afecta al resultado ni se modificó la configuración para silenciarla.

## 11. Responsive y verificación en navegador

La verificación se hizo sobre el build de producción (`http://127.0.0.1:3001`), con hidratación confirmada por los manejadores React presentes en el botón de navegación.

| Viewport | Comprobación | Desbordamiento horizontal | Consola |
| --- | --- | --- | --- |
| 1440 × 900 | Flujo completo: aviso ficticio, Películas (6 filas), Funciones (9 filas y `(AGOTADA)`/`(POCOS)`), Compras (8 filas), formulario, total `$ 54.000,00`, compra `demo-com-009`, cupos 8 → 5, filtros, «Hoy», rango vacío, Escape con foco restaurado y reinicio a 8 compras. | `scrollWidth 1432` ≤ `innerWidth 1440` | 0 errores |
| 768 × 1024 | Mismo ciclo funcional; navegación por botones y KPIs derivados. | `scrollWidth 760` ≤ `innerWidth 768` | 0 errores |
| 390 × 844 | Navegación mediante «Abrir menú»; compras y taquilla sin overflow; filas de tabla convertidas en tarjetas visuales con etiquetas por celda. | `scrollWidth 390` = `innerWidth 390` | 0 errores |

No hubo errores de hidratación, pérdida de foco ni scroll horizontal. Durante la primera prueba con el servidor de desarrollo se observaron errores `WebSocket ... /_next/hmr` provocados por el reinicio del proceso; la verificación final se repitió contra el servidor de producción y la consola quedó vacía.

## 12. Capturas

| Archivo | Vista | Tamaño del archivo JPG |
| --- | --- | --- |
| `docs/M7_C6_Compras_1440.jpg` | Historial y panel de compras a 1440 × 900 | 1146 × 1320 px |
| `docs/M7_C6_Taquilla_1440.jpg` | Rango, KPIs y detalle a 1440 × 900 | 1146 × 1247 px |
| `docs/M7_C6_Movil_390.jpg` | Compras a 390 × 844 (`mobile: true`) | 312 × 3088 px |

Las tres son capturas `fullPage` en JPEG (escala de imagen 0,8 respecto a los píxeles CSS, igual criterio que las capturas de C3–C5). Se generaron desde el build de producción, sin datos personales reales.

## 13. Limitaciones

- La compra es **simulada**: no hay pago, tarjeta, facturación, devolución, descuento de precio, autenticación, backend ni persistencia fuera del navegador.
- El plan menciona «descuento» en C6; en este alcance solo se implementa el **descuento de cupos** por boletos vendidos. No se introdujo ningún descuento monetario ni regla de negocio nueva.
- La fecha de compra se toma del cliente en el momento de confirmar; no se usa la fecha del sistema durante el render inicial ni se inventan fechas futuras.
- El rango inicial del reporte es la referencia fija de la semilla; «Hoy» depende de Bogotá, no de la zona horaria del dispositivo.
- La verificación visual se realizó en el navegador automatizado disponible; no sustituye pruebas en dispositivos físicos ni auditoría externa de lectores de pantalla.
- No se activó «Explorar demo» ni se publicó la ruta más allá del entorno local de verificación.

## 14. Aislamiento del original y cierre

No se modificaron portada, carrusel, presentaciones, Fiore, ElectroTero, `src/app/globals.css`, `route-transition.ts`, `src/data/projects.ts`, sidebar, reset ni los módulos C3–C5 ya cerrados. `taquillaProject` conserva `kind: "pending"`, `status: "Demo pendiente"` y sin `href`/`actionLabel`; `isRouteTransitionPath("/proyectos/taquilla-cine/demo")` sigue devolviendo `false`.

El directorio académico original `C:\Users\pc\Downloads\proyectos_No Tocar\Tarea_PBC_Parcial` conserva sus **23.915 archivos** y el manifiesto registrado en C1–C5 con SHA-256 `579AA88FFAA162F4BA7F9444CB04A066D5FBEFF7652FC3C81EAAE621545629BA`; C6 no escribió ni borró allí. El repositorio del portafolio sigue sin commits (`your current branch 'master' does not have any commits yet`). **No hubo commit, push ni despliegue.**

**C6 queda cerrado aquí. La ejecución se detiene sin avanzar a C7.**
