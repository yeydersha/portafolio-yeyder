# Requisitos del Portafolio Personal

## Requisitos Funcionales

1. **Perfil Profesional**
   - Mostrar información personal (nombre, rol, descripción breve).
   - Incluir secciones de habilidades, formación y experiencia.

2. **Sección de Proyectos**
   - Listar proyectos con título, descripción, tecnologías usadas y enlaces/github.
   - Soporte para categorías: académicos, personales, aplicaciones.
   - Proyectos iniciales previstos:
     - ElectroTero: plataforma web para servicios de energía solar y gestión de solicitudes.
     - Fiore: sistema de inventario y gestión de productos para una joyería.
     - SportReserve: plataforma académica de reservas deportivas.
     - Alessia: aplicación de mascota virtual para Windows.

3. **Hoja de Vida**
   - Funcionalidad para descargar currículum en formato PDF.
   - Contenido sincronizado con la información del portafolio.

4. **Enlaces y Contacto**
   - Enlaces a GitHub, LinkedIn y otras redes profesionales.
   - Formulario de contacto o medios directos (email, etc.).

5. **Panel de Administración (futuro)**
   - Arquitectura preparada para incorporar un panel de administración sin reconstrucción completa.
   - Contenidos gestionados mediante archivos estructurados y tipados inicialmente.

## Requisitos No Funcionales

1. **Rendimiento**
   - Tiempo de carga inicial inferior a 2 segundos en conexiones moderadas.
   - Optimización de assets y código para producción.
   - Lighthouse score superior a 90 en categorías de rendimiento, accesibilidad y buenas prácticas.

2. **Accesibilidad (WCAG 2.2 Level AA)**
   - Soporte completo para lectores de pantalla.
   - Contraste de colores adecuado en tema oscuro.
   - Navegación por teclado completa.
   - Atributos ARIA apropiados y semántica HTML correcta.

3. **Responsive Design**
   - Funcionamiento óptimo en móviles, tablets y escritorio.
   - Breakpoints definidos para: 320px, 768px, 1024px, 1440px.

4. **Mantenibilidad**
   - Código TypeScript con tipado fuerte.
   - Componentes reutilizables y bien documentados.
   - Arquitectura escalable para incorporar nuevas secciones y proyectos.

5. **Rendimiento Visual**
   - Animaciones fluidas sin bloqueo del hilo principal.
   - Evitar efectos excesivos que impacten el rendimiento.
   - Motion for React implementado de manera equilibrada.

6. **Compatibilidad de Navegadores**
   - Chrome, Firefox, Safari, Edge (últimas versiones).
   - Soporte para Next.js 16 y React 19.

7. **Seguridad**
   - No almacenar credenciales sensibles en el frontend.
   - Sanitización de entradas en formularios de contacto.
   - CSP (Content Security Policy) adecuada.