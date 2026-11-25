# M7 C7 — Taquilla de Cine: auditoría integral e integración — Informe final

Fecha: 25/11/2026. Estado: **C7 APROBADO**. La ejecución se detiene aquí: **no se avanzó a C8**. No hubo commit, push ni despliegue.

## 1. Alcance y archivos intervenidos

| Archivo | Acción | Función |
| --- | --- | --- |
| `docs/taquilla-cine-demo-plan.md`, `M7_C0_*` … `M7_C6_*_INFORME.md` | Leídos | Línea base documental y criterios C0–C7. |
| `src/data/projects.ts` | Modificado | `taquillaProject` pasó de `kind: "pending"` a `DemoProject` con `href: "/proyectos/taquilla-cine/demo"`, `actionLabel: "Explorar demo"`, `status: "Demo interactiva"` y captura tipada. |
| `src/lib/route-transition.ts` | Modificado | Transiciones decididas por **par origen→destino**; dos grupos (`fiore`, `taquilla`), sin cruce Fiore↔Taquilla. |
| `src/components/ui/route-transition-surface.tsx` | Revisado | Interceptación en fase de captura, `data-route-surface="scoped"` y respeto a `prefers-reduced-motion`. Sin cambios funcionales en esta auditoría. |
| `src/components/ui/project-card.tsx`, `src/components/ui/project-showcase.tsx` | Revisados | La tarjeta abre la presentación; el CTA es un `<a>` real dentro de la presentación ampliada. Sin cambios. |
| `src/components/taquilla-cine-demo/TaquillaDemo.tsx` | Modificado | Escape por capas (formulario → ficha → diálogo) y aviso de `localStorage` con `reason` tipado. |
| `src/components/taquilla-cine-demo/TaquillaResetDialog.tsx` | Modificado | `inert` en el contenido de fondo durante el diálogo de reinicio. |
| `src/components/taquilla-cine-demo/TaquillaPeliculasView.tsx` | Modificado | Foco restaurado al botón de origen tras guardar y cierre por Escape en capas. |
| `src/components/taquilla-cine-demo/TaquillaFuncionesView.tsx` | Modificado | La ficha de función sobrevive al filtro de búsqueda y se cierra con Escape sin cerrar capas inferiores. |
| `tests/taquilla-demo-b7.test.ts` | Creado | 14 regresiones nuevas de integración, persistencia, aislamiento y accesibilidad. |
| `tests/project-presentation.test.ts`, `tests/taquilla-demo-b3.test.ts`, `tests/route-transition.test.ts` | Modificados intencionalmente | Actualizan expectativas de estado `pending` y de transición a la nueva demo verificada. Los contratos de Fiore y ElectroTero se conservan. |
| `package.json`, `tsconfig.b0-tests.json` | Modificados | Registro de `test:b7` dentro de `test:b0`; `test:b5` sigue siendo alias de `test:b0`. |
| `public/images/taquilla-preview.jpg` | Creado | Captura real 16:10 (1120 × 700, 79.271 bytes, SHA-256 `6B18C4A4E9F7563605695A84F92EC42E69B14127A1C80AE62529366268E8B923`). |
| `docs/M7_C7_*.jpg` | Creados | Cinco capturas de auditoría. |

No se creó otra app, backend, base de datos, servicio, API ni dependencia nueva. No se modificó Fiore internamente ni el proyecto académico original.

## 2. Auditoría documental

Se verificaron el plan y los informes C0–C6. La línea base del plan quedó desactualizada: menciona **86 pruebas**, mientras C5 cerró **179/179** y C6 cerró **204/204**. C6 etiquetó como «semilla» cifras posteriores a una compra en un párrafo del informe; el estado real de la semilla es **6 películas, 9 funciones, 8 compras, 25 boletos y 51.650.475 centavos**. El script `test:b6` aparece descrito en documentación anterior pero **no existe** en `package.json`; `test:b5` es alias de `test:b0`. Estas tres discrepancias son documentales, no funcionales, y no bloquean la integración. Se registran para el mantenedor.

## 3. Integración desde el portafolio

En la portada, la tarjeta «Taquilla de Cine» muestra estado **Demo interactiva** y acción **Explorar demo**. Al pulsar la tarjeta se abre primero la **presentación ampliada** (`[region]` con `aria-label="Presentación detallada de Taquilla de Cine"`), no la demo directamente. Desde allí, el CTA `EXPLORAR DEMO` (`href="/proyectos/taquilla-cine/demo"`) abre la ruta de la demo. El botón «VER DETALLES DEL PROYECTO» conserva `aria-expanded=false` y no navega a la demo.

