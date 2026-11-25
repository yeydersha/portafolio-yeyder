# M4.2A — Plan aislado para la demo interactiva de Fiore

> Estado: **solo análisis y documentación**. No se ha implementado la demo, no se han modificado componentes del portafolio, no se ha tocado el proyecto original de Fiore, no se han hecho commits ni push, y no se ha conectado con bases de datos, APIs reales, credenciales ni servicios externos.

La inspección se realizó en modo solo lectura sobre `C:\Users\pc\Downloads\proyectos_No Tocar\Proyecto_fiora\fiore`. Se revisaron archivos de código y configuración no sensible (`package.json`, `src/app/globals.css`, `src/app/layout.tsx`, componentes de layout/UI, tipos, cálculos, validaciones y páginas visibles). **No se abrió, copió ni transfirió ningún archivo `.env`, clave, token ni secreto.** Toda la información incluida aquí es estructural o de diseño; no contiene datos reales de clientes, proveedores, ventas ni resultados comerciales.

---

## 1. Estructura visual

La demo debe comportarse como una **ventana dentro del portafolio**, no como una página nueva del sistema real:

- **Fuera (portafolio):** se conserva el tema oscuro glassmorphism existente: fondo `#0a0a0f`, superficies translúcidas, borde `rgba(255,255,255,0.05)`, acento `#00d4aa`, tipografía Inter y foco visible definido en `src/app/globals.css`.
- **Dentro (Fiore):** se reproduce la identidad joyera original sin teñirla con los tokens del portafolio:
  - Sidebar vino profundo `#500014` (`wine-950`), con activos en `#722f40` (`wine-900`).
  - Acentos `#c4384a` / `#d65062` (`wine-600/500`) y marfil rosado `#fcece9` (`blush-100`).
  - Superficies claras cálidas tipo `warm-white`, diagonales suaves, tarjetas blancas con borde beige y sombras discretas.
  - Inter como familia tipográfica, coherente con ambos proyectos.

**Estructura propuesta de la pantalla demo:**

1. **Marco exterior del portafolio**
   - Encabezado editorial con título `Fiore — Demo interactiva`.
   - Etiqueta visible: `Demostración · datos ficticios`.
   - Enlace «Volver al portafolio» y botón «Reiniciar demo».
   - Marco de navegador decorativo con tres puntos y texto `fiore · demo local`. **Sin enlace externo**, para no confundirlo con la vista estática de ElectroTero.

2. **Cabecera interna de Fiore**
   - Logotipo/wordmark propio de la demo, reutilizando únicamente la Idea visual observada (tipografía serif delicada + acento floral). No se copiará un binario desde el directorio original.
   - Subtítulo: `Gestión de inventario joyería — simulación local`.

3. **Sidebar interno**
   - Solo secciones seguras: `Dashboard`, `Inventario`, `Categorías`, `Proveedores`, `Movimientos`, `Reportes`.
   - Se omite cualquier sección de configuración, acceso, usuarios o administración.
   - En móvil: drawer con botón «Abrir menú» / «Cerrar menú», mismo patrón de overlay del original pero sin `useAuth`.

4. **Área de contenido**
   - `Dashboard`: tarjetas KPI y paneles de stock bajo, agotados, recientes y mayor ganancia.
   - `Inventario`: tabla buscable/filtrable, badges de stock y acciones simuladas.
   - `Categorías` / `Proveedores`: listas con contadores derivados.
   - `Movimientos`: historial filtrable y paginado localmente.
   - `Reportes`: resumen y tabla exportable a CSV ficticio.

El aislamiento visual se logra con un CSS Module propio (por ejemplo `fiore-demo.module.css`) y variables locales prefijadas (`--fiore-wine-*`, `--fiore-blush-*`, `--fiore-cream`, `--fiore-ink`). **No se modificarán los tokens globales ni `globals.css` del portafolio.**

---

## 2. Funcionalidades simulables

Todas las operaciones son puramente locales y se explican como simulación:

