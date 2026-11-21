# Base de datos — Prensa Metapán

## Estado del esquema

El repositorio contiene cinco migraciones base y extensiones posteriores para búsqueda/comentarios y monetización/SEO/analítica. Antes de aplicar cambios, compara los timestamps con el historial del proyecto Supabase de destino; no vuelvas a ejecutar ni alteres migraciones ya registradas.

| Elemento | Estado |
| --- | --- |
| Esquema PostgreSQL | 12 tablas base; Fase 5 agrega `analytics_events` (13 tablas públicas en total). |
| Funciones y triggers | Incluyen búsqueda, comentarios y analítica. |
| RLS y permisos | Migraciones versionadas; pgTAP disponible en `supabase/tests/rls_checks.sql`. |
| Storage | 4 buckets y políticas para medios editoriales y anuncios. |
| Categorías iniciales | 8 categorías sembradas por migración. |
| CMS | Panel editorial protegido; los permisos efectivos los controlan RLS y PostgreSQL. |

## Migraciones

Las migraciones son reproducibles y se aplican en este orden:

| Archivo | Responsabilidad |
| --- | --- |
| `20261120090000_schema.sql` | Enums, 12 tablas, restricciones, relaciones e índices. |
| `20261120090100_functions.sql` | Funciones, triggers, perfiles, fechas, moderación, vistas y auditoría. |
| `20261120090200_rls.sql` | RLS, políticas, permisos de tabla y columna. |
| `20261120090300_storage.sql` | Buckets, límites de tamaño, MIME y políticas de Storage. |
| `20261120090400_seed_categories.sql` | Categorías editoriales iniciales. |
| `20261120100000_phase4_public_features.sql` | Búsqueda de noticias y envío público seguro de comentarios. |
| `20261120110000_phase5_monetization_seo_analytics.sql` | Campos SEO, estados de anuncios y analítica agregada. |

`supabase/seed.sql` está vacío a propósito: las categorías forman parte del esquema versionado y no deben duplicarse en el seed local.

## Modelo de datos

### Enumeraciones

- `profile_role`: `admin`, `editor`.
- `article_status`: `draft`, `review`, `published`, `archived`.
- `comment_status`: `pending`, `approved`, `rejected`, `spam`.
- `live_stream_status`: `scheduled`, `live`, `finished`.
- `article_media_type`: `image`, `video`, `audio`, `document`.

### Tablas

| Tabla | Propósito |
| --- | --- |
| `profiles` | Perfil del personal vinculado a `auth.users`. El rol inicial siempre es `editor`. |
| `categories` | Secciones editoriales con slug estable. |
| `articles` | Notas, estado editorial, autor, categoría, métricas y búsqueda. |
| `tags` | Etiquetas transversales. |
| `article_tags` | Relación muchos a muchos entre notas y etiquetas. |
| `article_media` | Metadatos de imágenes, video, audio y documentos. |
| `comments` | Comentarios de lectores; todo comentario nuevo queda `pending`. |
| `live_streams` | Transmisiones oficiales con estado y fechas. |
| `advertisements` | Campañas publicitarias con vigencia y ubicación. |
| `site_settings` | Configuración interna en JSONB. |
| `article_views` | Visualizaciones; escritura reservada a un proceso seguro futuro. |
| `audit_logs` | Registro append-only de acciones administrativas. |

### Relaciones principales

- `profiles.id` → `auth.users.id` (1:1, borrado en cascada).
- `articles.category_id` → `categories.id` (`on delete restrict`).
- `articles.author_id` → `profiles.id` (`on delete restrict`).
- `comments.article_id` → `articles.id` (`on delete cascade`).
- `comments.moderated_by` → `profiles.id` (`on delete set null`).
- `article_media`, `article_tags` y `article_views` se eliminan con su nota.

### Restricciones editoriales

- Títulos de 3 a 250 caracteres; slugs con formato `mi-nota`.
- Una nota `published` exige `published_at` y contenido no vacío.
- Los comentarios tienen entre 1 y 5000 caracteres.
- Un comentario `pending` no puede tener fecha de moderación; uno moderado sí.
- La publicidad exige `end_date >= start_date`.
- `views_count` nunca es negativo.
- Los correos de perfiles y lectores tienen validación de formato.