La presentación declara correctamente el stack original (Angular 21, Spring Boot, Java, PostgreSQL) y aclara por escrito que la demo del portafolio usa React/TypeScript con datos ficticios locales y **no ejecuta el backend original ni procesa pagos reales**.

## 4. Captura real 16:10

Se sustituyó el placeholder por una captura propia del entorno de demostración. El asset `public/images/taquilla-preview.jpg` es **1120 × 700 px** (proporción exacta 16:10), **79.271 bytes**, con SHA-256 `6B18C4A4…62968E8B923`. Está conectado a datos tipados mediante `project.presentation.image` (`src`, `alt`, `width`, `height`, `caption`). El `alt` comienza con «Captura real» y el `caption` describe los datos ficticios locales. No se reutilizó la imagen de Fiore ni de ElectroTero.

## 5. Transiciones Portafolio ↔ Taquilla

`/` pertenece simultáneamente a los grupos Fiore y Taquilla; por eso la decisión se toma con el **par origen→destino**:

- `/` ↔ `/proyectos/taquilla-cine/demo` → grupo `taquilla`, con animación breve de la superficie `scoped`.
- `/` ↔ `/proyectos/fiore/demo` → grupo `fiore`, comportamiento original intacto.
- Fiore ↔ Taquilla → `null`, **sin animación y sin enlace directo**.

`shouldAnimateInternalNavigation()` rechaza modificadores, destino externo, descarga, anclas de la misma página y rutas fuera de los tres paths declarados. En navegador se instrumentó `Element.prototype.animate`: con `prefers-reduced-motion: reduce` se registraron **0 animaciones**; sin la preferencia se registró **1** en el mismo recorrido. La navegación ocurre en ambos casos.

## 6. Escenario integral de 20 pasos

Ejecutado en navegador real contra el build de producción (`http://127.0.0.1:3001`), con la clave de Taquilla limpia y centinela `SENTINELA-C7` en Fiore:

| # | Paso | Resultado |
| --- | --- | --- |
| 1 | Portada y tarjeta de Taquilla | Visible como demo interactiva. |
| 2 | Presentación ampliada | Abre con CTA `EXPLORAR DEMO`. |
| 3 | CTA a la ruta | `/proyectos/taquilla-cine/demo` carga sin errores. |
| 4 | Películas | Badge `Demostración · Datos ficticios`, 6 filas, estado persistido v1. |
| 5 | Búsqueda y ficha | `dinosaurios` → 1 fila; ficha se abre y Escape la cierra devolviendo foco al botón «Consultar». |
| 6 | Alta de película | `demo-pel-007` «Cine Parque Demo»; foco tras guardar en «Nueva película». |
| 7 | Edición | Renombrada a «Cine Parque Editado»; mensaje `role="status"`; foco en su botón «Editar». |
| 8 | Eliminación bloqueada | `No se puede eliminar la película porque tiene funciones asociadas`; 7 filas y película intacta. |
| 9 | Funciones | 9 filas; 1 `AGOTADA`, 2 `(POCOS)`. |
| 10 | Ficha survive al filtro | Ficha abierta + búsqueda `Misterio` → 2 filas y ficha sigue visible; Escape la cierra. |
| 11 | Escape por capas | Formulario + ficha abiertos: primer Escape cierra el formulario, segundo cierra la ficha. |
| 12 | Alta de función | `demo-fun-010`, 40 cupos, sala «Sala Demo 7», foco en «Nueva función». |
| 13 | Compra y total estimado | `demo-com-009`, 3 boletos a $ 18.000,00 = $ 54.000,00. |
| 14 | Compra válida | ID `demo-com-009`, cupos 8 → 5, resumen 9 compras / 28 boletos / $ 570.504,75. |
| 15 | Compra inválida | 8 boletos sobre 5 disponibles → `Se solicitaron 8 boletos, pero solo hay 5 disponibles`; estado byte-identical. |
| 16 | Reportes y KPIs | Rango 2026-11-25 → 2026-11-30: 7 compras, 23 boletos, $ 458.752,50. |
| 17 | Rango invertido | `La fecha inicial no puede ser posterior a la fecha final` + `Ajusta el rango de fechas…`; 0 filas. |
| 18 | Reset con Escape e `inert` | Diálogo `role="dialog" aria-modal="true"`; 2 nodos `inert`; Escape cierra solo el diálogo, segundo Escape cierra el formulario subyacente. |
| 19 | Confirmar reset y Fiore | Vuelve a 6/9/8 y 51.650.475 centavos; Fiore sigue `SENTINELA-C7`. |
| 20 | Regreso a portafolio | ElectroTero (`VISITAR SITIO WEB`) y Fiore (`EXPLORAR DEMO`) intactos; demo de Fiore cargó su semilla sin afectar la clave de Taquilla; 0 errores de consola. |

