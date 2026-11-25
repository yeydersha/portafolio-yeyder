# M7 C0 — Plan aislado para la demo interactiva de Taquilla de Cine

> Estado: **solo análisis y documentación**. No se ha implementado C1, no se ha creado la ruta de demo, no se ha modificado el proyecto original, no se han tocado Fiore, ElectroTero ni el diseño principal del portafolio, no se han hecho commits ni push, y no se han iniciado bases de datos, APIs ni servicios externos.

La ruta real del portafolio fue confirmada con Git: `C:/Users/pc/Downloads/proyectos_No Tocar/Portafolio_Yeyder`. El proyecto académico original se inspeccionó únicamente en modo lectura en `C:\Users\pc\Downloads\proyectos_No Tocar\Tarea_PBC_Parcial`. Se revisaron código, configuración no sensible, SQL y documentación; **no se abrieron ni copiaron contraseñas, tokens, archivos `.env` ni variables sensibles**. Un manifiesto de metadatos (ruta, tamaño y fecha de modificación) de los 23.593 archivos del original fue tomado antes y después de la inspección: no hay diferencias.

Toda la información de la demo se construye con **datos ficticios** y se implementaría, cuando se autorice C1, dentro del stack ya existente del portafolio: Next.js `16.4.6`, React `19.3.0`, TypeScript, Tailwind CSS `4.3.3`, `motion` y `lucide-react`. **No se instalarán dependencias nuevas.**

---

## 1. Estado, fuentes de verdad y alcance de C0

### Fuentes de verdad

| Fuente | Uso en este plan |
| --- | --- |
| `Tarea_PBC_Parcial/taquilla-cine-api/pom.xml` y `src/main/java/...` | Versiones reales del backend, controladores, DTOs, repositorios y reglas de negocio. |
| `Tarea_PBC_Parcial/taquilla-cine-db/sql/*.sql` | Esquema, tipos, FK, CHECK e índices. |
| `Tarea_PBC_Parcial/taquilla-cine-web/package.json` y `src/app/**` | Versión real de Angular, rutas, componentes, modelos, validaciones y estilos. |
| Informes y specs del original (`142` pruebas API, `96` specs frontend) | Confirmación de qué reglas estaban realmente cubiertas. |
| `Portafolio_Yeyder/src/data/projects.ts`, `tests/project-presentation.test.ts` | Contrato actual de la tarjeta de Taquilla como “demo pendiente”. |
| `Portafolio_Yeyder/src/components/fiore-demo/**`, `src/data/fiore-demo/**`, `src/lib/fiore-demo/**` | Patrón arquitectónico ya verificado de demo aislada, sin acoplar dominios. |
| `Portafolio_Yeyder/src/lib/route-transition.ts`, `src/components/ui/route-transition-surface.tsx` | Transición suave existente entre portada y Fiore. |

### Límites confirmados

- El portafolio es el repositorio real confirmado por Git; el original es **solo lectura**.
- Hoy solo existe la ruta `/proyectos/fiore/demo`; **no existe** `src/app/proyectos/taquilla-cine/**`.
- `taquillaProject` es `kind: "pending"`, sin `href`, `preview`, `image` ni `actionLabel`.
- `tests/route-transition.test.ts:35` afirma explícitamente que `/proyectos/taquilla-cine/demo` **no** está cubierto por la transición actual.
- Las `86` pruebas del portafolio quedaron en verde en M6.1; la implementación futura debe mantenerlas en verde.
- C0 termina con estos dos documentos. El siguiente paso autorizado sería C1, **no su ejecución inmediata**.

---

## 2. Arquitectura original verificada: backend y base de datos

### 2.1 Stack real

| Elemento | Valor verificado | Evidencia |
| --- | --- | --- |
| Framework | Spring Boot `4.1.1` | `taquilla-cine-api/pom.xml:5-10` |
| Lenguaje | Java `21` | `pom.xml:16-18`; compilador `3.13.0` con `-Xlint:all` |
| Persistencia | **Spring JDBC / `JdbcTemplate`**, no JPA | `pom.xml:24-27`; `README.md:23` excluye Hibernate/JPA |
| Driver | `org.postgresql:postgresql`, scope `runtime`, versión resuelta por el BOM | `pom.xml:28-32` |
| Validación | `spring-boot-starter-validation` | `pom.xml:33-36` |
| Build | Maven Wrapper `3.9.9` | `.mvn/wrapper/maven-wrapper.properties` |
| Configuración | `server.port=${SERVER_PORT:8080}`, `DB_URL`, `spring.sql.init.mode=never`, CORS configurable, actuator solo `health` | `src/main/resources/application.properties` |

> No hay `@Entity`, `@Id`, `@Column`, `@ManyToOne`, `@Query`, cascadas ni secuencias explícitas en Java. Las restricciones viven en los scripts SQL. La versión del servidor PostgreSQL no está declarada en los archivos inspeccionados; el README menciona un driver `42.7+`, pero el build no fija esa versión.

### 2.2 Estructura relevante

```text
taquilla-cine-api/
├── pom.xml
├── docs/API_CONTRACT.md
├── src/main/java/com/taquillacine/api/
│   ├── config/CorsConfig.java
│   ├── controller/{Pelicula,Funcion,Compra,Reporte}Controller.java
│   ├── dto/{Pelicula,Funcion,Compra,DetalleVenta,ReporteVentas}*.java
│   ├── exception/GlobalExceptionHandler.java + 5 excepciones propias
│   ├── model/{Pelicula,Funcion,Compra,DetalleVenta,FuncionConTitulo}.java
│   ├── repository/{Pelicula,Funcion,Compra,Reporte}Repository.java
│   └── service/{Pelicula,Funcion,Compra,Reporte}Service.java
└── src/test/java/com/taquillacine/api/  # 7 clases, 142 @Test
taquilla-cine-db/
└── sql/{01_create_tables.sql,02_constraints_indexes.sql,03_drop_tables.sql}
```

