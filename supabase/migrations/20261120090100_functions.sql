-- =============================================================================
-- Prensa Metapán — Fase 2
-- Funciones y triggers: perfiles, fechas, moderación, vistas y auditoría.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Utilidades generales
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Actualiza updated_at en cada modificación de fila.';

-- -----------------------------------------------------------------------------
-- Perfiles y sincronización con Supabase Auth
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Solo se admiten cuentas con correo. El registro público está deshabilitado.
  if new.email is null then
    return new;
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    'editor'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Crea el perfil editorial al registrar una cuenta en Supabase Auth. El rol inicial es siempre editor.';

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null then
    update public.profiles
    set email = new.email
    where id = new.id
      and email is distinct from new.email;
  end if;

  return new;
end;
$$;

comment on function public.sync_profile_email() is
  'Mantiene el correo del perfil alineado con auth.users.';

-- -----------------------------------------------------------------------------
-- Verificación de roles
--
-- Son SECURITY DEFINER para consultar profiles sin recursión de RLS.
-- El search_path vacío evita secuestro de objetos y la ejecución queda
-- limitada al rol authenticated desde la migración de permisos.
-- -----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

comment on function public.is_admin() is
  'Indica si el usuario autenticado tiene rol admin. Uso exclusivo en políticas y funciones protegidas.';

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'editor'
  );
$$;

comment on function public.is_editor() is
  'Indica si el usuario autenticado tiene rol editor.';

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'editor')
  );
$$;

comment on function public.is_staff() is
  'Indica si el usuario autenticado pertenece al equipo editorial.';

create or replace function public.enforce_profile_role_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    -- Las operaciones sin JWT (SQL Editor o service_role) quedan reservadas
    -- al backend. Un usuario autenticado solo puede cambiar roles si es admin.
    if auth.uid() is null then
      if coalesce(auth.role(), 'service_role') not in ('service_role', 'postgres') then
        raise exception 'No autorizado para cambiar roles.'
          using errcode = '42501';
      end if;
    elsif not public.is_admin() then
      raise exception 'Solo un administrador puede cambiar roles.'
        using errcode = '42501';
    end if;

    if old.role = 'admin' and new.role <> 'admin' then
      if (
        select count(*)
        from public.profiles
        where role = 'admin'
      ) <= 1 then
        raise exception 'No se puede degradar al último administrador.'
          using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.enforce_profile_role_rules() is
  'Impide la escalada de privilegios y la degradación del último administrador.';

