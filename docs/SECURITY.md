# Seguridad — Prensa Metapán

## Controles en el código

- La autenticación editorial usa Supabase Auth. Las rutas administrativas tienen guardas en el cliente; PostgreSQL RLS y los permisos de tabla son la autorización efectiva.
- Las credenciales `service_role`/secretas no deben existir en variables `VITE_*` ni llegar al navegador. El cliente solo puede usar la URL y clave pública con RLS activo.
- `.env` y `.env.*` están ignorados por Git; `.env.example` contiene valores vacíos para evitar apuntar accidentalmente a un proyecto compartido.
- El acceso de comentarios públicos se limita a inserciones pendientes y las lecturas de moderación requieren permisos. Los eventos analíticos no deben contener datos personales.
- La respuesta SSR de noticias escapa textos y URLs, elimina etiquetas de contenido activo y limita las imágenes a HTTP/HTTPS.
- Vercel aplica CSP, HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`. CSP debe ajustarse si se agregan dominios de fuentes, scripts, medios o un host Supabase personalizado.
- `/robots.txt` solo permite indexar cuando `VITE_SITE_INDEXABLE=true`; el valor predeterminado mantiene el sitio fuera de índices.

## Estado de validación

Las pruebas locales cubren escape de contenido SSR, rechazo de URLs activas, los dos modos de robots y el orden de rewrites/cabeceras. Ver el resultado y las limitaciones en [`FASE6_AUDITORIA.md`](FASE6_AUDITORIA.md).

Las verificaciones de base de datos se encuentran en `supabase/tests/rls_checks.sql`. No se deben ejecutar contra producción: contienen operaciones de prueba que cambian roles dentro de una transacción. En esta auditoría no se ejecutaron porque Supabase CLI no está instalado; tampoco se encontró una instancia local de Supabase disponible.

## Requisitos antes de producción

- Aplicar migraciones únicamente en un entorno de staging y revisar RLS en todas las tablas y buckets.
- Confirmar que el proyecto remoto tiene desactivado el registro público, SMTP y URLs de redirección exactas.
- Configurar URL/dominio final, variables Vercel y una cuenta administradora mediante Supabase Auth.
- Revisar CSP contra los dominios reales usados por embeds, imágenes y Supabase; verificar HSTS solo para dominios que siempre usarán HTTPS.
- Activar indexación solo cuando exista contenido aprobado, dominio canónico y páginas legales revisadas.
- Ejecutar una auditoría de accesibilidad y Core Web Vitals en el dominio desplegado, y comprobar login/editor/moderación en staging.
- Definir contacto de reporte de vulnerabilidades, retención de comentarios y analítica, y procedimiento de respuesta.

No se debe publicar una clave `service_role`, contraseña, token SMTP ni secreto de despliegue en el frontend, documentación o repositorio.