### 2.3 Modelos y esquema

| Tabla / modelo | Campos | Restricciones reales |
| --- | --- | --- |
| `peliculas` / `Pelicula` | `id BIGINT IDENTITY`, `titulo VARCHAR(150)`, `genero VARCHAR(80)`, `duracion_min INTEGER`, `clasificacion VARCHAR(20)` | `NOT NULL`; `CHECK duracion_min > 0`; PK. |
| `funciones` / `Funcion` | `id BIGINT IDENTITY`, `pelicula_id BIGINT`, `fecha DATE`, `hora TIME`, `sala VARCHAR(50)`, `precio NUMERIC(12,2)`, `cupos_totales INTEGER`, `cupos_disponibles INTEGER` | `NOT NULL`; `precio > 0`; `cupos_totales > 0`; `0 <= cupos_disponibles <= cupos_totales`; FK a películas `ON DELETE RESTRICT`. |
| `compras` / `Compra` | `id BIGINT IDENTITY`, `funcion_id BIGINT`, `nombre_cliente VARCHAR(150)`, `cantidad_boletos INTEGER`, `total NUMERIC(12,2)`, `fecha_compra TIMESTAMPTZ` | `NOT NULL`; `cantidad > 0`; `total > 0`; FK a funciones `ON DELETE RESTRICT`. |
| `DetalleVenta` / `FuncionConTitulo` | Proyecciones de solo lectura | `DetalleVenta` conserva el `total` histórico de la compra; no es un precio recalculado. |

Índices: `idx_funciones_pelicula_id`, `idx_compras_funcion_id`, `idx_funciones_fecha`, `idx_compras_fecha_compra`. No hay datos semilla, triggers, `UNIQUE` adicional ni columnas de auditoría.

### 2.4 Endpoints y repositorios

| Método | Ruta | Resultado |
| --- | --- | --- |
| `GET` | `/api/peliculas`, `/api/peliculas/{id}` | `200`; orden por ID ascendente. |
| `POST` | `/api/peliculas` | `201` + `Location`; `@Valid`. |
| `PUT` | `/api/peliculas/{id}` | `200`; reemplaza cuatro campos. |
| `DELETE` | `/api/peliculas/{id}` | `204`; conflicto FK → `409`. |
| `GET` | `/api/funciones`, `/api/funciones/{id}` | `200`; incluye `tituloPelicula`; orden fecha/hora/ID. |
| `POST` / `PUT` / `DELETE` | `/api/funciones[...]` | `201` + `Location` / `200` / `204`; reglas de cupos en servicio. |
| `GET` / `POST` | `/api/compras` | `200` / `201` sin `Location`; orden `fecha_compra DESC, id DESC`. |
| `GET` | `/api/reportes/ventas?fechaDesde=&fechaHasta=` | `200`; rango `ISO.DATE` obligatorio. |

Los repositorios usan SQL explícito. `FuncionRepository.findByIdForUpdate()` aplica `FOR UPDATE`; `descontarCupos()` usa `UPDATE ... WHERE id=? AND cupos_disponibles >= ?`. `ReporteRepository` usa intervalo semiabierto `>= desde` y `< hasta+1`, sin `DATE(fecha_compra)`, para conservar el índice. No hay `GET /api/compras/{id}`, `PUT`, `PATCH` ni `DELETE` de compras.

### 2.5 Pruebas originales del backend

`142` pruebas de integración con PostgreSQL real y guardia de base local (`taquilla_cine_test`):

| Clase | N.º | Cobertura principal |
| --- | ---: | --- |
| `PeliculaControllerIntegrationTest` | 25 | CRUD, validaciones, orden, borrado con funciones → `409`. |
| `FuncionControllerIntegrationTest` | 36 | CRUD, cupos, título vía JOIN, capacidad, cambio de película, borrado con compras. |
| `CompraControllerIntegrationTest` | 31 | Total, cupos, agotadas, orden, rechazo sin efectos, sin manipulación de `total`/fecha. |
| `ReporteControllerIntegrationTest` | 26 | Rango, zona `America/Bogota`, histórico, indicadores, parámetros. |
| `AuditoriaApiIntegrationTest` | 16 | CORS, `Location`, formatos de error, health, 404/405/415. |
| `CompraConcurrenciaIntegrationTest` | 7 | `FOR UPDATE`, cupos nunca negativos, consistencia. |
| `CompraAtomicidadIntegrationTest` | 1 | Reversión completa si falla el descuento. |

---

## 3. Arquitectura original verificada: frontend Angular

### 3.1 Stack real

Declarado en `taquilla-cine-web/package.json`: Angular `^21.2.0`, CLI/@angular/build `^21.2.30`, TypeScript `~5.9.2`, RxJS `~7.8.0`, Vitest `^4.0.8`, jsdom `^28.0.0`, npm `12.2.0`. Instalado efectivamente: Angular `21.2.26`, CLI `21.2.30`, TypeScript `5.9.3`, RxJS `7.8.2`, Vitest `4.1.12`. **No hay** PrimeNG, Material, Bootstrap, Tailwind ni librería de iconos: CSS propio e SVG inline.