create or replace function public.admin_set_user_role(
  target_user_id uuid,
  new_role public.profile_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles.'
      using errcode = '42501';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id;

  if not found then
    raise exception 'Perfil no encontrado.'
      using errcode = 'P0002';
  end if;
end;
$$;

comment on function public.admin_set_user_role(uuid, public.profile_role) is
  'RPC protegida para que un administrador cambie el rol de un perfil.';

-- -----------------------------------------------------------------------------
-- Fechas editoriales
-- -----------------------------------------------------------------------------

create or replace function public.set_article_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

comment on function public.set_article_published_at() is
  'Asigna la fecha de publicación cuando una nota pasa a publicada sin fecha explícita.';

create or replace function public.set_live_stream_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'live' and new.started_at is null then
    new.started_at := now();
  end if;

  if new.status = 'finished' and new.finished_at is null then
    new.finished_at := now();
  end if;

  return new;
end;
$$;

comment on function public.set_live_stream_timestamps() is
  'Completa las marcas de inicio y fin de una transmisión según su estado.';

-- -----------------------------------------------------------------------------
-- Moderación de comentarios
-- -----------------------------------------------------------------------------

create or replace function public.prepare_comment_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- La política RLS y los permisos de columna ya lo restringen; el trigger
  -- garantiza el estado pendiente incluso ante cambios futuros.
  new.status := 'pending';
  new.moderated_by := null;
  new.moderated_at := null;
  return new;
end;
$$;

comment on function public.prepare_comment_insert() is
  'Fuerza que todo comentario nuevo quede pendiente de moderación.';

create or replace function public.prepare_comment_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'pending' then
      new.moderated_by := null;
      new.moderated_at := null;
    else
      new.moderated_by := coalesce(auth.uid(), new.moderated_by);
      new.moderated_at := now();
    end if;
  end if;

  return new;
end;
$$;

comment on function public.prepare_comment_moderation() is
  'Registra al moderador y la fecha al aprobar, rechazar o marcar spam.';

-- -----------------------------------------------------------------------------
-- Contador de visualizaciones
-- -----------------------------------------------------------------------------

create or replace function public.sync_article_views_count()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.articles
    set views_count = views_count + 1
    where id = new.article_id;

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.articles
    set views_count = greatest(views_count - 1, 0)
    where id = old.article_id;

    return old;
  end if;

  return null;
end;
$$;

comment on function public.sync_article_views_count() is
  'Mantiene articles.views_count sincronizado con article_views.';

-- -----------------------------------------------------------------------------
-- Auditoría administrativa
--
-- Se guardan nombres de campos modificados y metadatos básicos. No se copian
-- correos, contraseñas, contenido completo ni datos personales de lectores.
-- -----------------------------------------------------------------------------

create or replace function public.record_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  row_id text;
  payload jsonb;
  changed_fields jsonb := '[]'::jsonb;
begin
  if tg_op = 'DELETE' then
    row_id := old.id::text;
    payload := jsonb_build_object('operation', 'delete');
  else
    row_id := new.id::text;
    payload := jsonb_strip_nulls(
      jsonb_build_object(
        'operation', lower(tg_op),
        'status', to_jsonb(new) ->> 'status',
        'slug', to_jsonb(new) ->> 'slug'
      )
    );
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(changed.key order by changed.key), '[]'::jsonb)
      into changed_fields
    from jsonb_each(to_jsonb(new)) as changed(key, value)
    where (to_jsonb(old) -> changed.key) is distinct from changed.value
      and changed.key in (
        'title', 'slug', 'subtitle', 'content', 'excerpt', 'featured_image',
        'status', 'role', 'is_featured', 'is_breaking', 'category_id',
        'author_id', 'published_at', 'is_active', 'start_date', 'end_date',
        'setting_key', 'scheduled_at', 'description', 'facebook_url',
        'embed_url', 'placement', 'advertiser_name', 'image_url',
        'target_url', 'full_name', 'name', 'avatar_url'
      );

    -- Los incrementos de views_count no deben generar ruido de auditoría.
    if jsonb_array_length(changed_fields) = 0 then
      return new;
    end if;
  end if;

  payload := payload || jsonb_build_object('changed_fields', changed_fields);

  insert into public.audit_logs (user_id, action, entity_type, entity_id, details)
  values (
    actor_id,
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    row_id,
    payload
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

comment on function public.record_audit_log() is
  'Registra operaciones administrativas sin almacenar datos sensibles completos.';

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_categories
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger set_updated_at_articles
  before update on public.articles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_live_streams
  before update on public.live_streams
  for each row execute function public.set_updated_at();

create trigger set_updated_at_advertisements
  before update on public.advertisements
  for each row execute function public.set_updated_at();

create trigger set_updated_at_site_settings
  before update on public.site_settings
  for each row execute function public.set_updated_at();

create trigger set_article_published_at
  before insert or update of status, published_at on public.articles
  for each row execute function public.set_article_published_at();

create trigger set_live_stream_timestamps
  before insert or update of status, started_at, finished_at on public.live_streams
  for each row execute function public.set_live_stream_timestamps();

create trigger prepare_comment_before_insert
  before insert on public.comments
  for each row execute function public.prepare_comment_insert();

create trigger prepare_comment_before_update
  before update of status on public.comments
  for each row execute function public.prepare_comment_moderation();

create trigger sync_article_views_count
  after insert or delete on public.article_views
  for each row execute function public.sync_article_views_count();

create trigger enforce_profile_role_rules
  before update of role on public.profiles
  for each row execute function public.enforce_profile_role_rules();

create trigger sync_profile_email
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

create trigger create_profile_for_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auditoría de las tablas con operaciones administrativas relevantes.
create trigger audit_profiles_changes
  after insert or update or delete on public.profiles
  for each row execute function public.record_audit_log();

create trigger audit_categories_changes
  after insert or update or delete on public.categories
  for each row execute function public.record_audit_log();

create trigger audit_articles_changes
  after insert or update or delete on public.articles
  for each row execute function public.record_audit_log();

create trigger audit_live_streams_changes
  after insert or update or delete on public.live_streams
  for each row execute function public.record_audit_log();

create trigger audit_advertisements_changes
  after insert or update or delete on public.advertisements
  for each row execute function public.record_audit_log();

create trigger audit_site_settings_changes
  after insert or update or delete on public.site_settings
  for each row execute function public.record_audit_log();
