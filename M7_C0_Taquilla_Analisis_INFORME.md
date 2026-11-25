# M7 C0 — Taquilla de Cine: análisis y planificación — Informe final

Fecha: 25/11/2026. Estado: **C0 COMPLETADO; sin observaciones bloqueantes**.

Esta fase fue exclusivamente de análisis y planificación. **No se implementó C1**, no se creó la ruta de demo, no se habilitó ningún botón hacia ella, no se modificó el proyecto original, no se tocaron Fiore, ElectroTero ni el diseño principal del portafolio, no se hicieron commits, push ni deploy, y no se iniciaron servicios, bases de datos ni migraciones.

---

## 1. Confirmación de la ruta real del portafolio y del alcance

La ubicación del repositorio se confirmó con Git:

```text
C:/Users/pc/Downloads/proyectos_No Tocar/Portafolio_Yeyder
```

El proyecto académico original se localizó en:

```text
C:\Users\pc\Downloads\proyectos_No Tocar\Tarea_PBC_Parcial
```

Se inspeccionaron tres líneas independientes y solo de lectura:

1. Backend Spring Boot y scripts PostgreSQL.
2. Frontend Angular.
3. Patrones de integración del portafolio (tarjeta, carrusel, transiciones y demo de Fiore).

No se abrieron, copiaron ni transfirieron contraseñas, tokens, claves ni archivos `.env`. Los nombres de variables no sensibles se citan solo como referencia estructural.

---

## 2. Inventario original inspeccionado

### Backend y base de datos

```text
taquilla-cine-api/
├── pom.xml
├── README.md
├── docs/API_CONTRACT.md
├── src/main/resources/application.properties
├── src/main/java/com/taquillacine/api/
│   ├── TaquillaCineApplication.java
│   ├── config/CorsConfig.java
│   ├── controller/{Compra,Funcion,Pelicula,Reporte}Controller.java
│   ├── dto/ (8 archivos de request/response)
│   ├── exception/ (5 excepciones + GlobalExceptionHandler)
│   ├── model/{Compra,DetalleVenta,Funcion,FuncionConTitulo,Pelicula}.java
│   ├── repository/{Compra,Funcion,Pelicula,Reporte}Repository.java
│   └── service/{Compra,Funcion,Pelicula,Reporte}Service.java
└── src/test/java/com/taquillacine/api/ (7 clases de integración + support/)
taquilla-cine-db/
├── README.md
└── sql/{01_create_tables.sql,02_constraints_indexes.sql,03_drop_tables.sql}
```

### Frontend

```text
taquilla-cine-web/
├── package.json, angular.json, tsconfig*.json
├── src/styles.css
├── src/environments/ (solo nombres de clave, sin valores)
└── src/app/
    ├── app.module.ts, app-routing.module.ts, app.component.*
    ├── models/ (5 modelos + index)
    ├── services/ (4 servicios HTTP)
    ├── shared/components/page-header/
    └── modules/{peliculas,funciones,compras,taquilla}/ (componentes, forms y specs)
```

Además se revisó `INFORME_AUDITORIA_FASE_3.7.md` solo para contrastar el contrato HTTP; corresponde al frontend, no al backend.

---

## 3. Versiones reales y dependencias principales

### Backend

| Elemento | Valor verificado |
| --- | --- |
| Spring Boot | `4.1.1` (`pom.xml:5-10`). |
| Java | `21`; Maven Compiler `3.13.0` con `-Xlint:all`. |
| Maven Wrapper | `3.9.9`. |
| Persistencia | `spring-boot-starter-jdbc` / `JdbcTemplate`. **No hay JPA/Hibernate**. |
| Driver PostgreSQL | `org.postgresql:postgresql`, scope `runtime`, versión resuelta por el BOM. |
| Validación y actuator | `spring-boot-starter-validation`, `spring-boot-starter-actuator` (solo `health`). |
| Pruebas | `spring-boot-starter-test`, `spring-boot-test-autoconfigure`, `spring-test`. |

`application.properties` usa `SERVER_PORT`, `DB_URL`, variables de credenciales, `spring.sql.init.mode=never`, `APP_CORS_ALLOWED_ORIGINS` y actuator sin detalles. No se reprodujeron valores sensibles.