### 3.2 Navegación y módulos

`app-routing.module.ts` redirige `''` a `peliculas` y carga con `loadChildren` los módulos `peliculas`, `funciones`, `compras` y `taquilla`. No hay guards, interceptores, login ni sesión. El shell usa `<aside class="sidebar">`, enlace `Saltar al contenido principal`, `<main id="contenido" tabindex="-1">` y footer con `Proyecto académico · Programación Basada en Componentes`.

| Módulo | Interfaz observada |
| --- | --- |
| Películas | Cabecera `Catálogo`; formulario inline, tabla `Cartelera registrada`, detalle `<dl class="fichas">`, confirmación de borrado **inline en la fila**. |
| Funciones | Formulario con película/fecha/hora/sala/precio/cupos; bloque `.info-edicion` con totales, disponibles y vendidos; tabla de 9 columnas; `cuposDisponibles` nunca se envía. |
| Compras | Select de funciones con `(AGOTADA)` y `(POCOS)`; panel `.info-funcion`; `.total-estimado` azul; tabla de compras; sin editar/eliminar/devolver. |
| Taquilla | Filtros `fechaDesde`/`fechaHasta`, botón `Hoy`, KPIs `Compras`, `Boletos vendidos`, `Total recaudado`, tabla de detalle. |

### 3.3 Modelos y comunicación

`environment.apiUrl` centraliza la base HTTP (sin valores sensibles reproducidos). Servicios: `PeliculaService`, `FuncionService`, `CompraService`, `ReporteService`, con los mismos 13 endpoints del backend. Los modelos marcan contractualmente que `cuposDisponibles`, `total` y `fechaCompra` son calculados por el servidor. `ValidationErrorResponse.errores` puede sobrescribir los mensajes locales.

### 3.4 Validaciones literales que conviene conservar como regla, no como texto copiado

- Película: título/género/clasificación obligatorios, sin solo espacios, máximos `150/80/20`; duración entera `1..2147483647`.
- Función: `YYYY-MM-DD` real, `HH:mm`, sala ≤ `50`, precio `> 0` con máximo dos decimales y límite `9999999999.99`, cupos `1..2147483647`.
- Compra: función obligatoria, cliente ≤ `150`, cantidad entera `> 0`, comparación local `cantidad > cuposDisponibles`.
- Taquilla: fechas obligatorias y `fechaDesde <= fechaHasta`; mensaje `La fecha inicial no puede ser posterior a la fecha final.`.
- No hay validación de fechas futuras ni de solapamiento de salas; esas reglas **no existen** originalmente y no deben inventarse como implementadas.

### 3.5 Pruebas del frontend

`96` specs con Vitest + TestBed. Cobertura: app shell (2), películas (5), formulario película (9), funciones (18), formulario función (14), compras (31), taquilla (17). Dos specs de compras son placeholders marcados como pendientes. No se ejecutaron en C0.

---

## 4. Funcionalidades reales frente a mejoras opcionales

| Funcionalidad | Estado real en el original | Tratamiento en la futura demo |
| --- | --- | --- |
| Alta, consulta, edición y borrado de películas | Implementado y probado (`25` pruebas). | Simular CRUD local; borrado bloqueado si existen funciones. |
| Alta, consulta, edición y borrado de funciones | Implementado y probado (`36` pruebas). | Simular con `cuposDisponibles` derivado; conservar reglas de capacidad y película con compras. |
| Registro de compras con descuento de cupos | Implementado y probado (`31` pruebas). | Reducer atómico local; sin pago, cliente real ni fecha del sistema durante render. |
| Reporte de ventas por rango de fechas | Implementado y probado (`26` pruebas). | Selector puro sobre compras ficticias; zona demo fija y rango inclusivo. |
| API REST consumida por Angular | Implementada; 13 endpoints. | **No reproducir**: sin `fetch`, servidor ni puerto. |
| Cálculo del total en servidor con `BigDecimal` | Implementado. | Reproducir como cálculo puro en centavos, etiquetado como simulación. |
| Concurrencia `FOR UPDATE` y atomicidad transaccional | Implementada y probada. | No reproducible en demo local; documentar como límite, no simular falsamente. |
| Autenticación, roles, paginación, exportación, devoluciones, fechas futuras, solapes de sala | **No implementados**. | No añadir. Solo mencionarlos como mejoras opcionales fuera de alcance. |
| Persistencia local versionada, reinicio y datos ficticios | No existen en el original; patrón ya verificado en Fiore del portafolio. | Sí aplicar como patrón del portafolio, no como funcionalidad del sistema académico. |

---

## 5. Reglas de negocio extraídas y diferencias detectadas

### Reglas verificadas que la demo debe respetar

1. Al crear una función, `cuposDisponibles = cuposTotales`.
2. El cliente no envía ni manipula `cuposDisponibles`.
3. Al editar capacidad: `disponibles = nuevosTotales - vendidos`, donde `vendidos = totalesActuales - disponiblesActuales`.
4. No se puede reducir `cuposTotales` por debajo de los boletos ya vendidos.
5. No se puede cambiar la película de una función con compras registradas.
6. No se puede eliminar una función con compras; no se puede eliminar una película con funciones.
7. `total = precio × cantidad`, con escala `2` y redondeo `HALF_UP`; límite `9999999999.99`.
8. Una compra rechazada por cupos no inserta registro ni descuenta cupos.
9. Una función con `cuposDisponibles === 0` se muestra agotada y no admite compra.
10. El reporte usa `compras.total` histórico, no el precio actual de la función.
11. El rango de reporte es inclusivo en `America/Bogota` y se convierte a intervalo semiabierto.
12. Los indicadores del reporte se derivan de la misma lista que el detalle.
13. Sin ventas: `0` compras, `0` boletos, `0.00` total y tabla vacía con estado claro.
14. Todas las operaciones son auditables en el original mediante errores HTTP controlados; la demo debe mostrar errores comprensibles sin SQL ni trazas.

