-- Fase 4: búsqueda pública completa y envío público seguro de comentarios.
-- La columna search_vector original se conserva para evitar cambios destructivos.

alter table public.comments
  alter column author_email drop not null;

alter table public.comments
  drop constraint if exists comments_author_email_format_check;

alter table public.comments
  add constraint comments_author_email_format_check check (
    author_email is null or author_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  );

alter table public.articles
  add column if not exists search_vector_phase4 tsvector;

create or replace function public.refresh_article_search_vector_phase4()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_vector_phase4 :=
    setweight(to_tsvector('spanish'::regconfig, coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('spanish'::regconfig, coalesce(new.subtitle, '')), 'B') ||
    setweight(to_tsvector('spanish'::regconfig, coalesce(new.excerpt, '')), 'C') ||
    setweight(to_tsvector('spanish'::regconfig, coalesce(new.content, '')), 'D');
  return new;
end;
$$;

drop trigger if exists refresh_article_search_vector_phase4 on public.articles;
create trigger refresh_article_search_vector_phase4
  before insert or update of title, subtitle, excerpt, content
  on public.articles
  for each row execute function public.refresh_article_search_vector_phase4();

update public.articles
set search_vector_phase4 =
  setweight(to_tsvector('spanish'::regconfig, coalesce(title, '')), 'A') ||
  setweight(to_tsvector('spanish'::regconfig, coalesce(subtitle, '')), 'B') ||
  setweight(to_tsvector('spanish'::regconfig, coalesce(excerpt, '')), 'C') ||
  setweight(to_tsvector('spanish'::regconfig, coalesce(content, '')), 'D');

create index if not exists articles_search_vector_phase4_idx
  on public.articles using gin (search_vector_phase4);

create or replace function public.search_published_article_ids(
  search_query text,
  page_limit integer default 12,
  page_offset integer default 0
)
returns setof uuid
language sql
stable
set search_path = ''
as $$
  select article.id
  from public.articles as article
  left join public.categories as category on category.id = article.category_id
  where article.status = 'published'
    and article.published_at is not null
    and article.published_at <= now()
    and length(btrim(search_query)) >= 2
    and (
      article.search_vector_phase4 @@ websearch_to_tsquery('spanish'::regconfig, search_query)
      or category.name ilike '%' || btrim(search_query) || '%'
      or exists (
        select 1
        from public.article_tags as article_tag
        join public.tags as tag on tag.id = article_tag.tag_id
        where article_tag.article_id = article.id
          and (tag.name ilike '%' || btrim(search_query) || '%' or tag.slug ilike '%' || btrim(search_query) || '%')
      )
    )
  order by article.published_at desc, article.id
  limit least(greatest(coalesce(page_limit, 12), 1), 51)
  offset greatest(coalesce(page_offset, 0), 0);
$$;

comment on function public.search_published_article_ids(text, integer, integer) is
  'Busca noticias públicas en título, subtítulo, extracto, contenido, categoría y etiquetas.';

create or replace function public.submit_public_comment(
  target_article_id uuid,
  submitted_name text,
  submitted_content text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text := btrim(coalesce(submitted_name, ''));
  clean_content text := btrim(coalesce(submitted_content, ''));
  previous_comment_id uuid;
  created_comment_id uuid;
begin
  if char_length(clean_name) not between 1 and 100 then
    raise exception 'El nombre debe tener entre 1 y 100 caracteres.' using errcode = '22023';
  end if;

  if char_length(clean_content) not between 1 and 2000 then
    raise exception 'El comentario debe tener entre 1 y 2000 caracteres.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.articles as article
    where article.id = target_article_id
      and article.status = 'published'
      and article.published_at is not null
      and article.published_at <= now()
  ) then
    raise exception 'La noticia no está disponible para comentarios.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    target_article_id::text || ':' || lower(clean_name) || ':' || lower(clean_content), 0
  ));

  select comment.id into previous_comment_id
  from public.comments as comment
  where comment.article_id = target_article_id
    and lower(comment.author_name) = lower(clean_name)
    and lower(comment.content) = lower(clean_content)
    and comment.created_at >= now() - interval '2 minutes'
  order by comment.created_at desc
  limit 1;

  if previous_comment_id is not null then
    return previous_comment_id;
  end if;

  insert into public.comments (article_id, author_name, author_email, content)
  values (target_article_id, clean_name, null, clean_content)
  returning id into created_comment_id;

  return created_comment_id;
end;
$$;

comment on function public.submit_public_comment(uuid, text, text) is
  'Valida y crea comentarios pendientes sin recopilar correo; evita envíos idénticos repetidos.';

revoke insert on public.comments from anon, authenticated;
revoke all on function public.submit_public_comment(uuid, text, text) from public;
grant execute on function public.submit_public_comment(uuid, text, text) to anon, authenticated;
revoke all on function public.search_published_article_ids(text, integer, integer) from public;
grant execute on function public.search_published_article_ids(text, integer, integer) to anon, authenticated;
