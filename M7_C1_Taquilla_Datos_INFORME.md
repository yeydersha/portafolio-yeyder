# M7 C1 — Taquilla de Cine: datos, tipos y cálculos puros — Informe final

Fecha: 25/11/2026. Estado: **C1 COMPLETADO; sin observaciones bloqueantes**.

Esta fase construyó únicamente la base de datos ficticios, los contratos TypeScript y los cálculos puros. **No se implementó reducer, CRUD, almacenamiento local, hidratación, interfaz, navegación, ruta de demo ni integración con el carrusel.** Tampoco se habilitó «Explorar demo» ni se avanzó a C2.

---

## 1. Archivos creados

### Código y pruebas

| Archivo | Contenido |
| --- | --- |
| `src/data/taquilla-cine-demo/types.ts` | Contratos `DemoPelicula`, `DemoFuncion`, `DemoCompra`, `TaquillaDemoState`, `TaquillaDemoView`, `TaquillaDialog` y constantes `DEMO_STATE_VERSION` / `DEMO_TODAY`. |
| `src/data/taquilla-cine-demo/seed.ts` | `createSeedState()` con 6 películas, 9 funciones y 8 compras ficticias; cupos y totales derivados con cálculos puros. |
| `src/lib/taquilla-cine-demo/pricing.ts` | Funciones puras de conversión, total, formato COP, boletos vendidos y recálculo de capacidad. |
| `tests/taquilla-demo-b1.test.ts` | 20 pruebas puras con `node:test`, una por cada punto exigido en la sección 9 del bloque. |

### Configuración actualizada

| Archivo | Cambio |
| --- | --- |
| `package.json` | Se añadió `.b0-tests/tests/taquilla-demo-b1.test.js` al final del script `test:b0`; no se reemplazó ninguna prueba existente. |
| `tsconfig.b0-tests.json` | Se incluyeron `src/data/taquilla-cine-demo/**/*.ts`, `src/lib/taquilla-cine-demo/**/*.ts` y `tests/taquilla-demo-b1.test.ts`. |

### Documentación creada

| Archivo | Contenido |
| --- | --- |
| `M7_C1_Taquilla_Datos_INFORME.md` | Este informe con los 10 entregables solicitados. |

No se creó ningún otro archivo de aplicación ni configuración.

---

## 2. Tipos implementados

- `DemoPelicula`: `id`, `titulo`, `genero`, `duracionMin`, `clasificacion`.
- `DemoFuncion`: `id`, `peliculaId`, `fecha`, `hora`, `sala`, `precioCentavos`, `cuposTotales`, `cuposDisponibles`.
- `DemoCompra`: `id`, `funcionId`, `nombreCliente`, `cantidadBoletos`, `totalCentavos`, `fechaCompra`.
- `TaquillaDemoState`: `version: 1`, `peliculas`, `funciones`, `compras`.
- `TaquillaDemoView`: `"peliculas" | "funciones" | "compras" | "taquilla"`.
- `TaquillaDialog`: película, función, compra, borrado, reinicio o `null`, según el plan C0.
- Constantes: `DEMO_STATE_VERSION = 1`, `DEMO_TODAY = "2026-11-25"`.

No se añadieron campos a los contratos. Las unidades quedan documentadas en comentarios: precios y totales en centavos COP; fechas como texto estable; `cuposDisponibles` como valor derivado.

---

## 3. Datos ficticios

| Grupo | Contenido |
| --- | --- |
| Películas | `demo-pel-001` a `demo-pel-006`. Géneros y duraciones únicos; clasificaciones `A`, `B`, `C`, `D`. `demo-pel-006` no tiene funciones y queda disponible para una futura eliminación. |
| Funciones | `demo-fun-001` a `demo-fun-009`. Fechas del `2026-11-25` al `2026-11-30`, 9 horarios distintos, salas `1`–`4`, cinco películas referenciadas y precios positivos. |
| Casos especiales | `demo-fun-002` agotada (3 vendidos de 3); `demo-fun-005` y `demo-fun-006` con pocos cupos (2 y 4); `demo-fun-007` sin compras. |
| Compras | `demo-com-001` a `demo-com-008`, clientes `Cliente Demo A` a `Cliente Demo H`, cantidades `2, 3, 1, 4, 5, 5, 2, 3`. Todas referencian funciones existentes. |
| Fechas de compra | ISO 8601 fijo con offset `-05:00`. Hay fechas dentro y fuera del rango de referencia `2026-11-25` a `2026-11-30`. |
| Precios con centavos | `demo-fun-006` usa `1875050` centavos (18.750,50 COP) y `demo-fun-009` usa `2525075` centavos (25.250,75 COP). |