### Diferencias reales entre capas

- El backend es JDBC, no JPA; las relaciones y constraints están en SQL.
- La DB garantiza `0 <= disponibles <= totales`, pero **no** garantiza por constraint que `disponibles = totales - vendidos`; eso lo mantiene el servicio.
- El handler traduce mensajes buscando literalmente los nombres de FK; si cambiaran, caería al mensaje genérico.
- `PeliculaService.eliminar()` depende solo de la FK; `FuncionService.eliminar()` hace pre-chequeo con bloqueo y además confía en la FK.
- El frontend valida formato y límites numéricos, pero la autoridad final es el backend: `409` y `ValidationErrorResponse` pueden sobrescribir mensajes locales.
- El frontend calcula `totalEstimado`, pero la plantilla aclara que el total oficial lo calcula el servidor.
- CORS y el informe de auditoría difieren en la forma de referir el host local (`localhost:4200` frente a `[::1]:8080`); no se copiará ninguna URL sensible a la demo.

---

## 6. Diseño visual e identidad reconocible

La demo debe conservar la identidad del **sistema académico de cine**, adaptada a React, sin convertirla en un dashboard genérico ni mezclarla con el glassmorphism del portafolio.

| Token original | Valor | Uso previsto en la demo |
| --- | --- | --- |
| `--color-menu` | `#1e293b` | Sidebar azul marino. |
| `--color-fondo` | `#f8fafc` | Fondo general interno. |
| `--color-superficie` | `#ffffff` | Paneles, tablas y campos. |
| `--color-primario` / oscuro | `#2563eb` / `#1d4ed8` | Acciones, activo de menú, foco. |
| `--color-texto` / suave | `#1e293b` / `#64748b` | Jerarquía tipográfica. |
| `--color-borde` | `#e2e8f0` | Bordes de paneles y tablas. |
| `--color-exito` / error | `#15803d` / `#dc2626` | Dinero en reportes y errores. |
| `--color-primario-suave` | `#eff6ff` | Panel de total estimado e información. |

Elementos que deben reconocerse:

- Sidebar con icono de película, marca `Taquilla de Cine` y etiqueta `Administración` → en la demo, `Demostración`.
- Menú de cuatro secciones con iconos SVG lineales: `Películas`, `Funciones`, `Compras`, `Taquilla`.
- `PageHeader` con etiqueta en mayúsculas azul, `<h1>` grande y descripción ≤ `70ch`.
- Paneles blancos con borde claro y sombra mínima; cabecera que separa título, nota y acciones.
- Botones con icono y variantes azul/gris/editar/eliminar/peligro.
- Tablas con cabecera upper-case, IDs monoespacio, precios COP a la derecha y acciones por fila.
- Confirmación **inline en rojo dentro de la fila**, no modal: `¿Eliminar «…»?`, `Sí, eliminar`, `Cancelar`.
- Tarjetas `<dl class="fichas">` para detalle; cupos vendidos/disponibles en azul.
- Panel azul claro `Total estimado` y avisos `(AGOTADA)` / `(POCOS)`.
- Trío de KPIs de taquilla con el total en verde.
- Estados vacíos centrados con SVG grande, cargadores circulares y mensajes con `role="status"` / `role="alert"`.
- Footer académico y enlace de salto al contenido; foco visible azul; `prefers-reduced-motion`.

Fuera de la demo se mantiene el tema oscuro glass del portafolio. Dentro se usan variables locales prefijadas (`--taquilla-*`) en un CSS Module propio; **no se modifica** `src/app/globals.css`.

---

## 7. Componentes del portafolio, reutilización y dependencias a evitar

| Elemento | Auditoría | Uso previsto |
| --- | --- | --- |
| `src/lib/utils.ts` (`cn`) | Puro; sin red, `window`, env ni efectos. | Reutilizable. |
| `lucide-react` | Ya instalado; sin red. | Reutilizable: `Film`, `CalendarDays`, `Ticket`, `ChartNoAxesColumn`, `RotateCcw`, `ArrowLeft`, `Search`, `Plus`, etc. |
| `ProjectBrowserPreview` | Mini navegador con enlace externo real. | **No reutilizar dentro**: sirve solo como referencia para un marco decorativo propio sin enlace. |
| `ProjectShowcase` / `projects-carousel.tsx` | Presentación y carrusel actuales. | Permanecen fuera; solo se conectan al final mediante datos, no reconstruyendo la tarjeta. |
| `GlassCard`, `Button`, `Badge`, `TechTag` | Primitivas con tokens del portafolio. | No usar con estilos por defecto dentro de Taquilla; crear primitivas locales. |
| Fiore demo (`src/components/fiore-demo`, `src/data/fiore-demo`, `src/lib/fiore-demo`) | Demo aislada ya verificada. | Replicar la **forma**, nunca importar módulos ni reutilizar su storage key. |

### Prohibiciones para la implementación futura

