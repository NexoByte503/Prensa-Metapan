-- =============================================================================
-- Prensa Metapán — Fase 2
-- Supabase Storage: buckets y políticas de acceso.
--
-- Los cuatro buckets son públicos para lectura porque alimentan el portal.
-- La escritura queda reservada al personal autenticado y la eliminación
-- únicamente al rol admin.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'article-images',
    'article-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'article-media',
    'article-media',
    true,
    52428800,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/avif',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/ogg',
      'application/pdf'
    ]
  ),
  (
    'author-avatars',
    'author-avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'advertisements',
    'advertisements',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Lectura pública de archivos editoriales
-- -----------------------------------------------------------------------------

create policy "storage_editorial_public_read"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id in (
      'article-images',
      'article-media',
      'author-avatars',
      'advertisements'
    )
  );

-- -----------------------------------------------------------------------------
-- Carga de archivos
-- -----------------------------------------------------------------------------

create policy "storage_staff_insert"
  on storage.objects for insert
  to authenticated
  with check (
    public.is_staff()
    and (
      bucket_id in ('article-images', 'article-media', 'author-avatars')
      or (bucket_id = 'advertisements' and public.is_admin())
    )
  );

-- -----------------------------------------------------------------------------
-- Actualización de archivos
-- -----------------------------------------------------------------------------

create policy "storage_staff_update"
  on storage.objects for update
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_editor()
      and bucket_id in ('article-images', 'article-media', 'author-avatars')
    )
  )
  with check (
    public.is_admin()
    or (
      public.is_editor()
      and bucket_id in ('article-images', 'article-media', 'author-avatars')
    )
  );

-- -----------------------------------------------------------------------------
-- Eliminación restringida a administradores
-- -----------------------------------------------------------------------------

create policy "storage_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    public.is_admin()
    and bucket_id in (
      'article-images',
      'article-media',
      'author-avatars',
      'advertisements'
    )
  );