### Frontend

| Elemento | Declarado | Instalado |
| --- | --- | --- |
| Angular | `^21.2.0` | `21.2.26` |
| CLI / build | `^21.2.30` | `21.2.30` |
| TypeScript | `~5.9.2` | `5.9.3` |
| RxJS | `~7.8.0` | `7.8.2` |
| Vitest / jsdom | `^4.0.8` / `^28.0.0` | `4.1.12` / `28.1.0` |
| npm | `12.2.0` | — |

No hay PrimeNG, Angular Material, Bootstrap, Tailwind ni librería de iconos. La interfaz usa CSS propio e SVG inline.

### Portafolio

Next.js `16.4.6`, React `19.3.0`, Tailwind CSS `4.3.3`, `motion`, `lucide-react`, TypeScript y Node. No se añadieron dependencias.

---

## 4. Modelos, esquema SQL y endpoints verificados

### Modelos/esquema

| Tabla | Campos principales | Restricciones |
| --- | --- | --- |
| `peliculas` | `id IDENTITY`, `titulo(150)`, `genero(80)`, `duracion_min`, `clasificacion(20)` | `NOT NULL`, PK, `duracion_min > 0`. |
| `funciones` | `id IDENTITY`, `pelicula_id`, `fecha DATE`, `hora TIME`, `sala(50)`, `precio NUMERIC(12,2)`, `cupos_totales`, `cupos_disponibles` | FK `ON DELETE RESTRICT`; `precio > 0`; `cupos_totales > 0`; `0 <= disponibles <= totales`. |
| `compras` | `id IDENTITY`, `funcion_id`, `nombre_cliente(150)`, `cantidad_boletos`, `total NUMERIC(12,2)`, `fecha_compra TIMESTAMPTZ` | FK `ON DELETE RESTRICT`; `cantidad > 0`; `total > 0`. |

Índices: `idx_funciones_pelicula_id`, `idx_compras_funcion_id`, `idx_funciones_fecha`, `idx_compras_fecha_compra`. No hay datos semilla, `UNIQUE` adicional, triggers ni secuencias explícitas: los IDs son `GENERATED ALWAYS AS IDENTITY`.

`DetalleVenta` y `FuncionConTitulo` son proyecciones de solo lectura. El primero conserva `compras.total` histórico; no recalcula con el precio actual.

### Endpoints

- Películas: `GET` listado y por ID, `POST` con `201 + Location`, `PUT`, `DELETE` con `204`.
- Funciones: mismas operaciones; `cuposDisponibles` se calcula en el backend y no se envía desde el cliente.
- Compras: `GET` listado ordenado y `POST` con `201` sin `Location`; no hay `GET/{id}`, `PUT`, `PATCH` ni `DELETE`.
- Reportes: `GET /api/reportes/ventas?fechaDesde=&fechaHasta=` con fechas ISO obligatorias.
- Error global: `ErrorResponse` de cinco campos y `ValidationErrorResponse` con mapa `campo → mensaje`; sin SQL ni trazas.

---

## 5. Servicios, reglas de negocio y pruebas del backend

### Reglas confirmadas

1. Crear función inicializa `cuposDisponibles = cuposTotales`.
2. Editar capacidad conserva vendidos: `disponibles = nuevosTotales − vendidos`.
3. No se puede reducir capacidad por debajo de vendidos ni cambiar de película una función con compras.
4. No se puede eliminar función con compras ni película con funciones; ambas devuelven `409`.
5. `total = precio × cantidad`, escala `2`, `RoundingMode.HALF_UP`, límite `9999999999.99`.
6. `fechaCompra` se genera en servidor y se trunca a microsegundos.
7. `SELECT ... FOR UPDATE` y `UPDATE ... WHERE cupos_disponibles >= ?` serializan compras y evitan cupos negativos.
8. Una compra rechazada no inserta registro ni descuenta cupos; la transacción se revierte.
9. El reporte usa zona fija `America/Bogota`, rango inclusivo convertido a semiabierto y totales históricos.
10. Los indicadores se calculan sobre la misma lista devuelta en el detalle.

