# Rutas — Prensa Metapán

La tabla de rutas se declara en `src/routes/router.tsx`. Las URLs se generan con helpers de `src/routes/paths.ts` para evitar cadenas duplicadas.

## Portal público

| Ruta | Página | Estado | Notas |
| --- | --- | --- | --- |
| `/` | `HomePage` | Lista | Portada editorial con estado de lanzamiento. |
| `/noticias` | `NewsPage` | Lista | Archivo vacío y navegación por secciones. |
| `/noticias/:slug` | `ArticlePage` | Placeholder | No muestra una nota ficticia. `noindex`. |
| `/categorias/:slug` | `CategoryPage` | Lista | Slug inválido renderiza `NotFoundPage`. |
| `/buscar` | `SearchPage` | Lista | Formulario validado. Sin backend conectado ni resultados ficticios. `noindex`. |
| `/quienes-somos` | `AboutPage` | Lista | Propósito, cobertura y fases. |
| `/contacto` | `ContactPage` | Lista | Canales en habilitación; sin datos inventados. |
| `/politica-editorial` | `EditorialPolicyPage` | Lista | Documento preliminar. |
| `/privacidad` | `PrivacyPage` | Lista | Tratamiento de datos de la fase actual. |
| `/terminos` | `TermsPage` | Lista | Condiciones preliminares. |
| `*` | `NotFoundPage` | Lista | 404 dentro del layout público. |

## Acceso editorial

| Ruta | Página | Acceso | Notas |
| --- | --- | --- | --- |
| `/admin/login` | `AdminLoginPage` | Público | Inicio de sesión con Supabase Auth. `noindex`. |
| `/admin/recuperar-contrasena` | `AdminForgotPasswordPage` | Público | Solicitud de enlace; no revela si el correo existe. |
| `/admin/restablecer-contrasena` | `AdminResetPasswordPage` | Sesión de recuperación | Formulario de nueva contraseña; cierra sesión al guardar. |

Estas rutas usan `AdminAuthLayout`, un layout sin enlaces internos del panel, con enlace de regreso al portal.

## Panel administrativo

| Ruta | Página | Acceso | Notas |
| --- | --- | --- | --- |
| `/admin` | `AdminHomePage` | Autenticado | Perfil, rol y estado honesto de Fase 2. `noindex`. |
| `/admin/*` | `AdminNotFoundPage` | Autenticado | 404 dentro del layout administrativo. |

Toda la rama `/admin` está envuelta por `RequireAuth`:

- Espera la carga de la sesión antes de decidir.
- Sin sesión redirige a `/admin/login` conservando el destino.
- Con sesión y perfil válido muestra `AdminLayout`.
- Si el perfil no puede verificarse, muestra un estado de error con reintento y cierre de sesión.
- Si Supabase no está configurado, redirige al login con un aviso.

El guard mejora la experiencia, pero **no es la frontera de seguridad**. Las consultas y operaciones están autorizadas por RLS en PostgreSQL.

## Comportamiento

- **Carga diferida:** cada página se importa con `React.lazy`; los layouts muestran un fallback accesible.
- **Scroll:** `ScrollRestoration` restaura la posición en navegaciones del router.
- **Enlaces internos:** siempre mediante `Link`/`NavLink` y los helpers de `paths`.
- **404:** las rutas no reconocidas del portal público conservan header y footer.
- **Errores:** los errores de ruta muestran `RouteErrorPage`; los errores de renderizado usan `ErrorBoundary`.
- **Indexación:** `VITE_SITE_INDEXABLE=false` aplica `noindex, nofollow` globalmente. Las páginas de búsqueda, detalle vacío, 404, autenticación y panel fuerzan `noindex` incluso si la indexación global se activa.
- **Destino tras login:** solo se aceptan rutas internas que comiencen por `/admin`; no se permiten redirecciones externas.

## Añadir una ruta

1. Crear la página en `src/pages/public/` o `src/pages/admin/` con `export default`.
2. Añadir el helper de URL en `src/routes/paths.ts` si se reutilizará.
3. Registrar la carga diferida en `src/routes/routePages.ts` y la ruta en `src/routes/router.tsx`.
4. Añadir `<Seo>` con título, descripción, ruta canónica e indexación.
5. Añadir el enlace a la navegación solo si corresponde a una sección principal.
6. Ejecutar `npm run build` y probar la navegación directa.