- No crear otra app Next.js/Angular, backend Spring Boot, PostgreSQL, servidor ni puerto exclusivo.
- No añadir dependencias: ni `zod`, ni ORM, ni librerías UI, ni clientes HTTP nuevos.
- No usar `fetch` a `/api/*`, `process.env`, `.env`, credenciales, cookies, tokens ni sesión.
- No importar rutas del proyecto original ni copiar binarios, capturas o datos reales.
- No iniciar migraciones, servicios ni bases de datos; no ejecutar `03_drop_tables.sql`.
- No modificar Fiore, ElectroTero, `layout.tsx`, `page.tsx`, `globals.css`, carrusel, presentaciones ni transiciones existentes sin autorización específica.

---

## 8. Arquitectura propuesta de la demo React/TypeScript

```text
src/app/proyectos/taquilla-cine/demo/page.tsx
src/components/taquilla-cine-demo/
├── TaquillaDemo.tsx                 # "use client": orquestador
├── TaquillaDemoFrame.tsx            # Marco, etiqueta de demo, volver y reiniciar
├── TaquillaSidebar.tsx              # Navegación interna por estado
├── TaquillaPeliculasView.tsx
├── TaquillaFuncionesView.tsx
├── TaquillaComprasView.tsx
├── TaquillaReportesView.tsx
├── TaquillaPeliculaDialog.tsx
├── TaquillaFuncionDialog.tsx
├── TaquillaCompraDialog.tsx
├── TaquillaDeleteConfirmDialog.tsx
├── TaquillaResetDialog.tsx
├── taquilla-navigation.ts
├── taquilla-form-utils.tsx
└── taquilla-demo.module.css
src/data/taquilla-cine-demo/
├── types.ts
└── seed.ts
src/lib/taquilla-cine-demo/
├── pricing.ts
├── validation.ts
├── reducer.ts
├── selectors.ts
├── storage.ts
├── peliculas-view.ts
├── funciones-view.ts
├── compras-view.ts
└── reportes-view.ts
tests/taquilla-demo-*.test.ts
```

**Flujo de datos previsto**

```text
seed.ts (datos ficticios)
  → useReducer(acciones puras)
  → validation.ts (puerta de cada mutación)
  → selectors.ts + *-view.ts (KPIs, filtros, orden, reportes)
  → vistas React
  → storage.ts (localStorage versionado, solo tras hidratación)
```

- `page.tsx` sería un Server Component delgado con `metadata` neutral y `<TaquillaDemo />`.
- La navegación interna cambia de vista con estado local; **no se crean rutas hijas**.
- No se crearán Route Handlers, Server Actions, middleware ni carpetas `api/`.
- La vista activa, búsquedas, filtros, diálogos y errores no se persisten.
- Los totales se derivan en cada render; nunca se guardan resultados calculados.

---

## 9. Modelo de datos, datos ficticios y cálculos puros

### 9.1 Tipos previstos

```ts
export type TaquillaDemoView = "peliculas" | "funciones" | "compras" | "taquilla";
export type TaquillaDialog =
  | { kind: "pelicula"; id?: string }
  | { kind: "funcion"; id?: string }
  | { kind: "compra" }
  | { kind: "delete"; entity: "pelicula" | "funcion"; id: string }
  | { kind: "reset" }
  | null;

export interface DemoPelicula {
  id: string;                 // demo-pel-*
  titulo: string;
  genero: string;
  duracionMin: number;        // entero 1..2147483647
  clasificacion: string;
}

export interface DemoFuncion {
  id: string;                 // demo-fun-*
  peliculaId: string;
  fecha: string;              // YYYY-MM-DD, texto estable
  hora: string;               // HH:mm, texto estable
  sala: string;
  precioCentavos: number;     // entero COP centavos, <= 999999999999
  cuposTotales: number;
  cuposDisponibles: number;   // derivado, nunca editable directamente
}

export interface DemoCompra {
  id: string;                 // demo-com-*
  funcionId: string;
  nombreCliente: string;      // "Cliente Demo A", etc.
  cantidadBoletos: number;
  totalCentavos: number;
  fechaCompra: string;        // ISO con offset -05:00, generado por acción del cliente
}

export interface TaquillaDemoState {
  version: 1;
  peliculas: DemoPelicula[];
  funciones: DemoFuncion[];
  compras: DemoCompra[];
}
```

`DEMO_STATE_VERSION = 1` y `DEMO_TODAY = "2026-11-25"` serían constantes del seed. **No se usa `new Date()` ni `Date.now()` durante el render inicial**: eso evita diferencias entre servidor y cliente. La fecha de una compra se genera en el manejador del evento y viaja en la acción; el reducer permanece puro.

### 9.2 Dataset semilla variado y coherente

| Grupo | Cantidad | Casos incluidos |
| --- | ---: | --- |
| Películas | 6 | Géneros, duraciones y clasificaciones distintos; una sin funciones para permitir borrado; una con funciones para bloquearlo. |
| Funciones | 9 | Una agotada (`cuposDisponibles = 0`), dos con pocos cupos (`<= 5`), una sin compras (editable/eliminable), fechas repartidas entre `2026-11-25` y `2026-11-30`, salas `1`–`4`. |
| Compras | 8 | Clientes `Demo A`–`Demo H`, cantidades `1`, `2`, `3`, `4`, `5`, precios con dos decimales, fechas dentro y fuera del rango por defecto. |

Ejemplo de coherencia que debe validar el seed: una función con `precioCentavos = 2200000`, `cuposTotales = 3` y una compra de `3` boletos por `6600000` centavos tiene `cuposDisponibles = 0`. Para cada función, `cuposDisponibles` debe igualar `cuposTotales - suma(cantidadBoletos de sus compras)`.

### 9.3 Casos de error previstos en la demo

