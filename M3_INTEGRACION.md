# M3 — Integración del componente original de 21st.dev

## 1. Cómo se integró el componente original

Se copió la composición de `referencia_21st.txt` (Glassmorphism Portfolio Block de Moumen Soliman) a `src/components/ui/glassmorphism-portfolio-block-shadcnui.tsx` y se renderiza desde `src/app/page.tsx`, sustituyendo la demo visual de M2. Se conservaron: sección `min-h-screen`, `max-w-6xl`, tarjeta glass `rounded-3xl border-border/50 bg-background/45 backdrop-blur-2xl`, grid `lg:grid-cols-2`, columna de contenido con Badge/título/introducción/3 highlights/CTA, tarjeta de perfil con glow, avatar circular, enlaces sociales animados y todos los `variants`/`whileInView`/`whileHover` originales.

## 2. Adaptaciones necesarias

| Adaptación | Motivo |
|---|---|
| `motion/react` en vez de `framer-motion` | El proyecto ya tiene `motion@14.14.0`; `node_modules/motion/dist/react.d.ts` re-exporta `motion`, `MotionConfig` y `Variants`. Sin nueva dependencia. |
| `<MotionConfig reducedMotion="user">` + regla CSS `@media (prefers-reduced-motion: reduce)` | Respetar la preferencia del sistema en animaciones y transiciones. |
| `Badge` mínimo en `src/components/ui/badge.tsx` | No existía; API compatible con `variant="outline"`, sin `class-variance-authority`. |
| SVG inline del logo GitHub | `lucide-react@1.78` eliminó los iconos de marca (`Github` no existe). `ArrowUpRight` sí se mantiene desde Lucide. |
| `md:text-md` → `md:text-base` | Clase inexistente en Tailwind v4. La referencia renderiza 16 px / 26 px; `text-base` reproduce exactamente ese valor. |
| `!rounded-full !px-8 !text-sm` en el CTA | El `Button` existente define `rounded-md`, `px-6` y `text-lg`; se fuerza el aspecto original sin modificar el componente reutilizable. |
| Avatar con iniciales `YO` | No hay fotografía personal; se conservan proporciones `h-32 w-32`, borde, glow y `role="img"` con `aria-label`. |
| `lang="es"` en `<html>` | Idioma del contenido. |

## 3. Contenido personalizado (sin inventar)

- Nombre: Yeyder Otero. Perfil: estudiante de Ingeniería Informática y desarrollador en formación. Ubicación: San Pablo, Bolívar, Colombia.
- Introducción: texto proporcionado por el usuario, literal.
- Highlights: Proyectos desarrollados / Formación académica / Aprendizaje y crecimiento profesional, con descripciones basadas solo en formación, proyectos académicos y personales.
- CTA: “Ver GitHub” → `https://github.com/yeydersha`.
- Enlace social: solo GitHub (`@yeydersha`), por ser la única dirección real disponible.

## 4. Archivos modificados

| Archivo | Acción |
|---|---|
| `src/components/ui/glassmorphism-portfolio-block-shadcnui.tsx` | Nuevo: componente original adaptado |
| `src/components/ui/badge.tsx` | Nuevo: Badge mínimo compatible |
| `src/app/page.tsx` | Demo M2 sustituida por la portada M3 |
| `src/app/globals.css` | Regla `prefers-reduced-motion` añadida |
| `src/app/layout.tsx` | `lang="es"` |

Componentes M2 existentes conservados en disco. Documentación anterior conservada.

## 5. Dependencias

- `motion@14.14.0` (ya instalada; usada vía `motion/react`).
- `lucide-react@1.78.0` (ya declarada).
- Sin instalaciones nuevas.

## 6. Validaciones

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ✅ Sin errores ni advertencias |
| `npm run build` | ✅ Compilación correcta; 4 páginas estáticas |
| Navegador `http://localhost:3000/` | ✅ Sin errores de consola; `lang="es"`; título e iniciales correctos |
| Animaciones tras estabilizar | ✅ `opacity: 1`, `transform: none`; avatar 128×128 px |
| Glass principal | ✅ `backdrop-filter: blur(40px)`, `filter: none`, radio 24 px |
| Responsive (emulación de `@media`) | ✅ 2 columnas desktop / 1 columna móvil |
| Reduced motion (emulación de la media query) | ✅ `transition-duration` de `0.15s` → `1e-05s` |

Nota: no hay Playwright instalado. Este modelo no interpreta imágenes; la verificación es de estilos calculados y CSS servido. La pestaña del navegador queda abierta para confirmación visual del usuario.

## 7. Pendientes

- Fotografía personal real: sustituir el avatar de iniciales cuando se proporcione.
- Enlaces sociales adicionales: añadir solo cuando se den direcciones reales.
- Definir si el CTA debe apuntar a otro destino distinto de GitHub.