| Funcionalidad | Comportamiento demo | Límite explícito |
|---|---|---|
| Dashboard | Calcula KPIs desde los productos ficticios: productos, unidades, valor a costo, valor potencial de venta, ganancia bruta potencial y stock bajo. | La ganancia es una **proyección**, no ingreso recibido. |
| Alertas de stock | Lista productos con `stock <= 5` y `stock === 0`. | No dispara correos ni notificaciones. |
| Inventario | Búsqueda por nombre/SKU, filtro por categoría y estado, orden local y badges de stock. | No consulta inventario real. |
| Alta / edición de producto | Formulario con SKU, nombre, categoría, material, color, proveedor demo, costo, stock, margen y precio manual opcional. | Validación local ligera; sin envío a servidor. |
| Calculadora de precios | Recalcula precio sugerido, ganancia por unidad, ganancia total y margen real al cambiar costo/margen/stock. | Lógica reescrita localmente, sin importar el módulo original. |
| Movimientos | Registra entradas, salidas, ajustes y devoluciones simuladas; actualiza stock y agrega fila al historial. | No usa `payment_method`, clientes ni comprobantes. |
| «Venta» simulada | Se modela como una **salida de stock etiquetada como venta demo**, sin identificación de cliente ni pago. | Nunca se presenta como transacción real. |
| Categorías | Contadores de productos por categoría y alta local de categoría ficticia. | Sin persistencia remota. |
| Proveedores | Lista de proveedores ficticios y alta local. | Sin teléfono, correo, dirección ni datos de contacto reales. |
| Reportes | Tabla con totales derivados y exportación CSV de los datos ficticios. | Aviso visible: «Valores proyectados; no representan ventas efectuadas». |
| Reinicio | Restaura el dataset semilla y limpia la clave de almacenamiento local. | No afecta ningún sistema externo. |

La navegación interna debe cambiar de vista con estado local (`useState`/`useReducer`), sin crear rutas hijas ni Links a secciones privadas. Así se evita exponer rutas administrativas del proyecto original.

---

## 3. Componentes adaptables

Auditoría de los componentes reutilizables del portafolio, revisando entorno, APIs privadas, autenticación, sesiones, SQL, Neon y datos confidenciales:

| Componente | Auditoría | Uso recomendado en la demo |
|---|---|---|
| `src/lib/utils.ts` (`cn`) | Utilidad pura. Sin `fetch`, `window`, env, auth ni efectos. | **Reutilizable.** |
| `ProjectBrowserPreview` | `"use client"`; usa `next/image`, props y un enlace externo real con `target="_blank"`. No tiene APIs, auth, SQL ni secretos. | **No reutilizar tal cual dentro de la demo**: su contrato es una captura estática con enlace externo. Sirve solo como referencia para crear un `FioreDemoFrame` propio, decorativo y sin enlace. |
| `ProjectShowcase` | `"use client"`; depende de `Project`, `motion/react` y del mini navegador. Sin APIs ni secretos. | **No reutilizar dentro**. Puede permanecer fuera como sección editorial del portafolio y, en una fase futura aparte, alojar un CTA hacia la demo. |
| `GlassCard` | Superficie glass genérica; depende de tokens globales `--glass-*` y `cn`. | Seguro, pero visualmente abandonaría la identidad Fiore. Se prefiere un `FioreCard` con tokens locales. |
| `Button`, `Badge`, `TechTag`, `SectionHeader` | Primitivas client-only sin datos ni efectos sensibles. Sus variantes usan `primary`/`surface` del portafolio. | No usar con sus estilos por defecto dentro de Fiore. Crear primitivas locales (`FioreButton`, `FioreBadge`, `FioreInput`, `FioreSelect`) para evitar que el verde del portafolio invada la demo. |
| Iconos `lucide-react` | Ya instalados; no requieren red ni permisos. | Reutilizables con nombres genéricos (`Package`, `Tags`, `Truck`, `ArrowLeftRight`, `FileText`, `Plus`, `Search`, `RotateCcw`). |

**Componentes propios a crear en la fase de implementación:** `FioreDemoFrame`, `FioreSidebar`, `FioreStatCard`, `FioreTable`, `FioreDialog`, `FioreProductForm`, `FioreMovementForm` y las vistas `DashboardView`, `InventoryView`, `CategoriesView`, `SuppliersView`, `MovementsView`, `ReportsView`.

**No se copiarán** los componentes `Button`, `Card`, `Input` ni `Select` del proyecto original: aunque son presentacionales, están acoplados a los tokens de Fiore y copiarlos facilitaría arrastrar convenciones del sistema real. Se reescribirán versiones mínimas dentro de la demo.

---

## 4. Dependencias a evitar

La demo **no debe** incluir ninguna de estas dependencias ni patrones observados en el original:

