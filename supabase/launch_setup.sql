-- Rojgar Sathi — one-time Supabase database setup
-- Run this entire file in Supabase Dashboard > SQL Editor > New query.
-- It combines schema.sql followed by the production-readiness migration.
-- Re-running is intended to be safe for the objects managed by these scripts.

-- ==================== BASE SCHEMA ====================

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null default 'Updated Rojgar',
  tagline text not null default 'सरकारी नौकरी और करियर की सही जानकारी',
  logo_url text not null default '',
  favicon_url text not null default '',
  splash_image_url text not null default '',
  splash_title text not null default 'Updated Rojgar',
  splash_subtitle text not null default 'आपके भविष्य की सही शुरुआत',
  primary_color text not null default '#155eef',
  accent_color text not null default '#12b981',
  background_color text not null default '#f5f7fb',
  theme_mode text not null default 'light' check (theme_mode in ('light','dark','system')),
  font_family text not null default 'system',
  layout_preset text not null default 'modern' check (layout_preset in ('modern','compact','editorial')),
  home_hero_title text not null default 'अपनी अगली नौकरी यहाँ खोजें',
  home_hero_subtitle text not null default 'सरकारी भर्ती, एडमिट कार्ड, रिजल्ट और छात्रवृत्ति अपडेट',
  show_latest_jobs boolean not null default true,
  show_admission boolean not null default true,
  show_scholarships boolean not null default true,
  show_schemes boolean not null default true,
  navigation jsonb not null default '[{"label":"सरकारी नौकरी","href":"/jobs"},{"label":"एडमिट कार्ड","href":"/category/admit-card"},{"label":"रिजल्ट","href":"/category/result"},{"label":"स्कॉलरशिप","href":"/category/scholarship"}]'::jsonb,
  seo_title text not null default 'Updated Rojgar | सरकारी नौकरी',
  seo_description text not null default 'सरकारी नौकरी, भर्ती, एडमिट कार्ड, रिजल्ट और स्कॉलरशिप की जानकारी।',
  ads_enabled boolean not null default false,
  adsense_client text not null default '',
  ad_slot_home text not null default '',
  ad_slot_job text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null default '',
  category text not null default 'सरकारी नौकरी',
  location text not null default 'भारत',
  vacancies text not null default '',
  qualification text not null default '',
  application_start date,
  application_end date,
  exam_date date,
  official_url text not null default '',
  notification_url text not null default '',
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_status_date_idx on public.jobs(status, application_end desc);
create index if not exists jobs_category_idx on public.jobs(category);

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.jobs enable row level security;

create or replace function public.is_site_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;

drop policy if exists "admins read own admin record" on public.admin_users;
create policy "admins read own admin record" on public.admin_users for select to authenticated using (user_id = auth.uid());
drop policy if exists "public can read site settings" on public.site_settings;
create policy "public can read site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "admins update site settings" on public.site_settings;
create policy "admins update site settings" on public.site_settings for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins insert site settings" on public.site_settings;
create policy "admins insert site settings" on public.site_settings for insert to authenticated with check (public.is_site_admin());

drop policy if exists "public read published jobs" on public.jobs;
create policy "public read published jobs" on public.jobs for select to anon, authenticated using (status = 'published' or public.is_site_admin());
drop policy if exists "admins insert jobs" on public.jobs;
create policy "admins insert jobs" on public.jobs for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admins update jobs" on public.jobs;
create policy "admins update jobs" on public.jobs for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins delete jobs" on public.jobs;
create policy "admins delete jobs" on public.jobs for delete to authenticated using (public.is_site_admin());

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists jobs_touch_updated_at on public.jobs;
create trigger jobs_touch_updated_at before update on public.jobs for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch_updated_at on public.site_settings;
create trigger settings_touch_updated_at before update on public.site_settings for each row execute function public.touch_updated_at();

-- Optional public storage bucket for brand assets. For production, use strict file type/size rules.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-assets','brand-assets',true,5242880,array['image/png','image/jpeg','image/webp','image/svg+xml','image/x-icon'])
on conflict (id) do nothing;
drop policy if exists "public read brand assets" on storage.objects;
create policy "public read brand assets" on storage.objects for select using (bucket_id = 'brand-assets');
drop policy if exists "admins upload brand assets" on storage.objects;
create policy "admins upload brand assets" on storage.objects for insert to authenticated with check (bucket_id = 'brand-assets' and public.is_site_admin());
drop policy if exists "admins update brand assets" on storage.objects;
create policy "admins update brand assets" on storage.objects for update to authenticated using (bucket_id = 'brand-assets' and public.is_site_admin()) with check (bucket_id = 'brand-assets' and public.is_site_admin());
drop policy if exists "admins delete brand assets" on storage.objects;
create policy "admins delete brand assets" on storage.objects for delete to authenticated using (bucket_id = 'brand-assets' and public.is_site_admin());


