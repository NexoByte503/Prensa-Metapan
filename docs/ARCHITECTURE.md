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

La Fase 2 incorpora backend real: Supabase Auth, esquema PostgreSQL, RLS, Storage y servicios tipados. El portal público todavía usa datos estáticos y no consulta noticias; esa conexión corresponde a la Fase 3.

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
| `src/pages` | Composición de páginas y contenido editorial de la fase. | Servicios de datos o utilidades genéricas. |
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

### Fase 2

- 12 tablas PostgreSQL con RLS.
- Categorías iniciales por migración.
- Servicios públicos de solo lectura para categorías y artículos.
- Servicios de autenticación y perfil.
- Storage y auditoría.
- Sin noticias reales ni datos ficticios en producción.

### Fase 3

- El portal público consultará artículos publicados y categorías de Supabase.
- Se implementará el editor Tiptap, los medios, la moderación y la configuración.
- El contenido enriquecido se sanitizará antes de renderizarse.
- La búsqueda usará `search_vector` y un índice GIN.

Las categorías de la navegación pública siguen siendo estáticas en la Fase 2 para no romper el diseño. La unificación se hará al conectar el portal.

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

## 11. Fases

### Fase 1 — Base técnica

- Vite + React + TypeScript.
- Tailwind CSS 4 con identidad provisional.
- React Router con portal público y panel separado.
- Estructura modular, errores, SEO básico y accesibilidad inicial.
- Preparación de Supabase sin conexión.

### Fase 2 — Backend y seguridad

- Esquema PostgreSQL, funciones, triggers, RLS y Storage.
- Supabase Auth y recuperación de contraseña.
- Guard de `/admin`, perfil y rol.
- Servicios tipados y cliente único.
- Pruebas RLS locales y documentación.

### Fase 3 — Panel editorial y portal conectado

- Dashboard, artículos, Tiptap y medios.
- Moderación visual de comentarios.
- Publicidad, transmisiones y configuración.
- Conexión del portal público a Supabase.
- Sanitización de contenido y registro seguro de vistas.