- Título, género, clasificación, sala o cliente vacíos o solo espacios.
- Longitudes excedidas (`150`, `80`, `50`, `20`).
- Duración/cupos/cantidad `0`, negativos, decimales o mayores al límite `INTEGER`.
- Precio `0`, negativo, con más de dos decimales o sobre `9999999999.99`.
- Fecha con formato inválido o inexistente; hora fuera de `HH:mm`.
- Compra mayor que cupos disponibles; función agotada.
- Intento de borrar película con funciones o función con compras.
- Reducir cupos por debajo de vendidos; cambiar película con compras.
- Rango de reporte invertido, fechas vacías y rango sin ventas.
- Estado persistido corrupto, de otra versión o con referencias rotas.

### 9.4 Cálculos puros

- `totalCentavos = precioCentavos × cantidadBoletos`; validar contra `999999999999`.
- `vendidos = cuposTotales - cuposDisponibles`.
- `cuposDisponibles` tras edición `= nuevosCuposTotales - vendidos`.
- Reporte: filtrar compras por `fechaCompra` dentro de `[fechaDesde 00:00 -05:00, fechaHasta+1 00:00 -05:00)`.
- Indicadores: `cantidadCompras = compras.length`, `totalBoletos = sum(cantidadBoletos)`, `totalRecaudado = sum(totalCentavos)`.
- Formato COP con `Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" })` desde centavos; fechas se almacenan como texto estable y se muestran con formato determinista.

---

## 10. Persistencia local versionada y estrategia contra errores de hidratación

Clave independiente: `yeyder.taquilla-cine.demo.v1`. **No reutilizar** `yeyder.fiore.demo.v1` ni la compuerta `hydrationResolved` de Fiore.

### Secuencia obligatoria

1. **Primer render determinista:** `useReducer(reducer, undefined, createSeedState)`. Servidor y cliente producen exactamente el mismo DOM. No se lee `localStorage` durante render, no se usa `new Date()` y no se consulta `window`.
2. **Estado de UI inicial fijo:** vista `"peliculas"`, sin diálogos, sin búsquedas, sin avisos.
3. **Efecto de hidratación:** tras el montaje, `loadDemoState()` hace `getItem` en `try/catch`, parsea JSON y valida `version === 1`, formas, ids únicos, referencias, prefijos `demo-*`, cupos coherentes y totales calculados. Si está vacío/corrupto/antiguo, elimina solo esa clave y mantiene el seed; si es válido, despacha `HYDRATE`.
4. **Compuerta de escritura:** un módulo propio expone `isDemoHydrationResolved()`. `saveDemoState()` no escribe hasta que la lectura se haya resuelto, incluso si no había datos. Así se evita sobrescribir una clave válida con el seed antes de leerla.
5. **Efecto de persistencia:** solo sobre el estado de dominio, con `JSON.stringify` en `try/catch`. Si `localStorage` está bloqueado o lanza cuota excedida, la demo sigue funcionando en memoria y no se exponen detalles sensibles en consola.
6. **Reinicio:** confirmación accesible → `clearDemoState()` → despachar `RESET` con `createSeedState()` → volver a `"peliculas"` → cerrar diálogos y limpiar búsquedas → aviso `Demo reiniciada con los datos ficticios iniciales.`.
7. **No persistir:** vista activa, filtros, orden, diálogos, errores de validación ni preferencias del usuario.

### Verificación anti-hidratación planeada

- Cargar la ruta con `localStorage` vacío, con estado válido, con JSON corrupto y con `version: 0`; en los cuatro casos el primer HTML debe coincidir con el seed y no debe haber `hydration mismatch`.
- Simular `localStorage` bloqueado y confirmar que la demo siga operativa en memoria.
- Recargar después de una compra: cupos y compra persisten; reiniciar: vuelve al seed exacto.

---

## 11. Integración controlada con la tarjeta y las transiciones

### Estado actual que debe conservarse

`src/data/projects.ts:268-296` define `taquillaProject` como `PendingProject`, con `status: "Demo pendiente"` y nota explícita de que no existe demostración pública. `tests/project-presentation.test.ts:74-92` verifica ausencia de `action`, `preview` e `image` y que las `features` digan «proyecto original» o «frontend original». El carrusel ya maneja tres proyectos y el foco; la tarjeta no debe reconstruirse.

### Regla de activación

**No habilitar el botón de demo, cambiar `kind` a `"demo"` ni añadir `href` hasta que la ruta `/proyectos/taquilla-cine/demo` exista, cargue y esté verificada.** El orden seguro es C1→C6 en aislamiento, verificación completa, y solo entonces la conexión controlada de C7.

### Transición suave sin romper el contrato actual

Hoy `ROUTE_TRANSITION_PATHS = ["/", "/proyectos/fiore/demo"]` y `isRouteTransitionPath()` solo acepta esas rutas. La prueba `tests/route-transition.test.ts:35` exige que Taquilla devuelva `false`. Por ello se recomienda **no cambiar** esa función ni su prueba:

- Mantener `ROUTE_TRANSITION_PATHS` y `isRouteTransitionPath()` intactos.
- Añadir un grupo lógico separado, por ejemplo `TAQUILLA_DEMO_PATHS = ["/", "/proyectos/taquilla-cine/demo"]` y un predicado `getTransitionGroup(pathname)` que devuelva `fiore`, `taquilla` o `null`.
- La superficie usa el grupo para permitir únicamente portada ↔ demo correspondiente; Fiore ↔ Taquilla queda excluido.
- `shouldAnimateInternalNavigation()` conserva su firma y comportamiento por defecto, de modo que las `86` pruebas actuales sigan pasando; las nuevas comprobaciones se agregan como pruebas nuevas.
- Conservar `data-no-route-transition`, la interceptación en captura, el respeto a `prefers-reduced-motion`, `key={pathname}` y `data-route-surface`.