-- ==================== PRODUCTION READINESS MIGRATION ====================

-- Production readiness migration for Updated Rojgar.
-- Run AFTER supabase/schema.sql in the Supabase SQL Editor.
-- Safe to re-run: columns, tables, policies and buckets use IF NOT EXISTS / DROP POLICY IF EXISTS.

-- Columns already used by the application but absent from the starter schema.
alter table public.site_settings
  add column if not exists home_hero_title text not null default 'अपनी अगली नौकरी यहाँ खोजें',
  add column if not exists home_hero_subtitle text not null default 'सरकारी भर्ती, एडमिट कार्ड, रिजल्ट और छात्रवृत्ति अपडेट',
  add column if not exists show_latest_jobs boolean not null default true,
  add column if not exists show_admission boolean not null default true,
  add column if not exists show_scholarships boolean not null default true,
  add column if not exists show_schemes boolean not null default true,
  add column if not exists navigation jsonb not null default '[]'::jsonb,
  add column if not exists topbar_text text not null default 'रोज़गार, परीक्षा और छात्रवृत्ति की जानकारी',
  add column if not exists footer_text text not null default 'आवेदन से पहले आधिकारिक सूचना जाँचें।',
  add column if not exists header_style text not null default 'classic',
  add column if not exists footer_style text not null default 'columns',
  add column if not exists custom_css text not null default '',
  add column if not exists layout_preset text not null default 'modern',
  add column if not exists font_family text not null default 'system',
  add column if not exists adsense_client text not null default '',
  add column if not exists ad_slot_home text not null default '',
  add column if not exists ad_slot_job text not null default '';

alter table public.jobs
  add column if not exists department text not null default '',
  add column if not exists department_slug text not null default '',
  add column if not exists state_slug text not null default '',
  add column if not exists primary_category_slug text not null default '',
  add column if not exists recruitment_type text not null default 'सरकारी नौकरी',
  add column if not exists category_slugs text[] not null default '{}',
  add column if not exists age_limit text not null default '',
  add column if not exists application_fee text not null default '',
  add column if not exists salary text not null default '',
  add column if not exists selection_process text not null default '',
  add column if not exists valid_through date,
  add column if not exists last_verified_at timestamptz,
  add column if not exists official_source text not null default '',
  add column if not exists image_url text not null default '';

create index if not exists jobs_published_created_idx on public.jobs(status, created_at desc);
create index if not exists jobs_department_idx on public.jobs(department_slug);
create index if not exists jobs_state_idx on public.jobs(state_slug);

create table if not exists public.portal_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category_type text not null,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portal_categories_active_order_idx
  on public.portal_categories(is_active, category_type, sort_order);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content_type text not null default 'scheme',
  government_level text not null default 'central',
  state_name text not null default '',
  department text not null default '',
  department_slug text not null default '',
  state_slug text not null default '',
  primary_category_slug text not null default '',
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
create index if not exists content_items_status_date_idx on public.content_items(status, created_at desc);
create index if not exists content_items_type_idx on public.content_items(content_type);
create index if not exists content_items_state_idx on public.content_items(state_slug);

alter table public.portal_categories enable row level security;
alter table public.content_items enable row level security;

drop policy if exists "public read active portal categories" on public.portal_categories;
create policy "public read active portal categories" on public.portal_categories
  for select to anon, authenticated using (is_active = true or public.is_site_admin());
drop policy if exists "admins insert portal categories" on public.portal_categories;
create policy "admins insert portal categories" on public.portal_categories
  for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admins update portal categories" on public.portal_categories;
create policy "admins update portal categories" on public.portal_categories
  for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins delete portal categories" on public.portal_categories;
create policy "admins delete portal categories" on public.portal_categories
  for delete to authenticated using (public.is_site_admin());

drop policy if exists "public read published content" on public.content_items;
create policy "public read published content" on public.content_items
  for select to anon, authenticated using (status = 'published' or public.is_site_admin());
drop policy if exists "admins insert content" on public.content_items;
create policy "admins insert content" on public.content_items
  for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admins update content" on public.content_items;
create policy "admins update content" on public.content_items
  for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins delete content" on public.content_items;
create policy "admins delete content" on public.content_items
  for delete to authenticated using (public.is_site_admin());

drop trigger if exists portal_categories_touch_updated_at on public.portal_categories;
create trigger portal_categories_touch_updated_at before update on public.portal_categories
  for each row execute function public.touch_updated_at();
drop trigger if exists content_items_touch_updated_at on public.content_items;
create trigger content_items_touch_updated_at before update on public.content_items
  for each row execute function public.touch_updated_at();

-- The admin UI uploads update/job images to this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content-images','content-images',true,5242880,array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

drop policy if exists "public read content images" on storage.objects;
create policy "public read content images" on storage.objects
  for select using (bucket_id = 'content-images');
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