Los `browser.click` automatizados fallaron en tres ocasiones con `DOM.getNodeForLocation failed` (limitación del adaptador de navegador, no de la página). Se verificó el elemento con snapshot y se ejecutó `.click()` sobre el nodo confirmado; el resultado fue el esperado en cada caso.

## 7. Persistencia e hidratación de `yeyder.taquilla-cine.demo.v1`

| Escenario | Resultado observable |
| --- | --- |
| Clave vacía | Semilla 6/9/8, sin aviso. |
| Estado válido | Mismo estado restaurado, sin aviso. |
| JSON corrupto | `Estado persistido ilegible; se restauró la semilla`; clave limpiada. |
| Versión incompatible (`99`) | `Estado persistido inválido; se restauró la semilla`. |
| Referencia rota en compra | Mismo aviso; semilla restaurada. |
| Cupos inconsistentes | Mismo aviso; semilla restaurada. |
| Total histórico inválido | Mismo aviso; semilla restaurada. |
| `localStorage` bloqueado | Cubierto por inyección de storage en `tests/taquilla-demo-b7.test.ts`: la lectura abre la compuerta, usa la semilla y avisa `Almacenamiento bloqueado; se usa la semilla`; la escritura se niega sin lanzar. |
| Reset | Restaura semilla y borra solo la clave de Taquilla. |
| Recarga | Estado válido y avisos se conservan; ningún error de hidratación en los siete escenarios de navegador. |

`getItem` envuelve la compuerta de escritura incluso en fallo; `saveTaquillaState()` exige hidratación resuelta y estado válido. El aviso de hidratación se estrechó con `"reason" in loaded ? loaded.reason ?? null : null` para corregir `TS2339` en build.

## 8. Aislamiento y seguridad

- No hay PostgreSQL, Neon, Spring Boot, APIs del original, credenciales, secretos, pagos, datos personales reales ni autenticación original en la demo.
- El único término `node-postgres` del código fuente es una etiqueta descriptiva del stack de **Fiore** en `src/data/projects.ts`; no se ejecuta ni importa.
- En 30 peticiones de red capturadas no aparecieron URLs de backend, pasarelas de pago ni servicios externos; **0 fallidos y 0 4xx/5xx**.
- La compra es explícitamente simulada y el badge `Demostración · Datos ficticios` está presente en la demo.
- Fiore se aisló con centinela y se comprobó que ni el reset ni la navegación desde Taquilla lo alteran.

## 9. Accesibilidad

- Lighthouse sobre la demo: **Accessibility 1,00 / Best Practices 1,00 / SEO 1,00**, sin fallos.
- 1 `<h1>`, `lang="es"`, enlace «Saltar al contenido principal», tablas con `<caption>` y `<th scope>` (6/6).
- Todos los controles visibles tienen etiqueta; 0 botones sin nombre accesible.
- Validación con `role="alert"` y confirmaciones con `role="status"`; mensajes exactos verificados en los pasos 8, 11, 15 y 17.
- Escape actúa por capas y devuelve el foco al control de origen; el diálogo de reset marca el fondo con `inert`.
- Estados vacíos informativos al filtrar sin coincidencias (0 filas y mensaje).
- `prefers-reduced-motion` medido en navegador: 0 animaciones frente a 1 en modo normal.
- El menú móvil y las tarjetas de tabla en 390 px conservan nombres y orden de lectura.

## 10. Responsive 1440 × 900, 768 × 1024 y 390 × 844

Las cuatro vistas (Películas, Funciones, Compras, Taquilla) se verificaron en los tres viewports: **12 combinaciones, 0 overflow horizontal** (`scrollWidth` 1432/760/382 frente a `innerWidth` 1440/768/390; la diferencia de 8 px es el scrollbar), sin superposiciones ni truncamientos funcionales. El scroll vertical es esperado por el volumen de tablas. Consola: **0 errores** en las 12 combinaciones.

