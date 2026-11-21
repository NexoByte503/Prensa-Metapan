# Arquitectura — Prensa Metapán

## 1. Visión general

Prensa Metapán es una SPA construida con React, Vite y TypeScript estricto. El portal público y el acceso editorial comparten el router y el sistema de diseño, pero mantienen layouts y responsabilidades separados.

```text
Navegador
  └── AuthProvider (sesión, perfil, rol)
        └── React Router
              ├── Portal público
              │     └── Páginas → componentes → estado local
              └── Acceso editorial
                    └── RequireAuth → AdminLayout → páginas admin
                                            └── servicios → Supabase
                                                              └── PostgreSQL + RLS
```

El portal usa React Router y servicios tipados; las funciones editoriales y de contenido se conectan a Supabase Auth, PostgreSQL con RLS y Storage. La navegación de categorías parte de `src/config/categories.ts`, cuyos slugs deben coincidir con el seed de la base.

## 2. Principios

1. **TypeScript estricto:** `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` y comprobaciones de variables no usadas.
2. **Separación de capas:** las páginas componen; los componentes presentan; los servicios acceden a datos; los hooks encapsulan comportamiento.
3. **Rutas declarativas:** la tabla de rutas vive en `src/routes/router.tsx`, no en `App.tsx`.
4. **Carga diferida:** las páginas se cargan con `React.lazy` y `Suspense`. El panel administrativo no comparte el bundle inicial con las páginas públicas.
5. **Honestidad editorial:** no se muestran noticias, autores, canales de contacto ni métricas inventadas.
6. **Accesibilidad:** landmarks semánticos, enlace para saltar al contenido, foco visible, menú móvil con focus trap, cierre con `Escape` y bloqueo de scroll.
7. **Seguridad por defecto:** la clave pública es la única configuración de Supabase en el cliente; RLS es la autorización real y `service_role` nunca llega al navegador.
8. **Backend versionado:** todo cambio de esquema, política o bucket debe existir como migración reproducible.

## 3. Capas y responsabilidades

| Carpeta | Responsabilidad | No debe contener |
| --- | --- | --- |
| `src/routes` | Tabla de rutas, URLs tipadas y carga de páginas. | Lógica de negocio o markup extenso. |
| `src/layouts` | Estructura compartida (público, acceso y panel). | Consultas de datos. |
| `src/pages` | Composición de páginas y contenido editorial. | Servicios de datos o utilidades genéricas. |
| `src/components/common` | Primitivas reutilizables de interfaz. | Reglas de negocio. |
| `src/components/auth` | Formularios y guard de acceso editorial. | Consultas directas a PostgreSQL. |
| `src/components/news` | Piezas editoriales reutilizables. | Acceso directo a Supabase. |
| `src/config` | Configuración estática, categorías, navegación y entorno validado. | Secretos o lógica de presentación. |
| `src/contexts` | Sesión, perfil, rol y ciclo de vida de Auth. | Markup o estilos. |
| `src/services` | Integración con Supabase y futuros servicios. | JSX ni clases de Tailwind. |
| `src/hooks` | Comportamiento reutilizable y `useAuth`. | Markup. |
| `src/types` | Modelos de dominio y tipos de `Database`. | Valores de configuración. |
| `src/utils` | Funciones puras y helpers sin estado. | Componentes React. |

### Flujo de datos

```text
Página → hook/servicio → cliente Supabase → PostgreSQL + RLS
                           ↓
                  estados de carga / error / vacío
```

Las páginas no importan el cliente directamente. Los servicios devuelven datos tipados y errores controlados. El cliente se crea una sola vez y valida la configuración antes de usarse.

## 4. Autenticación

`AuthProvider` es el único dueño del estado de sesión:

1. Valida la configuración de Supabase.
2. Recupera la sesión persistida.
3. Escucha `onAuthStateChange`.
4. Carga el perfil y el rol desde `profiles`.
5. Expone `signIn`, `signOut`, `requestPasswordReset`, `updatePassword` y `refreshProfile`.

`RequireAuth` consume ese estado, no la sesión directamente. El rol se usa para presentar la interfaz; las políticas RLS deciden qué datos y operaciones están permitidos.

Flujo de recuperación:

```text
/admin/recuperar-contrasena
  → Supabase Auth envía enlace
  → /admin/restablecer-contrasena (sesión temporal)
  → updatePassword
  → signOut
  → /admin/login con confirmación
```

## 5. Rutas y layouts

- `PublicLayout`: header, footer, `ScrollRestoration`, enlace de salto y `Suspense`.
- `AdminAuthLayout`: layout sobrio para login y recuperación, con regreso al portal.
- `AdminLayout`: chrome administrativo independiente, perfil, rol, cierre de sesión y `noindex`.
- `RequireAuth`: guard de sesión y perfil para `/admin`.
- `RouteErrorPage`: último recurso ante errores de la tabla de rutas.
- `ErrorBoundary`: captura errores de renderizado fuera del router.

La estructura completa está documentada en [`ROUTES.md`](ROUTES.md).

## 6. Estado

- Estado local para menú móvil, formularios y estados de carga.
- Estado de URL para búsqueda y navegación.
- `AuthProvider` para sesión, perfil, rol y errores de autenticación.
- No se crea un estado global adicional hasta que exista una necesidad compartida real.

## 7. Datos y contenido

### Portal público y backend

- Las páginas públicas consultan artículos publicados, categorías y comentarios aprobados mediante servicios tipados.
- El CMS usa autenticación Supabase y los roles admin/editor; RLS y permisos de PostgreSQL son la autorización efectiva.
- El editor Tiptap, la biblioteca de medios, la moderación, transmisiones, publicidad y estadísticas forman parte del panel.
- La búsqueda pública usa `search_published_article_ids` y el índice `search_vector_phase4`.
- Los metadatos SEO se guardan por artículo; las funciones de Vercel generan respuestas de noticia, sitemap y robots.
- La lista de categorías se mantiene en `src/config/categories.ts` y se sincroniza con los slugs sembrados en PostgreSQL.

## 8. Estilos e identidad

Tailwind CSS 4 se configura mediante tokens en `src/styles/index.css`:

- `paper`, `paper-strong`: fondos claros de lectura con matiz frío.
- `ink`, `ink-muted`: jerarquía de texto en verde tinta.
- `rule`, `rule-strong`: líneas y separadores.
- `brand`, `brand-dark`, `brand-soft`, `brand-light`: acento turquesa editorial provisional.
- `night`: superficies azul petróleo para bandas, header admin y footer.
- `font-serif`: Newsreader Variable.
- `font-sans`: Inter Variable.

La paleta definitiva se ajustará cuando se entregue el logotipo oficial. Los componentes usan tokens semánticos, no valores hexadecimales sueltos, para que el cambio sea centralizado.

## 9. Rendimiento

- Carga diferida por página.
- Fuentes autoalojadas con `font-display: swap`.
- Iconos importados de forma individual desde Lucide.
- Imágenes futuras deberán usar `loading="lazy"`, `decoding="async"` y dimensiones estables.
- `ScrollRestoration` restaura la posición al navegar.
- Las páginas administrativas no se descargan en la visita pública inicial.

## 10. Errores

| Nivel | Mecanismo |
| --- | --- |
| Error de ruta | `errorElement` → `RouteErrorPage`. |
| Error de renderizado | `ErrorBoundary` en `App.tsx`. |
| Error de configuración | `SupabaseConfigurationError` al solicitar el cliente. |
| Error de autenticación | Mensajes seguros traducidos en `services/auth/errors.ts`. |
| Error de formulario | Mensajes de Zod en la interfaz. |
| Error RLS / permisos | Estado controlado; nunca se deshabilita RLS. |
| Ruta inexistente | Página 404 pública o administrativa. |

En desarrollo se muestra el mensaje técnico del error de ruta; en producción solo se muestra una descripción segura.

## 11. Alcance funcional

- **Fase 2:** esquema PostgreSQL, funciones, triggers, RLS, Storage y autenticación.
- **Fase 3:** CMS editorial, roles, portal conectado, contenido y gestión de medios.
- **Fase 4:** búsqueda pública y envío seguro de comentarios.
- **Fase 5:** monetización, campos SEO y analítica agregada.
- **Fase 6:** pruebas, seguridad y preparación para el lanzamiento.

Este resumen describe el alcance del código; el estado de aplicación en Supabase y del despliegue se verifica por entorno.
