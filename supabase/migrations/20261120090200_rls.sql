-- =============================================================================
-- Prensa Metapán — Fase 2
-- Row Level Security, permisos y funciones expuestas a la API.
--
-- Principio: denegar por defecto. RLS es la barrera real; los permisos de
-- columna y las funciones protegidas añaden defensa en profundidad.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.tags enable row level security;
alter table public.article_tags enable row level security;
alter table public.article_media enable row level security;
alter table public.comments enable row level security;
alter table public.live_streams enable row level security;
alter table public.advertisements enable row level security;
alter table public.site_settings enable row level security;
alter table public.article_views enable row level security;
alter table public.audit_logs enable row level security;

-- -----------------------------------------------------------------------------
-- Profiles
-- -----------------------------------------------------------------------------

create policy profiles_select_public_authors
  on public.profiles for select
  to anon
  using (
    exists (
      select 1
      from public.articles as article
      where article.author_id = profiles.id
        and article.status = 'published'
        and article.published_at is not null
        and article.published_at <= now()
    )
  );

create policy profiles_select_own_or_staff
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.is_staff()
  );

create policy profiles_update_own_or_admin
  on public.profiles for update
  to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
  )
  with check (
    id = (select auth.uid())
    or public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------

create policy categories_public_read
  on public.categories for select
  to anon, authenticated
  using (true);

create policy categories_admin_insert
  on public.categories for insert
  to authenticated
  with check (public.is_admin());

create policy categories_admin_update
  on public.categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy categories_admin_delete
  on public.categories for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Articles
-- -----------------------------------------------------------------------------

create policy articles_public_read_published
  on public.articles for select
  to anon, authenticated
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

create policy articles_staff_read_all
  on public.articles for select
  to authenticated
  using (public.is_staff());

create policy articles_staff_insert
  on public.articles for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      public.is_editor()
      and author_id = (select auth.uid())
    )
  );

create policy articles_staff_update
  on public.articles for update
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_editor()
      and author_id = (select auth.uid())
    )
  )
  with check (
    public.is_admin()
    or (
      public.is_editor()
      and author_id = (select auth.uid())
    )
  );

create policy articles_admin_delete
  on public.articles for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Tags
-- -----------------------------------------------------------------------------

create policy tags_public_read
  on public.tags for select
  to anon, authenticated
  using (true);

create policy tags_admin_insert
  on public.tags for insert
  to authenticated
  with check (public.is_admin());

create policy tags_admin_update
  on public.tags for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy tags_admin_delete
  on public.tags for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Article tags
-- -----------------------------------------------------------------------------

create policy article_tags_public_read
  on public.article_tags for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.articles as article
      where article.id = article_tags.article_id
        and article.status = 'published'
        and article.published_at is not null
        and article.published_at <= now()
    )
  );

create policy article_tags_staff_read
  on public.article_tags for select
  to authenticated
  using (public.is_staff());

create policy article_tags_staff_insert
  on public.article_tags for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      public.is_editor()
      and exists (
        select 1
        from public.articles as article
        where article.id = article_tags.article_id
          and article.author_id = (select auth.uid())
      )
    )
  );

create policy article_tags_staff_delete
  on public.article_tags for delete
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_editor()
      and exists (
        select 1
        from public.articles as article
        where article.id = article_tags.article_id
          and article.author_id = (select auth.uid())
      )
    )
  );

-- -----------------------------------------------------------------------------
-- Article media
-- -----------------------------------------------------------------------------

create policy article_media_public_read
  on public.article_media for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.articles as article
      where article.id = article_media.article_id
        and article.status = 'published'
        and article.published_at is not null
        and article.published_at <= now()
    )
  );

create policy article_media_staff_read
  on public.article_media for select
  to authenticated
  using (public.is_staff());

create policy article_media_staff_insert
  on public.article_media for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      public.is_editor()
      and exists (
        select 1
        from public.articles as article
        where article.id = article_media.article_id
          and article.author_id = (select auth.uid())
      )
    )
  );

create policy article_media_staff_update
  on public.article_media for update
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_editor()
      and exists (
        select 1
        from public.articles as article
        where article.id = article_media.article_id
          and article.author_id = (select auth.uid())
      )
    )
  )
  with check (
    public.is_admin()
    or (
      public.is_editor()
      and exists (
        select 1
        from public.articles as article
        where article.id = article_media.article_id
          and article.author_id = (select auth.uid())
      )
    )
  );

create policy article_media_staff_delete
  on public.article_media for delete
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_editor()
      and exists (
        select 1
        from public.articles as article
        where article.id = article_media.article_id
          and article.author_id = (select auth.uid())
      )
    )
  );

-- -----------------------------------------------------------------------------
-- Comments
-- -----------------------------------------------------------------------------