## 11. Defectos detectados y corregidos

1. Escape cerraba capas superpuestas en orden incorrecto → ahora formulario → ficha → diálogo.
2. El diálogo de reset no marcaba el fondo como `inert` → 2 nodos `inert` durante la apertura.
3. La ficha de Funciones desaparecía al filtrar por búsqueda → se mantiene hasta Escape.
4. Tras guardar Película el foco no volvía al botón de origen → restaurado.
5. El aviso de `localStorage` bloqueado no exponía la razón tipada → accedido de forma segura con `"reason" in loaded`.

Además, la primera aserción de la prueba de captura construía `/public/images/taquilla-preview.jpg`; se corrigió a la URL pública `/images/taquilla-preview.jpg`. Tras este ajuste, los cinco comandos obligatorios pasaron con código 0.

## 12. Pruebas y comandos obligatorios

`tests/taquilla-demo-b7.test.ts` aporta **14 casos**: estado de demo en tarjeta, tarjeta→presentación→CTA, captura 16:10 real, grupos de transición sin cruce, reduced motion, compuerta de hidratación, JSON corrupto/versión/refs, cupos y totales incoherentes, compra tras recarga, total histórico tras cambio de precio, reset que limpia solo su clave, aislamiento de Fiore/backend/pagos, operaciones inválidas sin mutación y regresiones accesibles. Se conservan las **204 pruebas previas** y se actualizan tres archivos de forma intencional.

| Verificación | Resultado | Código de salida |
| --- | --- | --- |
| `npm run test:b0` | **219/219 aprobadas**, 0 fallos (204 previas + 14 de C7; el arnés reporta 219) | `0` |
| `npm run test:b5` | **219/219 aprobadas**, 0 fallos (alias de `test:b0`) | `0` |
| `npx tsc --noEmit` | Sin errores de tipos | `0` |
| `npm run lint` | Sin incidencias de ESLint | `0` |
| `npm run build` | Build de producción correcto; 4 rutas estáticas, incluida `/proyectos/taquilla-cine/demo` | `0` |

El build emite la advertencia no bloqueante de Next.js sobre `package-lock.json` fuera del repositorio Git. No se modificó la configuración para silenciarla.

## 13. Capturas C7

| Archivo | Vista | Píxeles del archivo |
| --- | --- | --- |
| `docs/M7_C7_Portafolio_1440.jpg` | Portada con las tres tarjetas | 1432 × 900 |
| `docs/M7_C7_Taquilla_1440.jpg` | Películas a 1440 × 900 | 1432 × 900 |
| `docs/M7_C7_Taquilla_768.jpg` | Películas a 768 × 1024 | 760 × 1024 |
| `docs/M7_C7_Taquilla_390.jpg` | Películas a 390 × 844 | 382 × 844 |
| `docs/M7_C7_Presentacion_Taquilla.jpg` | Presentación ampliada con `EXPLORAR DEMO` | 1432 × 900 |

Generadas en JPEG desde el build de producción, sin datos personales reales. El ancho del archivo es 8 px inferior al viewport por el scrollbar del navegador.

## 14. Limitaciones

- La compra sigue siendo simulada: sin pago, facturación, devolución, autenticación ni persistencia fuera del navegador.
- La verificación visual se hizo en el navegador automatizado disponible; no sustituye pruebas en dispositivos físicos ni auditoría externa con lectores de pantalla.
- `localStorage` bloqueado se validó con storage inyectado en pruebas unitarias, no forzando el bloqueo nativo del navegador.
- Las discrepancias documentales del apartado 2 quedan registradas; no se reescribieron informes C0–C6.
- No se publicó la ruta ni se ejecutó despliegue alguno.

## 15. Aislamiento del original, cierre y clasificación

No se modificaron el original académico, Fiore internamente, ElectroTero original, `src/app/globals.css` ni los módulos C3–C6 ya cerrados. El directorio académico `C:\Users\pc\Downloads\proyectos_No Tocar\Tarea_PBC_Parcial` conserva su manifiesto con SHA-256 `579AA88FFAA162F4BA7F9444CB04A066D5FBEFF7652FC3C81EAAE621545629BA`. El repositorio del portafolio sigue sin commits. **No hubo commit, push ni despliegue.**

**Clasificación final: C7 APROBADO.** La demo de Taquilla está integrada desde el portafolio, auditada en navegador real, verificada en tres viewports y lista para publicación. La ejecución se detiene aquí, **sin iniciar C8**.