No hay nombres, clientes, correos, documentos ni datos reales. No se usó reloj, azar, UUID aleatorio ni fuente externa.

---

## 4. Reglas de coherencia

1. `cuposDisponibles = cuposTotales - countSoldTickets(compras, funcionId)` para las 9 funciones.
2. `countSoldTickets` suma solo las compras de la función indicada; un id ausente devuelve `0`.
3. Ninguna función tiene cupos negativos ni boletos vendidos superiores a su capacidad.
4. Toda función referencia una película existente; toda compra referencia una función existente.
5. Los IDs son únicos y usan `demo-pel-*`, `demo-fun-*` y `demo-com-*`.
6. `totalCentavos = precioCentavos × cantidadBoletos` usando la función pura, con límite `9999999999.99` COP.
7. El total se conserva como snapshot histórico: editar el precio de `demo-fun-002` no modifica el total de `demo-com-002`.
8. Los cupos y totales no están escritos a mano en la semilla: se calculan al construir el estado, de modo que una edición del dataset no puede dejarlos incoherentes.
9. `createSeedState()` devuelve arreglos y objetos nuevos en cada llamada; mutar una instancia no afecta a otra.

---

## 5. Funciones de cálculo

| Función | Acepta | Devuelve | Reglas verificadas |
| --- | --- | --- | --- |
| `pricePesosToCents(precioPesos)` | **Pesos** como número decimal. | Centavos COP enteros. | `> 0`, máximo dos decimales, límite `9999999999.99`; particiona la representación textual para evitar deriva float. |
| `calculatePurchaseTotalCents(precioCentavos, cantidadBoletos)` | **Centavos** por boleto y cantidad entera. | Total en **centavos**. | Multiplicación entera; valida ambos límites y comprueba el desbordamiento antes de multiplicar. |
| `formatCOP(centavos)` | **Centavos** COP enteros. | Texto `es-CO` con dos decimales. | Acepta `0`; rechaza negativos, decimales y montos fuera del límite. |
| `countSoldTickets(compras, funcionId)` | Lista de compras y id de función. | Conteo entero de boletos. | Filtra por `funcionId`; rechaza cantidades no enteras o fuera de `1..2147483647`. |
| `calculateAvailableAfterCapacityChange(nuevosCuposTotales, boletosVendidos)` | Capacidad entera positiva y vendidos enteros `>= 0`. | Cupos disponibles. | Conserva vendidos; rechaza capacidad menor a vendidos y límites fuera de `INTEGER`. |

Constantes expuestas: `MAX_INTEGER_VALUE = 2147483647` y `MAX_PRICE_CENTS = 999999999999`.

---

## 6. Pruebas realizadas

| # | Prueba |
| --- | --- |
| 1 | Estructura exacta del estado y de las tres entidades. |
| 2 | Versión `1` y fecha fija `DEMO_TODAY`. |
| 3 | 6 películas con géneros, duraciones y clasificaciones variados. |
| 4 | 9 funciones con fechas, horarios, salas y precios válidos. |
| 5 | 8 compras con nombres `Cliente Demo A–H` y cantidades variadas. |
| 6 | IDs únicos y prefijos correctos. |
| 7 | Referencias válidas de funciones a películas y compras a funciones. |
| 8 | Exactamente una función agotada. |
| 9 | Exactamente dos funciones con pocos cupos y no agotadas. |
| 10 | Exactamente una función sin compras. |
| 11 | Exactamente una película sin funciones. |
| 12 | Coherencia `disponibles = totales - vendidos` en las 9 funciones. |
| 13 | Totales históricos y congelación ante edición de precio. |
| 14 | Conversión de pesos a centavos, decimales y límites. |
| 15 | Formato COP y valores inválidos. |
| 16 | Límites monetarios en el total de compra. |
| 17 | Límites de enteros en capacidad y conteos. |
| 18 | Filtrado de boletos vendidos y cantidad inválida. |
| 19 | Recálculo de capacidad conservando vendidos. |
| 20 | Igualdad e independencia entre dos llamadas a `createSeedState()`. |

