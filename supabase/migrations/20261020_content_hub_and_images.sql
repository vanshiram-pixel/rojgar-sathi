-- Rojgar Sathi content hub: verified scholarships, government schemes, admissions and exam updates.
-- Run once in Supabase SQL Editor after the existing portal category migrations.

alter table public.jobs
  add column if not exists image_url text not null default '';

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content_type text not null check (content_type in ('scholarship','scheme','admission','university_update','admit_card','result','answer_key','exam_update','employment_update')),
  government_level text not null default 'central' check (government_level in ('central','state','university','district','private')),
  state_name text not null default '',
  department text not null default '',
  summary text not null default '',
  body text not null default '',
  eligibility text not null default '',
  benefits text not null default '',
  required_documents text not null default '',
  application_start date,
  application_end date,
  official_url text not null default '',
  notification_url text not null default '',
  image_url text not null default '',
  category_slugs text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_type_status_idx
  on public.content_items (content_type, status, created_at desc);
create index if not exists content_items_level_state_idx
  on public.content_items (government_level, state_name, status);
create index if not exists content_items_dates_idx
  on public.content_items (application_end);
create index if not exists content_items_category_slugs_gin_idx
  on public.content_items using gin (category_slugs);

alter table public.content_items enable row level security;
drop policy if exists "public read published content items" on public.content_items;
create policy "public read published content items" on public.content_items
  for select to anon, authenticated using (status = 'published' or public.is_site_admin());
drop policy if exists "admins insert content items" on public.content_items;
create policy "admins insert content items" on public.content_items
  for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admins update content items" on public.content_items;
create policy "admins update content items" on public.content_items
  for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins delete content items" on public.content_items;
create policy "admins delete content items" on public.content_items
  for delete to authenticated using (public.is_site_admin());

insert into public.portal_categories (name, slug, category_type, description, parent_slug, sort_order, is_active)
values
  ('Scholarships & Student Aid', 'scholarship', 'education', 'छात्रवृत्ति, फीस सहायता और विद्यार्थी लाभ की सत्यापित सूचनाएँ', '', 10, true),
  ('Government Schemes', 'government-schemes', 'scheme', 'केंद्र और राज्य सरकार की योजनाएँ, पात्रता, लाभ और आवेदन लिंक', '', 11, true),
  ('Admissions', 'admissions', 'education', 'कॉलेज, विश्वविद्यालय और अन्य प्रवेश सूचनाएँ', '', 12, true),
  ('University Updates', 'university-updates', 'education', 'विश्वविद्यालय, कॉलेज, परीक्षा और परिणाम अपडेट', '', 13, true),
  ('Exam Updates', 'exam-updates', 'exam', 'परीक्षा तिथि, कैलेंडर और आधिकारिक परीक्षा सूचनाएँ', '', 14, true)
on conflict (slug) do update set
  name = excluded.name,
  category_type = excluded.category_type,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

-- Public image reads; uploads are restricted to authenticated site admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content-images', 'content-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "public read content images" on storage.objects;
create policy "public read content images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'content-images');
drop policy if exists "admins upload content images" on storage.objects;
create policy "admins upload content images" on storage.objects
  for insert to authenticated with check (bucket_id = 'content-images' and public.is_site_admin());
drop policy if exists "admins update content images" on storage.objects;
create policy "admins update content images" on storage.objects
  for update to authenticated using (bucket_id = 'content-images' and public.is_site_admin())
  with check (bucket_id = 'content-images' and public.is_site_admin());
drop policy if exists "admins delete content images" on storage.objects;
create policy "admins delete content images" on storage.objects
  for delete to authenticated using (bucket_id = 'content-images' and public.is_site_admin());
