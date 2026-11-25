# Decisiones Arquitectónicas y Asuntos Pendientes

## Decisiones Tomadas en M0

### 1. Sin Base de Datos Inicial
- **Decisión:** Utilizar archivos JSON/TypeScript en `src/data/` para la gestión de contenido en lugar de una base de datos desde el inicio.
- **Justificación:** El portafolio es personal con contenido manejable por una sola persona. Evita complejidad innecesaria, costos y tiempo de configuración para la fase inicial. El panel de administración se podrá añadir posteriormente.
- **Estado:** ✅ Confirmado. Arquitectura data-driven definida en `docs/architecture.md`.

### 2. Next.js 16 con App Router
- **Decisión:** Utilizar Next.js 16 (versión más reciente planificada) con App Router en lugar de Pages Router.
- **Justificación:** App Router es el patrón recomendado por Next.js moderno, ofrece rutas de archivo más naturales, soporte pleno de React 19 y mejores prestaciones de streaming y server components.
- **Estado:** ✅ Definido en `docs/architecture.md` y `docs/roadmap.md` (M1).

### 3. Tema Oscuro como Identidad Principal
- **Decisión:** El portafolio tendrá tema oscuro como identidad visual principal, con esquema light como opcional.
- **Justificación:** El estilo editorial minimalista y el glassmorphism lucen mejor en tema oscuro. Además, reduce la fatiga visual para los usuarios y es la tendencia actual en portafolios de desarrolladores.
- **Estado:** ✅ Definido en `docs/design-system.md` con paleta de colores oscuro.

### 4. Tailwind CSS v4
- **Decisión:** Usar Tailwind CSS v4 en lugar de v3 o CSS tradicional.
- **Justificación:** Versión más reciente con nuevas utilidades, mejor performance en tiempo de build y características modernas (at-rules, container queries enhancements). Compatible con el stack moderno propuesto.
- **Estado:** ✅ En `package.json` cuando se instale (fase M1).

### 5. Motion for React (en lugar de Framer Motion o animaciones CSS puras)
- **Decisión:** Utilizar la librería `motion` (generalmente Framer Motion bajo nombre diferente o la librería oficial) para animaciones.
- **Justificación:** API consistente, good performance con optimizaciones automáticas, y se integra nativamente con React 18/19 y Next.js App Router. Permite el tipo de animaciones definidas en el design system (fade-in, slide-up, stagger) con mínimas configuraciones.
- **Estado:** ✅ Añadir a dependencias en M1.

### 6. Lucide React para iconografía
- **Decisión:** Usar Lucide React en lugar de Font Awesome, Material Icons o custom SVG.
- **Justificación:** Librería ligera, árbol de destrucción (tree-shaking), icons consistentes en estilo y tamaño, y actualizaciones frecuentes. Ideal para el minimalismo propuesto.
- **Estado:** ✅ Añadir a dependencias en M1.

### 7. Contenido via archivos estructurados (sin CMS inicial)
- **Decisión:** Los datos (proyectos, habilidades, educación, experiencia) se gestionarán mediante archivos `src/data/*.ts` y no un CMS externo.
- **Justificación:** Facilita el desarrollo inicial, cero dependencias externas, el propietario puede editar archivos directamente. El panel de administración se añadirá cuando sea necesario.
- **Estado:** ✅ Definido en `docs/architecture.md`.

### 8. No implementación de autenticación, ORM ni APIs externas en M0-M3
- **Decisión:** Estas funcionalidades se añadiran solo si se justifican genuinamente en fases avanzadas.
- **Justificación:** El alcance inicial es un portafolio estático/quincrementalmente interactivo. Agregar auth/CMS/base de datos desde el inicio añade complejidad y riesgo innecesario.
- **Estado:** ✅ Documentado en `docs/requirements.md` y `docs/roadmap.md`.

## Asuntos Pendientes / Riesgos Técnicos

### 1. Versión de Next.js 16
- **Estado actual:** Next.js 16.4.6 instalado y verificado (release estable).
- **Compatibilidad:** Confirmada con React 19.3.0 y TypeScript ^5.
- **Acción:** Documentado en M1 - inicialización exitosa.
- **Estado:** ✅ Validado en M1.

### 2. Compatibilidad Tailwind CSS v4
- **Estado actual:** Tailwind CSS v4.3.3 instalado y configurado vía next.config.ts con rules de Turbopack.
- **Configuración:** `turbopack.rules["*.css"]` con loader `@tailwindcss/turbopack`; `src/app/globals.css` con `@import "tailwindcss"`.
- **Compatibilidad:** Verificada - proyecto Next.js 16 inicializa sin errors de configuración.
- **Acción:** Documentado en M1 - estructura base funcional.
- **Estado:** ✅ Validado en M1.