Mensajes literales relevantes: `Se solicitaron N boletos, pero solo hay M disponibles`, `No se puede cambiar la película de una función que tiene compras registradas`, `La nueva capacidad total (...) no puede ser inferior a los cupos ya vendidos (...)`, `No se puede eliminar la función porque tiene compras asociadas`.

### Pruebas

`142` pruebas `@Test` de integración con PostgreSQL local y guardia de base `taquilla_cine_test`:

| Clase | N.º |
| --- | ---: |
| `PeliculaControllerIntegrationTest` | 25 |
| `FuncionControllerIntegrationTest` | 36 |
| `CompraControllerIntegrationTest` | 31 |
| `ReporteControllerIntegrationTest` | 26 |
| `AuditoriaApiIntegrationTest` | 16 |
| `CompraConcurrenciaIntegrationTest` | 7 |
| `CompraAtomicidadIntegrationTest` | 1 |

No se ejecutaron en C0. El README de `taquilla-cine-db` menciona 64 comprobaciones de integridad, pero no hay archivos de test en ese módulo.

---

## 6. Frontend Angular: navegación, componentes, validaciones y estilos

### Navegación y componentes

`app-routing.module.ts` redirige `''` a `peliculas` y carga con lazy loading cuatro módulos: `peliculas`, `funciones`, `compras` y `taquilla`. No hay guards, interceptores, login ni sesión. El shell incluye `Saltar al contenido principal`, `<main id="contenido" tabindex="-1">`, sidebar de cuatro entradas y footer académico.

- **Películas:** formulario inline, tabla `Cartelera registrada`, detalle `<dl class="fichas">` y confirmación de borrado inline en la fila.
- **Funciones:** formulario de seis campos, bloque `.info-edicion` con totales/disponibles/vendidos y tabla de 9 columnas.
- **Compras:** select con `(AGOTADA)` y `(POCOS)`, panel `.info-funcion`, total estimado azul y tabla de compras.
- **Taquilla:** filtros de fecha, botón `Hoy`, KPIs y tabla de detalle.

Los servicios HTTP usan `environment.apiUrl` y consumen los 13 endpoints del backend. Los modelos marcan que `cuposDisponibles`, `total` y `fechaCompra` son calculados por el servidor.

### Validaciones observadas

- Película: obligatorios, sin solo espacios, máximos `150/80/20`, duración entera `1..2147483647`.
- Función: `YYYY-MM-DD` real, `HH:mm`, sala ≤ `50`, precio > `0` con máximo dos decimales y límite `9999999999.99`, cupos `1..2147483647`.
- Compra: entero positivo, cliente ≤ `150`, comparación local contra cupos disponibles.
- Taquilla: fechas obligatorias y `fechaDesde <= fechaHasta`.
- No existen reglas de fecha futura, solapamiento de salas ni exportación.

### Diseño

Paleta: sidebar `#1e293b`, fondo `#f8fafc`, superficie `#ffffff`, azul `#2563eb`/`#1d4ed8`, texto `#1e293b`/`#64748b`, borde `#e2e8f0`, éxito `#15803d`, error `#dc2626`,Paneles claros, botones con icono, tablas con IDs monoespacio, confirmación roja inline, fichas `<dl>`, total estimado azul, KPIs con dinero verde, estados vacíos centrados, cargadores circulares y foco visible. Responsive: sidebar colapsa a 900 px, formularios a dos columnas desde 720 px, tablas con scroll horizontal.

### Pruebas del frontend

`96` specs con Vitest + TestBed: app (2), películas (5), formulario película (9), funciones (18), formulario función (14), compras (31), taquilla (17). Dos specs de compras están marcados como pendientes. No se ejecutaron en C0.

---

## 7. Funcionalidades reales, mejoras opcionales y diferencias

### Implementado y probado en el original

CRUD de películas y funciones; registro de compras con descuento atómico de cupos; reporte de ventas por rango; API REST consumida por Angular; validaciones de formulario; manejo global de errores; CORS; concurrencia y atomicidad; 142 pruebas backend y 96 specs frontend.

### Mejoras opcionales que el original **no** implementa

Autenticación, roles, paginación, filtros configurables, exportación a Excel/PDF, devoluciones o anulación de compras, fechas futuras, solapes de sala, datos semilla SQL, auditoría en respuestas, JPA/Hibernate y pruebas de catálogo en `taquilla-cine-db`. No deben presentarse como funcionalidades existentes.