- **Red / APIs:** ningún `fetch` a `/api/*`, ninguna llamada al proyecto original, ningún endpoint de productos, categorías, proveedores, movimientos, ventas, dashboard, ajustes o autenticación.
- **Autenticación y sesión:** sin login, cookies de sesión, tokens, restablecimiento de contraseña, cambio de contraseña, roles, alta de administradores ni middleware de protección.
- **Base de datos:** sin `pg`, `Pool`, `query()`, SQL, migraciones, esquemas, PostgreSQL, Neon ni `DATABASE_URL`.
- **Correo:** sin SMTP, Resend, Nodemailer, `RESEND_API_KEY`, `SMTP_*` ni formularios de contacto reales.
- **Variables de entorno:** sin `process.env`, sin lectura de `.env` / `.env.local` y sin secretos de ningún tipo.
- **Datos reales:** sin clientes, proveedores reales, ventas, inventario de producción, montos reales ni CSVs exportados del sistema original.
- **Importaciones directas:** sin rutas absolutas ni relativas que apunten a `Proyecto_fiora\fiore`; sin aliases del original (`@/lib/db`, `@/lib/auth`, `@/lib/context`, `@/lib/email`).
- **Iframe:** sin incrustar la aplicación real. La demo es una reimplementación aislada, no una vista remota.
- **Dependencias nuevas:** no se instalarán paquetes. Se usan React, Next.js, TypeScript, Tailwind ya presentes y, si hace falta, `lucide-react` / `motion` que ya están en `package.json`. La validación será manual y local; no se añadirá `zod`.

---

## 5. Arquitectura

La demo vivirá en una ruta nueva del portafolio:

```text
src/app/proyectos/fiore/demo/page.tsx          # Server Component: metadata + render de la demo
src/components/fiore-demo/
  fiore-demo.tsx                               # "use client": orquestador principal
  fiore-demo-frame.tsx                         # Marco decorativo + etiqueta de demostración
  fiore-sidebar.tsx                            # Navegación interna por estado
  views/
    dashboard-view.tsx
    inventory-view.tsx
    categories-view.tsx
    suppliers-view.tsx
    movements-view.tsx
    reports-view.tsx
  dialogs/
    product-dialog.tsx
    movement-dialog.tsx
    confirm-reset-dialog.tsx
  ui/
    fiore-button.tsx
    fiore-card.tsx
    fiore-input.tsx
    fiore-select.tsx
    fiore-badge.tsx
  fiore-demo.module.css                        # Tokens locales y layout Fiore
src/data/fiore-demo/
  types.ts
  seed.ts
src/lib/fiore-demo/
  pricing.ts
  validation.ts
  reducer.ts
  selectors.ts
  storage.ts
```

**Flujo de datos:**

```text
seed.ts (datos ficticios)
  -> useReducer (acciones locales)
  -> selectors.ts (KPIs, filtros, totales)
  -> vistas
  -> storage.ts (localStorage versionado)
```

- `page.tsx` puede exportar `metadata` (`title: "Demo interactiva de Fiore | Yeyder Otero"`, `description` neutral) y renderizar `<FioreDemo />`.
- `fiore-demo.tsx` será el único componente `"use client"` de alto nivel; las vistas pueden ser client por recibir callbacks.
- `view` (sección activa) se mantiene en memoria y vuelve a `dashboard` al recargar. **No se persiste**.
- El estado de dominio se persiste; la UI no.
- Los selectores derivan precios y totales en cada render; no se guarda información calculada en `localStorage` para evitar inconsistencias.
- No se crearán Route Handlers, Server Actions, middleware ni archivos `api/`.
- No se modificarán `src/app/page.tsx`, `project-showcase.tsx`, `project-browser-preview.tsx` ni `globals.css` en esta fase ni en la primera implementación; un CTA opcional desde la portada queda para una autorización posterior.

---

## 6. Modelo de datos

Tipos locales, serializables y deliberadamente más simples que los del original:

```ts
export type FioreDemoView =
  | "dashboard" | "inventory" | "categories"
  | "suppliers" | "movements" | "reports";

export type DemoMovementType = "entry" | "exit" | "adjustment" | "return";
export type DemoProductStatus = "active" | "inactive";

export interface DemoCategory {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface DemoSupplier {
  id: string;
  name: string;          // "Proveedor Demo A", etc.
  reference?: string;    // Solo etiqueta interna ficticia
  active: boolean;
}

export interface DemoProduct {
  id: string;
  sku: string;           // DEMO-ANI-001, DEMO-COL-001, ...
  name: string;
  categoryId: string | null;
  supplierId: string | null;
  material?: string;
  color?: string;
  costPrice: number;     // COP entero
  stock: number;
  marginPct: number;     // 0..500
  manualPrice: boolean;
  manualSellingPrice?: number;
  status: DemoProductStatus;
  createdAt: string;     // ISO string, no Date
}

export interface DemoMovement {
  id: string;
  productId: string;
  type: DemoMovementType;
  quantity: number;
  note?: string;
  createdAt: string;
}

export interface FioreDemoState {
  version: 1;
  products: DemoProduct[];
  categories: DemoCategory[];
  suppliers: DemoSupplier[];
  movements: DemoMovement[];
}
```

