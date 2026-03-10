# Registro de Cambios: El Grano de Oro

Este documento detalla la evolución del repositorio y las mejoras críticas implementadas hasta la fecha.

## Resumen de Cambios

### ☕ IA y Experiencia Personalizada
- **Barista Experto (Gemini API):** Integración total del asistente virtual utilizando el modelo `gemma-3-4b-it` de Google Gemini. Capaz de asesorar sobre tipos de café, moliendas y métodos de preparación.
- **Motor de Recomendaciones:** Refactorización del motor de ML (`ml_core.py`) para usar similitud de coseno, ofreciendo productos sugeridos basados en el comportamiento del usuario.
- **BI e Insights en Administración:** Implementación de una sección de "AI Insights" que analiza las ventas y genera consejos de negocio automatizados.

### 🛠️ Backend y Arquitectura
- **Robustez de Datos:** Rediseño de los modelos de base de datos (`models.py`) para incluir `CreditCard`, `Review` e `Interaction`, con eliminaciones en cascada configuradas correctamente.
- **Seguridad Universal (PBKDF2):** Sustitución de `bcrypt` por `PBKDF2` para evitar errores de codificación en Windows y asegurar la compatibilidad multiplataforma.
- **Automatización de Inicio:** Sistema de auto-seed que detecta si la base de datos está vacía, inyecta productos premium y crea el usuario administrador maestro automáticamente.
- **Gestión de Stock:** Sistema de alertas por email integrado con Mailtrap que notifica cuando el stock es crítico (< 5 unidades).

### 🎨 Frontend y UX 
- **Interfaz Premium:** Rediseño visual con una estética oscura "Luxury", incluyendo un header simétrico, iconos de tazas doradas y animaciones fluidas.
- **Navegación Móvil:** Añadido menú hamburguesa completamente funcional para una experiencia responsiva óptima.
- **Visualización de Datos:** Gráficos de ventas interactivos creados con SVG y Tailwind para el panel de administración.
- **Logística Inteligente:** Integración de búsqueda y autocompletado de direcciones en el checkout mediante la API de Nominatim.
- **Multi-idioma:** Selector de 6 idiomas (ES, EN, FR, DE, IT, ZH) con persistencia de elección.

### 🐛 Correcciones Críticas
- **Fix de CORS:** Configuración avanzada para permitir despliegues remotos y locales simultáneamente.
- **Optimización de React:** Refactorización de la tienda Zustand para manejar la persistencia del carrito y el wishlist en `localStorage` sin errores de hidratación.
- **Imágenes en Inventario:** Corrección de la tabla de administración para mostrar vistas previas de los productos.
- **Sincronización de UI:** Asegurada la actualización inmediata de la interfaz tras borrar o editar productos en el panel de control.

---
*Este documento se actualiza automáticamente conforme el proyecto evoluciona hacia una plataforma de e-commerce de nivel empresarial.*