Cuando se habilite, `taquillaProject` pasaría a `DemoProject` con `actionLabel: "Explorar demo"` y `href: "/proyectos/taquilla-cine/demo"`; la nota debe distinguir el stack original (`Angular 21`, `Spring Boot`, `Java`, `PostgreSQL`) del stack de la demo (`React`, `TypeScript`, datos ficticios). `project-presentation.test.ts` se actualizaría de forma intencional en el mismo bloque, sin eliminar pruebas.

---

## 12. Plan por bloques C1–C7, riesgos y recomendación final

### 12.1 Matriz resumida

| Bloque | Objetivo | Depende de | Puerta de verificación |
| --- | --- | --- | --- |
| **C1** | Contrato de datos, seed y cálculos puros | Ninguno | Tipos compilan; seed coherente; sin imports del original. |
| **C2** | Reducer, validación, selectores y storage | C1 | Pruebas puras en verde; errores y reinicio cubiertos. |
| **C3** | Ruta, marco, navegación y diálogo de reinicio | C2 | Ruta carga; etiqueta de demo visible; responsive sin overflow. |
| **C4** | Películas | C1–C3 | CRUD simulado; borrado bloqueado con funciones. |
| **C5** | Funciones y cupos | C4 | Reglas de capacidad, película con compras y agotadas. |
| **C6** | Compras y taquilla/reportes | C2, C4, C5 | Total, descuento, KPIs y rango funcionan; errores visibles. |
| **C7** | Hidratación fina, accesibilidad, integración y cierre | C1–C6 | 86 pruebas + nuevas en verde; CTA solo si todo pasa. |

### 12.2 C1 — Contrato, semilla y cálculos

- **Archivos:** `src/data/taquilla-cine-demo/types.ts`, `seed.ts`, `src/lib/taquilla-cine-demo/pricing.ts`, `tests/taquilla-demo-b1.test.ts`.
- **Funcionalidades:** constantes `DEMO_STATE_VERSION`, `DEMO_TODAY`; `createSeedState()` con copias frescas; 6 películas, 9 funciones, 8 compras; formato COP y conversión a centavos.
- **Reglas:** IDs `demo-*`; ningún dato real; coherencia `cuposDisponibles = totales - vendidos`; totales históricos correctos; sin `Date.now()` en el seed.
- **Pruebas:** seed válido, copias independientes, formatos, totales y límites `NUMERIC(12,2)`/`INTEGER`.
- **Aceptación:** `tsc` y pruebas nuevas en verde; ninguna importación desde `Tarea_PBC_Parcial`.

### 12.3 C2 — Reducer, validación, selectores y almacenamiento

- **Archivos:** `validation.ts`, `reducer.ts`, `selectors.ts`, `storage.ts`, `peliculas-view.ts`, `funciones-view.ts`, `compras-view.ts`, `reportes-view.ts`, `tests/taquilla-demo-b2.test.ts`.
- **Funcionalidades:** `applyDemoAction()` con `{ state, changed, error? }`; acciones `HYDRATE`, `RESET`, altas/ediciones/borrados y `REGISTRAR_COMPRA`; validadores con `{ ok, value | issues }`; selectores de KPIs y reporte; helpers de búsqueda/filtro/orden.
- **Reglas:** todas las de la sección 5; `RESET` devuelve `createSeedState()`; `saveDemoState()` bloqueado hasta hidratación; clave `yeyder.taquilla-cine.demo.v1`.
- **Pruebas:** cada mensaje de error, cupos insuficientes, borrados bloqueados, rango invertido, storage vacío/corrupto/antiguo/bloqueado, reinicio.
- **Aceptación:** ninguna mutación rodea `applyDemoAction()`; el estado inválido nunca entra al reducer sin validación; almacenamiento aislado de Fiore.

### 12.4 C3 — Marco, ruta y navegación

- **Archivos:** `src/app/proyectos/taquilla-cine/demo/page.tsx`, `TaquillaDemo.tsx`, `TaquillaDemoFrame.tsx`, `TaquillaSidebar.tsx`, `taquilla-navigation.ts`, `TaquillaResetDialog.tsx`, `taquilla-demo.module.css`.
- **Funcionalidades:** metadata neutral; etiqueta visible `Demostración · datos ficticios`; botón `Volver al portafolio`; botón `Reiniciar demo`; menú de cuatro secciones; drawer móvil accesible.
- **Reglas:** primer render con seed; sin `window`/`localStorage` en render; sin enlaces a rutas privadas; tokens locales `--taquilla-*`; `prefers-reduced-motion`.
- **Pruebas:** humedad de ruta renderizada, navegación por estado, diálogo con Escape/foco/restauración, responsive 375–1440 px.
- **Aceptación:** la ruta carga directamente; no aparece CTA en la tarjeta todavía; 0 errores de consola; sin overflow horizontal.

### 12.5 C4 — Películas

