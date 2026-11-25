# Roadmap M0-M9 - Portfolio Personal

## Visión General

Fases estructuradas desde la planificación inicial hasta la evolución continua del portafolio. Cada hito tiene criterios claros de finalización y entregables definidos.

## Fases del Proyecto

### M0: Planificación y preparación (Actual)

**Objetivo:** Definir la base del proyecto antes de escribir código.

**Actividades completadas:**
- ✅ Inspección del directorio y verificación de proyecto previo.
- ✅ Comprobación de estado de Git (repositorio vacío, sin commits).
- ✅ Verificación de herramientas y skills disponibles.
- ✅ Análisis de requisitos del portafolio.
- ✅ Definición de arquitectura propuesta y organización de archivos.
- ✅ Estrategia de contenido escalable.
- ✅ Documentación del diseño visual y reglas de implementación.
- ✅ Definición de criterios de aceptación para fases posteriores.
- ✅ Identificación de riesgos técnicos y decisiones pendientes.
- ✅ Creación de documentación inicial.

**Entregables:**
- `README.md` creado.
- `docs/requirements.md` creado.
- `docs/architecture.md` creado.
- `docs/design-system.md` creado.
- `docs/roadmap.md` creado.
- `docs/decisions.md` por crear.

**Criterios de finalización M0:**
- Documentación completa en `docs/`.
- Repositorio Git listo para trabajo (sin commits pending).
- Herramientas verificadas, sin dependencias instaladas.
- Arquitectura y diseño system aprobados en principio.

---

### M1: Configuración del entorno y base estructura

**Objetivo:** Configurar Next.js 16 con App Router y la estructura base.

**Entregables esperados:**
- Next.js 16 proyecto inicial con `create-next-app`.
- App Router configurado con layout raíz.
- TypeScript activado con configuraciones básicas.
- Tailwind CSS v4 integrado.
- ESLint configurado.
- Directorio de componentes y datos estructurados.

**Criterios de aceptación:**
- `npm run dev` inicia el servidor de desarrollo sin errores.
- Página inicial renderiza en `http://localhost:3000`.
- TypeScript sin errores de tipo.
- Tailwind CSS aplica los estilos definidos.

---

### M2: Componentes base y estructura de páginas

**Objetivo:** Implementar los componentes UI fundamentales y las páginas principales.

**Entregables esperados:**
- Navbar/Navigation component con tema oscuro.
- Hero section con diseño minimalista.
- Projects grid component (base, sin datos dinámicos aún).
- About section estructura básica.
- Footer con enlaces profesionales.

**Criterios de aceptación:**
- Todas las páginas navegables desde el navbar.
- Diseño responsive desde mobile (375px) hasta desktop (1440px).
- Componentes accesibles con ARIA apropiados.
- Sin errores de consola en modo desarrollo.

---

### M3: Contenido de datos y interactividad

**Objetivo:** Cargar datos estructurados e implementar interacciones básicas.

**Entregables esperados:**
- Archivos `src/data/*` con información verificada del propietario.
- Proyectos ElectroTero, Fiore, SportReserve, Alessia cargados.
- Sistema de filtros/categorías de proyectos.
- Interacciones hover en tarjetas y botones.
- Modal/para vista detalle de proyectos.

**Criterios de aceptación:**
- Todos los proyectos iniciales muestran información correcta.
- Navegación entre categorías funcional.
- Formulario de contacto funcional (enviar a endpoint temporal).
- Descarga de CV/hoja de vida funcional.

---

### M4: Animaciones y refinamiento visual

**Objetivo:** Implementar animaciones fluidas y modernas según el design system.

**Entregables esperados:**
- Animaciones fade-in y slide-up en secciones.
- Hover effects en botones y tarjetas.
- Page transitions entre secciones.
- Respetando la regla de movimiento reducido `@media (prefers-reduced-motion: reduce)`.

