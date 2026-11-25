# Design System - Portfolio Personal

## Identidad Visual

### Tema Principal: Oscuro

- **Color de fondo principal:** `#0a0a0f` (casi negro, cálido)
- **Color de superficie secundario:** `#12121a` (cards, containers)
- **Color de acento principal:** `#00d4aa` (verde esmeralda, usado con moderación)
- **Color de texto principal:** `#e0e0e6` (texto legible sobre oscuro)
- **Color de texto secundario:** `#8888a0` (texto auxiliar, muted)
- **Color de borde glassmorphism:** `rgba(255, 255, 255, 0.05)` con `backdrop-filter: blur(20px)`

### Paleta de Colores Completa

| Propósito | Color Hex | Comentario |
|-----------|-----------|------------|
| Fondo principal | `#0a0a0f` | Base general |
| Superficie | `#12121a` | Cards y containers |
| Acento principal | `#00d4aa` | Enlaces, highlights |
| Acento secundario | `#ff6b6b` | Alertas, CTA |
| Texto primario | `#e0e0e6` | Contenido legible |
| Texto secundario | `#8888a0` | Metadatos, hints |
| Borde | `#2a2a3a` | Separadores sutiles |
| Éxito | `#00a855` | Estados positivos |
| Advertencia | `#f0ad4e` | Advertencias |
| Error | `#d73a4a` | Errores |

### Tipografía

- **Fuente principal:** `Inter` o `SF Pro Display` (sistema)
- **Peso:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Tamaños:** 
  - `text-xs`: 0.75rem (12px)
  - `text-sm`: 0.875rem (14px)
  - `text-base`: 1rem (16px)
  - `text-lg`: 1.125rem (18px)
  - `text-xl`: 1.25rem (20px)
  - `text-2xl`: 1.5rem (24px)
  - `text-3xl`: 1.875rem (30px)
  - `text-4xl`: 2.25rem (36px)

- **Jerarquía visual:**
  - Headings con aumento progresivo de tamaño y peso
  - Subtítulos diferenciados pero cohesivos
  - Texto de cuerpo con height adecuado (1.5-1.6)

### Glassmorphism Elements

Components con efecto glassmorphism aplicado moderadamente:

```css
/* Ejemplo de clase utility */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.glass-button {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}
```

### Componentes Previstos

1. **Navbar/Navigation**
   - Logo a la izquierda, menú a la derecha
   - Tema oscuro con transición suave
   - Enlaces principales: Inicio, Proyectos, Sobre Mí, Contacto
   - Mobile: hamburger menú con animación

2. **Hero Section**
   - Nombre y rol destacado
   - Breve descripción personal
   - CTA principal (Ver proyectos / Descargar CV)
   - Foto de perfil con estilo minimalista

3. **Projects Grid**
   - Tarjetas responsive con efecto glassmorphism
   - Cada proyecto: título, descripción breve, tecnologías
   - Hover effects sutiles, sin animaciones excesivas
   - Enlaces a repositorios/demo

4. **About Section**
   - Cronología de formación (no inventada, solo verificada)
   - Habilidades con indicadores visuales
   - Proyectos destacados

5. **Resume/CV Section**
   - Descarga de PDF
   - Resumen de experiencia verificada
   - Sección de habilidades técnicas

6. **Contact Section**
   - Enlaces directos a redes sociales
   - Formulario de contacto (mínimo, sin spam)
   - Ubicación geográfica (ciudad, país)

### Animaciones

#### Philosophy
- "Less is more" - las animaciones deben servir al contenido, no distraer.
- Duración: 150ms-300ms para micro-interacciones, 500ms-700ms para transiciones de sección.
- Curva: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out suave).

#### Tipos de Animaciones Permitidas

1. **Fade-in** - elementos que aparecen al cargar la página.
   - Duración: 500ms
   - Delay escalonado por sección.

2. **Slide-up** - elementos que entran desde abajo.
   - Usado en secciones múltiples.
   - Delay: cada elemento 100ms después del anterior.

3. **Hover interactions** - en botones, tarjetas, enlaces.
   - Color transition: 200ms
   - Scale: 1.02 máximo
   - Sin transformaciones drásticas.

4. **Page transitions** - entre secciones internas.
   - Cross-fade de 300ms.
   - Usando Motion for React `transition` prop.

5. **Stagger children** - listas de proyectos, habilidades.
   - Retardo progresivo entre cada elemento.

#### Animaciones Prohibidas (M0-M3)
- Efectos "too much" o distractivos.
- Animaciones que duren más de 500ms en micro-interacciones.
- Movimiento continuo sin interacción del usuario.
- Partículas, confetti o efectos de fondo excesivos.

### Iconografía

- **Librería:** Lucide React
- **Estilo:** Outline, 20px grid
- **Colores:** Heredan el color del texto, o usan el acento principal `#00d4aa` en estado hover.

### Espaciado y Reglas