### Diferencias entre capas

- Persistencia real: JDBC, no JPA; las relaciones y restricciones están en SQL.
- La DB garantiza el rango `0 <= disponibles <= totales`, pero no la igualdad con vendidos; esa la mantiene el servicio.
- El manejo de errores depende de los nombres literales de las FK.
- `PeliculaService.eliminar()` depende solo de la FK; `FuncionService.eliminar()` además hace pre-chequeo con bloqueo.
- El frontend calcula un total estimado, pero el total oficial y la fecha son del backend; los mensajes del servidor pueden sobrescribir los locales.

---

## 8. Estado actual del portafolio y propuesta de integración

### Tarjeta existente

`src/data/projects.ts:268-296` define `taquillaProject` como `PendingProject`: `id: "taquilla-cine"`, `status: "Demo pendiente"`, sin `href`, `preview`, `image` ni `actionLabel`. `tests/project-presentation.test.ts:74-92` verifica esa ausencia y que las `features` digan «proyecto original» o «frontend original». La tarjeta no debe reconstruirse.

### Transición existente

`src/lib/route-transition.ts:6` limita la animación a `"/"` y `"/proyectos/fiore/demo"`. `tests/route-transition.test.ts:35` exige que `/proyectos/taquilla-cine/demo` devuelva `false`. La superficie respeta modificadores, enlaces externos, `target`, `download`, anclas y `prefers-reduced-motion`, y conserva `data-no-route-transition`.

### Propuesta segura

- Construir C1–C6 en carpetas nuevas, sin tocar carrusel, tarjeta ni transición.
- Mantener `isRouteTransitionPath()` y sus cuatro pruebas intactos; añadir un predicado por grupos (`fiore` / `taquilla`) para permitir solo portada ↔ demo correspondiente, evitando Fiore ↔ Taquilla.
- Solo al final, con la ruta verificada, cambiar `taquillaProject` a `DemoProject` con `href: "/proyectos/taquilla-cine/demo"` y actualizar intencionalmente `project-presentation.test.ts` y las nuevas pruebas de transición.
- **No habilitar el botón de demo hasta que la ruta sea funcional y esté verificada.**
- Las `86` pruebas actuales deben seguir en verde; los nuevos tests deben declararse en `tsconfig.b0-tests.json` y en el script `test:b0`.

El detalle completo está en `docs/taquilla-cine-demo-plan.md`, con arquitectura, datos ficticios, reglas, persistencia, bloques C1–C7, criterios de aceptación y riesgos.

---

## 9. Verificación de no modificación, entregables y cierre

### Original intacto

Se generó un manifiesto de metadatos —ruta, tamaño y fecha de modificación— de los **23.593 archivos** del directorio original antes y después de las inspecciones. La comparación no arrojó diferencias:

```text
ORIGINAL_INMUTABLE: 23593 archivos, mismas rutas/tamaños/mtimes
```

No se ejecutaron migraciones, drop, builds, tests, servidores ni instalaciones dentro del original.

### Archivos creados en esta fase

| Archivo | Contenido |
| --- | --- |
| `docs/taquilla-cine-demo-plan.md` | Plan de 12 apartados con análisis, propuesta React, datos ficticios, hidratación, integración y bloques C1–C7. |
| `M7_C0_Taquilla_Analisis_INFORME.md` | Este informe con los 9 entregables. |

### Estado de cierre

- No se creó `src/app/proyectos/taquilla-cine/demo/page.tsx` ni ningún componente, dato, librería o test de demo.
- No se modificaron Fiore, ElectroTero, carrusel, tarjetas, transiciones, `globals.css`, `layout.tsx` ni `page.tsx`.
- No se agregaron dependencias, credenciales, servicios externos ni puertos.
- No se hizo commit, push ni deploy; los cambios previos de M6.1 permanecen sin commitear, como estaban.
- No se ejecutaron pruebas ni build en C0; el registro histórico de M6.1 es `86/86` pruebas, `tsc`, `lint` y `build` en verde.
- **C0 se detiene aquí y espera instrucciones para C1.**