Casos límite ejecutados: precio `9999999999.99`, total máximo con cantidad `1`, desbordamiento con cantidad `2`, precio `0`, precio sobre el límite, cantidad `0`, `2147483647`, `2147483648`, decimales, `NaN`, `Infinity`, capacidad `0`, vendidos `0`, vendidos mayores que la capacidad y función inexistente.

---

## 7. Resultados exactos

| Comando | Resultado |
| --- | --- |
| `npm run test:b0` | `tests 106`, `pass 106`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 407.142`, `EXIT_CODE=0`. Son las 86 pruebas anteriores más las 20 nuevas. |
| `npm run test:b5` | `tests 106`, `pass 106`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 473.3253`, `EXIT_CODE=0`. |
| `npx tsc --noEmit` | `EXIT_CODE=0`, sin errores. |
| `npm run lint` | `EXIT_CODE=0`, sin errores. |
| `npm run build` | `EXIT_CODE=0`; Next.js `16.4.6` con Turbopack; «Compiled successfully»; TypeScript terminado; 5/5 páginas estáticas generadas. Rutas: `/`, `/_not-found`, `/proyectos/fiore/demo`. |

La ruta `/proyectos/taquilla-cine/demo` **no aparece** en el resultado del build, porque C1 no creó rutas.

---

## 8. Problemas encontrados

1. **Error de compilación en el arnés:** `assert.throws(..., undefined, ...)` no es válido con la firma de `node:assert/strict` instalada. Se corrigió pasando el mensaje como segundo argumento. No quedaron errores de tipos.
2. **Prueba 17 mal planteada:** el bucle inicial trataba `0` boletos vendidos como inválido, pero `0` es válido cuando una función no tiene compras. Se separaron las listas de capacidades inválidas (`0`, negativo, decimal, sobre límite) y vendidos inválidos (negativo, decimal, sobre límite). Después de la corrección, la prueba pasó.
3. **Advertencia no bloqueante del build:** Next.js avisó que `package-lock.json` está fuera del repositorio Git actual y sugirió `turbopack.root`. No es un error de C1, no se modificó esa configuración y el build terminó correctamente.

No hay pruebas declaradas aprobadas sin ejecución: los 20 casos nuevos se ejecutaron dentro de los dos comandos de suite registrados.

---

## 9. Confirmación del aislamiento

- No se importó código Angular, Java, Spring, PostgreSQL ni del directorio `Tarea_PBC_Parcial`.
- No se usaron `fetch`, `process.env`, `.env`, `localStorage`, `window`, `Date.now()`, `Math.random()` ni `crypto.randomUUID()`.
- No se crearon Route Handlers, Server Actions, servicios, bases de datos, puertos ni dependencias.
- No se iniciaron backend, frontend original ni PostgreSQL.
- No se creó `src/app/proyectos/taquilla-cine/**` ni `src/components/taquilla-cine-demo/**`.
- `src/data/projects.ts` conserva `taquillaProject` como `kind: "pending"` y `status: "Demo pendiente"`; no se habilitó `href` ni `actionLabel`.
- No se modificaron Fiore, ElectroTero, carrusel, presentación principal, transiciones de rutas, `globals.css`, `layout.tsx` ni `page.tsx`.
- El proyecto académico original se comparó con un manifiesto de metadatos —ruta, tamaño y `mtime`— antes y después de C1, incluyendo archivos ocultos: **23.915 archivos**, mismo SHA-256 `579AA88FFAA162F4BA7F9444CB04A066D5FBEFF7652FC3C81EAAE621545629BA`. No hubo diferencias.
- No se hicieron commits, push ni despliegue.

---

## 10. Estado final de C1

**C1 completado y detenido.** La base pura quedó comprobable mediante `npm run test:b0` y `npm run test:b5`, con 106/106 pruebas en verde, más `tsc`, `lint` y `build` correctos. Quedan fuera de este bloque, exactamente como se solicitó, el reducer, el CRUD, las validaciones de formulario completas, la persistencia, la hidratación, la interfaz visual, la ruta de demostración y la activación del botón «Explorar demo». **No se avanzó automáticamente a C2.**
