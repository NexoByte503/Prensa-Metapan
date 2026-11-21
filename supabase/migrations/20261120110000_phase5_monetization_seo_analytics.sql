-- Fase 5: monetización, SEO editorial y analítica agregada.
-- Extiende tablas existentes; conserva anuncios, artículos y vistas actuales.

alter table public.articles
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists og_image text,
  add column if not exists featured_image_alt text;

alter table public.articles
  add constraint articles_seo_title_length_check
    check (seo_title is null or char_length(seo_title) <= 70),
  add constraint articles_seo_description_length_check
    check (seo_description is null or char_length(seo_description) <= 180),
  add constraint articles_featured_image_alt_length_check
    check (featured_image_alt is null or char_length(featured_image_alt) <= 300);

alter table public.advertisements
  add column if not exists priority integer not null default 0,
  add column if not exists status text not null default 'paused';

update public.advertisements
set status = case
  when not is_active then 'paused'
  when start_date > current_date then 'scheduled'
  when end_date < current_date then 'finished'
  else 'active'
end;

alter table public.advertisements
  add constraint advertisements_priority_check check (priority between 0 and 10000),
  add constraint advertisements_status_check check (status in ('draft', 'scheduled', 'active', 'paused', 'finished'));

create table public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view', 'ad_impression', 'ad_click')),
  path text not null check (char_length(path) between 1 and 500),
  article_id uuid references public.articles(id) on delete set null,
  advertisement_id uuid references public.advertisements(id) on delete set null,
  visitor_hash text not null check (char_length(visitor_hash) = 64),
  created_at timestamptz not null default now(),
  constraint analytics_event_target_check check (
    (event_type = 'page_view' and advertisement_id is null) or
    (event_type in ('ad_impression', 'ad_click') and advertisement_id is not null)
  )
);

create index analytics_events_created_type_idx on public.analytics_events (created_at, event_type);
create index analytics_events_article_created_idx on public.analytics_events (article_id, created_at desc) where article_id is not null;
create index analytics_events_ad_created_idx on public.analytics_events (advertisement_id, created_at desc) where advertisement_id is not null;
alter table public.analytics_events enable row level security;
create policy analytics_events_admin_read on public.analytics_events for select to authenticated using (public.is_admin());
revoke all on public.analytics_events from anon, authenticated;
grant select on public.analytics_events to authenticated;

create or replace function public.record_public_analytics_event(
  event_name text,
  event_path text,
  visitor_token text,
  target_article_id uuid default null,
  target_advertisement_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_path text := left(coalesce(event_path, ''), 500);
  visitor_digest text;
begin
  if public.is_staff() then return false; end if;
  if event_name not in ('page_view', 'ad_impression', 'ad_click')
     or char_length(coalesce(visitor_token, '')) not between 16 and 128
     or normalized_path !~ '^/[A-Za-z0-9/_?&=.%~-]*$' then
    return false;
  end if;
  if (event_name = 'page_view' and target_advertisement_id is not null)
     or (event_name <> 'page_view' and target_advertisement_id is null) then return false; end if;
  if target_article_id is not null and not exists (
    select 1 from public.articles a where a.id = target_article_id and a.status = 'published'
      and a.published_at <= now()
  ) then return false; end if;
  if target_advertisement_id is not null and not exists (
    select 1 from public.advertisements a where a.id = target_advertisement_id
      and a.is_active and a.status in ('active', 'scheduled') and current_date between a.start_date and a.end_date
  ) then return false; end if;

  visitor_digest := encode(extensions.digest(visitor_token, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(visitor_digest || ':' || event_name || ':' || normalized_path || ':' || coalesce(target_advertisement_id::text, ''), 0));
  if exists (
    select 1 from public.analytics_events e
    where e.visitor_hash = visitor_digest and e.event_type = event_name and e.path = normalized_path
      and e.advertisement_id is not distinct from target_advertisement_id
      and e.created_at > now() - case when event_name = 'page_view' then interval '30 minutes' when event_name = 'ad_impression' then interval '30 seconds' else interval '1 second' end
  ) then return false; end if;

  insert into public.analytics_events(event_type, path, article_id, advertisement_id, visitor_hash)
  values (event_name, normalized_path, target_article_id, target_advertisement_id, visitor_digest);
  if event_name = 'page_view' and target_article_id is not null then
    insert into public.article_views(article_id) values (target_article_id);
  end if;
  return true;
end;
$$;

create or replace function public.get_admin_site_analytics(day_count integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  safe_days integer := least(greatest(coalesce(day_count, 30), 1), 90);
  result jsonb;
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede consultar estadísticas.' using errcode = '42501'; end if;
  select jsonb_build_object(
    'total', (select count(*) from public.analytics_events e where e.event_type = 'page_view'),
    'today', (select count(*) from public.analytics_events e where e.event_type = 'page_view' and e.created_at >= date_trunc('day', now())),
    'last7', (select count(*) from public.analytics_events e where e.event_type = 'page_view' and e.created_at >= now() - interval '7 days'),
    'last30', (select count(*) from public.analytics_events e where e.event_type = 'page_view' and e.created_at >= now() - interval '30 days'),
    'uniqueVisitors', count(distinct visitor_hash) filter (where event_type = 'page_view'),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('date', d.day::date, 'value', coalesce(x.views, 0)) order by d.day)
      from generate_series(current_date - (safe_days - 1), current_date, interval '1 day') d(day)
      left join (select date_trunc('day', created_at) day, count(*) views from public.analytics_events
        where event_type = 'page_view' and created_at >= current_date - (safe_days - 1) group by 1) x on x.day = d.day), '[]'::jsonb),
    'topArticles', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select a.id, a.title, a.slug, count(e.id) views from public.analytics_events e join public.articles a on a.id=e.article_id
      where e.event_type='page_view' and e.created_at >= now() - make_interval(days => safe_days)
      group by a.id order by views desc limit 10) t), '[]'::jsonb),
    'topCategories', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select c.name, count(e.id) views from public.analytics_events e join public.articles a on a.id=e.article_id join public.categories c on c.id=a.category_id
      where e.event_type='page_view' and e.created_at >= now() - make_interval(days => safe_days)
      group by c.id order by views desc limit 8) t), '[]'::jsonb),
    'adStats', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select a.id, a.title, a.placement,
        count(*) filter (where e.event_type='ad_impression') impressions,
        count(*) filter (where e.event_type='ad_click') clicks,
        case when count(*) filter (where e.event_type='ad_impression')=0 then 0
          else round(100.0 * (count(*) filter (where e.event_type='ad_click')) / nullif(count(*) filter (where e.event_type='ad_impression'),0), 2) end ctr
      from public.advertisements a left join public.analytics_events e on e.advertisement_id=a.id and e.created_at >= now() - make_interval(days => safe_days)
      group by a.id order by impressions desc, clicks desc) t), '[]'::jsonb)
  ) into result from public.analytics_events where created_at >= current_date - (safe_days - 1);
  return result;
end;
$$;

revoke all on function public.record_public_analytics_event(text, text, text, uuid, uuid) from public;
grant execute on function public.record_public_analytics_event(text, text, text, uuid, uuid) to anon, authenticated;
revoke all on function public.get_admin_site_analytics(integer) from public, anon, authenticated;
grant execute on function public.get_admin_site_analytics(integer) to authenticated;
