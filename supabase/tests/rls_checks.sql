-- =============================================================================
-- Pruebas de Row Level Security — Prensa Metapán
--
-- Uso local:
--   docker exec -i supabase_db_Prensa-Metapan psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < supabase/tests/rls_checks.sql
--
-- O con Supabase CLI:
--   npx supabase test db
--
-- Todo ocurre dentro de una transacción y termina en ROLLBACK. No deja
-- usuarios, artículos ni comentarios de prueba en la base de datos.
-- =============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

-- -----------------------------------------------------------------------------
-- Infraestructura
-- -----------------------------------------------------------------------------

select is(
  (
    select count(*)
    from pg_tables
    where schemaname = 'public'
      and rowsecurity = true
  ),
  13::bigint,
  'RLS está habilitado en las 13 tablas públicas'
);

select is(
  (
    select count(*)
    from storage.buckets
    where id in ('article-images', 'article-media', 'author-avatars', 'advertisements')
  ),
  4::bigint,
  'Los cuatro buckets de Storage existen'
);

select is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and policyname like 'storage_%'
  ),
  4::bigint,
  'Las cuatro políticas de Storage existen'
);

select is(
  (select count(*) from public.categories),
  8::bigint,
  'Las ocho categorías iniciales fueron sembradas'
);

-- -----------------------------------------------------------------------------
-- Fixtures (ejecutados como postgres, sin JWT)
-- -----------------------------------------------------------------------------

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'admin@prensa.test',
    extensions.crypt('PruebaAdmin2026!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin Prueba"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'editor@prensa.test',
    extensions.crypt('PruebaEditor2026!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Editor Prueba"}'::jsonb,
    now(),
    now()
  );

update public.profiles
set role = 'admin'
where id = '11111111-1111-4111-8111-111111111111';

-- La prueba del "último administrador" necesita un único admin. Cualquier
-- administrador preexistente en la base local se degrada dentro de esta
-- transacción y se restaura con el ROLLBACK final. No ejecutar en producción.
update public.profiles
set role = 'editor'
where role = 'admin'
  and id <> '11111111-1111-4111-8111-111111111111';

insert into public.articles (
  id,
  title,
  slug,
  subtitle,
  content,
  excerpt,
  category_id,
  author_id,
  status,
  is_featured,
  is_breaking,
  published_at
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Nota publicada de prueba',
    'nota-publicada',
    'Subtítulo de prueba',
    'Contenido de la nota publicada.',
    'Extracto de la nota publicada.',
    (select id from public.categories where slug = 'metapan'),
    '11111111-1111-4111-8111-111111111111',
    'published',
    true,
    false,
    now() - interval '1 hour'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Borrador del editor',
    'nota-borrador',
    null,
    'Contenido del borrador.',
    null,
    (select id from public.categories where slug = 'metapan'),
    '22222222-2222-4222-8222-222222222222',
    'draft',
    false,
    false,
    null
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Nota programada de prueba',
    'nota-programada',
    null,
    'Contenido de la nota programada.',
    null,
    (select id from public.categories where slug = 'nacionales'),
    '11111111-1111-4111-8111-111111111111',
    'published',
    false,
    true,
    now() + interval '1 day'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'Nota archivada de prueba',
    'nota-archivada',
    null,
    'Contenido de la nota archivada.',
    null,
    (select id from public.categories where slug = 'nacionales'),
    '22222222-2222-4222-8222-222222222222',
    'archived',
    false,
    false,
    now() - interval '2 days'
  );

insert into public.tags (id, name, slug)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Nacional', 'nacional'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'Borrador', 'borrador');

insert into public.article_tags (article_id, tag_id)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'ffffffff-ffff-4fff-8fff-ffffffffffff'
  );

insert into public.article_media (
  id,
  article_id,
  media_url,
  media_type,
  alt_text
)
values
  (
    '12345678-1234-4123-8123-123456789abc',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '/media/publicada.jpg',
    'image',
    'Imagen de la nota publicada'
  ),
  (
    '87654321-4321-4321-8321-cba987654321',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '/media/borrador.jpg',
    'image',
    'Imagen del borrador'
  );

insert into public.comments (article_id, author_name, author_email, content)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Comentario pendiente',
    'pendiente@example.com',
    'Comentario pendiente de moderación.'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Comentario aprobado',
    'aprobado@example.com',
    'Comentario aprobado visible.'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Comentario en borrador',
    'borrador@example.com',
    'Comentario aprobado en un borrador.'
  );

update public.comments
set status = 'approved'
where author_email in ('aprobado@example.com', 'borrador@example.com');