**Criterios de aceptación:**
- Las animaciones mejoran la experiencia sin bloquear.
- Performance: frame rate mantenido > 50ms en animaciones.
- Test con reduced motion: contenido sigue siendo usable.

---

### M5: Optimización de rendimiento

**Objetivo:** Optimizar el sitio para tiempos de carga y métricas Core Web Vitals.

**Entregables esperados:**
- Lighthouse score > 90 en rendimiento, accesibilidad y buenas prácticas.
- Imágenes optimizadas (next/image o assets optimizados).
- Code splitting configurado automáticamente por Next.js.
- Critical CSS inline, resto deferred.

**Criterios de aceptación:**
- Time to First Byte (TTF) < 800ms.
- Largest Contentful Paint (LCP) < 2.5s.
- Cumulative Layout Shift (CLS) < 0.1.
- No console warnings ni errors críticos.

---

### M6: Accesibilidad profunda

**Objetivo:** Garantizar el cumplimiento WCAG 2.2 Level AA.

**Entregables esperados:**
- Audit con axe-devtools o similar sin errores críticos.
- Contraste de colores verificado en todas las secciones.
- Navegación completa por teclado.
- Lectores de pantalla: experiencia fluida.
- Formularios con labels apropiados y errores descriptivos.

**Criterios de aceptación:**
- 0 errores WCAG críticos.
- 0 warnings axe críticos.
- Todos los componentes tienen nombre accesible.

---

### M7: Panel de administración (planeado)

**Objetivo:** Incorporar un panel de administración sin reconstrucción completa.

**Entregables esperados:**
- Arquitectura data-driven comprobada.
- Panel ligero para actualizar proyectos y contenido.
- Conexión entre archivos `src/data/` y panel.
- No breaking changes en el frontend existente.

**Criterios de aceptación:**
- Se puede añadir un nuevo proyecto mediante el panel.
- Los cambios se reflejan en el frontend al recargar.
- Estructura lista para integración con CMS futuro (Contentful, Sanity, etc.).

---

### M8: Despliegue y CI/CD

**Objetivo:** Publicar el portfolio en Vercel y configurar flujos de trabajo.

**Entregables esperados:**
- Despliegue en Vercel exitoso.
- Dominio personal configurado (si procede).
- GitHub Actions o flujo de deploy automatizado.
- Environment variables configuradas (si es necesario).

**Criterios de aceptación:**
- Sitio en vivo en `*.vercel.app`.
- Deploy automático al hacer push a `main`.
- URLs de repositorio y demo documentadas.

---

### M9: Evolución continua y mantenimiento

**Objetivo:** Mantener el portafolio actualizado y escalable.

**Entregables esperados:**
- Guía de contribución para futuras actualizaciones.
- Lista de verificación para cada nuevo proyecto añadido.
- Métricas de rendimiento monitoreadas.
- Plan para M10+ (nuevas features según experiencia del usuario).

**Criterios de aceptación:**
- El propietario puede actualizar contenido sin ayuda técnica.
- El sitio sigue siendo rápido después de 1 año.
- Documentación actualizada y coherente.

## Criterios Generales de Finalización

Un hito se considera completado cuando:

1. **Todos los entregables especificados están presentes.**
2. **Los criterios de aceptación se han verificado manualmente.**
3. **No hay errores críticos bloqueando el avance.**
4. **La documentación está actualizada para el siguiente hito.**
5. **El código cumple con las reglas del design system definidas en M0.**

## Dependencias entre Hitos

- M0 → M1 (necesario configurar entorno antes de programar).
- M1 → M2 (necesario tener estructura base antes de componentes).
- M2 → M3 (necesario tener páginas antes de cargar contenido).
- M3 → M4 (las animaciones van sobre el contenido existente).
- M4 → M5 (optimización sobre el sitio animado).
- M5 → M6 (accesibilidad sobre el sitio optimizado).
- M6 → M7 (panel sobre arquitectura estable).
- M7 → M8 (despliegue después de funcionalidades completas).
- M8 → M9 (mantenimiento continuo después del lanzamiento).