**Estado: M3 implementado y detenido aquí. Sin M4, base de datos, commits ni push.**

---

## Apéndice — Intento de instalación con el CLI oficial (actualizado)

Se revisó la configuración antes de ejecutar el CLI: Next.js 16.4.6 / Turbopack, Tailwind v4 con `@import "tailwindcss"`, alias `@/*`, `Button` y `Badge` propios, sin `components.json`. Se creó una copia de seguridad completa fuera del repo en `_backup_portafolio_yeyder_cli_20261124` (incluye `src/`, `package.json`, `tsconfig.json`, `next.config.ts` e informes M2.5/M3).

El comando oficial `npx @21st-dev/cli add moumensoliman/glassmorphism-portfolio-block-shadcnui` **no pudo completarse**:

1. El login por navegador expiró dos veces (*Login timed out waiting for browser authorization*).
2. Se generó una API key válida desde `https://21st.dev/settings/api-keys` y `21st usage --json` confirmó cuenta `free` con `freeRetrievalsRemaining: 0` (reinicio: 2026-12-01).
3. El `dry-run` de `shadcn` con la key devolvió `403 — [Marketplace membership required]`. La documentación oficial confirma que **las instalaciones vía registro requieren membresía**; los 2 retrievals diarios son para copias gratuitas y ya están agotados.

Por decisión del usuario se conserva la integración M3 ya realizada desde `referencia_21st.txt` (mismo componente original, sin CLI, sin nuevas dependencias). **No se escribió ni sobrescribió ningún archivo durante el intento de CLI**, y la clave no quedó guardada en el repositorio.

### Verificación final repetida tras el intento de CLI

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ✅ Sin errores ni advertencias |
| `npm run build` | ✅ 4 páginas estáticas |
| Navegador `http://localhost:3000/` | ✅ Sin errores de consola; sin overlay de error real (`data-error=false`, solo badge "Cache disabled" de devtools) |
| Contenido | ✅ Yeyder Otero, introducción literal, 3 highlights, CTA "Ver GitHub", único enlace `github.com/yeydersha`, avatar "YO", **ninguna imagen del autor** |
| Glass / avatar | ✅ `backdrop-filter: blur(40px)`, `filter: none`, radio 24 px; avatar 128×128 px |
| Responsive / reduced motion | ✅ 2 columnas desktop / 1 móvil; `transition-duration` 0.15s → 1e-05s |

Sin M4, sin base de datos, sin commits ni push.

---

## Apéndice 2 — Comparación con la referencia en vivo

Se releyó `referencia_21st.txt` por completo (282 líneas) antes de cualquier cambio y se comparó línea a línea con `src/components/ui/glassmorphism-portfolio-block-shadcnui.tsx`. Coinciden la sección, el `max-w-6xl`, la tarjeta glass, el grid, las tres tarjetas destacadas, el CTA, la tarjeta de perfil, el avatar con glow, los `variants`, los `whileInView`, `whileHover`/`whileTap` y todos los espaciados. Solo difieren el contenido personalizado, `motion/react`, el SVG de GitHub, el avatar de iniciales, `MotionConfig` y el `Badge` mínimo.

Además se abrió el bundle real de la vista previa de 21st.dev (`cdn.21st.dev/larsen66/glassmorphism-portfolio-block-shadcnui/default/bundle...html`) en el navegador automatizado y se compararon estilos calculados:

| Métrica | Referencia | Implementación |
|---|---|---|
| Tarjeta glass | padding 48 px, radio 24 px, `blur(40px)`, `filter: none` | Igual |
| Grid | gap 48 px | Igual |
| Badge | padding `6px 16px`, letter-spacing `3.6px`, `blur(8px)` | Igual |
| Introducción | 16 px / 26 px, `max-width: 576px` | Igual (tras cambiar `md:text-lg` por `md:text-base`) |
| Tarjeta destacada | padding 20 px, radio 16 px, `blur(8px)` | Igual |
| CTA | padding `0 32px`, radio full, letter-spacing `3.5px`, 14 px | Igual |
| Enlace social | padding `12px 16px`, radio 16 px, altura 66 px | Igual |

El avatar de la referencia mide 128×128 px (`h-32 w-32`); los 102 px observados en un primer muestreo eran el `scale(0.8)` de su animación sin resolver, no una diferencia de diseño.

**Alcance de la comprobación:** se usó el navegador automatizado integrado (no hay Playwright instalado) y se compararon código fuente y estilos calculados, no píxeles. Este modelo no interpreta imágenes, por lo que **no se declara aprobación visual pixel a pixel**; la confirmación visual final corresponde al usuario en la pestaña abierta.

Tras el ajuste de `md:text-base` se repitieron `npx tsc --noEmit`, `npm run lint` y `npm run build`: los tres en verde. Sin M4, sin dependencias nuevas, sin commits ni push.
