-- =============================================================================
-- Prensa Metapán — Fase 2
-- Esquema base: perfiles, contenido editorial, comentarios, publicidad y auditoría.
--
-- Esta migración crea únicamente estructura y restricciones. Las funciones,
-- triggers, políticas RLS, Storage y datos semilla viven en migraciones
-- posteriores para mantener cada responsabilidad separada y auditable.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enumeraciones
-- -----------------------------------------------------------------------------

create type public.profile_role as enum ('admin', 'editor');
create type public.article_status as enum ('draft', 'review', 'published', 'archived');
create type public.comment_status as enum ('pending', 'approved', 'rejected', 'spam');
create type public.live_stream_status as enum ('scheduled', 'live', 'finished');
create type public.article_media_type as enum ('image', 'video', 'audio', 'document');

-- -----------------------------------------------------------------------------
-- Perfiles administrativos
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on update cascade on delete cascade,
  full_name text not null,
  email text not null,
  role public.profile_role not null default 'editor',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_length_check check (
    char_length(btrim(full_name)) between 1 and 120
  ),
  constraint profiles_email_format_check check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  constraint profiles_email_unique unique (email)
);

comment on table public.profiles is
  'Perfil editorial vinculado a auth.users. El rol nunca se acepta desde el cliente.';
comment on column public.profiles.email is
  'Correo sincronizado desde Supabase Auth; no se expone en el portal público.';

-- -----------------------------------------------------------------------------
-- Categorías
-- -----------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_name_length_check check (
    char_length(btrim(name)) between 1 and 80
  ),
  constraint categories_slug_format_check check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint categories_description_length_check check (
    description is null or char_length(description) <= 600
  ),
  constraint categories_slug_unique unique (slug)
);

comment on table public.categories is
  'Secciones editoriales del portal. Los slugs son estables y únicos.';

-- -----------------------------------------------------------------------------
-- Artículos
-- -----------------------------------------------------------------------------

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  subtitle text,
  content text not null default '',
  excerpt text,
  featured_image text,
  category_id uuid not null
    references public.categories (id) on update cascade on delete restrict,
  author_id uuid not null
    references public.profiles (id) on update cascade on delete restrict,
  status public.article_status not null default 'draft',
  is_featured boolean not null default false,
  is_breaking boolean not null default false,
  views_count bigint not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('spanish'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish'::regconfig, coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('spanish'::regconfig, coalesce(excerpt, '')), 'C')
  ) stored,

  constraint articles_title_length_check check (
    char_length(btrim(title)) between 3 and 250
  ),
  constraint articles_slug_format_check check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint articles_subtitle_length_check check (
    subtitle is null or char_length(subtitle) <= 300
  ),
  constraint articles_excerpt_length_check check (
    excerpt is null or char_length(excerpt) <= 600
  ),
  constraint articles_views_count_check check (views_count >= 0),
  constraint articles_published_at_check check (
    status <> 'published' or published_at is not null
  ),
  constraint articles_published_content_check check (
    status <> 'published' or char_length(btrim(content)) > 0
  ),
  constraint articles_slug_unique unique (slug)
);

comment on table public.articles is
  'Notas editoriales. El contenido se almacena como texto enriquecido y deberá sanitizarse antes de renderizarse.';
comment on column public.articles.published_at is
  'Fecha de publicación efectiva. Las notas programadas usan una fecha futura y no son visibles hasta cumplirla.';

-- -----------------------------------------------------------------------------
-- Etiquetas y relación con artículos
-- -----------------------------------------------------------------------------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),

  constraint tags_name_length_check check (
    char_length(btrim(name)) between 1 and 60
  ),
  constraint tags_slug_format_check check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint tags_slug_unique unique (slug)
);

comment on table public.tags is
  'Etiquetas transversales para clasificar notas.';

create table public.article_tags (
  article_id uuid not null
    references public.articles (id) on update cascade on delete cascade,
  tag_id uuid not null
    references public.tags (id) on update cascade on delete cascade,

  primary key (article_id, tag_id)
);

comment on table public.article_tags is
  'Relación muchos a muchos entre artículos y etiquetas.';

-- -----------------------------------------------------------------------------
-- Multimedia de artículos
-- -----------------------------------------------------------------------------

create table public.article_media (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null
    references public.articles (id) on update cascade on delete cascade,
  media_url text not null,
  media_type public.article_media_type not null,
  alt_text text,
  caption text,
  created_at timestamptz not null default now(),

  constraint article_media_url_check check (
    char_length(btrim(media_url)) between 1 and 2048
  ),
  constraint article_media_alt_text_check check (
    alt_text is null or char_length(alt_text) <= 300
  ),
  constraint article_media_caption_check check (
    caption is null or char_length(caption) <= 500
  )
);

comment on table public.article_media is
  'Metadatos de archivos asociados a una nota. Los objetos viven en Supabase Storage.';

-- -----------------------------------------------------------------------------
-- Comentarios de lectores
-- -----------------------------------------------------------------------------

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null
    references public.articles (id) on update cascade on delete cascade,
  author_name text not null,
  author_email text not null,
  content text not null,
  status public.comment_status not null default 'pending',
  moderated_by uuid
    references public.profiles (id) on update cascade on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),

  constraint comments_author_name_length_check check (
    char_length(btrim(author_name)) between 1 and 100
  ),
  constraint comments_author_email_format_check check (
    author_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  constraint comments_content_length_check check (
    char_length(btrim(content)) between 1 and 5000
  ),
  constraint comments_moderation_state_check check (
    (status = 'pending' and moderated_at is null)
    or (status <> 'pending' and moderated_at is not null)
  )
);