**Dataset semilla sugerido:** 4 categorías (`Anillos`, `Collares`, `Pulseras`, `Aretes`), 3 proveedores «Demo A/B/C», 8 accesorios ficticios y 8–10 movimientos de ejemplo. Nombres como `Anillo Demo Aurora`, `Collar Demo Brisa`, `Pulsera Demo Luna`; nunca nombres de personas ni marcas reales.

**Cálculos locales (`src/lib/fiore-demo/pricing.ts`):**

- `precio sugerido = round(costo * (1 + margen / 100))`
- `precio final = manualPrice ? manualSellingPrice : precio sugerido`
- `ganancia unitaria = round(precio final - costo)`
- `ganancia total = round(ganancia unitaria * stock)`
- `margen sobre venta = precio final > 0 ? round((ganancia unitaria / precio final) * 100 * 100) / 100 : 0`
- Formato COP con `Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })`.

Estas fórmulas se reescriben en el portafolio; **no se importa** `src/lib/calculations/pricing.ts` del proyecto original.

---

## 7. Estrategia `localStorage`

- **Clave:** `yeyder.fiore.demo.v1`. Prefijar con el portafolio evita colisiones con otras apps.
- **Contenido:** únicamente `FioreDemoState`, con `version: 1`. Sin fechas `Date`, funciones, clases, tokens ni metadatos de sesión.
- **Hidratación:**
  1. El primer render usa `seed.ts`, igual en servidor y cliente, para evitar `hydration mismatch`.
  2. En `useEffect` posterior al montaje se lee la clave.
  3. Se valida que exista `version === 1` y que `products`, `categories`, `suppliers` y `movements` sean arreglos con campos esperados.
  4. Si la lectura falla, está corrupta o es de otra versión: se ignora, se elimina la clave y se mantiene el seed.
- **Persistencia:** `useEffect` sobre el estado de dominio escribe con `JSON.stringify` dentro de `try/catch`. Si hay error de cuota o almacenamiento bloqueado, la demo sigue funcionando en memoria y no se muestra ningún dato sensible en consola.
- **Reinicio:** el botón «Reiniciar demo» pide confirmación, elimina la clave y despacha la acción `RESET` con el seed original. Vuelve a `dashboard`.
- **No persistir:** vista activa, búsquedas temporales, formularios abiertos, errores de validación ni preferencias del sistema real.
- **Sin sincronización:** no se usa `storage` event, `BroadcastChannel`, service workers ni `beforeunload`. El alcance es una sola pestaña.

---

## 8. Riesgos y seguridad

| Riesgo | Mitigación |
|---|---|
| Confundir la demo con el sistema real de Fiore | Etiqueta permanente «Demostración · datos ficticios», dominio visible `fiore · demo local`, aviso en reportes y nombres `DEMO-*`. |
| Filtrar secretos o datos de producción | No se lee `.env`, no se usa `process.env`, no se importa código del original, no se copia inventario ni contactos. Verificación por búsqueda estática antes de cerrar la fase. |
| Exponer rutas administrativas | No se replican secciones de configuración, usuarios ni acceso; la navegación usa botones internos, no URLs privadas. |
| Arrastre de acoplamiento del original | Reimplementación local de tipos, cálculos, validación y componentes. Sin `pg`, `auth`, `email`, `db` ni `context` del original. |
| Contaminación visual | CSS Module con variables `--fiore-*`; ningún token global del portafolio dentro del área de la app joyera. Contraste verificado para vino/marfil y foco visible. |
| `hydration mismatch` por `localStorage` | Render inicial determinista con seed y lectura solo tras montaje. |
| Estado corrupto o versión antigua | Clave versionada, validación defensiva y recuperación automática al seed. |
| Interpretar ganancias como ingresos | Texto visible y nota en reportes: «proyección basada en stock y precios sugeridos; no representa ventas efectuadas». |
| Accesibilidad de diálogos y formularios | Etiquetas `<label>`, `aria-modal`, `aria-labelledby`, cierre con `Escape`, foco inicial y retorno al disparador; `prefers-reduced-motion` ya cubierto globalmente. |
| Dependencias innecesarias | No se instalan paquetes nuevos; animación opcional con `motion` ya presente y `MotionConfig reducedMotion="user"`. |
| Cambios no deseados en el portafolio | La demo se aísla en su ruta; no se tocan componentes actuales ni se hacen commits/push sin autorización. |