insert into public.advertisements (
  id,
  title,
  advertiser_name,
  image_url,
  target_url,
  placement,
  start_date,
  end_date,
  is_active
)
values
  (
    '11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Anuncio activo',
    'Anunciante Activo',
    '/anuncios/activo.jpg',
    '/destino-activo',
    'home_leaderboard',
    current_date - 1,
    current_date + 1,
    true
  ),
  (
    '22222222-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Anuncio vencido',
    'Anunciante Vencido',
    '/anuncios/vencido.jpg',
    '/destino-vencido',
    'home_leaderboard',
    current_date - 10,
    current_date - 5,
    true
  ),
  (
    '33333333-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Anuncio inactivo',
    'Anunciante Inactivo',
    '/anuncios/inactivo.jpg',
    '/destino-inactivo',
    'home_leaderboard',
    current_date - 1,
    current_date + 1,
    false
  );

insert into public.article_views (article_id)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select is(
  (
    select views_count
    from public.articles
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  1::bigint,
  'El trigger mantiene views_count sincronizado'
);

select ok(
  not has_column_privilege('anon', 'public.comments', 'author_email', 'SELECT'),
  'El rol anónimo no puede leer el correo de los lectores'
);

select ok(
  not has_column_privilege('anon', 'public.profiles', 'email', 'SELECT'),
  'El rol anónimo no puede leer el correo de los perfiles'
);

-- -----------------------------------------------------------------------------
-- Visitante anónimo
-- -----------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;

select is(
  (select count(*) from public.articles),
  1::bigint,
  'El visitante solo ve la nota publicada y vigente'
);

select is(
  (select slug from public.articles limit 1),
  'nota-publicada',
  'El visitante no ve borradores, programadas ni archivadas'
);

select is(
  (select count(*) from public.profiles),
  1::bigint,
  'El visitante solo ve el autor de una nota publicada'
);

select is(
  (select full_name from public.profiles limit 1),
  'Admin Prueba',
  'El visitante ve el nombre del autor público'
);

select is(
  (select count(*) from public.comments),
  1::bigint,
  'El visitante solo ve comentarios aprobados de notas publicadas'
);

select is(
  (select count(*) from public.article_media),
  1::bigint,
  'El visitante no ve multimedia de borradores'
);

select is(
  (select count(*) from public.article_tags),
  1::bigint,
  'El visitante no ve etiquetas de borradores'
);

select is(
  (select count(*) from public.advertisements),
  1::bigint,
  'El visitante solo ve publicidad activa dentro de fechas'
);

select throws_ok(
  $$ select author_email from public.comments limit 1 $$,
  '42501',
  null,
  'El visitante no puede consultar el correo de los comentarios'
);

select throws_ok(
  $$ select email from public.profiles limit 1 $$,
  '42501',
  null,
  'El visitante no puede consultar el correo de los perfiles'
);

select throws_ok(
  $$ select * from public.article_views $$,
  '42501',
  null,
  'El visitante no puede leer el registro de visualizaciones'
);

select throws_ok(
  $$ insert into public.article_views (article_id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') $$,
  '42501',
  null,
  'El visitante no puede escribir visualizaciones directamente'
);

select lives_ok(
  $$
    select public.submit_public_comment(
      (select id from public.articles where slug = 'nota-publicada'),
      'Lector Público',
      'Comentario pendiente'
    )
  $$,
  'El visitante puede enviar un comentario a una nota publicada'
);

select throws_ok(
  $$ insert into public.comments (article_id, author_name, content)
     select id, 'Lector', 'Intento' from public.articles where slug = 'nota-publicada' $$,
  '42501',
  null,
  'El visitante no puede aprobar su propio comentario'
);

select throws_ok(
  $$ update public.comments set status = 'approved' $$,
  '42501',
  null,
  'El visitante no puede moderar comentarios'
);

select throws_ok(
  $$ select * from public.audit_logs $$,
  '42501',
  null,
  'El visitante no puede leer la auditoría'
);

select throws_ok(
  $$ select * from public.analytics_events $$,
  '42501',
  null,
  'El visitante no puede leer eventos internos de analítica'
);

select throws_ok(
  $$ select public.get_admin_site_analytics(7) $$,
  '42501',
  null,
  'El visitante no puede consultar estadísticas administrativas'
);

select lives_ok(
  $$ select public.record_public_analytics_event('page_view', '/prueba-analitica', 'visitor-token-test-2026-abcdef') $$,
  'El visitante puede registrar una visita con identificador seudónimo'
);

select throws_ok(
  $$ select * from public.site_settings $$,
  '42501',
  null,
  'El visitante no puede leer la configuración interna'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);

select is(
  (
    select status::text
    from public.comments
    where author_name = 'Lector Público' and content = 'Comentario pendiente'
  ),
  'pending',
  'El envío público crea comentarios pendientes sin recopilar correo'
);

-- -----------------------------------------------------------------------------
-- Editor
-- -----------------------------------------------------------------------------

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-4222-8222-222222222222',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(
  (select count(*) from public.articles),
  4::bigint,
  'El editor puede consultar todos los estados editoriales'
);

select lives_ok(
  $$
    insert into public.articles (title, slug, category_id, author_id)
    select
      'Borrador propio del editor',
      'borrador-propio-editor',
      id,
      '22222222-2222-4222-8222-222222222222'
    from public.categories
    where slug = 'metapan'
  $$,
  'El editor puede crear un borrador propio'
);

select throws_ok(
  $$
    insert into public.articles (title, slug, category_id, author_id)
    select
      'Intento de autor ajeno',
      'intento-autor-ajeno',
      id,
      '11111111-1111-4111-8111-111111111111'
    from public.categories
    where slug = 'metapan'
  $$,
  '42501',
  null,
  'El editor no puede crear notas a nombre de otro autor'
);

select lives_ok(
  $$ update public.articles set title = 'Borrador actualizado' where slug = 'nota-borrador' $$,
  'El editor puede editar su propio borrador'
);

select throws_ok(
  $$
    update public.articles
    set author_id = '11111111-1111-4111-8111-111111111111'
    where slug = 'nota-borrador'
  $$,
  '42501',
  null,
  'El editor no puede transferir la autoría de su nota'
);

select lives_ok(
  $$ delete from public.articles where slug = 'nota-borrador' $$,
  'La sentencia de borrado del editor se ejecuta sin privilegios suficientes'
);

select is(
  (
    select count(*)
    from public.articles
    where slug = 'nota-borrador'
  ),
  1::bigint,
  'El editor no puede eliminar artículos'
);

select lives_ok(
  $$ update public.categories set name = 'Categoría alterada' where slug = 'metapan' $$,
  'La sentencia de actualización del editor se ejecuta sin privilegios suficientes'
);

select is(
  (
    select name
    from public.categories
    where slug = 'metapan'
  ),
  'Metapán',
  'El editor no puede modificar categorías'
);

select is(
  (select count(*) from public.audit_logs),
  0::bigint,
  'El editor no puede consultar la auditoría'
);

select is(
  (select count(*) from public.site_settings),
  0::bigint,
  'El editor no puede consultar la configuración interna'
);

select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222' $$,
  '42501',
  null,
  'El editor no puede cambiar su propio rol directamente'
);

