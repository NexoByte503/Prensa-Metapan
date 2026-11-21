# Prensa Metapán

Portal de noticias de **Metapán, Santa Ana y El Salvador**. El proyecto se construye por fases, con una arquitectura modular, TypeScript estricto y una identidad editorial pensada primero para móvil.

> **Estado: Fase 2 — Backend y seguridad.** El esquema PostgreSQL, las políticas RLS, Supabase Auth, Storage y los servicios tipados están implementados y probados en Supabase local. El panel editorial completo y la conexión del portal público a la base de datos se desarrollarán en la Fase 3. Todavía no hay noticias reales publicadas ni un proyecto remoto vinculado.

## Stack

| Área | Tecnología |
| --- | --- |
| Interfaz | React 19 + TypeScript |
| Build | Vite 8 |
| Estilos | Tailwind CSS 4 |
| Navegación | React Router DOM 7 |
| Backend | Supabase + PostgreSQL |
| Autenticación | Supabase Auth |
| Almacenamiento | Supabase Storage |
| Iconografía | Lucide React |
| Formularios | React Hook Form + Zod |
| Editor previsto | Tiptap (Fase 3) |
| Utilidades UI | clsx + tailwind-merge |
| Tipografía | Inter Variable + Newsreader Variable (autoalojadas) |

## Requisitos

- Node.js **22.12 o superior**.
- npm 10 o superior.
- Docker Desktop y Supabase CLI para el backend local.
- Git.

## Ejecutar localmente

Solo portal público:

```bash
npm install
npm run dev
```

Abre la dirección que muestra Vite (por defecto `http://localhost:5173`). El portal público funciona sin variables de entorno.

Para el panel administrativo y la base de datos:

```bash
# 1. Iniciar Supabase local
npx supabase start

# 2. Copiar variables
Copy-Item .env.example .env

# 3. Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY con los valores locales
# 4. Aplicar migraciones y crear usuarios (ver docs/DEVELOPMENT.md)
npm run dev
```

Las claves locales de Supabase son efímeras y no deben commitearse.

### Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `VITE_SITE_URL` | Recomendada | URL pública del sitio para canonical y metadatos. |
| `VITE_SITE_INDEXABLE` | No | `true` permite indexación. Por defecto: `false`. |
| `VITE_SUPABASE_URL` | Para `/admin` | URL del proyecto de Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Para `/admin` | Clave pública (anon o publishable) sujeta a RLS. |

> **Seguridad:** nunca coloques la `service_role` key, secret keys ni contraseñas en variables `VITE_*`; se incluyen en el bundle del navegador.

## Scripts

| Comando | Función |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Verifica TypeScript y genera el build de producción. |
| `npm run typecheck` | Ejecuta la verificación estricta de TypeScript. |
| `npm run lint` | Ejecuta Oxlint. |
| `npm run preview` | Sirve localmente el build de producción. |
| `npx supabase start` | Inicia PostgreSQL, Auth, Storage, API y Studio. |
| `npx supabase db reset` | Recrea la base local y aplica las migraciones. |
| `npx supabase test db` | Ejecuta las 49 pruebas RLS con pgTAP. |
| `npx supabase stop` | Detiene el entorno local. |

## Estructura

```text
├── docs/                      # Arquitectura, rutas, desarrollo, base de datos y seguridad
├── public/                    # Favicon, robots.txt y recursos estáticos
├── src/
│   ├── components/
│   │   ├── auth/              # AuthCard, AuthAlert, PasswordField, RequireAuth
│   │   ├── comments/          # Reservado para la fase de participación
│   │   ├── common/            # Container, botones, estados vacíos, errores
│   │   ├── layout/            # Header, menú móvil y footer
│   │   ├── multimedia/        # Reservado para galerías y video
│   │   ├── news/              # Tarjetas y componentes editoriales
│   │   └── seo/               # Metadatos del documento
│   ├── config/                # Sitio, entorno validado, categorías y navegación
│   ├── contexts/              # AuthProvider y contrato del contexto
│   ├── hooks/                 # Scroll lock, focus trap, teclado, useAuth
│   ├── layouts/               # PublicLayout, AdminLayout y AdminAuthLayout
│   ├── pages/
│   │   ├── admin/             # Login, recuperación y estado del panel
│   │   └── public/            # Páginas del portal público
│   ├── routes/                # Tabla de rutas y helpers de URL
│   ├── services/
│   │   ├── auth/              # Login, logout, recuperación y errores seguros
│   │   ├── content/           # Consultas públicas tipadas
│   │   └── supabase/          # Cliente único tipado y validación de configuración
│   ├── styles/                # Tailwind y tokens de diseño
│   ├── types/                 # Modelos de dominio y Database
│   ├── utils/                 # Fechas, clases CSS y errores
│   ├── App.tsx                # Bootstrap del router y AuthProvider
│   └── main.tsx               # Punto de entrada de React
├── supabase/
│   ├── config.toml            # Configuración local de Supabase
│   ├── migrations/            # 5 migraciones reproducibles
│   ├── tests/rls_checks.sql   # 49 pruebas RLS con pgTAP
│   └── functions/             # Reservado para Edge Functions
├── .env.example
└── vite.config.ts
```

