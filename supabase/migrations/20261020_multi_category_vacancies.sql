-- Rojgar Sathi: one vacancy can appear in multiple relevant lists.
-- Run once in Supabase SQL Editor after the earlier migrations.

alter table public.jobs
  add column if not exists category_slugs text[] not null default '{}';

create index if not exists jobs_category_slugs_gin_idx
  on public.jobs using gin (category_slugs);

insert into public.portal_categories (name, slug, category_type, description, parent_slug, sort_order)
values (
  'Central Government Jobs',
  'central-government-jobs',
  'department',
  'Central government recruitment including SSC, Railway, UPSC, central ministries and national-level boards.',
  '',
  200
)
on conflict (slug) do update set
  name = excluded.name,
  category_type = excluded.category_type,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;
