# Portafolio de Yeyder Otero Galván

Portafolio web personal construido con Next.js. Presenta el perfil profesional, los proyectos destacados, las tecnologías y herramientas utilizadas, el proceso de desarrollo y los medios de contacto. Incluye dos demostraciones interactivas que se ejecutan íntegramente en este repositorio.

## Tecnologías

- Next.js 16 (App Router) y React 19
- TypeScript y Tailwind CSS v4
- Motion for React y lucide-react
- ESLint, Node.js test runner y tsc para las pruebas

## Funcionalidades principales

- Presentación profesional con secciones de proyectos, tecnologías, proceso y contacto.
- Carrusel de proyectos con presentaciones ampliadas, apertura y cierre animados y navegación por teclado.
- Demo interactiva de Fiore en `/proyectos/fiore/demo`.
- Demo interactiva de Taquilla de Cine en `/proyectos/taquilla-cine/demo`.
- Diseño adaptable a escritorio, tablet y móvil, con soporte para `prefers-reduced-motion`.

## Proyectos destacados

### ElectroTero

Sitio web publicado para presentar servicios de energía solar y gestionar solicitudes de clientes. La presentación del portafolio muestra una captura estática de su landing pública; las funciones administrativas no se exponen por motivos de privacidad y seguridad.

### Fiore

Aplicación de gestión de inventario para productos de joyería: productos, categorías, proveedores, movimientos de stock, ventas y reportes. La demo local permite explorar esas operaciones con datos ficticios y almacenamiento en el navegador.

### Taquilla de Cine

Sistema académico para administrar películas, funciones, cupos, compras de entradas y reportes de ventas. La demo local reproduce las reglas principales con datos ficticios, sin backend ni pagos reales.

Los proyectos originales de Fiore y Taquilla de Cine son sistemas independientes con su propio stack (Next.js/PostgreSQL el primero; Angular, Spring Boot, Java y PostgreSQL el segundo). Las demos de este repositorio son adaptaciones locales en React y TypeScript: no ejecutan esos sistemas, no acceden a sus bases de datos y no contienen información real.

## Requisitos

- Node.js 20 o superior (verificado con Node.js 24) y npm.
- No se necesitan variables de entorno ni servicios externos para ejecutar el portafolio o las demos.

## Instalación

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Build de producción. |
| `npm run start` | Servidor de producción tras el build. |
| `npm run lint` | Comprobación con ESLint. |
| `npm run test:b0` | Compila las pruebas y ejecuta la suite completa (227 pruebas). |
| `npm run test:b5` | Alias de `npm run test:b0`. |

## Autor

Yeyder Otero Galván — `yeyderotero@gmail.com` — [@yeydersha](https://github.com/yeydersha). Estudiante de Ingeniería Informática en UNIPAZ.

## Estado actual

Portafolio terminado y versionado en GitHub. Las 227 pruebas, la comprobación de tipos, ESLint y el build de producción se ejecutan correctamente. El repositorio no incluye configuración de despliegue automático.