- **Sistema de espaciado:** 4-base (4px, 8px, 12px, 16px, 24px, 32px, 48px)
- **Radio de borde:** 8px base, 12px para glassmorphism, nunca mayor a 16px.
- **Sombras:** Ninguna en tema oscuro, o sombra muy suave `0 1px 2px rgba(0,0,0,0.2)`.
- **Altura de línea:** 1.5 para texto de cuerpo, 1.1 para headings.

## Breakpoints Responsive

| Breakpoint | Ancho | Clases Tailwind |
|------------|-------|----------------|
| Mobile | < 640px | `sm:` no usado, mobile-first |
| Tablet | ≥ 640px | `sm:` |
| Laptop | ≥ 768px | `md:` |
| Desktop | ≥ 1024px | `lg:` |
| Wide | ≥ 1440px | `xl:` |

## Accesibilidad (WCAG 2.2 AA)

- Contraste mínimo: 4.5:1 para texto normal, 3:1 para grande.
- Focus visible: outline 2px `outline-offset-2` con color de acento (`focus-visible:ring-2 focus-visible:ring-primary`).
- Alt text en todas las imágenes/iconos informativos.
- Semántica HTML correcta: `header`, `nav`, `main`, `section`, `article`, `footer`.
- Todas las interactivas tienen `aria-label` o texto significativo.
- Reducir movimiento preferencia respectada (`@media (prefers-reduced-motion: reduce)`).
- Componentes construidos con mejora progresiva, teclado navegable.

## Sistema de Diseño M2 (Implementado)

### Tokens Visuales Implementados

Los siguientes tokens fueron definidos en `src/app/globals.css` y están disponibles en todo el proyecto:

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#00d4aa` | Acento principal, enlaces, highlights |
| `--secondary` | `#ff6b6b` | Alertas, CTA |
| `--muted` | `#8888a0` | Texto auxiliar, estado disabled |
| `--surface` | `#12121a` | Superficies de fondo |
| `--radius` | `8px` | Radio de borde base |
| `--radius-glass` | `12px` | Radio de borde glassmorphism |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.2)` | Sombra pequeña |

### Componentes Fundamentales M2

Los siguientes componentes fueron implementados en `src/components/ui/`:

1. **Container** - Contenedor responsive (`max-w-7xl`) con padding 4-base; no usa `prose` (el plugin de tipografía no está instalado en v4).
2. **Button** - Botones con variantes primary, secondary, outline, ghost. Focus visible cumpliendo WCAG 2.2 AA.
3. **GlassCard** - Superficie glassmorphism con `backdrop-filter: blur()` controlado, border sutil y transiciones hover.
4. **SectionHeader** - Encabezado de sección con título, subtítulo y separador visual.
5. **TechTag** - Etiquetas compactas para tecnologías/habilidades con hover state.
6. **Divider** - Separadores visuales en variantes line, dot, dash.

### Estados Interactivos

- **Focus visible**: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- **Hover states**: Transiciones suaves 200ms en botones, tarjetas y etiquetas
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` respeta la preferencia del usuario

### Integración Tailwind v4 (verificada en M2.5)

- `src/app/globals.css` usa `@import "tailwindcss";` (los directivos `@tailwind` fueron eliminados en v4).
- Los tokens se exponen con `@theme inline` para que `bg-primary`, `text-muted`, `border-border`, etc. referencien las variables CSS y respeten `data-mode="dark"`.
- Foregrounds accesibles sobre los acentos: `#061a15` sobre `#00d4aa` (9,43:1) y `#2b0b0b` sobre `#ff6b6b` (6,55:1).
- GlassCard: solo `backdrop-blur-[var(--glass-blur)]`; prohibido `filter: blur()` sobre el contenido.
- TechTag: `shrink-0` y contenedor padre `flex flex-wrap gap-2`.
- Evidencia completa: `M2.5_VERIFICACION_FINAL.md`.

## M7 — Animaciones

M7 corresponde a la fase de implementación de animaciones fluidas y modernas según el design system, incluyendo fade-in, slide-up, hover interactions y page transitions usando Motion for React. No corresponde a panel administrativo.

## Panel Administrativo

El panel administrativo pertenece a una fase posterior al lanzamiento (planes M8-M9), no a M9. La arquitectura data-driven preparada en M0 permite su incorporación futura sin reconstrucción completa.

## Herramientas y Skills (Actualizado M2)

- **ECC (Everything Claude Code)**: No encontrado en rutas estándar. Documentado en `docs/decisions.md`.
- **21st.dev MCP**: Consultado en M2.5. Referencia `Glassmorphism Portfolio` (id `10616`, autor `moumensoliman`). Código completo no recuperado por límite de cuota de la API.
- **Context7 MCP**: No verificado.
- **Claude Webkit**: No verificado.
- **Verificación en navegador**: Realizada en M2.5 sobre `http://localhost:3000/` (estilos calculados, CSS servido, consola y emulación de breakpoints). Detalle en `M2.5_VERIFICACION_FINAL.md`.
- **Git**: ✅ Disponible y operativo.
- **Skills locales**: Pendiente de instalación cuando sean necesarias para fases de diseño.