create policy comments_public_read_approved
  on public.comments for select
  to anon, authenticated
  using (
    status = 'approved'
    and exists (
      select 1
      from public.articles as article
      where article.id = comments.article_id
        and article.status = 'published'
        and article.published_at is not null
        and article.published_at <= now()
    )
  );

create policy comments_staff_read_all
  on public.comments for select
  to authenticated
  using (public.is_staff());

create policy comments_public_insert_pending
  on public.comments for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and moderated_by is null
    and moderated_at is null
    and exists (
      select 1
      from public.articles as article
      where article.id = comments.article_id
        and article.status = 'published'
        and article.published_at is not null
        and article.published_at <= now()
    )
  );

create policy comments_admin_update
  on public.comments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy comments_admin_delete
  on public.comments for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Live streams
-- -----------------------------------------------------------------------------

create policy live_streams_public_read
  on public.live_streams for select
  to anon, authenticated
  using (true);

create policy live_streams_admin_insert
  on public.live_streams for insert
  to authenticated
  with check (public.is_admin());

create policy live_streams_admin_update
  on public.live_streams for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy live_streams_admin_delete
  on public.live_streams for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Advertisements
-- -----------------------------------------------------------------------------

create policy advertisements_public_read_active
  on public.advertisements for select
  to anon, authenticated
  using (
    is_active
    and current_date between start_date and end_date
  );

create policy advertisements_admin_read_all
  on public.advertisements for select
  to authenticated
  using (public.is_admin());

create policy advertisements_admin_insert
  on public.advertisements for insert
  to authenticated
  with check (public.is_admin());

create policy advertisements_admin_update
  on public.advertisements for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy advertisements_admin_delete
  on public.advertisements for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Site settings
-- -----------------------------------------------------------------------------

create policy site_settings_admin_read
  on public.site_settings for select
  to authenticated
  using (public.is_admin());

create policy site_settings_admin_insert
  on public.site_settings for insert
  to authenticated
  with check (public.is_admin());

create policy site_settings_admin_update
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy site_settings_admin_delete
  on public.site_settings for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Article views
-- -----------------------------------------------------------------------------

create policy article_views_admin_read
  on public.article_views for select
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Audit logs
-- -----------------------------------------------------------------------------

create policy audit_logs_admin_read
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- Permisos de tabla y columna
--
-- Supabase concede privilegios amplios por defecto. Se revocan y se otorga
-- únicamente lo necesario; RLS sigue filtrando las filas.
-- =============================================================================

revoke all on table
  public.profiles,
  public.categories,
  public.articles,
  public.tags,
  public.article_tags,
  public.article_media,
  public.comments,
  public.live_streams,
  public.advertisements,
  public.site_settings,
  public.article_views,
  public.audit_logs
from anon, authenticated;

-- Profiles: el público solo ve autores de notas publicadas y columnas seguras.
grant select (id, full_name, avatar_url) on public.profiles to anon;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- Contenido editorial.
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

grant select on public.tags to anon, authenticated;
grant insert, update, delete on public.tags to authenticated;

grant select on public.article_tags to anon, authenticated;
grant insert, delete on public.article_tags to authenticated;

grant select on public.article_media to anon, authenticated;
grant insert, update, delete on public.article_media to authenticated;

-- Comments: el correo del lector no se concede al rol anónimo.
grant select (id, article_id, author_name, content, status, created_at)
  on public.comments to anon;
grant insert (article_id, author_name, author_email, content)
  on public.comments to anon, authenticated;
grant select on public.comments to authenticated;
grant update (status, moderated_by, moderated_at) on public.comments to authenticated;
grant delete on public.comments to authenticated;

grant select on public.live_streams to anon, authenticated;
grant insert, update, delete on public.live_streams to authenticated;

grant select on public.advertisements to anon, authenticated;
grant insert, update, delete on public.advertisements to authenticated;

grant select, insert, update, delete on public.site_settings to authenticated;

grant select on public.article_views to authenticated;

grant select on public.audit_logs to authenticated;

-- =============================================================================
-- Permisos de funciones
-- =============================================================================

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_profile_email() from public, anon, authenticated;
revoke all on function public.enforce_profile_role_rules() from public, anon, authenticated;
revoke all on function public.set_article_published_at() from public, anon, authenticated;
revoke all on function public.set_live_stream_timestamps() from public, anon, authenticated;
revoke all on function public.prepare_comment_insert() from public, anon, authenticated;
revoke all on function public.prepare_comment_moderation() from public, anon, authenticated;
revoke all on function public.sync_article_views_count() from public, anon, authenticated;
revoke all on function public.record_audit_log() from public, anon, authenticated;

revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.is_editor() from public, anon, authenticated;
revoke all on function public.is_staff() from public, anon, authenticated;
revoke all on function public.admin_set_user_role(uuid, public.profile_role)
  from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_editor() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.profile_role)
  to authenticated;