select throws_ok(
  $$ select public.admin_set_user_role('22222222-2222-4222-8222-222222222222', 'admin') $$,
  '42501',
  null,
  'El editor no puede invocar la RPC de cambio de rol'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);

-- -----------------------------------------------------------------------------
-- Administrador
-- -----------------------------------------------------------------------------

select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select ok(
  (select count(*) from public.audit_logs) > 0,
  'El administrador puede consultar la auditoría'
);

select lives_ok(
  $$ insert into public.categories (name, slug) values ('Prueba', 'prueba') $$,
  'El administrador puede crear categorías'
);

select throws_ok(
  $$ select public.admin_set_user_role('11111111-1111-4111-8111-111111111111', 'editor') $$,
  '42501',
  null,
  'No se puede degradar al último administrador'
);

select lives_ok(
  $$ select public.admin_set_user_role('22222222-2222-4222-8222-222222222222', 'admin') $$,
  'El administrador puede promover a otro usuario'
);

select lives_ok(
  $$ select public.get_admin_site_analytics(7) $$,
  'El administrador puede consultar métricas agregadas'
);

select is(
  (
    select role::text
    from public.profiles
    where id = '22222222-2222-4222-8222-222222222222'
  ),
  'admin',
  'El cambio de rol quedó aplicado'
);

select lives_ok(
  $$
    update public.comments
    set status = 'approved'
    where author_name = 'Lector Público' and content = 'Comentario pendiente'
  $$,
  'El administrador puede aprobar comentarios'
);

select is(
  (
    select status::text
    from public.comments
    where author_name = 'Lector Público' and content = 'Comentario pendiente'
  ),
  'approved',
  'El comentario quedó aprobado'
);

select is(
  (
    select moderated_by
    from public.comments
    where author_email = 'lector-publico@example.com'
  ),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'La moderación registra al administrador que la realizó'
);

select lives_ok(
  $$
    insert into public.site_settings (setting_key, setting_value)
    values ('site.name', '"Prensa Metapán"'::jsonb)
  $$,
  'El administrador puede crear configuración interna'
);

select ok(
  public.is_admin(),
  'La función is_admin reconoce al administrador'
);

select ok(
  not public.is_editor(),
  'La función is_editor no se activa para el administrador'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);

select * from finish();

rollback;