comment on table public.comments is
  'Comentarios de lectores. Todo comentario nuevo queda pendiente hasta la moderación.';
comment on column public.comments.author_email is
  'Dato privado de contacto. No debe incluirse en consultas ni respuestas públicas.';

-- -----------------------------------------------------------------------------
-- Transmisiones en vivo
-- -----------------------------------------------------------------------------

create table public.live_streams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  facebook_url text,
  embed_url text,
  status public.live_stream_status not null default 'scheduled',
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid
    references public.profiles (id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint live_streams_title_length_check check (
    char_length(btrim(title)) between 3 and 200
  ),
  constraint live_streams_description_length_check check (
    description is null or char_length(description) <= 2000
  ),
  constraint live_streams_facebook_url_check check (
    facebook_url is null or char_length(facebook_url) between 8 and 2048
  ),
  constraint live_streams_embed_url_check check (
    embed_url is null or char_length(embed_url) between 8 and 2048
  ),
  constraint live_streams_dates_check check (
    finished_at is null or started_at is null or finished_at >= started_at
  )
);

comment on table public.live_streams is
  'Transmisiones oficiales del portal. Los enlaces serán verificados antes de publicarse.';

-- -----------------------------------------------------------------------------
-- Publicidad
-- -----------------------------------------------------------------------------

create table public.advertisements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  advertiser_name text not null,
  image_url text not null,
  target_url text not null,
  placement text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint advertisements_title_length_check check (
    char_length(btrim(title)) between 1 and 150
  ),
  constraint advertisements_advertiser_length_check check (
    char_length(btrim(advertiser_name)) between 1 and 150
  ),
  constraint advertisements_image_url_check check (
    char_length(btrim(image_url)) between 1 and 2048
  ),
  constraint advertisements_target_url_check check (
    char_length(btrim(target_url)) between 1 and 2048
  ),
  constraint advertisements_placement_check check (
    char_length(btrim(placement)) between 1 and 80
  ),
  constraint advertisements_dates_check check (end_date >= start_date)
);

comment on table public.advertisements is
  'Campañas publicitarias. Solo se muestran las activas dentro de su ventana de fechas.';

-- -----------------------------------------------------------------------------
-- Configuración del portal
-- -----------------------------------------------------------------------------

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),

  constraint site_settings_key_format_check check (
    setting_key ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'
  ),
  constraint site_settings_key_unique unique (setting_key)
);

comment on table public.site_settings is
  'Configuración general. Puede contener valores internos; no se expone completa al público.';

-- -----------------------------------------------------------------------------
-- Visualizaciones
-- -----------------------------------------------------------------------------

create table public.article_views (
  id bigint generated always as identity primary key,
  article_id uuid not null
    references public.articles (id) on update cascade on delete cascade,
  viewed_at timestamptz not null default now()
);

comment on table public.article_views is
  'Registro de visualizaciones. La escritura se realizará mediante un proceso controlado en la Fase 3.';

-- -----------------------------------------------------------------------------
-- Auditoría administrativa
-- -----------------------------------------------------------------------------

create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid
    references public.profiles (id) on update cascade on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint audit_logs_action_check check (
    char_length(btrim(action)) between 1 and 80
  ),
  constraint audit_logs_entity_type_check check (
    char_length(btrim(entity_type)) between 1 and 80
  ),
  constraint audit_logs_entity_id_check check (
    entity_id is null or char_length(entity_id) <= 120
  )
);

comment on table public.audit_logs is
  'Registro append-only de acciones administrativas. No se modifica desde el cliente.';

-- -----------------------------------------------------------------------------
-- Índices para listados, filtros y búsqueda
-- -----------------------------------------------------------------------------

create index profiles_role_idx on public.profiles (role);

create index categories_name_idx on public.categories (name);

create unique index tags_name_lower_idx on public.tags (lower(name));

create index articles_status_published_at_idx
  on public.articles (status, published_at desc);
create index articles_category_published_at_idx
  on public.articles (category_id, published_at desc)
  where status = 'published';
create index articles_author_idx on public.articles (author_id);
create index articles_featured_idx
  on public.articles (published_at desc)
  where status = 'published' and is_featured;
create index articles_breaking_idx
  on public.articles (published_at desc)
  where status = 'published' and is_breaking;
create index articles_search_vector_idx
  on public.articles using gin (search_vector);

create index article_tags_tag_idx on public.article_tags (tag_id);

create index article_media_article_idx
  on public.article_media (article_id, created_at);

create index comments_article_approved_idx
  on public.comments (article_id, created_at desc)
  where status = 'approved';
create index comments_status_created_at_idx
  on public.comments (status, created_at desc);
create index comments_moderated_by_idx on public.comments (moderated_by);

create index live_streams_status_scheduled_at_idx
  on public.live_streams (status, scheduled_at desc);
create index live_streams_created_by_idx on public.live_streams (created_by);

create index advertisements_window_idx
  on public.advertisements (placement, start_date, end_date)
  where is_active;
create index advertisements_active_idx on public.advertisements (is_active);

create index article_views_article_viewed_at_idx
  on public.article_views (article_id, viewed_at desc);
create index article_views_viewed_at_idx on public.article_views (viewed_at desc);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_user_id_idx on public.audit_logs (user_id);
create index audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);