---

## 9. Plan por bloques

| Bloque | Entregable | Depende de | Puerta de verificación |
|---|---|---|---|
| **B0 — Contrato y semilla** | `types.ts`, `seed.ts`, `pricing.ts`, `validation.ts`, `reducer.ts`, `selectors.ts`, `storage.ts`. | Ninguno. | Tipos compilan; seed sin datos reales; fórmulas coinciden con las reglas observadas; sin imports del original. |
| **B1 — Marco y navegación** | Ruta `/proyectos/fiore/demo`, `fiore-demo-frame.tsx`, `fiore-sidebar.tsx`, `fiore-demo.module.css`, botón de reinicio. | B0 | Ruta carga; etiqueta de demo visible; sidebar sin secciones privadas; responsive 375–1440 px sin desbordamiento. |
| **B2 — Dashboard** | KPIs, tarjetas, paneles de stock bajo/agotados/recientes/mayor ganancia. | B0, B1 | Totales derivados coinciden con el seed; texto de proyección presente; estados vacíos claros. |
| **B3 — Inventario y precios** | Tabla, búsqueda, filtros, `ProductDialog`, cálculo en vivo y validación local. | B0–B2 | Alta/edición recalcula precio y ganancia; errores por SKU vacío, costo negativo, margen > 500 o stock negativo; sin `fetch`. |
| **B4 — Catálogo y movimientos** | Vistas de categorías y proveedores, `MovementDialog`, actualización de stock e historial filtrable/paginado. | B3 | Una salida reduce stock y agrega movimiento; contadores por categoría/proveedor se recalculan; proveedores sin contacto real. |
| **B5 — Reportes y exportación** | Totales, tabla y CSV de datos ficticios con aviso de proyección. | B0–B4 | CSV contiene solo `DEMO-*`; ninguna fila de datos reales; aviso visible antes de la tabla. |
| **B6 — Persistencia y pulido** | `localStorage` versionado, recuperación de estado corrupto, foco, ARIA, reduced motion y verificación final. | B0–B5 | Recarga conserva cambios; reinicio restaura seed; teclado y lector de pantalla utilizables; `tsc`, `lint`, `build` y Lighthouse en verde. |
| **B7 — Integración opcional (fuera de alcance actual)** | CTA desde una tarjeta de proyecto hacia la demo. | B6 + autorización explícita | No se ejecuta en M4.2A; requiere aprobación separada para tocar componentes actuales. |

---

## 10. Criterios de aceptación

La implementación futura solo se considerará terminada si:

1. La ruta `/proyectos/fiore/demo` responde correctamente y muestra de forma visible `Demostración · datos ficticios`.
2. No existe ninguna importación que apunte al directorio original de Fiore ni a sus módulos internos.
3. En los archivos nuevos de la demo no aparecen `fetch`, `process.env`, `pg`, `Pool`, `query(`, `Neon`, `nodemailer`, `SMTP`, cookies de sesión, `useAuth`, contraseñas ni rutas privadas.
4. No se lee ni se muestra contenido de `.env`, `.env.local`, tokens, claves, credenciales ni secretos.
5. El DOM y el bundle no contienen nombres de clientes, proveedores reales, ventas reales ni métricas comerciales inventadas como reales.
6. La identidad visual permanece separada: portafolio oscuro/glass afuera; vino, marfil y rosa Fiore adentro; ningún acento `#00d4aa` dentro del área de la app joyera.
7. La calculadora de precios responde a cambios de costo, margen, stock y precio manual; los totales del dashboard y reportes derivan del mismo estado.
8. Registrar una salida reduce el stock, agrega un movimiento y actualiza los KPIs; el reinicio restaura el seed y limpia la clave `yeyder.fiore.demo.v1`.
9. Recargar la página conserva los cambios locales; un valor corrupto o de otra versión se recupera sin errores visibles ni dependencia de red.
10. Navegación por teclado, etiquetas de formularios, diálogos accesibles, foco visible y `prefers-reduced-motion` funcionan sin errores de consola.
11. No hay desbordamiento horizontal a 375 px ni a 1440 px; tablas y drawer se adaptan correctamente.
12. `npx tsc --noEmit`, `npm run lint` y `npm run build` terminan en verde, con solo el aviso ya conocido sobre `package-lock.json` fuera del repositorio Git.
13. No se crean commits ni push y no se modifican los componentes actuales del portafolio sin instrucción explícita posterior.

**Estado actual de M4.2A:** plan completo; implementación pendiente. El siguiente paso autorizado sería B0, no la ejecución inmediata de la demo.