- **Archivos:** `TaquillaPeliculasView.tsx`, `TaquillaPeliculaDialog.tsx`, `TaquillaDeleteConfirmDialog.tsx`, `taquilla-form-utils.tsx`, `tests/taquilla-demo-b4.test.ts`.
- **Funcionalidades:** tabla `Cartelera registrada`, búsqueda local, alta/edición inline o diálogo propio, detalle `<dl>`, confirmación inline de borrado en rojo.
- **Reglas:** longitudes y obligatorios del original; duración entera positiva; borrado bloqueado si existen funciones referenciadas; mensajes sin SQL.
- **Pruebas:** alta, edición, borrado permitido y bloqueado, espacios, longitudes, duración `0`/decimal, estado vacío y foco.
- **Aceptación:** la interfaz se reconoce como el módulo original adaptado; no hay `fetch`; el contador de películas se deriva del estado.

### 12.6 C5 — Funciones y cupos

- **Archivos:** `TaquillaFuncionesView.tsx`, `TaquillaFuncionDialog.tsx`, `tests/taquilla-demo-b5.test.ts`.
- **Funcionalidades:** formulario de seis campos, bloque de información en edición, tabla de 9 columnas, fichas de detalle, avisos `(AGOTADA)`/`(POCOS)`, borrado inline.
- **Reglas:** `cuposDisponibles` inicializado igual a totales; nunca enviado desde el formulario; conservar vendidos al editar; no reducir bajo vendidos; no cambiar película con compras; no borrar con compras.
- **Pruebas:** creación, edición, recálculo, errores de fecha/hora/sala/precio/cupos, agotada, conflicto y coherencia tras rechazo.
- **Aceptación:** la tabla y los cupos coinciden con el seed y con las reglas verificadas; no se inventan fechas futuras ni solapes.

### 12.7 C6 — Compras y reportes de taquilla

- **Archivos:** `TaquillaComprasView.tsx`, `TaquillaCompraDialog.tsx` (o formulario inline), `TaquillaReportesView.tsx`, `tests/taquilla-demo-b6.test.ts`.
- **Funcionalidades:** select de funciones con disponibilidad, panel de precio y cupos, total estimado azul, registro atómico local, tabla de compras; filtros de fecha, KPIs y detalle de ventas.
- **Reglas:** total en centavos; `fechaCompra` provista por la acción del cliente; compra rechazada sin cambios; reporte con rango inclusivo fijo y total histórico; aviso visible de datos ficticios.
- **Pruebas:** total, descuento, agotada, cantidad mayor a cupos, cliente inválido, rango invertido, sin ventas, indicadores derivados del detalle.
- **Aceptación:** una compra actualiza cupos, tabla y KPIs en el mismo render; reinicio restaura todo; no hay pago real ni fecha del sistema en el render inicial.

### 12.8 C7 — Hidratación fina, accesibilidad, integración y cierre

- **Archivos:** ajustes en los módulos anteriores; `tests/taquilla-demo-b7.test.ts`; `tests/route-transition.test.ts` (nuevas aserciones preservando las 4 existentes); `src/data/projects.ts` y `tests/project-presentation.test.ts` **solo al final**; `docs/taquilla-cine-demo-plan.md` e informe de fase.
- **Funcionalidades:** verificación de hidratación en cuatro escenarios de storage; trap de foco y ARIA en diálogos; transición por grupos; CTA desde la presentación ampliada; capturas de evidencia.
- **Reglas:** las `86` pruebas actuales siguen en verde; el CTA se activa solo después de verificar la ruta; Fiore y ElectroTero intactos; sin commits/push/deploy.
- **Pruebas:** `npm run test:b0`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, revisión en navegador a 1440/768/390 px y verificación de 0 errores de consola.
- **Aceptación:** ruta funcional, transición suave portada ↔ Taquilla, sin transición Fiore ↔ Taquilla, proyecto original inmutable, integridad visual y documentación actualizada.

> Los archivos nuevos de pruebas deben declararse en `tsconfig.b0-tests.json` y en el script `test:b0` de `package.json`; de lo contrario `node --test` no los ejecutará. El listado actual contiene nueve archivos y `86` pruebas.

### 12.9 Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Confundir demo con sistema real | Etiqueta permanente, nombres `Demo-*`, clientes `Cliente Demo A–H`, nota que separa ambos stacks. |
| `hydration mismatch` | Seed determinista, lectura solo en `useEffect`, fechas como texto, compuerta de escritura. |
| Colisión con Fiore | Clave y módulo storage propios; sin importación de módulos Fiore. |
| Romper 86 pruebas | No alterar `isRouteTransitionPath` ni los cuatro tests de transición; ampliar con predicado por grupos y pruebas nuevas. |
| Enlace a ruta inexistente | Mantener `kind: "pending"` hasta C7; activar CTA solo con ruta verificada. |
| Dashboard genérico o estilo mezclado | Tokens `--taquilla-*`, sidebar azul, tablas y confirmación inline del original; glass solo fuera. |
| Datos incoherentes | Validador de seed que compare compras contra cupos y recalcule totales. |
| Dependencias/secretos | Sin instalaciones, sin `fetch`, sin `process.env`, sin `.env`, sin importaciones al original. |
| Reglas inventadas | No añadir autenticación, devoluciones, fechas futuras, solapes ni exportación; separar “implementado” de “opcional”. |
| Regresión en carrusel/foco | No reconstruir tarjeta; cambiar solo datos de proyecto al final y ejecutar toda la suite. |

### 12.10 Recomendación final

Ejecutar C1 exactamente como bloque fundacional, sin tocar UI ni enrutamiento, y avanzar solo con autorización explícita. La demo debe ser una reimplementación local y didáctica de las reglas verificadas del proyecto académico, no una réplica de su infraestructura. El cierre correcto de C0 es este documento y el informe `M7_C0_Taquilla_Analisis_INFORME.md`; **C1 no está iniciado**.