## Funciones y triggers

| Función / trigger | Efecto |
| --- | --- |
| `handle_new_user()` | Crea el perfil al nacer una cuenta Auth. Rol inicial: `editor`. |
| `sync_profile_email()` | Mantiene el correo del perfil alineado con `auth.users`. |
| `is_admin()`, `is_editor()`, `is_staff()` | Comprueban el rol del usuario autenticado. `SECURITY DEFINER` con `search_path = ''`. |
| `enforce_profile_role_rules()` | Bloquea cambios de rol no autorizados y la degradación del último admin. |
| `admin_set_user_role()` | RPC protegida para que un admin cambie roles. |
| `set_article_published_at()` | Asigna la fecha si una nota se publica sin fecha explícita. |
| `set_live_stream_timestamps()` | Completa inicio y fin de una transmisión. |
| `prepare_comment_insert()` | Fuerza `pending`, sin moderador ni fecha de moderación. |
| `prepare_comment_moderation()` | Registra moderador y fecha al aprobar, rechazar o marcar spam. |
| `sync_article_views_count()` | Incrementa o decrementa `articles.views_count`. |
| `record_audit_log()` | Guarda acción, entidad, actor y campos modificados; no copia contenido ni correos. |
| `set_updated_at()` | Actualiza `updated_at` en las tablas que lo necesitan. |

La auditoría cubre perfiles, categorías, artículos, transmisiones, publicidad y configuración. Los comentarios no se auditan para no almacenar datos personales de lectores.

## Búsqueda

`articles.search_vector` es una columna generada `tsvector` en español con pesos:

- Título: `A`.
- Subtítulo: `B`.
- Extracto: `C`.

Tiene un índice GIN. La columna `search_vector_phase4` amplía la búsqueda a contenido y se consulta mediante `search_published_article_ids`, que solo devuelve noticias publicadas y vigentes.

## RLS y permisos

RLS está habilitado en las tablas públicas, incluida `analytics_events`. Además, se revocan permisos amplios y se concede solo lo necesario por tabla y columna.

### Resumen de lectura pública

| Dato | Acceso anónimo |
| --- | --- |
| Categorías y etiquetas | Lectura completa. |
| Artículos | Solo `published` con `published_at <= now()`. |
| Perfiles | Solo autores de notas publicadas y únicamente `id`, `full_name`, `avatar_url`. |
| Comentarios | Solo `approved` en notas publicadas; sin `author_email`. |
| Multimedia y etiquetas de notas | Solo de notas publicadas. |
| Publicidad | Solo activa y dentro de fechas. |
| Transmisiones | Lectura pública. |
| Configuración, auditoría, vistas y eventos analíticos | Sin lectura anónima. |

### Escritura

| Operación | Editor | Admin |
| --- | --- | --- |
| Crear/editar notas propias | Sí | Sí |
| Crear/editar notas de terceros | No | Sí |
| Eliminar notas | No | Sí |
| Publicar, programar o archivar | Sí, en notas propias | Sí |
| Gestionar categorías, etiquetas y publicidad | No | Sí |
| Moderar comentarios | No | Sí |
| Gestionar usuarios y configuración | No | Sí |
| Cambiar roles | No | Sí, vía RPC |
| Leer auditoría | No | Sí |
| Subir archivos editoriales | Sí | Sí |
| Eliminar archivos | No | Sí |

Los comentarios públicos se insertan con `status = 'pending'`. El cliente anónimo no tiene permiso para escribir `status`, `moderated_by` ni `moderated_at`; el trigger vuelve a forzar el estado pendiente.

El detalle de las políticas y el modelo de amenazas está en [`SECURITY.md`](SECURITY.md).

## Storage

| Bucket | Público | Límite | Tipos permitidos |
| --- | --- | --- | --- |
| `article-images` | Lectura | 10 MiB | JPEG, PNG, WebP, AVIF |
| `article-media` | Lectura | 50 MiB | Imágenes, MP4, WebM, MP3, OGG, PDF |
| `author-avatars` | Lectura | 2 MiB | JPEG, PNG, WebP, AVIF |
| `advertisements` | Lectura | 5 MiB | JPEG, PNG, WebP, AVIF, GIF |

Reglas:

- Personal autenticado puede subir a los buckets editoriales.
- Solo un admin sube publicidad y elimina archivos.
- No se permiten SVG ni ejecutables.
- Convención recomendada de ruta: `{article-id}/{uuid}.{ext}` o `{profile-id}/{uuid}.{ext}`.
- Validar dimensiones y contenido real de las imágenes; el MIME declarado no basta como validación visual.

## Categorías iniciales

La migración siembra: Metapán, Santa Ana, Nacionales, Internacionales, Deportes, Entretenimiento, Economía y Tecnología.

La navegación pública usa las ocho categorías de `src/config/categories.ts`; sus slugs coinciden con la migración de categorías. Mantén ambas fuentes sincronizadas al cambiar el menú o el seed.

## Flujo local

Requisitos: Docker Desktop activo y Supabase CLI disponible mediante `npx`.

```bash
# Iniciar Supabase local (la primera vez descarga imágenes)
npx supabase start

# Ver URL, claves y servicios
npx supabase status

# Recrear la base desde cero y aplicar las 5 migraciones
npx supabase db reset

# Ejecutar las pruebas RLS
npx supabase test db

# Detener el entorno local
npx supabase stop
```

Servicios locales habituales:

- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- Correo de prueba (Mailpit/Inbucket): `http://127.0.0.1:54324`
- PostgreSQL: `127.0.0.1:54322`

Las claves locales son efímeras y no deben commitearse. `supabase/.temp/` está ignorado por Git.

## Flujo remoto

Cuando exista el proyecto real:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Antes de `db push`:

1. Revisar el SQL y el diff contra el proyecto.
2. Confirmar que el proyecto no tiene cambios manuales sin migración.
3. Hacer respaldo o trabajar primero en un proyecto de staging.
4. Aplicar en horario controlado.
5. Ejecutar las comprobaciones RLS en staging y producción.

Reglas:

- No editar migraciones ya aplicadas en producción; crear una nueva.
- Cada cambio de esquema debe tener su migración.
- No crear tablas desde Studio sin migración correspondiente.
- No deshabilitar RLS para "resolver" un error de permisos.
- No usar `service_role` en el navegador ni en variables `VITE_*`.

## Tipos TypeScript

`src/types/database.ts` contiene una representación manual del esquema. Debe actualizarse junto con cada migración.

Cuando el proyecto remoto esté vinculado, se puede generar una referencia:

```bash
npx supabase gen types typescript --project-id <project-ref> --schema public \
  > src/types/database.generated.ts
```

No sobrescribir el archivo manual sin revisar el diff: los servicios y componentes importan alias como `ArticleRow`, `ProfileRole` y `Database`. La estrategia recomendada es generar a un archivo temporal, comparar y trasladar los cambios de forma controlada.

## Pruebas RLS

Archivo: `supabase/tests/rls_checks.sql`.

Cubre 49 comprobaciones dentro de una transacción que termina en `ROLLBACK`:

- RLS activo en las 12 tablas, buckets y políticas.
- Visitante: solo contenido publicado; sin correos, auditoría, configuración ni visualizaciones.
- Comentarios: inserción pública como `pending`, sin autoaprobación ni moderación.
- Editor: lectura de todos los estados, creación/edición solo de notas propias, sin borrar ni cambiar roles.
- Admin: auditoría, categorías, configuración, moderación y cambio de rol.
- Protección del último administrador.
- Permisos de columna y RPC.

Comando:

```bash
npx supabase test db
```

El archivo degrada temporalmente a otros administradores locales para aislar la prueba del "último admin". La transacción se revierte al final. **No ejecutar estas pruebas contra producción.**

Resultado histórico de la validación de Fase 2: `49 tests`, `PASS`. Reejecuta la suite en una base local o staging después de cambios de esquema; nunca contra producción.

## Consideraciones de despliegue

- El estado remoto depende del proyecto Supabase seleccionado; comprueba su historial antes de cualquier `db push`.
- Crea cuentas editoriales desde Auth y asigna roles mediante el procedimiento administrativo documentado.
- Las vistas se registran mediante la RPC segura de analítica; el cliente no inserta directamente en `article_views`.
- Los comentarios públicos se envían mediante RPC y quedan pendientes de moderación.
- Define la retención de comentarios, analítica y auditoría antes del lanzamiento.