### 3. React 19 estabilidad
- **Estado actual:** React 19.3.0 instalado y verificado junto con Next.js 16.4.6.
- **Compatibilidad:** Confirmada - Next.js 16 y React 19 funcionan juntos en modo App Router.
- **Acción:** Documentado en M1 - proyecto inicializa exitosamente.
- **Estado:** ✅ Validado en M1.

### 4. Glassmorphism licensing del componente referenciado
- **Desconocimiento:** El componente original en 21st.dev puede tener restricciones de licencia.
- **Riesgo:** Problemas legales si se copia diseños con derechos de autor.
- **Acción:** Analizar licencia del componente original en 21st.dev y asegurarse de que el diseño final sea original o uso justo transformador.
- **Estado:** ⚠️ Pendiente de investigación.

### 5. Datos de proyectos inventados/verificados
- **Restricción:** No se deben inventar logros, cifras, responsabilidades, experiencia laboral ni niveles de dominio.
- **Riesgo:** Si la información no ha sido verificada con el propietario, hay riesgo de datos incorrectos en la fase de implementación.
- **Acción:** Verificar cada proyecto (ElectroTero, Fiore, SportReserve, Alessia) con Yeyder Otero antes de publicar contenido.
- **Estado:** ⚠️ Pendiente de verification with owner.

### 6. Panel de administración fututo
- **Decisión:** Arquitectura preparada pero no implementado en M0-M4.
- **Riesgo:** Si el diseño de datos cambia, el panel requerirá reconstrucción.
- **Acción:** Mantener la interfaz de datos consistente (archivos TypeScript con interfaces definidas).
- **Estado:** ⏳ Planificado para M7.

### 7. Movimiento reducido (@media prefers-reduced-motion)
- **Decisión:** Respetar la preferencia del usuario para reducir animaciones.
- **Riesgo:** Algunas animaciones definidas en design system pueden no degradarse graceful.
- **Acción:** Implementar media query y asegurar que contenido esencial sea usable sin animaciones.
- **Estado:** ✅ Diseñado en `docs/design-system.md`, por implementar en código.

## Próximos Pasos Antes de M1

1. ✅ Validar versión de Next.js 16 y compatibilidad con React 19.
2. ✅ Verificar licencia del componente glassmorphism en 21st.dev.
3. ✅ Confirmar datos de proyectos con Yeyder Otero.
4. ✅ Revisar changelog de Tailwind CSS v4 breaking changes.
5. ✅ Definir versión exacta de TypeScript (compatibilidad con React 19).
6. ✅ Crear issues o tracking para riesgos identificados.

## Estado de Herramientas y Skills (M1)

- **ECC (Everything Claude Code):** No encontrado en rutas estándar (`C:\Users\pc\.opencode\skills` no existe). Pendiente de instalación/configuración si es necesario.
- **21st.dev MCP:** No verificado en este entorno.
- **Context7 MCP:** No verificado en este entorno.
- **Claude Webkit:** No verificado.
- **Playwright:** No verificado.
- **Git:** ✅ Disponible y operativo (repositorio inicializado en M0).
- **Skills locales:**
  - `frontend-design`: No encontrado en `C:\Users\pc\.opencode\skills\`
  - `emil-design-eng`: No encontrado en `C:\Users\pc\.opencode\skills\`
  - `animate`: No encontrado en `C:\Users\pc\.opencode\skills\`
  - `review-animations`: No encontrado en `C:\Users\pc\.opencode\skills\`

## Próximo Hito: M1

**Configurar entorno:** Next.js 16, App Router, Tailwind CSS v4, ESLint, Turbopack.

**Checklist M1:**
- [x] Repositorio con documentación M0 completada y preservada.
- [x] `create-next-app` con Next.js 16.4.6 y App Router.
- [x] TypeScript configurado y sin errores (`tsc --noEmit` pasa).
- [x] Tailwind CSS v4 aplicando colores y utilidades del design system (v4.3.3).
- [ ] ESLint corriendo en modo watch sin warnings críticos (revisar próximamente).
- [x] `npm run dev` inicia el proyecto exitosamente (Local: http://localhost:3000).
- [x] Build de producción exitoso (`npm run build` completa).
- [x] Dependencias instaladas: motion, lucide-react.