La explicación de capas y decisiones está en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Rutas

| Ruta | Estado |
| --- | --- |
| `/` | Portada pública con estado de lanzamiento. |
| `/noticias` | Archivo vacío con navegación por secciones. |
| `/noticias/:slug` | Placeholder honesto: la nota no está publicada. |
| `/categorias/:slug` | Sección por categoría; slug inválido muestra 404. |
| `/buscar` | Formulario validado; sin resultados ficticios. |
| `/quienes-somos` | Propósito, cobertura y estado del proyecto. |
| `/contacto` | Canales oficiales en habilitación, sin datos inventados. |
| `/politica-editorial` | Principios editoriales en versión preliminar. |
| `/privacidad` | Tratamiento de datos de la fase actual. |
| `/terminos` | Condiciones preliminares. |
| `/admin/login` | Acceso editorial con Supabase Auth. |
| `/admin/recuperar-contrasena` | Solicitud de enlace de recuperación. |
| `/admin/restablecer-contrasena` | Nueva contraseña desde enlace verificado. |
| `/admin` | Panel protegido; muestra perfil, rol y estado de Fase 2. |
| `*` | Página 404 dentro del portal público. |

Detalle completo en [`docs/ROUTES.md`](docs/ROUTES.md).

## Backend y seguridad

Implementado y validado en local:

- 5 migraciones: esquema, funciones/triggers, RLS, Storage y categorías.
- 12 tablas con RLS, restricciones, índices y búsqueda full-text en español.
- Roles `admin` y `editor`; sin registro público de usuarios.
- Comentarios nuevos siempre `pending`; correo del lector nunca público.
- Storage con lectura pública y escritura reservada al personal.
- Auditoría append-only sin correos ni contenido completo.
- Recuperación de contraseña con Supabase Auth y correo local.
- 49 pruebas RLS aprobadas con `npx supabase test db`.

Pendiente de intervención manual: crear el proyecto remoto, aplicar las migraciones, configurar SMTP/Redirect URLs, crear las cuentas reales y verificar RLS en staging/producción.

Consulta [`docs/DATABASE.md`](docs/DATABASE.md) y [`docs/SECURITY.md`](docs/SECURITY.md).

## Identidad visual

- Paleta provisional inspirada en la identidad visual: azul profundo, turquesa, plata y blanco.
- Tipografía serif **Newsreader** para titulares e **Inter** para interfaz.
- Estética de periódico: reglas, jerarquía tipográfica, navegación por secciones y grillas editoriales.
- Interfaz responsive con prioridad móvil, menú accesible con bloqueo de scroll, focus trap y cierre con `Escape`.
- Los tokens visuales están en `src/styles/index.css` (`@theme` de Tailwind 4).

## Validaciones de la Fase 2

- [x] Migraciones aplicadas desde cero con `npx supabase db reset`.
- [x] 49 pruebas RLS aprobadas con `npx supabase test db`.
- [x] RLS activo en las 12 tablas; políticas de Storage verificadas.
- [x] Registro público bloqueado (`422` en el endpoint de signup).
- [x] Correo de lector y de perfil no legible por `anon`.
- [x] Login de admin y editor; perfil y rol visibles.
- [x] Logout y sesión persistente verificados.
- [x] Recuperación y restablecimiento de contraseña verificados con Mailpit.
- [x] `/admin` sin sesión redirige al login; `/admin/login` con sesión redirige al panel.
- [x] Estado sin Supabase configurado verificado.
- [x] Móvil sin desbordamiento horizontal en login y panel.
- [x] `npm run typecheck`, `npm run lint` y `npm run build`.

## Próxima fase (no iniciada)

1. Construir el panel editorial: dashboard, artículos, editor Tiptap y medios.
2. Conectar el portal público a Supabase: archivo, detalle, categorías y búsqueda.
3. Implementar la moderación visual de comentarios y el registro seguro de vistas.
4. Gestionar publicidad, transmisiones y configuración desde el panel.
5. Sanitizar el contenido enriquecido antes de renderizarlo.
6. Configurar producción: proyecto remoto, SMTP, Redirect URLs, CSP y backups.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Rutas](docs/ROUTES.md)
- [Desarrollo](docs/DEVELOPMENT.md)
- [Base de datos](docs/DATABASE.md)
- [Seguridad](docs/SECURITY.md)
